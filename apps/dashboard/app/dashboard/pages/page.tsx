"use client";

import React, { useCallback, useState } from "react";

import DashboardFiltersPanel from "@/components/DashboardFiltersPanel";
import { buildDefaultFilters } from "@/components/FilterBar";
import MetricCard from "@/components/MetricCard";
import ChartWrapper from "@/components/ChartWrapper";
import ExportButton from "@/components/ExportButton";
import LineChartComponent from "@/components/LineChartComponent";
import BarChartComponent from "@/components/BarChartComponent";
import { useOverviewMetrics } from "@/hooks/useOverviewMetrics";
import { useTopPages } from "@/hooks/useTopPages";
import { useTrends } from "@/hooks/useTrends";
import { ApiFilters } from "@/services/api";

const IconPages = () => <span aria-hidden>▤</span>;
const IconSessions = () => <span aria-hidden>⊚</span>;
const IconRank = () => <span aria-hidden>≡</span>;

export default function PagesPage() {
  const [filters, setFilters] = useState<ApiFilters>(buildDefaultFilters);

  const handleFiltersChange = useCallback((nextFilters: ApiFilters) => {
    setFilters(nextFilters);
  }, []);

  const overview = useOverviewMetrics(filters);
  const topPages = useTopPages(filters);
  const trends = useTrends(filters);

  const rankedPages = topPages.data?.pages ?? [];
  const anyLoading =
    overview.isLoading || topPages.isLoading || trends.isLoading;

  return (
    <div className="dashboard">
      <section className="section-hero" aria-label="Pages overview">
        <p className="section-hero__eyebrow">Content Performance</p>
        <h2 className="section-hero__title">Pages</h2>
        <p className="section-hero__description">
          Page-level view ranking now reads real backend metrics instead of placeholder totals.
        </p>
      </section>

      <DashboardFiltersPanel
        title="Page query"
        subtitle="Slice page traffic by date range, then inspect ranking and traffic trend."
        onFiltersChange={handleFiltersChange}
        isLoading={anyLoading}
      />

      <section className="dashboard__metrics" aria-label="Page metrics">
        <MetricCard
          metric={
            overview.data?.pageViews ?? {
              label: "Page Views",
              value: 0,
              contextLabel: "Live page_view count",
            }
          }
          icon={<IconPages />}
          isLoading={overview.isLoading}
        />
        <MetricCard
          metric={
            overview.data?.sessions ?? {
              label: "Sessions",
              value: 0,
              contextLabel: "Unique sessions in range",
            }
          }
          icon={<IconSessions />}
          isLoading={overview.isLoading}
        />
        <MetricCard
          metric={{
            label: "Ranked Pages",
            value: rankedPages.length,
            contextLabel: "Returned by top-pages endpoint",
          }}
          icon={<IconRank />}
          isLoading={topPages.isLoading}
        />
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--split">
        <ChartWrapper
          title="Top pages"
          subtitle="Ranked by backend view count"
          isLoading={topPages.isLoading}
          error={topPages.error}
          action={
            topPages.data
              ? <ExportButton data={topPages.data.pages} filename="page-ranking.csv" />
              : null
          }
        >
          {rankedPages.length ? (
            <BarChartComponent data={rankedPages} />
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No ranked pages in range</p>
              <p className="empty-state__text">
                Page ranking fills after SDK sends `page_view` events for selected dates.
              </p>
            </div>
          )}
        </ChartWrapper>

        <ChartWrapper
          title="Page activity trend"
          subtitle={`Granularity: ${trends.data?.granularity ?? "—"}`}
          isLoading={trends.isLoading}
          error={trends.error}
          action={
            trends.data
              ? <ExportButton data={trends.data.series} filename="page-activity.csv" />
              : null
          }
        >
          {trends.data?.series.length ? (
            <LineChartComponent
              data={trends.data.series}
              granularity={trends.data.granularity}
              series={[
                { key: "pageViews", label: "Page Views", color: "#00d4ff" },
                { key: "sessions", label: "Sessions", color: "#a78bfa" },
              ]}
            />
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No page activity points</p>
              <p className="empty-state__text">
                Trend line appears after backend has timestamped page data in selected range.
              </p>
            </div>
          )}
        </ChartWrapper>
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--full">
        <ChartWrapper
          title="Page ranking detail"
          subtitle="Current top paths and view totals"
          isLoading={topPages.isLoading}
          error={topPages.error}
        >
          {rankedPages.length ? (
            <ul className="insight-list" role="list">
              {rankedPages.map((page) => (
                <li key={page.path} className="insight-list__item">
                  <div>
                    <p className="insight-list__label">{page.path}</p>
                    <p className="insight-list__note">Path normalized from backend page URL</p>
                  </div>
                  <span className="insight-list__value">{page.views.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No page paths returned</p>
              <p className="empty-state__text">
                Top page list will render here once backend sees page URLs for this workspace.
              </p>
            </div>
          )}
        </ChartWrapper>
      </section>
    </div>
  );
}
