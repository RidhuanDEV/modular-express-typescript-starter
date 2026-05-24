import type { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import {
  requireAuthenticatedUser,
  requireRouteParam,
} from "../../core/http/request-context.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../utils/response.js";
import type { SearchUserDto } from "./dto/search-user.dto.js";
import type { CreateUserDto } from "./dto/create-user.dto.js";
import type { UpdateUserDto } from "./dto/update-user.dto.js";

const service = new UserService();

export class UserController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pageVal = req.query["page"];
      const limitVal = req.query["limit"];
      const sortByVal = req.query["sortBy"];
      const orderByVal = req.query["orderBy"];
      const searchVal = req.query["search"];
      const fieldsVal = req.query["fields"];

      const query: SearchUserDto = {
        page: typeof pageVal === "number" ? pageVal : Number(pageVal) || 1,
        limit: typeof limitVal === "number" ? limitVal : Number(limitVal) || 10,
        sortBy: typeof sortByVal === "string" ? sortByVal : undefined,
        orderBy: orderByVal === "desc" ? "desc" : "asc",
        search: typeof searchVal === "string" ? searchVal : undefined,
        fields: typeof fieldsVal === "string" ? fieldsVal : undefined,
      };

      const result = await service.findAll(query);
      sendSuccess(res, {
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireRouteParam(req, "id");
      const result = await service.findById(id);
      sendSuccess(res, { data: result });
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request<Record<string, string>, any, CreateUserDto>,
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
    req: Request<{ id: string }, any, UpdateUserDto>,
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
}
