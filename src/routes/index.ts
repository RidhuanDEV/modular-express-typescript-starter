import path from "node:path";
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Express, Router } from "express";
import { logger } from "../core/logger/logger.js";

const isTs = import.meta.url.endsWith(".ts");
const ext = isTs ? ".routes.ts" : ".routes.js";

export async function loadRoutes(app: Express): Promise<void> {
  const modulesDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../modules",
  );

  let entries: string[];
  try {
    entries = readdirSync(modulesDir);
  } catch {
    logger.warn("No modules directory found — skipping route loading");
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
          default: Router;
          path: string;
        };

        const routePath = `/api${mod.path}`;
        app.use(routePath, mod.default);

        // Log semua endpoint di router
        if (mod.default && typeof mod.default.stack === "object") {
          for (const layer of mod.default.stack) {
            if (layer.route) {
              // Ambil method dari stack
              const method =
                layer.route.stack &&
                layer.route.stack[0] &&
                layer.route.stack[0].method
                  ? layer.route.stack[0].method.toUpperCase()
                  : "UNKNOWN";
              const panjangroute = routePath.length + layer.route.path.length;
              const garis = "=".repeat(30 - panjangroute);
              logger.info(
                `Loaded Endpoint: ${routePath}${layer.route.path} ${garis} Method: ${method}`,
              );
            }
          }
        }
      }
    }
  }
}
