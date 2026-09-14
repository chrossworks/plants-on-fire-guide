import { z } from 'zod';

const text = z.string().min(1);
export const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const evidence = { sources: z.array(text).min(1), note: text.optional() };
export const fact = (value) => z.discriminatedUnion('status', [
  z.object({ status: z.literal('observed'), value, ...evidence }).strict(),
  z.object({ status: z.literal('manual'), value, ...evidence }).strict(),
  z.object({ status: z.literal('derived'), value, ...evidence, formula: text, assumption: text }).strict(),
  z.object({ status: z.literal('unknown'), reason: text }).strict(),
  z.object({ status: z.literal('absent'), reason: text, ...evidence }).strict()
]);
const positive = z.number().positive();
const integer = z.number().int().nonnegative();
const level = z.number().int().min(1);
const stats = z.object({ attack: fact(integer), interval: fact(positive), target: fact(text) }).strict();
const ability = z.object({ text, keywords: z.array(id) }).strict();
const initialFact = value => fact(value).refine(f => f.status !== 'absent', 'initialにabsentは指定できません。未確認の場合はunknownを使用してください');
const star = z.object({ star: z.number().int().min(1).max(3), stats, ability: fact(ability) }).strict();
const stars = z.array(star).length(3).refine(v => new Set(v.map(x => x.star)).size === 3, '星1〜3を重複なく記録してください');
const bonuses = z.array(z.object({
  level,
  effect: fact(z.object({
    text,
    operation: z.enum(['attack_add', 'ability_set', 'text']),
    value: z.number().nullable(),
    unit: z.enum(['points', 'percent', 'none'])
  }).strict())
}).strict()).refine(v => new Set(v.map(x => x.level)).size === v.length, 'Lvボーナスの重複');
const form = z.object({
  id, name: text, image: id.optional(),
  displayLevel: fact(level),
  upgradeScreenLevel: fact(level),
  conditions: text,
  stars,
  initial: z.object({ attack: initialFact(integer), abilities: z.array(initialFact(ability)).length(3) }).strict(),
  bonuses,
  bonusCoverage: fact(z.object({ from: level, through: level }).strict()),
  acquisition: fact(text)
}).strict();
export const minionSchema = z.object({
  schemaVersion: z.literal(1), id, name: text, reading: text,
  rarity: fact(z.enum(['rare', 'epic', 'legend'])), cost: fact(integer),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  icon: id, portrait: id,
  evaluation: z.object({ rank: z.enum(['SS','S','A','B','C','未評価']), scope: text, source: text }).strict(),
  base: form.extend({ poolUnlock: fact(text) }),
  variants: z.object({
    status: z.enum(['observed','unknown','absent']), note: text,
    sources: z.array(text).min(1).optional(),
    items: z.array(form.extend({ cardRank: fact(text) }))
  }).strict().superRefine((v,c) => {
    if ((v.status === 'observed') !== (v.items.length > 0)) c.addIssue({ code: 'custom', message: 'バリアントの状態と件数が一致しません' });
    if (v.status === 'absent' && !v.sources?.length) c.addIssue({code:'custom',message:'バリアントなしには根拠が必要です'});
    if (new Set(v.items.map(x=>x.id)).size !== v.items.length) c.addIssue({code:'custom',message:'バリアントIDの重複'});
  })
}).strict();
export const articleSchema = z.object({
  title: text, description: text, kind: z.enum(['minion','guide']),
  minionId: id.optional(), updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  images: z.array(id).default([]), relatedMinions: z.array(id).default([])
}).strict().refine(v => v.kind !== 'minion' || !!v.minionId, 'ミニオン記事にはminionIdが必要です');
export const keywordsSchema = z.record(id, z.object({ name: text, definition: fact(text) }).strict());
export const sourcesSchema = z.record(text, z.object({ kind: z.enum(['screenshot','user']), description: text,
  mode: z.enum(['standard','rumble-chess','unknown']).optional(),
  screen: z.enum(['detail','pool-overview','pool-list']).optional(),
  variantControl: z.enum(['present','absent','unconfirmed']).optional()
}).strict());
export function hasStandardAbsenceEvidence(variants, sources) {
  return variants.sources?.some(id => {
    const s = sources[id];
    return s?.kind === 'screenshot' && s.mode === 'standard' && s.screen === 'detail' && s.variantControl === 'absent';
  }) ?? false;
}
export const rumbleSchema = z.object({
  schemaVersion: z.literal(1), mode: z.literal('rumble-chess'), updated: text, note: text,
  decks: z.array(z.object({id, name: fact(text), members: fact(z.array(text).min(1))}).strict()).refine(v=>new Set(v.map(d=>d.id)).size===v.length,'デッキIDの重複'),
  observations: z.array(z.object({
    name: text, source: text, deck: id,
    currentLevel: fact(level), guaranteedLevel: fact(level), selectedStar: z.number().int().min(1).max(4),
    bondPoints: fact(integer), attack: fact(integer), interval: fact(positive), target: fact(text), ability: fact(text), conditions: text
  }).strict())
}).strict();
export const assetsSchema = z.record(id, z.object({
  path: z.string().regex(/^images\/[a-z0-9/-]+\.webp$/), alt: text
}).strict());
export const minimumLevels = { rare: 1, epic: 4, legend: 7 };
export const rarityLabels = { rare: 'レア', epic: 'エピック', legend: 'レジェンド' };
export const factLabel = f => f.status === 'unknown' ? '未確認' : f.status === 'absent' ? 'なし' : String(f.value);
