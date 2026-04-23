/**
 * ⚠️  DEV STUB — Local mock for GET /api/v1/metrics/trends
 * ----------------------------------------------------------
 * Generates randomised time-series data so the dashboard can
 * render the line chart without the real backend running.
 *
 * In production, the Next.js rewrite proxies this to the
 * MetricFlow backend. This file should be REMOVED or disabled
 * before deployment.
 *
 * Real endpoint (backend): GET /api/v1/metrics/trends
 * Contract: see api.yml
 */
import { NextRequest, NextResponse } from "next/server";

function rand(base: number, variance: number): number {
  return Math.round(base + (Math.random() - 0.5) * variance * 2);
}

export async function GET(req: NextRequest) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 500));

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const start = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
  const end   = to   ? new Date(to)   : new Date();
  const days  = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      timestamp: d.toISOString(),
      pageViews: rand(18000, 5000) + i * 120,
      clicks:    rand(5000, 1200)  + i * 30,
      sessions:  rand(3200, 900)   + i * 20,
    };
  });

  const granularity = days <= 2 ? "hour" : days <= 31 ? "day" : days <= 90 ? "week" : "month";

  return NextResponse.json({ series, granularity });
}
