import {
  Queue,
  Worker,
  type Job,
  type JobsOptions,
  type Processor,
  type ConnectionOptions,
} from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../logger/logger.js";

/**
 * BullMQ queue primitives for background jobs.
 *
 * How to use:
 *
 * 1. Enqueue a job from your service layer:
 *    await addJob("welcome-email", "send", { userId, email });
 *
 * 2. Register a worker in a dedicated file (recommended: src/workers/welcomeEmail.worker.ts):
 *    import { registerWorker } from "../core/queue/queue.service.js";
 *    registerWorker("welcome-email", async (job) => {
 *      const { userId, email } = job.data;
 *      await emailService.sendWelcome(email);
 *    }, 5); // concurrency: integer 1-50
 *
 * 3. Import your worker file in server.ts or bootstrap entry point:
 *    import "../workers/welcomeEmail.worker.js";
 *
 * 4. Jobs are retried, logged, and cleaned up automatically.
 *
 * Best practice:
 * - Put worker logic in src/workers/ for clarity and scalability
 * - Do not register workers directly in server.ts
 *
 * Queue name requirements:
 * - 3-32 chars, lowercase, alphanumeric or dash (a-z, 0-9, -)
 *
 * Worker concurrency:
 * - Recommended range: 1–50 (internal rule, not BullMQ limit)
 *
 * When to use queues:
 * - Email, webhook, report generation, heavy async processing
 *
 * When NOT to use queues:
 * - CRUD, validation, lightweight queries, transactional audit
 */

const redisUrl = new URL(env.REDIS_URL);
const redisDatabase =
  redisUrl.pathname.length > 1 ? Number(redisUrl.pathname.slice(1)) : undefined;

const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  ...(redisUrl.username
    ? { username: decodeURIComponent(redisUrl.username) }
    : {}),
  ...(redisUrl.password
    ? { password: decodeURIComponent(redisUrl.password) }
    : {}),
  ...(Number.isFinite(redisDatabase) ? { db: redisDatabase } : {}),
  ...(redisUrl.protocol === "rediss:" ? { tls: {} } : {}),
};

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1_000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
} satisfies JobsOptions;

const queues = new Map<string, Queue>();
const workers = new Map<string, Worker>();

function assertQueueName(name: string): void {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("Queue name must not be empty");
  }
  // Enforce queue name: lowercase, alphanumeric, dashes, 3-32 chars
  const queueNameRegex = /^[a-z0-9\-]{3,32}$/;
  if (!queueNameRegex.test(trimmed)) {
    throw new Error(
      "Queue name must be 3-32 chars, lowercase, alphanumeric or dash (a-z, 0-9, -)",
    );
  }
}

/**
 * Lazily create and cache a BullMQ queue instance.
 *
 * Queue creation is deferred until first use so the foundation stays cheap when
 * the application does not enqueue any jobs.
 */
export function getQueue(name: string): Queue {
  assertQueueName(name);

  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    queues.set(name, queue);
    logger.info({ queue: name }, "Queue created");
  }

  return queue;
}

/**
 * Register a worker for a queue name.
 *
 * The service intentionally prevents duplicate worker registration so the same
 * process does not accidentally consume the same queue twice.
 */
export function registerWorker<T = unknown>(
  name: string,
  processor: Processor<T>,
  concurrency = 5,
): Worker<T> {
  assertQueueName(name);
  if (workers.has(name)) {
    throw new Error(`Worker "${name}" is already registered`);
  }
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer");
  }
  const worker = new Worker<T>(name, processor, {
    connection,
    concurrency,
  });

  worker.on("completed", (job: Job<T>) => {
    logger.info(
      { queue: name, jobId: job.id, jobName: job.name },
      "Job completed",
    );
  });

  worker.on("failed", (job: Job<T> | undefined, err: Error) => {
    logger.error(
      { queue: name, jobId: job?.id, jobName: job?.name, err },
      "Job failed",
    );
  });

  worker.on("error", (err: Error) => {
    logger.error(
      { queue: name, err: err.message, stack: err.stack },
      "Worker error",
    );
  });

  workers.set(name, worker);
  logger.info({ queue: name, concurrency }, "Worker registered");
  return worker;
}

/**
 * Enqueue a job with optional BullMQ job options.
 *
 * Defaults are intentionally pragmatic: limited retries, exponential backoff,
 * and automatic cleanup of old completed/failed jobs to avoid unbounded growth.
 */
export async function addJob<T>(
  queueName: string,
  jobName: string,
  data: T,
  options: JobsOptions = {},
): Promise<Job<T>> {
  assertQueueName(queueName);
  if (jobName.trim().length === 0) {
    throw new Error("Job name must not be empty");
  }
  const queue = getQueue(queueName);
  const job = await queue.add(jobName, data, options);
  logger.info({ queue: queueName, jobId: job.id, jobName }, "Job enqueued");
  return job;
}

/**
 * Best-effort shutdown for all registered workers and queues.
 *
 * Errors are logged but do not stop the remaining resources from closing.
 */
export async function closeQueues(): Promise<void> {
  for (const [name, worker] of workers) {
    try {
      await worker.close();
      logger.info({ queue: name }, "Worker closed");
    } catch (err) {
      logger.error({ queue: name, err }, "Failed to close worker");
    } finally {
      workers.delete(name);
    }
  }

  for (const [name, queue] of queues) {
    try {
      await queue.close();
      logger.info({ queue: name }, "Queue closed");
    } catch (err) {
      logger.error({ queue: name, err }, "Failed to close queue");
    } finally {
      queues.delete(name);
    }
  }
}
