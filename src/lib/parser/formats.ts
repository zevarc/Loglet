/**
 * Logcat format regexes.
 * See docs/PARSER_SPEC.md §3 for derivation and edge-case notes.
 *
 * Each regex captures only the fields we need; avoid unnecessary capture
 * groups to keep the matcher cheap (regex hot path during parse).
 */

import type { LogcatFormat } from '../types';

/**
 * threadtime:  05-15 12:34:56.789  1234  5678 E ActivityManager: msg
 *              ^date ^time          ^pid  ^tid ^L ^tag             ^message
 */
export const RE_THREADTIME =
  /^(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEFA])\s+([^:]+?)\s*:\s?(.*)$/;

/**
 * time:        05-15 12:34:56.789 E/ActivityManager(1234): msg
 */
export const RE_TIME =
  /^(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+([VDIWEFA])\/([^(]+)\(\s*(\d+)\s*\)\s*:\s?(.*)$/;

/**
 * brief:       E/ActivityManager(1234): msg
 */
export const RE_BRIEF = /^([VDIWEFA])\/([^(]+)\(\s*(\d+)\s*\)\s*:\s?(.*)$/;

/**
 * long header: [ 05-15 12:34:56.789  1234: 5678 E/ActivityManager ]
 * The body of a "long" entry follows on subsequent lines until a blank line.
 */
export const RE_LONG_HEADER =
  /^\[\s*(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+):\s*(\d+)\s+([VDIWEFA])\/(.+?)\s*\]$/;

/**
 * tag:         E/ActivityManager: msg
 */
export const RE_TAG = /^([VDIWEFA])\/([^:]+?)\s*:\s?(.*)$/;

/**
 * studio: Android Studio Logcat V2 copy format (Hedgehog and later).
 *
 *   2024-01-15 14:22:01.500  4242-5678  ActivityManager  com.example.app  E  msg
 *
 * Columns are whitespace-separated and right-padded in the source view, but
 * the regex collapses runs of whitespace via `\s+`. PACKAGE may be `?` when
 * the process owner is unknown.
 *
 * Captures: year, month, day, time, pid, tid, tag, package, level, message.
 */
export const RE_STUDIO =
  /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)-(\d+)\s+(\S+)\s+(\S+)\s+([VDIWEFA])\s+(.*)$/;

/** Line that begins a Java/Kotlin stack frame: "    at com.x.Y.z(File.java:42)" */
export const RE_FRAME = /^\s+at\s+[\w$.<>]+\([^)]+\)\s*$/;

/** "... N more" tail */
export const RE_FRAME_MORE = /^\s*\.{3}\s*\d+\s+more\s*$/;

/** Caused by: java.lang.X: msg */
export const RE_CAUSED_BY = /^Caused by:\s+/;

/** Java/Kotlin exception header (used both as standalone and inside FATAL block). */
export const RE_EXCEPTION = /^([\w$.]+(?:Exception|Error|Throwable)):/;

/**
 * Identify-by-test in priority order. Higher information content first
 * so a line that could match both `tag` and `threadtime` votes for the
 * latter. `studio` goes first because its 4-digit year is the most
 * specific anchor — no other format can accidentally match it.
 */
export const FORMAT_PROBES: ReadonlyArray<readonly [LogcatFormat, RegExp]> = [
  ['studio', RE_STUDIO],
  ['threadtime', RE_THREADTIME],
  ['time', RE_TIME],
  ['long', RE_LONG_HEADER],
  ['brief', RE_BRIEF],
  ['tag', RE_TAG]
];
