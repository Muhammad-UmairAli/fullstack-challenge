<div align="center">
  <h1>🚀 um.air | Fullstack Portfolio</h1>
  <p><strong>A professional-grade, type-safe monorepo showcasing the engineering work of Umair.</strong></p>
</div>

---

## 📖 Overview

This repository represents my professional standard for modern TypeScript full-stack development. Designed for scalability and developer experience, it serves as the foundation for my personal projects and production experiments.

By leveraging **pnpm workspaces** and **Turborepo**, this setup achieves lightning-fast builds and shared configurations between my NestJS backend and Next.js frontend.

> [!IMPORTANT]
> **Detailed Documentation**: For in-depth technical guides, please refer to the [**Docs Folder**](./docs/README.md).

---

## ✨ Key Technical Features

### Backend (NestJS 11)

- **Authentication Ready**: JWT access/refresh flow with argon2 password hashing, hashed refresh-token rotation with reuse detection, and route-level throttling.
- **Fail-Fast Environment Validation**: Powered by `Zod`, the API refuses to boot if critical `.env` variables are missing or misconfigured.
- **Production Defenses**: Global Rate Limiting (`@nestjs/throttler`) and HTTP Headers protection (`Helmet`) are enabled by default.
- **Global Observability**: Custom interceptors track execution times and normalize successful API responses into a predictable JSON envelope.

### Frontend (Next.js 16)

- **React 19 & App Router**: Utilizing the absolute latest React paradigms.
- **Tailwind CSS 4.0**: Styled with the latest iteration of Tailwind, fully integrated into the Prettier formatting pipeline.
- **BFF Auth Pattern**: Server Actions manage HttpOnly tokens, the proxy (`proxy.ts`) protects routes, and refresh flow is handled transparently.
- **Theme System**: Persistent dark/light mode with portfolio-focused typography and reusable design tokens.

### Persistence (Prisma & PostgreSQL)

- **Isolated Package**: The database is completely decoupled into `@repo/database`, acting as the single source of truth for the entire monorepo.
- **Versioned Migrations**: Schema changes ship as SQL migrations (`prisma migrate`), applied in CI and production with `db:deploy`.
- **Secure by Default**: Password hashes are omitted from every query result unless a query explicitly selects them.
- **Containerized**: Local development relies on a lightweight Docker Compose setup, eliminating "it works on my machine" issues.

---

## 📂 Architecture & Monorepo Structure

```text
.
├── apps/
│   ├── api/                 # NestJS API (Port: 3001)
│   └── web/                 # Next.js Frontend (Port: 3000)
├── packages/
│   ├── database/            # Shared Prisma ORM & PostgreSQL schema
│   ├── validators/          # Shared Zod Schemas (Fullstack Contract)
│   ├── eslint-config/       # ESLint 9 Flat Configs (Next.js, Node.js, Base)
│   ├── typescript-config/   # Strict TS Configs (NodeNext & Bundler)
│   └── prettier-config/     # Unified Prettier configurations
├── .github/                 # CI workflow and Dependabot config
└── docker-compose.yml       # Local PostgreSQL infrastructure
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) 24 LTS (minimum 22.22.1; see `.nvmrc`)
- [pnpm](https://pnpm.io/) 11, pinned in `package.json`. Run `corepack enable` once and the right version is used automatically.
- [Docker Desktop](https://www.docker.com/) (For the local database)

### 2. Installation

Clone the repository and install all workspace dependencies:

```bash
git clone <repo-url>
cd fullstack-challenge
pnpm install
```

### 3. Database Initialization

Spin up the local PostgreSQL database:

```bash
docker compose up -d
```

pgAdmin is optional and starts only with the `tools` profile: `docker compose --profile tools up -d`.

### 4. Configure Environment Files

Create env files from examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `apps/api/.env` (generate each with `openssl rand -base64 32`). The other defaults work as-is for local development.

### 5. Apply Database Migrations

```bash
pnpm --filter @repo/database db:deploy
```

> [!NOTE]
> If you previously created tables with `db push`, reset the local database once with `docker compose down -v && docker compose up -d` before applying migrations.

### 6. Running the Project

Boot up the entire monorepo concurrently (Frontend & Backend):

```bash
pnpm dev
```

- **Frontend**: Navigate to `http://localhost:3000`
- **Backend API**: `http://localhost:3001/api/v1` (health check: `/api/v1/health`)
- **Swagger UI**: `http://localhost:3001/api/docs` (disabled in production by default)
- **pgAdmin (DB Viewer, `tools` profile)**: `http://localhost:5050` _(admin@example.com / admin)_

---

## 🛠️ Essential Commands

Run these commands from the root of the repository:

