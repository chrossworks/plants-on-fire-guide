import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRumbleBadges, rumbleBadgeSchema } from '../lib/rumble-badges.mjs';

test('ランブルバッジの種類を区別し、背景色の不一致と未確認の補完を拒否する', () => {
  const badge = structuredClone(loadRumbleBadges()[0]);
  badge.category.value = 'rumble-gold-pass';
  assert.equal(rumbleBadgeSchema.safeParse(badge).success, false);
  badge.background.value = 'red';
  assert.equal(rumbleBadgeSchema.safeParse(badge).success, true);
  badge.acquisition.value = '未確認の入手先';
  assert.equal(rumbleBadgeSchema.safeParse(badge).success, false);
});
