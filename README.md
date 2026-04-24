# MetricFlow

## What This App Does

MetricFlow is a lightweight event analytics system for websites.

You embed the SDK script into a site, and it captures interaction events like page views, clicks, and custom events. Those events are sent to the backend, stored as raw telemetry, and processed by the Python analyzer into summary metrics. The dashboard then reads those processed metrics from the backend and displays analytics cards/tables/charts.

In short:

- SDK collects browser events
- backend validates and stores events in MongoDB
- analyzer computes aggregates and trends
- dashboard visualizes ready-to-use metrics

MetricFlow has 4 parts:

- `apps/sdk` = browser tracking script
- `services/backend` = main API
- `services/analyzer` = Python metrics worker
- `apps/dashboard` = analytics UI

Whole app rule:

- SDK talks to backend
- analyzer talks to backend
- dashboard talks to backend
- backend talks to MongoDB

Simple architecture file: [ARCHITECTURE.md](./ARCHITECTURE.md)  
API contract file: [api.yml](./api.yml)

## Design and Configuration Reference Guide

Use this section when deciding which file to open for a specific question.

### Product and System Design

- High-level architecture and team boundaries: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Current system constraints and working rules: [INSTRUCTIONS.md](./INSTRUCTIONS.md)
- Full end-to-end integration blueprint (SDK, backend, analyzer, dashboard, MongoDB): [design/metricflow-integration-spec.md](./design/metricflow-integration-spec.md)

### API Contracts

- Source of truth for backend routes, payloads, and responses: [api.yml](./api.yml)

### Database Design

- MongoDB data model and indexes in blueprint form: [design/metricflow-integration-spec.md](./design/metricflow-integration-spec.md)
- Legacy DB note/diagram (if needed for old context): [db.md](./db.md)

### Service-Specific Configuration

- Unified env source for whole project: [.env.unified.example](./.env.unified.example)
- Generate all module env files from one unified env: [scripts/sync-env.mjs](./scripts/sync-env.mjs)
- Run backend + dashboard + analyzer together: [scripts/dev-all.mjs](./scripts/dev-all.mjs)

- Backend env variables: [services/backend/.env.example](./services/backend/.env.example)
- Backend env parsing/validation: [services/backend/src/config/env.ts](./services/backend/src/config/env.ts)
- Backend architecture/routing guidance: [services/backend/README.md](./services/backend/README.md)

- Analyzer env variables: [services/analyzer/.env.example](./services/analyzer/.env.example)
- Analyzer runtime settings loader: [services/analyzer/src/metricflow_analyzer/config.py](./services/analyzer/src/metricflow_analyzer/config.py)
- Analyzer component guide: [services/analyzer/README.md](./services/analyzer/README.md)

- Dashboard env variables: [apps/dashboard/.env.example](./apps/dashboard/.env.example)
- Dashboard backend API client: [apps/dashboard/lib/api.ts](./apps/dashboard/lib/api.ts)
- Dashboard component guide: [apps/dashboard/README.md](./apps/dashboard/README.md)

- SDK integration guide and embed usage: [apps/sdk/README.md](./apps/sdk/README.md)
- SDK tracking behavior and options: [apps/sdk/src/index.ts](./apps/sdk/src/index.ts)

## Team Split

- Person 1: SDK
- Person 2: backend
- Person 3: Python analyzer
- Person 4: dashboard

Each person should mostly stay in own folder.

## Project Shape

```text
.
├── apps/
│   ├── dashboard/
│   └── sdk/
├── services/
│   ├── analyzer/
│   └── backend/
├── ARCHITECTURE.md
├── api.yml
├── package.json
└── README.md
```

## What You Need

- Git
- VS Code
- Node.js 20+
- Python 3.11+
- MongoDB connection string

For noob setup, easiest DB option is MongoDB Atlas free cluster.

## Super Simple Setup

Fast path for teammates:

```bash
npm install
cp .env.unified.example .env.unified
npm run env:sync
cd services/analyzer && python3 -m venv .venv && source .venv/bin/activate && pip install -e .[dev] && cd ../..
npm run dev:all
```

### 1. Clone project

```bash
git clone <your-github-repo-url>
cd <your-repo-folder>
```

### 2. Install Node packages

```bash
npm install
```

### 3. Create one unified env file

Mac/Linux:

```bash
cp .env.unified.example .env.unified
npm run env:sync
```

Windows PowerShell:

```powershell
Copy-Item .env.unified.example .env.unified
npm run env:sync
```

This generates:

- `services/backend/.env`
- `apps/dashboard/.env.local`
- `services/analyzer/.env`

Edit only `.env.unified` and re-run `npm run env:sync` when variables change.

### 4. Put MongoDB URI in unified env

Open `.env.unified` and set:

- `MONGODB_URI` to Atlas/local connection string
- keep API keys the same for local dev (default values are already matched)

### 5. Set up Python once

Mac/Linux:

```bash
cd services/analyzer
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cd ../..
```

Windows PowerShell:

```powershell
cd services/analyzer
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e '.[dev]'
cd ../..
```

## How To Run

Unified command (recommended for team):

```bash
npm run dev:all
```

This command reads `.env.unified` and starts backend, dashboard, and analyzer together.

If you change env values, re-run:

```bash
npm run env:sync
```

If you prefer separate terminals, keep using the manual commands below.

Open 3 terminals.

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:dashboard
```

Terminal 3, Mac/Linux:

```bash
cd services/analyzer
source .venv/bin/activate
metricflow-analyzer
```

Terminal 3, Windows:

```powershell
cd services/analyzer
.\.venv\Scripts\Activate.ps1
metricflow-analyzer
```

SDK person builds when needed:

```bash
npm run build:sdk
```

## What Connects To What

### SDK -> backend

- route: `POST /api/v1/events`
- sends raw browser events

### analyzer -> backend

- route: `GET /api/v1/analyzer/events`
- route: `POST /api/v1/analyzer/summaries`
- analyzer never reads DB directly

### dashboard -> backend

- route: `GET /api/v1/metrics/overview`
- dashboard only shows ready data

## Easy Rule For Group

If confused:

1. Start backend first
2. Check `api.yml`
3. Change only your folder
4. Do not let frontend or Python touch DB directly
