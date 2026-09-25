import test from 'node:test';
import assert from 'node:assert/strict';
import { linkMinionNames } from '../lib/minion-links.mjs';

const minions = [{ id: 'mam-girl', name: 'マムガール' }, { id: 'avogaku', name: 'アボガク' }];
const link = '<a class="minion-reference" href="/minions/avogaku/">アボガク</a>';

test('文章・表・強調内をリンク化し、自分自身はリンクしない', () => {
  const html = '<h1>マムガール</h1><p>マムガールと<strong>アボガク</strong>。アボガクなど。</p><table><tbody><tr><td>アボガク</td></tr></tbody></table>';
  const result = linkMinionNames(html, minions, { currentPath: '/minions/mam-girl/' });
  assert.equal(result, html.replaceAll('アボガク', link));
  assert.equal(linkMinionNames(result, minions, { currentPath: '/minions/mam-girl/' }), result);
});

test('既存リンク・属性・コード・操作欄・スクリプトを保護', () => {
  const html = '<a href="/existing/">アボガク</a><img alt="アボガク"><code>アボガク</code><pre>アボガク</pre><button>アボガク</button><select><option>アボガク</option></select><script>const name = "アボガク";</script><!-- アボガク --><span data-no-minion-links>アボガク</span>';
  assert.equal(linkMinionNames(html, minions), html);
});

test('長い正式名優先・サブパス・HTMLエスケープ・未登録名', () => {
  const entries = [...minions, { id: 'long', name: 'アボガク王' }];
  assert.equal(linkMinionNames('<p>アボガク王 &amp; アボガク &lt;未登録&gt;</p>', entries, { base: '/guide/' }),
    '<p><a class="minion-reference" href="/guide/minions/long/">アボガク王</a> &amp; <a class="minion-reference" href="/guide/minions/avogaku/">アボガク</a> &lt;未登録&gt;</p>');
  assert.equal(linkMinionNames('<p>アボガク王</p>', entries, { base: '/guide/', currentPath: '/guide/minions/long/' }), '<p>アボガク王</p>');
  assert.equal(linkMinionNames('<p>未登録</p>', []), '<p>未登録</p>');
});
