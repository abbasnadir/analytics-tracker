"use client";

import React, { useCallback, useState } from "react";

import DashboardFiltersPanel from "@/components/DashboardFiltersPanel";
import { buildDefaultFilters } from "@/components/FilterBar";
import MetricCard from "@/components/MetricCard";
import ChartWrapper from "@/components/ChartWrapper";
import ExportButton from "@/components/ExportButton";
import LineChartComponent from "@/components/LineChartComponent";
import PieChartComponent from "@/components/PieChartComponent";
import { useClickMetrics } from "@/hooks/useClickMetrics";
import { useOverviewMetrics } from "@/hooks/useOverviewMetrics";
import { useTrends } from "@/hooks/useTrends";
import { ApiFilters } from "@/services/api";

const IconViews = () => <span aria-hidden>◈</span>;
const IconClicks = () => <span aria-hidden>⬡</span>;
const IconTargets = () => <span aria-hidden>◎</span>;

export default function EventsPage() {
  const [filters, setFilters] = useState<ApiFilters>(buildDefaultFilters);

  const handleFiltersChange = useCallback((nextFilters: ApiFilters) => {
    setFilters(nextFilters);
  }, []);

  const overview = useOverviewMetrics(filters);
  const clickMetrics = useClickMetrics(filters);
  const trends = useTrends(filters);

  const topTargets = clickMetrics.data?.distribution ?? [];
  const anyLoading =
    overview.isLoading || clickMetrics.isLoading || trends.isLoading;

  return (
    <div className="dashboard">
      <section className="section-hero" aria-label="Events overview">
        <p className="section-hero__eyebrow">Live Event Analytics</p>
        <h2 className="section-hero__title">Events</h2>
        <p className="section-hero__description">
          Real backend metrics for event volume, click hotspots, and change over time.
          Fake counters removed.
        </p>
      </section>

      <DashboardFiltersPanel
        title="Event query"
        subtitle="Filter tracked events, then inspect live totals and interaction mix."
        onFiltersChange={handleFiltersChange}
        isLoading={anyLoading}
      />

      <section className="dashboard__metrics" aria-label="Event metrics">
        <MetricCard
          metric={
            overview.data?.pageViews ?? {
              label: "Page Views",
              value: 0,
              contextLabel: "Live event volume",
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
              contextLabel: "Live click volume",
            }
          }
          icon={<IconClicks />}
          isLoading={overview.isLoading}
        />
        <MetricCard
          metric={{
            label: "Click Targets",
            value: topTargets.length,
            contextLabel: "Unique click labels in selected range",
          }}
          icon={<IconTargets />}
          isLoading={clickMetrics.isLoading}
        />
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--split">
        <ChartWrapper
          title="Event trend"
          subtitle={`Granularity: ${trends.data?.granularity ?? "—"}`}
          isLoading={trends.isLoading}
          error={trends.error}
          action={
            trends.data
              ? <ExportButton data={trends.data.series} filename="event-trends.csv" />
              : null
          }
        >
          {trends.data?.series.length ? (
            <LineChartComponent
              data={trends.data.series}
              granularity={trends.data.granularity}
              series={[
                { key: "pageViews", label: "Page Views", color: "#00d4ff" },
                { key: "clicks", label: "Clicks", color: "#f59e0b" },
              ]}
            />
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No event points in range</p>
              <p className="empty-state__text">
                SDK data will appear here after backend receives matching page views or clicks.
              </p>
            </div>
          )}
        </ChartWrapper>

        <ChartWrapper
          title="Click distribution"
          subtitle={
            clickMetrics.data
              ? `${clickMetrics.data.total.toLocaleString()} click events ranked`
              : "Top clicked elements"
          }
          isLoading={clickMetrics.isLoading}
          error={clickMetrics.error}
          action={
            clickMetrics.data
              ? <ExportButton data={clickMetrics.data.distribution} filename="click-targets.csv" />
              : null
          }
        >
          {clickMetrics.data?.distribution.length ? (
            <PieChartComponent
              data={clickMetrics.data.distribution}
              total={clickMetrics.data.total}
            />
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No click targets yet</p>
              <p className="empty-state__text">
                Click breakdown stays empty until SDK click events reach backend for this range.
              </p>
            </div>
          )}
        </ChartWrapper>
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--full">
        <ChartWrapper
          title="Top click labels"
          subtitle="Backend-ranked interaction targets"
          isLoading={clickMetrics.isLoading}
          error={clickMetrics.error}
        >
          {topTargets.length ? (
            <ul className="insight-list" role="list">
              {topTargets.map((item) => (
                <li key={item.label} className="insight-list__item">
                  <div>
                    <p className="insight-list__label">{item.label}</p>
                    <p className="insight-list__note">{item.percentage.toFixed(1)}% of click events</p>
                  </div>
                  <span className="insight-list__value">{item.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No ranked click elements</p>
              <p className="empty-state__text">
                Element IDs, text, or tag names will rank here once click data exists.
              </p>
            </div>
          )}
        </ChartWrapper>
      </section>
    </div>
  );
}
