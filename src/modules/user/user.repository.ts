import { User } from "./user.model.js";
import { Role } from "../roles/role.model.js";
import type {
  FindOptions,
  Transaction,
  CreateOptions,
  InferAttributes,
  InstanceUpdateOptions,
  InstanceDestroyOptions,
} from "sequelize";
import type { CreateUserDto } from "./dto/create-user.dto.js";
import type { UpdateUserDto } from "./dto/update-user.dto.js";

export class UserRepository {
  async findAll(options?: FindOptions): Promise<{ rows: User[]; count: number }> {
    const findOptions: FindOptions = {
      ...options,
      include: options?.include || [{ model: Role, as: "role" }],
    };
    return User.findAndCountAll(findOptions);
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id, {
      include: [{ model: Role, as: "role" }],
    });
  }

  async create(data: CreateUserDto, transaction?: Transaction): Promise<User> {
    const options: CreateOptions<InferAttributes<User>> = {};
    if (transaction !== undefined) {
      options.transaction = transaction;
    }
    return User.create(
      {
        email: data.email,
        password: data.password,
        roleId: data.roleId,
      },
      options,
    );
  }

  async update(
    id: string,
    data: UpdateUserDto,
    transaction?: Transaction,
  ): Promise<User | null> {
    const findOptions: Omit<FindOptions<InferAttributes<User>>, "where"> = {};
    if (transaction !== undefined) {
      findOptions.transaction = transaction;
    }
    const user = await User.findByPk(id, findOptions);
    if (!user) return null;

    const fields: Partial<User> = {};
    if (data.email !== undefined) fields.email = data.email;
    if (data.roleId !== undefined) fields.roleId = data.roleId;

    const updateOptions: InstanceUpdateOptions<InferAttributes<User>> = {};
    if (transaction !== undefined) {
      updateOptions.transaction = transaction;
    }
    await user.update(fields, updateOptions);
    return user;
  }

  async delete(id: string, transaction?: Transaction): Promise<void> {
    const findOptions: Omit<FindOptions<InferAttributes<User>>, "where"> = {};
    if (transaction !== undefined) {
      findOptions.transaction = transaction;
    }
    const user = await User.findByPk(id, findOptions);
    if (user) {
      const destroyOptions: InstanceDestroyOptions = {};
      if (transaction !== undefined) {
        destroyOptions.transaction = transaction;
      }
      await user.destroy(destroyOptions);
    }
  }
}
