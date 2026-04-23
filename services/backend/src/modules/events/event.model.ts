import { Schema, model } from "mongoose";
import type { EventPayload } from "./event.schema.js";

type EventDocument = EventPayload & {
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

const eventSchema = new Schema<EventDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    apiKey: { type: String, required: true },
    sessionId: { type: String, required: true, index: true },
    eventName: { type: String, required: true, index: true },
    timestamp: { type: String, required: true, index: true },
    url: { type: String, required: true },
    userAgent: { type: String, required: true },
    properties: { type: Schema.Types.Mixed, default: {} },
    element: {
      tagName: String,
      id: String,
      classes: [String],
      text: String
    }
  },
  { timestamps: true }
);

export const EventModel = model<EventDocument>("Event", eventSchema);
