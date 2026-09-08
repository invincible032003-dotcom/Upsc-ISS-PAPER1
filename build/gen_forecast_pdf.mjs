/* Build the two FORECAST PDFs.
 *
 * Loads the finished offline application in Chromium and reuses its own maths
 * renderer (window.ISSApp.render), so every formula is typeset by the same
 * embedded KaTeX engine that the dashboard uses.
 *
 * Each entry is laid out in exactly the four required parts:
 *     QUESTION -> OPTIONS -> ANSWER -> EXAM SHORTCUT
 *
 * The content is AI-GENERATED forecast practice for the 2027 attempt and is
 * labelled as such on the cover, in the running footer and on every entry.
 * It is drawn from window.forecastData, never from the authentic PYQ bank.
 *
 *   node build/gen_forecast_pdf.mjs
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const URL_APP = 'file://' + path.join(ROOT, 'index.html');

const UNITS = [
  { unit: 'Probability', file: 'Probability_Forecast.pdf' },
  { unit: 'Statistical Methods', file: 'Statistical_Methods_Forecast.pdf' }
];

const PRINT_CSS = `
@page { size: A4; margin: 16mm 14mm 18mm 14mm; }
* { box-sizing: border-box; }
html, body { background: #fff !important; color: #111 !important; margin: 0; padding: 0; }
body {
  font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
  font-size: 10.2pt; line-height: 1.45;
}
.pdfwrap { max-width: 100%; }

/* ---- cover ---- */
.cover { page-break-after: always; padding-top: 24mm; }
.cover .kicker { font-size: 11pt; letter-spacing: 2.4pt; text-transform: uppercase;
                 color: #8a4a09; font-weight: 700; }
.cover h1 { font-size: 30pt; line-height: 1.12; margin: 6mm 0 3mm; color: #10233c; }
.cover h2 { font-size: 13pt; font-weight: 500; color: #43506a; margin: 0 0 10mm; }
.cover .rule { height: 3pt; background: #b4560c; width: 46mm; margin: 0 0 9mm; }
.cover .facts { border: 1pt solid #c3ccda; border-radius: 3pt; padding: 5mm 6mm; margin-bottom: 7mm; }
.cover .facts table { width: 100%; border-collapse: collapse; font-size: 10pt; }
.cover .facts td { padding: 1.6mm 0; vertical-align: top; }
.cover .facts td:first-child { color: #5a6579; width: 50mm; }
.cover .notice { border-left: 3pt solid #b4560c; background: #fdf6ec;
                 padding: 4mm 5mm; font-size: 9.4pt; color: #5a3d12; }
.cover .notice b { color: #7a4f10; }
.cover .stamp { display: inline-block; border: 1.4pt solid #b4560c; color: #8a4a09;
                border-radius: 3pt; padding: 2mm 4mm; font-size: 10pt; font-weight: 700;
                letter-spacing: 1.2pt; margin-bottom: 8mm; }

/* ---- contents ---- */
.toc { page-break-after: always; }
.toc h2 { font-size: 16pt; color: #10233c; border-bottom: 1.4pt solid #b4560c;
          padding-bottom: 2mm; margin: 0 0 5mm; }
.toc table { width: 100%; border-collapse: collapse; font-size: 9.6pt; }
.toc th, .toc td { border-bottom: .5pt solid #dbe1ea; padding: 1.8mm 2mm; text-align: left;
                   vertical-align: top; }
.toc th { background: #fbf1e4; font-size: 8.6pt; text-transform: uppercase;
          letter-spacing: .6pt; color: #6b4a1e; border-bottom: 1pt solid #e0c8a8; }
.toc td.n, .toc th.n { text-align: right; white-space: nowrap; }

/* ---- topic section ---- */
.topic { page-break-before: always; }
.topic > .th { border-bottom: 1.4pt solid #b4560c; margin-bottom: 4mm; padding-bottom: 2mm; }
.topic > .th .code { font-size: 8.4pt; letter-spacing: 1.4pt; text-transform: uppercase;
                     color: #8a4a09; font-weight: 700; }
.topic > .th h2 { font-size: 17pt; margin: 1mm 0 1mm; color: #10233c; }
.topic > .th .meta { font-size: 8.8pt; color: #5a6579; }

/* ---- one question ---- */
.q { break-inside: avoid; page-break-inside: avoid; border: .6pt solid #d7dde6;
     border-radius: 3pt; padding: 3.4mm 4mm; margin-bottom: 4mm; }
.qhead { display: flex; gap: 3mm; align-items: baseline; font-size: 8.6pt;
         color: #5a6579; margin-bottom: 2mm; flex-wrap: wrap; }
.qhead .no { font-weight: 700; color: #10233c; font-size: 10pt; }
.qhead .src { background: #fbf1e4; color: #8a4a09; border: .5pt solid #e0c8a8;
              border-radius: 2pt; padding: .3mm 1.6mm; font-weight: 700; }
.qhead .tag { color: #5a6579; }
.sec { margin-top: 2.4mm; }
.sec .lbl { font-size: 7.8pt; letter-spacing: 1pt; text-transform: uppercase;
            color: #6b7688; font-weight: 700; margin-bottom: 1mm; }
.sec .lbl .ai { letter-spacing: 0; text-transform: none; font-weight: 400;
                color: #8a4a09; font-size: 7.8pt; }
.qtext { font-size: 10.4pt; }
ol.opts { list-style: none; margin: 0; padding: 0; }
ol.opts > li { display: flex; gap: 2.4mm; align-items: baseline;
               padding: .8mm 0; line-height: 1.7; }
ol.opts > li .k { font-weight: 700; color: #43506a; min-width: 7mm; }
ol.opts > li .v { flex: 1; }
.answer { background: #eef7ef; border: .6pt solid #bcd9c1; border-radius: 2pt;
          padding: 2mm 3mm; line-height: 1.7; }
.answer .big { font-weight: 700; color: #1d6b32; font-size: 11pt; }
.shortcut { background: #f6f8fb; border-left: 2.4pt solid #17457a;
            padding: 2mm 3mm; line-height: 1.65; }

/* wide content must scroll inside its own box, never break the page box */
.qtext, .answer, .shortcut, ol.opts > li .v { overflow-wrap: anywhere; }
.katex { font-size: 1.02em; }
.katex-display { margin: 1.2mm 0; }
`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(URL_APP, { waitUntil: 'load' });
await page.waitForSelector('#app .card');

const summary = [];

for (const spec of UNITS) {
  const built = await page.evaluate(({ unit, css }) => {
    const R = window.ISSApp.render;
    const FMETA = window.forecastMeta;
    const E = s => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const LET = ['a', 'b', 'c', 'd'];

    const qs = window.forecastData
      .filter(q => q.unit === unit)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    /* group by topic, in first-appearance order */
    const groups = [];
    const byTopic = {};
    qs.forEach(q => {
      if (!byTopic[q.topic]) {
        byTopic[q.topic] = { name: q.topic, items: [] };
        groups.push(byTopic[q.topic]);
      }
      byTopic[q.topic].items.push(q);
    });
    groups.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    const mocks = FMETA.mocks.filter(m => m.unit === unit);
    const subs = Object.keys(qs.reduce((o, q) => { o[q.subtopic] = 1; return o; }, {}));

    /* ---------------- cover ---------------- */
    let h = '<div class="pdfwrap">';
    h += '<section class="cover">' +
      '<div class="kicker">UPSC ISS &middot; Statistics Paper-I &middot; 2027 forecast</div>' +
      '<h1>' + E(unit) + '</h1>' +
      '<div class="rule"></div>' +
      '<div class="stamp">FORECAST &middot; AI-GENERATED &middot; NOT PREVIOUS-YEAR QUESTIONS</div>' +
      '<h2>Every forecast problem in this unit, with its verified answer and a ' +
      '~30-second exam shortcut.</h2>' +
      '<div class="facts"><table><tbody>' +
      '<tr><td>Forecast problems here</td><td><b>' + qs.length + '</b> of ' +
        FMETA.total + ' across the two units</td></tr>' +
      '<tr><td>Named forecast mocks</td><td>' + mocks.length + ', of exactly ' +
        FMETA.mockSize + ' questions each</td></tr>' +
      '<tr><td>Topics covered</td><td>' + groups.length + '</td></tr>' +
      '<tr><td>Concepts covered</td><td>' + subs.length + '</td></tr>' +
      '<tr><td>Layout of every entry</td><td>QUESTION &rarr; OPTIONS &rarr; ANSWER &rarr; ' +
        'EXAM SHORTCUT</td></tr>' +
      '</tbody></table></div>' +
      '<div class="notice">' +
      '<p><b>These are not previous-year questions.</b> Every stem, every option, every answer ' +
      'and every exam shortcut in this volume was written for this project as forecast practice ' +
      'for the 2027 attempt. Nothing here is reproduced from a UPSC paper and no official UPSC ' +
      'key exists for any of it.</p>' +
      '<p><b>Kept separate from the PYQ bank.</b> The authentic 2018&ndash;2026 questions live in ' +
      'their own four volumes and in their own array inside the offline dashboard. Forecast ' +
      'material never enters a year, sectional, topic, subtopic or custom PYQ mock.</p>' +
      '<p><b>Answers were verified.</b> Each key was worked out and independently re-checked ' +
      'during the build, but they remain a study aid, not an official key.</p>' +
      '</div></section>';

    /* ---------------- contents ---------------- */
    h += '<section class="toc"><h2>Contents</h2>' +
      '<table><thead><tr><th>Topic</th><th class="n">Problems</th>' +
      '<th class="n">Concepts</th></tr></thead><tbody>';
    groups.forEach(g => {
      const ss = Object.keys(g.items.reduce((o, q) => { o[q.subtopic] = 1; return o; }, {}));
      h += '<tr><td>' + E(g.name) + '</td><td class="n">' + g.items.length +
        '</td><td class="n">' + ss.length + '</td></tr>';
    });
    h += '<tr><th>Total</th><th class="n">' + qs.length + '</th><th class="n">' +
      subs.length + '</th></tr></tbody></table>';

    h += '<h2 style="margin-top:8mm">Named forecast mocks</h2>' +
      '<table><thead><tr><th>Mock</th><th class="n">Questions</th>' +
      '<th class="n">Topics</th></tr></thead><tbody>';
    mocks.forEach(m => {
      h += '<tr><td>' + E(m.name) + '</td><td class="n">' + m.count +
        '</td><td class="n">' + m.topics.length + '</td></tr>';
    });
    h += '</tbody></table></section>';

    /* ---------------- topic sections ---------------- */
    groups.forEach(g => {
      const ss = Object.keys(g.items.reduce((o, q) => { o[q.subtopic] = 1; return o; }, {}));
      h += '<section class="topic"><div class="th">' +
        '<div class="code">Forecast &middot; ' + E(unit) + '</div>' +
        '<h2>' + E(g.name) + '</h2>' +
        '<div class="meta">' + g.items.length + ' forecast problem' +
        (g.items.length === 1 ? '' : 's') + ' &middot; ' + ss.length + ' concept' +
        (ss.length === 1 ? '' : 's') + '</div></div>';

      g.items.forEach((q, i) => {
        h += '<div class="q">';
        h += '<div class="qhead"><span class="no">' + (i + 1) + '.</span>' +
          '<span class="src">FORECAST &middot; ' + E(q.id) + '</span>' +
          '<span class="tag">' + E(q.subtopic) + '</span></div>';

        /* 1 QUESTION */
        h += '<div class="sec"><div class="lbl">Question</div>' +
          '<div class="qtext">' + R(q.question) + '</div></div>';

        /* 2 OPTIONS */
        h += '<div class="sec"><div class="lbl">Options</div><ol class="opts">';
        q.options.forEach((o, k) => {
          h += '<li><span class="k">(' + LET[k] + ')</span>' +
            '<span class="v">' + R(o) + '</span></li>';
        });
        h += '</ol></div>';

        /* 3 ANSWER */
        h += '<div class="sec"><div class="lbl">Answer <span class="ai">' +
          '(AI-generated forecast item &mdash; no official UPSC key exists)</span></div>' +
          '<div class="answer"><span class="big">(' + LET[q.correctAnswer] + ')</span> &nbsp;' +
          R(q.options[q.correctAnswer]) + '</div></div>';

        /* 4 EXAM SHORTCUT */
        h += '<div class="sec"><div class="lbl">Exam shortcut <span class="ai">' +
          '(AI-generated explanation)</span></div>' +
          '<div class="shortcut">' + R(q.examShortcut) + '</div></div>';

        h += '</div>';
      });
      h += '</section>';
    });

    h += '</div>';

    document.title = unit + ' — UPSC ISS Statistics Paper-I 2027 Forecast (AI-generated)';
    document.head.querySelectorAll('link,style').forEach(n => {
      if (n.id !== 'katex-css') n.remove();
    });
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    document.body.innerHTML = h;

    return {
      questions: qs.length,
      topics: groups.length,
      subtopics: subs.length,
      mocks: mocks.length
    };
  }, { unit: spec.unit, css: PRINT_CSS });

  await page.evaluate(async () => {
    const faces = [];
    document.fonts.forEach(f => faces.push(f));
    await Promise.all(faces.map(f => f.load().catch(() => null)));
    await document.fonts.ready;
  });
  await page.waitForTimeout(400);

  const out = path.join(ROOT, spec.file);
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate:
      '<div style="font-size:7pt;color:#7a8496;width:100%;padding:0 14mm;' +
      'font-family:sans-serif;display:flex;justify-content:space-between;">' +
      '<span>UPSC ISS Statistics Paper-I &middot; ' + spec.unit + ' &middot; 2027 Forecast</span>' +
      '<span>AI-GENERATED &mdash; not previous-year questions</span></div>',
    footerTemplate:
      '<div style="font-size:7pt;color:#7a8496;width:100%;padding:0 14mm;' +
      'font-family:sans-serif;display:flex;justify-content:space-between;">' +
      '<span>FORECAST / AI-GENERATED &middot; not a UPSC paper and not an official UPSC key</span>' +
      '<span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });

  const kb = fs.statSync(out).size / 1024;
  summary.push({ file: spec.file, unit: spec.unit, kb, ...built });
  console.log('  wrote ' + spec.file.padEnd(34) +
    String(built.questions).padStart(4) + ' questions ' +
    String(built.topics).padStart(3) + ' topics ' + kb.toFixed(0).padStart(6) + ' KB');

  await page.goto(URL_APP, { waitUntil: 'load' });
  await page.waitForSelector('#app .card');
}

await browser.close();

if (errs.length) {
  console.log('\nJavaScript errors during generation:');
  errs.slice(0, 5).forEach(e => console.log('  ' + e));
}

const total = summary.reduce((a, s) => a + s.questions, 0);
console.log('\n' + '='.repeat(72));
console.log('TOTAL FORECAST QUESTIONS ACROSS THE TWO PDFs: ' + total);
summary.forEach(s => {
  console.log('  ' + s.file.padEnd(34) + String(s.questions).padStart(4) + ' q  ' +
    String(s.mocks).padStart(2) + ' named mock(s)  ' + s.topics + ' topics');
});
console.log('='.repeat(72));
fs.writeFileSync(path.join(ROOT, 'build', 'forecast-pdf-summary.json'),
  JSON.stringify(summary, null, 1));
process.exit(errs.length ? 1 : 0);
