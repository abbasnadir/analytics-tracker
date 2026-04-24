"use client";

/**
 * MetricFlow Dashboard — /dashboard
 * -----------------------------------
 * Orchestrates all hooks, passes filters down, renders the full dashboard layout.
 *
 * Data Flow: UI → Hooks → API Service → Backend
 * Components never call the API directly.
 */

import React, { useState, useCallback } from "react";

import FilterBar      from "@/components/FilterBar";
import MetricCard     from "@/components/MetricCard";
import ChartWrapper   from "@/components/ChartWrapper";
import LineChartComponent from "@/components/LineChartComponent";
import BarChartComponent  from "@/components/BarChartComponent";
import PieChartComponent  from "@/components/PieChartComponent";
import GeoMapComponent    from "@/components/GeoMapComponent";
import ExportButton       from "@/components/ExportButton";

import { useOverviewMetrics } from "@/hooks/useOverviewMetrics";
import { useTopPages }        from "@/hooks/useTopPages";
import { useClickMetrics }    from "@/hooks/useClickMetrics";
import { useTrends }          from "@/hooks/useTrends";
import { useGeoMetrics }      from "@/hooks/useGeoMetrics";

import { ApiFilters } from "@/services/api";

// ─── Icon primitives ─────────────────────────────────────────────────────────

const IconEye  = () => <span aria-hidden>◈</span>;
const IconClick = () => <span aria-hidden>⬡</span>;
const IconUser  = () => <span aria-hidden>⊚</span>;

// ─── Page Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [filters, setFilters] = useState<ApiFilters>({});

  const handleFiltersChange = useCallback((f: ApiFilters) => {
    setFilters(f);
  }, []);

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const overview     = useOverviewMetrics(filters);
  const topPages     = useTopPages(filters);
  const clickMetrics = useClickMetrics(filters);
  const trends       = useTrends(filters);
  const geoMetrics   = useGeoMetrics(filters);

  // Aggregate loading state for FilterBar spinner
  const anyLoading =
    overview.isLoading || topPages.isLoading || clickMetrics.isLoading || trends.isLoading || geoMetrics.isLoading;

  return (
    <div className="dashboard">
      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <section className="dashboard__filters" aria-label="Filters">
        <FilterBar onFiltersChange={handleFiltersChange} isLoading={anyLoading} />
      </section>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <section className="dashboard__metrics" aria-label="Key metrics">
        {overview.error && (
          <div className="dashboard__error-banner" role="alert">
            ⚠ Could not load metrics: {overview.error.message}
          </div>
        )}

        <MetricCard
          metric={
            overview.data?.pageViews ?? {
              label: "Page Views", value: 0, delta: 0, trend: "flat",
            }
          }
          icon={<IconEye />}
          isLoading={overview.isLoading}
        />
        <MetricCard
          metric={
            overview.data?.clicks ?? {
              label: "Clicks", value: 0, delta: 0, trend: "flat",
            }
          }
          icon={<IconClick />}
          isLoading={overview.isLoading}
        />
        <MetricCard
          metric={
            overview.data?.sessions ?? {
              label: "Sessions", value: 0, delta: 0, trend: "flat",
            }
          }
          icon={<IconUser />}
          isLoading={overview.isLoading}
        />
      </section>

      {/* ── Charts Row 1: Trends (full width) ───────────────────────────────── */}
      <section className="dashboard__charts-row dashboard__charts-row--full">
        <ChartWrapper
          title="Metric Trends"
          subtitle={`Granularity: ${trends.data?.granularity ?? "—"}`}
          isLoading={trends.isLoading}
          error={trends.error}
          action={trends.data ? <ExportButton data={trends.data.series} filename="metric-trends.csv" /> : null}
        >
          {trends.data && (
            <LineChartComponent
              data={trends.data.series}
              granularity={trends.data.granularity}
            />
          )}
        </ChartWrapper>
      </section>

      {/* ── Charts Row 2: Top Pages + Click Distribution ─────────────────────── */}
      <section className="dashboard__charts-row dashboard__charts-row--split">
        <ChartWrapper
          title="Top Pages"
          subtitle="by view count"
          isLoading={topPages.isLoading}
          error={topPages.error}
          action={topPages.data ? <ExportButton data={topPages.data.pages} filename="top-pages.csv" /> : null}
        >
          {topPages.data && (
            <BarChartComponent data={topPages.data.pages} />
          )}
        </ChartWrapper>

        <ChartWrapper
          title="Click Distribution"
          subtitle={
            clickMetrics.data
              ? `${clickMetrics.data.total.toLocaleString()} total events`
              : undefined
          }
          isLoading={clickMetrics.isLoading}
          error={clickMetrics.error}
          action={clickMetrics.data ? <ExportButton data={clickMetrics.data.distribution} filename="click-distribution.csv" /> : null}
        >
          {clickMetrics.data && (
            <PieChartComponent
              data={clickMetrics.data.distribution}
              total={clickMetrics.data.total}
            />
          )}
        </ChartWrapper>
      </section>

      {/* ── Charts Row 3: Geographic Distribution ───────────────────────────── */}
      <section className="dashboard__charts-row dashboard__charts-row--full">
        <ChartWrapper
          title="Geographic Distribution"
          subtitle="User activity by country"
          isLoading={geoMetrics.isLoading}
          error={geoMetrics.error}
          action={geoMetrics.data ? <ExportButton data={geoMetrics.data.data} filename="geo-distribution.csv" /> : null}
        >
          {geoMetrics.data && (
            <GeoMapComponent data={geoMetrics.data.data} />
          )}
        </ChartWrapper>
      </section>
    </div>
  );
}
