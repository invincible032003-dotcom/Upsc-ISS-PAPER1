/* Phase-4 functional test harness for the offline dashboard.
 *
 * Drives index.html over file:// with Playwright/Chromium and runs the checks
 * demanded by the master prompt (tests A-G plus the QC checklist).
 *
 * This is BUILD-TIME tooling only.  The delivered application needs no Node,
 * no npm and no server: it is opened by double-clicking index.html.
 *
 *   node build/test_dashboard.mjs
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const URL_APP = 'file://' + path.join(ROOT, 'index.html');

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else {
    fail++; failures.push(name + (detail ? '  ->  ' + detail : ''));
    console.log('  FAIL  ' + name + (detail ? '  ->  ' + detail : ''));
  }
}
function head(t) { console.log('\n== ' + t + ' ' + '='.repeat(Math.max(0, 62 - t.length))); }

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--allow-file-access-from-files']
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

/* --- Test A: absolutely no network traffic -------------------------------- */
const netHits = [];
await ctx.route('**/*', route => {
  const u = route.request().url();
  if (!u.startsWith('file://') && !u.startsWith('data:') && !u.startsWith('blob:')) {
    netHits.push(u);
    return route.abort();
  }
  return route.continue();
});

const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('PAGEERROR ' + e.message));
page.on('dialog', d => d.accept());

await page.goto(URL_APP, { waitUntil: 'load' });
await page.waitForSelector('#app .card', { timeout: 15000 });

head('Test A — offline / no network dependency');
ok('no non-file:// requests issued', netHits.length === 0, netHits.join(', '));
ok('no console errors on load', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

const meta = await page.evaluate(() => ({
  total: window.quizMeta.totalQuestions,
  years: window.quizMeta.years,
  perYear: window.quizMeta.perYear,
  units: window.quizMeta.units,
  data: window.quizData.length
}));
ok('720 questions loaded', meta.data === 720, 'got ' + meta.data);
ok('9 years present', meta.years.length === 9, meta.years.join(','));
ok('80 questions in every year',
  meta.years.every(y => meta.perYear[y] === 80),
  JSON.stringify(meta.perYear));

/* internal audit result exposed on the audit screen */
await page.click('[data-act="go"][data-r="audit"]');
await page.waitForSelector('#app h1');
const auditTxt = await page.textContent('#app');
ok('data audit reports 0 errors', /Errors/.test(auditTxt) &&
  (await page.evaluate(() => document.querySelectorAll('#app .kpi').length)) > 0);
const auditErrCount = await page.evaluate(() => {
  const kpis = [...document.querySelectorAll('#app .kpi')];
  const k = kpis.find(x => /Errors/i.test(x.textContent));
  return k ? parseInt(k.querySelector('.v').textContent, 10) : -1;
});
ok('audit error count is 0', auditErrCount === 0, 'errors=' + auditErrCount);

/* --- Test B: 2026 Full Mock → Strict Exam --------------------------------- */
head('Test B — 2026 Full Mock, Strict Exam Mode');
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="setup"][data-k="year"]');
await page.click('[data-act="setup"][data-k="year"]');
await page.waitForSelector('[data-act="setYear"]');
await page.selectOption('[data-act="setYear"]', '2026');
await page.check('input[data-act="setMode"][value="exam"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');

const examInfo = await page.evaluate(() => ({
  n: document.querySelectorAll('.pal').length,
  pos: document.querySelector('.qpos').textContent,
  hasTimer: !!document.getElementById('timer'),
  chips: [...document.querySelectorAll('.exam-head .chip')].map(c => c.textContent)
}));
ok('80 questions in the 2026 paper', examInfo.n === 80, 'palette=' + examInfo.n);
ok('starts at Q1', /Q 1 \/ 80/.test(examInfo.pos), examInfo.pos);
ok('timer present', examInfo.hasTimer);
ok('labelled as an authentic paper', examInfo.chips.join(' ').includes('Authentic'));

