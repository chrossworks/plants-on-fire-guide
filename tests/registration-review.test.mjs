import test from 'node:test';
import assert from 'node:assert/strict';
import { collectReviewUnits, readingValue, reviewIssues, reviewKeys, reviewSummary } from '../lib/registration-review.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { stringify } from 'yaml';

const fact = { status: 'observed', value: 'トロフィー数550個で解放', sources: ['detail'] };
const record = { registered: fact, first: readingValue(fact), second: readingValue(fact), context: '対象A、ラウンド10', evidence: [{ source: 'detail' }] };
test('変更・追加・削除を拾い、既存未変更値を再確認済みと扱わない', () => {
  assert.equal(reviewIssues({ old: fact }, { old: fact, added: fact }, {}).length, 1);
  assert.equal(reviewIssues({ old: fact }, {}, {}).length, 1);
  assert.deepEqual(reviewIssues({}, { added: fact }, { added: record }), []);
});
test('不一致と確認後の変更を止める', () => {
  assert.match(reviewIssues({}, { a: fact }, { a: { ...record, second: { status: 'absent' } } }).join(), /一致/);
  assert.match(reviewIssues({}, { a: { ...fact, value: '1800' } }, { a: record }).join(), /変更/);
});
test('なしには全領域確認、未確認には保留理由が必要', () => {
  const absent = { status: 'absent', sources: ['detail'] };
  const checked = { ...record, registered: absent, first: readingValue(absent), second: readingValue(absent) };
  assert.match(reviewIssues({}, { a: absent }, { a: checked }).join(), /領域全体/);
  assert.deepEqual(reviewIssues({}, { a: absent }, { a: { ...checked, fullRegionVisible: true } }), []);
  const unknown = { status: 'unknown', reason: '画面が切れている' };
  assert.deepEqual(reviewIssues({}, { a: unknown }, { a: { registered: unknown, holdReason: '追加撮影待ち' } }), []);
});
test('項目別抽出は配列の星・Lvや通常の名前も含む', () => {
  const units = collectReviewUnits({ name: 'A', updated: 'today', stars: [{ star: 1, ability: fact }] });
  assert.equal(units['/name'], 'A');
  assert.equal(units['/stars/0/star'], 1);
  assert.deepEqual(units['/stars/0/ability'], fact);
  assert.equal(units['/updated'], undefined);
});
test('管理値・評価は元メモ根拠を使えるがobservedの画像確認は省けない', () => {
  assert.deepEqual(reviewIssues({}, { a: 'A' }, { a: { registered: 'A', first: 'A', second: 'A', context: '評価', basis: '元メモの評価欄' } }), []);
  assert.match(reviewIssues({}, { a: fact }, { a: { ...record, evidence: [], basis: '元メモ' } }).join(), /原本/);
});

test('未変更の対象も検証し、保留・未記録・対象外を監査済みに数えない', () => {
  const unknown = { status: 'unknown', reason: '未撮影' };
  const current = { good: fact, missing: fact, held: unknown, untouched: fact };
  const records = { good: record, held: { registered: unknown, holdReason: '追加撮影待ち' } };
  const targets = ['good', 'missing', 'held', 'typo', 'good'];
  const keys = reviewKeys(current, current, records, targets);
  const issues = reviewIssues(current, current, records, targets);
  assert.deepEqual(reviewSummary(current, current, keys, issues), {
    total: 4, targeted: 4, audited: 1, unchangedAudited: 1, changedAudited: 0,
    held: 1, pending: 2, deleted: 0, untargeted: 1,
  });
  assert.match(issues.join(), /項目が存在しません/);
  assert.match(reviewIssues(current, current, { good: { ...record, second: '誤読' } }).join(), /一致/);
});

test('実行フローで未確認を止め、原本照合票を生成し、確認後の原本変更を拒否する', async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'registration-review-'));
  const script = path.resolve('scripts/registration-review.mjs');
  const run = mode => spawnSync(process.execPath, [script, mode], { cwd, encoding: 'utf8' });
  const write = (file, value) => fs.writeFileSync(path.join(cwd, file), stringify(value));
  try {
    for (const dir of ['data', 'work', 'raw-screenshots']) fs.mkdirSync(path.join(cwd, dir));
    write('data/sources.yaml', { detail: { kind: 'screenshot' } });
    write('work/sources.yaml', { detail: { path: 'test.png', status: 'confirmed' } });
    write('data/example.yaml', { unlock: { status: 'unknown', reason: '未撮影' } });
    const original = path.join(cwd, 'raw-screenshots/test.png');
    await sharp({ create: { width: 20, height: 20, channels: 3, background: 'white' } }).png().toFile(original);
    assert.equal(run('init').status, 0);
    assert.notEqual(run('init').status, 0);
    write('data/example.yaml', { unlock: fact });
    assert.notEqual(run('check').status, 0);
    const evidence = { source: 'detail', sha256: createHash('sha256').update(fs.readFileSync(original)).digest('hex'), region: { left: 0, top: 0, width: 20, height: 20 } };
    write('work/registration/checks.yaml', { 'data/example.yaml#/unlock': { ...record, evidence: [evidence] } });
    const checked = run('check');
    assert.equal(checked.status, 0, checked.stderr);
    assert.ok(fs.existsSync(path.join(cwd, 'work/registration/crop-0-0.png')));
    assert.match(fs.readFileSync(path.join(cwd, 'work/registration/review.html'), 'utf8'), /550/);
    write('work/registration/targets.yaml', ['data/example.yaml#/unlock']);
    assert.equal(run('accept').status, 0);
    // Accept moves the baseline, but the retained record must still be checked and counted.
    assert.equal(run('check').status, 0);
    const result = JSON.parse(fs.readFileSync(path.join(cwd, 'work/registration/result.json'), 'utf8'));
    assert.equal(result.changed, 0);
    assert.equal(result.summary.unchangedAudited, 1);
    const archive = fs.readdirSync(path.join(cwd, 'work/registration')).find(name => name.startsWith('accepted-'));
    assert.ok(fs.existsSync(path.join(cwd, 'work/registration', archive, 'result.json')));
    fs.appendFileSync(original, 'changed');
    assert.notEqual(run('accept').status, 0);
    assert.match(run('check').stderr, /SHA256/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
