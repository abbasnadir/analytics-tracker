import { Schema, model } from "mongoose";

type RankedMetric = {
  key: string;
  count: number;
};

type MetricSummaryDocument = {
  tenantId: string;
  rangeStart: string;
  rangeEnd: string;
  totalPageViews: number;
  totalClicks: number;
  topPages: RankedMetric[];
  topElements: RankedMetric[];
  generatedAt: string;
  createdAt: Date;
  updatedAt: Date;
};

const rankedMetricSchema = new Schema<RankedMetric>(
  {
    key: { type: String, required: true },
    count: { type: Number, required: true }
  },
  { _id: false }
);

const metricSummarySchema = new Schema<MetricSummaryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    rangeStart: { type: String, required: true },
    rangeEnd: { type: String, required: true },
    totalPageViews: { type: Number, required: true },
    totalClicks: { type: Number, required: true },
    topPages: { type: [rankedMetricSchema], default: [] },
    topElements: { type: [rankedMetricSchema], default: [] },
    generatedAt: { type: String, required: true }
  },
  { timestamps: true, collection: "metric_summaries" }
);

export const MetricSummaryModel = model<MetricSummaryDocument>("MetricSummary", metricSummarySchema);
