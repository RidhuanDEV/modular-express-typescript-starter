// CJS config for sequelize-cli
const dotenv = require("dotenv");
dotenv.config();

const config = {
  url: process.env.DATABASE_URL,
  dialect: "mysql",
  migrationStorageTableName: "sequelize_meta",
  seederStorage: "sequelize",
  seederStorageTableName: "sequelize_data",
};

module.exports = {
  development: config,
  production: config,
  test: config,
};
