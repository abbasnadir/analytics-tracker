from __future__ import annotations

import asyncio
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path

from app.api.client import AnalyzerApiClient
from app.config import Settings
from app.models.schemas import HistoricalSummary, RawEvent, parse_datetime
from app.processing.aggregator import EventAggregator
from app.utils.logger import setup_logging


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class WorkerState:
    state_file: Path
    last_processed_at: datetime | None = None
    seen_event_hashes: dict[str, datetime] = field(default_factory=dict)

    @classmethod
    def load(cls, state_file: Path) -> "WorkerState":
        if not state_file.exists():
            return cls(state_file=state_file)

        try:
            payload = json.loads(state_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return cls(state_file=state_file)

        last_processed = payload.get("last_processed_at")
        raw_hashes = payload.get("seen_event_hashes", {})
        seen_event_hashes = {
            fingerprint: parse_datetime(timestamp)
            for fingerprint, timestamp in raw_hashes.items()
        }
        return cls(
            state_file=state_file,
            last_processed_at=parse_datetime(last_processed) if last_processed else None,
            seen_event_hashes=seen_event_hashes,
        )

    def cursor(self, overlap_seconds: int) -> datetime | None:
        if self.last_processed_at is None:
            return None
        return self.last_processed_at - timedelta(seconds=overlap_seconds)

    def prune_seen_hashes(self, ttl_seconds: int) -> None:
        cutoff = utc_now() - timedelta(seconds=ttl_seconds)
        self.seen_event_hashes = {
            fingerprint: timestamp
            for fingerprint, timestamp in self.seen_event_hashes.items()
            if timestamp >= cutoff
        }

    def filter_new_events(self, events: list[RawEvent]) -> list[RawEvent]:
        fresh_events: list[RawEvent] = []
        for event in sorted(events, key=lambda item: item.timestamp):
            fingerprint = event.fingerprint()
            if fingerprint in self.seen_event_hashes:
                continue
            fresh_events.append(event)
        return fresh_events

    def mark_processed(self, events: list[RawEvent]) -> None:
        if not events:
            return

        newest = self.last_processed_at
        for event in events:
            self.seen_event_hashes[event.fingerprint()] = event.timestamp
            if newest is None or event.timestamp > newest:
                newest = event.timestamp

        self.last_processed_at = newest
        self.save()

    def save(self) -> None:
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "last_processed_at": (
                self.last_processed_at.astimezone(timezone.utc).isoformat()
                if self.last_processed_at
                else None
            ),
            "seen_event_hashes": {
                fingerprint: timestamp.astimezone(timezone.utc).isoformat()
                for fingerprint, timestamp in self.seen_event_hashes.items()
            },
        }
        temp_file = self.state_file.with_suffix(".tmp")
        temp_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        temp_file.replace(self.state_file)


async def process_once(
    client: AnalyzerApiClient,
    aggregator: EventAggregator,
    state: WorkerState,
    history: deque[HistoricalSummary],
    settings: Settings,
    logger,
) -> None:
    state.prune_seen_hashes(settings.dedupe_ttl_seconds)
    since = state.cursor(settings.cursor_overlap_seconds)
    events = await client.fetch_raw_events(since=since)
    new_events = state.filter_new_events(events)

    if not new_events:
        logger.info("No new events found in this polling cycle")
        return

    summary = aggregator.aggregate(
        new_events,
        generated_at=utc_now(),
        history=list(history),
    )
    await client.post_summary(summary)
    state.mark_processed(new_events)
    history.append(
        HistoricalSummary(
            timestamp=summary.timestamp,
            total_page_views=summary.total_page_views,
            total_clicks=summary.total_clicks,
            unique_sessions=summary.unique_sessions,
        )
    )
    logger.info(
        "Processed %s new events into summary key=%s",
        len(new_events),
        summary.idempotency_key,
    )


async def run_worker() -> None:
    settings = Settings.from_env()
    logger = setup_logging(settings.log_level)
    logger.info("Starting analyzer worker with poll interval=%ss", settings.poll_interval_seconds)

    state = WorkerState.load(settings.state_file)
    aggregator = EventAggregator(settings)
    history: deque[HistoricalSummary] = deque(maxlen=settings.anomaly_history_limit)

    async with AnalyzerApiClient(settings, logger) as client:
        while True:
            try:
                await process_once(client, aggregator, state, history, settings, logger)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Worker cycle failed")

            await asyncio.sleep(settings.poll_interval_seconds)


def main() -> None:
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger = setup_logging()
        logger.info("Analyzer worker stopped")


if __name__ == "__main__":
    main()
