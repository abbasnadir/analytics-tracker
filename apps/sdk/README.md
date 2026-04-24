# SDK

This is browser tracking script.

## What This Part Does

- starts with API key
- auto-tracks page views
- auto-tracks clicks
- sends events to backend

## What This Part Must Not Do

- no DB access
- no dashboard code
- no analytics summary logic

## Route Used

- `POST /api/v1/events`
- `POST /api/v1/events/batch`

Check shared contract in [api.yml](../../api.yml).

## Install and Run / Build

Unified team flow (from project root):

```bash
npm install
cp .env.unified.example .env.unified
npm run env:sync
npm run dev:all
```

SDK-only flow:

```bash
npm install
cp .env.unified.example .env.unified
npm run env:sync
npm run build:sdk
```

If working only inside this folder:

```bash
cd apps/sdk
npm install
npm run build
```

## Embed Example

```html
<script
  async
  src="/metricflow.js"
  data-mf-token="mf_demo_key"
  data-mf-endpoint="http://localhost:4000/api/v1/events"
></script>
<script>
  mf("track", "cta_clicked", { label: "hero-button" });
</script>
```

Drop-in file produced by build:

- `apps/sdk/dist/metricflow.js`

Supported bootstrap attributes on the script tag:

- `data-mf-token` (required)
- `data-mf-endpoint` (optional, defaults to `/api/v1/events`)
- `data-mf-script-id` (optional)
- `data-mf-auto-track` (`true`/`false`)
- `data-mf-scroll` (`true`/`false`)
- `data-mf-perf` (`true`/`false`)

## Safe Files To Touch

- `src/index.ts`
- `examples/embed.html`
