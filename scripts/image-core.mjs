import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
export function within(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative)) throw new Error('相対パスを指定してください');
  const target = path.resolve(root, relative);
  const rel = path.relative(path.resolve(root), target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('許可フォルダ外のパス');
  // Reject symbolic-link escapes as well as lexical traversal.
  let existing = target;
  while (!fs.existsSync(existing)) existing = path.dirname(existing);
  const realRel = path.relative(fs.realpathSync(root), fs.realpathSync(existing));
  if (realRel.startsWith('..') || path.isAbsolute(realRel)) throw new Error('リンク先が許可フォルダ外です');
  return target;
}
function rect(r,w,h) {
  if (!r || !['left','top','width','height'].every(k=>Number.isInteger(r[k])) || r.left<0 || r.top<0 || r.width<=0 || r.height<=0 || r.left+r.width>w || r.top+r.height>h) throw new Error('画像範囲外または不正な矩形');
  return r;
}
export async function transform(input, recipe) {
  const meta = await sharp(input).metadata();
  if (meta.width !== recipe.expectedSize[0] || meta.height !== recipe.expectedSize[1]) throw new Error('原本サイズが変わっています。切り出し位置を確認してください');
  if (!Number.isInteger(recipe.width) || recipe.width<1 || recipe.width>2400) throw new Error('出力幅は1〜2400px');
  const crop = rect(recipe.crop,meta.width,meta.height);
  const overlays = (recipe.masks || []).map(r=> {
    rect(r,meta.width,meta.height);
    return { input:{create:{width:r.width,height:r.height,channels:4,background:{r:0,g:0,b:0,alpha:1}}},left:r.left,top:r.top };
  });
  // Materialize the opaque masks BEFORE cropping/resizing. All coordinates refer to the original.
  const masked = await sharp(input).composite(overlays).png().toBuffer();
  return sharp(masked).extract(crop).resize({width:recipe.width,withoutEnlargement:true}).webp({quality:recipe.quality || 88,lossless:recipe.lossless || false}).toBuffer();
}
