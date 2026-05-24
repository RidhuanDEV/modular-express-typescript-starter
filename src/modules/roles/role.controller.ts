import type { Request, Response, NextFunction } from "express";
import { RoleService } from "./role.service.js";
import {
  requireAuthenticatedUser,
  requireRouteParam,
} from "../../core/http/request-context.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../utils/response.js";
import type {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from "./role.schema.js";

const service = new RoleService();

export class RoleController {
  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await service.findAll();
      sendSuccess(res, { data: roles });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireRouteParam(req, "id");
      const role = await service.findById(id);
      sendSuccess(res, { data: role });
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request<Record<string, string>, any, CreateRoleDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = requireAuthenticatedUser(req);
      const requestId = req.headers["x-request-id"];
      const reqIdStr = typeof requestId === "string" ? requestId : undefined;

      const result = await service.create(req.body, user, reqIdStr);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request<{ id: string }, any, UpdateRoleDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = requireRouteParam(req, "id");
      const user = requireAuthenticatedUser(req);
      const requestId = req.headers["x-request-id"];
      const reqIdStr = typeof requestId === "string" ? requestId : undefined;

      const result = await service.update(id, req.body, user, reqIdStr);
      sendSuccess(res, { data: result });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireRouteParam(req, "id");
      const user = requireAuthenticatedUser(req);
      const requestId = req.headers["x-request-id"];
      const reqIdStr = typeof requestId === "string" ? requestId : undefined;

      await service.delete(id, user, reqIdStr);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };

  assignPermissions = async (
    req: Request<{ id: string }, any, AssignPermissionsDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = requireRouteParam(req, "id");
      const user = requireAuthenticatedUser(req);
      const requestId = req.headers["x-request-id"];
      const reqIdStr = typeof requestId === "string" ? requestId : undefined;

      const result = await service.assignPermissions(id, req.body, user, reqIdStr);
      sendSuccess(res, { data: result });
    } catch (error) {
      next(error);
    }
  };
}
