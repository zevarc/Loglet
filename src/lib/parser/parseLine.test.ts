import { describe, expect, it } from 'vitest';
import { createContext, parseLine } from './parseLine';

// Reference date so year inference is deterministic.
const NOW = new Date(Date.UTC(2026, 4 /* May */, 15, 12, 0, 0));
const ctx = () => createContext(NOW);

describe('parseLine — threadtime', () => {
  it('parses a typical line', () => {
    const r = parseLine(
      '05-15 12:34:56.789  1234  5678 E ActivityManager: Force finishing activity',
      'threadtime',
      ctx()
    );
    expect(r).not.toBeNull();
    expect(r!.level).toBe('E');
    expect(r!.tag).toBe('ActivityManager');
    expect(r!.pid).toBe(1234);
    expect(r!.tid).toBe(5678);
    expect(r!.message).toBe('Force finishing activity');
    expect(r!.timestamp).toBe(Date.UTC(2026, 4, 15, 12, 34, 56, 789));
  });

  it('maps "A" (Assert) to "F" (Fatal)', () => {
    const r = parseLine(
      '05-15 12:34:56.789  1234  5678 A TestTag: assert message',
      'threadtime',
      ctx()
    );
    expect(r!.level).toBe('F');
  });

  it('handles empty message', () => {
    const r = parseLine(
      '05-15 12:34:56.789  1234  5678 I TestTag: ',
      'threadtime',
      ctx()
    );
    expect(r).not.toBeNull();
    expect(r!.message).toBe('');
  });

  it('handles tag with dots and underscores', () => {
    const r = parseLine(
      '05-15 12:34:56.789  1234  5678 D com.example.MyTag_v2: hello',
      'threadtime',
      ctx()
    );
    expect(r!.tag).toBe('com.example.MyTag_v2');
  });

  it('returns null for malformed input', () => {
    expect(parseLine('not a logcat line', 'threadtime', ctx())).toBeNull();
    expect(parseLine('', 'threadtime', ctx())).toBeNull();
  });

  it('intern pool reuses tag string references', () => {
    const c = ctx();
    const a = parseLine('05-15 12:34:56.789  1 1 I MyTag: a', 'threadtime', c)!;
    const b = parseLine('05-15 12:34:56.790  1 1 I MyTag: b', 'threadtime', c)!;
    expect(a.tag).toBe(b.tag);
    // Same reference, not just equal:
    expect(Object.is(a.tag, b.tag)).toBe(true);
  });
});

describe('parseLine — time', () => {
  it('parses a typical line', () => {
    const r = parseLine(
      '05-15 12:34:56.789 E/ActivityManager(1234): boom',
      'time',
      ctx()
    );
    expect(r).not.toBeNull();
    expect(r!.level).toBe('E');
    expect(r!.tag).toBe('ActivityManager');
    expect(r!.pid).toBe(1234);
    expect(r!.tid).toBeUndefined();
    expect(r!.message).toBe('boom');
  });

  it('handles padded PID', () => {
    const r = parseLine(
      '05-15 12:34:56.789 W/Choreographer(   42): skipped',
      'time',
      ctx()
    );
    expect(r!.pid).toBe(42);
  });
});

describe('parseLine — brief', () => {
  it('parses a typical line', () => {
    const r = parseLine('E/ActivityManager(1234): kaboom', 'brief', ctx());
    expect(r).not.toBeNull();
    expect(r!.level).toBe('E');
    expect(r!.tag).toBe('ActivityManager');
    expect(r!.pid).toBe(1234);
    expect(r!.message).toBe('kaboom');
    expect(r!.timestamp).toBeUndefined();
  });
});

describe('parseLine — tag', () => {
  it('parses a typical line', () => {
    const r = parseLine('E/ActivityManager: kaboom', 'tag', ctx());
    expect(r).not.toBeNull();
    expect(r!.level).toBe('E');
    expect(r!.tag).toBe('ActivityManager');
    expect(r!.message).toBe('kaboom');
    expect(r!.pid).toBeUndefined();
    expect(r!.timestamp).toBeUndefined();
  });
});

describe('parseLine — studio', () => {
  it('parses a typical Android Studio Logcat V2 line', () => {
    const r = parseLine(
      '2024-05-15 12:01:23.456  1234-5678 ActivityManager  com.example.app   E  Force finishing activity',
      'studio',
      ctx()
    );
    expect(r).not.toBeNull();
    expect(r!.level).toBe('E');
    expect(r!.tag).toBe('ActivityManager');
    expect(r!.pid).toBe(1234);
    expect(r!.tid).toBe(5678);
    expect(r!.packageName).toBe('com.example.app');
    expect(r!.message).toBe('Force finishing activity');
    expect(r!.timestamp).toBe(Date.UTC(2024, 4, 15, 12, 1, 23, 456));
  });

  it('drops "?" package placeholder', () => {
    const r = parseLine(
      '2024-05-15 12:01:23.456  100-100 ActivityManager  ?   I  boot',
      'studio',
      ctx()
    );
    expect(r!.packageName).toBeUndefined();
  });

  it('absorbs right-padded whitespace between columns', () => {
    const r = parseLine(
      '2024-05-15 12:01:23.456  1234-5678 Tag                com.example.app                    W  message body',
      'studio',
      ctx()
    );
    expect(r).not.toBeNull();
    expect(r!.tag).toBe('Tag');
    expect(r!.packageName).toBe('com.example.app');
    expect(r!.message).toBe('message body');
  });

  it('returns null for malformed input', () => {
    expect(parseLine('not a logcat line', 'studio', ctx())).toBeNull();
  });
});

describe('parseLine — long / raw', () => {
  it('always returns null for long (orchestrated separately)', () => {
    expect(
      parseLine('[ 05-15 12:34:56.789  1234: 5678 E/Tag ]', 'long', ctx())
    ).toBeNull();
  });
  it('always returns null for raw', () => {
    expect(parseLine('whatever', 'raw', ctx())).toBeNull();
  });
});

describe('parseLine — year inference', () => {
  it('rolls back to previous year when month is in future', () => {
    // Current = May 2026; a "12-25" log must be Dec 2025.
    const dec = new Date(Date.UTC(2026, 4, 15, 12, 0, 0));
    const c = createContext(dec);
    const r = parseLine(
      '12-25 09:00:00.000  1 1 I Tag: xmas',
      'threadtime',
      c
    );
    expect(new Date(r!.timestamp!).getUTCFullYear()).toBe(2025);
  });

  it('keeps current year when month is in the past', () => {
    const dec = new Date(Date.UTC(2026, 4, 15, 12, 0, 0));
    const c = createContext(dec);
    const r = parseLine(
      '03-01 09:00:00.000  1 1 I Tag: earlier',
      'threadtime',
      c
    );
    expect(new Date(r!.timestamp!).getUTCFullYear()).toBe(2026);
  });
});
