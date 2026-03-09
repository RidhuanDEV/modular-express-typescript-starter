import { User } from "../user/user.model.js";
import { Role } from "../roles/role.model.js";
import type { Transaction } from "sequelize";

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await User.count({ where: { email } });
    return count > 0;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name } });
  }

  async createUser(
    data: {
      email: string;
      password: string;
      roleId: string;
    },
    trx?: Transaction,
  ): Promise<User> {
    return User.create(data, trx ? { transaction: trx } : undefined);
  }
}
