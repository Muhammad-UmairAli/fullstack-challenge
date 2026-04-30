'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '@repo/validators';
import type { LoginInput } from '@repo/validators';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { loginAction } from '../../app/actions/auth.actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

/**
 * ✨ PREMIUM LOGIN FORM
 * Refactored to use Next.js 15 Server Actions and the Midnight Premium theme.
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await loginAction(data);

      if (!result.success) {
        // Map backend Zod errors back to form fields
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            setError(field as keyof LoginInput, { message });
          });
        } else {
          setServerError(result.message || 'Invalid credentials');
        }
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setServerError('A server error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-8 shadow-2xl sm:p-10"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          error={errors.email?.message}
          className="glass-hover"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-theme-faint text-sm leading-6 font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-primary text-xs leading-5 hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            className="glass-hover"
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-theme-faint transition-colors hover:text-blue-500"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        <label className="text-theme-muted flex items-center gap-2 text-sm leading-6">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border accent-blue-500"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--surface-elevated)',
            }}
          />
          Keep me signed in on this device
        </label>

        {serverError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm leading-6 font-medium text-red-500">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-brand-600 shadow-primary/20 h-11 font-semibold text-white shadow-lg transition-all duration-300 active:scale-95"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Verifying...
            </span>
          ) : (
            'Sign Into Account'
          )}
        </Button>
      </form>
    </motion.div>
  );
}
