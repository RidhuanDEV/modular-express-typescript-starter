import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error.js";
import { logger } from "../logger/logger.js";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof HttpError) {
    logger.warn({
      requestId,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  logger.error({
    requestId,
    err,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
  });
}
