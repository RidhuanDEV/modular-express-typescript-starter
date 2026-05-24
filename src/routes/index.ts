import type { Express } from "express";
import { logger } from "../core/logger/logger.js";
import authRouter, { path as authPath } from "../modules/auth/auth.routes.js";
import userRouter, { path as userPath } from "../modules/user/user.routes.js";
import roleRouter, { path as rolePath } from "../modules/roles/role.routes.js";
import permissionRouter, { path as permissionPath } from "../modules/permissions/permission.routes.js";

export async function loadRoutes(app: Express): Promise<void> {
  app.use(`/api${authPath}`, authRouter);
  app.use(`/api${userPath}`, userRouter);
  app.use(`/api${rolePath}`, roleRouter);
  app.use(`/api${permissionPath}`, permissionRouter);

  logger.info(`Loaded Endpoint: /api${authPath}/register ============ Method: POST`);
  logger.info(`Loaded Endpoint: /api${authPath}/login =============== Method: POST`);
  logger.info(`Loaded Endpoint: /api${authPath}/me ================== Method: GET`);
  
  logger.info(`Loaded Endpoint: /api${userPath}/ =================== Method: GET`);
  logger.info(`Loaded Endpoint: /api${userPath}/:id ================ Method: GET`);
  logger.info(`Loaded Endpoint: /api${userPath}/ =================== Method: POST`);
  logger.info(`Loaded Endpoint: /api${userPath}/:id ================ Method: PATCH`);
  logger.info(`Loaded Endpoint: /api${userPath}/:id ================ Method: DELETE`);
  
  logger.info(`Loaded Endpoint: /api${rolePath}/ =================== Method: GET`);
  logger.info(`Loaded Endpoint: /api${rolePath}/:id ================ Method: GET`);
  logger.info(`Loaded Endpoint: /api${rolePath}/ =================== Method: POST`);
  logger.info(`Loaded Endpoint: /api${rolePath}/:id ================ Method: PUT`);
  logger.info(`Loaded Endpoint: /api${rolePath}/:id ================ Method: DELETE`);
  logger.info(`Loaded Endpoint: /api${rolePath}/:id/permissions ==== Method: PUT`);
  
  logger.info(`Loaded Endpoint: /api${permissionPath}/ ============= Method: GET`);
  logger.info(`Loaded Endpoint: /api${permissionPath}/:id ========== Method: GET`);
  logger.info(`Loaded Endpoint: /api${permissionPath}/ ============= Method: POST`);
  logger.info(`Loaded Endpoint: /api${permissionPath}/:id ========== Method: PUT`);
  logger.info(`Loaded Endpoint: /api${permissionPath}/:id ========== Method: DELETE`);
}
