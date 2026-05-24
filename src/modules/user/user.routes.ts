import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  searchUserSchema,
} from "./user.schema.js";

const router = Router();
const controller = new UserController();

router.get(
  "/",
  authenticate,
  requirePermission("manage_users"),
  validate({ query: searchUserSchema }),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  requirePermission("manage_users"),
  validate({ params: userIdSchema }),
  controller.getById,
);

router.post(
  "/",
  authenticate,
  requirePermission("manage_users"),
  validate({ body: createUserSchema }),
  controller.create,
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("manage_users"),
  validate({ params: userIdSchema, body: updateUserSchema }),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("manage_users"),
  validate({ params: userIdSchema }),
  controller.delete,
);

export const path = "/users";
export default router;
