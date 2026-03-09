import express from "express";
import helmet from "helmet";
import cors from "cors";
import { configureZodLocale } from "./core/validation/zod-error-map.js";
import { requestIdMiddleware } from "./core/middleware/request-id.middleware.js";
import { rateLimitMiddleware } from "./core/middleware/rate-limit.middleware.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { setupSwagger } from "./docs/swagger.js";
import { loadRoutes } from "./routes/index.js";
import { sendSuccess } from "./utils/response.js";

// Configure Zod to return Bahasa Indonesia validation messages globally.
configureZodLocale();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(rateLimitMiddleware);

setupSwagger(app);

app.get("/health", (_req, res) => {
  sendSuccess(res, { data: { status: "ok" } });
});

await loadRoutes(app);

app.use(errorMiddleware);

export { app };
