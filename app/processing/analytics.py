from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Iterable, Mapping, Sequence

from app.models.schemas import AnomalyRecord, FunnelStep, HistoricalSummary


def calculate_bounce_rate(session_event_counts: Mapping[str, int]) -> float:
    if not session_event_counts:
        return 0.0
    bounced = sum(1 for count in session_event_counts.values() if count == 1)
    return round(bounced / len(session_event_counts), 4)


def classify_user_agent(user_agent: str) -> tuple[str, str]:
    lowered = user_agent.lower()

    browser = "Other"
    if "edg/" in lowered:
        browser = "Edge"
    elif "opr/" in lowered or "opera" in lowered:
        browser = "Opera"
    elif "firefox/" in lowered:
        browser = "Firefox"
    elif "safari/" in lowered and "chrome/" not in lowered:
        browser = "Safari"
    elif "chrome/" in lowered or "crios/" in lowered:
        browser = "Chrome"

    operating_system = "Other"
    if "windows" in lowered:
        operating_system = "Windows"
    elif "android" in lowered:
        operating_system = "Android"
    elif "iphone" in lowered or "ipad" in lowered or "ios" in lowered:
        operating_system = "iOS"
    elif "mac os x" in lowered or "macintosh" in lowered:
        operating_system = "macOS"
    elif "linux" in lowered:
        operating_system = "Linux"

    return browser, operating_system


def build_user_agent_breakdown(user_agents: Iterable[str]) -> dict[str, dict[str, int]]:
    browsers: Counter[str] = Counter()
    operating_systems: Counter[str] = Counter()

    for user_agent in user_agents:
        browser, operating_system = classify_user_agent(user_agent)
        browsers[browser] += 1
        operating_systems[operating_system] += 1

    return {
        "browsers": dict(browsers.most_common()),
        "operating_systems": dict(operating_systems.most_common()),
    }


def merge_user_agent_counts(
    browsers: Counter[str],
    operating_systems: Counter[str],
) -> dict[str, dict[str, int]]:
    return {
        "browsers": dict(browsers.most_common()),
        "operating_systems": dict(operating_systems.most_common()),
    }


def build_funnel(
    session_navigation: Mapping[str, Sequence[tuple[datetime, str]]],
    *,
    top_n: int,
) -> list[FunnelStep]:
    transitions: Counter[tuple[str, str]] = Counter()

    for entries in session_navigation.values():
        ordered_urls = [
            url
            for _, url in sorted(entries, key=lambda item: item[0])
            if url
        ]

        if not ordered_urls:
            continue

        compacted: list[str] = [ordered_urls[0]]
        for url in ordered_urls[1:]:
            if url != compacted[-1]:
                compacted.append(url)

        for from_url, to_url in zip(compacted, compacted[1:]):
            transitions[(from_url, to_url)] += 1

    return [
        FunnelStep(from_url=from_url, to_url=to_url, count=count)
        for (from_url, to_url), count in transitions.most_common(top_n)
    ]


def detect_anomalies(
    current: HistoricalSummary,
    history: Sequence[HistoricalSummary],
    *,
    page_view_threshold: int,
    click_threshold: int,
    spike_multiplier: float,
) -> list[AnomalyRecord]:
    anomalies: list[AnomalyRecord] = []

    if current.total_page_views >= page_view_threshold:
        anomalies.append(
            AnomalyRecord(
                metric="page_views",
                value=float(current.total_page_views),
                threshold=float(page_view_threshold),
                reason="absolute_threshold_exceeded",
            )
        )

    if current.total_clicks >= click_threshold:
        anomalies.append(
            AnomalyRecord(
                metric="clicks",
                value=float(current.total_clicks),
                threshold=float(click_threshold),
                reason="absolute_threshold_exceeded",
            )
        )

    if history:
        average_page_views = sum(item.total_page_views for item in history) / len(history)
        average_clicks = sum(item.total_clicks for item in history) / len(history)

        if average_page_views > 0 and current.total_page_views >= average_page_views * spike_multiplier:
            anomalies.append(
                AnomalyRecord(
                    metric="page_views",
                    value=float(current.total_page_views),
                    threshold=round(average_page_views * spike_multiplier, 2),
                    reason="spike_vs_recent_average",
                )
            )

        if average_clicks > 0 and current.total_clicks >= average_clicks * spike_multiplier:
            anomalies.append(
                AnomalyRecord(
                    metric="clicks",
                    value=float(current.total_clicks),
                    threshold=round(average_clicks * spike_multiplier, 2),
                    reason="spike_vs_recent_average",
                )
            )

    return anomalies
