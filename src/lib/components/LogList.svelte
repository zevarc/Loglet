<script lang="ts">
  import type { LogEntry, ParseResult } from '$lib/types';
  import { uiStore } from '$lib/state/ui.svelte';
  import LogRow from './LogRow.svelte';

  interface Props {
    result: ParseResult;
  }

  let { result }: Props = $props();

  // TODO(Day 7): swap this naive render for @tanstack/svelte-virtual.
  // For now we cap the visible count so a 100k-line paste doesn't tank the
  // browser before virtual scrolling lands.
  const RENDER_CAP = 5_000;

  const visibleEntries = $derived(
    result.entries.length > RENDER_CAP ? result.entries.slice(0, RENDER_CAP) : result.entries
  );

  const overflowCount = $derived(Math.max(0, result.entries.length - RENDER_CAP));

  function handleRowClick(entry: LogEntry) {
    uiStore.selectedIndex = entry.index;
  }
</script>

<div class="bg-bg-1 flex h-full flex-col overflow-hidden">
  <div class="scrollbar-thin flex-1 overflow-y-auto" role="rowgroup">
    {#each visibleEntries as entry (entry.index)}
      <LogRow
        {entry}
        selected={uiStore.selectedIndex === entry.index}
        onclick={handleRowClick} />
    {/each}

    {#if overflowCount > 0}
      <div
        class="text-text-3 border-border bg-bg-2 border-t px-3 py-2 text-center font-mono text-xs">
        +{overflowCount.toLocaleString()} more rows — virtual scrolling lands on Day 7
      </div>
    {/if}
  </div>
</div>
