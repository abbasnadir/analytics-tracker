from __future__ import annotations

from datetime import datetime
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .config import Settings
from .models import MetricSummary


class MetricFlowBackendClient:
    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.backend_url.rstrip("/")
        self.headers = {"x-api-key": settings.api_key}
        self.timeout = settings.request_timeout

        self.session = requests.Session()
        retry_strategy = Retry(
            total=5,
            backoff_factor=1.0,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        self.session.headers.update(self.headers)

    def fetch_events(self, range_start: datetime, range_end: datetime) -> dict[str, Any]:
        response = self.session.get(
            f"{self.base_url}/api/v1/analyzer/events",
            params={
                "start": range_start.isoformat(),
                "end": range_end.isoformat(),
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def upload_summary(self, summary: MetricSummary) -> dict[str, Any]:
        response = self.session.post(
            f"{self.base_url}/api/v1/analyzer/summaries",
            headers={"Content-Type": "application/json"},
            json={
                "rangeStart": summary.range_start.isoformat(),
                "rangeEnd": summary.range_end.isoformat(),
                "totalPageViews": summary.total_page_views,
                "totalClicks": summary.total_clicks,
                "bounceRate": summary.bounce_rate,
                "topPages": [item.__dict__ for item in summary.top_pages],
                "topElements": [item.__dict__ for item in summary.top_elements],
                "browserBreakdown": [item.__dict__ for item in summary.browser_breakdown],
                "osBreakdown": [item.__dict__ for item in summary.os_breakdown],
                "deviceBreakdown": [item.__dict__ for item in summary.device_breakdown],
                "funnelSteps": summary.funnel_steps,
                "anomaliesDetected": summary.anomalies_detected,
                "generatedAt": summary.generated_at.isoformat(),
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()
