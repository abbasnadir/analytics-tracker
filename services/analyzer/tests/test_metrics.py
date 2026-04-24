from datetime import datetime, timezone

from metricflow_analyzer.metrics import build_summary


def test_build_summary_counts_page_views_and_clicks() -> None:
    summary = build_summary(
        tenant_id="mf_demo_key",
        events=[
            {"eventName": "page_view", "url": "https://example.com/"},
            {"eventName": "page_view", "url": "https://example.com/"},
            {"eventName": "click", "element": {"id": "signup-button"}},
        ],
        range_start=datetime(2025, 1, 1, tzinfo=timezone.utc),
        range_end=datetime(2025, 1, 2, tzinfo=timezone.utc),
    )

    assert summary.total_page_views == 2
    assert summary.total_clicks == 1
    assert summary.top_pages[0].key == "https://example.com/"
    assert summary.top_elements[0].key == "signup-button"
