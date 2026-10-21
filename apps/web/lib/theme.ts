/**
 * THEME CONSTANTS
 * Shared by the root layout's pre-hydration script and the client ThemeProvider
 * so the storage key and <html> class names cannot drift apart.
 */

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'portfolio-theme';
export const DEFAULT_THEME: Theme = 'dark';

export const themeClassName = (theme: Theme) => `theme-${theme}`;

/**
 * Inlined in <head> by the root layout. Runs before first paint, so the saved
 * theme's class is on <html> before anything renders: no flash of the wrong
 * theme, and ThemeProvider can read the class instead of touching storage
 * during render. If a Content-Security-Policy is added, this script needs the
 * per-request nonce (or its hash) to keep running.
 */
export const themeInitScript = `(function () {
  var className = ${JSON.stringify(themeClassName(DEFAULT_THEME))};
  try {
    if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === 'light') {
      className = ${JSON.stringify(themeClassName('light'))};
    }
  } catch (e) {}
  document.documentElement.classList.add(className);
})();`;
