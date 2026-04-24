from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
from typing import Sequence

from app.config import Settings
from app.models.schemas import HistoricalSummary, RankedElement, RankedPage, RawEvent, SummaryPayload
from app.processing.analytics import (
    build_funnel,
    calculate_bounce_rate,
    classify_user_agent,
    detect_anomalies,
    merge_user_agent_counts,
)


class EventAggregator:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def aggregate(
        self,
        events: Sequence[RawEvent],
        *,
        generated_at: datetime,
        history: Sequence[HistoricalSummary],
    ) -> SummaryPayload:
        total_page_views = 0
        total_clicks = 0
        unique_sessions: set[str] = set()
        page_counter: Counter[str] = Counter()
        element_counter: Counter[str] = Counter()
        session_event_counts: Counter[str] = Counter()
        session_navigation: dict[str, list[tuple[datetime, str]]] = defaultdict(list)
        browser_counter: Counter[str] = Counter()
        operating_system_counter: Counter[str] = Counter()
        min_timestamp: datetime | None = None
        max_timestamp: datetime | None = None

        for event in events:
            unique_sessions.add(event.session_id)
            session_event_counts[event.session_id] += 1

            if min_timestamp is None or event.timestamp < min_timestamp:
                min_timestamp = event.timestamp
            if max_timestamp is None or event.timestamp > max_timestamp:
                max_timestamp = event.timestamp

            if event.user_agent:
                browser, operating_system = classify_user_agent(event.user_agent)
                browser_counter[browser] += 1
                operating_system_counter[operating_system] += 1

            if event.url:
                session_navigation[event.session_id].append((event.timestamp, event.url))

            if event.event_type == "page_view":
                total_page_views += 1
                if event.url:
                    page_counter[event.url] += 1
            elif event.event_type == "click":
                total_clicks += 1
                element_counter[event.element.label()] += 1

        current_snapshot = HistoricalSummary(
            timestamp=generated_at.astimezone(timezone.utc),
            total_page_views=total_page_views,
            total_clicks=total_clicks,
            unique_sessions=len(unique_sessions),
        )

        return SummaryPayload(
            total_page_views=total_page_views,
            total_clicks=total_clicks,
            unique_sessions=len(unique_sessions),
            top_pages=[
                RankedPage(url=url, count=count)
                for url, count in page_counter.most_common(self._settings.top_n)
            ],
            top_elements=[
                RankedElement(element=element, count=count)
                for element, count in element_counter.most_common(self._settings.top_n)
            ],
            bounce_rate=calculate_bounce_rate(session_event_counts),
            timestamp=current_snapshot.timestamp,
            user_agents=merge_user_agent_counts(browser_counter, operating_system_counter),
            funnel=build_funnel(session_navigation, top_n=self._settings.top_n),
            anomalies=detect_anomalies(
                current_snapshot,
                history,
                page_view_threshold=self._settings.anomaly_page_view_threshold,
                click_threshold=self._settings.anomaly_click_threshold,
                spike_multiplier=self._settings.anomaly_spike_multiplier,
            ),
            window_start=min_timestamp,
            window_end=max_timestamp,
            idempotency_key=self._build_idempotency_key(events),
        )

    def _build_idempotency_key(self, events: Sequence[RawEvent]) -> str:
        digest = hashlib.sha256()
        for fingerprint in sorted(event.fingerprint() for event in events):
            digest.update(fingerprint.encode("utf-8"))
        return digest.hexdigest()
