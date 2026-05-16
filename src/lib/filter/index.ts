/**
 * Filter engine.
 *
 * Pure function: given entries + a criteria snapshot, return the indices of
 * visible rows as a `Uint32Array` (8 bytes per row vs 24+ for a regular
 * array — meaningful on 10⁵+ row inputs).
 *
 * The criteria is intentionally a plain snapshot rather than a Svelte store
 * so the function stays trivially testable and stays Worker-portable.
 *
 * Spec: docs/ARCHITECTURE.md §5 + §6.3.
 */

import type { LogEntry, LogLevel } from "../types";

export interface FilterCriteria {
  /** Levels to show. Empty = show none. Full set (V..F) = no level filter. */
  levels: Set<LogLevel>;
  /** Tags to show. Empty = no tag filter. */
  tags: Set<string>;
  /** PIDs to show. Empty = no pid filter. */
  pids: Set<number>;
  /** Tags to hide regardless of level/tag filters (noise mute). */
  hiddenNoiseTags: Set<string>;
  /** Specific entry indices to hide (used by stack-block folding). */
  hiddenIndices: Set<number>;
  /** Text search query. Empty = no search. */
  query: string;
  /** Treat query as regex. */
  regex: boolean;
  /** Match case in search. */
  caseSensitive: boolean;
}

const ALL_LEVELS = new Set<LogLevel>(["V", "D", "I", "W", "E", "F"]);

export function emptyCriteria(): FilterCriteria {
  return {
    levels: new Set(ALL_LEVELS),
    tags: new Set(),
    pids: new Set(),
    hiddenNoiseTags: new Set(),
    hiddenIndices: new Set(),
    query: "",
    regex: false,
    caseSensitive: false,
  };
}

export function applyFilter(
  entries: LogEntry[],
  criteria: FilterCriteria,
): Uint32Array {
  const out = new Uint32Array(entries.length);
  let cursor = 0;

  const filterByLevel = criteria.levels.size < ALL_LEVELS.size;
  const filterByTag = criteria.tags.size > 0;
  const filterByPid = criteria.pids.size > 0;
  const filterByNoise = criteria.hiddenNoiseTags.size > 0;
  const filterByHidden = criteria.hiddenIndices.size > 0;
  const matcher = compileMatcher(criteria);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;

    if (filterByHidden && criteria.hiddenIndices.has(i)) continue;
    if (filterByLevel && !criteria.levels.has(e.level)) continue;
    if (filterByTag && !criteria.tags.has(e.tag)) continue;
    if (filterByPid && (e.pid === undefined || !criteria.pids.has(e.pid)))
      continue;
    if (filterByNoise && criteria.hiddenNoiseTags.has(e.tag)) continue;
    if (matcher && !matcher(e)) continue;

    out[cursor++] = i;
  }

  return cursor === entries.length ? out : out.slice(0, cursor);
}

/**
 * Compile the search portion of the criteria into a single predicate.
 *
 * Returns `null` for "no search" (skip the check entirely). Bad regex input
 * gracefully degrades to a literal substring match so the UI never goes blank
 * mid-typing.
 */
function compileMatcher(
  criteria: FilterCriteria,
): ((e: LogEntry) => boolean) | null {
  const q = criteria.query;
  if (!q) return null;

  if (criteria.regex) {
    let re: RegExp;
    try {
      re = new RegExp(q, criteria.caseSensitive ? "" : "i");
    } catch {
      // Fall back to literal substring on invalid regex.
      return matchSubstring(q, criteria.caseSensitive);
    }
    return (e) => re.test(e.message) || re.test(e.tag);
  }
  return matchSubstring(q, criteria.caseSensitive);
}

function matchSubstring(
  q: string,
  caseSensitive: boolean,
): (e: LogEntry) => boolean {
  if (caseSensitive) {
    return (e) => e.message.includes(q) || e.tag.includes(q);
  }
  const needle = q.toLowerCase();
  return (e) =>
    e.message.toLowerCase().includes(needle) ||
    e.tag.toLowerCase().includes(needle);
}
