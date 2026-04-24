const fs = require("fs");
const path = require("path");

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.trimStart());
  console.log("✓ Created:", filePath);
}

// ── app/page.tsx (root redirect) ─────────────────────────────
write("app/page.tsx", `
import { redirect } from "next/navigation";
export default function RootPage() {
  redirect("/dashboard");
}
`);

// ── app/dashboard/layout.tsx ──────────────────────────────────
write("app/dashboard/layout.tsx", `
import React from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <Navbar title="Overview" />
        <main className="app-shell__content" id="main-content">{children}</main>
      </div>
    </div>
  );
}
`);

// ── hooks/useTopPages.ts ──────────────────────────────────────
write("hooks/useTopPages.ts", `
"use client";
import { useState, useEffect, useCallback } from "react";
import { api, ApiFilters, TopPagesResponse, ApiError } from "@/services/api";
interface UseTopPagesResult {
  data: TopPagesResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}
export function useTopPages(filters: ApiFilters = {}): UseTopPagesResult {
  const [data, setData] = useState<TopPagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const filtersKey = JSON.stringify(filters);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getTopPages(filters);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, tick]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, isLoading, error, refetch };
}
`);

// ── hooks/useClickMetrics.ts ──────────────────────────────────
write("hooks/useClickMetrics.ts", `
"use client";
import { useState, useEffect, useCallback } from "react";
import { api, ApiFilters, ClickMetricsResponse, ApiError } from "@/services/api";
interface UseClickMetricsResult {
  data: ClickMetricsResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}
export function useClickMetrics(filters: ApiFilters = {}): UseClickMetricsResult {
  const [data, setData] = useState<ClickMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const filtersKey = JSON.stringify(filters);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getClickMetrics(filters);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, tick]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, isLoading, error, refetch };
}
`);

// ── API Routes ────────────────────────────────────────────────
write("app/api/metrics/overview/route.ts", `
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  await new Promise((r) => setTimeout(r, 400));
  return NextResponse.json({
    pageViews: { label: "Page Views", value: 142850, delta: 12.4, trend: "up" },
    clicks:    { label: "Clicks",     value: 38210,  delta: -3.1, trend: "down" },
    sessions:  { label: "Sessions",   value: 24680,  delta: 7.8,  trend: "up" },
  });
}
`);

write("app/api/metrics/top-pages/route.ts", `
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
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
`);

write("app/api/metrics/clicks/route.ts", `
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  await new Promise((r) => setTimeout(r, 300));
  const distribution = [
    { label: "CTA Button",  count: 14820, percentage: 38.8 },
    { label: "Nav Link",    count: 10240, percentage: 26.8 },
    { label: "Card",        count: 6310,  percentage: 16.5 },
    { label: "Form Submit", count: 4190,  percentage: 11.0 },
    { label: "Other",       count: 2650,  percentage: 6.9  },
  ];
  return NextResponse.json({ distribution, total: distribution.reduce((s, d) => s + d.count, 0) });
}
`);

write("app/api/metrics/trends/route.ts", `
import { NextRequest, NextResponse } from "next/server";
function rand(base, variance) { return Math.round(base + (Math.random() - 0.5) * variance * 2); }
export async function GET(req: NextRequest) {
  await new Promise((r) => setTimeout(r, 500));
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  const start = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
  const end   = to   ? new Date(to)   : new Date();
  const days  = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    return { timestamp: d.toISOString(), pageViews: rand(18000,5000)+i*120, clicks: rand(5000,1200)+i*30, sessions: rand(3200,900)+i*20 };
  });
  return NextResponse.json({ series, granularity: days<=2?"hour":days<=31?"day":days<=90?"week":"month" });
}
`);

console.log("\n✅ All missing files created! Now run: npm run dev");