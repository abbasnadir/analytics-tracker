/**
 * ⚠️  DEV STUB — Local mock for GET /api/v1/metrics/clicks
 * ----------------------------------------------------------
 * Returns hardcoded click distribution data so the dashboard
 * can render the pie chart without the real backend running.
 *
 * In production, the Next.js rewrite proxies this to the
 * MetricFlow backend. This file should be REMOVED or disabled
 * before deployment.
 *
 * Real endpoint (backend): GET /api/v1/metrics/clicks
 * Contract: see api.yml
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 300));

  const distribution = [
    { label: "CTA Button",  count: 14820, percentage: 38.8 },
    { label: "Nav Link",    count: 10240, percentage: 26.8 },
    { label: "Card",        count: 6310,  percentage: 16.5 },
    { label: "Form Submit", count: 4190,  percentage: 11.0 },
    { label: "Other",       count: 2650,  percentage: 6.9  },
  ];

  return NextResponse.json({
    distribution,
    total: distribution.reduce((s, d) => s + d.count, 0),
  });
}
