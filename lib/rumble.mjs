// 絆所属はdecksだけを正本とし、未掲載も含めた名前と固定IDをmemberIdsで結ぶ。
export function rumbleIdentityIssues(rumble, minions) {
  const issues = [], mappedIds = new Set();
  const names = new Set(rumble.decks.flatMap(d => d.members.value || []));
  for (const [name, id] of Object.entries(rumble.memberIds)) {
    if (mappedIds.has(id)) issues.push(`ランブルチェスのミニオンID重複: ${id}`);
    mappedIds.add(id);
    const byId = minions.find(m => m.id === id), byName = minions.find(m => m.name === name);
    if ((byId && byId.name !== name) || (byName && byName.id !== id)) issues.push(`絆所属の名前・ID不一致: ${name} / ${id}`);
    if (!names.has(name)) issues.push(`絆所属なし: ${name}`);
    if (rumble.minions[id]?.availability.value !== true) issues.push(`絆所属と登場可否の矛盾: ${id}`);
  }
  for (const id of Object.keys(rumble.minions)) {
    if (!minions.some(m => m.id === id) && !mappedIds.has(id)) issues.push(`ランブルチェスのミニオンID不明: ${id}`);
  }
  return issues;
}
export function rumbleForMinion(rumble, id) {
  const entry = rumble.minions[id] ?? { availability: { status: 'unknown', reason: '登場可否を未確認' } };
  const deck = rumble.decks.find(d => (d.members.value || []).some(name => rumble.memberIds[name] === id));
  return { ...entry, deck };
}
export const evaluationLabel = rank => rank === '対象外' ? '-' : rank;
