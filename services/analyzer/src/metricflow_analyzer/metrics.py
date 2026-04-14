from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any

from .models import MetricSummary, RankedMetric


def _rank(counter: Counter[str], limit: int = 5) -> list[RankedMetric]:
    return [RankedMetric(key=key, count=count) for key, count in counter.most_common(limit)]


def build_summary(tenant_id: str, events: list[dict[str, Any]], range_start: datetime, range_end: datetime) -> MetricSummary:
    page_counter: Counter[str] = Counter()
    element_counter: Counter[str] = Counter()
    total_page_views = 0
    total_clicks = 0

    for event in events:
        event_name = event.get("eventName")

        if event_name == "page_view":
            total_page_views += 1
            page_counter[event.get("url", "unknown")] += 1

        if event_name == "click":
            total_clicks += 1
            element = event.get("element") or {}
            key = element.get("id") or element.get("text") or element.get("tagName") or "unknown"
            element_counter[key] += 1

    return MetricSummary(
        tenant_id=tenant_id,
        range_start=range_start,
        range_end=range_end,
        total_page_views=total_page_views,
        total_clicks=total_clicks,
        top_pages=_rank(page_counter),
        top_elements=_rank(element_counter),
    )
