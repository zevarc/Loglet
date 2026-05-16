# Contributing to Loglet

Thanks for thinking about contributing — Loglet is healthier because of every
issue and PR. This guide is short on purpose.

## Before you open an issue

1. Search existing issues — there's a good chance someone already filed it.
2. For bugs: include the **logcat format**, a **minimal repro snippet**, browser,
   and OS. **Never paste production logs containing real PII.**
3. For feature requests: describe the use case, not just the feature. We say
   "no" to a lot of features to keep Loglet focused.

## Project structure

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) §8 for the layout. Most
contributions land in one of:

- `src/lib/parser/` — logcat format parsing
- `src/lib/filter/` and `src/lib/search/` — view derivation
- `src/lib/components/` — UI
- `src/lib/state/` — Svelte 5 runes-based stores

Design docs in `docs/` are the source of truth — please update them when
behavior changes.

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # type-check
npm run test         # unit tests
npm run test:e2e     # Playwright (requires `npm run build` first)
npm run lint
npm run format
```

Node ≥ 20 is required.

## Pull request checklist

- [ ] Tests pass (`npm run test`)
- [ ] Type-check passes (`npm run check`)
- [ ] Lint passes (`npm run lint`)
- [ ] New behavior has tests
- [ ] User-visible changes mentioned in `CHANGELOG.md`
- [ ] If you touched docs/, the changes are consistent across files

## Commit style

Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `perf:` perf improvement
- `refactor:` code restructure, no behavior change
- `docs:` docs only
- `test:` tests only
- `chore:` tooling, deps

## What we won't merge

- Anything that uploads logcat content to a server. The core promise of
  Loglet is local-only processing.
- Features explicitly listed under "Out of Scope" in `docs/PRD.md` §10.
- Net-new dependencies > 100 KB without strong justification.

## Code of Conduct

By participating, you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## License

Contributions are licensed under MIT, the same as the project. See
[`LICENSE`](./LICENSE).
