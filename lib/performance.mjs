// Select each initial field independently; photographed values remain intact.
export function basePerformance(form) {
  const fallback = [];
  const choose = (initial, observed, label) => {
    if (initial.status === 'absent') throw new Error('initialにabsentは指定できません');
    if (initial.status !== 'unknown') return initial;
    fallback.push(label);
    return observed;
  };
  const stars = form.stars.map(s => ({
    ...s,
    stats: {...s.stats, attack: choose(form.initial.attack,s.stats.attack,`星${s.star}の攻撃力`)},
    ability: choose(form.initial.abilities[s.star-1],s.ability,`星${s.star}の能力`)
  }));
  return {stars,fallback};
}
