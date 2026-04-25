from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

from user_agents import parse as parse_ua

from .models import MetricSummary, RankedMetric


def _rank(counter: Counter[str], limit: int = 5) -> list[RankedMetric]:
    return [RankedMetric(key=key, count=count) for key, count in counter.most_common(limit)]


def _safe_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)
    except ValueError:
        return None


def _path_from_event(event: dict[str, Any]) -> str:
    path = event.get("path")

    if isinstance(path, str) and path:
        return path

    url = event.get("url")
    if not isinstance(url, str) or not url:
        return "unknown"

    parsed = urlparse(url)
    return parsed.path or url


def _country_code_from_event(event: dict[str, Any]) -> str | None:
    country_code = event.get("countryCode")
    if isinstance(country_code, str) and len(country_code) == 2:
        return country_code.upper()

    time_zone = event.get("timeZone")
    if isinstance(time_zone, str):
        time_zone_to_country_code = {
            "Asia/Calcutta": "IN",
            "Asia/Dubai": "AE",
            "Asia/Hong_Kong": "HK",
            "Asia/Kolkata": "IN",
            "Asia/Seoul": "KR",
            "Asia/Singapore": "SG",
            "Asia/Tokyo": "JP",
            "Australia/Melbourne": "AU",
            "Australia/Perth": "AU",
            "Australia/Sydney": "AU",
            "Europe/Berlin": "DE",
            "Europe/London": "GB",
            "Europe/Paris": "FR",
            "Pacific/Auckland": "NZ",
        }
        inferred_country = time_zone_to_country_code.get(time_zone)
        if inferred_country:
            return inferred_country

    locale = event.get("locale")
    if not isinstance(locale, str):
        return None

    parts = locale.replace("_", "-").split("-")
    if len(parts) < 2:
        return None

    return parts[-1].upper()


def _bucket_timestamp(timestamp: datetime) -> str:
    return timestamp.replace(minute=0, second=0, microsecond=0).isoformat()


def _visitor_id_from_event(event: dict[str, Any]) -> str:
    visitor_id = event.get("visitorId")
    if isinstance(visitor_id, str) and visitor_id:
        return visitor_id

    session_id = event.get("sessionId")
    if isinstance(session_id, str) and session_id:
        return session_id

    return "unknown_visitor"


def build_summary(tenant_id: str, events: list[dict[str, Any]], range_start: datetime, range_end: datetime) -> MetricSummary:
    page_counter: Counter[str] = Counter()
    element_counter: Counter[str] = Counter()
    browser_counter: Counter[str] = Counter()
    os_counter: Counter[str] = Counter()
    device_counter: Counter[str] = Counter()
    latest_country_by_visitor: dict[str, str] = {}

    total_page_views = 0
    total_clicks = 0
    error_count = 0

    session_events: dict[str, int] = Counter()
    session_page_views: dict[str, int] = Counter()
    session_timestamps: dict[str, list[datetime]] = defaultdict(list)
    unique_visitors: set[str] = set()
    bucket_sessions: dict[str, set[str]] = defaultdict(set)
    bucket_metrics: dict[str, dict[str, int | str]] = {}

    funnel_users: dict[str, set[str]] = {
        "step_1_any_page": set(),
        "step_2_pricing": set(),
        "step_3_signup": set(),
    }

    anomalies: list[str] = []

    for event in events:
        event_name = event.get("eventName")
        session_id = str(event.get("sessionId") or "unknown_session")
        visitor_id = _visitor_id_from_event(event)
        timestamp = _safe_timestamp(event.get("timestamp"))
        path = _path_from_event(event)

        session_events[session_id] += 1
        unique_visitors.add(visitor_id)

        if timestamp:
            session_timestamps[session_id].append(timestamp)
            bucket_key = _bucket_timestamp(timestamp)
            bucket_sessions[bucket_key].add(session_id)
            bucket = bucket_metrics.setdefault(
                bucket_key,
                {
                    "ts": bucket_key,
                    "pageViews": 0,
                    "clicks": 0,
                    "sessions": 0,
                },
            )
            bucket["sessions"] = len(bucket_sessions[bucket_key])

        country_code = _country_code_from_event(event)
        if country_code:
            latest_country_by_visitor[visitor_id] = country_code

        ua_string = event.get("userAgent")
        if ua_string:
            try:
                user_agent = parse_ua(ua_string)
                browser_counter[user_agent.browser.family] += 1
                os_counter[user_agent.os.family] += 1
                if user_agent.is_mobile:
                    device_counter["Mobile"] += 1
                elif user_agent.is_tablet:
                    device_counter["Tablet"] += 1
                elif user_agent.is_pc:
                    device_counter["Desktop"] += 1
                else:
                    device_counter["Other"] += 1
            except Exception:
                pass

        if event_name == "page_view":
            total_page_views += 1
            page_counter[path] += 1
            session_page_views[session_id] += 1
            funnel_users["step_1_any_page"].add(session_id)
            if "pricing" in path.lower():
                funnel_users["step_2_pricing"].add(session_id)
            if timestamp:
                bucket_metrics[_bucket_timestamp(timestamp)]["pageViews"] += 1

        elif event_name == "click":
            total_clicks += 1
            element = event.get("element") or {}
            key = element.get("id") or element.get("text") or element.get("tagName") or "unknown"
            element_counter[str(key)] += 1
            if "sign up" in str(key).lower() or "signup" in str(key).lower():
                funnel_users["step_3_signup"].add(session_id)
            if timestamp:
                bucket_metrics[_bucket_timestamp(timestamp)]["clicks"] += 1

        elif event_name == "error":
            error_count += 1

    total_sessions = len(session_events)
    bounced_sessions = sum(
        1 for sid, total_ev in session_events.items()
        if total_ev == 1 and session_page_views.get(sid, 0) == 1
    )
    bounce_rate = (bounced_sessions / total_sessions) if total_sessions > 0 else 0.0

    session_durations = [
        max(0.0, (max(timestamps) - min(timestamps)).total_seconds())
        for timestamps in session_timestamps.values()
        if timestamps
    ]
    avg_session_duration_sec = (
        sum(session_durations) / len(session_durations) if session_durations else 0.0
    )

    if error_count > 10:
        anomalies.append(f"High number of error events detected: {error_count}")
    if total_page_views > 10000:
        anomalies.append(f"Unusual spike in traffic: {total_page_views} page views")

    timeseries = [
        {
            "ts": ts,
            "pageViews": int(point["pageViews"]),
            "clicks": int(point["clicks"]),
            "sessions": int(point["sessions"]),
        }
        for ts, point in sorted(bucket_metrics.items())
    ]

    geo_counter: Counter[str] = Counter(latest_country_by_visitor.values())

    return MetricSummary(
        tenant_id=tenant_id,
        range_start=range_start,
        range_end=range_end,
        total_page_views=total_page_views,
        total_clicks=total_clicks,
        unique_sessions=total_sessions,
        unique_visitors=len(unique_visitors),
        avg_session_duration_sec=round(avg_session_duration_sec, 2),
        bounce_rate=round(bounce_rate, 4),
        top_pages=_rank(page_counter),
        top_elements=_rank(element_counter),
        geo_breakdown=_rank(geo_counter, limit=10),
        timeseries=timeseries,
        browser_breakdown=_rank(browser_counter),
        os_breakdown=_rank(os_counter),
        device_breakdown=_rank(device_counter),
        funnel_steps={k: len(v) for k, v in funnel_users.items()},
        anomalies_detected=anomalies,
    )
