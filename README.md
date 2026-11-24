# Solid Rsbuild template using bun, PWA, agents-skills

## Setup

Install the dependencies:

```bash
bun install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
bun run dev
```

Build the app for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

## Progressive Web App

Production builds include an installable manifest, PNG icons (including a maskable
icon and Apple touch icon), and a versioned service worker. After one successful
online visit and worker installation, the app shell works offline. Only build
assets are cached; API responses and user data are left to the network.

Run `bun run build` followed by `bun run preview`. Open the localhost URL, wait
for the service worker to activate (DevTools → Application → Service Workers),
then switch DevTools Network to Offline and reload. Check the manifest and icons
in Application → Manifest. Install using the browser's install menu; on iOS use
Share → Add to Home Screen. The development server does not register a worker.

Updates download in the background and activate after all app tabs/windows close.
Reopen the app to use the new version. During local development, unregister any
worker left by a production preview on the same origin via DevTools.

Deploy `dist/` at the origin root over HTTPS. The build uses Rsbuild's default
`dist` directory and root asset paths; adjust the build script, worker paths,
manifest, and registration together if deploying under a subpath. Hosts that
support `_headers` use the included caching rules; on other hosts configure
`Cache-Control: no-cache` for `/sw.js`, `/index.html`, and `/manifest.webmanifest`,
and serve the manifest as `application/manifest+json`.

Customize the app name and colors in `public/manifest.webmanifest` and
`rsbuild.config.ts`. Replace the starter icons or regenerate them with
`node scripts/generate-icons.mjs`, then rebuild. Always use `bun run build` so
the service worker is regenerated with the current asset hashes.

Run `node --test scripts/pwa.test.mjs` after building to validate emitted icons,
precache installation, offline navigation, and API request bypass behavior.

## Resources

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
