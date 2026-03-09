import { UserRepository } from "./user.repository.js";
import { sequelize } from "../../config/database.js";
import { cacheService } from "../../core/cache/cache.service.js";
import { auditService } from "../../core/audit/audit.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { buildFindOptions } from "../../core/database/query-builder.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import { toUserResponse, toUserResponseList } from "./mappers/user.mapper.js";
import { userPolicy } from "./policies/user.policy.js";
import { userQueryConfig } from "./queries/user.query.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { USER_MODULE } from "../../constants/modules.constants.js";
import type { CreateUserDto } from "./dto/create-user.dto.js";
import type { UpdateUserDto } from "./dto/update-user.dto.js";
import type { SearchUserDto } from "./dto/search-user.dto.js";
import type { JwtUserPayload } from "../../types/index.js";

const repository = new UserRepository();
const CACHE_PREFIX = USER_MODULE;

export class UserService {
  async findAll(query: SearchUserDto) {
    const cacheKey = `${CACHE_PREFIX}:list:${JSON.stringify(query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const findOptions = buildFindOptions(query, userQueryConfig);
    const { rows, count } = await repository.findAll(findOptions);
    const { page, limit } = query;

    const result = {
      data: toUserResponseList(rows),
      meta: buildPaginationMeta(page, limit, count),
    };

    await cacheService.set(cacheKey, result, 60);
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const record = await repository.findById(id);
    if (!record) throw HttpError.notFound("User not found");

    const response = toUserResponse(record);
    await cacheService.set(cacheKey, response, 120);
    return response;
  }

  /**
   * Transaction wraps both the INSERT and the audit write so they succeed
   * or roll back together. Cache is busted only after successful commit.
   */
  async create(data: CreateUserDto, user: JwtUserPayload, requestId?: string) {
    userPolicy.canCreate(user);

    const record = await sequelize.transaction(async (trx) => {
      const created = await repository.create(data, trx);
      await auditService.persist({
        action: AuditAction.CREATE,
        module: USER_MODULE,
        entityId: created.id,
        userId: user.id,
        after: created.toJSON(),
        requestId,
        trx,
      });
      return created;
    });

    // Side effects after successful commit
    await cacheService.invalidatePattern(`${CACHE_PREFIX}:list:*`);
    return toUserResponse(record);
  }

  /**
   * Reads the existing record before the transaction for policy check and
   * before-snapshot. The transaction boundary covers only the mutation and
   * audit write, keeping the lock window as small as possible.
   */
  async update(
    id: string,
    data: UpdateUserDto,
    user: JwtUserPayload,
    requestId?: string,
  ) {
    const existing = await repository.findById(id);
    if (!existing) throw HttpError.notFound("User not found");
    userPolicy.canUpdate(user, existing);

    const record = await sequelize.transaction(async (trx) => {
      const updated = await repository.update(id, data, trx);
      if (!updated) throw HttpError.notFound("User not found");
      await auditService.persist({
        action: AuditAction.UPDATE,
        module: USER_MODULE,
        entityId: id,
        userId: user.id,
        before: existing.toJSON(),
        after: updated.toJSON(),
        requestId,
        trx,
      });
      return updated;
    });

    // Side effects after successful commit
    await cacheService.del(`${CACHE_PREFIX}:${id}`);
    await cacheService.invalidatePattern(`${CACHE_PREFIX}:list:*`);
    return toUserResponse(record);
  }

  /**
   * Soft or hard delete depends on the repo implementation.
   */
  async delete(id: string, user: JwtUserPayload, requestId?: string) {
    const existing = await repository.findById(id);
    if (!existing) throw HttpError.notFound("User not found");
    userPolicy.canDelete(user, existing);

    await sequelize.transaction(async (trx) => {
      await repository.delete(id, trx);
      await auditService.persist({
        action: AuditAction.DELETE,
        module: USER_MODULE,
        entityId: id,
        userId: user.id,
        before: existing.toJSON(),
        requestId,
        trx,
      });
    });

    // Side effects after successful commit
    await cacheService.del(`${CACHE_PREFIX}:${id}`);
    await cacheService.invalidatePattern(`${CACHE_PREFIX}:list:*`);
  }
}
