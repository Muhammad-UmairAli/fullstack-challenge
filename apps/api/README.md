# Fullstack Challenge API (NestJS)

A professional-grade NestJS application built with modern standards for security, validation, and observability.

## 🏗️ Architecture

### 1. 📋 Configuration & Validation

- **Zod Env Validation**: App fails immediately if `process.env` is missing critical values (`PORT`, `FRONTEND_URL`, etc.).
- **Pure Zod**: Leveraging `nestjs-zod` for zero-overhead validation across all endpoints.

### 2. 🛡️ Security & Protection

- **Rate Limiting**: Integrated `ThrottlerModule` to protect against brute-force attacks.
- **Helmet**: Secured HTTP headers.
- **CORS**: Environment-driven CORS configuration.
- **URI Versioning**: Standardized `/api/v1` routes.

### 3. ⏱️ Observability & Interceptors

- **Logging Interceptor**: Tracks and logs the lifecycle of every request, including execution time (ms).
- **Transform Interceptor**: Automatically wraps success responses in a `{ success, data, message, timestamp }` envelope.
- **Exception Filter**: Standardizes error responses into a consistent JSON contract.

### 4. 🧩 Modular Structure

Features are isolated into dedicated domain modules:

- **Auth**: Authentication and security logic.
- **Projects**: Portfolio/Business domain logic.

## 🚀 Key Features

- **Swagger Documentation**: Interactive UI at `/api/docs`.
- **Shared Contracts**: Consistent validation via the `@repo/validators` shared package.

## 🛠️ Development

### Setup

```bash
pnpm install
```

### Dev Mode

```bash
pnpm dev --filter api
```

### Build

```bash
pnpm build --filter api
```
