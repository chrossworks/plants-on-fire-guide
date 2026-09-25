import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRumble,loadMinions} from '../lib/content.mjs';
import {rumbleSchema} from '../lib/schema.mjs';
import {rumbleForMinion,evaluationLabel} from '../lib/rumble.mjs';
import {validate} from '../scripts/validate.mjs';

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
  assert.equal(rumbleForMinion(r,'mam-girl').star4.status,'unknown');
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
