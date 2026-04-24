from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any

import aiohttp

from app.config import Settings
from app.models.schemas import RawEvent, SummaryPayload
from app.utils.retry import async_retry


class AnalyzerApiClient:
    def __init__(self, settings: Settings, logger: logging.Logger) -> None:
        self._settings = settings
        self._logger = logger.getChild("api")
        self._session: aiohttp.ClientSession | None = None

    async def __aenter__(self) -> "AnalyzerApiClient":
        await self.start()
        return self

    async def __aexit__(self, exc_type: object, exc: object, tb: object) -> None:
        await self.close()

    async def start(self) -> None:
        if self._session is not None:
            return

        timeout = aiohttp.ClientTimeout(total=self._settings.request_timeout_seconds)
        self._session = aiohttp.ClientSession(timeout=timeout)

    async def close(self) -> None:
        if self._session is not None:
            await self._session.close()
            self._session = None

    async def fetch_raw_events(self, since: datetime | None = None) -> list[RawEvent]:
        params: dict[str, str] = {"range": self._settings.raw_range}
        if since is not None and self._settings.use_since_cursor:
            params["since"] = since.astimezone(timezone.utc).isoformat()

        async def operation() -> list[RawEvent]:
            session = self._require_session()
            async with session.get(
                self._settings.raw_events_url,
                params=params,
                headers=self._headers(),
            ) as response:
                await self._raise_for_status(response, "fetch raw events")
                payload = await response.json()
                items = self._extract_items(payload)
                events = [RawEvent.from_dict(item) for item in items]
                self._logger.info("Fetched %s raw events", len(events))
                return events

        return await async_retry(
            operation,
            retries=self._settings.max_retries,
            base_delay=self._settings.backoff_base_seconds,
            max_delay=self._settings.backoff_max_seconds,
            logger=self._logger,
            operation_name="fetch_raw_events",
            exceptions=(aiohttp.ClientError, asyncio.TimeoutError, ValueError),
        )

    async def post_summary(self, summary: SummaryPayload) -> None:
        async def operation() -> None:
            session = self._require_session()
            headers = self._headers()
            if summary.idempotency_key:
                headers["Idempotency-Key"] = summary.idempotency_key

            async with session.post(
                self._settings.summary_url,
                json=summary.to_dict(),
                headers=headers,
            ) as response:
                await self._raise_for_status(response, "post summary")
                self._logger.info(
                    "Posted summary payload for window ending at %s",
                    summary.timestamp.astimezone(timezone.utc).isoformat(),
                )

        return await async_retry(
            operation,
            retries=self._settings.max_retries,
            base_delay=self._settings.backoff_base_seconds,
            max_delay=self._settings.backoff_max_seconds,
            logger=self._logger,
            operation_name="post_summary",
            exceptions=(aiohttp.ClientError, asyncio.TimeoutError, ValueError),
        )

    def _require_session(self) -> aiohttp.ClientSession:
        if self._session is None:
            raise RuntimeError("API client session has not been started")
        return self._session

    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if self._settings.api_token:
            headers["Authorization"] = f"Bearer {self._settings.api_token}"
        return headers

    async def _raise_for_status(
        self,
        response: aiohttp.ClientResponse,
        action: str,
    ) -> None:
        if response.status < 400:
            return

        body = await response.text()
        raise ValueError(f"Unable to {action}: status={response.status}, body={body[:500]}")

    def _extract_items(self, payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        if isinstance(payload, dict):
            for key in ("data", "events", "items", "results"):
                value = payload.get(key)
                if isinstance(value, list):
                    return [item for item in value if isinstance(item, dict)]
        raise ValueError("Unexpected raw events response shape")
