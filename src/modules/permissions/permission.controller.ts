import type { Request, Response, NextFunction } from "express";
import { PermissionService } from "./permission.service.js";
import {
  requireAuthenticatedUser,
  requireRouteParam,
} from "../../core/http/request-context.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../utils/response.js";

const service = new PermissionService();

export class PermissionController {
  async findAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await service.findAll();
      sendSuccess(res, { data });
    } catch (err) {
      next(err);
    }
  }

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await service.findById(requireRouteParam(req, "id"));
      sendSuccess(res, { data });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = requireAuthenticatedUser(req);
      const data = await service.create(req.body, user, req.requestId);
      sendCreated(res, data);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = requireAuthenticatedUser(req);
      const data = await service.update(
        requireRouteParam(req, "id"),
        req.body,
        user,
        req.requestId,
      );
      sendSuccess(res, { data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = requireAuthenticatedUser(req);
      await service.delete(requireRouteParam(req, "id"), user, req.requestId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
}
