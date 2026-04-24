# Python Analyzer Worker

Asynchronous background worker that polls a raw-events API, aggregates analytics, and posts summary payloads back to the backend.

## Features

- Async polling loop with `asyncio` and `aiohttp`
- Exponential backoff retries for fetch and post operations
- Local persisted dedupe state for idempotent processing across polling windows
- Core aggregation for page views, clicks, sessions, top pages, and top clicked elements
- Modular advanced analytics for bounce rate, user-agent categorization, funnel transitions, and simple anomaly detection
- Structured configuration via `.env`

## Project Layout

```text
python-analyzer/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── api/client.py
│   ├── processing/aggregator.py
│   ├── processing/analytics.py
│   ├── models/schemas.py
│   └── utils/
├── requirements.txt
├── README.md
└── .env
```

## Installation

```bash
pip install -r requirements.txt
```

## Running

```bash
python -m app.main
```

## Configuration

The worker reads configuration from `.env`.

- `ANALYZER_API_BASE_URL`: Base URL for the Node.js backend
- `ANALYZER_RAW_EVENTS_PATH`: Raw event fetch endpoint
- `ANALYZER_SUMMARY_PATH`: Summary post endpoint
- `ANALYZER_API_TOKEN`: Optional bearer token
- `ANALYZER_POLL_INTERVAL_SECONDS`: Main loop interval
- `ANALYZER_RAW_RANGE`: Lookback window for the raw endpoint
- `ANALYZER_USE_SINCE_CURSOR`: Adds a `since` cursor alongside `range` after the first successful batch
- `ANALYZER_STATE_FILE`: Local state file used for dedupe and watermark persistence

## Summary Payload

The worker posts the required output shape and includes optional advanced analytics fields when data is available.

```json
{
  "total_page_views": 1280,
  "total_clicks": 442,
  "unique_sessions": 311,
  "top_pages": [
    { "url": "/pricing", "count": 320 }
  ],
  "top_elements": [
    { "element": "button #signup \"Start free trial\"", "count": 88 }
  ],
  "bounce_rate": 0.2733,
  "timestamp": "2026-04-23T17:30:00+00:00",
  "user_agents": {
    "browsers": { "Chrome": 810, "Safari": 201 },
    "operating_systems": { "Windows": 550, "macOS": 210 }
  },
  "funnel": [
    { "from": "/", "to": "/pricing", "count": 94 }
  ],
  "anomalies": [
    {
      "metric": "page_views",
      "value": 1280.0,
      "threshold": 900.0,
      "reason": "spike_vs_recent_average"
    }
  ]
}
```

## Design Notes

- Idempotency is enforced with a persisted SHA-256 fingerprint cache of processed events plus an overlap-based cursor.
- The worker only advances the watermark after the summary POST succeeds.
- Advanced analytics live in a separate module so richer detectors or parsers can be added without changing the scheduler or API client.
