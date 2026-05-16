# Icons

Tiny inline SVG components — one Svelte file per icon. Paths sourced from the
[lucide.dev](https://lucide.dev) icon set (ISC license).

We **don't** use the `lucide-svelte` or `@lucide/svelte` packages because:

1. `lucide-svelte@1.x` still ships Svelte 4-era code (`$$props`), incompatible
   with our `runes: true` compiler option.
2. We only need a handful of icons — inlining 4 SVGs is smaller than the
   tooling and dependency cost of either lucide package.

## Adding a new icon

1. Grab the SVG paths from https://lucide.dev/icons (or any other ISC-licensed
   set you like).
2. Copy an existing file in this folder as a template; replace the `<path>`
   contents. Keep the same props interface so styling stays uniform.
3. Use Tailwind's `size-*` utilities on the `class` prop to control dimensions:
   `<FileText class="size-4" />`.
