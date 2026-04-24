"use client";

import React from "react";
import { OverviewMetric } from "@/services/api";
import { formatNumber, formatDelta } from "@/utils/formatters";

interface MetricCardProps {
  metric: OverviewMetric;
  icon: React.ReactNode;
  isLoading?: boolean;
  valueFormatter?: (value: number) => string;
}

/**
 * MetricCard
 * ----------
 * Displays a single KPI: label, value, and period-over-period delta.
 * Accepts any OverviewMetric — not tied to specific metric names.
 */
export default function MetricCard({
  metric,
  icon,
  isLoading,
  valueFormatter = formatNumber,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="metric-card metric-card--skeleton" aria-busy="true">
        <div className="skeleton skeleton--icon" />
        <div className="skeleton skeleton--label" />
        <div className="skeleton skeleton--value" />
        <div className="skeleton skeleton--delta" />
      </div>
    );
  }

  const isPositive = metric.trend === "up";
  const isNegative = metric.trend === "down";
  const hasDelta = typeof metric.delta === "number";

  return (
    <div className="metric-card" role="region" aria-label={metric.label}>
      <div className="metric-card__header">
        <span className="metric-card__icon">{icon}</span>
        <span className="metric-card__label">{metric.label}</span>
      </div>

      <div className="metric-card__value" aria-live="polite">
        {valueFormatter(metric.value)}
      </div>

      {hasDelta ? (
        <div
          className={`metric-card__delta ${
            isPositive ? "metric-card__delta--up" : isNegative ? "metric-card__delta--down" : ""
          }`}
        >
          <span className="metric-card__delta-arrow">
            {isPositive ? "▲" : isNegative ? "▼" : "—"}
          </span>
          <span>{formatDelta(metric.delta ?? 0)}</span>
          <span className="metric-card__delta-label">vs last period</span>
        </div>
      ) : (
        <div className="metric-card__context">{metric.contextLabel ?? "Live backend metric"}</div>
      )}

      {/* Subtle animated accent bar */}
      <div
        className={`metric-card__bar ${isPositive ? "metric-card__bar--positive" : isNegative ? "metric-card__bar--negative" : ""}`}
      />
    </div>
  );
}
