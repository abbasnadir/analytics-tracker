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

Full contract: [api.yml](../../api.yml)

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Safe Files To Touch

- `app/page.tsx`
- `components/*`
- `lib/api.ts`
