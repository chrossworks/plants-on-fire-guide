import { z } from 'zod';
import { fact, id } from './schema.mjs';
import { filesIn, readYaml } from './content.mjs';

const text = z.string().min(1);
const field = value => fact(value).refine(f => f.status !== 'absent', '未確認はunknownで保存してください');
export const fateGiftSchema = z.object({
  schemaVersion: z.literal(1), id, updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: field(text), round: field(z.union([z.literal(4), z.literal(7), z.literal(10)])),
  effect: field(text), unlock: fact(text), icon: field(id)
}).strict();

export const loadFateGifts = () => filesIn('data/fate-gifts').map(file => {
  const gift = fateGiftSchema.parse(readYaml(`data/fate-gifts/${file}`));
  if (file !== `${gift.id}.yaml`) throw new Error(`運命のギフトのファイル名とIDが不一致: ${file}`);
  return gift;
});
