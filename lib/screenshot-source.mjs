import fs from 'node:fs';
import path from 'node:path';

export function screenshotPath(rawRoot, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error('原本の相対パスが必要です');
  }
  const root = fs.realpathSync(rawRoot);
  const file = fs.realpathSync(path.resolve(root, relativePath));
  const relative = path.relative(root, file);
  if (!relative || relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative) || !fs.statSync(file).isFile()) {
    throw new Error('原本フォルダ内のファイルが必要です');
  }
  return file;
}

export function screenshotById(rawRoot, sources, id) {
  const entry = Object.hasOwn(sources, id) ? sources[id] : undefined;
  if (entry?.status !== 'confirmed') throw new Error('分類済みの画像根拠が必要: '+id);
  return screenshotPath(rawRoot, entry.path);
}

