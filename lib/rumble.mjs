// 絆所属はdecksだけを正本とし、公開済みの名前と固定IDをmemberIdsで結ぶ。
export function rumbleForMinion(rumble, id) {
  const entry = rumble.minions[id] ?? { availability: { status: 'unknown', reason: '登場可否を未確認' } };
  const deck = rumble.decks.find(d => (d.members.value || []).some(name => rumble.memberIds[name] === id));
  return { ...entry, deck };
}
export const evaluationLabel = rank => rank === '対象外' ? '-' : rank;
