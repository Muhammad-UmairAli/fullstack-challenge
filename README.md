<div align="center">
  <h1>🚀 Fullstack Enterprise Architecture</h1>
  <p><strong>A production-ready, type-safe monorepo powered by Turborepo, NestJS, Next.js, and Prisma.</strong></p>
</div>

---

## 📖 Overview

This repository represents the gold standard for modern TypeScript full-stack development in 2024/2025. Designed with scalability, strict type-safety, and developer experience (DX) in mind, it provides a highly decoupled, modular architecture ready for enterprise deployment.

By leveraging **pnpm workspaces** and **Turborepo**, we achieve lightning-fast builds, shared configurations, and a unified full-stack environment where the frontend and backend share exact data contracts without code duplication.

---

## ✨ Key Technical Features

### Backend (NestJS 11)

- **Authentication Ready**: JWT access/refresh flow with argon2 password hashing, refresh-token persistence, and route-level throttling.
- **Fail-Fast Environment Validation**: Powered by `Zod`, the API refuses to boot if critical `.env` variables are missing or misconfigured.
- **Production Defenses**: Global Rate Limiting (`@nestjs/throttler`) and HTTP Headers protection (`Helmet`) are enabled by default.
- **Global Observability**: Custom interceptors track execution times and normalize successful API responses into a predictable JSON envelope.

### Frontend (Next.js 15)

- **React 19 & App Router**: Utilizing the absolute latest React paradigms.
- **Tailwind CSS 4.0**: Styled with the latest iteration of Tailwind, fully integrated into the Prettier formatting pipeline.
- **BFF Auth Pattern**: Server Actions manage HttpOnly tokens, middleware protects routes, and refresh flow is handled transparently.
- **Theme System**: Persistent dark/light mode with portfolio-focused typography and reusable design tokens.

### Persistence (Prisma & PostgreSQL)

- **Isolated Package**: The database is completely decoupled into `@repo/database`, acting as the single source of truth for the entire monorepo.
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
└── docker-compose.yml       # Local PostgreSQL infrastructure
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v9+)
- [Docker Desktop](https://www.docker.com/) (For the local database)

### 2. Installation

Clone the repository and install all workspace dependencies:

```bash
git clone <repo-url>
cd fullstack-challenge
pnpm install
```

### 3. Database Initialization

Spin up the local PostgreSQL database and pgAdmin interface:

```bash
docker-compose up -d
```

Push the schema to the database to generate the tables and the Prisma Client:

```bash
pnpm --filter @repo/database db:push
```

### 4. Configure Environment Files

Create env files from examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Set required values:

- `apps/api/.env`
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET` (recommended: `openssl rand -base64 32`)
  - `JWT_REFRESH_SECRET` (recommended: `openssl rand -base64 32`)
  - `JWT_ACCESS_EXPIRATION` (default `15m`)
  - `JWT_REFRESH_EXPIRATION` (default `7d`)
- `apps/web/.env`
  - `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
  - `API_URL=http://localhost:3001/api/v1`

### 5. Running the Project

Boot up the entire monorepo concurrently (Frontend & Backend):

```bash
pnpm dev
```

- **Frontend**: Navigate to `http://localhost:3000`
- **Backend API**: Navigate to `http://localhost:3001/api/v1`
- **pgAdmin (DB Viewer)**: Navigate to `http://localhost:5050` _(admin@admin.com / admin)_

---

## 🛠️ Essential Commands

Run these commands from the root of the repository:

| Command           | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `pnpm dev`        | Starts all apps in watch mode (Turborepo orchestrated).        |
| `pnpm build`      | Builds all apps and packages using Turbo's aggressive caching. |
| `pnpm lint`       | Runs ESLint across all workspaces.                             |
| `pnpm format`     | Formats all code using Prettier.                               |
| `pnpm type-check` | Runs a strict `tsc --noEmit` validation across the monorepo.   |

---

## 🔒 Environment Variables

Local development requires specific environment variables. The system uses secure `.env` files that are strictly ignored by version control.

**`apps/api/.env`** _(Required for the NestJS API)_

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/fullstack_challenge?schema=public"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
JWT_ACCESS_SECRET="<generate-32-byte-secret>"
JWT_REFRESH_SECRET="<generate-32-byte-secret>"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
```

**`apps/web/.env`** _(Required for the Next.js web app)_

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
API_URL="http://localhost:3001/api/v1"
```

**`packages/database/.env`** _(Required for Prisma CLI commands)_

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/fullstack_challenge?schema=public"
```

---

## 🧠 Development Guidelines

1. **Adding a Database Table**:
   - Open `packages/database/prisma/schema.prisma` and add your model.
   - Run `pnpm --filter @repo/database db:push`.
   - Your new types are instantly available in the API!
2. **Creating an API Endpoint**:
   - Generate a module in `apps/api/src/modules/`.
   - Inject `PrismaService` in your services/modules where needed.
   - Inject `PrismaService` into your controllers/services.
3. **Auth Endpoints**:
   - Register: `POST /api/v1/auth/register`
   - Login: `POST /api/v1/auth/login`
   - Refresh: `POST /api/v1/auth/refresh`
   - Me: `GET /api/v1/auth/me`
   - Logout: `POST /api/v1/auth/logout`
