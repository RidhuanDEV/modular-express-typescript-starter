import { redis } from "../../config/redis.js";
import { logger } from "../logger/logger.js";

export class CacheService {
  private readonly prefix: string;
  private readonly defaultTtl: number;

  constructor(prefix = "cache", defaultTtl = 300) {
    this.prefix = prefix;
    this.defaultTtl = defaultTtl;
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`;
  }

  async get<T>(k: string): Promise<T | null> {
    const raw = await redis.get(this.key(k));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      logger.warn({ key: k }, "Cache parse error");
      return null;
    }
  }

  async set(k: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await redis.set(this.key(k), serialized, "EX", ttl ?? this.defaultTtl);
  }

  async del(k: string): Promise<void> {
    await redis.del(this.key(k));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(this.key(pattern));
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug({ pattern, count: keys.length }, "Cache invalidated");
    }
  }
}

export const cacheService = new CacheService();
