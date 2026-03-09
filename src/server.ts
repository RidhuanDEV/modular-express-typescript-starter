import { app } from "./app.js";
import { env } from "./config/env.js";
import { sequelize } from "./config/database.js";
import { redis } from "./config/redis.js";
import { loadModels } from "./database/models/index.js";
import { closeQueues } from "./core/queue/queue.service.js";
import { logger } from "./core/logger/logger.js";

async function bootstrap(): Promise<void> {
  await loadModels();

  await sequelize.authenticate();
  logger.info("Database connected");

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server started");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Graceful shutdown initiated");

    server.close(async () => {
      await closeQueues();
      await sequelize.close();
      redis.disconnect();
      logger.info("Server shut down");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown — timeout exceeded");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
