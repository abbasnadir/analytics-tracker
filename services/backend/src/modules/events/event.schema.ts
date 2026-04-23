import { z } from "zod";

const elementSchema = z.object({
  tagName: z.string().optional(),
  id: z.string().optional(),
  classes: z.array(z.string()).default([]),
  text: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const eventPayloadSchema = z.object({
  schemaVersion: z.string().default("1.0"),
  apiKey: z.string().min(1),
  scriptId: z.string().default("default"),
  sessionId: z.string().min(1),
  eventId: z.string().uuid().optional(),
  eventName: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  url: z.string().url(),
  path: z.string().optional(),
  referrer: z.string().url().optional(),
  userAgent: z.string().default(""),
  viewport: z
    .object({
      w: z.number().int().positive(),
      h: z.number().int().positive(),
    })
    .optional(),
  screen: z
    .object({
      w: z.number().int().positive(),
      h: z.number().int().positive(),
    })
    .optional(),
  tzOffsetMin: z.number().int().optional(),
  locale: z.string().optional(),
  properties: z.record(z.unknown()).default({}),
  element: elementSchema.optional(),
});

export const eventBatchPayloadSchema = z.object({
  sentAt: z.string().datetime({ offset: true }),
  sdkVersion: z.string().min(1),
  events: z.array(eventPayloadSchema).min(1).max(50),
});

export const metricRangeQuerySchema = z.object({
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  limit: z.coerce.number().int().positive().max(100).default(5),
});

export const timeseriesQuerySchema = z.object({
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  interval: z.enum(["hour", "day"]),
  eventName: z.string().optional(),
});

export const overviewRangeQuerySchema = z
  .object({
    start: z.string().datetime({ offset: true }).optional(),
    end: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (value) => (value.start && value.end) || (!value.start && !value.end),
    {
      message: "start and end must be provided together",
    },
  );

export type EventPayload = z.infer<typeof eventPayloadSchema>;
export type EventBatchPayload = z.infer<typeof eventBatchPayloadSchema>;
export type MetricRangeQuery = z.infer<typeof metricRangeQuerySchema>;
export type TimeseriesQuery = z.infer<typeof timeseriesQuerySchema>;
export type OverviewRangeQuery = z.infer<typeof overviewRangeQuerySchema>;
