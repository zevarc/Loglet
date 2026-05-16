<script lang="ts">
  import type { StackBlock } from '$lib/types';
  import { uiStore } from '$lib/state/ui.svelte';

  interface Props {
    stackBlocks: StackBlock[];
  }

  let { stackBlocks }: Props = $props();

  const count = $derived(stackBlocks.length);
  const first = $derived(stackBlocks[0] ?? null);

  function jumpToFirst() {
    if (!first) return;
    // Ensure the block is expanded enough to read context.
    if (uiStore.collapsedBlocks.has(first.headerIndex)) {
      // Keep folded — scrolling to a folded header is still useful.
    }
    uiStore.scrollTo(first.headerIndex);
  }
</script>

{#if count > 0 && first}
  <div
    role="alert"
    class="border-log-e/40 bg-log-e/10 text-text-1 flex items-center gap-3 border-b px-4 py-2 text-[13px]">
    <span class="text-log-e text-base">⚠</span>
    <div class="flex-1">
      <span class="font-medium">
        Detected {count} crash{count === 1 ? '' : 'es'}
      </span>
      <span class="text-text-2 ml-2 text-xs">
        first: <span class="font-mono">{first.exception}</span>
      </span>
    </div>
    <button
      type="button"
      onclick={jumpToFirst}
      class="border-border hover:bg-bg-3 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors">
      Jump to first
    </button>
  </div>
{/if}
