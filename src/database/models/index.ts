import path from "node:path";
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sequelize } from "../../config/database.js";
import { logger } from "../../core/logger/logger.js";
import { setupAssociations } from "./associations.js";
import { initModel as initAuditLog } from "../../core/audit/audit-log.model.js";

const isTs = import.meta.url.endsWith(".ts");
const ext = isTs ? ".model.ts" : ".model.js";

export async function loadModels(): Promise<void> {
  const modulesDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../modules",
  );

  let entries: string[];
  try {
    entries = readdirSync(modulesDir);
  } catch {
    logger.warn("No modules directory found — skipping model loading");
    return;
  }

  for (const entry of entries) {
    const moduleDir = path.join(modulesDir, entry);
    let files: string[];
    try {
      files = readdirSync(moduleDir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (file.endsWith(ext)) {
        const filePath = pathToFileURL(path.join(moduleDir, file)).href;
        const mod = (await import(filePath)) as {
          initModel?: (seq: typeof sequelize) => void;
        };
        if (typeof mod.initModel === "function") {
          mod.initModel(sequelize);
          logger.info(`Loaded Model: ${file}`);
        }
      }
    }
  }

  setupAssociations();
  logger.info("Model associations configured");

  // Core infrastructure models (not in the modules directory)
  initAuditLog(sequelize);
  logger.info(`Loaded Model: audit-log.model.ts`);
}

export { sequelize };
