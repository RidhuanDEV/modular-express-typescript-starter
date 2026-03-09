import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, "src");
const CONSTANTS = path.join(SRC, "constants");
const MODULES = path.join(SRC, "modules");
const MIGRATIONS = path.join(SRC, "database", "migrations");
const SEEDERS = path.join(SRC, "database", "seeders");
const MODULE_CONSTANTS_FILE = path.join(CONSTANTS, "modules.constants.ts");
const PERMISSION_CONSTANTS_FILE = path.join(
  CONSTANTS,
  "permissions.constants.ts",
);
const POSTMAN = path.join(ROOT, "postman", "api.collection.json");

function kebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function pascalCase(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function camelCase(s: string): string {
  const p = pascalCase(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function constantCase(s: string): string {
  return kebabCase(s).replace(/-/g, "_").toUpperCase();
}

function pluralize(s: string): string {
  if (s.endsWith("y") && !/[aeiou]y$/i.test(s)) {
    return s.slice(0, -1) + "ies";
  }
  if (
    s.endsWith("s") ||
    s.endsWith("x") ||
    s.endsWith("z") ||
    s.endsWith("ch") ||
    s.endsWith("sh")
  ) {
    return s + "es";
  }
  return s + "s";
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  created: ${path.relative(ROOT, filePath)}`);
}

type ModuleConstantMap = Record<string, string>;
type PermissionGroupMap = Record<string, Record<string, string>>;

const DEFAULT_MODULE_CONSTANTS: ModuleConstantMap = {
  AUTH: "auth",
  USER: "user",
  ROLE: "role",
  PERMISSION: "permission",
};

const DEFAULT_PERMISSION_GROUPS: PermissionGroupMap = {
  USER: {
    MANAGE: "manage_users",
  },
  ROLE: {
    MANAGE: "manage_roles",
  },
  PERMISSION: {
    MANAGE: "manage_permissions",
  },
};

function preferredConstantOrder(keys: string[]): string[] {
  const preferred = ["AUTH", "USER", "ROLE", "PERMISSION"];
  const preferredKeys = preferred.filter((key) => keys.includes(key));
  const otherKeys = keys.filter((key) => !preferred.includes(key)).sort();
  return [...preferredKeys, ...otherKeys];
}

function renderModuleConstants(constantsMap: ModuleConstantMap): string {
  const keys = preferredConstantOrder(Object.keys(constantsMap));

  return `export const MODULES = {
${keys.map((key) => `  ${key}: "${constantsMap[key]}",`).join("\n")}
} as const;

export type ModuleName = typeof MODULES[keyof typeof MODULES];

${keys.map((key) => `export const ${key}_MODULE = MODULES.${key};`).join("\n")}
`;
}

function renderPermissionConstants(groups: PermissionGroupMap): string {
  const keys = preferredConstantOrder(Object.keys(groups));

  const groupLines = keys
    .map((key) => {
      const permissions = groups[key] ?? {};
      const permissionLines = Object.entries(permissions)
        .map(([action, value]) => `    ${action}: "${value}",`)
        .join("\n");

      return `  ${key}: {
${permissionLines}
  },`;
    })
    .join("\n");

  return `export const PERMISSION_GROUPS = {
${groupLines}
} as const;

type PermissionGroups = typeof PERMISSION_GROUPS;

export type PermissionName = {
  [K in keyof PermissionGroups]:
    PermissionGroups[K][keyof PermissionGroups[K]];
}[keyof PermissionGroups];

${keys.map((key) => `export const ${key}_PERMISSIONS = PERMISSION_GROUPS.${key};`).join("\n")}
`;
}

async function readModuleConstants(): Promise<ModuleConstantMap> {
  if (!fs.existsSync(MODULE_CONSTANTS_FILE)) {
    return { ...DEFAULT_MODULE_CONSTANTS };
  }

  const mod = (await import(pathToFileURL(MODULE_CONSTANTS_FILE).href)) as {
    MODULES?: ModuleConstantMap;
  };

  return mod.MODULES ? { ...mod.MODULES } : { ...DEFAULT_MODULE_CONSTANTS };
}

async function readPermissionGroups(): Promise<PermissionGroupMap> {
  if (!fs.existsSync(PERMISSION_CONSTANTS_FILE)) {
    return { ...DEFAULT_PERMISSION_GROUPS };
  }

  const mod = (await import(pathToFileURL(PERMISSION_CONSTANTS_FILE).href)) as {
    PERMISSION_GROUPS?: PermissionGroupMap;
  };

  return mod.PERMISSION_GROUPS
    ? JSON.parse(JSON.stringify(mod.PERMISSION_GROUPS))
    : { ...DEFAULT_PERMISSION_GROUPS };
}

function moduleConstantName(name: string): string {
  return `${constantCase(name)}_MODULE`;
}

function permissionConstantName(name: string): string {
  return `${constantCase(name)}_PERMISSIONS`;
}

async function ensureConstantFiles(name: string): Promise<void> {
  const key = constantCase(name);

  const modules = await readModuleConstants();
  modules[key] ??= name;
  writeFile(MODULE_CONSTANTS_FILE, renderModuleConstants(modules));

  const permissionGroups = await readPermissionGroups();
  permissionGroups[key] ??= {
    CREATE: `create_${name}`,
    UPDATE: `update_${name}`,
    DELETE: `delete_${name}`,
    VIEW: `view_${name}`,
  };
  writeFile(
    PERMISSION_CONSTANTS_FILE,
    renderPermissionConstants(permissionGroups),
  );
}

// ─── Validators ─────────────────────────────────────────────────────────────

function validateModuleName(name: string): string {
  const kebab = kebabCase(name);
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(kebab)) {
    console.error(
      `Error: Invalid module name "${name}". Use kebab-case (e.g., "user" or "blog-post").`,
    );
    process.exit(1);
  }
  return kebab;
}

// ─── Template Generators ────────────────────────────────────────────────────

function genModel(name: string): string {
  const pascal = pascalCase(name);
  const table = pluralize(name.replace(/-/g, "_"));
  return `import { DataTypes, Model } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class ${pascal} extends Model<InferAttributes<${pascal}>, InferCreationAttributes<${pascal}>> {
  declare id: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}

export function initModel(sequelize: Sequelize): typeof ${pascal} {
  ${pascal}.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: '${table}',
      paranoid: true,
      underscored: true,
    },
  );
  return ${pascal};
}
`;
}

function genSchema(name: string): string {
  const pascal = pascalCase(name);
  return `import { z } from 'zod';

export const create${pascal}Schema = z.object({
  // Define your create fields here
});

export const update${pascal}Schema = create${pascal}Schema.partial();

export const search${pascal}Schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  orderBy: z.enum(['asc', 'desc']).optional(),
  /** Comma-separated response/model field names to include in list results. */
  fields: z.string().optional(),
});

