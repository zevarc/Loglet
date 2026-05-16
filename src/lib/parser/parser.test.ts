import { describe, expect, it } from 'vitest';
import { parse } from './index';

// Vite ?raw imports — let Vitest read the fixtures from disk at build time.
import threadtimeBasic from '../../fixtures/threadtime-basic.log?raw';
import threadtimeCrash from '../../fixtures/threadtime-crash.log?raw';
import timeBasic from '../../fixtures/time-basic.log?raw';
import briefBasic from '../../fixtures/brief-basic.log?raw';
import tagBasic from '../../fixtures/tag-basic.log?raw';
import longBasic from '../../fixtures/long-basic.log?raw';
import studioBasic from '../../fixtures/studio-basic.log?raw';
import mixedNoise from '../../fixtures/mixed-noise.log?raw';

describe('parse — format detection on fixtures', () => {
  it('threadtime', () => {
    expect(parse(threadtimeBasic).format).toBe('threadtime');
  });
  it('time', () => {
    expect(parse(timeBasic).format).toBe('time');
  });
  it('brief', () => {
    expect(parse(briefBasic).format).toBe('brief');
  });
  it('tag', () => {
    expect(parse(tagBasic).format).toBe('tag');
  });
  it('long', () => {
    expect(parse(longBasic).format).toBe('long');
  });
  it('studio', () => {
    expect(parse(studioBasic).format).toBe('studio');
  });
});

describe('parse — studio fixture', () => {
  const r = parse(studioBasic);

  it('parses every line', () => {
    expect(r.entries.length).toBe(8);
    expect(r.entries.every((e) => !e.unparsed)).toBe(true);
  });

  it('extracts pid + tid per entry', () => {
    expect(r.entries[0]!.pid).toBe(1234);
    expect(r.entries[0]!.tid).toBe(1234);
    expect(r.entries[3]!.tid).toBe(5678);
  });

  it('extracts package name', () => {
    expect(r.entries[0]!.packageName).toBe('com.example.app');
  });

  it('drops "?" package placeholder', () => {
    // last entry has "?" as package
    expect(r.entries[r.entries.length - 1]!.packageName).toBeUndefined();
  });

  it('keeps level + tag', () => {
    expect(r.entries[0]!.tag).toBe('ActivityManager');
    expect(r.entries[6]!.level).toBe('E');
    expect(r.entries[6]!.tag).toBe('DBHelper');
  });
});

describe('parse — threadtime fixture', () => {
  const r = parse(threadtimeBasic);

  it('parses every non-divider line', () => {
    // 9 log lines + 1 divider (skipped)
    expect(r.entries.length).toBe(9);
  });

  it('skips divider lines', () => {
    expect(r.entries.some((e) => e.raw.startsWith('---------'))).toBe(false);
  });

  it('aggregates tag distribution', () => {
    expect(r.meta.tags.get('AppLifecycle')).toBe(4);
    expect(r.meta.tags.get('NetworkClient')).toBe(2);
  });

  it('aggregates level distribution', () => {
    expect(r.meta.levelDistribution.I).toBe(4);
    expect(r.meta.levelDistribution.D).toBe(3);
    expect(r.meta.levelDistribution.W).toBe(1);
    expect(r.meta.levelDistribution.E).toBe(1);
  });

  it('computes a time range', () => {
    expect(r.meta.timeRange).toBeDefined();
    const [start, end] = r.meta.timeRange!;
    expect(end).toBeGreaterThan(start);
  });
});

describe('parse — crash fixture', () => {
  const r = parse(threadtimeCrash);

  it('produces at least one stack block', () => {
    expect(r.stackBlocks.length).toBeGreaterThanOrEqual(1);
  });

  it('captures the exception class', () => {
    const top = r.stackBlocks[0]!;
    expect(top.exception).toMatch(/NullPointerException/);
  });

  it('collects "at" frames', () => {
    const top = r.stackBlocks[0]!;
    expect(top.frameIndices.length).toBeGreaterThanOrEqual(4);
  });

  it('detects nested Caused by chain', () => {
    const top = r.stackBlocks[0]!;
    expect(top.causedByBlocks.length).toBe(1);
    expect(top.causedByBlocks[0]!.exception).toMatch(/IllegalStateException/);
  });
});

