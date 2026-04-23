/**
 * ⚠️  DEV STUB — Local mock for GET /api/v1/metrics/overview
 * -----------------------------------------------------------
 * This route returns hardcoded data so the dashboard can be
 * developed and tested without running the real backend.
 *
 * In production, the Next.js rewrite in next.config.js proxies
 * this request to the MetricFlow backend. This file should be
 * REMOVED or disabled before deployment.
 *
 * Real endpoint (backend): GET /api/v1/metrics/overview
 * Contract: see api.yml
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 400));

  return NextResponse.json({
    pageViews: { label: "Page Views", value: 142850, delta: 12.4, trend: "up" },
    clicks:    { label: "Clicks",     value: 38210,  delta: -3.1, trend: "down" },
    sessions:  { label: "Sessions",   value: 24680,  delta: 7.8,  trend: "up" },
  });
}
