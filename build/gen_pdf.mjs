/* Phase 3 — build the four topic PDFs.
 *
 * Loads the finished offline application in Chromium, reuses its own maths
 * renderer (window.ISSApp.render) so the PDFs are typeset exactly like the
 * dashboard, then prints one A4 document per syllabus unit.
 *
 * Every question is laid out in exactly the required six parts:
 *     QUESTION -> OPTIONS -> ANSWER -> EXAM SHORTCUT -> TIPS & TRICKS
 *     -> STEP-BY-STEP SOLUTION
 *
 * Build-time tooling only.  The PDFs themselves are the deliverable.
 *
 *   node build/gen_pdf.mjs
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const URL_APP = 'file://' + path.join(ROOT, 'index.html');

const UNITS = [
  { unit: 'Probability', file: 'Probability.pdf' },
  { unit: 'Statistical Methods', file: 'Statistical_Methods.pdf' },
  { unit: 'Numerical Analysis', file: 'Numerical_Analysis.pdf' },
  { unit: 'Computer Application and Data Processing',
    file: 'Computer_Application_and_Data_Processing.pdf' }
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
                 color: #17457a; font-weight: 700; }
.cover h1 { font-size: 30pt; line-height: 1.12; margin: 6mm 0 3mm; color: #10233c; }
.cover h2 { font-size: 13pt; font-weight: 500; color: #43506a; margin: 0 0 10mm; }
.cover .rule { height: 3pt; background: #17457a; width: 46mm; margin: 0 0 9mm; }
.cover .facts { border: 1pt solid #c3ccda; border-radius: 3pt; padding: 5mm 6mm; margin-bottom: 7mm; }
.cover .facts table { width: 100%; border-collapse: collapse; font-size: 10pt; }
.cover .facts td { padding: 1.6mm 0; vertical-align: top; }
.cover .facts td:first-child { color: #5a6579; width: 46mm; }
.cover .notice { border-left: 3pt solid #b4560c; background: #fdf6ec;
                 padding: 4mm 5mm; font-size: 9.4pt; color: #5a3d12; }
.cover .notice b { color: #7a4f10; }

/* ---- contents ---- */
.toc { page-break-after: always; }
.toc h2 { font-size: 16pt; color: #10233c; border-bottom: 1.4pt solid #17457a;
          padding-bottom: 2mm; margin: 0 0 5mm; }
.toc table { width: 100%; border-collapse: collapse; font-size: 9.6pt; }
.toc th, .toc td { border-bottom: .5pt solid #dbe1ea; padding: 1.8mm 2mm; text-align: left;
                   vertical-align: top; }
