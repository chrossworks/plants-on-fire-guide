import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import { fact,minimumLevels,minionSchema,hasStandardAbsenceEvidence,rumbleSchema } from '../lib/schema.mjs';
import { transform,within } from '../scripts/image-core.mjs';
import { loadMinions,loadRumble } from '../lib/content.mjs';
import { basePerformance } from '../lib/performance.mjs';

test('バリアントも最低レベル優先で未確認項目のみ撮影値へ戻す',()=>{
  const form=structuredClone(loadMinions().find(m=>m.id==='mam-girl').variants.items[0]);
  const initial=basePerformance(form);
  assert.equal(initial.fallback.length,0);
  assert.deepEqual(initial.stars[0].stats.attack,form.initial.attack);
  assert.deepEqual(initial.stars[2].ability,form.initial.abilities[2]);
  form.initial.attack={status:'unknown',reason:'検証用'};
  form.initial.abilities[0]={status:'unknown',reason:'検証用'};
  const mixed=basePerformance(form);
  assert.equal(mixed.fallback.length,4);
  assert.deepEqual(mixed.stars[0].ability,form.stars[0].ability);
  assert.deepEqual(mixed.stars[1].ability,form.initial.abilities[1]);
});

test('最低レベル優先・項目別の撮影値補完・absent拒否',()=>{
  const m=structuredClone(loadMinions().find(m=>m.id==='orchid-astrologer'));
  for (const status of ['observed','manual','derived']) {
    m.base.initial.attack={status,value:12,sources:['user'],...(status==='derived'?{formula:'10+2',assumption:'検証用'}:{})};
    const result=basePerformance(m.base);
    assert.equal(result.stars[0].stats.attack.value,12);
    assert.equal(result.fallback.length,0);
    assert.deepEqual(result.stars[0].stats.interval,m.base.stars[0].stats.interval);
    assert.equal(m.base.stars[0].stats.attack.value,10);
  }
  m.base.initial.abilities[1]={status:'unknown',reason:'未撮影'};
  const mixed=basePerformance(m.base);
  assert.deepEqual(mixed.fallback,['星2の能力']);
  assert.deepEqual(mixed.stars[1].ability,m.base.stars[1].ability);
  assert.deepEqual(mixed.stars[0].ability,m.base.initial.abilities[0]);
  for (const field of ['attack','ability']) {
    const invalid=structuredClone(m);
    const absent={status:'absent',reason:'検証用',sources:['user']};
    if(field==='attack')invalid.base.initial.attack=absent;else invalid.base.initial.abilities[0]=absent;
    assert.throws(()=>minionSchema.parse(invalid),/initialにabsent/);
  }
});

test('バリアント非表示は通常詳細の確認時だけ不存在の根拠になる',()=>{
  const variants={status:'absent',sources:['proof'],items:[]};
  const proof={kind:'screenshot',mode:'standard',screen:'detail',variantControl:'absent'};
  assert.equal(hasStandardAbsenceEvidence(variants,{proof}),true);
  assert.equal(hasStandardAbsenceEvidence(variants,{proof:{...proof,mode:'rumble-chess'}}),false);
  assert.equal(hasStandardAbsenceEvidence(variants,{proof:{...proof,mode:'unknown'}}),false);
  assert.equal(hasStandardAbsenceEvidence(variants,{proof:{...proof,variantControl:'unconfirmed'}}),false);
  assert.equal(hasStandardAbsenceEvidence(variants,{}),false);
  const m=structuredClone(loadMinions().find(m=>m.id==='orchid-astrologer'));
  delete m.variants.sources;
  assert.throws(()=>minionSchema.parse(m));
});
test('ランブルチェスの観測は任意で、現在Lvと保証Lvを別に扱う',()=>{
  const r=loadRumble();
  assert.equal(r.observations[0].currentLevel.value,6);
  assert.equal(r.observations[0].guaranteedLevel.value,7);
  assert.doesNotThrow(()=>rumbleSchema.parse({...r,observations:[]}));
  const star4=structuredClone(r);star4.observations[0].selectedStar=4;
  assert.doesNotThrow(()=>rumbleSchema.parse(star4));
  star4.observations[0].selectedStar=5;
  assert.throws(()=>rumbleSchema.parse(star4));
});

test('未確認・不存在・逆算・人間の追記は区別される',()=>{
  const f=fact(z.number());
  assert.equal(f.parse({status:'unknown',reason:'未撮影'}).value,undefined);
  assert.equal(f.parse({status:'absent',reason:'実機で確認',sources:['user']}).status,'absent');
  assert.throws(()=>f.parse({status:'unknown',reason:'未撮影',value:0}));
  assert.throws(()=>f.parse({status:'derived',value:2,sources:['image']}));
  assert.equal(f.parse({status:'manual',value:3,sources:['user']}).value,3);
  assert.deepEqual(minimumLevels,{rare:1,epic:4,legend:7});
});
test('星の重複とバリアントなしへのデータ混入を拒否する',()=>{
  const m=loadMinions()[0];
  const duplicate=structuredClone(m);duplicate.base.stars[1].star=1;
  assert.throws(()=>minionSchema.parse(duplicate));
  const absent=structuredClone(m);absent.variants.status='absent';
  assert.throws(()=>minionSchema.parse(absent));
});
test('黒塗りは出力画素を置換し、トリミングと縮小後も残る',async()=>{
  const input=await sharp({create:{width:100,height:100,channels:3,background:'#ffffff'}}).png().toBuffer();
  const output=await transform(input,{expectedSize:[100,100],crop:{left:20,top:20,width:60,height:60},width:30,masks:[{left:30,top:30,width:30,height:30}],lossless:true});
  const {data,info}=await sharp(output).removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,30);assert.equal(info.height,30);
  const black=(10*info.width+10)*info.channels;assert.ok(data[black]<5 && data[black+1]<5 && data[black+2]<5);
  const white=(25*info.width+25)*info.channels;assert.ok(data[white]>250);
  assert.equal((await sharp(output).metadata()).format,'webp');
  await assert.rejects(()=>transform(input,{expectedSize:[200,100],crop:{left:0,top:0,width:10,height:10},width:10}),/サイズ/);
  await assert.rejects(()=>transform(input,{expectedSize:[100,100],crop:{left:90,top:0,width:20,height:20},width:10}),/矩形/);
});
test('公開画像の出力先は許可フォルダ内に限定する',()=>{
  const root=path.resolve('public');
  assert.throws(()=>within(root,'../secret.png'));
  assert.throws(()=>within(root,'images/../../secret.png'));
  assert.ok(within(root,'images/test.webp').startsWith(root));
});
test('build用入力にraw画像が不要である',()=>{
  // Production validation reads only canonical data and processed assets.
  const source=fs.readFileSync(new URL('../lib/content.mjs',import.meta.url),'utf8');
  assert.ok(!source.includes('raw-screenshots'));
});
