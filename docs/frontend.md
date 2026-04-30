# 🎨 Frontend Documentation (Next.js Web App)

Welcome to the detailed frontend documentation for the **Fullstack Enterprise Architecture**. This application is built with [Next.js 15](https://nextjs.org/), [React 19](https://react.dev/), and [Tailwind CSS 4.0](https://tailwindcss.com/).

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
│   ├── api.ts           # Fetch wrapper for the backend API
│   ├── auth-server.ts   # Server-side auth utilities
│   └── utils.ts         # Tailwind merging and generic helpers
└── middleware.ts        # Route protection and token refreshing
```

---

## 🔐 Authentication Flow

We implement a sophisticated authentication system that handles tokens securely:

### 1. Login/Register

Users submit forms which trigger **Server Actions** (`app/actions/auth.actions.ts`). These actions call the backend API, receive JWTs, and set them as `HttpOnly` cookies.

### 2. Route Protection (`middleware.ts`)

The Next.js middleware checks for the presence of a session cookie before allowing access to protected routes (e.g., `/dashboard`). If a token is expired, it attempts a background refresh.

### 3. Client-Side Auth State

The `AuthProvider` (`components/providers/auth-provider.tsx`) provides the current user's state to client components, allowing for dynamic UI updates (e.g., showing a logout button).

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

1. **Server-Side Fetching**: Using the `api.ts` client within Server Components to fetch data during SSR.
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

### Running the Frontend

```bash
# From the root
pnpm dev --filter web

# Direct execution
cd apps/web
pnpm dev
```
