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
 assert.equal(u.changes.filter(c=>c.type==='addition'&&c.target.kind==='minion').length,2);
 assert.equal(u.changes.filter(c=>c.type==='addition'&&c.target.kind==='variant').length,4);
 assert.equal(additionsFor(updates,'orchid-astrologer')[0].target.name,'オーキッド占星術師Ⅰ');
 for(const [id,formId] of [['mango-ninja','base'],['violet-mage','base'],['pakupaku-flower','variant-1']]){
  const m=minions.find(m=>m.id===id),f=formId==='base'?m.base:m.variants.items.find(f=>f.id===formId);
  const h=historyFor(history,id,formId)[0],old=formId==='base'?h.snapshot.base:h.snapshot.variants.items.find(f=>f.id===formId);
  const {pendingUpdate,introduced,...current}=f;
  assert.equal(pendingUpdate,u.id);
  assert.deepEqual(current,old);
  assert.equal(h.period.status,'unknown');
 }
 assert.equal(captains[0].effect.status,'unknown');
 assert.equal(u.changes.find(c=>c.id==='rumble-pool').details.status,'unknown');
 const broken=structuredClone(history);broken[0].changeId='missing';
 assert.match(updateIssues(updates,broken,minions,captains).join(),/参照なし/);
 const duplicate=structuredClone(updates);duplicate[0].changes.push({...duplicate[0].changes[0],id:'duplicate'});
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
