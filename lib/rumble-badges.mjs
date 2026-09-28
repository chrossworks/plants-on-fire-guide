import { z } from 'zod';
import { fact, id } from './schema.mjs';
import { filesIn, readYaml } from './content.mjs';

const text = z.string().min(1);
const field = value => fact(value).refine(f => f.status !== 'absent', '未確認はunknownで保存してください');
export const rumbleBadgeSchema = z.object({
  schemaVersion: z.literal(1), id, updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: field(text), category: field(z.enum(['rumble', 'rumble-gold-pass'])),
  background: field(z.enum(['blue', 'red'])), effect: field(text), icon: field(id),
  acquisition: field(text), evaluation: field(text)
}).strict().superRefine((badge, ctx) => {
  const expected = { rumble: 'blue', 'rumble-gold-pass': 'red' }[badge.category.value];
  if (expected && badge.background.value && badge.background.value !== expected) {
    ctx.addIssue({ code: 'custom', message: 'バッジの種類と背景色が不一致' });
  }
});

export const loadRumbleBadges = () => filesIn('data/rumble-badges').map(file => {
  const badge = rumbleBadgeSchema.parse(readYaml(`data/rumble-badges/${file}`));
  if (file !== `${badge.id}.yaml`) throw new Error(`ランブルバッジのファイル名とIDが不一致: ${file}`);
  return badge;
});
