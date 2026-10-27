import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMinions } from '../lib/content.mjs';
import { calendarDate, introducedFact } from '../lib/schema.mjs';
import { loadUpdates, loadHistory, loadCaptains, updateIssues, historyFor, additionsFor } from '../lib/updates.mjs';
import { collectReviewUnits, reviewIssues, reviewSummary } from '../lib/registration-review.mjs';

test('実装日は存在する年月日か未確認。なし・推定では登録しない',()=>{
 assert.equal(calendarDate.safeParse('2026-02-30').success,false);
 assert.equal(calendarDate.safeParse('2026-09-29').success,true);
 assert.equal(introducedFact.safeParse({status:'unknown',reason:'未確認'}).success,true);
 assert.equal(introducedFact.safeParse({status:'absent',reason:'なし',sources:['x']}).success,false);
});
test('9/29の新規追加・調整と旧性能を対応付け、未確認を維持する',()=>{
 const updates=loadUpdates(), history=loadHistory(), minions=loadMinions(),captains=loadCaptains();
 assert.deepEqual(updateIssues(updates,history,minions,captains),[]);
 const u=updates.find(u=>u.id==='2026-09-29-sea-rebels');
 assert.equal(u.changes.filter(c=>c.type==='addition'&&c.target.kind==='minion').length,4);
 assert.equal(u.changes.filter(c=>c.type==='addition'&&c.target.kind==='variant').length,4);
 assert.equal(additionsFor(updates,'orchid-astrologer')[0].target.name,'オーキッド占星術師Ⅰ');
 for(const [id,formId] of [['mango-ninja','base'],['violet-mage','base'],['pakupaku-flower','variant-1']]){
  const m=minions.find(m=>m.id===id),f=formId==='base'?m.base:m.variants.items.find(f=>f.id===formId);
  const h=historyFor(history,id,formId)[0],old=formId==='base'?h.snapshot.base:h.snapshot.variants.items.find(f=>f.id===formId);
  const {pendingUpdate,introduced,...current}=f;
  assert.equal(pendingUpdate,undefined);
  assert.notDeepEqual(current,old);
  assert.equal(m.evaluation.pendingUpdate,u.id);
  const changeId=formId==='base'?id:id+'-'+formId;
  assert.equal(u.changes.find(c=>c.id===changeId).details.status,'observed');
  assert.ok(f.stars.every(s=>s.ability.sources.every(source=>source.includes('-post0929-'))));
  assert.ok(old.stars.every(s=>s.ability.sources.every(source=>!source.includes('-post0929-'))));
  if(id==='mango-ninja'){assert.equal(old.stars[0].stats.interval.value,2);assert.equal(f.stars[0].stats.interval.value,1.8);}
  if(id==='pakupaku-flower'){assert.match(old.stars[0].ability.value.text,/30%/);assert.match(f.stars[0].ability.value.text,/28%/);}
  assert.equal(h.period.status,'unknown');
 }
 assert.equal(captains[0].effect.status,'unknown');
 assert.equal(u.changes.find(c=>c.id==='rumble-pool').details.status,'observed');
 const broken=structuredClone(history);broken[0].changeId='missing';
 assert.match(updateIssues(updates,broken,minions,captains).join(),/参照なし/);
 const duplicate=structuredClone(updates);duplicate.find(x=>x.id===u.id).changes.push({...u.changes.find(c=>c.type==='addition'),id:'duplicate'});
 assert.match(updateIssues(duplicate,history,minions,captains).join(),/重複/);
});
test('保存した旧性能は再監査の合格数へ加えず、改変を拒否する',()=>{
 const snapshot={name:'旧登録',fact:{status:'unknown',reason:'未撮影'}};
 assert.deepEqual(collectReviewUnits(snapshot,'/snapshot'),{'/snapshot':snapshot});
 const key='data/history/example.yaml#/snapshot',current={[key]:snapshot};
 const records={[key]:{registered:snapshot,method:'preservation',original:snapshot,originalFile:'data/minions/example.yaml',basis:'編集前正本の保存'}};
 assert.deepEqual(reviewIssues({},current,records),[]);
 const counts=reviewSummary({},current,[key],[],records);
 assert.equal(counts.preserved,1);assert.equal(counts.audited,0);
 records[key].original={name:'違う値'};
 assert.match(reviewIssues({},current,records).join(),/保存記録が不正/);
});

test('隊長本体とバッジを混同せず、バッジとチャームの旧性能を保存する',()=>{
 const history=loadHistory(),updates=loadUpdates(),captains=loadCaptains(),minions=loadMinions();
 const h=history.find(h=>h.kind==='captain-badge'&&h.badgeId==='pirate-captain');
 assert.ok(h);assert.match(h.snapshot.effect.value,/^準備完了/);
 assert.match(h.snapshot.charms[0].effect.value,/^準備完了/);
 assert.equal(captains.find(c=>c.id==='pirate-captain').effect.status,'unknown');
 assert.equal(h.snapshot.charms[0].upgradedEffect.status,'unknown');
 assert.equal(h.period.status,'unknown');
 assert.deepEqual(updateIssues(updates,history,minions,captains),[]);
 const broken=structuredClone(history);broken.find(h=>h.kind==='captain-badge').badgeId='missing';
 assert.match(updateIssues(updates,broken,minions,captains).join(),/隊長バッジ履歴の対象不一致/);
 assert.match(updateIssues(updates,[...history,h],minions,captains).join(),/旧性能履歴の重複/);
});

 test('10/27告知は実機未確認を維持し、旧性能と通常入手追加を分離する',()=>{
 const us=loadUpdates(),u=us.find(x=>x.id==='2026-10-27-trick-or-bleed'),ms=loadMinions(),hs=loadHistory();
 assert.equal(u.changes.length,38);assert.equal(u.changes.filter(c=>c.type==='addition').length,9);
 assert.ok(u.changes.every(c=>c.details.status==='unknown'));
 for(const c of u.changes.filter(c=>['minion','variant'].includes(c.target.kind)&&c.type!=='addition')){
  const m=ms.find(m=>m.id===c.target.minionId),f=c.target.formId?m.variants.items.find(f=>f.id===c.target.formId):m.base;
  assert.equal(f.pendingUpdate,u.id);
  const h=hs.find(h=>h.updateId===u.id&&h.changeId===c.id); assert.ok(h); assert.equal(h.period.status,'unknown');
  const old=c.target.formId?h.snapshot.variants.items.find(f=>f.id===c.target.formId):h.snapshot.base;
  assert.deepEqual(f.stars,old.stars);assert.deepEqual(f.initial,old.initial);
 }
 const bamboo=ms.find(m=>m.id==='bamboo-archer');
 assert.equal(bamboo.introduced.value,'2026-08-27');assert.equal(bamboo.base.pendingUpdate,u.id);
 assert.equal(u.changes.find(c=>c.id==='bamboo-archer').introduced.status,'unknown');
 assert.equal(hs.filter(h=>h.updateId===u.id).length,16);
 });
