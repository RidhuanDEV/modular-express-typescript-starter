import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger/logger.js";

export function accessLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTimeMs: parseFloat(timeMs),
        ip: req.ip,
      },
      `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${timeMs}ms`,
    );
  });

  next();
}
