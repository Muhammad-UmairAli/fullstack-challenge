'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="glass hover-border-accent inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-all duration-300"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
