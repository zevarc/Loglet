<script lang="ts">
  import type { LogEntry, StackBlock } from '$lib/types';
  import { splitByRegex } from '$lib/utils/highlight';
  import { totalFrames } from '$lib/utils/stackFold';

  interface Props {
    entry: LogEntry;
    selected?: boolean;
    /** Highlight matches inside `message` when set. */
    searchRegex?: RegExp | null;
    /** If this row is the visible header of a stack block, pass it here. */
    stackBlock?: StackBlock | null;
    /** Whether the associated stack block is currently folded. */
    isCollapsed?: boolean;
    onclick?: (entry: LogEntry) => void;
    onToggleCollapse?: (block: StackBlock) => void;
  }

  let {
    entry,
    selected = false,
    searchRegex = null,
    stackBlock = null,
    isCollapsed = false,
    onclick,
    onToggleCollapse
  }: Props = $props();

  const shortTime = $derived(formatShortTime(entry.timestamp));
  const isError = $derived(entry.level === 'E' || entry.level === 'F');
  const isFatal = $derived(entry.level === 'F');

  const segments = $derived.by(() => {
    if (!searchRegex || !entry.message) return [{ text: entry.message, match: false }];
    return splitByRegex(entry.message, searchRegex);
  });

  const stackSummary = $derived.by(() => {
    if (!stackBlock) return null;
    const frames = totalFrames(stackBlock);
    const caused = stackBlock.causedByBlocks.length;
    const pieces: string[] = [`${frames} frame${frames === 1 ? '' : 's'}`];
    if (caused > 0) pieces.push(`${caused} caused by`);
    return { exception: stackBlock.exception, suffix: pieces.join(', ') };
  });

  function formatShortTime(ts: number | undefined): string {
    if (ts === undefined) return '--:--:--.---';
    const d = new Date(ts);
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    return (
      pad(d.getUTCHours()) +
      ':' +
      pad(d.getUTCMinutes()) +
      ':' +
      pad(d.getUTCSeconds()) +
      '.' +
      pad(d.getUTCMilliseconds(), 3)
    );
  }

  function handleClick() {
    onclick?.(entry);
  }

  function handleToggle(event: MouseEvent) {
    event.stopPropagation();
    if (stackBlock) onToggleCollapse?.(stackBlock);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') handleClick();
  }
</script>

<div
  role="row"
  tabindex="0"
  class="log-row group flex items-baseline gap-3 pr-3 pl-3 font-mono text-[13px] leading-[22px]"
  class:selected
  class:is-error={isError}
  class:is-fatal={isFatal}
  onclick={handleClick}
  onkeydown={handleKeydown}>
  <span class="text-text-3 w-[6.5em] shrink-0 tabular-nums">{shortTime}</span>

  {#if entry.pid !== undefined}
    <span class="text-text-3 w-[5ch] shrink-0 text-right tabular-nums">{entry.pid}</span>
  {:else}
    <span class="text-text-3 w-[5ch] shrink-0 text-right">--</span>
  {/if}

  {#if entry.tid !== undefined}
    <span class="text-text-3 w-[5ch] shrink-0 text-right tabular-nums">{entry.tid}</span>
  {:else}
    <span class="text-text-3 w-[5ch] shrink-0 text-right">--</span>
  {/if}

  <span
    class="level w-[1ch] shrink-0 text-center font-semibold"
    style="color: var(--log-{entry.level.toLowerCase()})">{entry.level}</span>

  <span
    class="tag w-[20ch] shrink-0 truncate"
    style="color: var(--log-{entry.level.toLowerCase()})"
    title={entry.tag}>{entry.tag || '—'}</span>

  {#if stackBlock && stackSummary}
    <button
      type="button"
      class="chevron"
      class:expanded={!isCollapsed}
      onclick={handleToggle}
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? 'Expand stack' : 'Collapse stack'}>
      ▶
    </button>

    {#if isCollapsed}
      <span class="text-text-1 min-w-0 flex-1 truncate" title={entry.message}>
        <span class="stack-exception">{stackSummary.exception}</span>
        <span class="text-text-3 ml-2 text-[11px]">({stackSummary.suffix})</span>
      </span>
    {:else}
      <span class="text-text-1 min-w-0 flex-1 truncate" title={entry.message}>
        {#each segments as seg, i (i)}
          {#if seg.match}<mark class="hl">{seg.text}</mark>{:else}{seg.text}{/if}
        {/each}
      </span>
    {/if}
  {:else}
    <span class="text-text-1 min-w-0 flex-1 truncate" title={entry.message}>
      {#each segments as seg, i (i)}
        {#if seg.match}<mark class="hl">{seg.text}</mark>{:else}{seg.text}{/if}
      {/each}
    </span>
  {/if}
</div>

<style>
  .log-row {
    position: relative;
    cursor: pointer;
    border-left: 3px solid transparent;
  }
  .log-row:hover {
    background: var(--row-hover);
  }
  .log-row:focus-visible {
    outline: none;
    background: var(--row-hover);
  }
  .log-row.selected {
    background: var(--row-selected);
  }
  .log-row.is-error {
    background: var(--row-error-tint);
    border-left-color: var(--log-e);
  }
  .log-row.is-fatal {
    background: var(--row-fatal-tint);
    border-left-color: var(--log-f);
  }
  mark.hl {
    background: var(--highlight-bg);
    color: var(--highlight-fg);
    padding: 0 1px;
    border-radius: 2px;
  }
  .chevron {
    flex-shrink: 0;
    width: 12px;
    font-size: 8px;
    line-height: 1;
    color: var(--text-2);
    transition: transform 100ms;
    cursor: pointer;
  }
  .chevron:hover {
    color: var(--text-0);
  }
  .chevron.expanded {
    transform: rotate(90deg);
  }
  .stack-exception {
    font-weight: 600;
    color: var(--log-e);
  }
  .log-row.is-fatal .stack-exception {
    color: var(--log-f);
  }
</style>
