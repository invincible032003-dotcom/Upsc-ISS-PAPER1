// Validate every $...$ / $$...$$ formula in the generated data with the vendored KaTeX (strict).
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
global.window = global; global.self = global;
const src = fs.readFileSync(path.join(root, 'src/katex.js'), 'utf8');
(new Function('window', 'self', src + '\n;window.katex = window.katex || (typeof katex!=="undefined"?katex:undefined);'))(global, global);
const katex = global.katex || global.window.katex;
if (!katex) { console.error('katex not loaded'); process.exit(2); }
const MACROS = {
  '\\dfrac': '\\displaystyle\\frac{#1}{#2}', '\\tfrac': '\\textstyle\\frac{#1}{#2}',
  '\\Var': '\\operatorname{Var}', '\\Cov': '\\operatorname{Cov}', '\\Corr': '\\operatorname{Corr}', '\\E': '\\operatorname{E}',
  '\\sgn': '\\operatorname{sgn}', '\\tr': '\\operatorname{tr}', '\\rank': '\\operatorname{rank}', '\\diag': '\\operatorname{diag}',
  '\\Bias': '\\operatorname{Bias}', '\\MSE': '\\operatorname{MSE}', '\\SE': '\\operatorname{SE}', '\\plim': '\\operatorname*{plim}',
  '\\iid': '\\overset{\\text{iid}}{\\sim}', '\\eqd': '\\overset{d}{=}', '\\convd': '\\xrightarrow{\\,d\\,}', '\\convp': '\\xrightarrow{\\,p\\,}',
  '\\indep': '\\perp\\!\\!\\!\\perp', '\\R': '\\mathbb{R}', '\\N': '\\mathbb{N}', '\\Z': '\\mathbb{Z}', '\\Prob': '\\operatorname{P}'
};
function strings(o, acc) {
  if (typeof o === 'string') acc.push(o);
  else if (Array.isArray(o)) o.forEach(x => strings(x, acc));
  else if (o && typeof o === 'object') Object.keys(o).forEach(k => strings(o[k], acc));
  return acc;
}
let bad = 0, total = 0;
const files = process.argv.slice(2);
for (const f of files) {
  const box = {}; const sandbox = { window: box };
  (new Function('window', fs.readFileSync(f, 'utf8')))(box);
  for (const k of Object.keys(box)) {
    for (const s of strings(box[k], [])) {
      let masked = s.replace(/\$\$([\s\S]*?)\$\$/g, (m, a) => { check(a, true, s); return ' '; });
      masked.replace(/\$([^$]*)\$/g, (m, a) => { check(a, false, s); return ' '; });
      if ((masked.match(/\$/g) || []).length % 2) { console.log('UNBALANCED $ in:', s.slice(0, 120)); bad++; }
    }
  }
}
function check(code, display, ctx) {
  code = code.trim(); if (!code) return; total++;
  try { katex.renderToString(code, { displayMode: display, throwOnError: true, strict: 'error', trust: false, macros: MACROS, output: 'html' }); }
  catch (e) { bad++; console.log('MATH ERROR:', String(e.message).slice(0, 140), '\n   in:', code.slice(0, 160)); }
}
console.log(`checked ${total} formulas, ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
