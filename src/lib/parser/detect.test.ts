import { describe, expect, it } from "vitest";
import { detectFormat } from "./detect";

describe("detectFormat", () => {
  it('returns "raw" for empty input', () => {
    expect(detectFormat("")).toBe("raw");
  });

  it("detects threadtime format", () => {
    const sample = [
      "05-15 12:34:56.789  1234  5678 E ActivityManager: Force finishing activity",
      "05-15 12:34:56.790  1234  5678 W Choreographer: Skipped 30 frames",
      "05-15 12:34:56.791  1234  5678 I ActivityManager: ok",
    ].join("\n");
    expect(detectFormat(sample)).toBe("threadtime");
  });

  it("detects time format", () => {
    const sample = [
      "05-15 12:34:56.789 E/ActivityManager(1234): Force finishing activity",
      "05-15 12:34:56.790 W/Choreographer(1234): Skipped frames",
    ].join("\n");
    expect(detectFormat(sample)).toBe("time");
  });

  it("detects brief format", () => {
    const sample = [
      "E/ActivityManager(1234): Force finishing activity",
      "W/Choreographer(1234): Skipped frames",
    ].join("\n");
    expect(detectFormat(sample)).toBe("brief");
  });

  it("detects tag format", () => {
    const sample = [
      "E/ActivityManager: Force finishing",
      "W/Choreographer: Skipped",
    ].join("\n");
    expect(detectFormat(sample)).toBe("tag");
  });

  it("detects long format header", () => {
    const sample = [
      "[ 05-15 12:34:56.789  1234: 5678 E/ActivityManager ]",
      "Force finishing activity",
      "",
    ].join("\n");
    expect(detectFormat(sample)).toBe("long");
  });

  it("ignores divider lines when sampling", () => {
    const sample = [
      "--------- beginning of crash",
      "--------- beginning of main",
      "05-15 12:34:56.789  1234  5678 E ActivityManager: msg",
    ].join("\n");
    expect(detectFormat(sample)).toBe("threadtime");
  });

  it('returns "raw" when below detection threshold', () => {
    const sample = [
      "Some random text",
      "another random line",
      "not a logcat at all",
      "just prose here",
      "no level no tag",
    ].join("\n");
    expect(detectFormat(sample)).toBe("raw");
  });

  it("handles CRLF line endings (regression — pickSampleLines must strip \\r)", () => {
    const sample = [
      "05-15 12:34:56.789  1234  5678 E ActivityManager: msg",
      "05-15 12:34:56.790  1234  5678 W Choreographer: skipped",
      "05-15 12:34:56.791  1234  5678 I App: ok",
    ].join("\r\n");
    expect(detectFormat(sample)).toBe("threadtime");
  });

  it("detects Android Studio Logcat V2 format", () => {
    const sample = [
      "2024-05-15 12:01:23.456  1234-1234 ActivityManager  com.example.app   I  msg",
      "2024-05-15 12:01:23.512  1234-1234 AppLifecycle     com.example.app   D  onCreate",
    ].join("\n");
    expect(detectFormat(sample)).toBe("studio");
  });

  it("studio takes priority over threadtime when both could match", () => {
    // The 4-digit year is a sure-fire studio marker.
    const sample =
      "2024-05-15 12:01:23.456  1234-1234 Tag  com.example.app   I  msg";
    expect(detectFormat(sample)).toBe("studio");
  });
});