export const ${camelCase(name)}IdSchema = z.object({
  id: z.uuid(),
});
`;
}

function genCreateDto(name: string): string {
  const pascal = pascalCase(name);
  return `import type { z } from 'zod';
import type { create${pascal}Schema } from '../${name}.schema.js';

export type Create${pascal}Dto = z.infer<typeof create${pascal}Schema>;
`;
}

function genUpdateDto(name: string): string {
  const pascal = pascalCase(name);
  return `import type { z } from 'zod';
import type { update${pascal}Schema } from '../${name}.schema.js';

export type Update${pascal}Dto = z.infer<typeof update${pascal}Schema>;
`;
}

function genSearchDto(name: string): string {
  const pascal = pascalCase(name);
  return `import type { z } from 'zod';
import type { search${pascal}Schema } from '../${name}.schema.js';

export type Search${pascal}Dto = z.infer<typeof search${pascal}Schema>;
`;
}

function genResponseDto(name: string): string {
  const pascal = pascalCase(name);
  return `export interface ${pascal}ResponseDto {
  id: string;
  /** ISO 8601 string — matches the actual JSON serialisation over HTTP. */
  createdAt: string;
  updatedAt: string;
}

export type ${pascal}ResponseProjection = Partial<${pascal}ResponseDto>;
`;
}

function genRepository(name: string): string {
  const pascal = pascalCase(name);
  return `import { ${pascal} } from './${name}.model.js';
