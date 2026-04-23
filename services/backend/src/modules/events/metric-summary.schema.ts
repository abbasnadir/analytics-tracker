import { z } from "zod";

const rankedMetricSchema = z.object({
  key: z.string().min(1),
  count: z.number().int().nonnegative()
});

export const metricSummaryPayloadSchema = z.object({
  rangeStart: z.string().datetime({ offset: true }),
  rangeEnd: z.string().datetime({ offset: true }),
  totalPageViews: z.number().int().nonnegative(),
  totalClicks: z.number().int().nonnegative(),
  topPages: z.array(rankedMetricSchema).default([]),
  topElements: z.array(rankedMetricSchema).default([]),
  generatedAt: z.string().datetime({ offset: true })
});

export const analyzerEventsQuerySchema = z.object({
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true })
});

export type MetricSummaryPayload = z.infer<typeof metricSummaryPayloadSchema>;
