/**
 * Stack-trace block detection.
 *
 * Identifies contiguous runs of log entries belonging to a single Java/Kotlin
 * exception, plus nested `Caused by:` chains.
 *
 * Spec: docs/PARSER_SPEC.md §6.
 */

import type { LogEntry, StackBlock } from "../types";
import { RE_CAUSED_BY, RE_EXCEPTION, RE_FRAME, RE_FRAME_MORE } from "./formats";

const FATAL_HEADER = "FATAL EXCEPTION";
const PROCESS_HEADER = /^Process:\s/;
const CAUSED_BY_PREFIX = /^Caused by:\s+/;

/**
 * Scan all entries and group them into stack blocks.
 *
 * Anchors:
 *   1. "FATAL EXCEPTION" line (start of crash block)
 *   2. Standalone exception-class line: `java.lang.X: …`
 *
 * After an anchor, frame lines (`\tat com.x.Y(File.java:n)` or `... N more`)
 * and `Caused by:` chains are absorbed into the block. `Caused by:` lines
 * are not surfaced as top-level blocks; they nest under their parent.
 */
export function detectStackBlocks(entries: LogEntry[]): StackBlock[] {
  const blocks: StackBlock[] = [];
  let i = 0;
  while (i < entries.length) {
    const start = findBlockStart(entries, i);
    if (start === -1) break;

    const { block, nextIndex } = collectBlock(entries, start);
    blocks.push(block);
    i = nextIndex;
  }
  return blocks;
}

/**
 * Find the next entry index that begins a top-level stack block.
 *
 * "Caused by:" lines are intentionally skipped here — they are only valid
 * as nested children, never as top-level blocks (otherwise a stray
 * `Caused by:` orphaned by mid-parse truncation would surface twice).
 */
function findBlockStart(entries: LogEntry[], from: number): number {
  for (let i = from; i < entries.length; i++) {
    const msg = entries[i]!.message;
    if (msg.startsWith(FATAL_HEADER)) return i;
    if (CAUSED_BY_PREFIX.test(msg)) continue; // never a top-level anchor
    if (RE_EXCEPTION.test(msg)) return i;
  }
  return -1;
}

/**
 * Starting at `start`, accumulate the block. Returns the block and the
 * index of the first line *not* in it.
 *
 * The starting line is one of:
 *   - "FATAL EXCEPTION: …"           (optional preamble → next line is exception)
 *   - "java.lang.X: …"               (anchor itself is exception)
 *   - "Caused by: java.lang.X: …"    (when called recursively)
 */
function collectBlock(
  entries: LogEntry[],
  start: number,
): { block: StackBlock; nextIndex: number } {
  let cursor = start;
  let exception = "";
  let exceptionLineIndex = -1;

  // ─── Optional FATAL EXCEPTION preamble + Process metadata ───
  if (entries[cursor]!.message.startsWith(FATAL_HEADER)) {
    cursor++;
    while (
      cursor < entries.length &&
      PROCESS_HEADER.test(entries[cursor]!.message)
    ) {
      cursor++;
    }
  }

  // ─── Real exception-class line (may be prefixed with "Caused by:") ───
  if (cursor < entries.length) {
    const raw = entries[cursor]!.message;
    const stripped = raw.replace(CAUSED_BY_PREFIX, "");
    const ex = RE_EXCEPTION.exec(stripped);
    if (ex) {
      exception = ex[1]!;
      exceptionLineIndex = cursor;
      cursor++;
    }
  }

  // ─── Frame / "... N more" / nested Caused by lines ───
  const frameIndices: number[] = [];
  const causedByBlocks: StackBlock[] = [];

  while (cursor < entries.length) {
    const msg = entries[cursor]!.message;

    if (RE_FRAME.test(msg) || RE_FRAME_MORE.test(msg)) {
      frameIndices.push(cursor);
      cursor++;
      continue;
    }
    if (RE_CAUSED_BY.test(msg)) {
      const sub = collectBlock(entries, cursor);
      causedByBlocks.push(sub.block);
      cursor = sub.nextIndex;
      continue;
    }
    break;
  }

  return {
    block: {
      headerIndex: exceptionLineIndex !== -1 ? exceptionLineIndex : start,
      startIndex: start,
      endIndex: Math.max(start, cursor - 1),
      frameIndices,
      causedByBlocks,
      exception: exception || "Unknown",
    },
    nextIndex: cursor,
  };
}
