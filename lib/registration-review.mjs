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

export function reviewKeys(before, current, records, targets = []) {
  const changed = Object.keys({ ...before, ...current }).filter(key => !isDeepStrictEqual(before[key], current[key]));
  return [...new Set([...changed, ...targets, ...Object.keys(records).filter(key => Object.hasOwn(current, key))])];
}

export function reviewIssues(before, current, records, targets = [], sources = {}) {
  const issues = [];
  for (const key of reviewKeys(before, current, records, targets)) {
    if (!Object.hasOwn(before, key) && !Object.hasOwn(current, key)) {
      issues.push(`${key}: 監査対象の項目が存在しません`); continue;
    }
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
    if (record.method === 'user-confirmation') {
      const confirmation = record.confirmation;
      if (!['manual', 'absent'].includes(value?.status)) issues.push(`${key}: ユーザー再確認はmanualまたはabsentの項目に限ります`);
      if (!record.context?.trim()) issues.push(`${key}: 確認対象・条件が必要です`);
      if (!confirmation || !isDeepStrictEqual(confirmation.value, readingValue(value)) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(confirmation.date || '') || !confirmation.statement?.trim() || !confirmation.response?.trim()) {
        issues.push(`${key}: 提示内容・回答・確認日・確認値が必要です`);
      }
      const source = confirmation?.source;
      if (!value?.sources?.includes(source) || sources[source]?.kind !== 'user' || !isDeepStrictEqual(confirmation?.sourceRecord, sources[source])) {
        issues.push(`${key}: 登録値に対応するユーザー根拠がないか、確認後に根拠が変更されています`);
      }
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

export function reviewSummary(before, current, keys, issues) {
  const counts = { total: Object.keys(current).length, targeted: keys.length, audited: 0, unchangedAudited: 0, changedAudited: 0, held: 0, pending: 0, deleted: 0, untargeted: 0 };
  for (const key of keys) {
    if (issues.some(issue => issue.startsWith(`${key}: `))) { counts.pending++; continue; }
    if (!Object.hasOwn(current, key)) { counts.deleted++; continue; }
    if (current[key]?.status === 'unknown') { counts.held++; continue; }
    counts.audited++;
    if (isDeepStrictEqual(before[key], current[key])) counts.unchangedAudited++;
    else counts.changedAudited++;
  }
  counts.untargeted = Object.keys(current).filter(key => !keys.includes(key)).length;
  return counts;
}
