# Backend

This is project center.

## Backend Job

- receive events from SDK
- validate payloads
- store raw events in MongoDB
- give raw events to analyzer
- receive summaries from analyzer
- give ready metrics to dashboard
- return helpful errors

## Backend Is Mediator

Everyone talks to backend:

- SDK -> backend
- analyzer -> backend
- dashboard -> backend

Only backend talks to MongoDB.

## Routes

- `POST /api/v1/events` from SDK
- `POST /api/v1/events/batch` from SDK
- `GET /api/v1/analyzer/events` for analyzer
- `POST /api/v1/analyzer/summaries` from analyzer
- `GET /api/v1/analyzer/checkpoint` for analyzer
- `PUT /api/v1/analyzer/checkpoint` for analyzer
- `GET /api/v1/metrics/overview` for dashboard
- `GET /api/v1/metrics/timeseries` for dashboard
- `GET /api/v1/metrics/top-pages` for dashboard
- `GET /api/v1/metrics/top-elements` for dashboard
- `GET /api/v1/metrics/sessions` for dashboard
- `GET /api/v1/metrics/health/ping` for dashboard
- `GET /health`

Full contract: [api.yml](../../api.yml)

## Run

Unified team flow (from project root):

```bash
npm install
cp .env.unified.example .env.unified
npm run env:sync
cd services/analyzer
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
cd ../..
npm run dev:all
```

Backend-only flow:

```bash
npm install
cp .env.unified.example .env.unified
npm run env:sync
npm run dev:backend
```

## Error Handling

Backend now returns JSON errors with:

- error message
- request id
- validation details when payload is wrong
- `404` for bad route
- `400` for bad JSON/body
- `401` for bad API key
- `500` for unexpected crash

## Environment

- `PORT`: backend port
- `MONGODB_URI`: MongoDB connection string
- `CORS_ORIGIN`: allowed browser origin
- `DEFAULT_API_KEY`: fallback API key
- `JSON_BODY_LIMIT`: max JSON payload size (default `256kb`)
- `MAX_ANALYZER_EVENTS`: cap per analyzer pull request
- `EVENTS_TTL_DAYS`: raw event retention window

## Safe Files To Touch

- `src/routes/*`
- `src/modules/events/*`
- `src/middleware/*`
- `src/config/*`
