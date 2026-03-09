import { User } from "./user.model.js";
import type { FindOptions, WhereOptions, Transaction } from "sequelize";
import type { CreateUserDto } from "./dto/create-user.dto.js";
import type { UpdateUserDto } from "./dto/update-user.dto.js";

export class UserRepository {
  async findAll(
    options: FindOptions = {},
  ): Promise<{ rows: User[]; count: number }> {
    return User.findAndCountAll(options);
  }

  async findById(id: string, trx?: Transaction): Promise<User | null> {
    return User.findByPk(id, trx ? { transaction: trx } : undefined);
  }

  async create(data: CreateUserDto, trx?: Transaction): Promise<User> {
    return User.create(data, trx ? { transaction: trx } : undefined);
  }

  async update(
    id: string,
    data: UpdateUserDto,
    trx?: Transaction,
  ): Promise<User | null> {
    const record = await User.findByPk(
      id,
      trx ? { transaction: trx } : undefined,
    );
    if (!record) return null;
    return record.update(data as any, trx ? { transaction: trx } : undefined);
  }

  async delete(id: string, trx?: Transaction): Promise<boolean> {
    const count = await User.destroy({
      where: { id } as WhereOptions,
      ...(trx ? { transaction: trx } : {}),
    });
    return count > 0;
  }
}
