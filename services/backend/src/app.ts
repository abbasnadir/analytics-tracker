import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

function parseAllowedOrigins(raw: string) {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const sdkBundlePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../apps/sdk/dist/metricflow.js",
);

export function createApp() {
  const app = express();
  const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);

  // By default, Express does not trust headers like X-Forwarded-For.
  // When running behind a reverse proxy (like NGINX, or a cloud load balancer),
  // we need to enable this setting to correctly identify the client's IP address
  // for features like Geo-IP country detection.
  app.set("trust proxy", true);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (
          allowedOrigins.includes("*") ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    }),
  );
  app.use(attachRequestContext);
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));

  app.get("/mf.js", (_request, response) => {
    if (!existsSync(sdkBundlePath)) {
      response.status(503).type("text/plain").send(
        "MetricFlow SDK bundle not found. Run `npm run build:sdk` first.",
      );
      return;
    }

    response.sendFile(sdkBundlePath);
  });

  app.use("/health", healthRouter);
  app.use("/api/v1/events", eventsRouter);
  app.use("/api/v1/analyzer", analyzerRouter);
  app.use("/api/v1/metrics", metricsRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
