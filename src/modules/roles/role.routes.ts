import { Router } from "express";
import { RoleController } from "./role.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { ROLE_PERMISSIONS } from "../../constants/permissions.constants.js";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  assignPermissionsSchema,
} from "./role.schema.js";

const router = Router();
const controller = new RoleController();

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Role]
 *     summary: List all roles with their permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get(
  "/",
  authenticate,
  requirePermission(ROLE_PERMISSIONS.MANAGE),
  controller.findAll.bind(controller),
);

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     tags: [Role]
 *     summary: Get role by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Role with permissions
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  authenticate,
  requirePermission(ROLE_PERMISSIONS.MANAGE),
  validate({ params: roleIdSchema }),
  controller.findById.bind(controller),
);

/**
 * @openapi
 * /roles:
 *   post:
 *     tags: [Role]
 *     summary: Create a new role
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
 *                 example: editor
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  "/",
  authenticate,
  requirePermission(ROLE_PERMISSIONS.MANAGE),
  validate({ body: createRoleSchema }),
  controller.create.bind(controller),
);

/**
 * @openapi
 * /roles/{id}:
 *   put:
 *     tags: [Role]
 *     summary: Update a role
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
  requirePermission(ROLE_PERMISSIONS.MANAGE),
  validate({ params: roleIdSchema, body: updateRoleSchema }),
  controller.update.bind(controller),
);

/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     tags: [Role]
 *     summary: Delete a role
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
  requirePermission(ROLE_PERMISSIONS.MANAGE),
  validate({ params: roleIdSchema }),
  controller.delete.bind(controller),
);

/**
 * @openapi
 * /roles/{id}/permissions:
 *   put:
 *     tags: [Role]
 *     summary: Assign (replace) permissions for a role
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
 *             required: [permissionIds]
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Permissions updated
 *       404:
 *         description: Role not found
 */
router.put(
  "/:id/permissions",
  authenticate,
  requirePermission(ROLE_PERMISSIONS.MANAGE),
  validate({ params: roleIdSchema, body: assignPermissionsSchema }),
  controller.assignPermissions.bind(controller),
);

export const path = "/roles";
export default router;
