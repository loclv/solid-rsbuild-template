# AGENTS.md

## Commands

Bun is the package manager (lockfile: `bun.lock`); do not use npm/pnpm/yarn.

- `bun install`
- `bun run dev` — dev server at http://localhost:3000; never registers a service worker
- `bun run build` — `rsbuild build` **plus** `node scripts/build-sw.mjs`; always use this for production output
- `bun run preview` — serve the built `dist/`
- `bun fmt` — format with Bun's built-in formatter; `bun fmt --check` verifies. Config is `bunfig.toml`.
- `bun run lint` — rslint; lint only, it does not typecheck
- `bunx tsc --noEmit` — typecheck (TypeScript 7; no npm script alias)
- `node --test scripts/pwa.test.mjs` — PWA tests; reads `dist/`, so build first. There is no `test` script.
- `node scripts/generate-icons.mjs` — regenerate `public/icons/*.png`, then rebuild

Full verification: `bun fmt --check && bun run lint && bunx tsc --noEmit && bun run build && node --test scripts/pwa.test.mjs`.

## Solid 2, not Solid 1

This template uses `solid-js@2` and `@solidjs/web@2`.

- Render with `render` from `@solidjs/web` (`src/index.tsx`), not `solid-js/web`.
- Reactivity (`createSignal`, `createStore`, control flow) comes from `solid-js`; DOM/JSX and renderer APIs come from `@solidjs/web`.
- JSX types and compiler are configured via `jsxImportSource: "@solidjs/web"`; use `class`, not `className`.
- Repo-local skills live in `.agents/skills/`: use `solidjs-v2` for API guidance and `solidjs-v2-reviewer` for Solid diffs. `pwa`, `responsive-design`, `animate`, `apple-design`, and `emil-design-eng` cover the UI side.

## Structure and build

- Single-page client app: `src/index.tsx` registers the PWA and renders `src/App.tsx` into `#root`.
- There is no HTML source file; `dist/index.html` is generated from the `html` options in `rsbuild.config.ts`.
- `public/` is copied verbatim to `dist/` (manifest, icons, `_headers`).
- `tsconfig.json` includes only `src/`; `scripts/*.mjs` are plain Node ESM. `verbatimModuleSyntax` is on, so use `import type` for types.
- Indent with tabs, not spaces; `bunfig.toml` sets tabs and single quotes. `bun fmt` skips `.agents/` because vendored skills are hash-pinned in `skills-lock.json` — don't reformat or hand-edit them.
- `dist/` is gitignored and disposable; `bun run build` regenerates it.

## PWA pipeline

- Build-only. `src/pwa.ts` registers `/sw.js` only in production; the dev server intentionally has no worker.
- `scripts/sw.js` is a template, not the served worker. `scripts/build-sw.mjs` hashes every `dist` asset (except `sw.js`, `_headers`, `*.map`), substitutes `__BUILD_ID__` and `__PRECACHE_MANIFEST__`, and writes `dist/sw.js`. Edit the template and rebuild; never hand-edit `dist/sw.js`.
- Only build assets are precached. Navigations fall back to cached `/index.html`; API and cross-origin requests are not intercepted.
- No `skipWaiting` by design: an update activates only after all app tabs/windows close.
- To verify offline behavior, `bun run build && bun run preview`, then use DevTools → Application. A worker left by an earlier preview on the same origin must be unregistered manually.

## App identity and deploy

- App name and colors live in both `rsbuild.config.ts` (title, meta theme-color) and `public/manifest.webmanifest`; keep them in sync.
- `public/_headers` holds cache headers for hosts that support that file. Serve the manifest as `application/manifest+json` and `sw.js`/`index.html` with `Cache-Control: no-cache` elsewhere.
- Deploy `dist/` at an origin root over HTTPS; asset paths and worker scope are root-absolute. A subpath deploy requires coordinated changes to `rsbuild.config.ts`, `src/pwa.ts`, `public/manifest.webmanifest`, and `public/_headers`.

## Docs

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt
- Rslint: https://rslint.rs/llms.txt
