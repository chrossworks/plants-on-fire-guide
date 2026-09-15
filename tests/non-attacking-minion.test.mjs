import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMinions } from '../lib/content.mjs';
import { minionSchema } from '../lib/schema.mjs';

test('攻撃不可の表示に限り攻撃間隔0を保存できる', () => {
  const m=structuredClone(loadMinions().find(m=>m.id==='lychee-baby'));
  assert.equal(minionSchema.safeParse(m).success,true);
  m.base.stars[0].stats.target.value='最前列';
  assert.equal(minionSchema.safeParse(m).success,false);
  m.base.stars[0].stats.target.value='攻撃不可';
  m.base.stars[0].stats.interval.value=-1;
  assert.equal(minionSchema.safeParse(m).success,false);
});

test('一覧アイコンの素材待ちでもミニオンを登録できる', () => {
  const m=structuredClone(loadMinions().find(m=>m.id==='lychee-baby'));
  delete m.icon;
  assert.equal(m.icon,undefined);
  assert.equal(minionSchema.safeParse(m).success,true);
  m.icon='';
  assert.equal(minionSchema.safeParse(m).success,false);
});
