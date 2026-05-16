/**
 * className helper — `clsx` + `tailwind-merge` combo for conditional Tailwind
 * with conflict resolution. Used by shadcn-svelte components.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
