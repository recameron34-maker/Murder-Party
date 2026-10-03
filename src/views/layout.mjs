import { html, raw, toString } from '../lib/html.mjs';
import { FONTS } from './styles.mjs';

const FAVICON = "data:image/svg+xml," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#0d090f'/><path d='M14 40c6-14 18-22 32-22-3 3-4 6-4 9 4 0 7 2 9 5-6 0-10 2-13 6l-5 10-3-7c-6 0-11 0-16-1z' fill='#c9a45c'/></svg>",
);

export const RAVEN_SVG = '<svg class="raven" viewBox="0 0 64 64" width="44" height="44" aria-hidden="true"><path fill="#c9a45c" d="M8 44c7-15 20-24 36-24-3 3-5 6-5 10 5 0 9 2 12 6-7 0-12 2-16 7l-6 12-4-9c-6 0-12 0-17-2z"/><circle cx="44" cy="27" r="1.6" fill="#0d090f"/></svg>';

export function page({ title = 'Cameron Castle', css, body, bodyAttrs = '', script = '' }) {
  return (
    '<!doctype html>' +
    toString(html`<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="same-origin">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0d090f">
<title>${title}</title>
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${raw(css)}</style>
</head><body ${raw(bodyAttrs)}>${body}${script ? raw(`<script>${script}</script>`) : ''}</body></html>`)
  );
}