| Command            | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `pnpm dev`         | Starts all apps in watch mode (Turborepo orchestrated).           |
| `pnpm build`       | Builds all apps and packages using Turbo's caching.               |
| `pnpm lint`        | Runs ESLint across all workspaces (`pnpm lint:fix` to autofix).   |
| `pnpm type-check`  | Runs a strict `tsc --noEmit` validation across the monorepo.      |
| `pnpm test`        | Runs unit tests (API and web).                                    |
| `pnpm test:e2e`    | Runs API end-to-end tests against a real database.                |
| `pnpm format`      | Formats all files with Prettier (`pnpm format:check` in CI).      |
| `pnpm db:generate` | Regenerates the Prisma Client after schema changes.               |
| `pnpm check`       | Everything CI runs except e2e: format, lint, types, tests, build. |

---

## 🔒 Environment Variables

Local development requires specific environment variables. The system uses secure `.env` files that are strictly ignored by version control.

Each `.env.example` documents every variable it needs. The API validates its environment with Zod at startup and refuses to boot on bad values.

**`apps/api/.env`** _(Required for the NestJS API)_

| Variable                                           | Default                 | Notes                                                                                                    |
| -------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                     | (required)              | PostgreSQL connection string                                                                             |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`         | (required)              | 32+ characters each, different from each other                                                           |
| `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | `15m` / `7d`            | Format `<number><s\|m\|h\|d>`                                                                            |
| `PORT`                                             | `3001`                  |                                                                                                          |
| `FRONTEND_URL`                                     | `http://localhost:3000` | CORS origin                                                                                              |
| `TRUST_PROXY`                                      | `false`                 | Proxies trusted for `X-Forwarded-For`; needed for per-user rate limits behind the BFF or a load balancer |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT`               | `60000` / `100`         | Global rate limit per client                                                                             |
| `SWAGGER_ENABLED`                                  | on outside production   | Set `true` to expose `/api/docs` in production                                                           |

**`apps/web/.env`** _(Required for the Next.js web app)_

```env
API_URL="http://localhost:3001/api/v1"
```

The browser never calls the API directly, so there is no `NEXT_PUBLIC_` API URL. Set `SKIP_ENV_VALIDATION=1` only for builds that run without runtime configuration (e.g. Docker image builds).

**`packages/database/.env`** _(Required for Prisma CLI commands)_

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/fullstack_challenge?schema=public"
```

---

## 🧠 Development Guidelines

1. **Adding a Database Table**:
   - Open `packages/database/prisma/schema.prisma` and add your model.
   - Run `pnpm --filter @repo/database db:migrate --name <change>` to create and apply a migration (it does not regenerate the client in Prisma 7).
   - Run `pnpm db:generate`, then commit the migration folder with the schema change.
2. **Creating an API Endpoint**:
   - Generate a module in `apps/api/src/modules/`.
   - Inject `PrismaService` into your services. `DatabaseModule` is global, so feature modules do not import it.
   - Protect routes with `@UseGuards(JwtAuthGuard)`.
3. **Auth Endpoints**:
   - Register: `POST /api/v1/auth/register`
   - Login: `POST /api/v1/auth/login`
   - Refresh: `POST /api/v1/auth/refresh`
   - Me: `GET /api/v1/auth/me`
   - Logout: `POST /api/v1/auth/logout`
   - Forgot / reset password: `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`

---

## 📦 Dependency Policy

Dependencies track the latest stable releases, with these deliberate exceptions (re-check when Dependabot proposes the major):

| Package    | Held at | Why                                                                                                                                             |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript | 6.0.x   | TS 7 ships no JS API yet; typescript-eslint (`<6.1`), ts-jest (`<7`) and `@nestjs/swagger` do not support it.                                   |
| NestJS     | 11.2.x  | `nestjs-zod` (validation + Swagger DTOs) does not support Nest 12 yet ([nestjs-zod#471](https://github.com/BenLorantfy/nestjs-zod/issues/471)). |
| pnpm       | 11.x    | pnpm 12 is a brand-new Rust rewrite with frequent releases; adopt once it settles.                                                              |
| Prisma CLI | 7.10.1  | The npm `latest` tag currently points at an 8.0 release candidate; the CLI is pinned to the stable release.                                     |

ESLint 10 is used even though `eslint-plugin-react`, `-import` and `-jsx-a11y` (pulled in by `eslint-config-next`) have not widened their peer ranges yet: ESLint 9 reached end-of-life on 2026-08-06, and `eslint-config-next` 16.4 supports ESLint 10. Expect peer warnings until those plugins publish updates.

pnpm refuses versions published less than 24 hours ago (`minimumReleaseAge`) and blocks install scripts that are not allowlisted in `pnpm-workspace.yaml`.