describe('parse — long format fixture', () => {
  const r = parse(longBasic);

  it('groups header + body into a single entry', () => {
    // 4 entries in the fixture
    expect(r.entries.length).toBe(4);
  });

  it('merges multi-line bodies', () => {
    const second = r.entries[1]!;
    expect(second.tag).toBe('AppLifecycle');
    expect(second.message.split('\n').length).toBe(2);
  });
});

describe('parse — brief / tag fixtures', () => {
  it('brief format extracts pid', () => {
    const r = parse(briefBasic);
    expect(r.entries[0]!.pid).toBe(1234);
    expect(r.entries[0]!.timestamp).toBeUndefined();
  });

  it('tag format has no pid, no timestamp', () => {
    const r = parse(tagBasic);
    expect(r.entries[0]!.pid).toBeUndefined();
    expect(r.entries[0]!.timestamp).toBeUndefined();
    expect(r.meta.timeRange).toBeUndefined();
  });
});

describe('parse — robustness', () => {
  it('handles empty input', () => {
    const r = parse('');
    expect(r.entries).toEqual([]);
    expect(r.format).toBe('raw');
  });

  it('handles whitespace-only input', () => {
    const r = parse('   \n  \n\n');
    expect(r.entries).toEqual([]);
  });

  it('handles CRLF line endings', () => {
    const text =
      '05-15 12:01:23.456  1234  1234 I Tag1: a\r\n05-15 12:01:23.512  1234  1234 D Tag2: b\r\n';
    const r = parse(text);
    expect(r.entries.length).toBe(2);
    expect(r.entries[0]!.message).toBe('a');
  });

  it('mixed-noise: drops dividers, marks orphans as unparsed, still parses good lines', () => {
    const r = parse(mixedNoise);
    // The 3 valid threadtime lines should be parsed correctly:
    const parsed = r.entries.filter((e) => !e.unparsed);
    expect(parsed.length).toBe(3);
    // Plus at least a few unparsed orphan lines for the prose:
    const unparsed = r.entries.filter((e) => e.unparsed);
    expect(unparsed.length).toBeGreaterThan(0);
  });

  it('truncates absurdly long lines without crashing', () => {
    const big =
      '05-15 12:01:23.456  1 1 I Tag: ' + 'x'.repeat(20_000) + '\n';
    const r = parse(big);
    expect(r.entries.length).toBe(1);
    expect(r.entries[0]!.message.length).toBeLessThanOrEqual(10_100);
  });

  it('never throws on randomized fuzz input', () => {
    const fuzz = Array.from({ length: 100 }, () =>
      Math.random().toString(36).slice(2) + (Math.random() < 0.5 ? ': ' : '/')
    ).join('\n');
    expect(() => parse(fuzz)).not.toThrow();
  });
});

describe('parse — meta accuracy', () => {
  const r = parse(threadtimeBasic);

  it('parseErrorRate is 0 for clean input', () => {
    expect(r.meta.parseErrorRate).toBe(0);
  });

  it('totalLines matches entries length', () => {
    expect(r.meta.totalLines).toBe(r.entries.length);
  });

  it('parsedLines equals non-unparsed count', () => {
    const parsed = r.entries.filter((e) => !e.unparsed).length;
    expect(r.meta.parsedLines).toBe(parsed);
  });

  it('pids map covers every distinct pid', () => {
    const distinct = new Set(r.entries.map((e) => e.pid).filter((p) => p !== undefined));
    expect(r.meta.pids.size).toBe(distinct.size);
  });
});
