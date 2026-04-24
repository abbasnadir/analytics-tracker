from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from typing import Any, TypedDict


def parse_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)

    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"

    parsed = datetime.fromisoformat(normalized)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


class EventElementPayload(TypedDict, total=False):
    tag: str
    id: str
    classes: list[str]
    text: str


class RawEventPayload(TypedDict, total=False):
    event_type: str
    timestamp: str
    url: str
    session_id: str
    element: EventElementPayload
    user_agent: str


@dataclass(frozen=True)
class EventElement:
    tag: str = ""
    id: str = ""
    classes: tuple[str, ...] = ()
    text: str = ""

    @classmethod
    def from_dict(cls, payload: dict[str, Any] | None) -> "EventElement":
        if not payload:
            return cls()

        classes = payload.get("classes") or []
        if not isinstance(classes, list):
            classes = []

        return cls(
            tag=str(payload.get("tag", "") or ""),
            id=str(payload.get("id", "") or ""),
            classes=tuple(str(item) for item in classes),
            text=str(payload.get("text", "") or ""),
        )

    def label(self) -> str:
        parts: list[str] = []
        if self.tag:
            parts.append(self.tag)
        if self.id:
            parts.append(f"#{self.id}")
        if self.text:
            trimmed = " ".join(self.text.split())
            parts.append(f'"{trimmed[:80]}"')
        elif self.classes:
            parts.append("." + ".".join(self.classes[:3]))
        return " ".join(parts) if parts else "<unknown>"

    def to_dict(self) -> dict[str, Any]:
        return {
            "tag": self.tag,
            "id": self.id,
            "classes": list(self.classes),
            "text": self.text,
        }


@dataclass(frozen=True)
class RawEvent:
    event_type: str
    timestamp: datetime
    url: str
    session_id: str
    element: EventElement
    user_agent: str

    @classmethod
    def from_dict(cls, payload: RawEventPayload | dict[str, Any]) -> "RawEvent":
        return cls(
            event_type=str(payload.get("event_type", "") or "").strip(),
            timestamp=parse_datetime(payload["timestamp"]),
            url=str(payload.get("url", "") or ""),
            session_id=str(payload.get("session_id", "") or "").strip(),
            element=EventElement.from_dict(payload.get("element")),
            user_agent=str(payload.get("user_agent", "") or ""),
        )

    def fingerprint(self) -> str:
        canonical = {
            "event_type": self.event_type,
            "timestamp": self.timestamp.astimezone(timezone.utc).isoformat(),
            "url": self.url,
            "session_id": self.session_id,
            "element": self.element.to_dict(),
            "user_agent": self.user_agent,
        }
        payload = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class RankedPage:
    url: str
    count: int

    def to_dict(self) -> dict[str, Any]:
        return {"url": self.url, "count": self.count}


@dataclass(frozen=True)
class RankedElement:
    element: str
    count: int

    def to_dict(self) -> dict[str, Any]:
        return {"element": self.element, "count": self.count}


@dataclass(frozen=True)
class FunnelStep:
    from_url: str
    to_url: str
    count: int

    def to_dict(self) -> dict[str, Any]:
        return {"from": self.from_url, "to": self.to_url, "count": self.count}


@dataclass(frozen=True)
class AnomalyRecord:
    metric: str
    value: float
    threshold: float
    reason: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "metric": self.metric,
            "value": self.value,
            "threshold": self.threshold,
            "reason": self.reason,
        }


@dataclass(frozen=True)
class HistoricalSummary:
    timestamp: datetime
    total_page_views: int
    total_clicks: int
    unique_sessions: int


@dataclass(frozen=True)
class SummaryPayload:
    total_page_views: int
    total_clicks: int
    unique_sessions: int
    top_pages: list[RankedPage]
    top_elements: list[RankedElement]
    bounce_rate: float
    timestamp: datetime
    user_agents: dict[str, dict[str, int]] | None = None
    funnel: list[FunnelStep] | None = None
    anomalies: list[AnomalyRecord] | None = None
    window_start: datetime | None = None
    window_end: datetime | None = None
    idempotency_key: str | None = None

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "total_page_views": self.total_page_views,
            "total_clicks": self.total_clicks,
            "unique_sessions": self.unique_sessions,
            "top_pages": [page.to_dict() for page in self.top_pages],
            "top_elements": [element.to_dict() for element in self.top_elements],
            "bounce_rate": self.bounce_rate,
            "timestamp": self.timestamp.astimezone(timezone.utc).isoformat(),
        }

        if self.user_agents is not None:
            payload["user_agents"] = self.user_agents
        if self.funnel:
            payload["funnel"] = [step.to_dict() for step in self.funnel]
        if self.anomalies:
            payload["anomalies"] = [item.to_dict() for item in self.anomalies]
        if self.window_start is not None:
            payload["window_start"] = self.window_start.astimezone(timezone.utc).isoformat()
        if self.window_end is not None:
            payload["window_end"] = self.window_end.astimezone(timezone.utc).isoformat()
        if self.idempotency_key is not None:
            payload["idempotency_key"] = self.idempotency_key
        return payload

