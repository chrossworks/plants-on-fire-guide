import { parseFragment } from 'parse5';

const excluded = new Set(['a', 'script', 'style', 'code', 'pre', 'textarea', 'select', 'button', 'svg', 'math', 'template']);
const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Transform rendered text only, preserving attributes, scripts and existing links.
export function linkMinionNames(html, minions, { base = '/', currentPath = '' } = {}) {
  const prefix = base.replace(/\/$/, '');
  const targets = new Map(minions.map(m => [m.name, `${prefix}/minions/${m.id}/`]));
  if (!targets.size) return html;
  const names = [...targets.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const edits = [];
  function visit(node) {
    if (excluded.has(node.tagName) || node.attrs?.some(a => a.name === 'data-no-minion-links')) return;
    if (node.nodeName === '#text' && node.sourceCodeLocation) {
      let cursor = 0;
      let replacement = '';
      let changed = false;
      for (const match of node.value.matchAll(pattern)) {
        const href = targets.get(match[0]);
        replacement += escapeHtml(node.value.slice(cursor, match.index));
        if (`${currentPath.replace(/\/$/, '')}/` === href) {
          replacement += escapeHtml(match[0]);
        } else {
          replacement += `<a class="minion-reference" href="${escapeHtml(href)}">${escapeHtml(match[0])}</a>`;
          changed = true;
        }
        cursor = match.index + match[0].length;
      }
      if (changed) {
        replacement += escapeHtml(node.value.slice(cursor));
        edits.push({ ...node.sourceCodeLocation, replacement });
      }
    }
    for (const child of node.childNodes || []) visit(child);
  }
  visit(parseFragment(html, { sourceCodeLocationInfo: true }));
  // Apply backwards so offsets continue to refer to the original rendered HTML.
  for (const edit of edits.sort((a, b) => b.startOffset - a.startOffset)) {
    html = html.slice(0, edit.startOffset) + edit.replacement + html.slice(edit.endOffset);
  }
  return html;
}
