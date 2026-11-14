import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const output = resolve('dist');
async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const name = `${prefix}${entry.name}`;
    return entry.isDirectory() ? listFiles(join(directory, entry.name), `${name}/`) : [name];
  }));
  return files.flat();
}

const template = await readFile('scripts/sw.js', 'utf8');
const files = (await listFiles(output))
  .filter((file) => file !== 'sw.js' && file !== '_headers' && !file.endsWith('.map'))
  .sort();
const hash = createHash('sha256').update(template);
for (const file of files) {
  hash.update(file).update(await readFile(join(output, file)));
}
const worker = template
  .replace('__BUILD_ID__', hash.digest('hex').slice(0, 16))
  .replace('__PRECACHE_MANIFEST__', JSON.stringify(files.map((file) => `/${file}`)));
await writeFile(join(output, 'sw.js'), worker);
console.log(`Precached ${files.length} PWA assets.`);
