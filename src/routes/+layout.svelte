<script lang="ts">
  import '../app.css';
  import { initTheme, themeStore } from '$lib/state/theme.svelte';

  let { children } = $props();

  // Set up persistence + media-query listener; tear down on unmount.
  $effect(() => initTheme());

  // Apply the resolved theme to <html> any time it changes.
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = themeStore.resolved;
    }
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
</svelte:head>

{@render children?.()}
