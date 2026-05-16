<script lang="ts">
  import type { LogEntry, ParseResult, StackBlock } from '$lib/types';
  import { uiStore } from '$lib/state/ui.svelte';
  import { levelName } from '$lib/utils/color';
  import { formatLogcatTime } from '$lib/utils/time';

  interface Props {
    result: ParseResult;
  }

  let { result }: Props = $props();

  const selected = $derived.by<LogEntry | null>(() => {
    if (uiStore.selectedIndex === null) return null;
    return result.entries[uiStore.selectedIndex] ?? null;
  });

  /** Stack block whose header is the currently-selected row (if any). */
  const selectedBlock = $derived.by<StackBlock | null>(() => {
    if (!selected) return null;
    for (const b of result.stackBlocks) {
      if (b.headerIndex === selected.index) return b;
    }
    return null;
  });

  function close() {
    uiStore.selectedIndex = null;
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Best effort — older browsers / non-secure contexts may not allow.
    }
  }

  function frameText(entries: LogEntry[], idx: number): string {
    const e = entries[idx];
    return e ? e.message : '';
  }
</script>

<aside
  class="bg-bg-2 border-border scrollbar-thin flex h-full flex-col overflow-y-auto border-l text-[13px]">
  {#if !selected}
    <div class="text-text-3 flex h-full items-center justify-center p-6 text-center text-sm">
      Select a row to see full details, stack traces, and copy actions.
    </div>
  {:else}
    <header
      class="border-border bg-bg-2 sticky top-0 flex items-center justify-between border-b px-4 py-2">
      <div class="flex items-center gap-2">
        <span class="text-text-3 font-mono text-[11px]">Entry #{selected.index}</span>
        <span
          class="font-mono text-[11px] font-semibold"
          style="color: var(--log-{selected.level.toLowerCase()})">
          {levelName(selected.level)}
        </span>
      </div>
      <button
        type="button"
        class="text-text-3 hover:text-text-1 text-sm"
        onclick={close}
        aria-label="Close details">✕</button>
    </header>

    <div class="space-y-4 p-4">
      <!-- Field grid -->
      <dl class="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 text-[12px]">
        <dt class="text-text-3">Time</dt>
        <dd class="text-text-1 font-mono">
          {selected.timestamp !== undefined ? formatLogcatTime(selected.timestamp) : '—'}
        </dd>
        <dt class="text-text-3">Tag</dt>
        <dd class="text-text-1 font-mono break-all">{selected.tag || '—'}</dd>
        {#if selected.packageName}
          <dt class="text-text-3">Package</dt>
          <dd class="text-text-1 font-mono break-all">{selected.packageName}</dd>
        {/if}
        <dt class="text-text-3">PID</dt>
        <dd class="text-text-1 font-mono">{selected.pid ?? '—'}</dd>
        <dt class="text-text-3">TID</dt>
        <dd class="text-text-1 font-mono">{selected.tid ?? '—'}</dd>
      </dl>

      <!-- Message -->
      <div>
        <div class="text-text-3 mb-1 flex items-center justify-between text-[11px] uppercase">
          <span>Message</span>
          <button
            type="button"
            class="hover:text-text-1 lowercase transition-colors"
            onclick={() => copy(selected.message)}>copy</button>
        </div>
        <pre
          class="bg-bg-1 border-border text-text-1 max-h-[40vh] overflow-auto rounded border p-2 font-mono text-[12px] whitespace-pre-wrap break-all">{selected.message}</pre>
      </div>

      <!-- Raw line -->
      <div>
        <div class="text-text-3 mb-1 flex items-center justify-between text-[11px] uppercase">
          <span>Raw</span>
          <button
            type="button"
            class="hover:text-text-1 lowercase transition-colors"
            onclick={() => copy(selected.raw)}>copy</button>
        </div>
        <pre
          class="bg-bg-1 border-border text-text-3 max-h-[20vh] overflow-auto rounded border p-2 font-mono text-[11px] whitespace-pre-wrap break-all">{selected.raw}</pre>
      </div>

      <!-- Stack tree (if applicable) -->
      {#if selectedBlock}
        {@const block = selectedBlock}
        <div>
          <div class="text-text-3 mb-1 text-[11px] uppercase">Stack trace</div>
          <div
            class="bg-bg-1 border-border space-y-1 rounded border p-3 font-mono text-[11.5px]">
            <div class="text-log-e font-semibold">
              {block.exception}
            </div>
            {#each block.frameIndices as fi (fi)}
              <div class="text-text-2 pl-3">{frameText(result.entries, fi).trim()}</div>
            {/each}

            {#each block.causedByBlocks as cb (cb.headerIndex)}
              <div class="text-text-3 mt-2 pl-1">↳ Caused by:</div>
              <div class="text-log-w pl-3 font-semibold">{cb.exception}</div>
              {#each cb.frameIndices as fi (fi)}
                <div class="text-text-2 pl-6">{frameText(result.entries, fi).trim()}</div>
              {/each}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</aside>
