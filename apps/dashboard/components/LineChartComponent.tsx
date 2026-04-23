"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendDataPoint } from "@/services/api";
import { formatTimestamp, formatNumber } from "@/utils/formatters";

interface SeriesConfig {
  key: string;         // key in TrendDataPoint
  label: string;       // display label
  color: string;       // hex color
}

interface LineChartComponentProps {
  data: TrendDataPoint[];
  granularity?: "hour" | "day" | "week" | "month";
  /** Which series to render — extensible, not hardcoded */
  series?: SeriesConfig[];
}

const DEFAULT_SERIES: SeriesConfig[] = [
  { key: "pageViews", label: "Page Views", color: "#00d4ff" },
  { key: "clicks",    label: "Clicks",     color: "#f59e0b" },
  { key: "sessions",  label: "Sessions",   color: "#a78bfa" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: entry.color }} />
          <span className="chart-tooltip__name">{entry.name}</span>
          <span className="chart-tooltip__value">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * LineChartComponent
 * ------------------
 * Renders a multi-series line chart from TrendDataPoint[].
 * Series are configurable — not hardcoded to specific metric names.
 */
export default function LineChartComponent({
  data,
  granularity = "day",
  series = DEFAULT_SERIES,
}: LineChartComponentProps) {
  const formatted = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        _label: formatTimestamp(point.timestamp, granularity),
      })),
    [data, granularity]
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="_label"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatNumber}
          tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)", paddingTop: 16 }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
