import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { USER_PERMISSIONS } from "../../constants/permissions.constants.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  searchUserSchema,
} from "./user.schema.js";

const router = Router();
const controller = new UserController();

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [User]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: orderBy
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: fields
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list
 */
router.get(
  "/",
  authenticate,
  requirePermission(USER_PERMISSIONS.MANAGE),
  validate({ query: searchUserSchema }),
  controller.findAll.bind(controller),
);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [User]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Single record
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  authenticate,
  requirePermission(USER_PERMISSIONS.MANAGE),
  validate({ params: userIdSchema }),
  controller.findById.bind(controller),
);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [User]
 *     summary: Create user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  requirePermission(USER_PERMISSIONS.MANAGE),
  validate({ body: createUserSchema }),
  controller.create.bind(controller),
);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [User]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.patch(
  "/:id",
  authenticate,
  requirePermission(USER_PERMISSIONS.MANAGE),
  validate({ params: userIdSchema, body: updateUserSchema }),
  controller.update.bind(controller),
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [User]
 *     summary: Delete user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete(
  "/:id",
  authenticate,
  requirePermission(USER_PERMISSIONS.MANAGE),
  validate({ params: userIdSchema }),
  controller.delete.bind(controller),
);

export const path = "/users";
export default router;
