# AGENTS.md

Guidance for contributors and coding agents working in this repository.

## Stack

pnpm 11 workspaces + Turborepo. `apps/api` (NestJS 11, ESM), `apps/web` (Next.js 16, App Router), `packages/database` (Prisma 7, PostgreSQL), `packages/validators` (Zod 4 schemas shared by API and web), plus shared ESLint, TypeScript and Prettier configs. Node 24 (`.nvmrc`).

## Commands (run from the repo root)

| Purpose                      | Command                                                   |
| ---------------------------- | --------------------------------------------------------- |
| Install                      | `pnpm install`                                            |
| Everything CI runs (no e2e)  | `pnpm check`                                              |
| Lint / autofix               | `pnpm lint` / `pnpm lint:fix`                             |
| Types                        | `pnpm type-check`                                         |
| Unit tests                   | `pnpm test`                                               |
| API e2e (needs DB + secrets) | `pnpm test:e2e`                                           |
| Formatting                   | `pnpm format:check` / `pnpm format`                       |
| Regenerate Prisma Client     | `pnpm db:generate`                                        |
| New migration                | `pnpm --filter @repo/database db:migrate --name <change>` |
| Apply migrations             | `pnpm --filter @repo/database db:deploy`                  |

Before finishing a change, run `pnpm check` and fix what fails.

## Conventions

- Validation schemas live in `packages/validators` and are the single contract: API DTOs use `createZodDto(schema)`, web forms use `zodResolver(schema)`, and Server Actions re-validate with `schema.safeParse`.
- The API's relative imports end in `.js` (NodeNext ESM). The web app uses extensionless imports (bundler resolution).
- Inject `PrismaService`; never construct `PrismaClient` in app code. `User.password` is omitted by default. Select it only where it is verified.
- Protect API routes with `JwtAuthGuard`. Do not add pass-through placeholder guards.
- Never store raw refresh or reset tokens; use `hashToken()`.
- Schema changes need a committed migration in `packages/database/prisma/migrations`. Do not use `db push` outside throwaway local databases.
- Tests: API unit tests are `*.spec.ts` beside the code (Jest, native ESM; import `jest` from `@jest/globals`); API e2e tests live in `apps/api/test`; web tests are `*.test.ts` (Jest via `next/jest`).
- New environment variables must be added to the app's env schema (`apps/api/src/common/configs/env.validation.ts` or `apps/web/env.ts`), its `.env.example`, and, if a Turbo task reads them, `turbo.json`.
- Never commit `.env` files or secrets.

## Dependencies

See "Dependency Policy" in `README.md` for versions that are intentionally held back. New install scripts must be reviewed and added to `allowBuilds` in `pnpm-workspace.yaml`.
