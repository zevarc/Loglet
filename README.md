# Loglet

> **Make Android logcat readable.** Paste a logcat dump and watch it become structured, filterable, searchable — all in your browser.

[![CI](https://github.com/zevarc/loglet/actions/workflows/ci.yml/badge.svg)](https://github.com/zevarc/loglet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Live:** [loglet](https://loglet.zevarc.com) (no install, no account, no upload — every byte stays in your tab)

---

## What problem does this solve?

If you do any Android work, you know the pain: someone pastes you 5,000 lines of raw logcat in a chat, and you have to find the one stack trace that matters. Android Studio is overkill for "I just want to read this". VS Code's logcat plugins require setup. Online viewers are ugly and weak.

**Loglet** is the "Pastebin for logcat" — a zero-install, zero-config viewer that turns this:

```
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime  com.example.app  E  FATAL EXCEPTION: main
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime  com.example.app  E  java.lang.NullPointerException: ...
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime  com.example.app  E  ...at com.example.app.detail...
...
```

into a color-coded, filterable, searchable view with crash detection and stack folding in under a second.

## Features

- **Six format auto-detection** — `threadtime`, `time`, `brief`, `long`, `tag` (standard `adb logcat -v ...`), and the Android Studio Logcat V2 copy format.
- **Level-aware highlighting** — V/D/I/W/E/F each color-coded; E/F rows get a left color bar and tinted background.
- **Stack folding** — `FATAL EXCEPTION` and `Caused by` chains collapse to one row each, expand on click.
- **Multi-dimensional filtering** — by level, tag, PID; per-section reset; counts inline.
- **Search** — substring or regex, case toggle, in-row match highlighting, 80 ms debounce.
- **Crash banner** — top-of-page alert with a "Jump to first crash" button.
- **Virtual scroll** — renders ~30 DOM rows regardless of total log size; tested up to 10⁵ lines.
- **Keyboard-first** — `j`/`k` row nav, `gg`/`G` jump, `/` to search, `?` for the cheat sheet.
- **Dark / light / system theme** — persisted; no light-mode flash on first paint.
- **Privacy by construction** — logs are parsed in a Web Worker in your browser. Nothing is uploaded, ever.

## Quick start (using the web app)

1. Open [loglet](https://loglet.zevarc.com).
2. Press `Ctrl/Cmd+V` to paste, or drag a `.log` file in.
3. Read.

That's it. Try the **"Try a sample"** button if you don't have a log handy.

## Developing locally

Requirements: **Node 20+**, **pnpm** (or npm).

```bash
git clone https://github.com/zevarc/loglet
cd loglet
pnpm install
pnpm dev          # → http://localhost:5173
```

Useful scripts:

```bash
pnpm test         # vitest, ~100 tests
pnpm check        # svelte-check + tsc
pnpm lint         # prettier + eslint
pnpm build        # production SSG build → build/
pnpm preview      # serve the production bundle locally
```

## Deploying your own

Loglet builds to a fully static SPA — drop `build/` on any CDN.

## Tech

- **SvelteKit 2** + **Svelte 5** (runes) — fine-grained reactivity, tiny runtime
- **TypeScript** strict + `noUncheckedIndexedAccess`
- **Tailwind v4** with a CSS-variable token system for theming
- **Comlink** + Web Worker for off-main-thread parsing
- **Custom virtual scroller** — fixed 22 px rows, no third-party scroll lib

## Contributing

Issues and PRs welcome — see [`CONTRIBUTING.md`](./CONTRIBUTING.md). Most-wanted contributions right now:

- Additional logcat format variants (post a redacted sample + your AS version)
- Translations (i18n landing under `src/lib/i18n/`)
- Edge-case fixtures (synthetic, **no real PII**) for the parser test suite

## License

[MIT](./LICENSE) for the open-source client (web + future desktop). Loglet Pro subscription services and the Teams backend are governed by separate Terms — see [LICENSE](./LICENSE) for the split.

---

Built by [zevarc](https://github.com/zevarc)
