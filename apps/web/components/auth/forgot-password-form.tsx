'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema } from '@repo/validators';
import type { ForgotPasswordInput } from '@repo/validators';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { forgotPasswordAction } from '../../app/actions/auth.actions';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await forgotPasswordAction(data);

      if (!result.success) {
        setServerError(result.message || 'Something went wrong');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setServerError('A server error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
          Check your email
        </h2>
        <p className="text-theme-muted mb-8 text-sm leading-relaxed">
          If an account exists for that email, we&apos;ve sent a password reset
          link.
        </p>
        <Button className="w-full" onClick={() => setIsSubmitted(false)}>
          Resend email
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
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          error={errors.email?.message}
          className="glass-hover"
          leftAdornment={<Mail size={16} className="text-theme-faint" />}
        />

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
              Sending Link...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>
    </motion.div>
  );
}
