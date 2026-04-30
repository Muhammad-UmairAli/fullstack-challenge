import Link from 'next/link';
import { ForgotPasswordForm } from '../../../components/auth/forgot-password-form';
import type { Metadata } from 'next';
import { ThemeToggle } from '../../../components/ui/theme-toggle';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Forgot Password | Fullstack Challenge',
  description: 'Reset your account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="auth-shell bg-theme-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div className="absolute top-6 right-4 z-20 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/15 absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
        <div className="bg-primary/10 absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[416px] space-y-10">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="mb-1 h-12 w-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 p-2.5 shadow-lg shadow-purple-500/20">
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="font-display text-theme-primary text-[2.4rem] font-bold">
            Forgot Password?
          </h1>
          <p className="copy-sm text-theme-muted">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="text-theme-faint copy-sm pt-2 text-center">
          <Link
            href="/login"
            className="text-theme-muted inline-flex items-center gap-2 transition-colors hover:text-white"
          >
            <ChevronLeft size={16} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
