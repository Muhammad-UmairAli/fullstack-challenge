import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 🛠️ UTILITY: cn (Class Name)
 * Combines tailwind-merge and clsx for cleaner conditional classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
