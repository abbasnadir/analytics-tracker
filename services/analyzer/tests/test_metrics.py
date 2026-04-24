from datetime import datetime, timezone

from metricflow_analyzer.metrics import build_summary


def test_build_summary_counts_page_views_and_clicks() -> None:
    summary = build_summary(
        tenant_id="mf_demo_key",
        events=[
            {
                "eventName": "page_view",
                "url": "https://example.com/",
                "sessionId": "s1",
                "visitorId": "v1",
                "timestamp": "2025-01-01T00:00:00+00:00",
                "locale": "en-US",
            },
            {
                "eventName": "page_view",
                "url": "https://example.com/",
                "sessionId": "s1",
                "visitorId": "v1",
                "timestamp": "2025-01-01T00:10:00+00:00",
                "locale": "en-US",
            },
            {
                "eventName": "click",
                "element": {"id": "signup-button"},
                "sessionId": "s1",
                "visitorId": "v1",
                "timestamp": "2025-01-01T00:15:00+00:00",
                "locale": "en-US",
            },
        ],
        range_start=datetime(2025, 1, 1, tzinfo=timezone.utc),
        range_end=datetime(2025, 1, 2, tzinfo=timezone.utc),
    )

    assert summary.total_page_views == 2
    assert summary.total_clicks == 1
    assert summary.unique_sessions == 1
    assert summary.unique_visitors == 1
    assert summary.avg_session_duration_sec == 900.0
    assert summary.top_pages[0].key == "/"
    assert summary.top_elements[0].key == "signup-button"
    assert summary.geo_breakdown[0].key == "US"
    assert summary.timeseries[0]["pageViews"] == 2
    assert summary.timeseries[0]["clicks"] == 1
