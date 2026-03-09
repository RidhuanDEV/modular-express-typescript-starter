import type { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import { searchUserSchema } from "./user.schema.js";
import {
  requireAuthenticatedUser,
  requireRouteParam,
} from "../../core/http/request-context.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../utils/response.js";

const service = new UserService();

export class UserController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = searchUserSchema.parse(req.query);
      const result = await service.findAll(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.findById(requireRouteParam(req, "id"));
      sendSuccess(res, { data });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = requireAuthenticatedUser(req);
      const data = await service.create(req.body, user, req.requestId);
      sendCreated(res, data);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
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

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const user = requireAuthenticatedUser(req);
      await service.delete(requireRouteParam(req, "id"), user, req.requestId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
}
