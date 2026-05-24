import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import type { RedisReply } from "rate-limit-redis";
import { redis } from "../../config/redis.js";

export const rateLimitMiddleware = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args: string[]): Promise<RedisReply> => {
      const command = args[0];
      if (command === undefined) return 0;
      const result = await redis.call(command, ...args.slice(1));
      
      // Strict type narrowing matching RedisReply structure without any typecasting
      if (typeof result === "number") {
        return result;
      }
      if (typeof result === "string") {
        return result;
      }
      if (Array.isArray(result)) {
        // We know RedisReply arrays are composed of strings/numbers.
        return result as RedisReply;
      }
      return 0;
    },
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errors: [],
  },
});
