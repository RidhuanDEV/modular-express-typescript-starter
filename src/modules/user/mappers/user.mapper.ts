import type { User } from "../user.model.js";
import type {
  UserResponseDto,
  UserResponseProjection,
} from "../dto/user-response.dto.js";

/**
 * Maps a Sequelize User model to UserResponseDto.
 *
 * This function is the **API contract boundary**: changes to DB column names
 * should be handled here, never in the controller or service, so the
 * response shape stays stable for API consumers.
 *
 * Dates are serialised to ISO 8601 strings to match JSON output exactly.
 */
function toIsoString(value: unknown): string | undefined {
  return value instanceof Date ? value.toISOString() : undefined;
}

export function toUserResponse(model: User): UserResponseDto {
  const createdAt = toIsoString(model.createdAt);
  const updatedAt = toIsoString(model.updatedAt);

  const roleData = model.role
    ? {
        id: model.role.id,
        name: model.role.name,
        permissions: (model.role.permissions || []).map((perm) => ({
          id: perm.id,
          name: perm.name,
        })),
      }
    : undefined;

  return {
    id: model.id,
    email: model.email,
    roleId: model.roleId,
    ...(roleData !== undefined ? { role: roleData } : {}),
    createdAt: createdAt || "",
    updatedAt: updatedAt || "",
  };
}

export function toUserResponseList(models: User[]): UserResponseProjection[] {
  return models.map((model) => {
    const createdAt = toIsoString(model.createdAt);
    const updatedAt = toIsoString(model.updatedAt);

    const roleData = model.role
      ? {
          id: model.role.id,
          name: model.role.name,
          permissions: (model.role.permissions || []).map((perm) => ({
            id: perm.id,
            name: perm.name,
          })),
        }
      : undefined;

    return {
      ...(typeof model.id === "string" ? { id: model.id } : {}),
      ...(typeof model.email === "string" ? { email: model.email } : {}),
      ...(typeof model.roleId === "string" ? { roleId: model.roleId } : {}),
      ...(roleData !== undefined ? { role: roleData } : {}),
      ...(createdAt !== undefined ? { createdAt } : {}),
      ...(updatedAt !== undefined ? { updatedAt } : {}),
    };
  });
}
