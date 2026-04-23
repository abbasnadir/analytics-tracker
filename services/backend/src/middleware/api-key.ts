import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiKeyModel } from "../modules/events/api-key.model.js";

function isValidApiKey(apiKey: string) {
  return apiKey === env.DEFAULT_API_KEY || apiKey.startsWith("mf_");
}

export function requireApiKey(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const apiKey =
    request.header("x-api-key") ||
    (typeof request.body?.apiKey === "string"
      ? request.body.apiKey
      : undefined) ||
    request.query.apiKey;

  if (typeof apiKey !== "string" || !isValidApiKey(apiKey)) {
    response.status(401).json({
      error: "Invalid API key",
      code: "UNAUTHORIZED",
      requestId: response.locals.requestId,
      serverTime: new Date().toISOString(),
    });
    return;
  }

  const origin = request.header("origin");

  void (async () => {
    if (apiKey === env.DEFAULT_API_KEY) {
      response.locals.apiKey = apiKey;
      response.locals.tenantId = apiKey;
      next();
      return;
    }

    const keyDoc = await ApiKeyModel.findOne({
      key: apiKey,
      status: "active",
    }).lean();

    if (!keyDoc) {
      response.locals.apiKey = apiKey;
      response.locals.tenantId = apiKey;
      next();
      return;
    }

    if (
      origin &&
      keyDoc.allowedOrigins.length > 0 &&
      !keyDoc.allowedOrigins.includes(origin)
    ) {
      response.status(401).json({
        error: "Origin not allowed for API key",
        code: "UNAUTHORIZED_ORIGIN",
        requestId: response.locals.requestId,
        serverTime: new Date().toISOString(),
      });
      return;
    }

    response.locals.apiKey = apiKey;
    response.locals.tenantId = keyDoc.tenantId;
    next();
  })().catch((error) => next(error));
}
