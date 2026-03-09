import { DataTypes, Model } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import type { Role } from "../roles/role.model.js";

export class Permission extends Model<
  InferAttributes<Permission, { omit: "roles" }>,
  InferCreationAttributes<Permission, { omit: "roles" }>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Association (eager-loaded)
  declare roles?: NonAttribute<Role[]>;
}

export function initModel(sequelize: Sequelize): typeof Permission {
  Permission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "permissions",
      underscored: true,
    },
  );
  return Permission;
}
