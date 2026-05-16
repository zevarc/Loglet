/**
 * Single-line parser.
 *
 * Given a line and a known format, return the parsed fields (sans `index`
 * and `raw` — those are filled in by the caller). Returns `null` when the
 * line doesn't match the format.
 *
 * Spec: docs/PARSER_SPEC.md §5.
 */

import type { LogEntry, LogLevel, LogcatFormat } from '../types';
import { RE_BRIEF, RE_STUDIO, RE_TAG, RE_THREADTIME, RE_TIME } from './formats';
import { buildTimestamp } from '../utils/time';

/** Fields produced by parseLine (excludes `index` / `raw`). */
export type ParsedFields = Omit<LogEntry, 'index' | 'raw'>;

/** Context the line parser needs for cross-line state (year inference). */
export interface ParseContext {
  /** Reference "now" for year inference. Pass a stable Date at parse start. */
  now: Date;
  /** Tag intern pool. Repeated strings share references → less memory. */
  tagPool: Map<string, string>;
}

export function createContext(now: Date = new Date()): ParseContext {
  return { now, tagPool: new Map() };
}

export function parseLine(
  line: string,
  format: LogcatFormat,
  ctx: ParseContext
): ParsedFields | null {
  switch (format) {
    case 'studio':
      return parseStudio(line, ctx);
    case 'threadtime':
      return parseThreadtime(line, ctx);
    case 'time':
      return parseTime(line, ctx);
    case 'brief':
      return parseBrief(line, ctx);
    case 'tag':
      return parseTag(line, ctx);
    case 'long':
      // long format is multi-line; the orchestrator in index.ts handles it.
      return null;
    case 'raw':
      return null;
  }
}

// ─── format-specific parsers ───────────────────────────────────────────────

function parseStudio(line: string, ctx: ParseContext): ParsedFields | null {
  const m = RE_STUDIO.exec(line);
  if (!m) return null;
  const [, year, month, day, time, pid, tid, tag, pkg, level, message] = m;
  const hours = Number(time!.slice(0, 2));
  const minutes = Number(time!.slice(3, 5));
  const seconds = Number(time!.slice(6, 8));
  const ms = Number(time!.slice(9, 12));
  const timestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    hours,
    minutes,
    seconds,
    ms
  );
  return {
    timestamp,
    pid: Number(pid),
    tid: Number(tid),
    level: normalizeLevel(level!),
    tag: intern(ctx, tag!),
    // "?" is Android Studio's placeholder for an unknown package — drop it.
    packageName: pkg && pkg !== '?' ? intern(ctx, pkg) : undefined,
    message: message ?? ''
  };
}

function parseThreadtime(line: string, ctx: ParseContext): ParsedFields | null {
  const m = RE_THREADTIME.exec(line);
  if (!m) return null;
  const [, date, time, pid, tid, level, tag, message] = m;
  return {
    timestamp: timestampFromParts(date!, time!, ctx),
    pid: Number(pid),
    tid: Number(tid),
    level: normalizeLevel(level!),
    tag: intern(ctx, tag!),
    message: message ?? ''
  };
}

function parseTime(line: string, ctx: ParseContext): ParsedFields | null {
  const m = RE_TIME.exec(line);
  if (!m) return null;
  const [, date, time, level, tag, pid, message] = m;
  return {
    timestamp: timestampFromParts(date!, time!, ctx),
    pid: Number(pid),
    level: normalizeLevel(level!),
    tag: intern(ctx, tag!.trim()),
    message: message ?? ''
  };
}

function parseBrief(line: string, ctx: ParseContext): ParsedFields | null {
  const m = RE_BRIEF.exec(line);
  if (!m) return null;
  const [, level, tag, pid, message] = m;
  return {
    pid: Number(pid),
    level: normalizeLevel(level!),
    tag: intern(ctx, tag!.trim()),
    message: message ?? ''
  };
}

function parseTag(line: string, ctx: ParseContext): ParsedFields | null {
  const m = RE_TAG.exec(line);
  if (!m) return null;
  const [, level, tag, message] = m;
  return {
    level: normalizeLevel(level!),
    tag: intern(ctx, tag!.trim()),
    message: message ?? ''
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────

/** Normalize Android's "A" (Assert) to our internal "F" (Fatal). */
function normalizeLevel(raw: string): LogLevel {
  return (raw === 'A' ? 'F' : (raw as LogLevel));
}

/**
 * Build a millisecond epoch timestamp from logcat's "MM-DD" + "HH:MM:SS.mmm".
 * Year is inferred from `ctx.now` (see PARSER_SPEC §2.2).
 */
function timestampFromParts(date: string, time: string, ctx: ParseContext): number {
  // date = "MM-DD", time = "HH:MM:SS.mmm"
  const month = Number(date.slice(0, 2));
  const day = Number(date.slice(3, 5));
  const hours = Number(time.slice(0, 2));
  const minutes = Number(time.slice(3, 5));
  const seconds = Number(time.slice(6, 8));
  const ms = Number(time.slice(9, 12));
  return buildTimestamp(month, day, hours, minutes, seconds, ms, ctx.now);
}

function intern(ctx: ParseContext, s: string): string {
  const hit = ctx.tagPool.get(s);
  if (hit !== undefined) return hit;
  ctx.tagPool.set(s, s);
  return s;
}
