'use client';

import * as React from 'react';

type Theme = 'dark' | 'light';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined,
);

const STORAGE_KEY = 'portfolio-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark');

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme = savedTheme ?? 'dark';
    setThemeState(initialTheme);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(
      initialTheme === 'light' ? 'theme-light' : 'theme-dark',
    );
  }, []);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(
      nextTheme === 'light' ? 'theme-light' : 'theme-dark',
    );
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

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
