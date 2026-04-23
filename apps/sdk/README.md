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

Check shared contract in [api.yml](../../api.yml).

## Run / Build

```bash
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
<script src="/metricflow.js"></script>
<script>
  mf('init', 'mf_demo_key', { endpoint: 'http://localhost:4000/api/v1/events' });
  mf('track', 'cta_clicked', { label: 'hero-button' });
</script>
```

## Safe Files To Touch

- `src/index.ts`
- `examples/embed.html`
