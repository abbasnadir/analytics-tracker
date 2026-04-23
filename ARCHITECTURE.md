# MetricFlow Architecture

Keep this picture in head:

`website -> SDK -> backend -> MongoDB`

`python analyzer -> backend -> MongoDB`

`dashboard -> backend`

Backend is center. Everything goes through backend.

## Who Does What

### 1. SDK person

Folder: `apps/sdk`

Work:

- track browser events
- send events to backend
- keep script small

Do not do:

- no database work
- no dashboard code
- no Python logic

### 2. Backend person

Folder: `services/backend`

Work:

- receive SDK events
- validate payloads
- store raw events
- give raw events to analyzer
- receive processed summaries
- give ready data to dashboard
- handle errors

Backend is mediator for whole app.

### 3. Python person

Folder: `services/analyzer`

Work:

- ask backend for raw events
- calculate metrics
- send summary back to backend

Do not do:

- no direct MongoDB code
- no dashboard UI

### 4. Dashboard person

Folder: `apps/dashboard`

Work:

- ask backend for metrics
- show cards/tables/charts

Do not do:

- no direct DB access
- no raw event processing

## Route Flow

### SDK -> backend

- `POST /api/v1/events`

### analyzer -> backend

- `GET /api/v1/analyzer/events`
- `POST /api/v1/analyzer/summaries`

### dashboard -> backend

- `GET /api/v1/metrics/overview`

Full shared contract: [api.yml](./api.yml)

## Data Rules

- only backend touches MongoDB
- if route changes, update `api.yml`
- if payload changes, tell whole group
- if backend breaks, everyone gets blocked
