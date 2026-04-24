"use client";

import React, { useCallback, useMemo, useState } from "react";

import DashboardFiltersPanel from "@/components/DashboardFiltersPanel";
import { buildDefaultFilters } from "@/components/FilterBar";
import MetricCard from "@/components/MetricCard";
import ChartWrapper from "@/components/ChartWrapper";
import ExportButton from "@/components/ExportButton";
import LineChartComponent from "@/components/LineChartComponent";
import { useSessionMetrics } from "@/hooks/useSessionMetrics";
import { useTrends } from "@/hooks/useTrends";
import { ApiFilters } from "@/services/api";
import { formatDuration } from "@/utils/formatters";

const IconSessions = () => <span aria-hidden>⊚</span>;
const IconDuration = () => <span aria-hidden>⌛</span>;
const IconBounce = () => <span aria-hidden>↺</span>;

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function RetentionPage() {
  const [filters, setFilters] = useState<ApiFilters>(buildDefaultFilters);

  const handleFiltersChange = useCallback((nextFilters: ApiFilters) => {
    setFilters(nextFilters);
  }, []);

  const sessionMetrics = useSessionMetrics(filters);
  const trends = useTrends(filters);
  const anyLoading = sessionMetrics.isLoading || trends.isLoading;

  const recentSessions = useMemo(
    () => sessionMetrics.data?.sessions.slice(0, 8) ?? [],
    [sessionMetrics.data],
  );

  return (
    <div className="dashboard">
      <section className="section-hero" aria-label="Retention overview">
        <p className="section-hero__eyebrow">Session Quality</p>
        <h2 className="section-hero__title">Retention</h2>
        <p className="section-hero__description">
          This route now uses real session analytics from backend. No more invented
          returning-user or churn numbers.
        </p>
      </section>

      <DashboardFiltersPanel
        title="Session query"
        subtitle="Inspect live session count, duration, bounce rate, and recent session detail."
        onFiltersChange={handleFiltersChange}
        isLoading={anyLoading}
      />

      <section className="dashboard__metrics" aria-label="Retention metrics">
        <MetricCard
          metric={{
            label: "Sessions",
            value: sessionMetrics.data?.totalSessions ?? 0,
            contextLabel: "Sessions in selected range",
          }}
          icon={<IconSessions />}
          isLoading={sessionMetrics.isLoading}
        />
        <MetricCard
          metric={{
            label: "Avg. Duration",
            value: sessionMetrics.data?.avgSessionDurationSec ?? 0,
            contextLabel: "Average session length",
          }}
          icon={<IconDuration />}
          isLoading={sessionMetrics.isLoading}
          valueFormatter={formatDuration}
        />
        <MetricCard
          metric={{
            label: "Bounce Rate",
            value: (sessionMetrics.data?.bounceRate ?? 0) * 100,
            contextLabel: "Single-page sessions",
          }}
          icon={<IconBounce />}
          isLoading={sessionMetrics.isLoading}
          valueFormatter={formatPercent}
        />
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--split">
        <ChartWrapper
          title="Session trend"
          subtitle={`Granularity: ${trends.data?.granularity ?? "—"}`}
          isLoading={trends.isLoading}
          error={trends.error}
          action={
            trends.data
              ? <ExportButton data={trends.data.series} filename="session-trend.csv" />
              : null
          }
        >
          {trends.data?.series.length ? (
            <LineChartComponent
              data={trends.data.series}
              granularity={trends.data.granularity}
              series={[
                { key: "sessions", label: "Sessions", color: "#a78bfa" },
              ]}
            />
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No session trend points</p>
              <p className="empty-state__text">
                Session timeseries appears after backend receives timestamped activity in this range.
              </p>
            </div>
          )}
        </ChartWrapper>

        <ChartWrapper
          title="Recent sessions"
          subtitle="Latest session snapshots from backend"
          isLoading={sessionMetrics.isLoading}
          error={sessionMetrics.error}
          action={
            sessionMetrics.data
              ? <ExportButton data={sessionMetrics.data.sessions} filename="sessions.csv" />
              : null
          }
        >
          {recentSessions.length ? (
            <ul className="insight-list" role="list">
              {recentSessions.map((session) => (
                <li key={session.sessionId} className="insight-list__item insight-list__item--stack">
                  <div className="insight-list__content">
                    <p className="insight-list__label">{session.sessionId}</p>
                    <p className="insight-list__note">
                      {session.pageViews} page views · {session.clicks} clicks · started {new Date(session.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="insight-list__meta">
                    {formatDuration(session.durationSec)}{session.bounced ? " · bounced" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No session rows returned</p>
              <p className="empty-state__text">
                Once events land, backend will group them into sessions and list them here.
              </p>
            </div>
          )}
        </ChartWrapper>
      </section>
    </div>
  );
}
