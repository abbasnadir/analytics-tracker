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
  uniqueSessions: number;
  uniqueVisitors: number;
  avgSessionDurationSec: number;
  bounceRate: number;
  topPages: RankedMetric[];
  topElements: RankedMetric[];
  geoBreakdown: RankedMetric[];
  timeseries: Array<{
    ts: string;
    pageViews: number;
    clicks: number;
    sessions: number;
  }>;
  generatedAt: string;
  createdAt: Date;
  updatedAt: Date;
};

const rankedMetricSchema = new Schema<RankedMetric>(
  {
    key: { type: String, required: true },
    count: { type: Number, required: true },
  },
  { _id: false },
);

const metricSummarySchema = new Schema<MetricSummaryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    rangeStart: { type: String, required: true },
    rangeEnd: { type: String, required: true },
    totalPageViews: { type: Number, required: true },
    totalClicks: { type: Number, required: true },
    uniqueSessions: { type: Number, required: true, default: 0 },
    uniqueVisitors: { type: Number, required: true, default: 0 },
    avgSessionDurationSec: { type: Number, required: true, default: 0 },
    bounceRate: { type: Number, required: true, default: 0 },
    topPages: { type: [rankedMetricSchema], default: [] },
    topElements: { type: [rankedMetricSchema], default: [] },
    geoBreakdown: { type: [rankedMetricSchema], default: [] },
    timeseries: {
      type: [
        {
          _id: false,
          ts: { type: String, required: true },
          pageViews: { type: Number, required: true },
          clicks: { type: Number, required: true },
          sessions: { type: Number, required: true },
        },
      ],
      default: [],
    },
    generatedAt: { type: String, required: true },
  },
  { timestamps: true, collection: "metric_summaries" },
);

metricSummarySchema.index(
  { tenantId: 1, rangeStart: 1, rangeEnd: 1 },
  { unique: true },
);
metricSummarySchema.index({ tenantId: 1, generatedAt: -1 });

export const MetricSummaryModel = model<MetricSummaryDocument>(
  "MetricSummary",
  metricSummarySchema,
);
