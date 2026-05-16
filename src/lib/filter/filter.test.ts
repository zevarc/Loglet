import { describe, expect, it } from 'vitest';
import type { LogEntry, LogLevel } from '../types';
import { applyFilter, emptyCriteria, type FilterCriteria } from './index';

function entry(opts: Partial<LogEntry> & { index: number }): LogEntry {
  return {
    raw: '',
    level: 'I' as LogLevel,
    tag: '',
    message: '',
    ...opts
  };
}

const ENTRIES: LogEntry[] = [
  entry({ index: 0, level: 'I', tag: 'AM', pid: 100, message: 'boot complete' }),
  entry({ index: 1, level: 'D', tag: 'Lifecycle', pid: 100, message: 'onCreate' }),
  entry({ index: 2, level: 'W', tag: 'Choreographer', pid: 100, message: 'Skipped frames' }),
  entry({ index: 3, level: 'E', tag: 'DB', pid: 200, message: 'SQL error: table missing' }),
  entry({ index: 4, level: 'F', tag: 'AndroidRuntime', pid: 200, message: 'FATAL: NullPointer' }),
  entry({ index: 5, level: 'V', tag: 'Verbose', pid: 200, message: 'verbose noise' })
];

function indices(arr: Uint32Array): number[] {
  return Array.from(arr);
}

describe('applyFilter — no criteria', () => {
  it('returns all indices when no filter is active', () => {
    const result = applyFilter(ENTRIES, emptyCriteria());
    expect(indices(result)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('returns empty for empty entries', () => {
    const result = applyFilter([], emptyCriteria());
    expect(result.length).toBe(0);
  });
});

describe('applyFilter — level', () => {
  it('filters by level (subset)', () => {
    const c: FilterCriteria = { ...emptyCriteria(), levels: new Set(['E', 'F']) };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([3, 4]);
  });

  it('empty level set hides everything', () => {
    const c: FilterCriteria = { ...emptyCriteria(), levels: new Set() };
    expect(applyFilter(ENTRIES, c).length).toBe(0);
  });

  it('full level set behaves as no filter', () => {
    const c: FilterCriteria = {
      ...emptyCriteria(),
      levels: new Set(['V', 'D', 'I', 'W', 'E', 'F'])
    };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('applyFilter — tag / pid', () => {
  it('filters by tag set', () => {
    const c: FilterCriteria = { ...emptyCriteria(), tags: new Set(['AM', 'DB']) };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([0, 3]);
  });

  it('filters by pid set', () => {
    const c: FilterCriteria = { ...emptyCriteria(), pids: new Set([200]) };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([3, 4, 5]);
  });

  it('combines tag + pid (AND semantics)', () => {
    const c: FilterCriteria = {
      ...emptyCriteria(),
      tags: new Set(['DB', 'AndroidRuntime']),
      pids: new Set([200])
    };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([3, 4]);
  });
});

describe('applyFilter — noise mute', () => {
  it('hides muted tags even when level is in the visible set', () => {
    const c: FilterCriteria = {
      ...emptyCriteria(),
      hiddenNoiseTags: new Set(['Choreographer'])
    };
    const r = indices(applyFilter(ENTRIES, c));
    expect(r).not.toContain(2);
    expect(r).toContain(0);
  });
});

describe('applyFilter — search', () => {
  it('substring search (case insensitive by default)', () => {
    const c: FilterCriteria = { ...emptyCriteria(), query: 'SQL' };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([3]);
  });

  it('substring search respects caseSensitive flag', () => {
    const c1: FilterCriteria = { ...emptyCriteria(), query: 'sql', caseSensitive: false };
    const c2: FilterCriteria = { ...emptyCriteria(), query: 'sql', caseSensitive: true };
    expect(indices(applyFilter(ENTRIES, c1))).toEqual([3]);
    expect(indices(applyFilter(ENTRIES, c2))).toEqual([]); // raw entry uses uppercase SQL
  });

  it('searches message and tag', () => {
    const tagHit: FilterCriteria = { ...emptyCriteria(), query: 'Lifecycle' };
    expect(indices(applyFilter(ENTRIES, tagHit))).toEqual([1]);
  });

  it('regex search', () => {
    const c: FilterCriteria = {
      ...emptyCriteria(),
      query: 'frames|error',
      regex: true
    };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([2, 3]);
  });

  it('bad regex falls back to substring (does not throw, does not go blank)', () => {
    const c: FilterCriteria = { ...emptyCriteria(), query: '[unclosed', regex: true };
    // Falls back to literal substring — the literal "[unclosed" appears nowhere,
    // so no match. The point: doesn't throw, returns a valid array.
    expect(() => applyFilter(ENTRIES, c)).not.toThrow();
    expect(applyFilter(ENTRIES, c).length).toBe(0);
  });
});

describe('applyFilter — combined dimensions', () => {
  it('level + tag + search all apply', () => {
    const c: FilterCriteria = {
      ...emptyCriteria(),
      levels: new Set(['E', 'F']),
      pids: new Set([200]),
      query: 'NULL',
      regex: false
    };
    expect(indices(applyFilter(ENTRIES, c))).toEqual([4]);
  });
});

describe('applyFilter — output shape', () => {
  it('returns a Uint32Array', () => {
    const r = applyFilter(ENTRIES, emptyCriteria());
    expect(r).toBeInstanceOf(Uint32Array);
  });

  it('output length equals number of visible rows (no trailing zeros)', () => {
    const c: FilterCriteria = { ...emptyCriteria(), levels: new Set(['E']) };
    const r = applyFilter(ENTRIES, c);
    expect(r.length).toBe(1);
  });
});