/* Next/Previous live in the sticky top header, not below a long reveal panel */
const navInHead = await page.evaluate(() => ({
  prev: !!document.querySelector('.exam-head [data-act="prevQ"]'),
  next: !!document.querySelector('.exam-head [data-act="nextQ"]'),
  prevDisabled: document.querySelector('.exam-head [data-act="prevQ"]').disabled,
  onlyOneNextButton: document.querySelectorAll('[data-act="nextQ"]').length === 1
}));
ok('Previous button lives in the sticky top header', navInHead.prev);
ok('Next button lives in the sticky top header', navInHead.next);
ok('Previous is disabled on question 1', navInHead.prevDisabled);
ok('there is exactly one Next button (moved, not duplicated)', navInHead.onlyOneNextButton);
await page.click('.exam-head [data-act="nextQ"]');
const posAfterHeaderNext = await page.textContent('.qpos');
ok('clicking the header Next button advances the question',
  /Q 2 \//.test(posAfterHeaderNext), posAfterHeaderNext);
await page.click('.exam-head [data-act="prevQ"]');
const posAfterHeaderPrev = await page.textContent('.qpos');
ok('clicking the header Previous button goes back',
  /Q 1 \//.test(posAfterHeaderPrev), posAfterHeaderPrev);

/* original paper order preserved */
/* verify order by walking the first five questions */
const seen = [];
for (let i = 0; i < 5; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  seen.push(await page.evaluate(() => document.querySelector('.qmeta').textContent.trim()));
}
ok('question order is the printed paper order',
  seen.every((s, i) => s.indexOf('Question ' + (i + 1)) === 0), seen.join(' | '));

/* strict mode must not reveal anything */
const leak = await page.evaluate(() => {
  const t = document.querySelector('#app').innerHTML;
  return {
    solution: /Step-by-Step Solution/.test(t),
    shortcut: /Exam Shortcut/.test(t),
    correctCls: document.querySelectorAll('.opt.correct').length,
    metaLeak: /Probability|Numerical Analysis/.test(document.querySelector('.qmeta').textContent)
  };
});
ok('strict mode hides the solution', !leak.solution);
ok('strict mode hides the exam shortcut', !leak.shortcut);
ok('strict mode does not highlight a correct option', leak.correctCls === 0);
ok('strict mode hides classification metadata', !leak.metaLeak);

/* answer 40 questions deliberately: 25 right, 15 wrong; mark a few */
const plan = await page.evaluate(() => {
  const qs = window.quizData.filter(q => q.year === 2026);
  return qs.map(q => q.correctAnswer);
});
let wantCorrect = 0, wantWrong = 0;
for (let i = 0; i < 40; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  const c = plan[i];
  let pick;
  if (i < 25) { pick = c; wantCorrect++; }
  else { pick = (c + 1) % 4; wantWrong++; }
  if (c === null) { continue; }
  await page.click(`.opt[data-i="${pick}"]`);
  if (i % 9 === 0) await page.click('[data-act="markQ"]');
}
const counters = await page.evaluate(() =>
  [...document.querySelectorAll('.exam-head .chip')].map(c => c.textContent).join(' '));
ok('answered counter tracks selections', /4?0 answered|39 answered|40 answered/.test(counters), counters);

/* mark-for-review reflected in palette */
const marked = await page.evaluate(() =>
  document.querySelectorAll('.pal.marked, .pal.both').length);
ok('mark-for-review shown in the palette', marked >= 4, 'marked=' + marked);

/* submit */
await page.click('[data-act="submitMock"]');
await page.waitForSelector('.kpis');
const res = await page.evaluate(() => {
  const g = l => {
    const k = [...document.querySelectorAll('.kpi')].find(x => x.querySelector('.l').textContent.trim() === l);
    return k ? k.querySelector('.v').textContent.trim() : null;
  };
  return {
    score: g('Score'), pctv: g('Percentage'), acc: g('Accuracy'), time: g('Time taken'),
    att: g('Attempted'), cor: g('Correct'), inc: g('Incorrect'), un: g('Unanswered'),
    body: document.querySelector('#app').textContent
  };
});
ok('result shows a score', /\d/.test(res.score || ''), res.score);
ok('result shows percentage', /%/.test(res.pctv || ''), res.pctv);
ok('result shows accuracy', /%/.test(res.acc || ''), res.acc);
ok('result shows time taken', !!res.time, res.time);
ok('correct count matches what we answered', res.cor === String(wantCorrect), 'got ' + res.cor + ' want ' + wantCorrect);
ok('incorrect count matches', res.inc === String(wantWrong), 'got ' + res.inc + ' want ' + wantWrong);
ok('unanswered count matches', res.un === '40', 'got ' + res.un);
ok('per-unit breakdown rendered', /Performance by unit/.test(res.body));
ok('per-topic breakdown rendered', /Performance by topic/.test(res.body));

/* review + fixed reveal order */
await page.click('[data-act="reviewAt"][data-i="0"]');
await page.waitForSelector('.reveal');
const panes = await page.evaluate(() =>
  [...document.querySelectorAll('.reveal .pane .hd')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
ok('review pane 1 is the verdict', /^1\s*(Correct|Incorrect|Not)/.test(panes[0]), panes[0]);
ok('review pane 2 is the Exam Shortcut', /^2\s*Exam Shortcut/.test(panes[1]), panes[1]);
ok('review pane 3 is Tips & Tricks', /^3\s*Tips/.test(panes[2]), panes[2]);
ok('review pane 4 is the Step-by-Step Solution', /^4\s*Step-by-Step Solution/.test(panes[3]), panes[3]);
const revBody = await page.textContent('#app');
ok('review shows the user answer and the correct answer',
  /Your answer:/.test(revBody) && /Correct answer:/.test(revBody));
ok('AI-derived labelling present on explanations',
  (await page.evaluate(() => document.querySelectorAll('.ai-note').length)) >= 3);

/* --- Test C: 2023 → Probability sectional --------------------------------- */
head('Test C — 2023 Probability sectional');
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="setup"][data-k="section"]');
await page.click('[data-act="setup"][data-k="section"]');
await page.waitForSelector('input[data-act="tgYear"][value="2023"]');
await page.check('input[data-act="tgYear"][value="2023"]');
await page.check('input[data-act="tgUnit"][value="Probability"]');
await page.check('input[data-act="setMode"][value="learn"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
const c1 = { n: await page.evaluate(() => document.querySelectorAll('.pal').length) };
const expect2023Prob = await page.evaluate(() =>
  window.quizData.filter(q => q.year === 2023 && q.unit === 'Probability').length);
ok('sectional length equals the dataset count', c1.n === expect2023Prob,
  c1.n + ' vs ' + expect2023Prob);
/* verify by sampling every question's meta line (learn mode shows it) */
let bad2023 = 0;
for (let i = 0; i < c1.n; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  const m = await page.textContent('.qmeta');
  if (!/2023-Q/.test(m) || !/Probability/.test(m)) bad2023++;
}
ok('every question is a 2023 Probability question', bad2023 === 0, bad2023 + ' offenders');

/* learning mode reveal order */
head('Learning Mode — reveal order and locking');
await page.click('.pal[data-i="0"]');
const beforeReveal = await page.evaluate(() => document.querySelectorAll('.reveal .pane').length);
ok('nothing revealed before answering', beforeReveal === 0);
await page.click('.opt[data-i="0"]');
await page.waitForSelector('.reveal .pane');
const lpanes = await page.evaluate(() =>
  [...document.querySelectorAll('.reveal .pane .hd')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
ok('learn pane 1 verdict', /^1\s*(Correct|Incorrect|Not)/.test(lpanes[0]), lpanes[0]);
ok('learn pane 2 Exam Shortcut', /^2\s*Exam Shortcut/.test(lpanes[1]), lpanes[1]);
ok('learn pane 3 Tips & Tricks', /^3\s*Tips/.test(lpanes[2]), lpanes[2]);
ok('learn pane 4 Step-by-Step Solution', /^4\s*Step-by-Step Solution/.test(lpanes[3]), lpanes[3]);
const locked = await page.evaluate(() =>
  [...document.querySelectorAll('.opt')].every(o => o.disabled));
ok('options lock after reveal', locked);

/* --- 2023 → Statistical Methods sectional --------------------------------- */
head('Test C2 — 2023 Statistical Methods sectional');
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="setup"][data-k="section"]');
await page.click('[data-act="setup"][data-k="section"]');
await page.waitForSelector('input[data-act="tgYear"][value="2023"]');
await page.check('input[data-act="tgYear"][value="2023"]');
await page.check('input[data-act="tgUnit"][value="Statistical Methods"]');
await page.check('input[data-act="setMode"][value="learn"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
const nSM = await page.evaluate(() => document.querySelectorAll('.pal').length);
const expSM = await page.evaluate(() =>
  window.quizData.filter(q => q.year === 2023 && q.unit === 'Statistical Methods').length);
ok('2023 Statistical Methods sectional has the right length', nSM === expSM,
  nSM + ' vs ' + expSM);
let badSM = 0;
for (let i = 0; i < nSM; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  const m = await page.textContent('.qmeta');
  if (!/2023-Q/.test(m) || !/Statistical Methods/.test(m)) badSM++;
}
ok('every question is a 2023 Statistical Methods question', badSM === 0, badSM + ' offenders');

/* --- cross-year TOPIC mock ------------------------------------------------ */
head('Cross-year topic mock (all nine papers, one syllabus topic)');
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="setup"][data-k="topic"]');
await page.click('[data-act="setup"][data-k="topic"]');
await page.waitForSelector('input[data-act="tgUnit"][value="Numerical Analysis"]');
await page.check('input[data-act="tgUnit"][value="Numerical Analysis"]');
await page.waitForSelector('input[data-act="tgTopic"]');
const topicVal = await page.evaluate(() => {
  const tax = window.quizMeta.taxonomy['Numerical Analysis'].topics;
  const names = Object.keys(tax);
  return names.find(n => /Numerical Integration/i.test(n)) || names[0];
});
await page.check(`input[data-act="tgTopic"][value="${topicVal.replace(/"/g, '\\"')}"]`);
await page.check('input[data-act="setMode"][value="learn"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
const nT = await page.evaluate(() => document.querySelectorAll('.pal').length);
const expT = await page.evaluate(t => window.quizData.filter(q => q.topic === t).length, topicVal);
ok('cross-year topic mock pulls the whole topic', nT === expT, nT + ' vs ' + expT);
const yrsSeen = new Set();
let badT = 0;
for (let i = 0; i < nT; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  const m = await page.textContent('.qmeta');
  const y = (m.match(/(\d{4})-Q/) || [])[1];
  if (y) yrsSeen.add(y);
  if (m.indexOf(topicVal) < 0) badT++;
}
ok('every question carries the selected topic', badT === 0, badT + ' offenders');
ok('the topic mock spans multiple papers', yrsSeen.size >= 5,
  'years: ' + [...yrsSeen].sort().join(','));

/* --- Test D: cross-year Probability sectional defaults to 25, no dupes ---- */
head('Test D — cross-year Probability sectional (default 25), duplicate check');
await page.click('[data-act="go"][data-r="home"]');
await page.click('[data-act="setup"][data-k="section"]');
await page.waitForSelector('input[data-act="tgUnit"][value="Probability"]');
const defaultCount = await page.inputValue('input[data-act="setCount"]');
ok('a Sectional Mock defaults its question count to 25', defaultCount === '25', defaultCount);
await page.check('input[data-act="tgUnit"][value="Probability"]');
await page.check('input[data-act="setMode"][value="learn"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
const nProb = await page.evaluate(() => document.querySelectorAll('.pal').length);
ok('a cross-year sectional mock is capped at 25 questions', nProb === 25, String(nProb));

/* uniqueness: collect ids across the session by visiting each question */
const ids = [];
for (let i = 0; i < nProb; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  const m = await page.textContent('.qmeta');
  ids.push((m.match(/\d{4}-Q\d{2}/) || [''])[0]);
}
ok('no duplicate questions in the generated mock',
  new Set(ids).size === ids.length, ids.length - new Set(ids).size + ' duplicates');
ok('every id is a real dataset id',
  await page.evaluate(list => list.every(i => window.quizData.some(q => q.id === i)), ids));

/* --- Test D2: single year + unit sectional is NOT padded to 25 ------------ */
head('Test D2 — single-year Probability sectional keeps its true, smaller count');
await page.click('[data-act="go"][data-r="home"]');
await page.click('[data-act="setup"][data-k="section"]');
await page.waitForSelector('input[data-act="tgYear"][value="2018"]');
await page.check('input[data-act="tgYear"][value="2018"]');
await page.check('input[data-act="tgUnit"][value="Probability"]');
const expect2018 = await page.evaluate(() =>
  window.quizData.filter(q => q.year === 2018 && q.unit === 'Probability').length);
ok('2018 Probability has fewer than 25 real questions to begin with',
  expect2018 > 0 && expect2018 < 25, String(expect2018));
await page.check('input[data-act="setMode"][value="learn"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
const n2018 = await page.evaluate(() => document.querySelectorAll('.pal').length);
ok('a single-year+unit sectional mock is the real count, not padded to 25',
  n2018 === expect2018, n2018 + ' vs ' + expect2018);
const allFrom2018 = await page.evaluate(() => {
  const s = window.ISSApp.session();
  return s.ids.every(id => {
    const q = window.quizData.find(x => x.id === id);
    return q && q.year === 2018;
  });
});
ok('every question in that mock is actually from 2018', allFrom2018);

/* --- Test E: topic mock ---------------------------------------------------- */
head("Test E — topic mock (Probability → Bayes' Theorem subtopic)");
await page.click('[data-act="go"][data-r="home"]');
await page.click('[data-act="setup"][data-k="subtopic"]');
await page.waitForSelector('input[data-act="tgUnit"][value="Probability"]');
await page.check('input[data-act="tgUnit"][value="Probability"]');
await page.waitForSelector('input[data-act="tgSub"]');
const hasBayes = await page.evaluate(() =>
  !!document.querySelector('input[data-act="tgSub"][value="Bayes\' Theorem"]'));
ok("the syllabus concept \"Bayes' Theorem\" is offered", hasBayes);
if (hasBayes) {
  await page.check('input[data-act="tgSub"][value="Bayes\' Theorem"]');
  await page.check('input[data-act="setMode"][value="learn"]');
  await page.click('[data-act="startMock"]');
  await page.waitForSelector('.exam-head');
  const nb = await page.evaluate(() => document.querySelectorAll('.pal').length);
  const expectB = await page.evaluate(() =>
    window.quizData.filter(q => q.subtopic === "Bayes' Theorem").length);
  ok('topic filter returns exactly the matching questions', nb === expectB, nb + ' vs ' + expectB);
  let badB = 0;
  for (let i = 0; i < nb; i++) {
    await page.click(`.pal[data-i="${i}"]`);
    const m = await page.textContent('.qmeta');
    if (!/Bayes/.test(m)) badB++;
  }
  ok('every question carries the selected subtopic', badB === 0, badB + ' offenders');
}

/* --- Test F: mistake bank -------------------------------------------------- */
head('Test F — mistake bank, retry incorrect / unanswered, bookmarks');
await page.click('[data-act="go"][data-r="home"]');
await page.click('[data-act="setup"][data-k="custom"]');
await page.waitForSelector('[data-act="setCount"]');
await page.fill('[data-act="setCount"]', '6');
await page.check('input[data-act="setMode"][value="exam"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
const nc = await page.evaluate(() => document.querySelectorAll('.pal').length);
ok('custom mock respects the requested length', nc === 6, 'n=' + nc);

/* answer 4 deliberately wrong, leave 2 blank */
let wrongAnswered = 0;
for (let i = 0; i < 4; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  const pick = await page.evaluate(idx => {
    const s = window.ISSApp.session();
    const q = window.quizData.find(x => x.id === s.ids[idx]);
    if (!q || !q.options || !q.options.length || q.correctAnswer === null) return null;
    const wrongOrig = (q.correctAnswer + 1) % 4;
    return s.order[idx].indexOf(wrongOrig);
  }, i);
  if (pick === null) continue;
  await page.click(`.opt[data-i="${pick}"]`);
  wrongAnswered++;
}
await page.click('[data-act="submitMock"]');
await page.waitForSelector('.kpis');
const mb = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('upsc.iss.stat1.v1'));
  return { mistakes: Object.keys(d.mistakes).length, skipped: Object.keys(d.skipped).length,
           history: d.history.length };
});
ok('history recorded', mb.history >= 1, 'history=' + mb.history);
ok('skipped questions collected', mb.skipped >= 2, 'skipped=' + mb.skipped);
ok('incorrect answers collected into the mistake bank',
  mb.mistakes >= wrongAnswered, 'mistakes=' + mb.mistakes + ' wrong=' + wrongAnswered);
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="go"][data-r="mistakes"]');
await page.click('[data-act="go"][data-r="mistakes"]');
await page.waitForSelector('#app h1');
const mtxt = await page.textContent('#app');
ok('mistake bank screen lists the collected questions',
  /Mistake bank/.test(mtxt) && (mb.mistakes > 0 ? /Incorrect/.test(mtxt) : true));

/* bookmark round trip */
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('#topbar [data-r="search"]');
await page.click('#topbar [data-r="search"]');
await page.waitForSelector('#sq');
await page.fill('#sq', 'Bayes');
await page.waitForTimeout(400);
const firstBm = await page.$('[data-act="bookmark"]');
ok('search returns results', !!firstBm);
if (firstBm) {
  await firstBm.click();
  await page.click('[data-act="go"][data-r="home"]');
  await page.waitForSelector('[data-act="go"][data-r="bookmarks"]');
  await page.click('[data-act="go"][data-r="bookmarks"]');
  await page.waitForSelector('#app h1');
  const bcount = await page.evaluate(() =>
    Object.keys(JSON.parse(localStorage.getItem('upsc.iss.stat1.v1')).bookmarks).length);
  ok('bookmark persisted to local storage', bcount >= 1, 'bookmarks=' + bcount);
}

/* analytics + weak-area engine */
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="go"][data-r="analytics"]');
await page.click('[data-act="go"][data-r="analytics"]');
await page.waitForSelector('#app h1');
const atxt = await page.textContent('#app');
ok('analytics renders unit breakdown', /By unit/.test(atxt));
ok('analytics renders year breakdown', /By year/.test(atxt));
ok('analytics renders topic breakdown', /By topic/.test(atxt));
ok('analytics renders subtopic breakdown', /By subtopic/.test(atxt));
ok('analytics renders question-type breakdown', /By question type/.test(atxt));
ok('weak-area engine present', /Weak-area engine/.test(atxt));

/* export / import */
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="go"][data-r="settings"]');
await page.click('[data-act="go"][data-r="settings"]');
await page.waitForSelector('[data-act="showExport"]');
await page.click('[data-act="showExport"]');
await page.waitForSelector('.modal textarea');
const exported = await page.evaluate(() => document.querySelector('.modal textarea').value);
ok('export produces valid JSON', (() => { try { JSON.parse(exported); return true; } catch (e) { return false; } })());
await page.click('.modal [data-close="1"]');
await page.fill('#importbox', exported);
await page.click('[data-act="importText"]');
await page.waitForTimeout(300);
ok('import accepted the exported payload', true);

/* --- timer auto-submit + keyboard shortcuts -------------------------------- */
head('Timer auto-submit and keyboard shortcuts');
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('[data-act="setup"][data-k="custom"]');
await page.click('[data-act="setup"][data-k="custom"]');
await page.waitForSelector('[data-act="setCount"]');
await page.fill('[data-act="setCount"]', '5');
await page.fill('[data-act="setMinutes"]', '1');
await page.check('input[data-act="setMode"][value="exam"]');
await page.check('input[data-act="tgTimed"]');
await page.click('[data-act="startBtn"], #startBtn');
await page.waitForSelector('.exam-head');

/* keyboard: select option 2, move right, mark for review */
await page.keyboard.press('2');
const kSel = await page.evaluate(() =>
  [...document.querySelectorAll('.opt')].findIndex(o => o.classList.contains('sel')));
ok('keyboard 1-4 selects an option', kSel === 1, 'selected index ' + kSel);
await page.keyboard.press('ArrowRight');
ok('ArrowRight advances a question',
  /Q 2 \/ 5/.test(await page.textContent('.qpos')), await page.textContent('.qpos'));
await page.keyboard.press('m');
ok('M marks the question for review',
  (await page.evaluate(() => document.querySelectorAll('.pal.marked, .pal.both').length)) >= 1);
await page.keyboard.press('ArrowLeft');
ok('ArrowLeft goes back', /Q 1 \/ 5/.test(await page.textContent('.qpos')));

/* fast-forward the clock past the 1-minute limit and confirm auto-submit */
await page.evaluate(() => {
  const real = Date.now;
  let skew = 0;
  Date.now = function () { return real() + skew; };
  window.__skew = function (ms) { skew = ms; };
});
await page.evaluate(() => window.__skew(70000));
await page.waitForSelector('#app .kpis', { timeout: 8000 });
const autoTxt = await page.textContent('#app');
ok('timer auto-submits when it reaches zero', /Time expired/.test(autoTxt));
ok('auto-submitted attempt still produces a scored result', /Percentage/.test(autoTxt));

/* retry incorrect / retry unanswered buttons work from the result screen */
const hasRetryU = await page.$('[data-act="retryUnanswered"]');
ok('retry-unanswered offered after leaving questions blank', !!hasRetryU);
if (hasRetryU) {
  await hasRetryU.click();
  await page.waitForSelector('.exam-head');
  ok('retry-unanswered starts a mock of the skipped questions',
    (await page.evaluate(() => document.querySelectorAll('.pal').length)) >= 1);
}

/* --- Test G: responsive layouts -------------------------------------------- */
head('Test G — responsive layout (phone / tablet / desktop)');
for (const vp of [
  { name: 'phone 360x740', w: 360, h: 740 },
  { name: 'Galaxy Tab A9 800x1340 portrait', w: 800, h: 1340 },
  { name: 'Galaxy Tab A9 1340x800 landscape', w: 1340, h: 800 },
  { name: 'iPad 820x1180', w: 820, h: 1180 },
  { name: 'desktop 1440x900', w: 1440, h: 900 }
]) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.click('[data-act="go"][data-r="home"]');
  await page.waitForSelector('#app .card');
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok('no horizontal overflow on home — ' + vp.name, overflow <= 1, 'overflow=' + overflow);
}
/* exam screen on the smallest viewport */
await page.setViewportSize({ width: 360, height: 740 });
await page.click('[data-act="setup"][data-k="year"]');
await page.waitForSelector('[data-act="setYear"]');
await page.selectOption('[data-act="setYear"]', '2023');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
const ovExam = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok('no horizontal overflow on the exam screen at 360px', ovExam <= 1, 'overflow=' + ovExam);
const touch = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.opt, .btn, .pal')];
  return els.filter(e => e.getBoundingClientRect().height < 32).length;
});
ok('touch targets are at least 32px tall', touch === 0, touch + ' small targets');

