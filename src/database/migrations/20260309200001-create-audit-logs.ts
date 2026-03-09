import type { QueryInterface } from "sequelize";
import { DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("audit_logs", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    user_id: {
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
    request_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Index: history lookup by resource (most common query)
  await queryInterface.addIndex("audit_logs", ["module", "entity_id"]);
  // Index: query by actor
  await queryInterface.addIndex("audit_logs", ["user_id"]);
  // Index: time-range queries and chronological listing
  await queryInterface.addIndex("audit_logs", ["created_at"]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("audit_logs");
}
