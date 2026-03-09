import { Router } from "express";
import { PermissionController } from "./permission.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { PERMISSION_PERMISSIONS } from "../../constants/permissions.constants.js";
import {
  createPermissionSchema,
  updatePermissionSchema,
  permissionIdSchema,
} from "./permission.schema.js";

const router = Router();
const controller = new PermissionController();

/**
 * @openapi
 * /permissions:
 *   get:
 *     tags: [Permission]
 *     summary: List all permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get(
  "/",
  authenticate,
  requirePermission(PERMISSION_PERMISSIONS.MANAGE),
  controller.findAll.bind(controller),
);

/**
 * @openapi
 * /permissions/{id}:
 *   get:
 *     tags: [Permission]
 *     summary: Get permission by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Permission
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  authenticate,
  requirePermission(PERMISSION_PERMISSIONS.MANAGE),
  validate({ params: permissionIdSchema }),
  controller.findById.bind(controller),
);

/**
 * @openapi
 * /permissions:
 *   post:
 *     tags: [Permission]
 *     summary: Create a new permission
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: create_product
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSION_PERMISSIONS.MANAGE),
  validate({ body: createPermissionSchema }),
  controller.create.bind(controller),
);

/**
 * @openapi
 * /permissions/{id}:
 *   put:
 *     tags: [Permission]
 *     summary: Update a permission
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
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.put(
  "/:id",
  authenticate,
  requirePermission(PERMISSION_PERMISSIONS.MANAGE),
  validate({ params: permissionIdSchema, body: updatePermissionSchema }),
  controller.update.bind(controller),
);

/**
 * @openapi
 * /permissions/{id}:
 *   delete:
 *     tags: [Permission]
 *     summary: Delete a permission
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
  requirePermission(PERMISSION_PERMISSIONS.MANAGE),
  validate({ params: permissionIdSchema }),
  controller.delete.bind(controller),
);

export const path = "/permissions";
export default router;
