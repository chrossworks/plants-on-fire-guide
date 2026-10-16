// memberIds identifies a card; memberForms explicitly identifies its variant.
export function rumbleIdentityIssues(rumble, minions) {
  const issues = [], mappedIds = new Set(), forms = new Set();
  const names = new Set(rumble.decks.flatMap(d => d.members.value || []));
  for (const [name, id] of Object.entries(rumble.memberIds)) {
    if (mappedIds.has(id)) issues.push(`ランブルチェスのミニオンID重複: ${id}`);
    mappedIds.add(id);
    const ref=rumble.memberForms?.[id];
    if(ref){
      const m=minions.find(m=>m.id===ref.minionId), f=m?.variants?.items.find(f=>f.id===ref.formId);
      if(!f || f.name!==name || id===ref.minionId) issues.push(`絆所属の形態不一致: ${name} / ${id}`);
      const key=ref.minionId+':'+ref.formId;
      if(forms.has(key)) issues.push(`絆所属の形態重複: ${key}`);
      forms.add(key);
    }else{
      const byId = minions.find(m => m.id === id), byName = minions.find(m => m.name === name);
      if ((byId && byId.name !== name) || (byName && byName.id !== id) || minions.some(m=>m.variants?.items.some(f=>f.name===name))) issues.push(`絆所属の名前・ID不一致: ${name} / ${id}`);
    }
    if (!names.has(name)) issues.push(`絆所属なし: ${name}`);
    if (rumble.minions[id]?.availability.value !== true) issues.push(`絆所属と登場可否の矛盾: ${id}`);
  }
  for (const id of Object.keys(rumble.memberForms||{})) if(!mappedIds.has(id)) issues.push(`絆所属の形態ID不明: ${id}`);
  for (const id of Object.keys(rumble.minions)) {
    if (!minions.some(m => m.id === id) && !mappedIds.has(id)) issues.push(`ランブルチェスのミニオンID不明: ${id}`);
  }
  for(const d of rumble.decks){
    if(d.cards?.value && JSON.stringify(d.cards.value.map(c=>c.name))!==JSON.stringify(d.members.value)) issues.push(`カード撮影値と所属の不一致: ${d.id}`);
  }
  return issues;
}
export function rumbleForMinion(rumble, id, formId='base') {
  const cardId=formId==='base'?id:Object.entries(rumble.memberForms||{}).find(([,r])=>r.minionId===id&&r.formId===formId)?.[0];
  const entry = rumble.minions[cardId] ?? { availability: { status: 'unknown', reason: 'この形態の登場可否は未確認。共有デッキを含む全構成は未確認です。' } };
  const deck = cardId && rumble.decks.find(d => (d.members.value || []).some(name => rumble.memberIds[name] === cardId));
  return { ...entry, deck };
}
export const evaluationLabel = rank => rank === '対象外' ? '-' : rank;
