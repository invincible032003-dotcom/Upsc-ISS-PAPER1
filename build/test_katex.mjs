/* Strict-LaTeX validation.
 *
 * Renders every $...$ / $$...$$ formula in the dataset through the vendored
 * KaTeX engine with throwOnError enabled, and reports any that fail to parse.
 * Also checks that no formula renders empty and that KaTeX's own fonts are
 * actually available (i.e. the inlined WOFF2 faces loaded).
 *
 *   node build/test_katex.mjs
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox']
});
const ctx = await browser.newContext();
const net = [];
await ctx.route('**/*', route => {
  const u = route.request().url();
  if (!u.startsWith('file://') && !u.startsWith('data:') && !u.startsWith('blob:')) {
    net.push(u); return route.abort();
  }
  return route.continue();
});
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
await page.waitForSelector('#app .card');

const report = await page.evaluate(async () => {
  const out = {
    katexPresent: typeof window.katex !== 'undefined',
    katexVersion: (window.katex && window.katex.version) || null,
    formulas: 0, display: 0, inline: 0, fields: 0,
    failures: [], empty: [], fontsLoaded: 0, fontsExpected: 0
  };
  if (!out.katexPresent) return out;

  const box = document.createElement('div');
  document.body.appendChild(box);

  const fields = [];
  for (const q of window.quizData.concat(window.forecastData || [])) {
    const push = (label, txt) => { if (txt) fields.push([q.id, label, txt]); };
    push('sharedStem', q.sharedStem);
    push('question', q.question);
    (q.options || []).forEach((o, i) => push('opt' + i, o));
    push('shortcut', q.examShortcut);
    (q.tipsTricks || []).forEach((t, i) => push('tip' + i, t));
    (q.solution || []).forEach((s, i) => push('sol' + i, s.text));
  }
  out.fields = fields.length;

  /* pull out every math segment exactly as the renderer does */
  for (const [qid, label, txt] of fields) {
    const segs = [];
    let masked = txt.replace(/\$\$([\s\S]*?)\$\$/g, (m, a) => { segs.push([a, true]); return ' '; });
    masked.replace(/\$([^$]*)\$/g, (m, a) => { segs.push([a, false]); return ' '; });
    for (const [code, display] of segs) {
      if (!code.trim()) continue;
      out.formulas++;
      if (display) out.display++; else out.inline++;
      try {
        const html = window.ISSApp.render(display ? '$$' + code + '$$' : '$' + code + '$');
        box.innerHTML = html;
        if (!box.querySelector('.katex')) {
          out.failures.push({ qid, label, code: code.slice(0, 90), error: 'no .katex produced' });
        }
        if (box.querySelector('.math-fallback')) {
          out.failures.push({ qid, label, code: code.slice(0, 90), error: 'fell back to raw text' });
        }
        if (!(box.textContent || '').trim()) {
          out.empty.push(qid + '/' + label + ': ' + code.slice(0, 60));
        }
      } catch (e) {
        out.failures.push({ qid, label, code: code.slice(0, 90), error: String(e.message || e) });
      }
    }
  }

  /* anything the renderer itself logged */
  (window.ISSApp.mathErrors() || []).forEach(e => {
    out.failures.push({ qid: '-', label: 'renderer', code: e.src.slice(0, 90), error: e.error });
  });

  box.remove();

  /* did the embedded math fonts actually load? */
  const faces = [];
  document.fonts.forEach(f => { if (/^KaTeX_/.test(f.family)) faces.push(f); });
  out.fontsExpected = faces.length;
  await document.fonts.ready;
  out.fontsLoaded = faces.filter(f => f.status === 'loaded').length;
  /* force-load the core faces so status is meaningful */
  await Promise.all(faces.slice(0, 8).map(f => f.load().catch(() => null)));
  out.fontsLoaded = faces.filter(f => f.status === 'loaded').length;
  return out;
});

let fail = 0;
function ok(name, cond, detail) {
  if (cond) console.log('  PASS  ' + name);
  else { fail++; console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : '')); }
}

console.log('KaTeX ' + (report.katexVersion || '?') + ' — ' + report.formulas +
  ' formulas (' + report.inline + ' inline, ' + report.display + ' display) in ' +
  report.fields + ' text fields\n');

ok('KaTeX is available offline from the inlined bundle', report.katexPresent);
ok('every formula parses as strict LaTeX', report.failures.length === 0,
  report.failures.slice(0, 10).map(f =>
    f.qid + '/' + f.label + ' :: ' + f.code + '  ==>  ' + f.error).join('\n        '));
ok('no formula renders empty', report.empty.length === 0,
  report.empty.slice(0, 8).join('\n        '));
ok('the embedded KaTeX math fonts load', report.fontsLoaded > 0,
  report.fontsLoaded + ' of ' + report.fontsExpected + ' faces loaded');
ok('no network requests', net.length === 0, net.slice(0, 3).join(', '));
ok('no JavaScript errors', errs.length === 0, errs.slice(0, 3).join(' | '));

await browser.close();
console.log(fail ? '\nFAILED (' + fail + ')' : '\nStrict-LaTeX validation passed.');
process.exit(fail ? 1 : 0);
