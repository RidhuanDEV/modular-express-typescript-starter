import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express, RequestHandler } from "express";

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Auto-generated REST API documentation",
    },
    servers: [{ url: `/api`, description: "API server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.*"],
};

export function setupSwagger(app: Express): void {
  const spec = swaggerJsDoc(options);

  const serveHandler: RequestHandler[] = swaggerUi.serve;
  const setupHandler: RequestHandler = swaggerUi.setup(spec);

  app.use(
    "/docs",
    ...serveHandler,
    setupHandler,
  );

  app.get("/docs.json", (_req, res) => {
    res.json(spec);
  });
}