import type { FindOptions, WhereOptions, Transaction } from 'sequelize';
import type { Create${pascal}Dto } from './dto/create-${name}.dto.js';
import type { Update${pascal}Dto } from './dto/update-${name}.dto.js';

export class ${pascal}Repository {
  async findAll(options: FindOptions = {}): Promise<{ rows: ${pascal}[]; count: number }> {
    return ${pascal}.findAndCountAll(options);
  }

  async findById(id: string, trx?: Transaction): Promise<${pascal} | null> {
    return ${pascal}.findByPk(id, trx ? { transaction: trx } : undefined);
  }

  async create(data: Create${pascal}Dto, trx?: Transaction): Promise<${pascal}> {
    return ${pascal}.create(data, trx ? { transaction: trx } : undefined);
  }

  async update(id: string, data: Update${pascal}Dto, trx?: Transaction): Promise<${pascal} | null> {
    const record = await ${pascal}.findByPk(id, trx ? { transaction: trx } : undefined);
    if (!record) return null;
    return record.update(data, trx ? { transaction: trx } : undefined);
  }

  async delete(id: string, trx?: Transaction): Promise<boolean> {
    const count = await ${pascal}.destroy({
      where: { id } as WhereOptions,
      ...(trx ? { transaction: trx } : {}),
    });
    return count > 0;
  }
}
`;
}

function genQuery(name: string): string {
  const pascal = pascalCase(name);
  const camel = camelCase(name);
  return `import { Op } from 'sequelize';
import type { QueryBuilderConfig } from '../../../core/database/query-builder.js';

/**
 * Query builder config for ${pascal}.
 *
 * Use Sequelize model attribute names here (usually camelCase), not raw DB
 * column names. That keeps sort/select config aligned with mapper contracts.
 *
 * searchFields:    Model attributes searched with LIKE when ?search= is provided.
 * sortableFields:  Allowlist of model attributes valid for ?sortBy=. Any field not in
 *                  this list silently falls back to createdAt, preventing
 *                  arbitrary column exposure and index-miss attacks.
 * selectableFields: Allowlist for ?fields= field selection. Only these fields
 *                  can be returned, preventing internal/sensitive column leaks.
 * filters:         Maps query-param key to model attribute + Sequelize operator.
 * defaultIncludes: Eager-loaded associations to prevent N+1 queries.
 *
 * Uncomment and adjust after adding real columns to the model.
 */
export const ${camel}QueryConfig: QueryBuilderConfig = {
  searchFields: [
    // 'name',
    // 'description',
  ],
  sortableFields: [
    'createdAt',
    'updatedAt',
    // 'name',
    // 'price',
  ],
  selectableFields: [
    'id',
    'createdAt',
    'updatedAt',
    // 'name',
    // 'price',
  ],
  filters: {
    // yearMin:       { column: 'year',       type: 'number', operator: Op.gte },
    // yearMax:       { column: 'year',       type: 'number', operator: Op.lte },
    // isActive:      { column: 'is_active',  type: 'boolean' },
    // createdAfter:  { column: 'createdAt', type: 'date',   operator: Op.gte },
    // createdBefore: { column: 'createdAt', type: 'date',   operator: Op.lte },
  },
  // defaultIncludes: [
  //   // Add Sequelize include configs here to prevent N+1 queries.
  //   // Example: { model: ${pascal}Image, as: 'images', attributes: ['id', 'url'] }
  // ],
};

export { Op };
`;
}

function genMapper(name: string): string {
  const pascal = pascalCase(name);
  return `import type { ${pascal} } from '../${name}.model.js';
