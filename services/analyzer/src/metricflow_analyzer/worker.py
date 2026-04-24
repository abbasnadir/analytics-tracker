from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

from .config import load_settings
from .client import MetricFlowBackendClient
from .metrics import build_summary


def run_cycle() -> None:
    settings = load_settings()
    client = MetricFlowBackendClient(settings)

    range_end = datetime.now(timezone.utc)
    range_start = range_end - timedelta(minutes=settings.lookback_minutes)
    payload = client.fetch_events(range_start, range_end)
    tenant_id = payload.get("tenantId", settings.api_key)
    events = payload.get("events", [])
    summary = build_summary(tenant_id, events, range_start, range_end)
    client.upload_summary(summary)

    print(
        "metricflow-analyzer summary written",
        {
            "tenantId": tenant_id,
            "pageViews": summary.total_page_views,
            "clicks": summary.total_clicks,
            "generatedAt": summary.generated_at.isoformat(),
        },
    )


def main() -> None:
    settings = load_settings()

    if settings.run_once:
        run_cycle()
        return

    while True:
        run_cycle()
        time.sleep(settings.poll_seconds)
