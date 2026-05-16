<script lang="ts">
  import type { LogLevel, ParseResult } from '$lib/types';
  import { filterStore } from '$lib/state/filter.svelte';

  interface Props {
    result: ParseResult;
  }

  let { result }: Props = $props();

  // Show all 6 levels with current counts.
  const LEVELS: { key: LogLevel; label: string }[] = [
    { key: 'V', label: 'Verbose' },
    { key: 'D', label: 'Debug' },
    { key: 'I', label: 'Info' },
    { key: 'W', label: 'Warning' },
    { key: 'E', label: 'Error' },
    { key: 'F', label: 'Fatal' }
  ];

  const TOP_N_TAGS = 30;
  const TOP_N_PIDS = 15;

  const topTags = $derived.by(() => {
    return Array.from(result.meta.tags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N_TAGS);
  });

  const topPids = $derived.by(() => {
    return Array.from(result.meta.pids.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N_PIDS);
  });

  function toggleLevel(level: LogLevel) {
    const next = new Set(filterStore.levels);
    if (next.has(level)) next.delete(level);
    else next.add(level);
    filterStore.levels = next;
  }

  function toggleTag(tag: string) {
    const next = new Set(filterStore.tags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    filterStore.tags = next;
  }

  function togglePid(pid: number) {
    const next = new Set(filterStore.pids);
    if (next.has(pid)) next.delete(pid);
    else next.add(pid);
    filterStore.pids = next;
  }

  function resetLevels() {
    filterStore.levels = new Set(['V', 'D', 'I', 'W', 'E', 'F']);
  }
  function resetTags() {
    filterStore.tags = new Set();
  }
  function resetPids() {
    filterStore.pids = new Set();
  }
</script>

<aside
  class="bg-bg-2 border-border scrollbar-thin flex h-full flex-col gap-1 overflow-y-auto border-r px-3 py-3 text-[13px]">
  <!-- Levels -->
  <section class="mb-3">
    <header class="text-text-3 mb-2 flex items-center justify-between px-1 text-[11px] uppercase">
      <span>Level</span>
      <button
        type="button"
        class="hover:text-text-1 transition-colors"
        onclick={resetLevels}
        aria-label="Reset level filter">
        reset
      </button>
    </header>
    <ul class="space-y-0.5">
      {#each LEVELS as { key, label } (key)}
        {@const count = result.meta.levelDistribution[key]}
        {@const checked = filterStore.levels.has(key)}
        {@const dim = count === 0}
        <li>
          <label
            class="hover:bg-bg-3 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition-colors"
            class:opacity-50={dim}>
            <input
              type="checkbox"
              {checked}
              onchange={() => toggleLevel(key)}
              class="accent-brand size-3.5" />
            <span
              class="font-mono text-[12px] font-semibold"
              style="color: var(--log-{key.toLowerCase()})">{key}</span>
            <span class="flex-1">{label}</span>
            <span class="text-text-3 font-mono text-[11px] tabular-nums">{count}</span>
          </label>
        </li>
      {/each}
    </ul>
  </section>

  <!-- Tags -->
  <section class="mb-3">
    <header class="text-text-3 mb-2 flex items-center justify-between px-1 text-[11px] uppercase">
      <span>
        Tag {#if filterStore.tags.size > 0}<span class="text-text-1">· {filterStore.tags.size} selected</span
          >{/if}
      </span>
      <button
        type="button"
        class="hover:text-text-1 transition-colors"
        onclick={resetTags}
        aria-label="Reset tag filter">
        reset
      </button>
    </header>
    <ul class="space-y-0.5">
      {#each topTags as [tag, count] (tag)}
        {@const checked = filterStore.tags.has(tag)}
        <li>
          <label
            class="hover:bg-bg-3 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition-colors">
            <input
              type="checkbox"
              {checked}
              onchange={() => toggleTag(tag)}
              class="accent-brand size-3.5" />
            <span class="min-w-0 flex-1 truncate font-mono text-[12px]" title={tag}>{tag}</span>
            <span class="text-text-3 font-mono text-[11px] tabular-nums">{count}</span>
          </label>
        </li>
      {/each}
      {#if result.meta.tags.size > TOP_N_TAGS}
        <li class="text-text-3 px-1 pt-1 text-[11px] italic">
          +{result.meta.tags.size - TOP_N_TAGS} more
        </li>
      {/if}
    </ul>
  </section>

  <!-- PIDs -->
  {#if result.meta.pids.size > 0}
    <section class="mb-3">
      <header
        class="text-text-3 mb-2 flex items-center justify-between px-1 text-[11px] uppercase">
        <span>
          PID {#if filterStore.pids.size > 0}<span class="text-text-1"
              >· {filterStore.pids.size} selected</span
            >{/if}
        </span>
        <button
          type="button"
          class="hover:text-text-1 transition-colors"
          onclick={resetPids}
          aria-label="Reset pid filter">
          reset
        </button>
      </header>
      <ul class="space-y-0.5">
        {#each topPids as [pid, count] (pid)}
          {@const checked = filterStore.pids.has(pid)}
          <li>
            <label
              class="hover:bg-bg-3 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition-colors">
              <input
                type="checkbox"
                {checked}
                onchange={() => togglePid(pid)}
                class="accent-brand size-3.5" />
              <span class="flex-1 font-mono text-[12px] tabular-nums">{pid}</span>
              <span class="text-text-3 font-mono text-[11px] tabular-nums">{count}</span>
            </label>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</aside>
