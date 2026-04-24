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
    top_pages: list[RankedMetric] = field(default_factory=list)
    top_elements: list[RankedMetric] = field(default_factory=list)
    generated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
