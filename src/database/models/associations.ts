import { User } from "../../modules/user/user.model.js";
import { Role } from "../../modules/roles/role.model.js";
import { Permission } from "../../modules/permissions/permission.model.js";
import { RolePermission } from "../../modules/roles/role-permission.model.js";

export function setupAssociations(): void {
  User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  Role.hasMany(User, { foreignKey: "roleId" });

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
}
