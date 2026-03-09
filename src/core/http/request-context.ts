import type { Request } from "express";
import { HttpError } from "../errors/http-error.js";
import type { JwtUserPayload } from "../../types/index.js";

export function requireAuthenticatedUser(req: Request): JwtUserPayload {
  const { user } = req;

  if (!user) {
    throw HttpError.unauthorized("Authentication required");
  }

  return user;
}

export function requireRouteParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value !== "string" || value.length === 0) {
    throw HttpError.badRequest(`Missing or invalid route parameter: ${key}`);
  }

  return value;
}
