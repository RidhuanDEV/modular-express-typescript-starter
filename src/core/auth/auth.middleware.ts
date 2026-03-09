import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.service.js";
import { HttpError } from "../errors/http-error.js";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(HttpError.unauthorized("Missing or invalid authorization header"));
    return;
  }

  const token = header.slice(7);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(HttpError.unauthorized("Invalid or expired token"));
  }
}
