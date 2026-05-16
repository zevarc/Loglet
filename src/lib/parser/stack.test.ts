import { describe, expect, it } from "vitest";
import type { LogEntry } from "../types";
import { detectStackBlocks } from "./stack";

/** Build a fake threadtime-parsed entry for tests. */
function entry(message: string, index = 0): LogEntry {
  return {
    index,
    raw: message,
    level: "E",
    tag: "AndroidRuntime",
    pid: 1234,
    tid: 1234,
    message,
  };
}

function entries(...msgs: string[]): LogEntry[] {
  return msgs.map((m, i) => entry(m, i));
}

describe("detectStackBlocks", () => {
  it("returns empty for input without exceptions", () => {
    const e = entries("hello", "world");
    expect(detectStackBlocks(e)).toEqual([]);
  });

  it("detects a simple exception block", () => {
    const e = entries(
      "java.lang.NullPointerException: oops",
      "\tat com.example.Foo.bar(Foo.java:10)",
      "\tat com.example.Foo.baz(Foo.java:20)",
    );
    const blocks = detectStackBlocks(e);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.exception).toBe("java.lang.NullPointerException");
    expect(blocks[0]!.frameIndices).toEqual([1, 2]);
  });

  it("detects FATAL EXCEPTION preamble + Process line + exception", () => {
    const e = entries(
      "FATAL EXCEPTION: main",
      "Process: com.example.app, PID: 1234",
      "java.lang.NullPointerException: oops",
      "\tat com.example.Foo.bar(Foo.java:10)",
    );
    const blocks = detectStackBlocks(e);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.exception).toMatch(/NullPointerException/);
    expect(blocks[0]!.frameIndices).toEqual([3]);
  });

  it("captures nested Caused by chain", () => {
    const e = entries(
      "java.lang.RuntimeException: outer",
      "\tat com.example.A.x(A.java:1)",
      "Caused by: java.lang.IllegalStateException: inner",
      "\tat com.example.B.y(B.java:2)",
      "\t... 3 more",
    );
    const blocks = detectStackBlocks(e);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.causedByBlocks.length).toBe(1);
    expect(blocks[0]!.causedByBlocks[0]!.exception).toMatch(
      /IllegalStateException/,
    );
    expect(blocks[0]!.causedByBlocks[0]!.frameIndices).toEqual([3, 4]);
  });

  it("handles two independent exception blocks", () => {
    const e = entries(
      "java.lang.NullPointerException: one",
      "\tat A.x(A.java:1)",
      "unrelated log line",
      "java.lang.IllegalArgumentException: two",
      "\tat B.y(B.java:2)",
    );
    const blocks = detectStackBlocks(e);
    expect(blocks.length).toBe(2);
    expect(blocks[0]!.exception).toMatch(/NullPointer/);
    expect(blocks[1]!.exception).toMatch(/IllegalArgument/);
  });

  it('handles "... N more" tail-only line', () => {
    const e = entries("java.lang.RuntimeException: short", "\t... 5 more");
    const blocks = detectStackBlocks(e);
    expect(blocks[0]!.frameIndices).toEqual([1]);
  });

  it("captures start/end range covering the whole block", () => {
    const e = entries(
      "FATAL EXCEPTION: main",
      "Process: com.example.app, PID: 1234",
      "java.lang.NullPointerException: oops",
      "\tat A.x(A.java:1)",
      "\tat A.y(A.java:2)",
      "unrelated trailing line",
    );
    const blocks = detectStackBlocks(e);
    expect(blocks.length).toBe(1);
    const b = blocks[0]!;
    expect(b.startIndex).toBe(0); // FATAL EXCEPTION
    expect(b.endIndex).toBe(4); // last frame
  });

  it("nested Caused by carries its own start/end", () => {
    const e = entries(
      "java.lang.RuntimeException: outer",
      "\tat A.x(A.java:1)",
      "Caused by: java.lang.IllegalStateException: inner",
      "\tat B.y(B.java:2)",
    );
    const blocks = detectStackBlocks(e);
    expect(blocks[0]!.startIndex).toBe(0);
    expect(blocks[0]!.endIndex).toBe(3);
    const sub = blocks[0]!.causedByBlocks[0]!;
    expect(sub.startIndex).toBe(2);
    expect(sub.endIndex).toBe(3);
  });
});
