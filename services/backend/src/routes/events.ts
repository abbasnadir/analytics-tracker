import { Router } from "express";
import { requireApiKey } from "../middleware/api-key.js";
import { ingestEvent } from "../modules/events/event.service.js";
import { eventPayloadSchema } from "../modules/events/event.schema.js";

export const eventsRouter = Router();

eventsRouter.post("/", requireApiKey, async (request, response, next) => {
  try {
    const payload = eventPayloadSchema.parse(request.body);
    await ingestEvent(response.locals.tenantId, payload);

    response.status(202).json({
      accepted: true,
      tenantId: response.locals.tenantId
    });
  } catch (error) {
    next(error);
  }
});
