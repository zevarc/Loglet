<script lang="ts">
  import InputPanel from '$lib/components/InputPanel.svelte';
  import VirtualLogList from '$lib/components/VirtualLogList.svelte';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import CrashBanner from '$lib/components/CrashBanner.svelte';
  import DetailPanel from '$lib/components/DetailPanel.svelte';
  import HelpModal from '$lib/components/HelpModal.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { logStore } from '$lib/state/log.svelte';
  import { filterStore } from '$lib/state/filter.svelte';
  import { uiStore } from '$lib/state/ui.svelte';
  import { applyFilter, type FilterCriteria } from '$lib/filter';
  import { compileSearchRegex } from '$lib/utils/highlight';
  import { hiddenByCollapse, indexBlockMap } from '$lib/utils/stackFold';
  import RotateCcw from '$lib/icons/RotateCcw.svelte';
  import Help from '$lib/icons/Help.svelte';

  // ─── Derived view state ───────────────────────────────────────────────
  const blockHeaders = $derived(
    logStore.result ? indexBlockMap(logStore.result.stackBlocks) : new Map()
  );

  const hiddenIndices = $derived(
    logStore.result
      ? hiddenByCollapse(logStore.result.stackBlocks, uiStore.collapsedBlocks)
      : new Set<number>()
  );

  const criteria = $derived<FilterCriteria>({
    levels: filterStore.levels,
    tags: filterStore.tags,
    pids: filterStore.pids,
    hiddenNoiseTags: filterStore.hiddenNoiseTags,
    hiddenIndices,
    query: filterStore.query,
    regex: filterStore.regex,
    caseSensitive: filterStore.caseSensitive
  });

  const visibleIndices = $derived(
    logStore.result ? applyFilter(logStore.result.entries, criteria) : new Uint32Array()
  );

  const searchRegex = $derived(
    compileSearchRegex(filterStore.query, {
      regex: filterStore.regex,
      caseSensitive: filterStore.caseSensitive
    })
  );

  // ─── Keyboard navigation ──────────────────────────────────────────────
  let pendingG = $state(false);
  let pendingGTimer: ReturnType<typeof setTimeout> | null = null;

  function findVisiblePos(target: number): number {
    let lo = 0;
    let hi = visibleIndices.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (visibleIndices[mid]! < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo < visibleIndices.length && visibleIndices[lo] === target) return lo;
    return -1;
  }

  function moveBy(delta: number) {
    if (visibleIndices.length === 0) return;
    const cur = uiStore.selectedIndex !== null ? findVisiblePos(uiStore.selectedIndex) : -1;
    const next =
      cur === -1
        ? delta > 0
          ? 0
          : visibleIndices.length - 1
        : Math.max(0, Math.min(visibleIndices.length - 1, cur + delta));
    uiStore.scrollTo(visibleIndices[next]!);
  }

  function moveToEnd(end: 'top' | 'bottom') {
    if (visibleIndices.length === 0) return;
    const idx = end === 'top' ? visibleIndices[0]! : visibleIndices[visibleIndices.length - 1]!;
    uiStore.scrollTo(idx);
  }

  function clearPendingG() {
    pendingG = false;
    if (pendingGTimer) {
      clearTimeout(pendingGTimer);
      pendingGTimer = null;
    }
  }

  function onGlobalKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    const editable = tag === 'INPUT' || tag === 'TEXTAREA';

    // Esc has special priority — works even when inside a search input is
    // delegated to the SearchBar component (it preventDefaults there).
    if (e.key === 'Escape' && !editable) {
      if (uiStore.showHelp) {
        uiStore.showHelp = false;
        e.preventDefault();
      } else if (uiStore.selectedIndex !== null) {
        uiStore.selectedIndex = null;
        e.preventDefault();
      }
      clearPendingG();
      return;
    }
    if (editable) return;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        moveBy(1);
        clearPendingG();
        return;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        moveBy(-1);
        clearPendingG();
        return;
      case 'g':
        if (e.shiftKey) {
          e.preventDefault();
          moveToEnd('bottom');
          clearPendingG();
        } else {
          e.preventDefault();
          if (pendingG) {
            moveToEnd('top');
            clearPendingG();
          } else {
            pendingG = true;
            pendingGTimer = setTimeout(clearPendingG, 600);
          }
        }
        return;
      case 'G':
        e.preventDefault();
        moveToEnd('bottom');
        clearPendingG();
        return;
      case '?':
        e.preventDefault();
        uiStore.showHelp = !uiStore.showHelp;
        clearPendingG();
        return;
      default:
        clearPendingG();
    }
  }

  // Only listen while a log is loaded — keeps the empty-state page clean.
  $effect(() => {
    if (!logStore.result) return;
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  });

  function reset() {
    logStore.reset();
    filterStore.reset();
  }
