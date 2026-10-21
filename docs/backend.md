# 🛠️ Backend Documentation (NestJS API)

Welcome to the detailed backend documentation for the **Fullstack Enterprise Architecture**. This API is built with [NestJS 11](https://nestjs.com/), providing a robust, scalable, and type-safe server-side environment.

---

## 🏗️ Architecture Overview

The backend follows a **Modular Architecture**, leveraging NestJS's dependency injection system to keep features decoupled and maintainable.

### Core Principles

- **Controller-Service-Repository Pattern**: Separation of concerns between HTTP handling, business logic, and data persistence.
- **Pure Zod Validation**: All data entering the system is validated using shared Zod schemas from `@repo/validators`.
- **Fail-Fast Configuration**: The application validates all environment variables on startup.
- **Unified Response Envelope**: Every API response follows a consistent JSON structure.

---

## 📂 Directory Structure

```text
apps/api/src/
├── common/              # Shared logic (guards, filters, interceptors, configs)
│   ├── configs/         # Environment and feature configurations
│   ├── filters/         # Global exception handling (Zod, HTTP)
│   ├── guards/          # JwtAuthGuard (access-token protection)
│   ├── interceptors/    # Response transformation and logging
│   ├── types/           # Shared request types
│   └── utils/           # Token hashing and helpers
├── database/            # Prisma service and global database module
├── modules/             # Feature-based modules
│   ├── auth/            # Authentication & User management
│   ├── health/          # Liveness / readiness probes
│   └── projects/        # Business logic for project management
├── app.setup.ts         # Request pipeline shared by main.ts and e2e tests
└── main.ts              # Application entry point
```

---

## 🔐 Authentication & Security

### JWT Flow

The system implements a secure **Access/Refresh Token** strategy:

1. **Access Token**: Short-lived (default 15m), sent in the `Authorization` header as a Bearer token.
2. **Refresh Token**: Long-lived (default 7d), returned in the response body (the Next.js BFF stores it in an HttpOnly cookie). Only its SHA-256 hash is stored in the database.
3. **Rotation & Reuse Detection**: Every refresh revokes the presented token atomically and issues a new pair. Replaying an already-rotated token revokes all of the user's sessions.
4. **Hashing**: Passwords are hashed with `argon2`; password-reset tokens are stored as SHA-256 hashes and expire after 1 hour. A password reset signs the user out everywhere.
5. **Data Exposure**: The Prisma client omits `User.password` from every result by default; only the login query selects it.

### Security Features

- **Helmet**: Protects the app from well-known web vulnerabilities by setting appropriate HTTP headers.
- **Throttler**: Global per-client rate limit (`THROTTLE_LIMIT` per `THROTTLE_TTL_MS`, default 100/min) plus stricter limits on auth routes. Behind the Next.js BFF or a load balancer, set `TRUST_PROXY` so clients are identified by their forwarded IP rather than the proxy's.
- **CORS**: Strictly configured to only allow requests from the trusted frontend.
- **Swagger**: Disabled in production unless `SWAGGER_ENABLED=true`.

---

## 🚦 Request-Response Lifecycle

### 1. Validation (Zod)

A global `ZodValidationPipe` (from `nestjs-zod`) validates every DTO created with `createZodDto` from the shared schemas in `@repo/validators`. Route IDs are validated with `ParseUUIDPipe`.

### 2. Exception Filters

- `ZodExceptionFilter`: Catches validation errors and returns a 400 Bad Request with detailed field-level errors.
- `GlobalExceptionFilter`: Normalizes all other errors into a clean, developer-friendly format (500s never leak internal messages).

### 3. Interceptors

- `TransformInterceptor`: Automatically wraps successful responses in a `{ success: true, data: ... }` envelope.
- `LoggingInterceptor`: Tracks request duration and logs API activity for observability.

---

## 📊 Database Integration

The API uses [Prisma ORM](https://www.prisma.io/) via the `@repo/database` package.

- **PrismaService**: A single global provider (one connection pool) built on the Prisma 7 PostgreSQL driver adapter.
- **Transactions**: Used for multi-step writes (password reset, reset-token issuance) to ensure data integrity.
- **Migrations**: Schema changes are versioned SQL migrations in `packages/database/prisma/migrations`, applied with `pnpm --filter @repo/database db:deploy`.
- **Health**: `GET /health` (liveness) and `GET /health/ready` (database connectivity) for load balancers.

---

## 📡 API Endpoints

### Auth Module

| Method | Endpoint                | Description              | Auth Required       |
| :----- | :---------------------- | :----------------------- | :------------------ |
| `POST` | `/auth/register`        | Register a new user      | No                  |
| `POST` | `/auth/login`           | Login and get tokens     | No                  |
| `POST` | `/auth/refresh`         | Rotate refresh tokens    | Yes (Refresh Token) |
| `GET`  | `/auth/me`              | Get current user profile | Yes (Access Token)  |
| `POST` | `/auth/logout`          | Revoke a refresh token   | No (token in body)  |
| `POST` | `/auth/forgot-password` | Request a reset link     | No                  |
| `POST` | `/auth/reset-password`  | Set a new password       | No                  |

### Projects Module

| Method   | Endpoint        | Description          | Auth Required |
| :------- | :-------------- | :------------------- | :------------ |
| `GET`    | `/projects`     | List all projects    | No            |
| `POST`   | `/projects`     | Create a new project | Yes           |
| `GET`    | `/projects/:id` | Get project details  | No            |
| `PUT`    | `/projects/:id` | Update a project     | Yes (owner)   |
| `DELETE` | `/projects/:id` | Delete a project     | Yes (owner)   |

---

## 🧪 Development Workflow

### Adding a New Module

1. Create a folder in `src/modules/<name>`.
2. Define the `Controller`, `Service`, and `Module`.
3. Register the module in `app.module.ts`.
4. (Optional) Create DTOs using shared validators from `@repo/validators`.
5. Add unit tests next to the service (`*.spec.ts`) and, for HTTP flows, e2e tests in `test/`.

### Testing

```bash
pnpm --filter api test        # unit tests (Jest, native ESM)
pnpm --filter api test:e2e    # needs DATABASE_URL, JWT secrets and migrated schema
```

### Running the API

```bash
# From the root
pnpm dev --filter api

# Direct execution
cd apps/api
pnpm dev
```
