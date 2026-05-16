/**
 * Format auto-detection.
 * See docs/PARSER_SPEC.md §4 — sample-and-vote strategy.
 */

import type { LogcatFormat } from '../types';
import { FORMAT_PROBES } from './formats';

const SAMPLE_SIZE = 20;
const DETECTION_THRESHOLD = 0.3;

/**
 * Inspect the first non-empty lines (up to SAMPLE_SIZE) and return the most
 * likely logcat format. Falls back to `'raw'` if no probe matches enough.
 */
export function detectFormat(text: string): LogcatFormat {
  const lines = pickSampleLines(text, SAMPLE_SIZE);
  if (lines.length === 0) return 'raw';

  const scores: Record<LogcatFormat, number> = {
    studio: 0,
    threadtime: 0,
    time: 0,
    long: 0,
    brief: 0,
    tag: 0,
    raw: 0
  };

  for (const line of lines) {
    for (const [fmt, re] of FORMAT_PROBES) {
      if (re.test(line)) {
        scores[fmt]++;
        break; // higher-priority formats win; don't double-count
      }
    }
  }

  const best = pickBest(scores);
  if (best.score / lines.length < DETECTION_THRESHOLD) {
    return 'raw';
  }
  return best.format;
}

function pickSampleLines(text: string, n: number): string[] {
  const out: string[] = [];
  let i = 0;
  const len = text.length;
  while (i < len && out.length < n) {
    const next = text.indexOf('\n', i);
    const end = next === -1 ? len : next;
    let line = text.slice(i, end);
    // Strip trailing \r (CRLF inputs). Without this the format probes' `$`
    // anchor fails because `.` doesn't match \r, so every line scores zero
    // and detection falls back to 'raw'.
    if (line.endsWith('\r')) line = line.slice(0, -1);
    const trimmed = line.trim();
    if (trimmed.length > 0 && !trimmed.startsWith('---------')) {
      out.push(line);
    }
    i = end + 1;
  }
  return out;
}

function pickBest(
  scores: Record<LogcatFormat, number>
): { format: LogcatFormat; score: number } {
  const order: LogcatFormat[] = ['studio', 'threadtime', 'time', 'long', 'brief', 'tag'];
  let bestFormat: LogcatFormat = 'raw';
  let bestScore = -1;
  for (const fmt of order) {
    if (scores[fmt] > bestScore) {
      bestScore = scores[fmt];
      bestFormat = fmt;
    }
  }
  return { format: bestFormat, score: bestScore };
}
