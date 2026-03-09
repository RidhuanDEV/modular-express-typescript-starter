import type { Transaction } from "sequelize";
import { logger } from "../logger/logger.js";
import { auditLogRepository } from "./audit-log.repository.js";
import type { AuditActionType } from "../../constants/audit.constants.js";
import type { ModuleName } from "../../constants/modules.constants.js";

export interface PersistAuditOptions {
  /** Use a value from AuditAction, e.g. AuditAction.CREATE. */
  action: AuditActionType;
  /** Use a value from module constants, e.g. USER_MODULE. */
  module: ModuleName;
  /** Primary key of the affected record */
  entityId: string;
  /** ID of the user who triggered the action */
  userId: string;
  /** Snapshot of the record before the change (omit for CREATE) */
  before?: unknown;
  /** Payload after the change (omit for DELETE) */
  after?: unknown;
  /** X-Request-Id for cross-referencing with access logs */
  requestId?: string | undefined;
  /**
   * Sequelize transaction to join.
   * Pass the same transaction as the main mutation so that the audit
   * record is rolled back if the data write fails.
   */
  trx?: Transaction;
}

export class AuditService {
  /**
   * Activity log — writes to the logger only.
   *
   * Use for events that do NOT need a persistent audit trail:
   * login, view, export, bulk reads, etc.
   */
  log(
    action: AuditActionType,
    module: ModuleName,
    userId: string,
    data?: unknown,
  ): void {
    logger.info(
      {
        audit: {
          action,
          module,
          userId,
          data,
          timestamp: new Date().toISOString(),
        },
      },
      `AUDIT: ${action} on ${module} by ${userId}`,
    );
  }

  /**
   * Persistent audit trail — writes to the `audit_logs` table.
   *
   * Use for CREATE, UPDATE, and DELETE operations.
   * Always pass `trx` so the audit row is written inside the same
   * database transaction as the data mutation — this guarantees that
   * a rollback removes both the data change and its audit record.
   */
  async persist(options: PersistAuditOptions): Promise<void> {
    const { action, module, entityId, userId, before, after, requestId, trx } =
      options;

    await auditLogRepository.create(
      {
        action,
        module,
        entityId,
        userId,
        before,
        after,
        requestId: requestId ?? null,
      },
      trx,
    );

    // Mirror to logger for real-time observability alongside the DB write.
    this.log(action, module, userId, { entityId, before, after });
  }
}

export const auditService = new AuditService();
