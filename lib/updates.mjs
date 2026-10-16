import fs from 'node:fs';
import { z } from 'zod';
import { fact, id, calendarDate, introducedFact, minionSchema, rumbleSchema } from './schema.mjs';
import { filesIn, readYaml } from './content.mjs';
import { captainBadgeSchema, loadCaptainBadges } from './captain-badges.mjs';
const text = z.string().min(1);
const known = value => fact(value).refine(f => ['observed','manual','unknown'].includes(f.status), '確認値またはunknownが必要です');
export const targetSchema = z.object({ kind: z.enum(['minion','variant','captain','rumble-pool','other']), id, minionId: id.optional(), formId: id.optional(), name: text }).strict().superRefine((v,c)=>{
 if (['minion','variant'].includes(v.kind) && !v.minionId) c.addIssue({code:'custom',message:'ミニオンIDが必要です'});
 if (v.kind==='variant' && !v.formId) c.addIssue({code:'custom',message:'バリアントIDが必要です'});
 if (v.kind!=='variant' && v.formId) c.addIssue({code:'custom',message:'形態IDはバリアントのみ指定できます'});
 if (!['minion','variant'].includes(v.kind) && v.minionId) c.addIssue({code:'custom',message:'対象の種類とミニオンIDが不一致'});
});
export const updateSchema = z.object({
 schemaVersion:z.literal(1), id, date:known(calendarDate), title:known(text),
 note:text,
 changes:z.array(z.object({id, target:targetSchema, type:z.enum(['addition','buff','nerf','adjustment','event','other']), announcement:known(text), details:known(text), introduced:introducedFact.optional()}).strict()).min(1)
}).strict().superRefine((v,c)=>{if(new Set(v.changes.map(x=>x.id)).size!==v.changes.length)c.addIssue({code:'custom',message:'変更IDの重複'});});
export const captainSchema=z.object({schemaVersion:z.literal(1),id,name:known(text),introduced:introducedFact,effect:known(text),pendingUpdate:id.optional()}).strict();
const historyCommon = {schemaVersion:z.literal(1), id, updateId:id, changeId:id, captured:calendarDate, period:known(text)};
export const historySchema = z.discriminatedUnion('kind',[
 z.object({...historyCommon,kind:z.literal('minion'),minionId:id,formId:id,snapshot:minionSchema}).strict(),
 z.object({...historyCommon,kind:z.literal('captain-badge'),badgeId:id,snapshot:captainBadgeSchema}).strict(),
 z.object({...historyCommon,kind:z.literal('captain'),captainId:id,snapshot:captainSchema}).strict(),
 z.object({...historyCommon,kind:z.literal('rumble-pool'),snapshot:rumbleSchema}).strict()
]);
const load=(folder,schema)=> !fs.existsSync(folder)?[]:filesIn(folder).map(file=>{const v=schema.parse(readYaml(folder+'/'+file));if(file!==v.id+'.yaml')throw Error('ファイル名とIDが不一致: '+file);return v;});
export const loadUpdates=()=>load('data/updates',updateSchema).sort((a,b)=>(b.date.value||'').localeCompare(a.date.value||'')||b.id.localeCompare(a.id));
export const loadHistory=()=>load('data/history',historySchema);
export const loadCaptains=()=>load('data/captains',captainSchema);
export const additionsFor=(updates,minionId)=>updates.flatMap(u=>u.changes.filter(c=>c.type==='addition'&&c.target.minionId===minionId).map(c=>({...c,update:u})));
export const historyFor=(history,minionId,formId)=>history.filter(h=>h.kind==='minion'&&h.minionId===minionId&&h.formId===formId);
export function updateIssues(updates,history,minions,captains=[],captainBadges=loadCaptainBadges()){
 const issues=[]; const updatesById=new Map(updates.map(u=>[u.id,u]));
 const fail=s=>issues.push(s);
 const ids=new Set();
 for(const u of updates)for(const c of u.changes){
  if(c.type==='addition'){
   const key=c.target.kind+':'+(c.target.minionId||c.target.id)+':'+(c.target.formId||'');
   if(ids.has(key))fail('実装登録が重複: '+key); ids.add(key);
   if(!c.introduced)fail('追加には実装日の確認状態が必要: '+c.id);
   if(c.introduced?.value&&u.date.value&&c.introduced.value<u.date.value)fail('実装日がアップデート日より前: '+c.id);
  }else if(c.introduced)fail('追加以外に実装日を指定できません: '+c.id);
  const m=minions.find(m=>m.id===c.target.minionId);
  if(c.target.kind==='minion'&&c.type!=='addition'&&!m)fail('変更対象ミニオンなし: '+c.id);
  if(c.target.kind==='variant'&&!m)fail('バリアントの基本形なし: '+c.id);
  if(c.target.kind==='minion'&&m&&m.name!==c.target.name)fail('対象名不一致: '+c.id);
  if(c.target.kind==='variant'){
   const f=m?.variants.items.find(f=>f.id===c.target.formId);
   if(c.type!=='addition'&&!f)fail('変更対象バリアントなし: '+c.id);
   if(f&&f.name!==c.target.name)fail('バリアント名不一致: '+c.id);
   if(f&&c.introduced?.value&&f.introduced?.value!==c.introduced.value)fail('実装日不一致: '+c.id);
  }
  if(c.type==='addition'&&c.target.kind==='minion'&&m&&c.introduced?.value&&m.introduced?.value!==c.introduced.value)fail('実装日不一致: '+c.id);
  if(c.target.kind==='captain'&&!captains.some(x=>x.id===c.target.id))fail('隊長データなし: '+c.id);
 }
 const histories=new Set();
 for(const h of history){
  const u=updatesById.get(h.updateId),c=u?.changes.find(c=>c.id===h.changeId);
  if(!c)fail('履歴のアップデート参照なし: '+h.id);
  const key=h.updateId+':'+h.changeId+':'+h.kind;
  if(histories.has(key))fail('旧性能履歴の重複: '+key); histories.add(key);
  if(h.kind==='minion'){
   const m=minions.find(m=>m.id===h.minionId);
   const f=h.formId==='base'?h.snapshot.base:h.snapshot.variants.items.find(f=>f.id===h.formId);
   if(!m||!f||h.snapshot.id!==h.minionId)fail('履歴のミニオン・形態不一致: '+h.id);
   if(c&&(c.target.minionId!==h.minionId||(c.target.formId||'base')!==h.formId))fail('履歴の変更対象不一致: '+h.id);
  }else if(h.kind==='captain-badge'){
   if(c?.target.kind!=='captain'||c.target.id!==h.badgeId||h.snapshot.id!==h.badgeId||!captainBadges.some(b=>b.id===h.badgeId))fail('隊長バッジ履歴の対象不一致: '+h.id);
  }else if(h.kind==='captain'){
   if(c?.target.kind!=='captain'||c.target.id!==h.captainId||h.snapshot.id!==h.captainId||!captains.some(x=>x.id===h.captainId))fail('隊長履歴の対象不一致: '+h.id);
  }else if(c?.target.kind!=='rumble-pool')fail('履歴の種類不一致: '+h.id);
 }
 for(const m of minions)for(const f of [m.base,...m.variants.items])if(f.pendingUpdate){
  if(!updatesById.has(f.pendingUpdate))fail('確認待ちのアップデートなし: '+m.id);
  if(!history.some(h=>h.kind==='minion'&&h.minionId===m.id&&h.formId===f.id&&h.updateId===f.pendingUpdate))fail('確認待ちの旧性能履歴なし: '+m.id+'.'+f.id);
 }
 for(const m of minions)if(m.evaluation?.pendingUpdate&&!updatesById.has(m.evaluation.pendingUpdate))fail('評価のアップデート参照なし: '+m.id);
 for(const c of captains)if(c.pendingUpdate&&!updatesById.has(c.pendingUpdate))fail('隊長のアップデート参照なし: '+c.id);
 return issues;
}
