<script lang="ts">
  import type { LogEntry, StackBlock } from '$lib/types';
  import { uiStore } from '$lib/state/ui.svelte';
  import { untrack } from 'svelte';
  import LogRow from './LogRow.svelte';

  interface Props {
    entries: LogEntry[];
    /** Indices into `entries[]` that are currently visible after filtering. */
    visibleIndices: Uint32Array;
    /** Optional search regex for in-row match highlighting. */
    searchRegex?: RegExp | null;
    /**
     * Map: entry index → StackBlock when that entry is the visible header of
     * a stack block. Used to render fold/expand affordances.
     */
    blockHeaders?: Map<number, StackBlock>;
  }

  let {
    entries,
    visibleIndices,
    searchRegex = null,
    blockHeaders = new Map()
  }: Props = $props();

  const ROW_HEIGHT = 22;
  const OVERSCAN = 10;

  let scrollEl: HTMLDivElement | null = $state(null);
  let scrollTop = $state(0);
  let viewportHeight = $state(0);

  function onScroll(event: Event) {
    scrollTop = (event.currentTarget as HTMLDivElement).scrollTop;
  }

  const totalHeight = $derived(visibleIndices.length * ROW_HEIGHT);

  const startIdx = $derived(Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN));
  const endIdx = $derived(
    Math.min(
      visibleIndices.length,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
    )
  );

  const slice = $derived.by(() => {
    const arr: {
      entry: LogEntry;
      top: number;
      key: number;
      block: StackBlock | null;
    }[] = [];
    for (let i = startIdx; i < endIdx; i++) {
      const idx = visibleIndices[i]!;
      const e = entries[idx];
      if (!e) continue;
      arr.push({
        entry: e,
        top: i * ROW_HEIGHT,
        key: idx,
        block: blockHeaders.get(idx) ?? null
      });
    }
    return arr;
  });

  function handleRowClick(entry: LogEntry) {
    uiStore.selectedIndex = entry.index;
  }

  function handleToggleCollapse(block: StackBlock) {
    uiStore.toggleBlock(block.headerIndex);
  }

  /** Binary search: find position of `entryIndex` in (sorted) visibleIndices, or -1. */
  function findVisiblePosition(arr: Uint32Array, entryIndex: number): number {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid]! < entryIndex) lo = mid + 1;
      else hi = mid;
    }
    if (lo < arr.length && arr[lo] === entryIndex) return lo;
    return -1;
  }

  // Imperative scroll on uiStore.scrollTarget changes.
  // Track *only* the target; everything else is read via untrack so unrelated
  // re-renders don't move the scroll position.
  //
  // "Minimal reveal" semantics: if the target row is already visible we don't
  // scroll at all. Only on out-of-view do we align to the nearer edge. Avoids
  // jarring re-centering during j/k navigation.
  $effect(() => {
    const target = uiStore.scrollTarget;
    if (!target) return;
    untrack(() => {
      if (!scrollEl) return;
      const pos = findVisiblePosition(visibleIndices, target.index);
      if (pos === -1) return;

      const rowTop = pos * ROW_HEIGHT;
      const rowBottom = rowTop + ROW_HEIGHT;
      const viewTop = scrollEl.scrollTop;
      const viewBottom = viewTop + viewportHeight;

      // Leave a small breathing margin so the target isn't flush against
      // the viewport edge.
      const MARGIN = ROW_HEIGHT * 2;
      if (rowTop < viewTop + MARGIN) {
        scrollEl.scrollTop = Math.max(0, rowTop - MARGIN);
      } else if (rowBottom > viewBottom - MARGIN) {
        scrollEl.scrollTop = rowBottom - viewportHeight + MARGIN;
      }

      uiStore.selectedIndex = target.index;
    });
  });
</script>

<div
  bind:this={scrollEl}
  bind:clientHeight={viewportHeight}
  onscroll={onScroll}
  class="scrollbar-thin bg-bg-1 relative h-full overflow-y-auto"
  role="rowgroup">
  {#if visibleIndices.length === 0}
    <div class="text-text-3 absolute inset-0 flex items-center justify-center text-sm">
      No matching rows. Try clearing some filters.
    </div>
  {:else}
    <div style="height: {totalHeight}px; position: relative;">
      {#each slice as item (item.key)}
        <div
          style="position: absolute; top: {item.top}px; left: 0; right: 0; height: {ROW_HEIGHT}px;">
          <LogRow
            entry={item.entry}
            selected={uiStore.selectedIndex === item.entry.index}
            {searchRegex}
            stackBlock={item.block}
            isCollapsed={item.block
              ? uiStore.collapsedBlocks.has(item.block.headerIndex)
              : false}
            onclick={handleRowClick}
            onToggleCollapse={handleToggleCollapse} />
        </div>
      {/each}
    </div>
  {/if}
</div>
