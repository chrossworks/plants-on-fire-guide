import fs from 'node:fs';
import path from 'node:path';
import { root, loadAssets } from '../lib/content.mjs';
const folder = path.resolve(root,process.env.BUILD_DIR || 'dist');
const base = '/'+(process.env.BASE_PATH||'/').split('/').filter(Boolean).join('/');
const prefix = base==='/'?'':base;
const all = fs.readdirSync(folder,{recursive:true}).filter(f=>fs.statSync(path.join(folder,f)).isFile()).map(f=>f.replaceAll('\\','/'));
const publicImages = new Set(Object.values(loadAssets()).map(a=>a.path));
const errors=[];
for(const file of all){
  if (!file.endsWith('.html') && !file.startsWith('_astro/') && !publicImages.has(file) && file!=='favicon.svg') errors.push(`想定外の公開物: ${file}`);
  if(!file.endsWith('.html')) continue;
  const html=fs.readFileSync(path.join(folder,file),'utf8');
  if(/raw-screenshots|article-notes|Screenshot_2026/.test(html)) errors.push(`制作素材の参照混入: ${file}`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref=match[1].replaceAll('&amp;','&');
    if(/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
    const pagePath=prefix+'/'+(file==='index.html'?'':file.replace(/index\.html$/,''));
    const u=new URL(ref,'https://local.invalid'+pagePath);
    if(prefix && u.pathname!==prefix && !u.pathname.startsWith(prefix+'/')) {errors.push(`base外へのリンク: ${file} → ${ref}`);continue;}
    const target=decodeURIComponent(u.pathname.slice(prefix.length)).replace(/^\//,'');
    const dest=target.endsWith('/') || !target ? target+'index.html':target;
    if(!all.includes(dest)){errors.push(`リンク先なし: ${file} → ${ref}`);continue;}
    if(u.hash && dest.endsWith('.html')){
      const h=fs.readFileSync(path.join(folder,dest),'utf8');
      const anchor=decodeURIComponent(u.hash.slice(1));
      if(!h.includes(`id="${anchor}"`))errors.push(`アンカーなし: ${file} → ${ref}`);
    }
  }
}
if(errors.length)throw new Error(errors.join('\n'));
console.log(`公開物検証OK: ${all.filter(x=>x.endsWith('.html')).length}ページ、リンク・画像・非公開素材の混入なし (base=${base})`);
