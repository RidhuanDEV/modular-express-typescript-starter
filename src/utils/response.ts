import type { Response } from "express";
import type { PaginationMeta } from "../types/index.js";

interface SuccessOptions {
  data?: unknown;
  meta?: PaginationMeta;
  statusCode?: number;
}

export function sendSuccess(res: Response, options: SuccessOptions = {}): void {
  const { data = null, meta, statusCode = 200 } = options;
  const body: Record<string, unknown> = { success: true, data };
  if (meta) {
    body["meta"] = meta;
  }
  res.status(statusCode).json(body);
}

export function sendCreated(res: Response, data: unknown): void {
  sendSuccess(res, { data, statusCode: 201 });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
