from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any

from user_agents import parse as parse_ua

from .models import MetricSummary, RankedMetric


def _rank(counter: Counter[str], limit: int = 5) -> list[RankedMetric]:
    return [RankedMetric(key=key, count=count) for key, count in counter.most_common(limit)]


def build_summary(tenant_id: str, events: list[dict[str, Any]], range_start: datetime, range_end: datetime) -> MetricSummary:
    page_counter: Counter[str] = Counter()
    element_counter: Counter[str] = Counter()
    browser_counter: Counter[str] = Counter()
    os_counter: Counter[str] = Counter()
    device_counter: Counter[str] = Counter()

    total_page_views = 0
    total_clicks = 0
    
    # Bounce rate calculation
    session_events: dict[str, int] = Counter()
    session_page_views: dict[str, int] = Counter()

    # Funnel Drop-off (Example: Any Page -> Pricing -> Sign Up)
    funnel_users: dict[str, set[str]] = {
        "step_1_any_page": set(),
        "step_2_pricing": set(),
        "step_3_signup": set()
    }
    
    anomalies: list[str] = []
    error_count = 0

    for event in events:
        event_name = event.get("eventName")
        session_id = event.get("sessionId", "unknown_session")
        url = event.get("url", "")
        
        session_events[session_id] += 1

        # User-Agent parsing
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
            page_counter[url or "unknown"] += 1
            session_page_views[session_id] += 1
            
            # Funnel Step 1 & 2
            funnel_users["step_1_any_page"].add(session_id)
            if "pricing" in url.lower():
                funnel_users["step_2_pricing"].add(session_id)

        elif event_name == "click":
            total_clicks += 1
            element = event.get("element") or {}
            key = element.get("id") or element.get("text") or element.get("tagName") or "unknown"
            element_counter[key] += 1
            
            # Funnel Step 3
            if "sign up" in str(key).lower() or "signup" in str(key).lower():
                funnel_users["step_3_signup"].add(session_id)
                
        elif event_name == "error":
            error_count += 1

    # Calculate Bounce Rate: sessions with exactly 1 event AND that event is a page_view
    total_sessions = len(session_events)
    bounced_sessions = sum(
        1 for sid, total_ev in session_events.items()
        if total_ev == 1 and session_page_views.get(sid, 0) == 1
    )
    bounce_rate = (bounced_sessions / total_sessions) if total_sessions > 0 else 0.0

    # Anomalies
    if error_count > 10:
        anomalies.append(f"High number of error events detected: {error_count}")
    if total_page_views > 10000:
        anomalies.append(f"Unusual spike in traffic: {total_page_views} page views")

    return MetricSummary(
        tenant_id=tenant_id,
        range_start=range_start,
        range_end=range_end,
        total_page_views=total_page_views,
        total_clicks=total_clicks,
        bounce_rate=round(bounce_rate, 4),
        top_pages=_rank(page_counter),
        top_elements=_rank(element_counter),
        browser_breakdown=_rank(browser_counter),
        os_breakdown=_rank(os_counter),
        device_breakdown=_rank(device_counter),
        funnel_steps={k: len(v) for k, v in funnel_users.items()},
        anomalies_detected=anomalies,
    )

