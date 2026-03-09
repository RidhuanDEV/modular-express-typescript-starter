import { DataTypes, Model } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

/**
 * Persistent audit log record. Every CREATE, UPDATE, and DELETE mutation
 * writes one row here — inside the same transaction as the data mutation —
 * so the audit trail is always consistent with the actual database state.
 *
 * Activity-only events (login, view, export) should use auditService.log()
 * which writes to the logger without touching this table.
 */
export class AuditLog extends Model<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  declare id: CreationOptional<string>;
  /** e.g. 'CREATE' | 'UPDATE' | 'DELETE' */
  declare action: string;
  /** Module / resource name, e.g. 'listing', 'user' */
  declare module: string;
  /** Primary key of the affected record */
  declare entityId: string;
  /** ID of the user who triggered the action */
  declare userId: string;
  /** JSON-serialised snapshot of the record BEFORE the change (null for CREATE) */
  declare before: string | null;
  /** JSON-serialised snapshot of the payload AFTER the change (null for DELETE) */
  declare after: string | null;
  /** X-Request-Id for cross-referencing with access logs */
  declare requestId: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initModel(sequelize: Sequelize): typeof AuditLog {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      action: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      module: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      before: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      after: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestId: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "audit_logs",
      underscored: true,
      indexes: [
        // Query by module + entity (e.g. "show history of listing #42")
        { fields: ["module", "entity_id"] },
        // Query by actor (e.g. "what did user X do?")
        { fields: ["user_id"] },
        // Time-range queries and sorting
        { fields: ["created_at"] },
      ],
    },
  );
  return AuditLog;
}
