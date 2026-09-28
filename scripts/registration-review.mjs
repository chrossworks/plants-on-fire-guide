import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { parse, stringify } from 'yaml';
import { collectReviewUnits, reviewIssues } from '../lib/registration-review.mjs';

const dir = 'work/registration';
const baselineFile = `${dir}/baseline.json`;
const recordsFile = `${dir}/checks.yaml`;
const read = file => parse(fs.readFileSync(file, 'utf8'));
const current = {};
for (const item of fs.readdirSync('data', { recursive: true }).sort()) {
  const file = `data/${item.replaceAll('\\', '/')}`;
  if (!file.endsWith('.yaml') || ['data/assets.yaml', 'data/sources.yaml'].includes(file)) continue;
  for (const [pointer, value] of Object.entries(collectReviewUnits(read(file)))) current[`${file}#${pointer}`] = value;
}
fs.mkdirSync(dir, { recursive: true });
const mode = process.argv[2] || 'check';
if (mode === 'init') {
  if (fs.existsSync(baselineFile)) throw new Error('基準は既に存在します。上書きせず check / accept を使用してください。');
  fs.writeFileSync(baselineFile, JSON.stringify(current, null, 2));
  if (!fs.existsSync(recordsFile)) fs.writeFileSync(recordsFile, '{}\n');
  console.log('変更検知の開始点を保存しました。既存データの再読確認を意味しません。');
} else {
  if (!['check', 'accept'].includes(mode)) throw new Error('init / check / accept を指定してください');
  if (!fs.existsSync(baselineFile)) throw new Error('データを編集する前に npm run registration:init を実行してください');
  const before = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const records = fs.existsSync(recordsFile) ? read(recordsFile) || {} : {};
  const issues = reviewIssues(before, current, records);
  const local = fs.existsSync('work/sources.yaml') ? read('work/sources.yaml') : {};
  const sources = read('data/sources.yaml');
  const changed = Object.keys({ ...before, ...current }).filter(key => JSON.stringify(before[key]) !== JSON.stringify(current[key]));
  const html = ['<!doctype html><meta charset="utf-8"><title>読取照合票</title><style>body{font-family:sans-serif;max-width:1100px;margin:2em auto}img{max-width:100%}pre{white-space:pre-wrap}section{border-top:1px solid;padding:1em}</style><h1>読取照合票</h1><p>未記録・不一致・保留を優先確認。合格は画像の正しさの自動保証ではありません。</p>'];
  const escape = v => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  for (const [index, key] of changed.entries()) {
    const record = records[key] || {};
    html.push(`<section><h2>${escape(key)}</h2><pre>${escape(stringify({ registered: current[key] ?? '(削除)', first: record.first ?? '(未読)', second: record.second ?? '(未読)', context: record.context ?? '', holdReason: record.holdReason ?? '' }))}</pre>`);
    for (const [n, evidence] of (record.evidence || []).entries()) {
      try {
        const entry = local[evidence.source];
        if (!sources[evidence.source] || sources[evidence.source].kind !== 'screenshot' || entry?.status !== 'confirmed') throw new Error('分類済みの画像根拠が必要');
        if (current[key]?.sources && !current[key].sources.includes(evidence.source)) throw new Error('登録値の根拠IDと不一致');
        const base = fs.realpathSync('raw-screenshots');
        const original = fs.realpathSync(path.resolve(base, entry.path));
        const relative = path.relative(base, original);
        if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('原本フォルダ外');
        const hash = createHash('sha256').update(fs.readFileSync(original)).digest('hex');
        if (evidence.sha256 !== hash) throw new Error('原本のSHA256が未記録、または確認後に原本が変更されています');
        const region = evidence.region;
        if (!region || !['left', 'top', 'width', 'height'].every(k => Number.isInteger(region[k]) && region[k] >= (['width','height'].includes(k) ? 1 : 0))) throw new Error('原本座標の確認範囲が必要');
        const output = `crop-${index}-${n}.png`;
        await sharp(original).extract(region).png().toFile(`${dir}/${output}`);
        html.push(`<p>${escape(evidence.source)} / ${escape(JSON.stringify(region))}</p><img src="${output}" alt="確認範囲">`);
      } catch (error) { issues.push(`${key}: 画像根拠エラー: ${error.message}`); }
    }
    html.push('</section>');
  }
  html.splice(1, 0, `<pre>${escape(issues.join('\n') || '未記録・不一致なし')}</pre>`);
  fs.writeFileSync(`${dir}/review.html`, html.join('\n'));
  fs.writeFileSync(`${dir}/result.json`, JSON.stringify({ changed: changed.length, issues }, null, 2));
  console.log(`読取照合: 変更 ${changed.length}項目 / 要対応 ${issues.length}件。${dir}/review.html`);
  if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
  else if (mode === 'accept') {
    const archive = `${dir}/accepted-${Date.now()}`;
    fs.mkdirSync(archive);
    fs.copyFileSync(baselineFile, `${archive}/baseline.json`);
    fs.copyFileSync(recordsFile, `${archive}/checks.yaml`);
    fs.writeFileSync(baselineFile, JSON.stringify(current, null, 2));
    console.log('確認記録と旧基準を保存し、次回の変更検知の開始点を更新しました。');
  }
}
