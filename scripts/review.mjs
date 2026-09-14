import fs from 'node:fs';
import path from 'node:path';
import { root,readYaml,loadSources } from '../lib/content.mjs';
import { validate } from './validate.mjs';
const {minions,unknowns,assets,rumble}=await validate();
const sources=loadSources();
const local=fs.existsSync(path.join(root,'work/sources.yaml'))?readYaml('work/sources.yaml'):{};
const lines=['# 制作確認票','','公開前に、加工後画像・数値・攻略内容・最終表示を確認してください。','','## 未確認項目','',...unknowns.map(x=>'- '+x),'','## データと根拠',''];
function visit(v,p){
  if(!v||typeof v!=='object')return;
  if(v.status && (v.value!==undefined || v.status==='absent')){lines.push(`- **${p}** [${v.status}]: ${v.status==='absent'?(v.reason||v.note):typeof v.value==='object'?JSON.stringify(v.value):v.value}`);for(const s of v.sources||[])lines.push(`  - ${s}: ${sources[s]?.description} ${local[s]?' → raw-screenshots/'+local[s].path:''}`);if(v.formula)lines.push(`  - 計算: ${v.formula} / 前提: ${v.assumption}`);}
  for(const [k,x] of Object.entries(v))if(k!=='value')visit(x,`${p}.${k}`);
}
for(const m of minions){lines.push(`### ${m.name}`,'');visit(m,m.id);}
lines.push('','## ランブルチェス（保存のみ・サイト未使用）','');visit(rumble,'rumble-chess');
lines.push('','## 加工後画像','');
for(const [key,a] of Object.entries(assets))lines.push(`- ${key}: ${a.alt}`,`  ![${a.alt}](../public/${a.path})`);
fs.mkdirSync(path.join(root,'work'),{recursive:true});fs.writeFileSync(path.join(root,'work/review.md'),lines.join('\n')+'\n');
console.log('work/review.md を更新しました。データ・記事の正本は変更していません。');
