# MetricFlow Dashboard

> Next.js frontend for the MetricFlow modular event analytics system.

---

## Architecture

```
UI Components
    │  (render only, no fetch calls)
    ▼
Custom Hooks  (useOverviewMetrics, useTopPages, useClickMetrics, useTrends)
    │  (state management: data / isLoading / error)
    ▼
API Service   (/services/api.ts)
    │  (single abstraction layer — only place fetch() is called)
    ▼
Backend REST API  (/api/metrics/*)
```

**This flow is enforced and must not be violated.**  
Components never call `fetch` or `axios` directly.

---

## Folder Structure

```
metricflow-dashboard/
│
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Redirects → /dashboard
│   ├── globals.css                 # Design tokens + all styles
│   │
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + Navbar shell
│   │   └── page.tsx                # Dashboard page (orchestration)
│   │
│   └── api/                        # Next.js mock routes (dev only)
│       └── metrics/
│           ├── overview/route.ts
│           ├── top-pages/route.ts
│           ├── clicks/route.ts
│           └── trends/route.ts
│
├── components/
│   ├── MetricCard.tsx              # KPI card (value + delta)
│   ├── ChartWrapper.tsx            # Generic chart container
│   ├── LineChartComponent.tsx      # Recharts line chart (trends)
│   ├── BarChartComponent.tsx       # Recharts bar chart (top pages)
│   ├── PieChartComponent.tsx       # Recharts donut chart (click dist.)
│   ├── FilterBar.tsx               # Date range + event type filters
│   ├── Sidebar.tsx                 # Navigation sidebar
│   └── Navbar.tsx                  # Top navigation bar
│
├── hooks/
│   ├── useOverviewMetrics.ts       # Overview KPIs hook
│   ├── useTopPages.ts              # Top pages hook
│   ├── useClickMetrics.ts          # Click distribution hook
│   └── useTrends.ts                # Time-series trends hook
│
├── services/
│   └── api.ts                      # ⭐ Central API abstraction layer
│
├── utils/
│   └── formatters.ts               # Pure display utility functions
│
├── .env.local.example              # Environment variable template
├── next.config.js                  # Next.js + API proxy config
├── tsconfig.json
└── package.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_BASE_URL to your backend
```

### 3. Run development server

```bash
npm run dev
# Open http://localhost:3000
```

The mock API routes (`/app/api/metrics/*`) serve realistic data automatically in development. No backend required to test the dashboard.

---

## Integrating with the Real Backend

1. Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to your Node.js backend URL  
   e.g. `NEXT_PUBLIC_API_BASE_URL=https://api.metricflow.io/api`

2. The `next.config.js` rewrite rule proxies all `/api/*` requests to the backend — **no CORS issues**, no code changes required.

3. Remove or gate the mock routes in `/app/api/` for production.

That's it. The entire integration surface is `/services/api.ts`.

---

## Adding New Metrics

### New endpoint

1. Add the TypeScript types and function to `/services/api.ts`
2. Create a hook in `/hooks/useMyNewMetric.ts`
3. Call the hook in `dashboard/page.tsx`
4. Add a component or pass data to an existing chart

### New chart series

Pass a custom `series` prop to `LineChartComponent`:

```tsx
<LineChartComponent
  data={trends.data.series}
  granularity={trends.data.granularity}
  series={[
    { key: "conversions", label: "Conversions", color: "#34d399" },
    { key: "pageViews",   label: "Page Views",  color: "#00d4ff" },
  ]}
/>
```

---

## Real-Time Updates (Future)

Each hook follows the same pattern — add a `useEffect` with a WebSocket subscription alongside the existing polling:

```ts
// Inside any hook:
useEffect(() => {
  const ws = new WebSocket(`${WS_BASE_URL}/metrics/overview`);
  ws.onmessage = (e) => setData(JSON.parse(e.data));
  return () => ws.close();
}, []);
```

No component changes needed.

---

## Design Tokens

All colors, spacing, fonts, and shadows live in `app/globals.css` as CSS custom properties under `:root`. Change a token once — it updates everywhere.

| Token                  | Value        | Usage                     |
|------------------------|--------------|---------------------------|
| `--color-accent`       | `#00d4ff`    | Primary highlight, active |
| `--color-amber`        | `#f59e0b`    | Secondary accent          |
| `--color-bg`           | `#080d1a`    | Page background           |
| `--color-surface`      | `#0d1424`    | Cards, sidebar            |
| `--font-display`       | Syne         | Headings                  |
| `--font-mono`          | DM Mono      | Numbers, data, labels     |
| `--font-body`          | DM Sans      | Body text                 |

---

## Scripts

| Command            | Description                    |
|--------------------|--------------------------------|
| `npm run dev`      | Start dev server (port 3000)   |
| `npm run build`    | Production build               |
| `npm run start`    | Serve production build         |
| `npm run type-check` | TypeScript validation only   |
| `npm run lint`     | ESLint                         |
