import { z } from 'zod';
import { fact, id } from './schema.mjs';
import { filesIn, readYaml } from './content.mjs';

const text = z.string().min(1);
const level = z.number().int().positive();
const field = value => fact(value).refine(f => f.status !== 'absent', '未確認はunknownで保存してください');
export const captainBadgeSchema = z.object({
  schemaVersion: z.literal(1), id, updated: text,
  name: field(text), rarity: field(z.enum(['rare', 'epic', 'legend'])),
  observedLevel: field(level), effect: field(text), acquisition: field(text),
  icons: z.object({ rarityBackground: field(id), plain: field(id) }).strict(),
  progression: z.object({
    maxLevel: field(level), costs: field(text), currency: field(text).optional(),
    coverage: field(z.object({ from: level, through: level }).strict()),
    levels: z.array(z.object({ level, effect: field(text) }).strict())
  }).strict(),
  charms: z.array(z.object({
    id, name: field(text), rarity: field(z.enum(['rare', 'epic', 'legend'])),
    effect: field(text), icon: field(id), upgradedEffect: field(text)
  }).strict()),
  evaluation: field(text)
}).strict().superRefine((b, ctx) => {
  const levels = b.progression.levels.map(x => x.level);
  if (new Set(levels).size !== levels.length) ctx.addIssue({ code: 'custom', message: '育成Lvの重複' });
  const range = b.progression.coverage.value;
  if (range) {
    if (range.from > range.through) ctx.addIssue({ code: 'custom', message: '育成Lv範囲が逆転' });
    for (let n = range.from; n <= range.through; n++) if (!levels.includes(n)) ctx.addIssue({ code: 'custom', message: `Lv.${n}が欠落` });
  }
  if (new Set(b.charms.map(x => x.id)).size !== b.charms.length) ctx.addIssue({ code: 'custom', message: 'チャームIDの重複' });
});

export const loadCaptainBadges = () => filesIn('data/captain-badges').map(file => {
  const badge = captainBadgeSchema.parse(readYaml(`data/captain-badges/${file}`));
  if (file !== `${badge.id}.yaml`) throw new Error(`隊長バッジのファイル名とIDが不一致: ${file}`);
  return badge;
});
