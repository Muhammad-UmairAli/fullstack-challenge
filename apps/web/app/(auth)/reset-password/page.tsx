import { ResetPasswordForm } from '../../../components/auth/reset-password-form';
import type { Metadata } from 'next';
import { ThemeToggle } from '../../../components/ui/theme-toggle';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Reset Password | Fullstack Challenge',
  description: 'Enter your new password',
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/login');
  }

  return (
    <div className="auth-shell bg-theme-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div className="absolute top-6 right-4 z-20 sm:right-6">
        <ThemeToggle />
      </div>

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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="font-display text-theme-primary text-[2.4rem] font-bold">
            Reset Password
          </h1>
          <p className="copy-sm text-theme-muted">
            Enter your new password below to regain access to your account.
          </p>
        </div>

        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
