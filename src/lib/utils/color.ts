/**
 * Level → CSS-variable color mapping.
 * Matches docs/UI_DESIGN.md §2.4.
 */

import type { LogLevel } from "../types";

const LEVEL_VARS: Record<LogLevel, string> = {
  V: "var(--log-v)",
  D: "var(--log-d)",
  I: "var(--log-i)",
  W: "var(--log-w)",
  E: "var(--log-e)",
  F: "var(--log-f)",
};

export function levelColor(level: LogLevel): string {
  return LEVEL_VARS[level];
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  V: "Verbose",
  D: "Debug",
  I: "Info",
  W: "Warning",
  E: "Error",
  F: "Fatal",
};

export function levelName(level: LogLevel): string {
  return LEVEL_NAMES[level];
}
