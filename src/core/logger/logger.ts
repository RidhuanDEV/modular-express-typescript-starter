import pino, { type LoggerOptions } from "pino";
import { env } from "../../config/env.js";

const options: LoggerOptions = {
  level: env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

let usePretty = env.NODE_ENV !== "production";
if (process.env.IS_DOCKER === "true") {
  usePretty = false;
}

if (usePretty) {
  options.transport = { target: "pino-pretty", options: { colorize: true } };
}

export const logger = pino(options);
