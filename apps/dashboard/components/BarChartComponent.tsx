"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TopPage } from "@/services/api";
import { formatNumber, formatDuration } from "@/utils/formatters";

interface BarChartComponentProps {
  data: TopPage[];
  /** Max number of pages to display */
  limit?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: TopPage = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label" style={{ marginBottom: 8 }}>{d.path}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__dot" style={{ background: "#00d4ff" }} />
        <span className="chart-tooltip__name">Views</span>
        <span className="chart-tooltip__value">{formatNumber(d.views)}</span>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__dot" style={{ background: "#f59e0b" }} />
        <span className="chart-tooltip__name">Avg. Duration</span>
        <span className="chart-tooltip__value">
          {typeof d.avgDuration === "number" ? formatDuration(d.avgDuration) : "—"}
        </span>
      </div>
    </div>
  );
};

/**
 * BarChartComponent
 * -----------------
 * Renders a horizontal bar chart of top pages by view count.
 * Accepts generic TopPage[] — not coupled to any specific field naming.
 */
export default function BarChartComponent({ data, limit = 8 }: BarChartComponentProps) {
  const sliced = data.slice(0, limit);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={sliced}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        barSize={12}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0072ff" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatNumber}
          tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="path"
          width={120}
          tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="views" radius={[0, 4, 4, 0]} fill="url(#barGrad)">
          {sliced.map((_, i) => (
            <Cell key={i} fillOpacity={1 - i * 0.07} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
