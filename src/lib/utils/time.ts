/**
 * Time utilities. Logcat timestamps don't include the year — we infer it
 * heuristically per PARSER_SPEC §2.2.
 */

/**
 * Build a millisecond timestamp from logcat fields. Year is inferred:
 *   - default = current year
 *   - if the parsed month is "in the future" relative to today, assume last year
 */
export function buildTimestamp(
  month: number, // 1-12
  day: number,   // 1-31
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
  now: Date = new Date()
): number {
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  // tolerance of +1 month for skew / time-zone wiggle
  const year = month > currentMonth + 1 ? currentYear - 1 : currentYear;
  return Date.UTC(year, month - 1, day, hours, minutes, seconds, ms);
}

/** Format an absolute epoch timestamp as the original logcat-style string. */
export function formatLogcatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    pad(d.getUTCMonth() + 1) +
    '-' +
    pad(d.getUTCDate()) +
    ' ' +
    pad(d.getUTCHours()) +
    ':' +
    pad(d.getUTCMinutes()) +
    ':' +
    pad(d.getUTCSeconds()) +
    '.' +
    pad(d.getUTCMilliseconds(), 3)
  );
}
