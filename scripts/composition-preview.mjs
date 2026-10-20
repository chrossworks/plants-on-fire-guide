import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { root, readYaml, loadAssets } from '../lib/content.mjs';
import { within, transform } from './image-core.mjs';

// Private proof sheets only: these recipes cannot write into public/.
export async function compositionPreview(relative) {
  const config = readYaml(path.relative(root, within(path.join(root, 'work'), relative)));
  const assets = loadAssets();
  const directory = path.join(root, 'work/processed/variant-icon-preview');
  await fs.mkdir(directory, { recursive: true });
  const tiles = [];
  for (const [index, sample] of config.samples.entries()) {
    if (!assets[sample.base]) throw new Error('基本アイコン未登録');
    const base = await sharp(within(path.join(root, 'public'), assets[sample.base].path)).resize(160, 160).png().toBuffer();
    const badge = await transform(within(path.join(root, 'raw-screenshots'), sample.source), {
      expectedSize: [1080, 2340], crop: sample.crop, width: 52, lossless: true
    });
    const resized = await sharp(badge).resize(52, 52).png().toBuffer();
    const icon = await sharp(base).composite([{ input: resized, left: 108, top: 108 }]).png().toBuffer();
    await fs.writeFile(path.join(directory, `${index + 1}.png`), icon);
    tiles.push({ input: icon, left: 16 + index * 176, top: 16 });
  }
  await sharp({ create: { width: config.samples.length * 176 + 16, height: 192, channels: 4, background: '#ede9e1' } }).composite(tiles).png().toFile(path.join(directory, 'comparison.png'));
  console.log('非公開の合成見本: work/processed/variant-icon-preview/comparison.png');
}
