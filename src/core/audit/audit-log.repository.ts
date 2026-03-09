import { AuditLog } from "./audit-log.model.js";
import type { Transaction } from "sequelize";

export interface CreateAuditLogData {
  action: string;
  module: string;
  entityId: string;
  userId: string;
  /** Data snapshot before the change. Will be JSON-serialised. */
  before?: unknown;
  /** Data snapshot after the change. Will be JSON-serialised. */
  after?: unknown;
  requestId?: string | null;
}

export class AuditLogRepository {
  async create(data: CreateAuditLogData, trx?: Transaction): Promise<void> {
    await AuditLog.create(
      {
        action: data.action,
        module: data.module,
        entityId: data.entityId,
        userId: data.userId,
        before: data.before !== undefined ? JSON.stringify(data.before) : null,
        after: data.after !== undefined ? JSON.stringify(data.after) : null,
        requestId: data.requestId ?? null,
      },
      trx ? { transaction: trx } : undefined,
    );
  }
}

export const auditLogRepository = new AuditLogRepository();
