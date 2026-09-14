import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './content' }),
  schema: z.object({ title:z.string(),description:z.string(),kind:z.enum(['minion','guide']),minionId:z.string().optional(),updated:z.string(),images:z.array(z.string()).default([]),relatedMinions:z.array(z.string()).default([]) })
});
export const collections = { articles };
