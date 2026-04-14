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
- `GET /api/v1/analyzer/events` for analyzer
- `POST /api/v1/analyzer/summaries` from analyzer
- `GET /api/v1/metrics/overview` for dashboard
- `GET /health`

Full contract: [api.yml](../../api.yml)

## Run

```bash
cp .env.example .env
npm install
npm run dev
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

## Safe Files To Touch

- `src/routes/*`
- `src/modules/events/*`
- `src/middleware/*`
- `src/config/*`
