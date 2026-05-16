/**
 * Filter & search state — Svelte 5 runes.
 */

import type { LogLevel } from "../types";

class FilterStore {
  levels = $state<Set<LogLevel>>(new Set(["V", "D", "I", "W", "E", "F"]));
  tags = $state<Set<string>>(new Set());
  pids = $state<Set<number>>(new Set());
  hiddenNoiseTags = $state<Set<string>>(new Set());

  query = $state("");
  regex = $state(false);
  caseSensitive = $state(false);

  reset() {
    this.levels = new Set(["V", "D", "I", "W", "E", "F"]);
    this.tags = new Set();
    this.pids = new Set();
    this.hiddenNoiseTags = new Set();
    this.query = "";
    this.regex = false;
    this.caseSensitive = false;
  }
}

export const filterStore = new FilterStore();
