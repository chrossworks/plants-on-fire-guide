import fs from 'node:fs/promises';
import path from 'node:path';
import { root, readYaml, loadAssets } from '../lib/content.mjs';
import { within, transform, compositeIcon } from './image-core.mjs';
const composition = process.argv.find(a => a.startsWith('--composition-preview='))?.split('=').slice(1).join('=');
if (composition) {
  if (process.argv.includes('--publish')) throw new Error('合成見本は非公開専用です');
  const { compositionPreview } = await import('./composition-preview.mjs');
  await compositionPreview(composition);
  process.exit(0);
}
const publish = process.argv.includes('--publish');
const only = process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const selected = only ? new Set(only.split(',')) : null;
const assets = loadAssets();
const recipes = readYaml('work/recipes.yaml');
const outRoot = path.join(root,publish?'public':'work/processed');
await fs.mkdir(outRoot,{recursive:true});
const seen = new Set();
for (const r of recipes) {
  if (seen.has(r.asset)) throw new Error(`画像ID重複: ${r.asset}`);
  seen.add(r.asset);
  if (selected && !selected.has(r.asset)) continue;
  if (r.classification !== 'confirmed') { console.log(`確認待ち: ${r.asset}`); continue; }
  if (publish && r.reviewed !== true) throw new Error(`加工後の目視確認が必要: ${r.asset}`);
  if (!assets[r.asset]) throw new Error(`公開画像ID未登録: ${r.asset}`);
  const input = within(path.join(root,'raw-screenshots'),r.source);
  const dest = within(outRoot,assets[r.asset].path);
  let buffer = await transform(input,r);
  if (r.overlay) {
    const overlayInput = within(path.join(root,'raw-screenshots'),r.overlay.source);
    buffer = await compositeIcon(buffer,overlayInput,r.overlay);
  }
  await fs.mkdir(path.dirname(dest),{recursive:true});
  await fs.writeFile(dest,buffer);
  console.log(`${publish?'公開用':'確認用'}: ${r.asset} (${buffer.length} bytes)`);
}
for (const asset of selected || []) if (!seen.has(asset)) throw new Error(`指定した画像IDなし: ${asset}`);
