import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../core/logger/logger.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err: Error) =>
  logger.error({ err }, "Redis connection error"),
);
