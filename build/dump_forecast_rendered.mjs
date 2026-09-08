/* Dump the plain-text form of every FORECAST field as the application's own
 * maths renderer produces it.  build/verify_forecast_pdf.py compares the two
 * forecast PDFs against this, so the comparison is like-for-like instead of
 * raw-LaTeX-vs-typeset.
 *
 *   node build/dump_forecast_rendered.mjs   ->  build/forecast-rendered.json
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
await page.waitForSelector('#app .card');

const dump = await page.evaluate(() => {
  const R = window.ISSApp.render;
  const box = document.createElement('div');
  document.body.appendChild(box);
  const plain = s => { box.innerHTML = R(s || ''); return box.textContent || ''; };
  /* prose only: every typeset formula removed, so the ordered comparison in
     verify_forecast_pdf.py is like-for-like */
  const prose = s => {
    box.innerHTML = R(s || '');
    box.querySelectorAll('.katex, .katex-display, .mq').forEach(n => n.remove());
    return box.textContent || '';
  };
  const out = {};
  for (const q of (window.forecastData || [])) {
    out[q.id] = {
      unit: q.unit, topic: q.topic, subtopic: q.subtopic,
      question: plain(q.question),
      questionProse: prose(q.question),
      options: (q.options || []).map(plain),
      answer: q.correctAnswer,
      answerText: plain(q.options[q.correctAnswer]),
      shortcut: plain(q.examShortcut)
    };
  }
  box.remove();
  return out;
});

await browser.close();
fs.writeFileSync(path.join(ROOT, 'build', 'forecast-rendered.json'),
  JSON.stringify(dump, null, 1));
console.log('wrote build/forecast-rendered.json — ' +
  Object.keys(dump).length + ' forecast questions');
