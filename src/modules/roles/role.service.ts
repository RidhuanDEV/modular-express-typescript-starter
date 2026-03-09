import { RoleRepository } from "./role.repository.js";
import { sequelize } from "../../config/database.js";
import { HttpError } from "../../core/errors/http-error.js";
import { cacheService } from "../../core/cache/cache.service.js";
import { auditService } from "../../core/audit/audit.service.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { ROLE_MODULE } from "../../constants/modules.constants.js";
import type {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from "./role.schema.js";
import type { JwtUserPayload } from "../../types/index.js";

const repository = new RoleRepository();
const CACHE_PREFIX = ROLE_MODULE;

export class RoleService {
  async findAll() {
    const cacheKey = `${CACHE_PREFIX}:list`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const roles = await repository.findAll();
    await cacheService.set(cacheKey, roles, 300);
    return roles;
  }

  async findById(id: string) {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const role = await repository.findById(id);
    if (!role) throw HttpError.notFound("Role not found");

    await cacheService.set(cacheKey, role, 300);
    return role;
  }

  async create(dto: CreateRoleDto, user: JwtUserPayload, requestId?: string) {
    const existing = await repository.findByName(dto.name);
    if (existing) throw HttpError.conflict(`Role '${dto.name}' already exists`);

    const role = await sequelize.transaction(async (trx) => {
      const created = await repository.create(dto, trx);
      await auditService.persist({
        action: AuditAction.CREATE,
        module: ROLE_MODULE,
        entityId: created.id,
        userId: user.id,
        after: created.toJSON(),
        requestId,
        trx,
      });
      return created;
    });

    await cacheService.invalidatePattern(`${CACHE_PREFIX}:*`);
    return role;
  }

  async update(
    id: string,
    dto: UpdateRoleDto,
    user: JwtUserPayload,
    requestId?: string,
  ) {
    const existingRole = await repository.findById(id);
    if (!existingRole) throw HttpError.notFound("Role not found");

    if (dto.name) {
      const existing = await repository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw HttpError.conflict(`Role '${dto.name}' already exists`);
      }
    }

    const role = await sequelize.transaction(async (trx) => {
      const updated = await repository.update(id, dto, trx);
      if (!updated) throw HttpError.notFound("Role not found");

      await auditService.persist({
        action: AuditAction.UPDATE,
        module: ROLE_MODULE,
        entityId: id,
        userId: user.id,
        before: existingRole.toJSON(),
        after: updated.toJSON(),
        requestId,
        trx,
      });

      return updated;
    });

    await cacheService.del(`${CACHE_PREFIX}:${id}`);
    await cacheService.invalidatePattern(`${CACHE_PREFIX}:*`);
    return role;
  }

  async delete(id: string, user: JwtUserPayload, requestId?: string) {
    const existingRole = await repository.findById(id);
    if (!existingRole) throw HttpError.notFound("Role not found");

    await sequelize.transaction(async (trx) => {
      const deleted = await repository.delete(id, trx);
      if (!deleted) throw HttpError.notFound("Role not found");

      await auditService.persist({
        action: AuditAction.DELETE,
        module: ROLE_MODULE,
        entityId: id,
        userId: user.id,
        before: existingRole.toJSON(),
        requestId,
        trx,
      });
    });

    await cacheService.del(`${CACHE_PREFIX}:${id}`);
    await cacheService.invalidatePattern(`${CACHE_PREFIX}:*`);
    // Invalidate all permission caches (users with this role need refresh)
    await cacheService.invalidatePattern("permissions:*");
  }

  async assignPermissions(
    id: string,
    dto: AssignPermissionsDto,
    user: JwtUserPayload,
    requestId?: string,
  ) {
    const existingRole = await repository.findById(id);
    if (!existingRole) throw HttpError.notFound("Role not found");

    const updatedRole = await sequelize.transaction(async (trx) => {
      await repository.setPermissions(id, dto.permissionIds, trx);
      const updated = await repository.findById(id, trx);
      if (!updated) throw HttpError.notFound("Role not found");

      await auditService.persist({
        action: AuditAction.ASSIGN_PERMISSIONS,
        module: ROLE_MODULE,
        entityId: id,
        userId: user.id,
        before: existingRole.toJSON(),
        after: updated.toJSON(),
        requestId,
        trx,
      });

      return updated;
    });

    await cacheService.del(`${CACHE_PREFIX}:${id}`);
    await cacheService.invalidatePattern(`${CACHE_PREFIX}:*`);
    // Invalidate permission caches for all users with this role
    await cacheService.invalidatePattern("permissions:*");

    return updatedRole;
  }
}