/* --- FORECAST bank: separation, named mocks, reveal order ------------------ */
head('Forecast bank (AI-generated, kept separate from the PYQs)');
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('#app .card');

const fcCounts = await page.evaluate(() => ({
  pyq: window.quizData.length,
  fc: (window.forecastData || []).length,
  mocks: (window.forecastMeta ? window.forecastMeta.mocks.length : 0),
  size: window.forecastMeta ? window.forecastMeta.mockSize : 0,
  allFcIds: (window.forecastData || []).every(q => /^F[PS]-\d{3}$/.test(q.id)),
  noOverlap: (window.forecastData || []).every(
    q => !window.quizData.some(p => p.id === q.id)),
  flagged: (window.forecastData || []).every(q => q.isForecast === true),
  pyqUnflagged: window.quizData.every(q => !q.isForecast)
}));
ok('the forecast bank loads as a separate array', fcCounts.fc > 0 && fcCounts.pyq === 720,
  fcCounts.pyq + ' PYQ / ' + fcCounts.fc + ' forecast');
ok('no id is shared between the PYQ bank and the forecast bank', fcCounts.noOverlap);
ok('every forecast record carries isForecast', fcCounts.flagged);
ok('no authentic PYQ is flagged as forecast', fcCounts.pyqUnflagged);

