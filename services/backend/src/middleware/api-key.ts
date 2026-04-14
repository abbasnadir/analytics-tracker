import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

function isValidApiKey(apiKey: string) {
  return apiKey === env.DEFAULT_API_KEY || apiKey.startsWith("mf_");
}

export function requireApiKey(request: Request, response: Response, next: NextFunction) {
  const apiKey =
    request.header("x-api-key") ||
    (typeof request.body?.apiKey === "string" ? request.body.apiKey : undefined) ||
    request.query.apiKey;

  if (typeof apiKey !== "string" || !isValidApiKey(apiKey)) {
    response.status(401).json({ error: "Invalid API key" });
    return;
  }

  response.locals.apiKey = apiKey;
  response.locals.tenantId = apiKey;
  next();
}
