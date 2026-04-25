import { Schema, model } from "mongoose";
import { env } from "../../config/env.js";
import type { EventPayload } from "./event.schema.js";

type EventDocument = EventPayload & {
  tenantId: string;
  receivedAt: string;
  ingestedAt: string;
  createdAt: Date;
  updatedAt: Date;
};

const eventSchema = new Schema<EventDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    apiKey: { type: String, required: true },
    schemaVersion: { type: String, required: true, default: "1.0" },
    scriptId: { type: String, required: true, default: "default" },
    sessionId: { type: String, required: true, index: true },
    visitorId: { type: String, required: false, index: true },
    eventId: { type: String, required: true },
    eventName: { type: String, required: true, index: true },
    timestamp: { type: String, required: true, index: true },
    receivedAt: { type: String, required: true },
    ingestedAt: { type: String, required: true },
    url: { type: String, required: true },
    path: { type: String, required: false },
    referrer: { type: String, required: false },
    userAgent: { type: String, required: true },
    viewport: {
      w: Number,
      h: Number,
    },
    screen: {
      w: Number,
      h: Number,
    },
    tzOffsetMin: Number,
    timeZone: String,
    locale: String,
    countryCode: String,
    properties: { type: Schema.Types.Mixed, default: {} },
    element: {
      tagName: String,
      id: String,
      classes: [String],
      text: String,
      x: Number,
      y: Number,
    },
  },
  {
    timestamps: true,
    collection: "events_raw",
  },
);

eventSchema.index({ tenantId: 1, timestamp: 1 });
eventSchema.index({ tenantId: 1, sessionId: 1, timestamp: 1 });
eventSchema.index({ tenantId: 1, visitorId: 1, timestamp: 1 });
eventSchema.index({ tenantId: 1, eventName: 1, timestamp: 1 });
eventSchema.index({ tenantId: 1, eventId: 1 }, { unique: true });
eventSchema.index(
  { receivedAt: 1 },
  { expireAfterSeconds: env.EVENTS_TTL_DAYS * 24 * 60 * 60 },
);

export const EventModel = model<EventDocument>("Event", eventSchema);
