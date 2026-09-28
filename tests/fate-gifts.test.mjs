import test from 'node:test';
import assert from 'node:assert/strict';
import { fateGiftSchema, loadFateGifts } from '../lib/fate-gifts.mjs';

test('運命のギフトはラウンド4・7・10を区別し、解放条件なしと未確認を保持する', () => {
  const gift = structuredClone(loadFateGifts()[0]);
  for (const value of [4, 7, 10]) {
    gift.round.value = value;
    assert.equal(fateGiftSchema.safeParse(gift).success, true);
  }
  gift.round.value = 5;
  assert.equal(fateGiftSchema.safeParse(gift).success, false);
  gift.round.value = 4;
  gift.unlock = {status:'absent',reason:'解放条件の表示なし',sources:['example']};
  assert.equal(fateGiftSchema.safeParse(gift).success, true);
  gift.unlock.value = 0;
  assert.equal(fateGiftSchema.safeParse(gift).success, false);
  gift.unlock = {status:'unknown',reason:'条件欄が未撮影'};
  assert.equal(fateGiftSchema.safeParse(gift).success, true);
  gift.unlock.value = 'なし';
  assert.equal(fateGiftSchema.safeParse(gift).success, false);
});
