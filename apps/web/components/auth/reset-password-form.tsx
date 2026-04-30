'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema } from '@repo/validators';
import type { ResetPasswordInput } from '@repo/validators';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { resetPasswordAction } from '../../app/actions/auth.actions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token },
  });

  const passwordValue = watch('password') ?? '';

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);
  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent'][
    strengthScore
  ];

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setServerError(null);

    if (data.password !== confirmPassword) {
      setServerError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPasswordAction(data);

      if (!result.success) {
        setServerError(result.message || 'Invalid or expired token');
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch {
      setServerError('A server error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 text-center shadow-2xl sm:p-10"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="font-display mb-2 text-2xl font-bold text-white">
          Password Reset!
        </h2>
        <p className="text-theme-muted mb-8 text-sm leading-relaxed">
          Your password has been updated. Redirecting you to login...
        </p>
        <Button
          className="bg-primary w-full"
          onClick={() => router.push('/login')}
        >
          Go to Login Now
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-8 shadow-2xl sm:p-10"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('token')} />

        <div className="space-y-4">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            className="glass-hover"
            leftAdornment={<Lock size={16} className="text-theme-faint" />}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-theme-faint transition-colors hover:text-blue-500"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs leading-5">
              <span className="text-theme-faint">Password strength</span>
              <span className="text-theme-faint font-medium">
                {strengthLabel}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`h-1.5 rounded-full transition-colors ${
                    strengthScore >= item
                      ? strengthScore <= 2
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      : ''
                  }`}
                  style={
                    strengthScore >= item
                      ? undefined
                      : {
                          background:
                            'color-mix(in srgb, var(--text-faint) 35%, transparent)',
                        }
                  }
                />
              ))}
            </div>
          </div>

          <Input
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="glass-hover"
            leftAdornment={<Lock size={16} className="text-theme-faint" />}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-theme-faint transition-colors hover:text-blue-500"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

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
              Updating Password...
            </span>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </motion.div>
  );
}
