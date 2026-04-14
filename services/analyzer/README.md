# Analyzer

This is Python metrics worker.

## What This Part Does

- asks backend for raw events
- turns raw events into useful metrics
- sends summary back to backend

## What This Part Must Not Do

- no direct MongoDB access
- no dashboard UI work
- no browser tracking code

## Routes Used

- `GET /api/v1/analyzer/events`
- `POST /api/v1/analyzer/summaries`

Full contract: [api.yml](../../api.yml)

## Run

```bash
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
metricflow-analyzer
```

## Safe Files To Touch

- `src/metricflow_analyzer/metrics.py`
- `src/metricflow_analyzer/client.py`
- `src/metricflow_analyzer/worker.py`
