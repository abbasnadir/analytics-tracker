import { Router } from "express";
import { requireApiKey } from "../middleware/api-key.js";
import { isDatabaseConnected, pingDatabase } from "../config/database.js";
import { AppError } from "../lib/app-error.js";
import {
  getGeoMetrics,
  getOverviewForRange,
  getOverview,
  getRankedElements,
  getRankedPages,
  getSessionMetrics,
  getTimeseries,
} from "../modules/events/event.service.js";
import {
  metricRangeQuerySchema,
  overviewRangeQuerySchema,
  timeseriesQuerySchema,
} from "../modules/events/event.schema.js";

export const metricsRouter = Router();

metricsRouter.get(
  "/overview",
  requireApiKey,
  async (request, response, next) => {
    try {
      const query = overviewRangeQuerySchema.parse(request.query);
      const overview =
        query.start && query.end
          ? await getOverviewForRange(
              response.locals.tenantId,
              query.start,
              query.end,
            )
          : await getOverview(response.locals.tenantId);

      response.json(overview);
    } catch (error) {
      next(error);
    }
  },
);

metricsRouter.get(
  "/timeseries",
  requireApiKey,
  async (request, response, next) => {
    try {
      const query = timeseriesQuerySchema.parse(request.query);
      const timeseries = await getTimeseries(response.locals.tenantId, query);
      response.json(timeseries);
    } catch (error) {
      next(error);
    }
  },
);

metricsRouter.get(
  "/top-pages",
  requireApiKey,
  async (request, response, next) => {
    try {
      const query = metricRangeQuerySchema.parse(request.query);
      const items = await getRankedPages(
        response.locals.tenantId,
        query.start,
        query.end,
        query.limit,
      );

      response.json({
        tenantId: response.locals.tenantId,
        rangeStart: query.start,
        rangeEnd: query.end,
        items,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

metricsRouter.get(
  "/top-elements",
  requireApiKey,
  async (request, response, next) => {
    try {
      const query = metricRangeQuerySchema.parse(request.query);
      const items = await getRankedElements(
        response.locals.tenantId,
        query.start,
        query.end,
        query.limit,
      );

      response.json({
        tenantId: response.locals.tenantId,
        rangeStart: query.start,
        rangeEnd: query.end,
        items,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

metricsRouter.get(
  "/geo",
  requireApiKey,
  async (request, response, next) => {
    try {
      const query = metricRangeQuerySchema.parse(request.query);
      const metrics = await getGeoMetrics(
        response.locals.tenantId,
        query.start,
        query.end,
        query.limit,
      );
      response.json(metrics);
    } catch (error) {
      next(error);
    }
  },
);

metricsRouter.get(
  "/sessions",
  requireApiKey,
  async (request, response, next) => {
    try {
      const query = metricRangeQuerySchema.parse(request.query);

      if (!query.start || !query.end) {
        throw new AppError(
          "start and end are required for session metrics",
          400,
          "INVALID_QUERY",
        );
      }

      const metrics = await getSessionMetrics(
        response.locals.tenantId,
        query.start,
        query.end,
      );
      response.json(metrics);
    } catch (error) {
      next(error);
    }
  },
);

metricsRouter.get(
  "/health/ping",
  requireApiKey,
  async (_request, response, next) => {
    try {
      const dbLatencyMs = isDatabaseConnected() ? await pingDatabase() : -1;

      response.json({
        status: "ok",
        service: "metricflow-backend",
        serverTime: new Date().toISOString(),
        requestId: response.locals.requestId,
        tenantId: response.locals.tenantId,
        db: {
          connected: isDatabaseConnected(),
          latencyMs: Math.max(0, dbLatencyMs),
        },
        uptimeSec: Math.floor(process.uptime()),
      });
    } catch (error) {
      next(error);
    }
  },
);
