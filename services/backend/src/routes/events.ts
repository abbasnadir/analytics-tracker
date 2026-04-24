import { Router } from "express";
import { requireApiKey } from "../middleware/api-key.js";
import { ingestBatch, ingestEvent } from "../modules/events/event.service.js";
import {
  eventBatchPayloadSchema,
  eventPayloadSchema,
} from "../modules/events/event.schema.js";

export const eventsRouter = Router();

eventsRouter.post("/", requireApiKey, async (request, response, next) => {
  try {
    const payload = eventPayloadSchema.parse(request.body);
    await ingestEvent(response.locals.tenantId, payload);

    response.status(202).json({
      accepted: true,
      tenantId: response.locals.tenantId,
      requestId: response.locals.requestId,
      acceptedCount: 1,
      rejectedCount: 0,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/batch", requireApiKey, async (request, response, next) => {
  try {
    const payload = eventBatchPayloadSchema.parse(request.body);
    const result = await ingestBatch(response.locals.tenantId, payload);

    response.status(202).json({
      accepted: true,
      tenantId: response.locals.tenantId,
      requestId: response.locals.requestId,
      acceptedCount: result.acceptedCount,
      rejectedCount: result.rejectedCount,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
