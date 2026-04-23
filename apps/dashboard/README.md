# Dashboard

This is analytics UI.

## What This Part Does

- calls backend for ready metrics
- shows cards, tables, charts
- stays UI-only

## What This Part Must Not Do

- no direct DB access
- no raw event processing
- no SDK logic

## Route Used

- `GET /api/v1/metrics/overview`
- `GET /api/v1/metrics/timeseries`
- `GET /api/v1/metrics/top-pages`
- `GET /api/v1/metrics/top-elements`
- `GET /api/v1/metrics/sessions`
- `GET /api/v1/metrics/health/ping`

Full contract: [api.yml](../../api.yml)

## Install and Run

Unified team flow (from project root):

```bash
npm install
cp .env.unified.example .env.unified
npm run env:sync
npm run dev:all
```

Dashboard-only flow:

```bash
npm install
cp .env.unified.example .env.unified
npm run env:sync
npm run dev:dashboard
```

## Safe Files To Touch

- `app/page.tsx`
- `components/*`
- `lib/api.ts`
