import { Router } from "express";
import { PermissionController } from "./permission.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createPermissionSchema,
  updatePermissionSchema,
  permissionIdSchema,
} from "./permission.schema.js";

const router = Router();
const controller = new PermissionController();

router.get(
  "/",
  authenticate,
  requirePermission("manage_permissions"),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("manage_permissions"),
  validate({ params: permissionIdSchema }),
  controller.getById,
);

router.post(
  "/",
  authenticate,
  requirePermission("manage_permissions"),
  validate({ body: createPermissionSchema }),
  controller.create,
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("manage_permissions"),
  validate({ params: permissionIdSchema, body: updatePermissionSchema }),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("manage_permissions"),
  validate({ params: permissionIdSchema }),
  controller.delete,
);

export const path = "/permissions";
export default router;
