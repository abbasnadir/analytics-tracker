"use client";

import React, { useCallback, useMemo, useState } from "react";

import DashboardFiltersPanel from "@/components/DashboardFiltersPanel";
import { buildDefaultFilters } from "@/components/FilterBar";
import MetricCard from "@/components/MetricCard";
import ChartWrapper from "@/components/ChartWrapper";
import LineChartComponent from "@/components/LineChartComponent";
import ExportButton from "@/components/ExportButton";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useOverviewMetrics } from "@/hooks/useOverviewMetrics";
import { useTrends } from "@/hooks/useTrends";
import { ApiFilters } from "@/services/api";

const IconViews = () => <span aria-hidden>◈</span>;
const IconClicks = () => <span aria-hidden>⬡</span>;
const IconSessions = () => <span aria-hidden>⊚</span>;

export default function FunnelsPage() {
  const [filters, setFilters] = useState<ApiFilters>(buildDefaultFilters);

  const handleFiltersChange = useCallback((nextFilters: ApiFilters) => {
    setFilters(nextFilters);
  }, []);

  const health = useBackendHealth();
  const overview = useOverviewMetrics(filters);
  const trends = useTrends(filters);
  const anyLoading = health.isLoading || overview.isLoading || trends.isLoading;

  const readiness = useMemo(
    () => [
      {
        label: "Backend API",
        value: health.data?.status === "ok" ? "Connected" : "Unavailable",
        note: health.error?.message ?? "Serving dashboard routes",
      },
      {
        label: "MongoDB",
        value: health.data?.db?.connected ? "Connected" : "Pending",
        note:
          typeof health.data?.db?.latencyMs === "number"
            ? `${health.data.db.latencyMs} ms latency`
            : "Waiting for ping data",
      },
      {
        label: "Analyzer summary",
        value: overview.data?.generatedAt ? "Available" : "Pending",
        note: overview.data?.generatedAt
          ? `Last generated ${new Date(overview.data.generatedAt).toLocaleString()}`
          : "No summary timestamp yet",
      },
    ],
    [health.data, health.error, overview.data],
  );

  return (
    <div className="dashboard">
      <section className="section-hero" aria-label="Funnels overview">
        <p className="section-hero__eyebrow">Integration Status</p>
        <h2 className="section-hero__title">Funnels</h2>
        <p className="section-hero__description">
          Fake funnel KPIs removed. This route now shows honest integration state until
          backend and analyzer expose funnel-specific summaries.
        </p>
      </section>

      <DashboardFiltersPanel
        title="Funnel prerequisites"
        subtitle="Current backend-backed signals available for future funnel analysis."
        onFiltersChange={handleFiltersChange}
        isLoading={anyLoading}
      />

      <section className="dashboard__metrics" aria-label="Available live metrics">
        <MetricCard
          metric={
            overview.data?.pageViews ?? {
              label: "Page Views",
              value: 0,
              contextLabel: "Tracked prerequisite signal",
            }
          }
          icon={<IconViews />}
          isLoading={overview.isLoading}
        />
        <MetricCard
          metric={
            overview.data?.clicks ?? {
              label: "Clicks",
              value: 0,
              contextLabel: "Tracked prerequisite signal",
            }
          }
          icon={<IconClicks />}
          isLoading={overview.isLoading}
        />
        <MetricCard
          metric={
            overview.data?.sessions ?? {
              label: "Sessions",
              value: 0,
              contextLabel: "Tracked prerequisite signal",
            }
          }
          icon={<IconSessions />}
          isLoading={overview.isLoading}
        />
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--split">
        <ChartWrapper
          title="Funnel data status"
          subtitle="Truthful state of this route"
          isLoading={health.isLoading}
          error={health.error}
        >
          <div className="empty-state empty-state--compact">
            <p className="empty-state__title">No funnel endpoint wired yet</p>
            <p className="empty-state__text">
              Dashboard can already read overview, timeseries, pages, clicks, geo, and sessions.
              It cannot show real conversion-step analytics until backend/analyzer ship funnel summary contract.
            </p>
          </div>
        </ChartWrapper>

        <ChartWrapper
          title="Source trend"
          subtitle={`Granularity: ${trends.data?.granularity ?? "—"}`}
          isLoading={trends.isLoading}
          error={trends.error}
          action={
            trends.data
              ? <ExportButton data={trends.data.series} filename="funnel-source-trend.csv" />
              : null
          }
        >
          {trends.data?.series.length ? (
            <LineChartComponent
              data={trends.data.series}
              granularity={trends.data.granularity}
            />
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No source trend data</p>
              <p className="empty-state__text">
                Future funnel charts will build on these same tracked events and sessions.
              </p>
            </div>
          )}
        </ChartWrapper>
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--full">
        <ChartWrapper
          title="Readiness checks"
          subtitle="Live backend, DB, and analyzer checkpoints"
          isLoading={health.isLoading && !health.data}
          error={health.error}
        >
          <div className="status-grid">
            {readiness.map((item) => (
              <div key={item.label} className="status-card">
                <p className="status-card__label">{item.label}</p>
                <p className="status-card__value">{item.value}</p>
                <p className="status-card__note">{item.note}</p>
              </div>
            ))}
          </div>
        </ChartWrapper>
      </section>
    </div>
  );
}
