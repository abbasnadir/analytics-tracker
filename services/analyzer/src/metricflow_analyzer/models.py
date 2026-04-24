from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(frozen=True)
class RankedMetric:
    key: str
    count: int


@dataclass(frozen=True)
class MetricSummary:
    tenant_id: str
    range_start: datetime
    range_end: datetime
    total_page_views: int
    total_clicks: int
    bounce_rate: float = 0.0
    top_pages: list[RankedMetric] = field(default_factory=list)
    top_elements: list[RankedMetric] = field(default_factory=list)
    browser_breakdown: list[RankedMetric] = field(default_factory=list)
    os_breakdown: list[RankedMetric] = field(default_factory=list)
    device_breakdown: list[RankedMetric] = field(default_factory=list)
    funnel_steps: dict[str, int] = field(default_factory=dict)
    anomalies_detected: list[str] = field(default_factory=list)
    generated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
