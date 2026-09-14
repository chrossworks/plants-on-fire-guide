import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { root, readYaml } from '../lib/content.mjs';
const raw = path.join(root,'raw-screenshots');
const registry = fs.existsSync(path.join(root,'work/sources.yaml')) ? readYaml('work/sources.yaml') : {};
for (const file of fs.readdirSync(raw,{recursive:true}).filter(f=>/\.(png|jpe?g|webp)$/i.test(f))) {
  const rel = file.replaceAll('\\','/');
  const meta = await sharp(path.join(raw,file)).metadata();
  const matches = Object.entries(registry).filter(([,s])=>s.path===rel);
  console.log(`${matches.length ? matches.map(([id,s])=>`${id}:${s.status}`).join(', ') : '未分類・確認待ち'}\t${meta.width}x${meta.height}\t${rel}`);
}