import type { ${pascal}ResponseDto, ${pascal}ResponseProjection } from '../dto/${name}-response.dto.js';

/**
 * Maps a Sequelize ${pascal} model to ${pascal}ResponseDto.
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

export function to${pascal}Response(model: ${pascal}): ${pascal}ResponseDto {
  return {
    id: model.id,
    createdAt: (model.createdAt as Date).toISOString(),
    updatedAt: (model.updatedAt as Date).toISOString(),
    // Map additional fields here:
    // name: model.name,
    // price: model.price,
  };
}

export function to${pascal}ResponseList(models: ${pascal}[]): ${pascal}ResponseProjection[] {
  return models.map((model) => {
    const createdAt = toIsoString(model.createdAt);
    const updatedAt = toIsoString(model.updatedAt);

    return {
      ...(typeof model.id === 'string' ? { id: model.id } : {}),
      ...(createdAt !== undefined ? { createdAt } : {}),
      ...(updatedAt !== undefined ? { updatedAt } : {}),
    };
  });
}
`;
}

function genPolicy(name: string): string {
  const pascal = pascalCase(name);
  const camel = camelCase(name);
  return `import type { JwtUserPayload } from '../../../types/index.js';
import type { ${pascal} } from '../${name}.model.js';
import { HttpError } from '../../../core/errors/http-error.js';

/**
 * Resource-level authorization policy for ${pascal}.
 *
 * Route-level RBAC (view_${name}, create_${name}, etc.) is handled by
 * requirePermission() middleware. Use this class for ownership checks
 * or additional business rules that need the loaded resource.
 *
 * Throw HttpError.forbidden() to deny access, return void to allow.
 */
export class ${pascal}Policy {
  canView(_user: JwtUserPayload, _resource?: ${pascal}): void {
    // Add resource-level checks here if needed.
  }

  canCreate(_user: JwtUserPayload): void {
    // Add creation business rules here if needed.
  }

  canUpdate(_user: JwtUserPayload, _resource: ${pascal}): void {
    // Example: throw HttpError.forbidden('...') when user cannot update.
  }

  canDelete(_user: JwtUserPayload, _resource: ${pascal}): void {
    // Example: throw HttpError.forbidden('...') when user cannot delete.
  }
}

export const ${camel}Policy = new ${pascal}Policy();
`;
}

function genService(name: string): string {
  const pascal = pascalCase(name);
  const camel = camelCase(name);
  const moduleConst = moduleConstantName(name);
  return `import { ${pascal}Repository } from './${name}.repository.js';
import { sequelize } from '../../config/database.js';
import { cacheService } from '../../core/cache/cache.service.js';
import { auditService } from '../../core/audit/audit.service.js';
import { HttpError } from '../../core/errors/http-error.js';
import { buildFindOptions } from '../../core/database/query-builder.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { AuditAction } from '../../constants/audit.constants.js';
import { ${moduleConst} } from '../../constants/modules.constants.js';
import { to${pascal}Response, to${pascal}ResponseList } from './mappers/${name}.mapper.js';
import { ${camel}Policy } from './policies/${name}.policy.js';
import { ${camel}QueryConfig } from './queries/${name}.query.js';
import type { Create${pascal}Dto } from './dto/create-${name}.dto.js';
import type { Update${pascal}Dto } from './dto/update-${name}.dto.js';
import type { Search${pascal}Dto } from './dto/search-${name}.dto.js';
import type { JwtUserPayload } from '../../types/index.js';

const repository = new ${pascal}Repository();
const CACHE_PREFIX = ${moduleConst};

