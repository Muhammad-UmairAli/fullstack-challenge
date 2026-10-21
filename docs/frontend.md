# 🎨 Frontend Documentation (Next.js Web App)

Welcome to the detailed frontend documentation for the **Fullstack Enterprise Architecture**. This application is built with [Next.js 16](https://nextjs.org/), [React 19](https://react.dev/), and [Tailwind CSS 4.0](https://tailwindcss.com/).

---

## 🏗️ Architecture Overview

The frontend utilizes the **Next.js App Router** and follows a "Backend-for-Frontend" (BFF) pattern for maximum security and performance.

### Core Paradigms

- **Server-First Design**: Leveraging Server Components for initial renders and SEO optimization.
- **Server Actions**: Handling all form submissions and mutations directly via server-side functions, eliminating the need for client-side API fetching in many cases.
- **BFF Auth Pattern**: Sensitive tokens (Access/Refresh) are managed on the server side using `HttpOnly` cookies, protecting them from XSS attacks.
- **Shared Validation**: Using the same Zod schemas as the backend to ensure "fullstack type-safety".

---

## 📂 Directory Structure

```text
apps/web/
├── app/                 # Next.js App Router (Routes & Pages)
│   ├── (auth)/          # Authenticated routes group
│   ├── actions/         # Server Actions (Auth, Projects, etc.)
│   ├── layout.tsx       # Root layout & providers
│   └── page.tsx         # Landing page
├── components/          # Reusable UI components
│   ├── auth/            # Auth-specific components (Forms, Guards)
│   ├── providers/       # Context providers (Theme, Auth)
│   └── ui/              # Generic UI components (Buttons, Inputs)
├── lib/                 # Shared utilities and API clients
│   ├── api.ts           # Server-side fetch wrapper for the backend API
│   ├── auth-cookies.ts  # Session cookie names, flags and lifetimes
│   ├── auth-server.ts   # Server-side auth utilities
│   └── utils.ts         # Tailwind merging and generic helpers
└── proxy.ts             # Route protection and token refreshing (Next 16 "proxy", formerly middleware)
```

---

## 🔐 Authentication Flow

We implement a sophisticated authentication system that handles tokens securely:

### 1. Login/Register

Users submit forms which trigger **Server Actions** (`app/actions/auth.actions.ts`). Server Actions are public HTTP endpoints, so each one re-validates its input with the shared schema before calling the API. On success they set the JWTs as `HttpOnly` cookies via `lib/auth-cookies.ts`, with cookie lifetimes taken from each token's `exp` claim. If "Keep me signed in" is unchecked, the refresh cookie lasts only for the browser session.

### 2. Route Protection (`proxy.ts`)

The proxy runs on the Node.js runtime before every page. It optimistically checks for the session cookies; every route except the auth pages (and anything added to `PUBLIC_ROUTES`) requires a session. If the access token has expired but a refresh token exists, it rotates the tokens with the API and writes the new cookies both to the response (for the browser) and to the forwarded request (so Server Components in the same request see them). The API still verifies every token, so pages and actions must not rely on the proxy alone.

### 3. Client-Side Auth State

The `SessionProvider` (`components/providers/session-provider.tsx`) exposes the user loaded by `getServerSession()` in the root layout through the `useUser()` hook.

---

## 🎨 Styling & UI System

### Tailwind CSS 4.0

The project uses the latest version of Tailwind CSS.

- **Design Tokens**: Defined in `app/globals.css` using modern CSS variables.
- **Animations**: Subtle micro-interactions using standard CSS transitions and Tailwind utility classes.
- **Themes**: Support for light and dark modes out of the box.

### Reusable Components

Components in `components/ui` are designed to be highly reusable and composable, following a similar pattern to popular libraries like `shadcn/ui`.

---

## 📡 Data Fetching

We use two primary methods for data interaction:

1. **Server-Side Fetching**: Using the `api.ts` client within Server Components to fetch data during SSR. It forwards the visitor's IP (`X-Forwarded-For`) so API rate limits apply per user, and times out after 10 seconds.
2. **Server Actions**: For all POST/PATCH/DELETE operations, ensuring that the client never directly handles raw tokens.

---

## 🧪 Development Workflow

### Adding a New Page

1. Create a new folder in `app/` (e.g., `app/projects/page.tsx`).
2. Use Server Components by default.
3. If interactivity is needed, create a "Client Component" and import it.

### Creating a Server Action

1. Define the action in `app/actions/`.
2. Use shared validators from `@repo/validators` to validate the input.
3. Use `revalidatePath` to refresh the UI after a successful mutation.

### Testing

`pnpm --filter web test` runs Jest through `next/jest` (unit tests for the proxy and cookie helpers live next to the code as `*.test.ts`).

### Running the Frontend

```bash
# From the root
pnpm dev --filter web

# Direct execution
cd apps/web
pnpm dev
```
