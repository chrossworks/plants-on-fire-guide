export const formPath=(id,formId='base')=>'minions/'+id+'/'+(formId==='base'?'':formId+'/');
export const formsOf=m=>[m.base,...m.variants.items];
export const formName=(m,f)=>f.id==='base'?m.name:f.name;
export function evaluationFor(m,formId,mode){
 const f=formsOf(m).find(f=>f.id===formId);
 // Never inherit a score across forms or modes, including the legacy evaluation.
 return f?.evaluations?.[mode] || {rank:'未評価'};
}
export function articleFormIssues(minions,articles){
 const issues=[],seen=new Set();
 for(const a of articles){
  if(a.data.kind!=='minion'){if(a.data.formId||a.data.mode)issues.push(a.id+': 形態・モード指定はミニオン記事のみ');continue;}
  const m=minions.find(m=>m.id===a.data.minionId),formId=a.data.formId||'base',key=a.data.minionId+':'+formId;
  if(!m||!formsOf(m).some(f=>f.id===formId))issues.push(a.id+': 記事の形態が存在しません');
  if(seen.has(key))issues.push(a.id+': 形態の記事が重複しています');seen.add(key);
 }
 return issues;
}
export function listedForms(minions,mode='standard'){
 return minions.flatMap(m=>formsOf(m).map(f=>({...m,id:m.id+(f.id==='base'?'':'/'+f.id),minionId:m.id,formId:f.id,name:formName(m,f),reading:m.reading+' '+f.id,icon:f.id==='base'?m.icon:f.icon,availability:f.id==='base'?m.availability:f.availability,evaluation:evaluationFor(m,f.id,mode),evaluations:{standard:evaluationFor(m,f.id,'standard'),'rumble-chess':evaluationFor(m,f.id,'rumble-chess')}})));
}
