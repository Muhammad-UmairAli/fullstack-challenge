import Link from 'next/link';
import { LoginForm } from '../../../components/auth/login-form';
import type { Metadata } from 'next';
import { ThemeToggle } from '../../../components/ui/theme-toggle';

export const metadata: Metadata = {
  title: 'Login | Fullstack Challenge',
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return (
    <div className="auth-shell bg-theme-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div className="absolute top-6 right-4 z-20 sm:right-6">
        <ThemeToggle />
      </div>
      {/* Minimal ambient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]"
          style={{
            background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
          }}
        />
        <div
          className="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-[120px]"
          style={{
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[416px] space-y-10">
        <div className="flex flex-col items-center space-y-3 text-center">
          <span
            className="text-theme-faint eyebrow rounded-full border px-3 py-1"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--surface-card)',
            }}
          >
            Portfolio Admin
          </span>
          <div
            className="mb-1 h-12 w-12 rounded-xl p-2.5 shadow-lg"
            style={{
              background: 'var(--gradient-accent)',
              boxShadow: 'var(--glow)',
            }}
          >
            <svg
              className="text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="font-display text-theme-primary text-[2.4rem] font-bold">
            Welcome Back
          </h1>
          <p className="copy-sm text-theme-muted">
            Continue building your personal brand portfolio.
          </p>
        </div>

        <LoginForm />

        <div className="text-theme-faint copy-sm pt-2 text-center">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-theme-primary hover-text-accent font-semibold transition-colors"
          >
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  );
}
