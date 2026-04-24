import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { attachRequestContext } from "./middleware/request-context.js";
import { analyzerRouter } from "./routes/analyzer.js";
import { eventsRouter } from "./routes/events.js";
import { healthRouter } from "./routes/health.js";
import { metricsRouter } from "./routes/metrics.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );
  app.use(attachRequestContext);
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));

  app.use("/health", healthRouter);
  app.use("/api/v1/events", eventsRouter);
  app.use("/api/v1/analyzer", analyzerRouter);
  app.use("/api/v1/metrics", metricsRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
