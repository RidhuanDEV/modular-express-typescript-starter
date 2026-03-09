# Modular Express TypeScript Backend Starter

An opinionated, production-ready backend starter kit for teams that want a clean, modular Express codebase with TypeScript strict mode, Sequelize ORM, Zod validation, JWT authentication, RBAC, caching, and a built-in CRUD generator.

This repository is designed to be a **robust foundation**, providing essential infrastructure and core modules so you can focus on building your domain logic instead of repeating boilerplate.

## 🚀 Key Features

- **Express 5 + TypeScript Strict**: Predictable application code with the latest framework features.
- **Feature-Based Modular Architecture**: Clean separation of concerns under `src/modules/*`.
- **Sequelize ORM**: Centralized model management with automatic association loading.
- **Zod Validation**: Type-safe request payloads and query contracts.
- **JWT Auth + RBAC**: Secure authentication and fine-grained Role-Based Access Control.
- **Built-in Audit Logging**: Automatic tracking of sensitive operations and resource changes.
- **Advanced Caching**: Redis-backed cache layer for performance and scalability.
- **Background Jobs**: BullMQ integration for reliable asynchronous processing.
- **API Documentation**: Automated Swagger/OpenAPI documentation.
- **Productivity Tools**: CLI CRUD generator to bootstrap new modules in seconds.

## 📁 Project Structure

```text
src/
├── app.ts                # App entry point (Express configuration)
├── server.ts             # Server entry point (Port listening & shutdown)
├── config/               # Global configurations (Database, Redis, Environment)
├── constants/            # Cross-cutting string literals (Audit, Permissions, Modules)
├── core/                 # Shared infrastructure (The "Engine")
│   ├── audit/            # Centralized audit logging logic
│   ├── auth/             # JWT & RBAC middleware/services
│   ├── cache/            # Redis caching service
│   ├── database/         # Shared DB utilities (Query builder, etc.)
│   ├── errors/           # Custom HTTP error handlers
│   ├── http/             # Request context and HTTP utilities
│   ├── logger/           # Structured logging (Pino/Winston)
│   ├── middleware/       # Global middlewares (Rate limit, Validation, Errors)
│   ├── queue/            # Background job processing (BullMQ)
│   └── validation/       # Zod-specific utilities and error mapping
├── database/             # Persistent data layer
│   ├── migrations/       # Sequelize database migrations
│   ├── models/           # Master index for Sequelize models & associations
│   └── seeders/          # Database seeding scripts
├── docs/                 # OpenAPI/Swagger definition files
├── modules/              # Feature modules (Domain logic)
├── routes/               # Global route registration index
├── scripts/              # Internal utility scripts (CRUD Generator)
├── types/                # Project-wide TypeScript type declarations
└── utils/                # Small, pure helper functions (Pagination, Response)
```

## 🏗️ Layered Architecture

Each feature module under `src/modules/` follows a strict layered pattern:

```text
src/modules/<feature>/
├── dto/                  # Data Transfer Objects (Request/Response contracts)
├── mappers/              # Transform Models to DTOs
├── policies/             # Authorization rules for this specific resource
├── queries/              # Specialized query configurations (Filter/Sort/Search)
├── <feature>.model.ts    # Sequelize database model
├── <feature>.repository.ts # Direct database access layer
├── <feature>.service.ts    # Business logic & orchestration
├── <feature>.controller.ts # HTTP request/response handling
├── <feature>.routes.ts     # Route definitions & resource-specific middleware
└── <feature>.schema.ts     # Zod validation schemas
```

### Responsibility Breakdown

| Layer | Responsibility |
| :--- | :--- |
| **Routes** | Endpoint definitions, middleware chain, and Swagger annotations. |
| **Controller** | Acts as an adapter, parsing requests and sending responses. No business logic here. |
| **Service** | Orchestrates business logic, handles transactions, audit logs, and cache management. |
| **Repository** | Isolated database operations using the Sequelize model. |
| **Model** | Defines the data structure and database constraints. |
| **Schema** | Uses Zod to enforce strict input validation. |
| **DTO/Mapper** | Ensures the API contract is decoupled from the database schema. |
| **Policy** | Contains reusable authorization logic (e.g., `canUpdateThisResource`). |

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Language**: TypeScript (Strict Mode)
- **Database**: MySQL (via `mysql2` driver)
- **ORM**: Sequelize
- **Caching**: Redis
- **Queue**: BullMQ
- **Validation**: Zod
- **Logging**: Pino
- **Documentation**: Swagger UI

## 🏁 Getting Started

### Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your local MySQL and Redis credentials
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

### Docker Setup
```bash
   cp .env.example .env
   ```

```bash
   docker compose up --build
   ```

This will spin up the application, MySQL 8, and Redis 7 automatically.

## ⚡ Productivity: Modules & CRUD Generator

The project ships with several core modules already implemented:
- `auth`: Authentication (login, register, token management)
- `user`: User account management
- `roles` & `permissions`: Granular RBAC system

To generate a new module:
```bash
npm run make:crud <feature-name>
```

> The generator creates the module structure, migration file, and updates global constants for permissions and audit logs.

## 🚢 Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```
2. **Start production server**:
   ```bash
   npm start
   ```

## 📜 Documentation

- **Swagger UI**: Access `/docs` after starting the server.
- **Health Check**: Available at `/health`.
