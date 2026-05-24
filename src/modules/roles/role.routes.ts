import { Router } from "express";
import { RoleController } from "./role.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  assignPermissionsSchema,
} from "./role.schema.js";

const router = Router();
const controller = new RoleController();

router.get(
  "/",
  authenticate,
  requirePermission("manage_roles"),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("manage_roles"),
  validate({ params: roleIdSchema }),
  controller.getById,
);

router.post(
  "/",
  authenticate,
  requirePermission("manage_roles"),
  validate({ body: createRoleSchema }),
  controller.create,
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("manage_roles"),
  validate({ params: roleIdSchema, body: updateRoleSchema }),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("manage_roles"),
  validate({ params: roleIdSchema }),
  controller.delete,
);

router.post(
  "/:id/permissions",
  authenticate,
  requirePermission("manage_roles"),
  validate({ params: roleIdSchema, body: assignPermissionsSchema }),
  controller.assignPermissions,
);

export const path = "/roles";
export default router;
