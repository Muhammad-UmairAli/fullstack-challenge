import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, label, error, leftAdornment, rightAdornment, ...props },
    ref,
  ) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-theme-faint text-sm leading-none font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          {leftAdornment && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              {leftAdornment}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-zinc-950 transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-(--text-faint) focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              leftAdornment ? 'pl-10' : '',
              rightAdornment ? 'pr-10' : '',
              error ? 'border-red-500 focus-visible:ring-red-500' : '',
              className,
            )}
            style={{
              background: 'var(--surface-elevated)',
              borderColor: error ? undefined : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            ref={ref}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightAdornment}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