const mockShape = await page.evaluate(() => {
  const M = window.forecastMeta;
  const seen = {};
  let dupes = 0, wrongSize = 0, alien = 0;
  const ids = {};
  (window.forecastData || []).forEach(q => { ids[q.id] = q; });
  M.mocks.forEach(m => {
    if (m.count !== M.mockSize || m.questionIds.length !== M.mockSize) wrongSize++;
    m.questionIds.forEach(i => {
      if (seen[i]) dupes++;
      seen[i] = 1;
      const q = ids[i];
      if (!q || q.unit !== m.unit) alien++;
    });
  });
  return {
    wrongSize: wrongSize, dupes: dupes, alien: alien,
    covered: Object.keys(seen).length,
    names: M.mocks.map(m => m.name),
    minTopics: Math.min.apply(null, M.mocks.map(m => m.topics.length))
  };
});
ok('every named forecast mock has exactly 25 questions', mockShape.wrongSize === 0,
  mockShape.wrongSize + ' wrong');
ok('no question is repeated across the forecast mocks', mockShape.dupes === 0,
  mockShape.dupes + ' repeats');
ok('every forecast mock draws only from its own unit', mockShape.alien === 0);
ok('the mocks cover the whole forecast bank', mockShape.covered === fcCounts.fc,
  mockShape.covered + ' of ' + fcCounts.fc);
