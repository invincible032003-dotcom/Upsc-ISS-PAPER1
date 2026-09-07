/* Dump the plain-text form of every question field as the application's own
 * maths renderer produces it.  build/verify_pdf.py compares the PDFs against
 * this, so the comparison is like-for-like instead of raw-LaTeX-vs-typeset.
 *
 *   node build/dump_rendered.mjs      ->  build/rendered.json
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
  /* The same text with raised and lowered runs removed.  pypdf's default
     extraction mode drops anything off the baseline, so the ordered
     comparison in verify_pdf.py needs a like-for-like reference.  KaTeX
     typesets scripts as positioned .msupsub boxes rather than <sup>/<sub>. */
  const base = s => {
    box.innerHTML = R(s || '');
    box.querySelectorAll('sup, sub, .msupsub').forEach(n => n.remove());
    return box.textContent || '';
  };
  /* prose only: every typeset formula removed.  A PDF text extractor places
     the glyphs of a formula wherever the layout puts them, so only the prose
     around them can be checked for document order. */
  const prose = s => {
    box.innerHTML = R(s || '');
    box.querySelectorAll('.katex, .katex-display, .mq').forEach(n => n.remove());
    return box.textContent || '';
  };
  const out = {};
  for (const q of window.quizData) {
    out[q.id] = {
      year: q.year, qno: q.questionNumber, unit: q.unit, topicCode: q.topicCode,
      sharedStem: plain(q.sharedStem),
      question: plain(q.question),
      questionBase: base(q.question),
      questionProse: prose(q.question),
      options: (q.options || []).map(plain),
      optionsBase: (q.options || []).map(base),
      answer: q.correctAnswer,
      answerText: q.correctAnswer === null || q.correctAnswer === undefined
        ? null : plain(q.options[q.correctAnswer]),
      shortcut: plain(q.examShortcut),
      tips: (q.tipsTricks || []).map(plain),
      solution: (q.solution || []).map(s => plain(s.text)),
      issue: q.sourceIssue || ''
    };
  }
  box.remove();
  return out;
});

await browser.close();
fs.writeFileSync(path.join(ROOT, 'build', 'rendered.json'),
  JSON.stringify(dump, null, 1));
console.log('wrote build/rendered.json — ' + Object.keys(dump).length + ' questions');
