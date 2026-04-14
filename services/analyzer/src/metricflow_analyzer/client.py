from __future__ import annotations

from datetime import datetime
from typing import Any

import requests

from .config import Settings
from .models import MetricSummary


class MetricFlowBackendClient:
    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.backend_url.rstrip("/")
        self.headers = {"x-api-key": settings.api_key}
        self.timeout = settings.request_timeout

    def fetch_events(self, range_start: datetime, range_end: datetime) -> dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/api/v1/analyzer/events",
            headers=self.headers,
            params={
                "start": range_start.isoformat(),
                "end": range_end.isoformat(),
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def upload_summary(self, summary: MetricSummary) -> dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/v1/analyzer/summaries",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "rangeStart": summary.range_start.isoformat(),
                "rangeEnd": summary.range_end.isoformat(),
                "totalPageViews": summary.total_page_views,
                "totalClicks": summary.total_clicks,
                "topPages": [item.__dict__ for item in summary.top_pages],
                "topElements": [item.__dict__ for item in summary.top_elements],
                "generatedAt": summary.generated_at.isoformat(),
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()
