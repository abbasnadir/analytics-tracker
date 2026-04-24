/**
 * ⚠️  DEV STUB — Local mock for GET /api/v1/metrics/top-pages
 * -------------------------------------------------------------
 * Returns hardcoded page-ranking data so the dashboard can
 * render the bar chart without the real backend running.
 *
 * In production, the Next.js rewrite proxies this to the
 * MetricFlow backend. This file should be REMOVED or disabled
 * before deployment.
 *
 * Real endpoint (backend): GET /api/v1/metrics/top-pages
 * Contract: see api.yml
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 350));

  return NextResponse.json({
    pages: [
      { path: "/home",            views: 52400, avgDuration: 142 },
      { path: "/pricing",         views: 31200, avgDuration: 98  },
      { path: "/docs/quickstart", views: 24800, avgDuration: 310 },
      { path: "/blog",            views: 18900, avgDuration: 205 },
      { path: "/changelog",       views: 12300, avgDuration: 88  },
      { path: "/dashboard",       views: 9800,  avgDuration: 420 },
      { path: "/integrations",    views: 7200,  avgDuration: 175 },
      { path: "/about",           views: 4100,  avgDuration: 63  },
    ],
  });
}
