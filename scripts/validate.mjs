import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { root, loadMinions, loadArticles, loadAssets, loadSources, loadKeywords, loadRumble } from '../lib/content.mjs';
import { minimumLevels, hasStandardAbsenceEvidence } from '../lib/schema.mjs';

export async function validate() {
  const minions = loadMinions(), articles = loadArticles(), assets = loadAssets(), sources = loadSources(), keywords = loadKeywords();
  const issues = [], unknowns = [];
  const fail = s => issues.push(s);
  function walk(v, p) {
    if (!v || typeof v !== 'object') return;
    if (v.status === 'unknown' && v.reason) unknowns.push(`${p}: ${v.reason}`);
    if (v.sources) for (const s of v.sources) if (!sources[s]) fail(`${p}: 不明な根拠 ${s}`);
    if (Array.isArray(v.keywords)) for (const k of v.keywords) if (!keywords[k]) fail(`${p}: 不明な用語 ${k}`);
    for (const [k,x] of Object.entries(v)) walk(x, `${p}.${k}`);
  }
  const paths = new Set();
  const rumble = loadRumble();
  walk(rumble,'rumble-chess');
  const memberships = new Map();
  for (const d of rumble.decks) for (const name of d.members.value || []) {
    if (memberships.has(name)) fail(`絆所属の重複: ${name}`);
    memberships.set(name,d.id);
  }
  for (const o of rumble.observations) {
    if (sources[o.source]?.mode !== 'rumble-chess' || sources[o.source]?.screen !== 'detail') fail(`ランブルチェス詳細の根拠が不正: ${o.name}`);
    if (!rumble.decks.some(d=>d.id===o.deck)) fail(`絆デッキ不明: ${o.deck}`);
    if (memberships.has(o.name) && memberships.get(o.name)!==o.deck) fail(`絆所属の矛盾: ${o.name}`);
  }
  for (const [key,a] of Object.entries(assets)) {
    if (paths.has(a.path)) fail(`画像パス重複: ${a.path}`);
    paths.add(a.path);
    const file = path.join(root,'public',a.path);
    if (!fs.existsSync(file)) { fail(`画像なし: ${key} → ${a.path}`); continue; }
    const meta = await sharp(file).metadata();
    if (meta.format !== 'webp' || !meta.width || !meta.height) fail(`画像形式不正: ${key}`);
    if (meta.exif || meta.xmp) fail(`画像にメタデータが残っています: ${key}`);
  }
  const assetRef = (key,p) => { if (!assets[key]) fail(`${p}: 画像IDなし ${key}`); };
  for (const m of minions) {
    walk(m,m.id); if (m.icon) assetRef(m.icon,m.id); assetRef(m.portrait,m.id);
    if (m.variants.status === 'absent' && !hasStandardAbsenceEvidence(m.variants,sources)) fail(`${m.id}: バリアントなしには通常詳細画面での非表示確認が必要です`);
    if (!sources[m.evaluation.source]) fail(`${m.id}: 評価の出典なし`);
    const min = minimumLevels[m.rarity.value];
    for (const f of [m.base,...m.variants.items]) {
      if (f.image) assetRef(f.image,`${m.id}.${f.id}`);
      if (f === m.base && f.displayLevel.value < min) fail(`${m.id}: 最低レベル未満`);
      if (f.bonusCoverage.value) {
        const { from, through } = f.bonusCoverage.value;
        if (from > through) fail(`${m.id}.${f.id}: Lv範囲が逆転`);
        for (let lv=from;lv<=through;lv++) if (!f.bonuses.some(b=>b.level===lv)) fail(`${m.id}.${f.id}: Lv.${lv}が欠落`);
      }
    }
    if (m.variants.status === 'unknown') unknowns.push(`${m.id}.variants: ${m.variants.note}`);
    const associated = articles.filter(a=>a.data.minionId===m.id);
    if (associated.length !== 1) fail(`${m.id}: ミニオン記事は1件必要です`);
  }
  walk(keywords,'keywords');
  for (const a of articles) {
    if (a.data.minionId && !minions.some(m=>m.id===a.data.minionId)) fail(`${a.id}: ミニオンID不明`);
    for (const m of a.data.relatedMinions) if (!minions.some(x=>x.id===m)) fail(`${a.id}: 関連ミニオン不明 ${m}`);
    for (const i of a.data.images) assetRef(i,a.id);
    if (/raw-screenshots|article-notes|file:\/\/|[A-Z]:\\/.test(a.body)) fail(`${a.id}: 制作素材へのリンクは使えません`);
  }
  for (const file of fs.readdirSync(path.join(root,'public'),{recursive:true,withFileTypes:true})) {
    if (!file.isFile()) continue;
    const rel = path.relative(path.join(root,'public'),path.join(file.parentPath,file.name)).replaceAll('\\','/');
    if (!paths.has(rel) && rel !== 'favicon.svg') fail(`公開許可リスト外のファイル: ${rel}`);
  }
  if (issues.length) throw new Error(issues.join('\n'));
  return { minions, articles, assets, unknowns, rumble };
}
if (process.argv[1] === import.meta.filename) {
  try { const v = await validate(); console.log(`検証OK: ${v.minions.length}体 / ${v.articles.length}記事 / ${Object.keys(v.assets).length}画像。未確認 ${v.unknowns.length}項目（公開可能）。`); }
  catch(e) { console.error(e.message); process.exitCode=1; }
}
