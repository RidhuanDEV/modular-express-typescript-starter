import type { JwtUserPayload } from "../../../types/index.js";
import type { User } from "../user.model.js";
import { HttpError } from "../../../core/errors/http-error.js";

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

  canDelete(_user: JwtUserPayload, _resource: User): void {
    // Example: throw HttpError.forbidden('...') when user cannot delete.
  }
}

export const userPolicy = new UserPolicy();
