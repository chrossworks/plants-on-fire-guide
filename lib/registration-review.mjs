import { isDeepStrictEqual } from 'node:util';

// JSON Pointer paths keep array entries and property names unambiguous.
export function collectReviewUnits(value, pointer = '') {
  if (value === null || typeof value !== 'object') return { [pointer]: value };
  if (typeof value.status === 'string') return { [pointer]: value };
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => {
    if (['updated', 'schemaVersion', 'id'].includes(key)) return [];
    return Object.entries(collectReviewUnits(child, `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`));
  }));
}

export function readingValue(value) {
  if (value && typeof value === 'object' && value.status) {
    if (value.status === 'absent') return { status: 'absent' };
    if ('value' in value) return { status: value.status, value: value.value };
  }
  return value;
}

export function reviewIssues(before, current, records) {
  const issues = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(current)])) {
    if (isDeepStrictEqual(before[key], current[key])) continue;
    const record = records[key];
    const value = current[key];
    if (!record || !isDeepStrictEqual(record.registered, value)) {
      issues.push(`${key}: 確認記録なし、または登録内容が確認後に変更されています`); continue;
    }
    if (value === undefined) {
      if (!record.deletionReason?.trim()) issues.push(`${key}: 削除理由が必要です`);
      continue;
    }
    if (value?.status === 'unknown') {
      if (!record.holdReason?.trim()) issues.push(`${key}: 未確認として保留する理由が必要です`);
      continue;
    }
    if (!isDeepStrictEqual(record.first, readingValue(value)) || !isDeepStrictEqual(record.second, readingValue(value))) {
      issues.push(`${key}: 初回・再読・登録値が一致していません`);
    }
    if (!record.context?.trim()) issues.push(`${key}: 対象・形態・モード・Lv・星・ラウンド等の確認条件が必要です`);
    if (value?.status === 'manual' || value?.status === 'derived') {
      if (!record.basis?.trim()) issues.push(`${key}: ユーザー確認、または式・前提の照合記録が必要です`);
    } else if (!value?.status && record.basis?.trim()) {
      // Scalar metadata/editorial fields can be grounded in notes or explicit user instructions.
    } else if (!record.evidence?.length) {
      issues.push(`${key}: 原本の確認範囲が必要です`);
    }
    if (value?.status === 'absent' && record.fullRegionVisible !== true) issues.push(`${key}: 表示領域全体の確認が必要です`);
  }
  return issues;
}
