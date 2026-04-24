import { z } from "zod";

const rankedMetricSchema = z.object({
  key: z.string().min(1),
  count: z.number().int().nonnegative(),
});

const timeseriesPointSchema = z.object({
  ts: z.string().datetime({ offset: true }),
  pageViews: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  sessions: z.number().int().nonnegative(),
});

export const metricSummaryPayloadSchema = z.object({
  rangeStart: z.string().datetime({ offset: true }),
  rangeEnd: z.string().datetime({ offset: true }),
  totalPageViews: z.number().int().nonnegative(),
  totalClicks: z.number().int().nonnegative(),
  uniqueSessions: z.number().int().nonnegative().default(0),
  uniqueVisitors: z.number().int().nonnegative().default(0),
  avgSessionDurationSec: z.number().nonnegative().default(0),
  bounceRate: z.number().min(0).max(1).default(0),
  topPages: z.array(rankedMetricSchema).default([]),
  topElements: z.array(rankedMetricSchema).default([]),
  geoBreakdown: z.array(rankedMetricSchema).default([]),
  timeseries: z.array(timeseriesPointSchema).default([]),
  generatedAt: z.string().datetime({ offset: true }),
});

export const analyzerEventsQuerySchema = z.object({
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
});

export const analyzerCheckpointPayloadSchema = z.object({
  lastProcessedAt: z.string().datetime({ offset: true }),
});

export type MetricSummaryPayload = z.infer<typeof metricSummaryPayloadSchema>;
