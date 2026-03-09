import { Op } from "sequelize";
import type {
  FindOptions,
  OrderItem,
  WhereOptions,
  Includeable,
} from "sequelize";

// ─── Public Interfaces ───────────────────────────────────────────────────────

/**
 * Every generated SearchDto must satisfy this interface.
 * The generator enforces these fields via the searchSchema template.
 */
export interface BaseSearchQuery {
  page: number;
  limit: number;
  sortBy?: string | undefined;
  orderBy?: "asc" | "desc" | undefined;
  search?: string | undefined;
  /** Comma-separated list of response/model field names to include in list responses. */
  fields?: string | undefined;
}

export type FilterType = "string" | "number" | "boolean" | "enum" | "date";

export interface FilterConfig {
  /** Sequelize model attribute name (usually camelCase). */
  column: string;
  type: FilterType;
  /**
   * Sequelize Op symbol. Defaults to Op.eq.
   * Common values: Op.gte, Op.lte, Op.like, Op.in, Op.ne
   */
  operator?: symbol;
}

export interface QueryBuilderConfig {
  /**
   * Sequelize model attribute names to search with LIKE when `search` is provided.
   * Example: ['name', 'description']
   */
  searchFields?: string[];

  /**
   * Map from query-param key → model attribute filter definition.
   * Example: { yearMin: { column: 'year', type: 'number', operator: Op.gte } }
   */
  filters?: Record<string, FilterConfig>;

  /**
   * Allowlist of Sequelize model attribute names that are valid `sortBy` targets.
   * If defined and the requested sort field is not in this list,
   * the sort silently falls back to 'createdAt' — preventing arbitrary
   * column exposure and potential index-miss attacks.
   *
   * If undefined, any sort field is accepted (backwards-compatible).
   * Example: ['createdAt', 'updatedAt', 'price', 'name']
   */
  sortableFields?: string[];

  /**
   * Allowlist of response/model fields that may be returned via the ?fields= param.
   * Only fields present in this list are ever selected, preventing
   * accidental exposure of internal or sensitive columns.
   *
   * Keep this aligned with the mapper so field selection remains an API-layer
   * concern rather than leaking raw database shape.
   *
   * Example: ['id', 'name', 'price', 'createdAt']
   */
  selectableFields?: string[];

  /**
   * Default Sequelize includes (eager-loaded associations).
   * Use this to prevent N+1 queries when the module has relations.
   *
   * Example:
   *   [{ model: ListingImage, as: 'images', attributes: ['id', 'url'] }]
   */
  defaultIncludes?: Includeable[];
}

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Converts a parsed SearchDto into Sequelize FindOptions.
 *
 * @param query  The parsed search DTO (must extend BaseSearchQuery).
 * @param config Query builder configuration for this module.
 */
export function buildFindOptions<Q extends BaseSearchQuery>(
  query: Q,
  config: QueryBuilderConfig = {},
): FindOptions {
  const { page, limit, sortBy, search, fields, orderBy } = query;

  // ── Pagination ──────────────────────────────────────────────────────────
  const offset = (page - 1) * limit;

  // ── Sorting with allowlist ───────────────────────────────────────────────
  // If sortableFields is defined, reject unknown sortBy values by falling back
  // to createdAt — this prevents arbitrary column exposure and index-miss risks.
  const rawSortField = sortBy ? sortBy : "createdAt";
  const sortField =
    config.sortableFields && config.sortableFields.length > 0
      ? config.sortableFields.includes(rawSortField)
        ? rawSortField
        : "createdAt"
      : rawSortField;
  const sortDir = orderBy === "desc" ? "DESC" : "ASC";
  const orders: OrderItem[] = [[sortField, sortDir]];

  // ── WHERE clause ─────────────────────────────────────────────────────────
  const where: Record<string | symbol, unknown> = {};

  // Full-text search across configured fields
  if (search != null && search.length > 0 && config.searchFields?.length) {
    where[Op.or] = config.searchFields.map((col) => ({
      [col]: { [Op.like]: `%${search}%` },
    }));
  }

  // Typed filter fields
  if (config.filters) {
    const queryRecord = query as Record<string, unknown>;

    for (const [queryKey, filterCfg] of Object.entries(config.filters)) {
      const raw = queryRecord[queryKey];
      if (raw === undefined || raw === null) continue;

      const coerced = coerceFilterValue(raw, filterCfg.type);
      const op = filterCfg.operator ?? Op.eq;

      const existing = where[filterCfg.column];
      if (
        existing !== undefined &&
        typeof existing === "object" &&
        existing !== null
      ) {
        (existing as Record<symbol, unknown>)[op] = coerced;
      } else {
        where[filterCfg.column] = { [op]: coerced };
      }
    }
  }

  // ── Field selection (attributes allowlist) ───────────────────────────────
  // Only allow fields explicitly listed in selectableFields to be selected.
  // This prevents internal/sensitive columns from being exposed via ?fields=.
  let attributes: string[] | undefined;
  if (fields && config.selectableFields?.length) {
    const requested = Array.from(
      new Set(
        fields
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      ),
    );
    const filtered = requested.filter((f) =>
      config.selectableFields!.includes(f),
    );
    if (filtered.length > 0) attributes = filtered;
  }

  return {
    where: where as WhereOptions,
    offset,
    limit,
    order: orders,
    ...(attributes ? { attributes } : {}),
    ...(config.defaultIncludes?.length
      ? { include: config.defaultIncludes }
      : {}),
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function coerceFilterValue(value: unknown, type: FilterType): unknown {
  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return value === "true" || value === true || value === "1" || value === 1;
    case "date":
      return new Date(String(value));
    default:
      return value;
  }
}
