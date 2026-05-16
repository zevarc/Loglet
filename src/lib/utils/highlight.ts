/**
 * Split a text into alternating non-match / match segments using a regex.
 *
 * Used by LogRow to highlight search matches without resorting to innerHTML.
 *
 * Notes:
 * - Always operates on a regex with the `g` flag (we synthesize one if the
 *   caller's regex lacks it) so `exec` walks the string.
 * - Guards against zero-width matches (e.g. `/^/`) so the loop terminates.
 */
export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function splitByRegex(text: string, re: RegExp): HighlightSegment[] {
  if (!text) return [];

  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const r = new RegExp(re.source, flags);

  const out: HighlightSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = r.exec(text)) !== null) {
    if (m.index > lastIndex) {
      out.push({ text: text.slice(lastIndex, m.index), match: false });
    }
    if (m[0].length > 0) {
      out.push({ text: m[0], match: true });
      lastIndex = m.index + m[0].length;
    } else {
      // zero-width match (e.g. /^/) — advance to avoid infinite loop
      r.lastIndex++;
    }
  }

  if (lastIndex < text.length) {
    out.push({ text: text.slice(lastIndex), match: false });
  }

  return out;
}

/**
 * Compile a user query (substring or regex) into a `RegExp` suitable for
 * `splitByRegex`. Returns `null` for an empty query or an invalid regex
 * (the caller should also see this as "no highlighting").
 */
export function compileSearchRegex(
  query: string,
  options: { regex: boolean; caseSensitive: boolean },
): RegExp | null {
  if (!query) return null;
  const flags = options.caseSensitive ? "g" : "gi";
  try {
    if (options.regex) return new RegExp(query, flags);
    return new RegExp(escapeRegex(query), flags);
  } catch {
    return null;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