export class ${pascal}Service {
  async findAll(query: Search${pascal}Dto) {
    const cacheKey = \`\${CACHE_PREFIX}:list:\${JSON.stringify(query)}\`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const findOptions = buildFindOptions(query, ${camel}QueryConfig);
    const { rows, count } = await repository.findAll(findOptions);
    const { page, limit } = query;

    const result = {
      data: to${pascal}ResponseList(rows),
      meta: buildPaginationMeta(page, limit, count),
    };

    await cacheService.set(cacheKey, result, 60);
    return result;
  }

  async findById(id: string) {
    const cacheKey = \`\${CACHE_PREFIX}:\${id}\`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const record = await repository.findById(id);
    if (!record) throw HttpError.notFound('${pascal} not found');

    const response = to${pascal}Response(record);
    await cacheService.set(cacheKey, response, 120);
    return response;
  }

  /**
   * Transaction wraps both the INSERT and the audit write so they succeed
   * or roll back together. Cache is busted only after successful commit.
   */
  async create(data: Create${pascal}Dto, user: JwtUserPayload, requestId?: string) {
    ${camel}Policy.canCreate(user);

    const record = await sequelize.transaction(async (trx) => {
      const created = await repository.create(data, trx);
      await auditService.persist({
        action: AuditAction.CREATE,
        module: ${moduleConst},
        entityId: created.id,
        userId: user.id,
        after: created.toJSON(),
        requestId,
        trx,
      });
      return created;
    });

    // Side effects after successful commit
    await cacheService.invalidatePattern(\`\${CACHE_PREFIX}:list:*\`);
    return to${pascal}Response(record);
  }

  /**
   * Reads the existing record before the transaction for policy check and
   * before-snapshot. The transaction boundary covers only the mutation and
   * audit write, keeping the lock window as small as possible.
   */
  async update(id: string, data: Update${pascal}Dto, user: JwtUserPayload, requestId?: string) {
    const existing = await repository.findById(id);
    if (!existing) throw HttpError.notFound('${pascal} not found');
    ${camel}Policy.canUpdate(user, existing);

    const record = await sequelize.transaction(async (trx) => {
      const updated = await repository.update(id, data, trx);
      if (!updated) throw HttpError.notFound('${pascal} not found');
      await auditService.persist({
        action: AuditAction.UPDATE,
        module: ${moduleConst},
        entityId: id,
        userId: user.id,
        before: existing.toJSON(),
        after: updated.toJSON(),
        requestId,
        trx,
      });
      return updated;
    });

    await cacheService.del(\`\${CACHE_PREFIX}:\${id}\`);
    await cacheService.invalidatePattern(\`\${CACHE_PREFIX}:list:*\`);
    return to${pascal}Response(record);
  }

  async delete(id: string, user: JwtUserPayload, requestId?: string) {
    const existing = await repository.findById(id);
    if (!existing) throw HttpError.notFound('${pascal} not found');
    ${camel}Policy.canDelete(user, existing);

    await sequelize.transaction(async (trx) => {
      const deleted = await repository.delete(id, trx);
      if (!deleted) throw HttpError.notFound('${pascal} not found');

      await auditService.persist({
        action: AuditAction.DELETE,
        module: ${moduleConst},
        entityId: id,
        userId: user.id,
        before: existing.toJSON(),
        requestId,
        trx,
      });
    });

    await cacheService.del(\`\${CACHE_PREFIX}:\${id}\`);
    await cacheService.invalidatePattern(\`\${CACHE_PREFIX}:list:*\`);
  }
}
`;
}

function genController(name: string): string {
  const pascal = pascalCase(name);
  return `import type { Request, Response, NextFunction } from 'express';
import { ${pascal}Service } from './${name}.service.js';
import { search${pascal}Schema } from './${name}.schema.js';
import { requireAuthenticatedUser, requireRouteParam } from '../../core/http/request-context.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';

const service = new ${pascal}Service();

export class ${pascal}Controller {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = search${pascal}Schema.parse(req.query);
      const result = await service.findAll(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.findById(requireRouteParam(req, 'id'));
      sendSuccess(res, { data });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = requireAuthenticatedUser(req);
      const data = await service.create(req.body, user, req.requestId);
      sendCreated(res, data);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = requireAuthenticatedUser(req);
      const data = await service.update(requireRouteParam(req, 'id'), req.body, user, req.requestId);
      sendSuccess(res, { data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const user = requireAuthenticatedUser(req);
      await service.delete(requireRouteParam(req, 'id'), user, req.requestId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
}
`;
}

function genRoutes(name: string): string {
  const pascal = pascalCase(name);
  const plural = pluralize(name);
  const permissionConst = permissionConstantName(name);
  return `import { Router } from 'express';
import { ${pascal}Controller } from './${name}.controller.js';
import { authenticate } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/auth/rbac.middleware.js';
import { validate } from '../../core/middleware/validate.middleware.js';
import { ${permissionConst} } from '../../constants/permissions.constants.js';
import { create${pascal}Schema, update${pascal}Schema, ${camelCase(name)}IdSchema, search${pascal}Schema } from './${name}.schema.js';

const router = Router();
const controller = new ${pascal}Controller();

/**
 * @openapi
 * /${plural}:
 *   get:
 *     tags: [${pascal}]
 *     summary: List all ${plural}
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
router.get('/', authenticate, requirePermission(${permissionConst}.VIEW), validate({ query: search${pascal}Schema }), controller.findAll.bind(controller));

/**
 * @openapi
 * /${plural}/{id}:
 *   get:
 *     tags: [${pascal}]
 *     summary: Get ${name} by ID
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
  '/:id',
  authenticate,
  requirePermission(${permissionConst}.VIEW),
  validate({ params: ${camelCase(name)}IdSchema }),
  controller.findById.bind(controller),
);

/**
 * @openapi
 * /${plural}:
 *   post:
 *     tags: [${pascal}]
 *     summary: Create ${name}
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
  '/',
  authenticate,
  requirePermission(${permissionConst}.CREATE),
  validate({ body: create${pascal}Schema }),
  controller.create.bind(controller),
);

/**
 * @openapi
 * /${plural}/{id}:
 *   put:
 *     tags: [${pascal}]
 *     summary: Update ${name}
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
router.put(
  '/:id',
  authenticate,
  requirePermission(${permissionConst}.UPDATE),
  validate({ params: ${camelCase(name)}IdSchema, body: update${pascal}Schema }),
  controller.update.bind(controller),
);

/**
 * @openapi
 * /${plural}/{id}:
 *   delete:
 *     tags: [${pascal}]
 *     summary: Delete ${name}
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
  '/:id',
  authenticate,
  requirePermission(${permissionConst}.DELETE),
  validate({ params: ${camelCase(name)}IdSchema }),
  controller.delete.bind(controller),
);

export const path = '/${plural}';
export default router;
`;
}

function genMigration(name: string): string {
  const table = pluralize(name.replace(/-/g, "_"));
  return `import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('${table}', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    // TODO: Add your domain columns here.
    // Examples:
    //   name:   { type: DataTypes.STRING(255), allowNull: false },
    //   price:  { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    //   status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false },
    //   user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // TODO: Add indexes for columns used in search, sort, filter, and FK lookups.
  // await queryInterface.addIndex('${table}', ['status']);
  // await queryInterface.addIndex('${table}', ['created_at']);
  // await queryInterface.addIndex('${table}', ['user_id']); // FK index
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('${table}');
}
`;
}

// ─── Permission Seeder ──────────────────────────────────────────────────────

function genPermissionSeeder(name: string): string {
  const permissionConst = permissionConstantName(name);
  return `import type { QueryInterface, QueryOptions } from 'sequelize';
import crypto from 'node:crypto';
import { ${permissionConst} } from '../../constants/permissions.constants.js';

interface BulkInsertOptions extends QueryOptions {
  ignoreDuplicates?: boolean;
}

const PERMISSIONS: string[] = Object.values(${permissionConst});

export async function up(queryInterface: QueryInterface): Promise<void> {
  const now = new Date();

  // 1. Insert permissions (skip duplicates)
  const permissionRows = PERMISSIONS.map((pname) => ({
    id: crypto.randomUUID(),
    name: pname,
    created_at: now,
    updated_at: now,
  }));

  const insertOpts: BulkInsertOptions = { ignoreDuplicates: true };
  await queryInterface.bulkInsert('permissions', permissionRows, insertOpts);

  // 2. Find admin role
  const [adminRoles] = await queryInterface.sequelize.query(
    \`SELECT id FROM roles WHERE name = 'admin' LIMIT 1\`,
  );
  const adminRole = (adminRoles as Array<{ id: string }>)[0];
  if (!adminRole) {
    console.warn('Seeder: admin role not found — skipping role_permissions insert');
    return;
  }

  // 3. Re-fetch inserted permission ids (handles pre-existing rows)
  const placeholders = PERMISSIONS.map(() => '?').join(', ');
  const [rows] = await queryInterface.sequelize.query(
    \`SELECT id FROM permissions WHERE name IN (\${placeholders})\`,
    { replacements: PERMISSIONS },
  );

  const rolePermRows = (rows as Array<{ id: string }>).map((p) => ({
    role_id: adminRole.id,
    permission_id: p.id,
  }));

  await queryInterface.bulkInsert('role_permissions', rolePermRows, insertOpts);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const placeholders = PERMISSIONS.map(() => '?').join(', ');
  await queryInterface.sequelize.query(
    \`DELETE FROM permissions WHERE name IN (\${placeholders})\`,
    { replacements: PERMISSIONS },
  );
}
`;
}

// ─── Postman Collection ─────────────────────────────────────────────────────

interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string }>;
    url: { raw: string; host: string[]; path: string[] };
    body?: {
      mode: string;
      raw: string;
      options: { raw: { language: string } };
    };
  };
}

