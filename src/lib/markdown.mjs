// Markdown rendering with flex-character conditional blocks:
//
//   [[if:courtney]]
//   Lines that only exist when Courtney is cast.
//   [[/if]]
//
// Blocks must start and end on their own lines.
import { marked } from 'marked';

marked.use({ gfm: true, breaks: false });

export const IF_BLOCK = /^[ \t]*\[\[if:([a-z0-9-]+)\]\][ \t]*\r?\n([\s\S]*?)^[ \t]*\[\[\/if\]\][ \t]*$/gm;

export function applyConditionals(text, isLive) {
  return String(text ?? '').replace(IF_BLOCK, (_, id, inner) => (isLive(id) ? inner : ''));
}

export function listConditionals(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(IF_BLOCK)) out.push({ id: m[1], text: m[2].trim() });
  return out;
}

export function md(text, isLive = () => true) {
  return marked.parse(applyConditionals(text, isLive));
}

export function mdInline(text) {
  return marked.parseInline(String(text ?? ''));
}
