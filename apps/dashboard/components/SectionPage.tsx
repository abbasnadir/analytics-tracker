import React from "react";

import ChartWrapper from "@/components/ChartWrapper";
import MetricCard from "@/components/MetricCard";

interface SectionPageProps {
  title: string;
  description: string;
  primaryMetricLabel: string;
  primaryMetricValue: number;
  secondaryMetricLabel: string;
  secondaryMetricValue: number;
  tertiaryMetricLabel: string;
  tertiaryMetricValue: number;
  chartTitle: string;
  chartSubtitle: string;
  bullets: string[];
}

const EmptyIcon = () => <span aria-hidden>*</span>;

export default function SectionPage({
  title,
  description,
  primaryMetricLabel,
  primaryMetricValue,
  secondaryMetricLabel,
  secondaryMetricValue,
  tertiaryMetricLabel,
  tertiaryMetricValue,
  chartTitle,
  chartSubtitle,
  bullets,
}: SectionPageProps) {
  return (
    <div className="dashboard">
      <section className="section-hero" aria-label={`${title} overview`}>
        <p className="section-hero__eyebrow">Analytics Workspace</p>
        <h2 className="section-hero__title">{title}</h2>
        <p className="section-hero__description">{description}</p>
      </section>

      <section className="dashboard__metrics" aria-label={`${title} summary`}>
        <MetricCard
          metric={{
            label: primaryMetricLabel,
            value: primaryMetricValue,
            delta: 12.4,
            trend: "up",
          }}
          icon={<EmptyIcon />}
        />
        <MetricCard
          metric={{
            label: secondaryMetricLabel,
            value: secondaryMetricValue,
            delta: 3.2,
            trend: "up",
          }}
          icon={<EmptyIcon />}
        />
        <MetricCard
          metric={{
            label: tertiaryMetricLabel,
            value: tertiaryMetricValue,
            delta: -1.8,
            trend: "down",
          }}
          icon={<EmptyIcon />}
        />
      </section>

      <section className="dashboard__charts-row dashboard__charts-row--split">
        <ChartWrapper title={chartTitle} subtitle={chartSubtitle}>
          <div className="section-panel">
            <p className="section-panel__title">This section is now live</p>
            <p className="section-panel__text">
              The route exists and is ready for section-specific charts or tables next.
            </p>
          </div>
        </ChartWrapper>

        <ChartWrapper title="Next focus" subtitle="Suggested expansion">
          <div className="section-panel">
            <p className="section-panel__title">Suggested widgets</p>
            <ul className="section-panel__list">
              {bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        </ChartWrapper>
      </section>
    </div>
  );
}
