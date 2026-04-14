import { Router } from "express";
import { requireApiKey } from "../middleware/api-key.js";
import { getOverview } from "../modules/events/event.service.js";

export const metricsRouter = Router();

metricsRouter.get("/overview", requireApiKey, async (_request, response, next) => {
  try {
    const overview = await getOverview(response.locals.tenantId);
    response.json(overview);
  } catch (error) {
    next(error);
  }
});
