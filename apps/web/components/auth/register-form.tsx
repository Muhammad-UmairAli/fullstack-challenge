'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema } from '@repo/validators';
import type { RegisterInput } from '@repo/validators';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { registerAction } from '../../app/actions/auth.actions';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

/**
 * ✨ USER REGISTRATION
 * Form for creating a new account with real-time validation.
 */
export function RegisterForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
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

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setServerError(null);

    if (data.password !== confirmPassword) {
      setServerError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerAction(data);

      if (!result.success) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            setError(field as keyof RegisterInput, { message });
          });
        } else {
          setServerError(result.message || 'Registration failed');
        }
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setServerError('A server error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-8 shadow-2xl sm:p-10"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Full Name"
          placeholder="John Doe"
          {...register('name')}
          error={errors.name?.message}
          className="glass-hover"
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          error={errors.email?.message}
          className="glass-hover"
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
          className="glass-hover"
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-theme-faint hover-text-accent transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <p className="text-theme-faint text-xs leading-5">
          Use at least 8 characters including uppercase, lowercase, and a
          number.
        </p>
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="glass-hover"
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-theme-faint hover-text-accent transition-colors"
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

        {serverError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm leading-6 font-medium text-red-500">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-4 h-11 font-semibold text-white shadow-lg transition-all active:scale-95"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </motion.div>
  );
}
