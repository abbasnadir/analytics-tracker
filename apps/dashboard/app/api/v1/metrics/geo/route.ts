/**
 * ⚠️  DEV STUB — Local mock for GET /api/v1/metrics/geo
 * -------------------------------------------------------------
 * Returns hardcoded geographic distribution data so the dashboard can
 * render the map chart without the real backend running.
 *
 * In production, the Next.js rewrite proxies this to the
 * MetricFlow backend.
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 400));

  return NextResponse.json({
    data: [
      { id: "United States of America", value: 52400 },
      { id: "India", value: 41200 },
      { id: "United Kingdom", value: 24800 },
      { id: "Germany", value: 18900 },
      { id: "Canada", value: 12300 },
      { id: "France", value: 9800 },
      { id: "Australia", value: 7200 },
      { id: "Brazil", value: 5100 },
      { id: "Japan", value: 4100 },
      { id: "South Africa", value: 3100 },
    ],
  });
}
