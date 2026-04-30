# Fullstack Challenge Web (Next.js)

The modern, high-performance frontend for the Fullstack Challenge project, built with Next.js 15 and Tailwind CSS 4.

## 🚀 Key Features

- **Next.js 15 (App Router)**: Leveraging the latest features for server-side rendering and performance.
- **Tailwind CSS 4.0**: Modern, CSS-first utility styling.
- **Fullstack Type Safety**: Directly imports Zod schemas and TypeScript types from `@repo/validators`.
- **Shared Contracts**: Ensures the frontend validation is always in perfect sync with the `@api/v1` backend.

## 🏗️ Architecture

As part of the Monorepo Architecture, this web application:

1.  **Consumes Shared Schemas**: Form validation is driven by the schemas in `packages/validators`.
2.  **Modular Logic**: Future features will be organized into domain-specific components that match the backend's modular structure.

## 🛠️ Development

### Setup

```bash
pnpm install
```

### Run

```bash
pnpm dev --filter web
```

### Build

```bash
pnpm build --filter web
```

## 📐 Integration Examples

To use a shared validator in a form:

```typescript
import { CreateExampleSchema } from '@repo/validators';
// Use with react-hook-form and @hookform/resolvers/zod!
```
