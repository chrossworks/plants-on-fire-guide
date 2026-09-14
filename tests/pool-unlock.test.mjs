import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMinions } from '../lib/content.mjs';
import { minionSchema } from '../lib/schema.mjs';

test('基本形の解放条件は必須で、条件なし・未確認・確認済みを区別する',()=>{
  const m=structuredClone(loadMinions().find(m=>m.id==='appolis'));
  for(const condition of [
    {status:'unknown',reason:'入手方法欄が未撮影'},
    {status:'absent',reason:'入手方法欄に解放条件の記載なし',sources:['proof']},
    {status:'observed',value:'トロフィー20',sources:['proof']}
  ]){
    m.base.poolUnlock=condition;
    assert.deepEqual(minionSchema.parse(m).base.poolUnlock,condition);
  }
  delete m.base.poolUnlock;
  assert.equal(minionSchema.safeParse(m).success,false);
});

test('バリアントに解放条件を保存しない',()=>{
  const m=structuredClone(loadMinions().find(m=>m.id==='appolis'));
  m.variants.items[0].poolUnlock={status:'unknown',reason:'対象外'};
  assert.equal(minionSchema.safeParse(m).success,false);
});