interface PostmanCollection {
  info: { name: string; schema: string };
  variable: Array<{ key: string; value: string }>;
  item: Array<{ name: string; item: PostmanItem[] }>;
}

function getOrCreateCollection(): PostmanCollection {
  if (fs.existsSync(POSTMAN)) {
    return JSON.parse(fs.readFileSync(POSTMAN, "utf-8")) as PostmanCollection;
  }
  return {
    info: {
      name: "API Collection",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [{ key: "baseUrl", value: "http://localhost:3000/api" }],
    item: [],
  };
}

function updatePostman(name: string): void {
  const collection = getOrCreateCollection();
  const pascal = pascalCase(name);
  const plural = pluralize(name);

  if (collection.item.some((f) => f.name === pascal)) {
    console.log(`  skipped: Postman folder "${pascal}" already exists`);
    return;
  }

  const authHeader = { key: "Authorization", value: "Bearer {{token}}" };
  const jsonHeader = { key: "Content-Type", value: "application/json" };

  const folder = {
    name: pascal,
    item: [
      {
        name: `List ${pascal}`,
        request: {
          method: "GET",
          header: [authHeader],
          url: {
            raw: `{{baseUrl}}/${plural}?page=1&limit=10`,
            host: ["{{baseUrl}}"],
            path: [plural],
          },
        },
      },
      {
        name: `Get ${pascal}`,
        request: {
          method: "GET",
          header: [authHeader],
          url: {
            raw: `{{baseUrl}}/${plural}/:id`,
            host: ["{{baseUrl}}"],
            path: [plural, ":id"],
          },
        },
      },
      {
        name: `Create ${pascal}`,
        request: {
          method: "POST",
          header: [authHeader, jsonHeader],
          url: {
            raw: `{{baseUrl}}/${plural}`,
            host: ["{{baseUrl}}"],
            path: [plural],
          },
          body: {
            mode: "raw",
            raw: JSON.stringify({}, null, 2),
            options: { raw: { language: "json" } },
          },
        },
      },
      {
        name: `Update ${pascal}`,
        request: {
          method: "PUT",
          header: [authHeader, jsonHeader],
          url: {
            raw: `{{baseUrl}}/${plural}/:id`,
            host: ["{{baseUrl}}"],
            path: [plural, ":id"],
          },
          body: {
            mode: "raw",
            raw: JSON.stringify({}, null, 2),
            options: { raw: { language: "json" } },
          },
        },
      },
      {
        name: `Delete ${pascal}`,
        request: {
          method: "DELETE",
          header: [authHeader],
          url: {
            raw: `{{baseUrl}}/${plural}/:id`,
            host: ["{{baseUrl}}"],
            path: [plural, ":id"],
          },
        },
      },
    ] as PostmanItem[],
  };

  collection.item.push(folder);
  writeFile(POSTMAN, JSON.stringify(collection, null, 2));
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const rawName = process.argv[2];

  if (!rawName) {
    console.error("Usage: npm run make:crud <module-name>");
    console.error("Example: npm run make:crud user");
    process.exit(1);
  }

  const name = validateModuleName(rawName);
  const moduleDir = path.join(MODULES, name);

  if (fs.existsSync(moduleDir)) {
    console.error(
      `Error: Module "${name}" already exists at ${path.relative(ROOT, moduleDir)}`,
    );
    process.exit(1);
  }

  // Guard: block if a migration or seeder for this resource already exists
  const existingMigration = fs
    .readdirSync(fs.existsSync(MIGRATIONS) ? MIGRATIONS : ROOT)
    .find((f) => f.endsWith(`-create-${name}.ts`));
  if (existingMigration) {
    console.error(
      `Error: Migration for "${name}" already exists: ${existingMigration}`,
    );
    process.exit(1);
  }

  if (fs.existsSync(SEEDERS)) {
    const existingSeeder = fs
      .readdirSync(SEEDERS)
      .find((f) => f.endsWith(`-seed-${name}-permissions.ts`));
    if (existingSeeder) {
      console.error(
        `Error: Permission seeder for "${name}" already exists: ${existingSeeder}`,
      );
      process.exit(1);
    }
  }

  console.log(`\nGenerating module: ${name}\n`);

  await ensureConstantFiles(name);

  // Module files
  writeFile(path.join(moduleDir, `${name}.model.ts`), genModel(name));
  writeFile(path.join(moduleDir, `${name}.schema.ts`), genSchema(name));
  writeFile(
    path.join(moduleDir, "dto", `create-${name}.dto.ts`),
    genCreateDto(name),
  );
  writeFile(
    path.join(moduleDir, "dto", `update-${name}.dto.ts`),
    genUpdateDto(name),
  );
  writeFile(
    path.join(moduleDir, "dto", `search-${name}.dto.ts`),
    genSearchDto(name),
  );
  writeFile(
    path.join(moduleDir, "dto", `${name}-response.dto.ts`),
    genResponseDto(name),
  );
  writeFile(
    path.join(moduleDir, "queries", `${name}.query.ts`),
    genQuery(name),
  );
  writeFile(
    path.join(moduleDir, "mappers", `${name}.mapper.ts`),
    genMapper(name),
  );
  writeFile(
    path.join(moduleDir, "policies", `${name}.policy.ts`),
    genPolicy(name),
  );
  writeFile(path.join(moduleDir, `${name}.repository.ts`), genRepository(name));
  writeFile(path.join(moduleDir, `${name}.service.ts`), genService(name));
  writeFile(path.join(moduleDir, `${name}.controller.ts`), genController(name));
  writeFile(path.join(moduleDir, `${name}.routes.ts`), genRoutes(name));

  // Migration
  const ts = timestamp();
  const migrationFile = `${ts}-create-${name}.ts`;
  writeFile(path.join(MIGRATIONS, migrationFile), genMigration(name));

  // Permission seeder (timestamp +1 second to guarantee ordering after migration)
  const seederTs = (() => {
    const d = new Date();
    d.setSeconds(d.getSeconds() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  })();
  const seederFile = `${seederTs}-seed-${name}-permissions.ts`;
  writeFile(path.join(SEEDERS, seederFile), genPermissionSeeder(name));

  // Postman
  updatePostman(name);

  console.log(`\nModule "${name}" generated successfully!\n`);
}

main().catch((error) => {
  console.error("Failed to generate module:", error);
  process.exit(1);
});
