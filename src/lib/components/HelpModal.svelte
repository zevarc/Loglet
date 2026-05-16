<script lang="ts">
  import { uiStore } from '$lib/state/ui.svelte';

  const SHORTCUTS: { keys: string[]; label: string }[] = [
    { keys: ['/'], label: 'Focus the search box' },
    { keys: ['Esc'], label: 'Clear search · close details · close this help' },
    { keys: ['j', '↓'], label: 'Next row' },
    { keys: ['k', '↑'], label: 'Previous row' },
    { keys: ['g', 'g'], label: 'Jump to top' },
    { keys: ['G'], label: 'Jump to bottom' },
    { keys: ['Enter'], label: 'Open selected row in detail panel' },
    { keys: ['?'], label: 'Toggle this help' }
  ];

  function close() {
    uiStore.showHelp = false;
  }

  function onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) close();
  }
</script>

{#if uiStore.showHelp}
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Keyboard shortcuts"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onclick={onBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && close()}
    tabindex="-1">
    <div
      class="bg-bg-2 border-border w-full max-w-md rounded-lg border p-5 shadow-2xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-text-0 text-base font-semibold">Keyboard shortcuts</h2>
        <button
          type="button"
          onclick={close}
          class="text-text-3 hover:text-text-1 text-sm"
          aria-label="Close">✕</button>
      </div>

      <dl class="space-y-2">
        {#each SHORTCUTS as row, i (i)}
          <div class="flex items-center justify-between gap-4">
            <dt class="text-text-2 text-[13px]">{row.label}</dt>
            <dd class="flex shrink-0 items-center gap-1">
              {#each row.keys as k, j (j)}
                {#if j > 0}<span class="text-text-3 text-[11px]">then</span>{/if}
                <kbd>{k}</kbd>
              {/each}
            </dd>
          </div>
        {/each}
      </dl>

      <p class="text-text-3 mt-5 text-[11px]">
        Loglet runs entirely in your browser. Logs never leave this tab.
      </p>
    </div>
  </div>
{/if}

<style>
  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    background: var(--bg-3);
    border: 1px solid var(--border-strong);
    border-radius: 4px;
    color: var(--text-1);
    min-width: 22px;
    text-align: center;
  }
</style>