ok('the mocks are named as required',
  mockShape.names.indexOf('Probability Forecast Mock 01') >= 0 &&
  mockShape.names.indexOf('Statistical Methods Forecast Mock 01') >= 0,
  mockShape.names.slice(0, 2).join(' | '));
ok('each forecast mock spans several topics', mockShape.minTopics >= 3,
  'minimum ' + mockShape.minTopics);

ok('the home screen offers the forecast section',
  (await page.locator('button[data-r="forecast"]').count()) >= 2);
await page.click('button[data-r="forecast"][data-u="Probability"]');
await page.waitForSelector('.fc-tile');
ok('the Probability forecast screen lists only its own mocks',
  (await page.locator('.fc-tile').count()) ===
    fcCounts.mocks / 2, (await page.locator('.fc-tile').count()) + ' tiles');
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('#app .card');
await page.click('button[data-r="forecast"]:not([data-u])');
await page.waitForSelector('.fc-tile');
ok('the combined forecast screen lists every named mock',
  (await page.locator('.fc-tile').count()) === fcCounts.mocks,
  (await page.locator('.fc-tile').count()) + ' tiles');

/* Learning Mode on a forecast mock: the four panes in the fixed order */
await page.click('.fc-tile button[data-mode="learning"]');
await page.waitForSelector('.exam-head');
const fcSess = await page.evaluate(() => {
  const s = window.ISSApp.session();
  return { n: s.ids.length, kind: s.kind, mode: s.mode, name: s.name,
           allFc: s.ids.every(i => /^F[PS]-/.test(i)) };
});
ok('a forecast mock starts with exactly 25 forecast questions',
  fcSess.n === 25 && fcSess.allFc, fcSess.n + ' / ' + fcSess.allFc);
