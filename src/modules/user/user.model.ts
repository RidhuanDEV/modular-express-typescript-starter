import { DataTypes, Model } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import type { Role } from "../roles/role.model.js";

export class User extends Model<
  InferAttributes<User, { omit: "role" }>,
  InferCreationAttributes<User, { omit: "role" }>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare password: string;
  declare roleId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  // Association (eager-loaded)
  declare role?: NonAttribute<Role>;
}

export interface UserCreateInput {
  email: string;
  password: string;
  roleId: string;
}

export function initModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "users",
      paranoid: true,
      underscored: true,
    },
  );
  return User;
}
