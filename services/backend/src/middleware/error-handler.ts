import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/app-error.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const requestId = response.locals.requestId;
  const serverTime = new Date().toISOString();

  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Invalid request payload",
      code: "VALIDATION_ERROR",
      issues: error.flatten(),
      requestId,
      serverTime,
    });
    return;
  }

  if (error instanceof SyntaxError) {
    response.status(400).json({
      error: "Invalid JSON body",
      code: "INVALID_JSON",
      requestId,
      serverTime,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
      requestId,
      serverTime,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    requestId,
    serverTime,
  });
}
