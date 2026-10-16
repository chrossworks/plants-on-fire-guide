import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRumble,loadMinions} from '../lib/content.mjs';
import {rumbleSchema} from '../lib/schema.mjs';
import {rumbleForMinion,evaluationLabel,rumbleIdentityIssues} from '../lib/rumble.mjs';
import {loadHistory} from '../lib/updates.mjs';
import {validate} from '../scripts/validate.mjs';

test('未掲載の星4を所属とID付きで保存でき、名前衝突・孤立IDを拒否する',()=>{
  const r={decks:[{members:{value:['未掲載','掲載済み']}}],memberIds:{'未掲載':'new-minion'},minions:{'new-minion':{availability:{value:true}}}};
  const published=[{id:'published',name:'掲載済み'}];
  assert.deepEqual(rumbleIdentityIssues(r,published),[]);
  assert.deepEqual(rumbleIdentityIssues(r,[...published,{id:'new-minion',name:'未掲載'}]),[]);
  assert.ok(rumbleIdentityIssues(r,[...published,{id:'different-id',name:'未掲載'}]).some(s=>s.includes('不一致')));
  assert.ok(rumbleIdentityIssues(r,[...published,{id:'new-minion',name:'別名'}]).some(s=>s.includes('不一致')));
  const orphan=structuredClone(r);orphan.memberIds={};
  assert.ok(rumbleIdentityIssues(orphan,published).some(s=>s.includes('ID不明')));
  const bad=structuredClone(r);bad.memberIds={'不明な名前':'new-minion'};
  assert.ok(rumbleIdentityIssues(bad,published).some(s=>s.includes('所属なし')));
});

test('アンナイツバキの星4と基本性能のレベル・根拠を分離する',()=>{
  const r=loadHistory().find(h=>h.kind==='rumble-pool').snapshot, rc=rumbleForMinion(r,'annai-tsubaki');
  const m=loadMinions().find(m=>m.id==='annai-tsubaki');
  assert.equal(rc.deck.bond.name.value,'雲の絆');
  assert.equal(rc.star4.value.ability.text,'購入したミニオンの攻撃力の25%を獲得する');
  assert.equal(rc.star4.value.currentLevel.value,4);
  assert.equal(rc.star4.value.guaranteedLevel.value,7);
  assert.equal(m.base.initial.attack.value,5);
  assert.equal(m.base.stars.length,3);
  assert.ok(!JSON.stringify(m).includes('rc-annai-tsubaki-star4'));
  assert.deepEqual(r.rules.bondPointsByStar.value,{'1':1,'2':2,'3':4,'4':8});
});
test('未掲載を非登場にせず、登場確認済みの未撮影星4も保持する',()=>{
  const r=loadRumble();
  assert.equal(rumbleForMinion(r,'unlisted').availability.status,'unknown');
  r.minions['annai-tsubaki'].star4={status:'unknown',reason:'未撮影の状態を検証'};
  assert.equal(rumbleForMinion(r,'annai-tsubaki').star4.status,'unknown');
  assert.doesNotThrow(()=>rumbleSchema.parse(r));
  const absent={availability:{status:'manual',value:false,sources:['user']}};
  r.minions['annai-tsubaki']=absent;
  assert.doesNotThrow(()=>rumbleSchema.parse(r));
  r.minions['annai-tsubaki'].star4={status:'unknown',reason:'test'};
  assert.throws(()=>rumbleSchema.parse(r),/非登場/);
});
test('登場確認済みの星4省略と数値の推測は拒否する',()=>{
  const r=loadRumble();
  delete r.minions['annai-tsubaki'].star4;
  assert.throws(()=>rumbleSchema.parse(r),/星4能力/);
  r.minions['annai-tsubaki'].star4={status:'unknown',reason:'未撮影',value:{}};
  assert.throws(()=>rumbleSchema.parse(r));
});
test('評価対象外を未評価と区別し、公開データの参照・矛盾を検証する',async()=>{
  assert.equal(evaluationLabel('対象外'),'-');
  assert.equal(evaluationLabel('未評価'),'未評価');
  await validate();
});

