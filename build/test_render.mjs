/* Exhaustive rendering sweep.
 *
 * Renders every field of all 720 questions (shared stem, stem, options, exam
 * shortcut, every tip, every solution step) through the application's own
 * offline maths renderer inside a 360px-wide container and checks that
 *   - nothing is left as raw LaTeX or stray $ delimiters,
 *   - nothing renders empty,
 *   - nothing overflows the container horizontally (wide tables must scroll
 *     inside their own .scrollx box, not push the page wider).
 *
 * Build-time tooling only; the delivered app needs none of this.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const URL_APP = 'file://' + path.join(ROOT, 'index.html');

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto(URL_APP, { waitUntil: 'load' });
await page.waitForSelector('#app .card');

const report = await page.evaluate(() => {
  const R = window.ISSApp.render;
  const host = document.createElement('div');
  host.className = 'wrap';
  host.style.cssText = 'position:absolute;left:0;top:0;width:360px;';
  const card = document.createElement('div');
  card.className = 'card';
  host.appendChild(card);
  document.body.appendChild(host);

  const out = {
    fields: 0, questions: 0,
    leftoverTex: [], leftoverDollar: [], empty: [], overflow: [],
    maxOverflow: 0
  };

  function check(qid, label, text) {
    if (text === null || text === undefined || text === '') return;
    out.fields++;
    card.innerHTML = '<div class="qtext">' + R(text) + '</div>';
    const txt = card.textContent || '';
    if (!txt.trim()) out.empty.push(qid + '/' + label);
    if (/\\[a-zA-Z]{2,}/.test(txt) && out.leftoverTex.length < 25) {
      out.leftoverTex.push(qid + '/' + label + ': ' + txt.slice(0, 70));
    }
    if (/\$/.test(txt) && out.leftoverDollar.length < 25) {
      out.leftoverDollar.push(qid + '/' + label + ': ' + txt.slice(0, 70));
    }
    const over = card.scrollWidth - card.clientWidth;
    if (over > 1) {
      out.maxOverflow = Math.max(out.maxOverflow, over);
      if (out.overflow.length < 25) {
        out.overflow.push(qid + '/' + label + ' +' + over + 'px: ' + txt.slice(0, 60));
      }
    }
  }

  for (const q of window.quizData.concat(window.forecastData || [])) {
    out.questions++;
    check(q.id, 'sharedStem', q.sharedStem);
    check(q.id, 'question', q.question);
    (q.options || []).forEach((o, i) => check(q.id, 'opt' + i, o));
    check(q.id, 'shortcut', q.examShortcut);
    (q.tipsTricks || []).forEach((t, i) => check(q.id, 'tip' + i, t));
    (q.solution || []).forEach((s, i) => check(q.id, 'sol' + i, s.text));
  }

  host.remove();
  return out;
});

let fail = 0;
function ok(name, cond, detail) {
  if (cond) console.log('  PASS  ' + name);
  else { fail++; console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : '')); }
}

console.log('Rendered ' + report.fields + ' text fields across ' + report.questions + ' questions at 360px.\n');
ok('no leftover LaTeX commands', report.leftoverTex.length === 0, report.leftoverTex.slice(0, 8).join('\n        '));
ok('no stray $ delimiters', report.leftoverDollar.length === 0, report.leftoverDollar.slice(0, 8).join('\n        '));
ok('nothing renders empty', report.empty.length === 0, report.empty.slice(0, 8).join(', '));
ok('nothing overflows a 360px card', report.overflow.length === 0,
  'max +' + report.maxOverflow + 'px\n        ' + report.overflow.slice(0, 8).join('\n        '));
ok('no JavaScript errors', errs.length === 0, errs.slice(0, 3).join(' | '));

await browser.close();
console.log(fail ? '\nFAILED (' + fail + ')' : '\nAll rendering checks passed.');
process.exit(fail ? 1 : 0);
