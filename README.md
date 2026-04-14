# Fullstack Challenge Monorepo

Welcome to the **Fullstack Challenge** monorepo. This project is built with a modern, high-performance tech stack using industry best practices for scalability, type safety, and developer experience.

## 🚀 Tech Stack

### Frameworks & Tools

- **Monorepo**: [Turborepo](https://turbo.build/) + [PNPM Workspaces](https://pnpm.io/workspaces)
- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Backend**: [NestJS 11+](https://nestjs.com/) (Modular Architecture)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/) (Single Source of Truth)

### Quality Control & Security

- **Security**: [Helmet](https://helmetjs.github.io/) + [Throttler](https://github.com/nestjs/throttler) (Rate Limiting)
- **Env Control**: Zod-validated Environment Variables (Fail-Fast)
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/) with Zod Integration
- **Formatting**: Prettier + ESLint 9 (Flat Config)
- **Git Hooks**: Husky + lint-staged

---

## 📂 Project Structure

```text
.
├── apps/
│   ├── api/            # NestJS API (Pure Zod, Modular, Versioned, rate-limited)
│   └── web/            # Next.js Application
├── packages/
│   ├── validators/     # Shared Zod Schemas (Fullstack Contract)
│   ├── eslint-config/  # Shared Linting
│   ├── typescript-config/ # Shared TS Configs
│   └── prettier-config/ # Shared Prettier
```

---

## 🛡️ Best Practices Implemented

- **Shared Contracts**: Zod schemas are defined in `@repo/validators` and shared between API and Web to ensure 100% type synchronization.
- **Fail-Fast Configuration**: The API validates `process.env` at startup using Zod. It refuses to start if critical variables are missing or invalid.
- **Production Protection**: Integrated global **Rate Limiting** to protect endpoints from brute-force and DoS attacks.
- **Observability**: A global **Logging Interceptor** tracks the Method, Path, Status, and **Execution Time (ms)** for every request.
- **Standardized Responses**: Unified Success Interceptor and Global Exception Filter for a consistent JSON contract.
- **API Versioning**: Enforced URI versioning (e.g., `/api/v1`) for future-proof clients.

---

## 🛠️ Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```
