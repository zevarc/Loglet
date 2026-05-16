import { describe, expect, it } from "vitest";
import type { StackBlock } from "../types";
import {
  hiddenByCollapse,
  indexBlockMap,
  outerBlockHeaders,
  totalFrames,
} from "./stackFold";

function block(opts: Partial<StackBlock>): StackBlock {
  return {
    headerIndex: 0,
    startIndex: 0,
    endIndex: 0,
    frameIndices: [],
    causedByBlocks: [],
    exception: "X",
    ...opts,
  };
}

describe("hiddenByCollapse", () => {
  it("returns empty set when nothing is collapsed", () => {
    const b = block({ headerIndex: 2, startIndex: 0, endIndex: 5 });
    expect(hiddenByCollapse([b], new Set()).size).toBe(0);
  });

  it("hides every index in [start..end] except the header", () => {
    const b = block({ headerIndex: 2, startIndex: 0, endIndex: 5 });
    const hidden = hiddenByCollapse([b], new Set([2]));
    expect(Array.from(hidden).sort((a, b) => a - b)).toEqual([0, 1, 3, 4, 5]);
  });

  it("handles multiple blocks independently", () => {
    const b1 = block({ headerIndex: 1, startIndex: 0, endIndex: 2 });
    const b2 = block({ headerIndex: 10, startIndex: 10, endIndex: 12 });
    const hidden = hiddenByCollapse([b1, b2], new Set([10]));
    // b1 not collapsed → entries 0..2 visible
    // b2 collapsed → 11, 12 hidden (header 10 stays)
    expect(hidden.has(0)).toBe(false);
    expect(hidden.has(11)).toBe(true);
    expect(hidden.has(12)).toBe(true);
    expect(hidden.has(10)).toBe(false);
  });
});

describe("outerBlockHeaders", () => {
  it("returns the headerIndex of each top-level block", () => {
    const a = block({ headerIndex: 3 });
    const b = block({ headerIndex: 17 });
    expect(outerBlockHeaders([a, b])).toEqual([3, 17]);
  });
});

describe("indexBlockMap", () => {
  it("maps each block headerIndex to its block", () => {
    const b = block({ headerIndex: 7 });
    const m = indexBlockMap([b]);
    expect(m.get(7)).toBe(b);
    expect(m.has(8)).toBe(false);
  });
});

describe("totalFrames", () => {
  it("counts frames in a single block", () => {
    const b = block({ frameIndices: [1, 2, 3] });
    expect(totalFrames(b)).toBe(3);
  });

  it("includes nested Caused by frames", () => {
    const inner = block({ frameIndices: [10, 11] });
    const outer = block({ frameIndices: [1, 2], causedByBlocks: [inner] });
    expect(totalFrames(outer)).toBe(4);
  });
});
