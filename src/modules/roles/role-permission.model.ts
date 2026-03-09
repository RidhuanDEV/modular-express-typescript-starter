import { DataTypes, Model } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";

export class RolePermission extends Model<
  InferAttributes<RolePermission>,
  InferCreationAttributes<RolePermission>
> {
  declare roleId: string;
  declare permissionId: string;
}

export function initModel(sequelize: Sequelize): typeof RolePermission {
  RolePermission.init(
    {
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      permissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      sequelize,
      tableName: "role_permissions",
      underscored: true,
      timestamps: false,
    },
  );
  return RolePermission;
}
