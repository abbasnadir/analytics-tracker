import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/app-error.js";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  const requestId = response.locals.requestId;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Invalid request payload",
      issues: error.flatten(),
      requestId
    });
    return;
  }

  if (error instanceof SyntaxError) {
    response.status(400).json({
      error: "Invalid JSON body",
      requestId
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
      requestId
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: "Internal server error",
    requestId
  });
}
