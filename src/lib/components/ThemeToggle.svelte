<script lang="ts">
  import { themeStore } from '$lib/state/theme.svelte';
  import Sun from '$lib/icons/Sun.svelte';
  import Moon from '$lib/icons/Moon.svelte';
  import Monitor from '$lib/icons/Monitor.svelte';

  const labels = {
    dark: 'Dark theme — click for light',
    light: 'Light theme — click for system',
    system: 'System theme — click for dark'
  } as const;
</script>

<button
  type="button"
  onclick={() => themeStore.cycle()}
  class="border-border hover:bg-bg-3 inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
  title={labels[themeStore.pref]}
  aria-label={labels[themeStore.pref]}>
  {#if themeStore.pref === 'dark'}
    <Moon class="size-3.5" aria-hidden="true" />
  {:else if themeStore.pref === 'light'}
    <Sun class="size-3.5" aria-hidden="true" />
  {:else}
    <Monitor class="size-3.5" aria-hidden="true" />
  {/if}
</button>
