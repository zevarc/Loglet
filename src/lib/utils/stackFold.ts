/**
 * Helpers for the "fold stack block into one row" UX.
 *
 * Folding is a structural concern (which rows are hidden) not a filter
 * concern (which rows match user criteria) — but they collapse to the same
 * underlying mechanism in the row view: `applyFilter` honors a
 * `hiddenIndices` set.
 */

import type { StackBlock } from '../types';

/**
 * Given the parser's `stackBlocks` and a set of currently-collapsed block
 * header indices, return the entry indices that should be hidden.
 *
 * For each collapsed block, hide every entry in `[startIndex, endIndex]`
 * EXCEPT the `headerIndex` itself — that row stands in for the whole block
 * and is decorated in `LogRow` with an "expand" affordance.
 *
 * Nested `causedByBlocks` are folded together with the outer block (they
 * don't fold independently in MVP).
 */
export function hiddenByCollapse(
  blocks: StackBlock[],
  collapsed: Set<number>
): Set<number> {
  const out = new Set<number>();
  for (const block of blocks) {
    if (!collapsed.has(block.headerIndex)) continue;
    for (let i = block.startIndex; i <= block.endIndex; i++) {
      if (i !== block.headerIndex) out.add(i);
    }
  }
  return out;
}

/**
 * Walk all blocks (including nested) and return the **outer** block headers.
 * These are the only header indices that "Collapse all" should set.
 */
export function outerBlockHeaders(blocks: StackBlock[]): number[] {
  return blocks.map((b) => b.headerIndex);
}

/**
 * Lookup table: original entry index → the outer block that contains it,
 * if any. Used by LogRow to decide whether to render the "expand" affordance.
 */
export function indexBlockMap(blocks: StackBlock[]): Map<number, StackBlock> {
  const m = new Map<number, StackBlock>();
  for (const b of blocks) m.set(b.headerIndex, b);
  return m;
}

/** Count total frames in a block tree (including nested Caused by). */
export function totalFrames(block: StackBlock): number {
  let n = block.frameIndices.length;
  for (const cb of block.causedByBlocks) n += totalFrames(cb);
  return n;
}
