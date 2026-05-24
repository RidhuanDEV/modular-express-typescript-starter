import { logger } from "../../core/logger/logger.js";
import { Role, initModel as initRole } from "../../modules/roles/role.model.js";
import { Permission, initModel as initPermission } from "../../modules/permissions/permission.model.js";
import { RolePermission, initModel as initRolePermission } from "../../modules/roles/role-permission.model.js";
import { User, initModel as initUser } from "../../modules/user/user.model.js";
import { AuditLog, initModel as initAuditLog } from "../../core/audit/audit-log.model.js";
import type { Sequelize } from "sequelize";

export async function loadModels(sequelize: Sequelize): Promise<void> {
  // Initialize models with the Sequelize instance
  initRole(sequelize);
  initPermission(sequelize);
  initRolePermission(sequelize);
  initUser(sequelize);
  initAuditLog(sequelize);

  const models = [Role, Permission, RolePermission, User, AuditLog];

  for (const model of models) {
    logger.info(`Loaded Model: ${model.name.toLowerCase()}.model.ts`);
  }

  // Configure Associations
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "roleId",
    otherKey: "permissionId",
    as: "permissions",
  });

  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permissionId",
    otherKey: "roleId",
    as: "roles",
  });

  User.belongsTo(Role, {
    foreignKey: "roleId",
    as: "role",
  });

  Role.hasMany(User, {
    foreignKey: "roleId",
    as: "users",
  });

  logger.info("Model associations configured");
}
