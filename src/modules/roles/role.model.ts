import { DataTypes, Model } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import type { Permission } from "../permissions/permission.model.js";
import type { User } from "../user/user.model.js";

export class Role extends Model<
  InferAttributes<Role, { omit: "permissions" | "users" }>,
  InferCreationAttributes<Role, { omit: "permissions" | "users" }>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (eager-loaded)
  declare permissions?: NonAttribute<Permission[]>;
  declare users?: NonAttribute<User[]>;
}

export function initModel(sequelize: Sequelize): typeof Role {
  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "roles",
      underscored: true,
    },
  );
  return Role;
}
