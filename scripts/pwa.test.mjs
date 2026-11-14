import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('production manifest icons match their declared PNG dimensions', async () => {
  const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.id);
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const png = await readFile(`dist${icon.src}`);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const html = await readFile('dist/index.html', 'utf8');
  assert.match(html, /rel="manifest"/);
  assert.match(html, /apple-touch-icon/);
});

test('worker installs build assets, serves offline shell, and bypasses APIs', async () => {
  const handlers = {};
  const cached = new Map();
  const removed = [];
  let claimed = false;
  const cache = {
    async addAll(requests) {
      for (const request of requests) {
        const path = new URL(request.url).pathname;
        cached.set(path, new Response(await readFile(`dist${path}`)));
      }
    },
    async match(request) {
      return cached.get(typeof request === 'string' ? request : new URL(request.url).pathname);
    },
  };
  vm.runInNewContext(await readFile('dist/sw.js', 'utf8'), {
    self: {
      location: { origin: 'https://app.test' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: { claim: async () => { claimed = true; } },
    },
    caches: {
      open: async () => cache,
      keys: async () => ['solid-rsbuild-shell-old', 'unrelated-cache'],
      delete: async (name) => { removed.push(name); },
    },
    Request: class extends Request {
      constructor(url, options) { super(new URL(url, 'https://app.test'), options); }
    },
    URL,
    fetch: () => { throw new Error('Offline'); },
  });
  let pending;
  handlers.install({ waitUntil: (promise) => { pending = promise; } });
  await pending;
  assert.ok(cached.has('/index.html'));
  assert.ok([...cached.keys()].some((url) => url.endsWith('.js')));
  handlers.activate({ waitUntil: (promise) => { pending = promise; } });
  await pending;
  assert.deepEqual(removed, ['solid-rsbuild-shell-old']);
  assert.ok(claimed);
  handlers.fetch({
    request: { method: 'GET', mode: 'navigate', url: 'https://app.test/nested' },
    respondWith: (promise) => { pending = promise; },
  });
  assert.match(await (await pending).text(), /<html/);
  for (const url of ['https://app.test/api/data', 'https://other.test/file.js']) {
    handlers.fetch({
      request: { method: 'GET', mode: 'cors', url },
      respondWith: () => assert.fail(`Unexpected interception: ${url}`),
    });
  }
});