</script>

{#if !logStore.result}
  <InputPanel />
{:else}
  {@const result = logStore.result}
  {@const d = result.meta.levelDistribution}
  <div class="flex h-screen flex-col">
    <header
      class="border-border bg-bg-2 flex h-12 shrink-0 items-center gap-4 border-b px-4">
      <div class="flex items-center gap-3">
        <span class="font-mono text-lg font-semibold">Loglet</span>
        <span class="text-text-3 font-mono text-[11px] uppercase">{result.format}</span>
      </div>

      <div class="text-text-2 ml-2 flex items-center gap-4 font-mono text-xs">
        <span>
          <span class="text-text-1 font-medium">{visibleIndices.length.toLocaleString()}</span>
          / {result.entries.length.toLocaleString()} lines
        </span>
        {#if d.F > 0}<span class="text-log-f">{d.F} fatal</span>{/if}
        {#if d.E > 0}<span class="text-log-e">{d.E} error{d.E === 1 ? '' : 's'}</span>{/if}
        {#if d.W > 0}<span class="text-log-w">{d.W} warning{d.W === 1 ? '' : 's'}</span>{/if}
        {#if result.stackBlocks.length > 0}
          <span class="text-text-1">
            {result.stackBlocks.length} stack{result.stackBlocks.length === 1 ? '' : 's'}
          </span>
        {/if}
      </div>

      <div class="ml-auto flex items-center gap-2">
        <div class="w-72">
          <SearchBar />
        </div>
        <button
          type="button"
          onclick={() => (uiStore.showHelp = true)}
          class="border-border hover:bg-bg-3 inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts">
          <Help class="size-3.5" aria-hidden="true" />
        </button>
        <ThemeToggle />
        <button
          type="button"
          onclick={reset}
          class="border-border hover:bg-bg-3 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition-colors">
          <RotateCcw class="size-3.5" aria-hidden="true" />
          Load another
        </button>
      </div>
    </header>

    {#if result.format === 'raw' && result.entries.length > 0}
      <div
        role="alert"
        class="border-log-w/40 bg-log-w/10 text-text-1 flex items-center gap-3 border-b px-4 py-2 text-[12px]">
        <span class="text-log-w text-base">⚠</span>
        <div class="flex-1">
          <span class="font-medium">Couldn't recognize this format</span>
          <span class="text-text-2 ml-2">
            showing as plain text · supported: <span class="font-mono">threadtime · time · brief · long · tag · Android Studio</span>
          </span>
        </div>
      </div>
    {/if}

    <CrashBanner stackBlocks={result.stackBlocks} />

    <div class="flex min-h-0 flex-1">
      <div class="w-64 shrink-0">
        <FilterPanel {result} />
      </div>
      <main class="min-w-0 flex-1">
        <VirtualLogList
          entries={result.entries}
          {visibleIndices}
          {searchRegex}
          {blockHeaders} />
      </main>
      {#if uiStore.showDetailPanel}
        <div class="w-80 shrink-0 xl:w-96">
          <DetailPanel {result} />
        </div>
      {/if}
    </div>
  </div>
{/if}

<HelpModal />
