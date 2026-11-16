import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { screenshotPath } from '../lib/screenshot-source.mjs';

const [folder] = process.argv.slice(2);
if (!folder || process.argv.length !== 3) throw new Error('使用法: npm run images:sheet -- 原本フォルダの相対パス');
const rawRoot = await fs.realpath('raw-screenshots');
const input = await fs.realpath(path.resolve(rawRoot, folder));
const relative = path.relative(rawRoot, input);
if (relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)) throw new Error('原本フォルダ外');
const files = (await fs.readdir(input, {withFileTypes:true})).filter(e=>e.isFile() && /\.(png|jpe?g|webp)$/i.test(e.name)).map(e=>e.name).sort();
if (!files.length) throw new Error('対象画像がありません');
const escape = text => text.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const output = path.join('work','screenshot-sheets',relative);
await fs.mkdir(output,{recursive:true});
const figures = [];
for (const name of files) {
  const source = screenshotPath(rawRoot,path.join(relative,name));
  const preview = await sharp(source).resize({width:370,height:800,fit:'inside',withoutEnlargement:true}).webp().toBuffer();
  figures.push(`<figure><figcaption>${escape(name)}</figcaption><img src="data:image/webp;base64,${preview.toString('base64')}" alt="${escape(name)}"></figure>`);
}
const report = path.join(output,'index.html');
await fs.writeFile(report,`<!doctype html><html lang="ja"><meta charset="utf-8"><title>原本確認</title><style>body{font-family:system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0}figcaption{overflow-wrap:anywhere;font-weight:bold}img{max-width:100%;height:auto}</style><h1>${escape(relative || 'raw-screenshots')}</h1><main>${figures.join('\n')}</main></html>`);
console.log(report);

