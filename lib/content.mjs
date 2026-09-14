import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { minionSchema, articleSchema, assetsSchema, sourcesSchema, keywordsSchema, rumbleSchema } from './schema.mjs';
// npm/CI run from the project root; import.meta.dirname changes during Astro bundling.
export const root = process.cwd();
export const readYaml = file => parse(fs.readFileSync(path.join(root, file), 'utf8'));
export const filesIn = folder => fs.readdirSync(path.join(root, folder)).filter(x => /\.(yaml|md)$/.test(x)).sort();
export function loadMinions() {
  return filesIn('data/minions').map(file => {
    const m = minionSchema.parse(readYaml(`data/minions/${file}`));
    if (file !== `${m.id}.yaml`) throw new Error(`ファイル名とIDが不一致: ${file}`);
    return m;
  });
}
export function readArticle(file) {
  const raw = fs.readFileSync(path.join(root, 'content', file), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`記事ヘッダーがありません: ${file}`);
  return { id: file.replace(/\.md$/, ''), data: articleSchema.parse(parse(match[1])), body: match[2] };
}
export const loadArticles = () => filesIn('content').map(readArticle);
export const loadAssets = () => assetsSchema.parse(readYaml('data/assets.yaml'));
export const loadSources = () => sourcesSchema.parse(readYaml('data/sources.yaml'));
export const loadKeywords = () => keywordsSchema.parse(readYaml('data/keywords.yaml'));
export const loadRumble = () => rumbleSchema.parse(readYaml('data/rumble-chess.yaml'));
