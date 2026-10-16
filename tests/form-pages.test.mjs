import test from 'node:test';import assert from 'node:assert/strict';
import {evaluationFor,articleFormIssues,listedForms,formPath} from '../lib/forms.mjs';
import {formEvaluationsSchema,modeEvaluationSchema,minionSchema} from '../lib/schema.mjs';
import {loadMinions} from '../lib/content.mjs';import {linkMinionNames} from '../lib/minion-links.mjs';
const make=()=>({id:'mam-girl',name:'マムガール',reading:'まむがーる',evaluation:{rank:'SS'},base:{id:'base'},variants:{items:[{id:'variant-1',name:'マムガールⅠ'},{id:'variant-2',name:'マムガールⅡ'}]}});
test('評価を旧形式・他形態・他モードから流用しない',()=>{
 const m=make();assert.equal(evaluationFor(m,'base','standard').rank,'未評価');m.base.evaluations={standard:{rank:'S',source:'memo'}};
 assert.equal(evaluationFor(m,'base','standard').rank,'S');assert.equal(evaluationFor(m,'base','rumble-chess').rank,'未評価');assert.equal(evaluationFor(m,'variant-1','standard').rank,'未評価');
 m.variants.items[0].evaluations={'rumble-chess':{rank:'未確認',reason:'調整後未確認'}};assert.equal(evaluationFor(m,'variant-1','rumble-chess').rank,'未確認');assert.equal(listedForms([m],'rumble-chess')[1].evaluation.rank,'未確認');
 assert.equal(formEvaluationsSchema.safeParse({other:{rank:'S',source:'memo'}}).success,false);
 assert.equal(modeEvaluationSchema.safeParse({rank:'S'}).success,false);assert.equal(modeEvaluationSchema.safeParse({rank:'未確認'}).success,false);
 const fresh=structuredClone(loadMinions()[0]);delete fresh.evaluation;assert.doesNotThrow(()=>minionSchema.parse(fresh));
});
test('記事を形態で対応付け、未知の形態と重複を拒否する。未執筆のバリアントは許す',()=>{
 const m=make(),article=(id,formId)=>({id,data:{kind:'minion',minionId:m.id,formId}});
 assert.deepEqual(articleFormIssues([m],[article('base',undefined)]),[]);
 assert.deepEqual(articleFormIssues([m],[article('base',undefined),article('v','variant-1')]),[]);
 assert.match(articleFormIssues([m],[article('bad','variant-9')]).join(),/存在しません/);
 assert.match(articleFormIssues([m],[article('base',undefined),article('dup','base')]).join(),/重複/);
});
test('バリアント正式名は個別ページへリンクし、基本形との前方一致や自己リンクを避ける',()=>{
 const m=make();assert.equal(formPath(m.id,'variant-1'),'minions/mam-girl/variant-1/');
 const html=linkMinionNames('<p>マムガールⅠとマムガールⅡとマムガール</p>',[m],{base:'/guide/',currentPath:'/guide/minions/mam-girl/variant-1/'});
 assert.ok(html.includes('<p>マムガールⅠと<a'));assert.ok(html.includes('href="/guide/minions/mam-girl/variant-2/"'));assert.ok(html.includes('href="/guide/minions/mam-girl/"'));
 assert.equal(listedForms([m]).length,3);
});
