import { Role } from "./role.model.js";
import { Permission } from "../permissions/permission.model.js";
import type { InferAttributes, Transaction } from "sequelize";
import type { CreateRoleDto, UpdateRoleDto } from "./role.schema.js";

export class RoleRepository {
  async findAll(): Promise<Role[]> {
    return Role.findAll({
      include: [{ model: Permission, as: "permissions" }],
    });
  }

  async findById(id: string, trx?: Transaction): Promise<Role | null> {
    return Role.findByPk(id, {
      ...(trx ? { transaction: trx } : {}),
      include: [{ model: Permission, as: "permissions" }],
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name } });
  }

  async create(data: CreateRoleDto, trx?: Transaction): Promise<Role> {
    return Role.create(data, trx ? { transaction: trx } : undefined);
  }

  async update(
    id: string,
    data: UpdateRoleDto,
    trx?: Transaction,
  ): Promise<Role | null> {
    const record = await Role.findByPk(
      id,
      trx ? { transaction: trx } : undefined,
    );
    if (!record) return null;
    const fields: Partial<InferAttributes<Role>> = {};
    if (data.name !== undefined) fields.name = data.name;
    return record.update(fields, trx ? { transaction: trx } : undefined);
  }

  async delete(id: string, trx?: Transaction): Promise<boolean> {
    const count = await Role.destroy({
      where: { id },
      ...(trx ? { transaction: trx } : {}),
    });
    return count > 0;
  }

  async setPermissions(
    roleId: string,
    permissionIds: string[],
    trx?: Transaction,
  ): Promise<void> {
    const role = await Role.findByPk(
      roleId,
      trx ? { transaction: trx } : undefined,
    );
    if (!role) return;
    // @ts-expect-error — setPermissions is added by Sequelize BelongsToMany
    await role.setPermissions(
      permissionIds,
      trx ? { transaction: trx } : undefined,
    );
  }
}
