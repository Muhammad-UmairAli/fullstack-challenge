# Fullstack Challenge Monorepo

Welcome to the **Fullstack Challenge** monorepo. This project is built with a modern, high-performance tech stack using industry best practices for scalability, type safety, and developer experience.

## 🚀 Tech Stack

### Frameworks & Tools

- **Monorepo**: [Turborepo](https://turbo.build/) + [PNPM Workspaces](https://pnpm.io/workspaces)
- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Backend**: [NestJS 11+](https://nestjs.com/) (Module-based architecture)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/) (Modern CSS-first approach)
- **Language**: [TypeScript 5+](https://www.typescriptlang.org/) (Strict mode, NodeNext resolution)

### Quality Control

- **Linting**: [ESLint 9+](https://eslint.org/) (Flat Config)
- **Formatting**: [Prettier](https://prettier.io/)
- **Git Hooks**: [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/okonet/lint-staged)

---

## 📂 Project Structure

```text
.
├── apps/
│   ├── api/            # NestJS API (ESM, NodeNext)
│   └── web/            # Next.js Application (App Router, Tailwind 4)
├── packages/
│   ├── eslint-config/  # Shared ESLint configurations (Flat Config)
│   ├── typescript-config/ # Shared TypeScript configurations
│   └── prettier-config/ # Shared Prettier configuration
├── package.json        # Root workspace configuration
└── turbo.json          # Turborepo task orchestration
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: [LTS version recommended]
- **PNPM**: `npm install -g pnpm`

### Installation

```bash
pnpm install
```

### Development

Run all applications and packages in development mode:

```bash
pnpm dev
```

### Quality Checks

Run linting and type-checking across the entire workspace:

```bash
pnpm lint
pnpm type-check
```

### Build

Generate production builds for all applications:

```bash
pnpm build
```

---

## 🛡️ Best Practices Implemented

- **ESM-First**: The API is configured as a pure ES Module for modern Node.js compatibility.
- **Shared Configs**: Consistent coding standards across the monorepo via shared `@repo/` packages.
- **Validation**: Automatic request validation in the API using `class-validator` and `ValidationPipe`.
- **Performance**: Optimized builds with Turborepo caching and Next.js 15 features.