.toc th { background: #eef1f6; font-size: 8.6pt; text-transform: uppercase;
          letter-spacing: .6pt; color: #43506a; border-bottom: 1pt solid #c3ccda; }
.toc td.n, .toc th.n { text-align: right; white-space: nowrap; }

/* ---- topic section ---- */
.topic { page-break-before: always; }
.topic > .th {
  border-bottom: 1.4pt solid #17457a; margin-bottom: 4mm; padding-bottom: 2mm;
}
.topic > .th .code { font-size: 9pt; font-weight: 700; letter-spacing: 1.4pt;
                     color: #17457a; text-transform: uppercase; }
.topic > .th h2 { font-size: 15pt; margin: 1mm 0 0; color: #10233c; line-height: 1.2; }
.topic > .th .meta { font-size: 8.8pt; color: #5a6579; margin-top: 1.5mm; }
.intel { background: #f2f5f9; border: .5pt solid #d3dae5; border-radius: 3pt;
         padding: 3.5mm 4mm; margin-bottom: 5mm; font-size: 9.2pt; }
.intel p { margin: 0 0 2mm; }
.intel p:last-child { margin-bottom: 0; }
.intel b { color: #17457a; }

/* ---- question block ---- */
.q { page-break-inside: auto; margin: 0 0 6mm; padding-bottom: 4mm;
     border-bottom: .5pt dashed #c9d1dd; }
.q:last-child { border-bottom: 0; }
.qhead { page-break-after: avoid; page-break-inside: avoid;
         display: flex; gap: 3mm; align-items: baseline; margin-bottom: 2mm; }
.qhead .no { font-weight: 700; font-size: 10.6pt; color: #10233c; white-space: nowrap; }
.qhead .src { font-size: 8.4pt; color: #17457a; font-weight: 700; letter-spacing: .4pt;
              border: .5pt solid #b6c4d6; border-radius: 2pt; padding: .4mm 1.6mm;
              white-space: nowrap; }
.qhead .tag { font-size: 8.2pt; color: #5a6579; }
.shared { background: #f4f6f9; border-left: 2.5pt solid #17457a; padding: 3mm 3.5mm;
          margin: 0 0 2.5mm; font-size: 9.6pt; line-height: 1.8; }
.shared .lbl { display: block; font-size: 7.8pt; font-weight: 700; letter-spacing: .8pt;
               text-transform: uppercase; color: #17457a; margin-bottom: 1.2mm; }

.sec { margin: 0 0 2.5mm; }
.sec > .lbl {
  font-size: 8pt; font-weight: 700; letter-spacing: 1.1pt; text-transform: uppercase;
  color: #17457a; margin-bottom: 1.2mm; page-break-after: avoid;
}
.sec > .lbl .ai { color: #8a6100; font-weight: 600; letter-spacing: .3pt;
                  text-transform: none; font-size: 7.6pt; }
.sec.src > .lbl { color: #10233c; }
.qtext { font-size: 10.4pt; line-height: 1.75; }
ol.opts { list-style: none; margin: 0; padding: 0; }
ol.opts > li { display: flex; gap: 2.2mm; align-items: baseline;
               margin: 0 0 1.8mm; line-height: 1.85; }
ol.opts > li .k { flex: 0 0 auto; width: 7mm; font-weight: 700; }
ol.opts > li .v { flex: 1 1 auto; min-width: 0; }
.answer { background: #eaf3ed; border: .5pt solid #9dc9ae; border-radius: 3pt;
          padding: 3mm; font-size: 10pt; line-height: 1.85; }
.answer .big { font-weight: 700; color: #14612f; font-size: 11pt; }
.answer.none { background: #fbeaea; border-color: #dfa9a9; }
.answer.none .big { color: #9c1f1f; }
.shortcut { background: #f7f9fc; border: .5pt solid #d3dae5; border-radius: 3pt;
            padding: 2.5mm 3mm; font-size: 9.8pt; line-height: 1.6; }
ul.tips { margin: 0; padding-left: 5mm; font-size: 9.8pt; line-height: 1.6; }
ul.tips > li { margin-bottom: 1.2mm; }
ol.steps { margin: 0; padding-left: 6mm; font-size: 9.8pt; line-height: 1.6; }
ol.steps > li { margin-bottom: 1.2mm; }
.srcnote { background: #fdf6ec; border: .5pt solid #e0c68a; border-radius: 3pt;
           padding: 2.5mm 3mm; font-size: 9pt; color: #6b4a12; margin: 0 0 2.5mm; }
.srcnote b { color: #8a6100; }

/* ---- maths (classes produced by the app's renderer) ---- */
.mq { font-family: "DejaVu Serif", "Liberation Serif", "Times New Roman", serif; }
.mq-block { display: block; text-align: center; margin: 1.5mm 0; }
.mq i.v { font-style: italic; }
.mq .op { font-style: normal; padding: 0 .1em; }
.mq sup, .mq sub { font-size: .72em; line-height: 0; position: relative; }
.mq sup { top: -.48em; }
.mq sub { bottom: -.22em; }
.mfrac { display: inline-flex; flex-direction: column; vertical-align: middle;
         text-align: center; margin: 0 .18em; line-height: 1.18; }
.mfrac > .n { display: block; padding: 0 .25em; border-bottom: .5pt solid currentColor; font-size: .92em; }
.mfrac > .d { display: block; padding: 0 .25em; font-size: .92em; }
.mbinom { display: inline-flex; flex-direction: column; vertical-align: middle;
          text-align: center; margin: 0 .1em; line-height: 1.1; font-size: .92em; }
.mroot { display: inline-block; }
.mroot > .bod { border-top: .5pt solid currentColor; padding: 0 .18em 0 .1em; }
.mover { display: inline-block; border-top: .5pt solid currentColor; padding-top: .3pt; }
.mcases { display: inline-flex; align-items: center; vertical-align: middle; }
.mcases > .brace { font-size: 2.1em; line-height: .8; margin-right: .12em; font-weight: 300; }
.mcases table, .mmat table { border-collapse: collapse; }
.mcases td { padding: .2mm 2mm .2mm 0; text-align: left; vertical-align: middle; }
.mmat { display: inline-flex; align-items: center; vertical-align: middle; }
.mmat > .b { font-size: 1.9em; line-height: .85; font-weight: 300; }
.mmat td { padding: .2mm 1.6mm; text-align: center; }
.mbig { font-size: 1.3em; line-height: 1; vertical-align: -.14em; }
.msp { display: inline-block; width: .45em; }
table.qtbl { border-collapse: collapse; margin: 1.5mm 0; font-size: 9.2pt; }
table.qtbl th, table.qtbl td { border: .5pt solid #b6c4d6; padding: .8mm 2.2mm; text-align: center; }
table.qtbl th { background: #eef1f6; font-weight: 700; }
.scrollx { overflow: visible; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: .92em; }
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
    const META = window.quizMeta;
    const E = s => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const LET = ['a', 'b', 'c', 'd'];

    const qs = window.quizData
      .filter(q => q.unit === unit)
      .sort((a, b) => {
        const ta = a.topicCode, tb = b.topicCode;
        const na = parseInt(ta.slice(1), 10), nb = parseInt(tb.slice(1), 10);
        if (na !== nb) return na - nb;
        return a.year - b.year || a.questionNumber - b.questionNumber;
      });

    const tax = META.taxonomy[unit];
    const years = META.years;

    /* per-topic grouping, in syllabus (topic-code) order */
    const groups = [];
    let cur = null;
    qs.forEach(q => {
      if (!cur || cur.code !== q.topicCode) {
        cur = { code: q.topicCode, name: q.topic, items: [] };
        groups.push(cur);
      }
      cur.items.push(q);
    });

    const perYear = {};
    years.forEach(y => { perYear[y] = qs.filter(q => q.year === y).length; });
    const defects = qs.filter(q => q.sourceIssue);
    const unkeyed = qs.filter(q => q.correctAnswer === null || q.correctAnswer === undefined);

    /* ---------------- cover ---------------- */
    let h = '<div class="pdfwrap">';
    h += '<section class="cover">' +
      '<div class="kicker">UPSC ISS &middot; Statistics Paper-I &middot; Objective</div>' +
      '<h1>' + E(unit) + '</h1>' +
      '<div class="rule"></div>' +
      '<h2>Every previous-year question from 2018 to 2026, with answer, exam shortcut, ' +
      'tips &amp; tricks and a step-by-step solution.</h2>' +
      '<div class="facts"><table><tbody>' +
      '<tr><td>Questions in this volume</td><td><b>' + qs.length + '</b> of ' +
        META.totalQuestions + ' across the four units</td></tr>' +
      '<tr><td>Papers covered</td><td>' + years.length + ' &mdash; ' + years[0] + ' to ' +
        years[years.length - 1] + '</td></tr>' +
      '<tr><td>Per paper</td><td>' + years.map(y => y + ': ' + perYear[y]).join(' &nbsp;&middot;&nbsp; ') +
        '</td></tr>' +
      '<tr><td>Syllabus topics</td><td>' + groups.length + '</td></tr>' +
      '<tr><td>Syllabus concepts</td><td>' +
        Object.keys(qs.reduce((o, q) => { o[q.subtopic] = 1; return o; }, {})).length + '</td></tr>' +
      '<tr><td>Layout of every entry</td><td>QUESTION &rarr; OPTIONS &rarr; ANSWER &rarr; ' +
        'EXAM SHORTCUT &rarr; TIPS &amp; TRICKS &rarr; STEP-BY-STEP SOLUTION</td></tr>' +
      '<tr><td>Dataset version</td><td>' + E(META.datasetVersion) + '</td></tr>' +
      '</tbody></table></div>' +
      '<div class="notice">' +
      '<p><b>What is authentic and what is not.</b> The questions and their four options are ' +
      'reproduced word for word from the original UPSC ISS Statistics Paper-I booklets. Wording, ' +
      'option text, option order and question numbers are unaltered.</p>' +
      '<p><b>None of the source booklets carried an official answer key.</b> Every ANSWER, EXAM ' +
      'SHORTCUT, TIPS &amp; TRICKS note and STEP-BY-STEP SOLUTION in this volume was worked out ' +
      'for this project and is marked <i>AI-derived explanation</i> where it appears. They are a ' +
      'study aid, not an official UPSC solution.</p>' +
      (defects.length ? '<p><b>Source defects.</b> ' + defects.length + ' question(s) in this ' +
        'volume have a defect in the printed paper. None has been silently corrected: the original ' +
        'text is reproduced exactly and the problem is described under the question' +
        (unkeyed.length ? '. ' + unkeyed.length + ' of them has no valid option at all and is ' +
          'therefore left unkeyed rather than guessed.' : '.') + '</p>' : '') +
      '</div></section>';

    /* ---------------- contents ---------------- */
    h += '<section class="toc"><h2>Contents</h2>' +
      '<table><thead><tr><th class="n">Code</th><th>Syllabus topic</th>' +
      '<th class="n">Questions</th><th class="n">Papers hit</th></tr></thead><tbody>';
    groups.forEach(g => {
      const yrs = {};
      g.items.forEach(q => { yrs[q.year] = 1; });
      h += '<tr><td class="n">' + E(g.code) + '</td><td>' + E(g.name) + '</td>' +
        '<td class="n">' + g.items.length + '</td>' +
        '<td class="n">' + Object.keys(yrs).length + ' / ' + years.length + '</td></tr>';
    });
    h += '<tr><th class="n">&nbsp;</th><th>Total</th><th class="n">' + qs.length +
      '</th><th class="n">&nbsp;</th></tr></tbody></table>';

    h += '<h2 style="margin-top:8mm">Questions per paper</h2>' +
      '<table><thead><tr><th>Paper</th><th class="n">Questions from this unit</th>' +
      '<th>Source file</th></tr></thead><tbody>';
    years.forEach(y => {
      h += '<tr><td>' + y + '</td><td class="n">' + perYear[y] + '</td><td>' +
        E(META.sourceFiles[y]) + '</td></tr>';
    });
    h += '</tbody></table></section>';

    /* ---------------- topic sections ---------------- */
    groups.forEach(g => {
      const intel = (META.topicIntel || {})[g.code];
      const yrs = {};
      g.items.forEach(q => { yrs[q.year] = (yrs[q.year] || 0) + 1; });
      h += '<section class="topic"><div class="th">' +
        '<div class="code">' + E(g.code) + ' &middot; ' + E(unit) + '</div>' +
        '<h2>' + E(g.name) + '</h2>' +
        '<div class="meta">' + g.items.length + ' question' + (g.items.length === 1 ? '' : 's') +
        ' &middot; ' + years.map(y => y + ': ' + (yrs[y] || 0)).join('  ') + '</div>' +
        '</div>';
      if (intel) {
        h += '<div class="intel">' +
          '<p><b>Weight.</b> ' + E(intel.weight) + '</p>' +
          '<p><b>Examiner’s pattern.</b> ' + E(intel.pattern) + '</p>' +
          '<p><b>Must-know.</b> ' + E(intel.mustKnow) + '</p></div>';
      }

      g.items.forEach((q, i) => {
        h += '<div class="q">';
        h += '<div class="qhead"><span class="no">' + (i + 1) + '.</span>' +
          '<span class="src">' + q.year + ' &middot; Q' + q.questionNumber + '</span>' +
          '<span class="tag">' + E(q.subtopic) + ' &middot; ' + E(q.questionType) + '</span></div>';

        if (q.sharedStem) {
          h += '<div class="shared"><span class="lbl">Common data for this group</span>' +
            R(q.sharedStem) + '</div>';
        }

        /* 1 QUESTION */
        h += '<div class="sec src"><div class="lbl">Question</div>' +
          '<div class="qtext">' + R(q.question) + '</div></div>';

        /* 2 OPTIONS */
        h += '<div class="sec src"><div class="lbl">Options</div>';
        if (q.options && q.options.length) {
          h += '<ol class="opts">';
          q.options.forEach((o, k) => {
            h += '<li><span class="k">(' + LET[k] + ')</span>' +
              '<span class="v">' + R(o) + '</span></li>';
          });
          h += '</ol>';
        } else {
          h += '<div class="srcnote">The four options for this question are absent from the ' +
            'source scan (a page break in the original booklet falls here). Nothing has been ' +
            'invented to fill the gap.</div>';
        }
        h += '</div>';

        /* 3 ANSWER */
        const keyed = q.correctAnswer !== null && q.correctAnswer !== undefined;
        h += '<div class="sec"><div class="lbl">Answer <span class="ai">' +
          '(AI-derived — no official key exists for this paper)</span></div>' +
          '<div class="answer' + (keyed ? '' : ' none') + '">';
        if (keyed) {
          h += '<span class="big">(' + LET[q.correctAnswer] + ')</span> &nbsp;' +
            R(q.options[q.correctAnswer]);
        } else {
          h += '<span class="big">Not keyed.</span> &nbsp;No option in the printed paper is ' +
            'correct for this item; see the source note below.';
        }
        h += '</div></div>';

        if (q.sourceIssue) {
          h += '<div class="srcnote"><b>Source note.</b> ' + E(q.sourceIssue) + '</div>';
        }

        /* 4 EXAM SHORTCUT */
        h += '<div class="sec"><div class="lbl">Exam shortcut <span class="ai">' +
          '(AI-derived explanation)</span></div>' +
          '<div class="shortcut">' + R(q.examShortcut) + '</div></div>';

        /* 5 TIPS & TRICKS */
        h += '<div class="sec"><div class="lbl">Tips &amp; tricks <span class="ai">' +
          '(AI-derived explanation)</span></div><ul class="tips">';
        (q.tipsTricks || []).forEach(t => { h += '<li>' + R(t) + '</li>'; });
        h += '</ul></div>';

        /* 6 STEP-BY-STEP SOLUTION */
        h += '<div class="sec"><div class="lbl">Step-by-step solution <span class="ai">' +
          '(AI-derived explanation)</span></div><ol class="steps">';
        (q.solution || []).forEach(s => { h += '<li>' + R(s.text) + '</li>'; });
        h += '</ol></div>';

        h += '</div>';
      });
      h += '</section>';
    });

    h += '</div>';

    document.title = unit + ' — UPSC ISS Statistics Paper-I PYQs 2018–2026';
    document.head.querySelectorAll('link,style').forEach(n => n.remove());
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    document.body.innerHTML = h;

    return {
      questions: qs.length,
      topics: groups.length,
      subtopics: Object.keys(qs.reduce((o, q) => { o[q.subtopic] = 1; return o; }, {})).length,
      defects: defects.length,
      unkeyed: unkeyed.length,
      perYear: perYear
    };
  }, { unit: spec.unit, css: PRINT_CSS });

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
      '<span>UPSC ISS Statistics Paper-I &middot; ' + spec.unit + '</span>' +
      '<span>Authentic PYQs 2018–2026</span></div>',
    footerTemplate:
      '<div style="font-size:7pt;color:#7a8496;width:100%;padding:0 14mm;' +
      'font-family:sans-serif;display:flex;justify-content:space-between;">' +
      '<span>Questions authentic &middot; answers and explanations AI-derived, not an official UPSC key</span>' +
      '<span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });

  const kb = fs.statSync(out).size / 1024;
  summary.push({ file: spec.file, unit: spec.unit, kb, ...built });
  console.log('  wrote ' + spec.file.padEnd(46) +
    String(built.questions).padStart(4) + ' questions ' +
    String(built.topics).padStart(3) + ' topics ' + kb.toFixed(0).padStart(6) + ' KB');

  /* reload a clean copy of the app for the next unit */
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
console.log('TOTAL QUESTIONS ACROSS THE FOUR PDFs: ' + total);
summary.forEach(s => {
  console.log('  ' + s.file.padEnd(46) + String(s.questions).padStart(4) + ' q  ' +
    String(s.defects).padStart(2) + ' flagged defect(s)  ' + s.unkeyed + ' unkeyed');
});
console.log('='.repeat(72));
fs.writeFileSync(path.join(ROOT, 'build', 'pdf-summary.json'),
  JSON.stringify(summary, null, 1));
process.exit(errs.length ? 1 : 0);
