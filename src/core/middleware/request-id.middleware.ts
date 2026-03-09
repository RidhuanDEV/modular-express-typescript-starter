import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existing = req.headers["x-request-id"];
  req.requestId = typeof existing === "string" ? existing : randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
