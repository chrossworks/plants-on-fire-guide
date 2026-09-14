import { loadAssets, loadMinions, loadKeywords } from '../../lib/content.mjs';
export const assets = loadAssets();
export const minions = loadMinions();
export const keywords = loadKeywords();
export const url = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/,'')}/${path.replace(/^\//,'')}`;
export const imageUrl = (id: string) => url(assets[id].path);
export const minionUrl = (id: string) => url(`minions/${id}/`);
export const sortedMinions = () => [...minions].sort((a,b)=> {
  const order = {legend:0,epic:1,rare:2};
  return (order[a.rarity.value] ?? 9)-(order[b.rarity.value] ?? 9) || (a.cost.value ?? 999)-(b.cost.value ?? 999) || a.reading.localeCompare(b.reading,'ja');
});
