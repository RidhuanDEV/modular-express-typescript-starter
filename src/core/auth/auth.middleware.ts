import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.service.js";
import { HttpError } from "../errors/http-error.js";
import { User } from "../../modules/user/user.model.js";
import { cacheService } from "../cache/cache.service.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(HttpError.unauthorized("Missing or invalid authorization header"));
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyToken(token);

    // Solve "Ghost User" vulnerability by checking active session status via Redis Cache first.
    const cacheKey = `user:active:${payload.id}`;
    let isUserActive = await cacheService.get<boolean>(cacheKey);

    if (isUserActive === null) {
      const user = await User.findByPk(payload.id);
      isUserActive = user !== null && user.deletedAt === null;
      // Cache the active status for 60 seconds to avoid hitting database repeatedly
      await cacheService.set(cacheKey, isUserActive, 60);
    }

    if (!isUserActive) {
      next(HttpError.unauthorized("User account is inactive or deleted"));
      return;
    }

    req.user = payload;
    next();
  } catch {
    next(HttpError.unauthorized("Invalid or expired token"));
  }
}
