import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {compositeIcon} from '../scripts/image-core.mjs';
import {listedForms} from '../lib/forms.mjs';
import {loadMinions,loadAssets} from '../lib/content.mjs';

test('合成マークは原本の指定範囲から取得し、出力の右下だけに配置する',async()=>{
 const base=await sharp({create:{width:16,height:16,channels:4,background:'#ff0000'}}).png().toBuffer();
 const source=await sharp({create:{width:8,height:8,channels:4,background:'#0000ff'}}).png().toBuffer();
 const overlay={expectedSize:[8,8],crop:{left:2,top:2,width:4,height:4},width:4,left:12,top:12,lossless:true};
 const output=await compositeIcon(base,source,overlay);
 const {data,info}=await sharp(output).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,16);assert.equal(info.height,16);
 const pixel=(x,y)=>[...data.subarray((y*16+x)*3,(y*16+x)*3+3)];
 assert.ok(pixel(0,0)[0]>245&&pixel(0,0)[2]<10,'左上の基本アイコンを維持');
 assert.ok(pixel(14,14)[2]>245&&pixel(14,14)[0]<10,'右下にマーク');
 await assert.rejects(compositeIcon(base,source,{...overlay,left:14}),/範囲外/);
 await assert.rejects(compositeIcon(base,source,{...overlay,expectedSize:[9,8]}),/原本サイズ/);
 await assert.rejects(compositeIcon(base,source,{...overlay,crop:{left:7,top:7,width:4,height:4}}),/範囲外/);
});

test('一覧は各形態で明示したアイコンだけを使い、未登録を基本形で埋めない',()=>{
 const m={id:'sample',name:'見本',reading:'みほん',icon:'base-icon',base:{id:'base'},variants:{items:[{id:'variant-1',name:'見本Ⅰ',icon:'variant-icon'},{id:'variant-2',name:'見本Ⅱ'}]}};
 const forms=listedForms([m]);
 assert.deepEqual(forms.map(f=>f.icon),['base-icon','variant-icon',undefined]);
 const assets=loadAssets();
 for(const minion of loadMinions())for(const form of minion.variants.items){
  if(form.icon)assert.ok(assets[form.icon],`${minion.id}/${form.id}: 公開画像参照`);
 }
});
