/**
 * Search engine — text + regex search across the visible entries.
 * Day 10 lands the full implementation.
 */

import type { LogEntry, SearchState } from "../types";

export interface SearchMatch {
  /** Index into the source entries[] array */
  entryIndex: number;
  /** Char range within the message (start inclusive, end exclusive) */
  start: number;
  end: number;
}

export function search(entries: LogEntry[], state: SearchState): SearchMatch[] {
  if (!state.query) return [];

  // TODO(Day 10): real regex + case sensitivity handling, Worker-aware.
  void entries;
  return [];
}