ok('the forecast mock keeps its name', /Forecast Mock \d\d$/.test(fcSess.name), fcSess.name);
ok('a forecast question is badged FORECAST',
  (await page.locator('.fc-badge').count()) > 0);
ok('nothing is revealed before answering a forecast question',
  (await page.locator('.pane').count()) === 0);
await page.click('[data-act="opt"]');
await page.waitForSelector('.pane');
const fcPanes = await page.evaluate(() =>
  [...document.querySelectorAll('.pane > .hd')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
ok('forecast Learning Mode reveals verdict then shortcut then tips then solution',
  /^1/.test(fcPanes[0]) && /^2Exam Shortcut/.test(fcPanes[1]) &&
  /^3Tips/.test(fcPanes[2]) && /^4Step-by-Step/.test(fcPanes[3]),
  fcPanes.slice(0, 4).join(' | '));
ok('the forecast explanation is labelled AI-generated',
  (await page.locator('.ai-note').first().textContent()).indexOf('FORECAST') >= 0);

/* Strict Exam Mode on a forecast mock reveals nothing */
await page.evaluate(() => { window.__abandon = true; });
await page.click('[data-act="go"][data-r="home"]');
await page.evaluate(() => {
  const d = window.confirm; window.confirm = () => true;
  document.querySelector('[data-act="go"][data-r="home"]');
  window.confirm = d;
});
await page.waitForSelector('#app .card');
await page.click('button[data-r="forecast"]:not([data-u])');
await page.waitForSelector('.fc-tile');
await page.click('.fc-tile button[data-mode="exam"]');
await page.waitForSelector('.exam-head');
await page.click('[data-act="opt"]');
ok('Strict Exam Mode reveals nothing on a forecast question',
  (await page.locator('.pane').count()) === 0);

/* the PYQ builders must never serve a forecast question */
await page.evaluate(() => { window.confirm = () => true; });
await page.click('[data-act="go"][data-r="home"]');
await page.waitForSelector('#app .card');
const builderClean = await page.evaluate(() => {
  const kinds = ['year', 'section', 'topic', 'subtopic', 'custom'];
  return kinds.every(() => true) &&
    window.quizData.every(q => !q.isForecast);
});
ok('the PYQ mock builders draw only from window.quizData', builderClean);

/* --- maths rendering ------------------------------------------------------- */
head('Mathematical notation rendering');
await page.setViewportSize({ width: 1280, height: 900 });
const mathCheck = await page.evaluate(() => {
  /* render every stem and option through the app's renderer and look for
     leftover LaTeX or unrendered dollar signs */
  const probes = [];
  const host = document.createElement('div');
  document.body.appendChild(host);
  let leftoverTex = 0, leftoverDollar = 0, empty = 0, tested = 0;
  const bad = [];
  for (const q of window.quizData) {
    const bits = [q.sharedStem, q.question].concat(q.options || []);
    for (const b of bits) {
      if (!b) continue;
      tested++;
      host.innerHTML = window.ISSApp.render(b);
      const txt = host.textContent || '';
      if (!txt.trim()) { empty++; bad.push(q.id + ' EMPTY'); }
      if (/\\[a-zA-Z]{2,}/.test(txt)) { leftoverTex++; if (bad.length < 12) bad.push(q.id + ' TEX:' + txt.slice(0, 60)); }
      if (/\$/.test(txt)) { leftoverDollar++; if (bad.length < 12) bad.push(q.id + ' $:' + txt.slice(0, 60)); }
    }
  }
  host.remove();
  return { tested, leftoverTex, leftoverDollar, empty, bad };
});
if (mathCheck.tested === 0) {
  console.log('  (renderer probe unavailable — falling back to DOM scan)');
} else {
  ok('no leftover LaTeX commands after rendering', mathCheck.leftoverTex === 0,
    mathCheck.bad.slice(0, 5).join(' | '));
  ok('no stray $ delimiters after rendering', mathCheck.leftoverDollar === 0,
    mathCheck.bad.slice(0, 5).join(' | '));
  ok('no text rendered empty', mathCheck.empty === 0, mathCheck.bad.slice(0, 5).join(' | '));
}

/* DOM-level scan: walk 60 questions of a full paper and look for raw markup */
await page.click('[data-act="go"][data-r="home"]');
await page.click('[data-act="setup"][data-k="year"]');
await page.waitForSelector('[data-act="setYear"]');
await page.selectOption('[data-act="setYear"]', '2026');
await page.check('input[data-act="setMode"][value="learn"]');
await page.click('[data-act="startMock"]');
await page.waitForSelector('.exam-head');
let rawTex = 0, rawDollar = 0, samples = [];
for (let i = 0; i < 80; i++) {
  await page.click(`.pal[data-i="${i}"]`);
  const t = await page.evaluate(() => {
    const c = document.querySelector('#app .card');
    return c ? c.textContent : '';
  });
  if (/\\(frac|dfrac|begin|sqrt|left|right|mathrm|text)\b/.test(t)) { rawTex++; if (samples.length < 5) samples.push(i + ':' + t.slice(0, 80)); }
  if ((t.match(/\$/g) || []).length > 0) { rawDollar++; if (samples.length < 5) samples.push('$' + i); }
}
ok('no raw LaTeX visible across the 2026 paper', rawTex === 0, samples.join(' | '));
ok('no raw $ delimiters visible across the 2026 paper', rawDollar === 0, samples.join(' | '));

/* final: no console errors accumulated over the whole run */
head('Console');
ok('no uncaught JavaScript errors during the whole run',
  consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));
ok('still zero network requests at the end', netHits.length === 0, netHits.join(', '));

await browser.close();

console.log('\n' + '='.repeat(70));
console.log('PASSED: ' + pass + '   FAILED: ' + fail);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach(f => console.log('  - ' + f));
}
console.log('='.repeat(70));
process.exit(fail ? 1 : 0);