test('9/29のカードプールは形態を分離し、旧星4・所属を現行へ流用しない',()=>{
 const r=loadRumble(),ms=loadMinions(),old=loadHistory().find(h=>h.kind==='rumble-pool').snapshot;
 assert.equal(r.updateId,'2026-09-29-sea-rebels');
 assert.equal(Object.keys(r.memberIds).length,60);
 assert.equal(Object.keys(r.memberForms).length,11);
 assert.deepEqual(r.decks.map(d=>d.bond),old.decks.map(d=>d.bond));
 assert.equal(rumbleForMinion(r,'mam-girl').availability.status,'unknown');
 const variant=rumbleForMinion(r,'mam-girl','variant-1');
 assert.equal(variant.availability.value,true);assert.equal(variant.deck.id,'star');assert.equal(variant.star4.status,'observed');
 assert.deepEqual(variant.star4.sources,['rc-mam-girl-variant-1-star4-20261016']);
 assert.equal(variant.star4.value.currentLevel.value,9);
 assert.equal(variant.star4.value.guaranteedLevel.status,'unknown');
 assert.equal(rumbleForMinion(old,'mam-girl').star4.status,'observed');
 assert.equal(rumbleForMinion(old,'mam-girl','variant-1').availability.status,'unknown');
 assert.equal(rumbleForMinion(r,'kowappine','variant-1').availability.status,'unknown');
 assert.equal(rumbleForMinion(r,'kowappine','variant-2').availability.value,true);
 assert.equal(rumbleForMinion(r,'pakupaku-flower').availability.status,'unknown');
 for(const id of ['magician-cucumber','soukyo-witch']){
  const e=rumbleForMinion(r,id);assert.equal(e.deck.id,'thunder');assert.equal(e.exclusive.status,'manual');assert.equal(e.introduced.value,'2026-09-29');assert.equal(e.star4.status,'observed');assert.equal(ms.some(m=>m.id===id),true);
 }
 assert.equal(r.sharedDeck.status,'unknown');assert.equal(r.observations.length,19);
 assert.equal(r.observations.filter(o=>o.source.endsWith('-20261016')).length,11);
 assert.deepEqual(rumbleIdentityIssues(r,ms),[]);
 const broken=structuredClone(r);delete broken.memberForms['mam-girl-variant-1'];
 assert.match(rumbleIdentityIssues(broken,ms).join(),/不一致/);
 const wrongForm=structuredClone(r);wrongForm.memberForms['kowappine-variant-2'].formId='variant-1';
 assert.match(rumbleIdentityIssues(wrongForm,ms).join(),/形態不一致/);
 const wrongCards=structuredClone(r);wrongCards.decks[0].cards.value[0].name='マムガールⅠ';
 assert.match(rumbleIdentityIssues(wrongCards,ms).join(),/撮影値と所属/);
});

test('専用2体の撮影値・星4・育成効果を分離し、攻撃不可の0だけ許可する',()=>{
 const r=loadRumble(),ms=loadMinions();
 for(const id of ['magician-cucumber','soukyo-witch']){
  const m=ms.find(m=>m.id===id),entry=rumbleForMinion(r,id);
  assert.equal(m.introduced.value,entry.introduced.value);assert.equal(entry.exclusive.value,true);
  assert.equal(m.availability.ranked.value,false);assert.equal(m.evaluation.rank,'対象外');
  assert.equal(m.variants.status,'unknown');assert.equal(m.base.initial.attack.status,'unknown');assert.ok(m.base.initial.abilities.every(a=>a.status==='unknown'));
  assert.equal(m.base.stars.length,3);assert.deepEqual(m.base.bonuses.map(b=>b.level),[8,9,10,11,12]);
  assert.equal(entry.star4.value.currentLevel.value,7);assert.equal(entry.star4.value.guaranteedLevel.status,'unknown');
  const observations=r.observations.filter(o=>o.name===m.name);assert.deepEqual(observations.map(o=>o.selectedStar),[1,2,3,4]);assert.deepEqual(observations.map(o=>o.bondPoints.value),[1,2,4,8]);
 }
 const witch=ms.find(m=>m.id==='soukyo-witch');assert.ok(witch.base.stars.every(s=>s.stats.attack.value===0&&s.stats.interval.value===0&&s.stats.target.value==='攻撃不可'));
 assert.match(r.minions['soukyo-witch'].star4.value.ability.text,/10体のシールド\+12$/);
 assert.equal(witch.base.bonuses[2].effect.value.text,'味方が召喚したラッシュユニットのシールド+1');
 const magician=ms.find(m=>m.id==='magician-cucumber');assert.match(magician.base.bonuses[2].effect.value.text,/購入価格を\+2/);
 const bad=structuredClone(r);bad.observations[4].target.value='最前列';assert.throws(()=>rumbleSchema.parse(bad),/攻撃間隔0/);
 bad.observations[4].target={status:'unknown',reason:'不明'};assert.throws(()=>rumbleSchema.parse(bad),/攻撃間隔0/);
});
