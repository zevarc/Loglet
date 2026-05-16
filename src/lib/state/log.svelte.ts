/**
 * Global log state — Svelte 5 runes.
 *
 * Mutations the UI triggers:
 *   - loadFromText(text)  ← paste, drop, share-link, example
 *   - reset()              ← back to empty state
 *
 * Parsing is delegated to the Web Worker (src/lib/worker/logcat.worker.ts)
 * so the main thread stays responsive even on 10⁵+ lines.
 */

import type { ParseResult } from "../types";
import { getWorkerAPI } from "../worker/client";
import { uiStore } from "./ui.svelte";

class LogStore {
  rawText = $state("");
  result = $state<ParseResult | null>(null);
  isParsing = $state(false);
  parseError = $state<string | null>(null);

  /** True when a log is loaded and visible. Used to swap empty / list view. */
  get hasResult(): boolean {
    return this.result !== null;
  }

  async loadFromText(text: string): Promise<void> {
    if (!text || !text.trim()) return;
    this.rawText = text;
    this.isParsing = true;
    this.parseError = null;

    try {
      const api = getWorkerAPI();
      const result = await api.parse(text);
      this.result = result;
      // Fold every stack block on initial load (PRD F6.2).
      uiStore.collapseAll(result.stackBlocks);
    } catch (err) {
      this.parseError = err instanceof Error ? err.message : String(err);
      this.result = null;
    } finally {
      this.isParsing = false;
    }
  }

  reset(): void {
    this.rawText = "";
    this.result = null;
    this.parseError = null;
    this.isParsing = false;
    uiStore.reset();
  }
}

export const logStore = new LogStore();
