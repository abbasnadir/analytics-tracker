"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { ClickDataPoint } from "@/services/api";

interface PieChartComponentProps {
  data: ClickDataPoint[];
  total: number;
}

const COLORS = ["#00d4ff", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#60a5fa"];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--color-text)" fontSize={18} fontFamily="var(--font-mono)" fontWeight={600}>
        {(percent * 100).toFixed(1)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--color-text-muted)" fontSize={11} fontFamily="var(--font-body)">
        {payload.label}
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

/**
 * PieChartComponent
 * -----------------
 * Renders a donut chart of click distribution.
 * Interactive: hover a slice to see its label and percentage centered.
 */
export default function PieChartComponent({ data, total }: PieChartComponentProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="pie-chart-layout">
      <div className="pie-chart-layout__chart">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={108}
            dataKey="count"
            nameKey="label"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      </div>

      {/* Legend */}
      <ul className="pie-legend" role="list">
        {data.map((item, i) => (
          <li
            key={item.label}
            className={`pie-legend__item ${i === activeIndex ? "pie-legend__item--active" : ""}`}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <span className="pie-legend__dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="pie-legend__label">{item.label}</span>
            <span className="pie-legend__value">{item.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
