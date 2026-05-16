/**
 * Logcat parser entry point.
 *
 * Pipeline (spec: docs/PARSER_SPEC.md §5):
 *   1. detectFormat(text)         → pick one of 5 formats or fall back to raw
 *   2. iterate lines              → indexOf('\n') stream, no full split() copy
 *   3. parseLine(line, format)    → structured fields, or merge into previous
 *   4. detectStackBlocks(entries) → group FATAL EXCEPTION + frames + Caused by
 *   5. aggregate meta             → tags / pids / level distribution / time range
 */

import type { LogEntry, LogLevel, LogcatFormat, ParseMeta, ParseResult } from '../types';
import { detectFormat } from './detect';
import { RE_LONG_HEADER } from './formats';
import { createContext, parseLine, type ParseContext } from './parseLine';
import { detectStackBlocks } from './stack';
import { buildTimestamp } from '../utils/time';

const DIVIDER = '---------';
const MAX_LINE_LENGTH = 10_000;

export function parse(text: string): ParseResult {
  const format = detectFormat(text);
  const ctx = createContext();

  const entries: LogEntry[] =
    format === 'long' ? parseLong(text, ctx) : parseLineByLine(text, format, ctx);

  return {
    entries,
    format,
    meta: computeMeta(entries),
    stackBlocks: detectStackBlocks(entries)
  };
}

// ─── line-by-line for threadtime / time / brief / tag / raw ───────────────

function parseLineByLine(text: string, format: LogcatFormat, ctx: ParseContext): LogEntry[] {
  const entries: LogEntry[] = [];

  forEachLine(text, (rawLine) => {
    const line = truncate(rawLine);
    const trimmed = line.trim();

    if (trimmed.length === 0) return;
    if (trimmed.startsWith(DIVIDER)) return;

    if (format === 'raw') {
      entries.push({
        index: entries.length,
        raw: line,
        level: 'V',
        tag: '',
        message: line,
        unparsed: true
      });
      return;
    }

    const parsed = parseLine(line, format, ctx);
    if (parsed) {
      entries.push({ index: entries.length, raw: line, ...parsed });
      return;
    }

    // Continuation line? (stack frames, multi-line messages)
    if (entries.length > 0 && isContinuation(line)) {
      const prev = entries[entries.length - 1]!;
      prev.message = prev.message ? prev.message + '\n' + line : line;
      prev.raw = prev.raw + '\n' + line;
      return;
    }

    // Otherwise: an orphan line. Keep it visible (searchable) but flagged.
    entries.push({
      index: entries.length,
      raw: line,
      level: 'V',
      tag: '',
      message: line,
      unparsed: true
    });
  });

  return entries;
}

// ─── long format: [ header ] then body lines until blank ──────────────────

function parseLong(text: string, ctx: ParseContext): LogEntry[] {
  const entries: LogEntry[] = [];
  let current: LongAccumulator | null = null;

  const flush = () => {
    if (!current) return;
    entries.push({
      index: entries.length,
      raw: current.raw,
      timestamp: current.timestamp,
      level: current.level,
      pid: current.pid,
      tid: current.tid,
      tag: current.tag,
      message: current.bodyLines.join('\n')
    });
    current = null;
  };

  forEachLine(text, (rawLine) => {
    const line = truncate(rawLine);
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flush();
      return;
    }
    if (trimmed.startsWith(DIVIDER)) return;

    const headerMatch = RE_LONG_HEADER.exec(line);
    if (headerMatch) {
      flush();
      const [, date, time, pid, tid, level, tag] = headerMatch;
      const month = Number(date!.slice(0, 2));
      const day = Number(date!.slice(3, 5));
      const hours = Number(time!.slice(0, 2));
      const minutes = Number(time!.slice(3, 5));
      const seconds = Number(time!.slice(6, 8));
      const ms = Number(time!.slice(9, 12));
      current = {
        raw: line,
        timestamp: buildTimestamp(month, day, hours, minutes, seconds, ms, ctx.now),
        level: (level === 'A' ? 'F' : (level as LogLevel)),
        pid: Number(pid),
        tid: Number(tid),
        tag: tag!.trim(),
        bodyLines: []
      };
      return;
    }

    if (current) {
      current.bodyLines.push(line);
      current.raw += '\n' + line;
    } else {
      // Orphan body line before any header.
      entries.push({
        index: entries.length,
        raw: line,
        level: 'V',
        tag: '',
        message: line,
        unparsed: true
      });
    }
  });

  flush();
  return entries;
}

interface LongAccumulator {
  raw: string;
  timestamp: number;
  level: LogLevel;
  pid: number;
  tid: number;
  tag: string;
  bodyLines: string[];
}

// ─── helpers ──────────────────────────────────────────────────────────────

/**
 * Stream lines without materializing `text.split('\n')`. Saves ~3x peak
 * memory on large inputs.
 */
function forEachLine(text: string, cb: (line: string) => void): void {
  let i = 0;
  const n = text.length;
  while (i < n) {
    let end = text.indexOf('\n', i);
    if (end === -1) end = n;
    let line = text.slice(i, end);
    // strip trailing \r (CRLF inputs)
    if (line.endsWith('\r')) line = line.slice(0, -1);
    cb(line);
    i = end + 1;
  }
}

function truncate(line: string): string {
  return line.length > MAX_LINE_LENGTH ? line.slice(0, MAX_LINE_LENGTH) + ' …[truncated]' : line;
}

function isContinuation(line: string): boolean {
  if (line.length === 0) return false;
  const c = line.charCodeAt(0);
  // Tab
  if (c === 9) return true;
  // 4+ leading spaces
  if (c === 32 && line.startsWith('    ')) return true;
  return false;
}

function computeMeta(entries: LogEntry[]): ParseMeta {
  const tags = new Map<string, number>();
  const pids = new Map<number, number>();
  const levelDistribution: Record<LogLevel, number> = {
    V: 0, D: 0, I: 0, W: 0, E: 0, F: 0
  };

  let parsedLines = 0;
  let minTs = Infinity;
  let maxTs = -Infinity;

  for (const e of entries) {
    if (!e.unparsed) parsedLines++;
    levelDistribution[e.level]++;
    if (e.tag) tags.set(e.tag, (tags.get(e.tag) ?? 0) + 1);
    if (e.pid !== undefined) pids.set(e.pid, (pids.get(e.pid) ?? 0) + 1);
    if (e.timestamp !== undefined) {
      if (e.timestamp < minTs) minTs = e.timestamp;
      if (e.timestamp > maxTs) maxTs = e.timestamp;
    }
  }

  const totalLines = entries.length;
  return {
    totalLines,
    parsedLines,
    parseErrorRate: totalLines === 0 ? 0 : 1 - parsedLines / totalLines,
    tags,
    pids,
    levelDistribution,
    timeRange: minTs === Infinity ? undefined : [minTs, maxTs]
  };
}

export { detectFormat };
export { parseLine } from './parseLine';
