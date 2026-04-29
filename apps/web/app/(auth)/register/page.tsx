import Link from 'next/link';
import { RegisterForm } from '../../../components/auth/register-form';
import type { Metadata } from 'next';
import { ThemeToggle } from '../../../components/ui/theme-toggle';

export const metadata: Metadata = {
  title: 'Register | Fullstack Challenge',
  description: 'Create your account',
};

export default function RegisterPage() {
  return (
    <div className="auth-shell bg-theme-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div className="absolute top-6 right-4 z-20 sm:right-6">
        <ThemeToggle />
      </div>
      {/* Minimal ambient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/10 absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
        <div className="bg-primary/15 absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
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
          <div className="mb-1 h-12 w-12 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 p-2.5 shadow-lg shadow-blue-500/20">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="font-display text-theme-primary text-[2.4rem] font-bold">
            Create Account
          </h1>
          <p className="copy-sm text-theme-muted">
            Launch your developer portfolio with a premium experience.
          </p>
        </div>

        <RegisterForm />

        <div className="text-theme-faint copy-sm pt-2 text-center">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-theme-primary font-semibold transition-colors hover:text-blue-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
