import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 🛠️ UTILITY: cn (Class Name)
 * Combines tailwind-merge and clsx for cleaner conditional classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns `target` only if it is a same-site path (e.g. "/projects/1?tab=a"),
 * otherwise `fallback`. Guards post-login redirects against open-redirect tricks
 * such as "//evil.com", "/\\evil.com" or "https://evil.com".
 */
export function safeRedirectPath(
  target: string | null | undefined,
  fallback = '/',
): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }
  // Browsers treat "\\" like "/" and ignore control characters, both of which can
  // turn a path into a protocol-relative URL.
  const hasControlChar = [...target].some((char) => char.charCodeAt(0) < 0x20);
  if (target.includes('\\') || hasControlChar) {
    return fallback;
  }
  return target;
}
