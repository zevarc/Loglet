<script lang="ts">
  import { logStore } from '$lib/state/log.svelte';
  import { SAMPLE_LOG } from '$lib/sample';
  import FileText from '$lib/icons/FileText.svelte';
  import Sparkles from '$lib/icons/Sparkles.svelte';
  import Upload from '$lib/icons/Upload.svelte';

  let isDragging = $state(false);

  function handlePaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain');
    if (!text) return;
    event.preventDefault();
    void logStore.loadFromText(text);
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (!file) return;
    const text = await file.text();
    void logStore.loadFromText(text);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  async function handleFilePick(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    void logStore.loadFromText(text);
  }

  function loadSample() {
    void logStore.loadFromText(SAMPLE_LOG);
  }
</script>

<svelte:window onpaste={handlePaste} />

<div
  role="region"
  aria-label="Paste your logcat"
  class="flex min-h-screen items-center justify-center p-6"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}>
  <div
    class="bg-bg-2 border-border w-full max-w-2xl rounded-lg border p-10 shadow-lg transition-colors"
    class:ring-2={isDragging}
    class:ring-brand={isDragging}>
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="font-mono text-5xl font-semibold tracking-tight">Loglet</h1>
      <p class="text-text-2 text-sm">
        Open-source logcat beautifier — paste a dump and see it become readable.
      </p>
    </div>

    <div class="mt-8 flex flex-col items-center gap-3">
      <div
        class="border-border bg-bg-1 text-text-3 flex w-full flex-col items-center gap-3 rounded-md border-2 border-dashed p-8 text-center">
        <FileText class="text-text-3 size-8" aria-hidden="true" />
        <div>
          <div class="text-text-1 text-sm font-medium">
            Paste your logcat anywhere on this page
          </div>
          <div class="text-text-3 mt-1 text-xs">
            (Ctrl/Cmd+V) — or drag a .log / .txt file in
          </div>
        </div>
        <div class="text-text-3 mt-2 text-[11px]">
          Supported: threadtime · time · brief · long · tag (auto-detected)
        </div>
      </div>

      {#if logStore.isParsing}
        <div class="text-text-2 mt-2 text-sm">Parsing…</div>
      {/if}

      {#if logStore.parseError}
        <div class="text-log-e mt-2 text-sm">Parse error: {logStore.parseError}</div>
      {/if}

      <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onclick={loadSample}
          class="border-border hover:bg-bg-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors">
          <Sparkles class="size-4" aria-hidden="true" />
          Try a sample
        </button>

        <label
          class="border-border hover:bg-bg-3 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors">
          <Upload class="size-4" aria-hidden="true" />
          Pick a file
          <input
            type="file"
            accept=".log,.txt,text/plain"
            class="hidden"
            onchange={handleFilePick} />
        </label>
      </div>
    </div>

    <p class="text-text-3 mt-8 text-center text-[11px]">
      Your log never leaves the browser. Everything runs locally.
    </p>
  </div>
</div>
