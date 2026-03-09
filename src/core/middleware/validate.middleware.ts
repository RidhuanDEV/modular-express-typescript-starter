import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { HttpError } from "../errors/http-error.js";

interface ValidationSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: unknown[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...result.error.issues);
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...result.error.issues);
      } else {
        // Assign coerced/parsed values back so the controller can safely cast
        // req.query to the expected DTO type without re-parsing.
        (req as unknown as { query: Record<string, unknown> }).query =
          result.data as Record<string, unknown>;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...result.error.issues);
      }
    }

    if (errors.length > 0) {
      next(HttpError.badRequest("Validation failed", errors));
      return;
    }

    next();
  };
}
