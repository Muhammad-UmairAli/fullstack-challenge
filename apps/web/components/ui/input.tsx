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
    {
      className,
      type,
      label,
      error,
      leftAdornment,
      rightAdornment,
      id,
      ...props
    },
    ref,
  ) => {
    // Associate label and error text with the input for screen readers.
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-theme-faint text-sm leading-none font-medium"
          >
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
            id={inputId}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'flex h-11 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              leftAdornment ? 'pl-10' : '',
              rightAdornment ? 'pr-10' : '',
              error ? 'border-red-500 focus-visible:ring-red-500' : '',
              className,
            )}
            style={{
              background: 'var(--surface-elevated)',
              borderColor: error ? undefined : 'var(--border-color)',
              color: 'var(--text-primary)',
              ['--tw-ring-color' as string]: 'var(--accent)',
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
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
