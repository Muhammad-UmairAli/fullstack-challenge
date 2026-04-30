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
│   ├── guards/          # Security & Auth guards (JWT, Refresh)
│   └── interceptors/    # Response transformation and logging
├── database/            # Prisma service and database module
├── modules/             # Feature-based modules
│   ├── auth/            # Authentication & User management
│   └── projects/        # Business logic for project management
└── main.ts              # Application entry point
```

---

## 🔐 Authentication & Security

### JWT Flow

The system implements a secure **Access/Refresh Token** strategy:

1. **Access Token**: Short-lived (default 15m), sent in the `Authorization` header as a Bearer token.
2. **Refresh Token**: Long-lived (default 7d), stored in a database (hashed) and sent via HttpOnly cookies (or response body depending on client).
3. **Hashing**: Passwords are secure-hashed using `argon2`.

### Security Features

- **Helmet**: Protects the app from well-known web vulnerabilities by setting appropriate HTTP headers.
- **Throttler**: Global rate limiting to prevent brute-force attacks.
- **CORS**: Strictly configured to only allow requests from the trusted frontend.

---

## 🚦 Request-Response Lifecycle

### 1. Validation (Zod)

We use a custom `ZodValidationPipe` (or equivalent) to ensure all incoming `Body`, `Query`, and `Param` data matches our shared validators.

### 2. Exception Filters

- `ZodExceptionFilter`: Catches validation errors and returns a 400 Bad Request with detailed field-level errors.
- `HttpExceptionFilter`: Normalizes all other HTTP errors into a clean, developer-friendly format.

### 3. Interceptors

- `TransformInterceptor`: Automatically wraps successful responses in a `{ success: true, data: ... }` envelope.
- `LoggingInterceptor`: Tracks request duration and logs API activity for observability.

---

## 📊 Database Integration

The API uses [Prisma ORM](https://www.prisma.io/) via the `@repo/database` package.

- **PrismaService**: A global provider that manages the database connection.
- **Transactions**: Used for complex operations (like registration + token creation) to ensure data integrity.

---

## 📡 API Endpoints

### Auth Module

| Method | Endpoint         | Description              | Auth Required       |
| :----- | :--------------- | :----------------------- | :------------------ |
| `POST` | `/auth/register` | Register a new user      | No                  |
| `POST` | `/auth/login`    | Login and get tokens     | No                  |
| `POST` | `/auth/refresh`  | Rotate refresh tokens    | Yes (Refresh Token) |
| `GET`  | `/auth/me`       | Get current user profile | Yes (Access Token)  |
| `POST` | `/auth/logout`   | Invalidate session       | Yes (Access Token)  |

### Projects Module

| Method   | Endpoint        | Description          | Auth Required |
| :------- | :-------------- | :------------------- | :------------ |
| `GET`    | `/projects`     | List all projects    | Yes           |
| `POST`   | `/projects`     | Create a new project | Yes           |
| `GET`    | `/projects/:id` | Get project details  | Yes           |
| `PATCH`  | `/projects/:id` | Update a project     | Yes           |
| `DELETE` | `/projects/:id` | Delete a project     | Yes           |

---

## 🧪 Development Workflow

### Adding a New Module

1. Create a folder in `src/modules/<name>`.
2. Define the `Controller`, `Service`, and `Module`.
3. Register the module in `app.module.ts`.
4. (Optional) Create DTOs using shared validators from `@repo/validators`.

### Running the API

```bash
# From the root
pnpm dev --filter api

# Direct execution
cd apps/api
pnpm dev
```
