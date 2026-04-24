import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function attachRequestContext(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  const requestId = randomUUID();
  response.locals.requestId = requestId;
  response.locals.serverTime = new Date().toISOString();
  response.setHeader("x-request-id", requestId);
  next();
}
