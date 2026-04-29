'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:border-blue-500/40 hover:bg-blue-500/10"
      style={{
        borderColor: 'var(--border-color)',
        background: 'var(--surface-card)',
        color: 'var(--text-primary)',
      }}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
