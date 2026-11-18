import { mkdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const images = JSON.parse(await readFile(new URL('assets/images.json', root), 'utf8'));
await mkdir(new URL('src/assets/', root), { recursive: true });
for (const [name, content] of Object.entries(images)) {
  if (!/^[a-z0-9-]+\.png$/.test(name)) throw new Error('Invalid asset filename');
  await writeFile(new URL(`src/assets/${name}`, root), Buffer.from(content, 'base64'));
}
console.log(`Restored ${Object.keys(images).length} image assets.`);
