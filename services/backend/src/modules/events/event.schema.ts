import { z } from "zod";

export const eventPayloadSchema = z.object({
  apiKey: z.string().min(1),
  sessionId: z.string().min(1),
  eventName: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  url: z.string().url(),
  userAgent: z.string().default(""),
  properties: z.record(z.unknown()).default({}),
  element: z
    .object({
      tagName: z.string().optional(),
      id: z.string().optional(),
      classes: z.array(z.string()).default([]),
      text: z.string().optional()
    })
    .optional()
});

export type EventPayload = z.infer<typeof eventPayloadSchema>;
