import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error.js";
import { cacheService } from "../cache/cache.service.js";
import { User } from "../../modules/user/user.model.js";
import { Role } from "../../modules/roles/role.model.js";
import { Permission } from "../../modules/permissions/permission.model.js";
import type { PermissionName } from "../../constants/permissions.constants.js";

async function resolvePermissions(userId: string): Promise<string[]> {
  const cacheKey = `permissions:${userId}`;
  const cached = await cacheService.get<string[]>(cacheKey);
  if (cached) return cached;

  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: "role",
        attributes: ["id"],
        include: [
          { model: Permission, as: "permissions", attributes: ["name"] },
        ],
      },
    ],
  });
  const permissions =
    user?.role?.permissions?.map((p: Permission) => p.name) ?? [];
  await cacheService.set(cacheKey, permissions, 300);
  return permissions;
}

export function requirePermission(permissionName: PermissionName) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const user = req.user;

    if (!user) {
      next(HttpError.unauthorized("Authentication required"));
      return;
    }

    try {
      const permissions = await resolvePermissions(user.id);

      if (!permissions.includes(permissionName)) {
        next(HttpError.forbidden(`Missing permission: ${permissionName}`));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
