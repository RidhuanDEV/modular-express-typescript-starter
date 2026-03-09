import type { QueryBuilderConfig } from "../../../core/database/query-builder.js";

/**
 * Query builder config for User.
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
export const userQueryConfig: QueryBuilderConfig = {
  searchFields: [
    "email",
    // 'name',
  ],
  sortableFields: [
    "createdAt",
    "updatedAt",
    "email",
    // 'name',
  ],
  selectableFields: [
    "id",
    "email",
    "roleId",
    // Add internal/sensitive fields here only if you want them in response.
  ],
  filters: {
    // example: { roleId: { attribute: 'roleId', op: Op.eq } },
  },
  defaultIncludes: [
    {
      association: "role",
      include: [{ association: "permissions" }],
    },
  ],
};
