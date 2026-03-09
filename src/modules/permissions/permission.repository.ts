import { Permission } from "./permission.model.js";
import type { InferAttributes, Transaction } from "sequelize";
import type {
  CreatePermissionDto,
  UpdatePermissionDto,
} from "./permission.schema.js";

export class PermissionRepository {
  async findAll(): Promise<Permission[]> {
    return Permission.findAll();
  }

  async findById(id: string, trx?: Transaction): Promise<Permission | null> {
    return Permission.findByPk(id, trx ? { transaction: trx } : undefined);
  }

  async findByName(name: string): Promise<Permission | null> {
    return Permission.findOne({ where: { name } });
  }

  async create(
    data: CreatePermissionDto,
    trx?: Transaction,
  ): Promise<Permission> {
    return Permission.create(data, trx ? { transaction: trx } : undefined);
  }

  async update(
    id: string,
    data: UpdatePermissionDto,
    trx?: Transaction,
  ): Promise<Permission | null> {
    const record = await Permission.findByPk(
      id,
      trx ? { transaction: trx } : undefined,
    );
    if (!record) return null;
    const fields: Partial<InferAttributes<Permission>> = {};
    if (data.name !== undefined) fields.name = data.name;
    return record.update(fields, trx ? { transaction: trx } : undefined);
  }

  async delete(id: string, trx?: Transaction): Promise<boolean> {
    const count = await Permission.destroy({
      where: { id },
      ...(trx ? { transaction: trx } : {}),
    });
    return count > 0;
  }
}
