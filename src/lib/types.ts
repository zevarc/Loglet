/**
 * Core data types for Loglet.
 * See docs/ARCHITECTURE.md §4 for the spec these mirror.
 */

export type LogLevel = "V" | "D" | "I" | "W" | "E" | "F";

export type LogcatFormat =
  | "threadtime"
  | "time"
  | "brief"
  | "long"
  | "tag"
  | "studio" // Android Studio Logcat V2 copy format (Hedgehog+)
  | "raw";

/** A single parsed log entry. */
export interface LogEntry {
  /** Stable index — also the row ID for virtual list keying. */
  index: number;
  /** Original line (preserved for copy/export). */
  raw: string;
  /** Millis since epoch. Undefined for formats lacking a timestamp (brief, tag). */
  timestamp?: number;
  level: LogLevel;
  pid?: number;
  tid?: number;
  tag: string;
  /** Application package name (e.g. "com.example.app"). Only set by the
   * Android Studio Logcat format which carries it explicitly. */
  packageName?: string;
  message: string;
  /** True when this line couldn't be matched against any known format. */
  unparsed?: boolean;
}

/** Aggregate metadata derived during parsing. */
export interface ParseMeta {
  totalLines: number;
  parsedLines: number;
  parseErrorRate: number;
  /** tag → occurrence count */
  tags: Map<string, number>;
  /** pid → occurrence count */
  pids: Map<number, number>;
  /** level → count */
  levelDistribution: Record<LogLevel, number>;
  /** [firstTimestamp, lastTimestamp] in millis, when available */
  timeRange?: [number, number];
}

/** A contiguous block of stack-trace lines belonging to one exception. */
export interface StackBlock {
  /** Index of the line shown when the block is collapsed (the exception class
   * line if present, else the FATAL EXCEPTION header). */
  headerIndex: number;
  /** First entry in the block — typically the FATAL EXCEPTION line, the
   * exception class line, or (for nested) the "Caused by:" line. */
  startIndex: number;
  /** Last entry in the block, inclusive. */
  endIndex: number;
  /** Indices of `at xxx` frame lines and `... N more` lines. */
  frameIndices: number[];
  /** Nested "Caused by:" blocks. */
  causedByBlocks: StackBlock[];
  /** Fully-qualified exception class name extracted from the header. */
  exception: string;
}

/** Full result of parsing a logcat dump. */
export interface ParseResult {
  entries: LogEntry[];
  format: LogcatFormat;
  meta: ParseMeta;
  stackBlocks: StackBlock[];
}

/** State of the current filter / search criteria. */
export interface FilterState {
  levels: Set<LogLevel>;
  tags: Set<string>;
  pids: Set<number>;
  search: SearchState;
  hiddenNoiseTags: Set<string>;
}

export interface SearchState {
  query: string;
  regex: boolean;
  caseSensitive: boolean;
}
