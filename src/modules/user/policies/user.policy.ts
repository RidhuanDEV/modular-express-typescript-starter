import type { JwtUserPayload } from "../../../types/index.js";
import type { User } from "../user.model.js";
import { HttpError } from "../../../core/errors/http-error.js";
import { Role } from "../../roles/role.model.js";

/**
 * Resource-level authorization policy for User.
 *
 * Route-level RBAC (manage_users, etc.) is handled by
 * requirePermission() middleware. Use this class for ownership checks
 * or additional business rules that need the loaded resource.
 *
 * Throw HttpError.forbidden() to deny access, return void to allow.
 */
export class UserPolicy {
  canView(_user: JwtUserPayload, _resource?: User): void {
    // Add resource-level checks here if needed.
  }

  canCreate(_user: JwtUserPayload): void {
    // Add creation business rules here if needed.
  }

  canUpdate(_user: JwtUserPayload, _resource: User): void {
    // Example: throw HttpError.forbidden('...') when user cannot update.
  }

  async canDelete(user: JwtUserPayload, resource: User): Promise<void> {
    // 1. Avoid self-deletion (for both Admin and standard Users)
    if (user.id === resource.id) {
      throw HttpError.forbidden("You cannot delete your own account.");
    }

    // 2. Ensure only administrators are allowed to delete users
    const requesterRole = await Role.findByPk(user.roleId);
    if (!requesterRole || requesterRole.name !== "admin") {
      throw HttpError.forbidden("Only administrators are allowed to delete user accounts.");
    }
  }
}

export const userPolicy = new UserPolicy();
