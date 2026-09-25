import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRumble,loadMinions} from '../lib/content.mjs';
import {rumbleSchema} from '../lib/schema.mjs';
import {rumbleForMinion,evaluationLabel,rumbleIdentityIssues} from '../lib/rumble.mjs';
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
  const r=loadRumble(), rc=rumbleForMinion(r,'annai-tsubaki');
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
  r.minions['mam-girl'].star4={status:'unknown',reason:'未撮影の状態を検証'};
  assert.equal(rumbleForMinion(r,'mam-girl').star4.status,'unknown');
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
