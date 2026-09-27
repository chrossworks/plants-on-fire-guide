import test from 'node:test';
import assert from 'node:assert/strict';
import { captainBadgeSchema, loadCaptainBadges } from '../lib/captain-badges.mjs';

test('隊長バッジは記事なしで読み込め、育成の欠落・重複を拒否する', () => {
  const badge = loadCaptainBadges().find(b => b.id === 'candle-summoner');
  assert.equal(badge.id, 'candle-summoner');
  assert.equal(badge.observedLevel.value, 1);
  assert.equal(badge.progression.maxLevel.value, 5);
  assert.equal(badge.progression.costs.status, 'unknown');
  const missing = structuredClone(badge);
  missing.progression.levels.pop();
  assert.equal(captainBadgeSchema.safeParse(missing).success, false);
  const duplicate = structuredClone(badge);
  duplicate.progression.levels.push(duplicate.progression.levels[0]);
  assert.equal(captainBadgeSchema.safeParse(duplicate).success, false);
});

test('チャームの未確認値を数値や効果で埋めることを拒否する', () => {
  const badge = loadCaptainBadges().find(b => b.id === 'candle-summoner');
  badge.charms[0].upgradedEffect.value = '推測した効果';
  assert.equal(captainBadgeSchema.safeParse(badge).success, false);
});

test('バッジとチャームの異なる撮影値・育成通貨と未確認費用を分離する', () => {
  const badge = loadCaptainBadges().find(b => b.id === 'mini-rex');
  assert.match(badge.effect.value, /\+1$/);
  assert.match(badge.charms[0].effect.value, /\+2$/);
  assert.notDeepEqual(badge.effect.sources, badge.charms[0].effect.sources);
  assert.equal(badge.progression.currency.value, 'シーズンコイン');
  assert.equal(badge.progression.costs.status, 'unknown');
  assert.equal(badge.charms[0].upgradedEffect.status, 'unknown');
});
