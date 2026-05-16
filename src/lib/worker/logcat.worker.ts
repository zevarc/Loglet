/**
 * Logcat Web Worker entry.
 *
 * Exposes the parser, filter, and search as RPC endpoints via comlink.
 * Wired up on Day 5 per ROADMAP.
 */

import * as Comlink from "comlink";
import { parse } from "../parser";
import { applyFilter } from "../filter";
import type { FilterState, ParseResult } from "../types";

export const api = {
  parse(text: string): ParseResult {
    return parse(text);
  },

  filter(result: ParseResult, state: FilterState): Uint32Array {
    return applyFilter(result, state);
  },
};

export type LogcatWorkerAPI = typeof api;

Comlink.expose(api);
