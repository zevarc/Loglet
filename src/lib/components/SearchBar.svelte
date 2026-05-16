<script lang="ts">
  import { filterStore } from '$lib/state/filter.svelte';

  let inputEl: HTMLInputElement | null = $state(null);
  let local = $state(filterStore.query);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function onInput(event: Event) {
    const v = (event.currentTarget as HTMLInputElement).value;
    local = v;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterStore.query = v;
    }, 80);
  }

  function clearQuery() {
    local = '';
    filterStore.query = '';
    inputEl?.focus();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      clearQuery();
    }
  }

  // Global "/" shortcut to focus search.
  $effect(() => {
    function onWindowKey(e: KeyboardEvent) {
      if (e.key !== '/') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      inputEl?.focus();
      inputEl?.select();
    }
    window.addEventListener('keydown', onWindowKey);
    return () => window.removeEventListener('keydown', onWindowKey);
  });

  function toggleCase() {
    filterStore.caseSensitive = !filterStore.caseSensitive;
  }
  function toggleRegex() {
    filterStore.regex = !filterStore.regex;
  }
</script>

<div class="border-border bg-bg-1 flex items-center gap-2 rounded-md border px-2 py-1">
  <span class="text-text-3 select-none text-sm">⌕</span>
  <input
    bind:this={inputEl}
    type="text"
    value={local}
    oninput={onInput}
    onkeydown={onKeydown}
    placeholder="Search…  (/)"
    spellcheck="false"
    autocomplete="off"
    class="text-text-0 placeholder:text-text-3 min-w-0 flex-1 bg-transparent text-[13px] outline-none" />

  <button
    type="button"
    onclick={toggleCase}
    aria-pressed={filterStore.caseSensitive}
    title="Match case"
    class="toggle"
    class:active={filterStore.caseSensitive}>Aa</button>

  <button
    type="button"
    onclick={toggleRegex}
    aria-pressed={filterStore.regex}
    title="Regular expression"
    class="toggle"
    class:active={filterStore.regex}>.*</button>

  {#if local}
    <button
      type="button"
      onclick={clearQuery}
      title="Clear (Esc)"
      class="text-text-3 hover:text-text-1 text-xs">✕</button>
  {/if}
</div>

<style>
  .toggle {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1;
    padding: 3px 5px;
    border-radius: 3px;
    color: var(--text-3);
    transition: color 100ms, background 100ms;
  }
  .toggle:hover {
    color: var(--text-1);
    background: var(--bg-3);
  }
  .toggle.active {
    color: var(--bg-1);
    background: var(--brand);
  }
</style>
