/**
 * UI-only state — selections, panel toggles, theme, stack-block folding.
 */

import type { StackBlock } from "../types";
import { outerBlockHeaders } from "../utils/stackFold";

type Theme = "light" | "dark" | "system";

class UIStore {
  selectedIndex = $state<number | null>(null);
  showFilterPanel = $state(true);
  showDetailPanel = $state(true);
  showHelp = $state(false);
  theme = $state<Theme>("dark");

  /** Set of outer stack-block headerIndex values that are currently folded. */
  collapsedBlocks = $state<Set<number>>(new Set());

  /**
   * Bumped whenever a "scroll to this entry index" request is made. The
   * VirtualLogList watches this via $effect and scrolls accordingly.
   * Using an object (not a plain number) so the same index can be requested
   * twice in a row and still re-trigger the effect.
   */
  scrollTarget = $state<{ index: number; nonce: number } | null>(null);

  toggleBlock(headerIndex: number): void {
    const next = new Set(this.collapsedBlocks);
    if (next.has(headerIndex)) next.delete(headerIndex);
    else next.add(headerIndex);
    this.collapsedBlocks = next;
  }

  /** Set the collapsed set to the union of every outer block — i.e. "fold all". */
  collapseAll(blocks: StackBlock[]): void {
    this.collapsedBlocks = new Set(outerBlockHeaders(blocks));
  }

  expandAll(): void {
    this.collapsedBlocks = new Set();
  }

  scrollTo(index: number): void {
    const nonce = (this.scrollTarget?.nonce ?? 0) + 1;
    this.scrollTarget = { index, nonce };
  }

  reset(): void {
    this.selectedIndex = null;
    this.collapsedBlocks = new Set();
    this.scrollTarget = null;
    this.showHelp = false;
  }
}

export const uiStore = new UIStore();
