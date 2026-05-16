/**
 * Theme store — Svelte 5 runes.
 *
 * Three user preferences: 'dark' | 'light' | 'system'. The effective
 * applied theme (`resolved`) collapses 'system' to one of the concrete
 * pair based on `prefers-color-scheme`.
 *
 * Initialization (`initTheme`) must be called from a client-only effect
 * because it reads localStorage / matchMedia.
 */

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'loglet:theme';
const DEFAULT: Theme = 'dark';

class ThemeStore {
  pref = $state<Theme>(DEFAULT);
  systemDark = $state(false);

  /** The concrete theme to apply on `<html data-theme>`. */
  get resolved(): 'light' | 'dark' {
    if (this.pref === 'system') return this.systemDark ? 'dark' : 'light';
    return this.pref;
  }

  setPref(next: Theme): void {
    this.pref = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable in private mode / older browsers.
    }
  }

  /** Cycle: dark → light → system → dark. */
  cycle(): void {
    const order: Theme[] = ['dark', 'light', 'system'];
    const idx = order.indexOf(this.pref);
    this.setPref(order[(idx + 1) % order.length]!);
  }
}

export const themeStore = new ThemeStore();

/**
 * Read persisted preference and start listening to system theme changes.
 * Returns a cleanup function — call from a `$effect` so unmounting tears
 * down the media-query listener.
 */
export function initTheme(): () => void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      themeStore.pref = saved;
    }
  } catch {
    // ignore
  }

  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  themeStore.systemDark = mq.matches;

  const onChange = (event: MediaQueryListEvent) => {
    themeStore.systemDark = event.matches;
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
