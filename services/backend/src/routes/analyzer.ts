import { Router } from "express";
import { requireApiKey } from "../middleware/api-key.js";
import {
  getCheckpoint,
  getEventsForAnalysis,
  saveMetricSummary,
  updateCheckpoint,
} from "../modules/events/event.service.js";
import {
  analyzerCheckpointPayloadSchema,
  analyzerEventsQuerySchema,
  metricSummaryPayloadSchema,
} from "../modules/events/metric-summary.schema.js";

export const analyzerRouter = Router();

analyzerRouter.get(
  "/events",
  requireApiKey,
  async (request, response, next) => {
    try {
      const query = analyzerEventsQuerySchema.parse(request.query);
      const events = await getEventsForAnalysis(
        response.locals.tenantId,
        query.start,
        query.end,
      );

      response.json({
        tenantId: response.locals.tenantId,
        count: events.length,
        events,
      });
    } catch (error) {
      next(error);
    }
  },
);

analyzerRouter.post(
  "/summaries",
  requireApiKey,
  async (request, response, next) => {
    try {
      const payload = metricSummaryPayloadSchema.parse(request.body);
      const summary = await saveMetricSummary(
        response.locals.tenantId,
        payload,
      );

      response.status(202).json({
        accepted: true,
        tenantId: response.locals.tenantId,
        summaryId: String(summary?._id ?? ""),
      });
    } catch (error) {
      next(error);
    }
  },
);

analyzerRouter.get(
  "/checkpoint",
  requireApiKey,
  async (_request, response, next) => {
    try {
      const checkpoint = await getCheckpoint(response.locals.tenantId);
      response.json(checkpoint);
    } catch (error) {
      next(error);
    }
  },
);

analyzerRouter.put(
  "/checkpoint",
  requireApiKey,
  async (request, response, next) => {
    try {
      const payload = analyzerCheckpointPayloadSchema.parse(request.body);
      const checkpoint = await updateCheckpoint(
        response.locals.tenantId,
        payload.lastProcessedAt,
      );
      response.json(checkpoint);
    } catch (error) {
      next(error);
    }
  },
);
