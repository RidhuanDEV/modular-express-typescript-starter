import { Sequelize } from "sequelize";
import { env } from "./env.js";
import { logger } from "../core/logger/logger.js";

export const sequelize = new Sequelize(env.DATABASE_URL, {
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
});
