'use client';

import * as React from 'react';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  themeClassName,
  type Theme,
} from '../../lib/theme';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined,
);

// The theme class on <html> is the external store: themeInitScript sets it
// before hydration and setTheme updates it, so components subscribe to it via
// useSyncExternalStore instead of copying storage into state in an effect.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains(themeClassName('light'))
    ? 'light'
    : 'dark';
}

// The server cannot see localStorage. Hydration renders with the default and
// React re-renders immediately if the class says otherwise.
function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function setTheme(nextTheme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  document.documentElement.classList.remove(
    themeClassName('light'),
    themeClassName('dark'),
  );
  document.documentElement.classList.add(themeClassName(nextTheme));
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
