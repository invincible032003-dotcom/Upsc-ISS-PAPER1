/* ======================================================================
   NB-6.  Screens: Home, Learn, Topic, Exam hub, More, Help, display sheet
   ====================================================================== */
var LEARN = { tab: 'topics' };
var EX = { year: 0 };
var TMAP = null;   /* topic accuracy cache for one render */

function greeting() {
  var h = new Date().getHours();
  return h < 5 ? 'Late night study' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Late study';
}
function examDays() {
  var s = uiPrefs().examDate;
  if (!s) return null;
  var t = new Date(s + 'T00:00:00').getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}
function ringSvg(frac, label, sub) {
  var r = 34, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return '<div class="ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="' + r + '" class="rg-bg"/><circle cx="40" cy="40" r="' + r + '" class="rg-fg" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 40 40)"/></svg>' +
    '<div class="rg-t"><b id="ringMin">' + label + '</b><small>' + sub + '</small></div></div>';
}
function topicStat(code) {
  var sec = NOTE_BY[code], pg = sec ? secProgress('n', code) : { read: 0, total: 0, pct: 0 };
  var a = TMAP && TMAP[code], acc = a && a.a >= 3 ? Math.round(100 * a.acc) : -1;
  var m = acc >= 0 ? Math.round(0.35 * pg.pct + 0.65 * acc) : Math.round(0.5 * pg.pct);
  var started = pg.read > 0 || (a && a.a > 0);
  return { pg: pg, acc: acc, m: m, started: started, cls: !started ? 'none' : m >= 70 ? 'ok' : m >= 40 ? 'warn' : 'bad' };
}
function nextToRead() {
  var cand = NOTES.filter(function (s) { return s.tier && (s.codes || []).length === 1; });
  cand.sort(function (a, b) { return a.tier - b.tier || (b.f27 || 0) - (a.f27 || 0); });
  for (var i = 0; i < cand.length; i++) if (secProgress('n', cand[i].id).pct < 100) return cand[i];
  return null;
}
function dailyPlan() {
  var goal = uiPrefs().goal, ds = dueSummary(), items = [], used = 0;
  function add(it) { if (used < goal || !items.length) { items.push(it); used += it.m; } }
  if (ds.total) add({ ic: 'revise', t: 'Clear the revision queue', s: ds.total + ' due', m: Math.min(ds.mins, 12), act: 'revDue', n: '12' });
  var nx = nextToRead();
  if (nx) add({ ic: 'book', t: 'Read ' + nx.id + ' · ' + nx.title, s: starStr(nx.tier) + ' ' + (nx.pyq || 0) + ' PYQs', m: readMins(nx), r: 'read', p: { k: 'n', id: nx.id } });
  var wk = weakTopics(4)[0], code = wk ? wk.code : (nx ? nx.id : 'P4');
  if (topicPools(code).some(function (p) { return p.id === 'nm'; })) add({ ic: 'target', t: 'Drill ' + code + ' · ' + topicName(code), s: '15 notes MCQs' + (wk ? ' · weak topic' : ''), m: 15, act: 'poolStart', c: code, pool: 'nm', mode: 'learn' });
  add({ ic: 'cards', t: '10 formula flashcards', s: 'mean, variance, MGF…', m: 4, act: 'deckHb' });
  if (goal >= 60) add({ ic: 'bolt', t: 'Sprint mock · 20 questions', s: 'timed at paper pace', m: 30, act: 'blueprint', n: '20' });
  return items;
}

/* ------------------------------------------------------------------ Home */
V.home = function () {
  TMAP = topicAcc();
  var d = Store.d(), ds = dueSummary(), u = uiPrefs(), li = liveInfo(), h = '';
  var secs = todaySecs(), goal = u.goal * 60, days = examDays();
  if (!AUDIT.ok) h += '<div class="banner warn"><b>Dataset validation failed:</b> ' + AUDIT.errors.length + ' error(s). ' + navBtn('btn sm', 'Open audit', 'audit') + '</div>';
  if (!Store.ok()) h += '<div class="banner info"><b>Local storage is blocked.</b> Progress will not survive a reload. Everything else works.</div>';

  h += '<div class="hero"><div class="hero-l"><div class="hi">' + greeting() + '</div><h1>Statistics Paper-I</h1>' +
    '<div class="hero-chips">' + (days !== null ? '<span class="chip ' + (days < 60 ? 'warn' : 'brand') + '">' + (days > 0 ? days + ' days to exam' : days === 0 ? 'Exam today' : 'Exam date passed') + '</span>' : '<button type="button" class="chip link" data-act="disp">Set exam date</button>') +
    '<span class="chip">' + svg('bolt') + ' ' + streakDays() + '-day streak</span></div></div>' +
    ringSvg(secs / goal, Math.floor(secs / 60), 'of ' + u.goal + ' min') + '</div>';

  if (li) {
    h += '<div class="resume"><div><b>Resume: ' + E(li.L.name) + '</b><div class="small muted">' + li.answered + '/' + li.total + ' answered' + (li.L.limitSec ? ' · ' + hms(li.left) + ' left' : '') + '</div></div>' +
      '<button type="button" class="btn primary" data-act="resumeLive">' + svg('play') + 'Resume</button></div>';
  } else if (d.last && d.last.r && d.last.r !== 'result') {
    h += '<div class="resume"><div><b>Continue: ' + E(d.last.t) + '</b><div class="small muted">Where you stopped ' + dateStr(d.last.ts) + '</div></div>' +
      navBtn('btn primary', svg('play') + 'Continue', d.last.r, d.last.p) + '</div>';
  }

  h += '<div class="modes3"><button type="button" class="mode learn" data-act="nav" data-r="learn"><span class="mi">' + svg('learn') + '</span><b>Learn</b><small>Notes · traps · formulas</small></button>' +
    '<button type="button" class="mode exam" data-act="nav" data-r="examhub"><span class="mi">' + svg('exam') + '</span><b>Exam</b><small>Timed · scored</small></button>' +
    '<button type="button" class="mode rev" data-act="nav" data-r="revise"><span class="mi">' + svg('revise') + '</span><b>Revise</b><small>' + (ds.total ? ds.total + ' due' : 'Wrong · marked') + '</small></button></div>';

  h += practiceTiles();

  var plan = dailyPlan(), tot = 0;
  plan.forEach(function (p) { tot += p.m; });
  h += '<div class="card plan"><div class="plh"><h3>Today’s plan</h3><span class="chip">' + tot + ' min · goal ' + u.goal + '</span></div><ul class="plan-list">';
  plan.forEach(function (p) {
    var attrs = p.r ? ' data-act="nav" data-r="' + p.r + '" data-p="' + E(pAttr(p.p)) + '"' : ' data-act="' + p.act + '"' + (p.c ? ' data-c="' + p.c + '" data-pool="' + p.pool + '" data-mode="' + p.mode + '"' : '') + (p.n ? ' data-n="' + p.n + '"' : '');
    h += '<li><button type="button" class="pli"' + attrs + '><span class="pi">' + svg(p.ic) + '</span><span class="pt"><b>' + E(p.t) + '</b><small>' + E(p.s) + '</small></span><span class="pm">' + p.m + ' min</span></button></li>';
  });
  h += '</ul></div>';

  h += '<div class="card"><div class="plh"><h3>Topic mastery</h3><span class="small muted">read + accuracy</span></div>';
  ['Probability', 'Statistical Methods'].forEach(function (u2) {
    h += '<div class="mlab">' + u2 + '</div><div class="mgrid">';
    TOPICS.filter(function (t) { return t.unit === u2 && NOTE_BY[t.code]; }).forEach(function (t) {
      var st = topicStat(t.code), sec = NOTE_BY[t.code];
      h += '<button type="button" class="mcell ' + st.cls + '" data-act="nav" data-r="topic" data-p="c=' + t.code + '" title="' + E(sec.title) + ' · ' + st.m + '%"><b>' + t.code + '</b><small>' + (st.started ? st.m + '%' : starStr(sec.tier)) + '</small></button>';
    });
    h += '</div>';
  });
  h += '<div class="legend"><span><i class="lg none"></i>not started</span><span><i class="lg bad"></i>&lt;40%</span><span><i class="lg warn"></i>40–69%</span><span><i class="lg ok"></i>70%+</span></div></div>';

  h += '<div class="card"><h3>Quick starts</h3><div class="btnrow wrapbtn">' +
    '<button type="button" class="btn" data-act="blueprint" data-n="10">' + svg('bolt') + 'Quick 10 <small>15 min</small></button>' +
    '<button type="button" class="btn" data-act="blueprint" data-n="20">' + svg('bolt') + 'Sprint 20 <small>30 min</small></button>' +
    '<button type="button" class="btn primary" data-act="blueprint" data-n="40">' + svg('exam') + 'Blueprint 40 <small>60 min</small></button>' +
    navBtn('btn', svg('sigma') + 'Formulas', 'dists') + '</div></div>';

  h += '<div class="card statsline"><div><b>' + NOTES.length + '</b><span>notes sections</span></div><div><b>' + TRAPS.length + '</b><span>trap sections</span></div><div><b>' + DISTS.length + '</b><span>distributions</span></div><div><b>' + NDATA.length + '</b><span>notes Qs</span></div><div><b>' + (DATA.length + FDATA.length) + '</b><span>PYQ + forecast</span></div></div>';
  return h;
};

/* ----------------------------------------------------------------- Learn */
function topicRow(t) {
  var sec = NOTE_BY[t.code], st = topicStat(t.code);
  var meta = sec ? [(sec.pyq || 0) + ' PYQs', '~' + (sec.f27 || 0) + ' in 2027', readMins(sec) + ' min'] : [(t.pyq || 0) + ' PYQs'];
  return '<li><button type="button" class="trow" data-act="nav" data-r="topic" data-p="c=' + t.code + '"><span class="tc ' + st.cls + '">' + t.code + '</span>' +
    '<span class="tb"><b>' + E(sec ? sec.title : t.key) + '</b><span class="small muted">' + meta.join(' · ') + '</span>' +
    '<span class="mbar"><i class="' + st.cls + '" style="width:' + Math.max(st.started ? 4 : 0, st.m) + '%"></i></span></span>' +
    '<span class="ts">' + (sec ? starStr(sec.tier) : '') + '</span>' + svg('chev', 'go') + '</button></li>';
}
var SEC_TAG = { blueprint: '\u2605', unlearn: '!', PBANK: 'P\u00b7B', SBANK: 'S\u00b7B', VAULT: 'Vlt', 'X-P': '+P', 'X-L': '+L', 'X-S': '+S' };
function secRow(kind, s) {
  var pg = secProgress(kind, s.id);
  return '<li><button type="button" class="trow" data-act="nav" data-r="read" data-p="' + E(pAttr({ k: kind, id: s.id })) + '"><span class="tc ' + (pg.pct === 100 ? 'ok' : pg.read ? 'warn' : 'none') + '">' + E(SEC_TAG[s.id] || s.id) + '</span>' +
    '<span class="tb"><b>' + E(s.title) + '</b><span class="small muted">' + s.groups.length + ' groups · ' + readMins(s) + ' min' + (s.pyq ? ' · ' + s.pyq + ' PYQs' : '') + '</span>' +
    '<span class="mbar"><i class="ok" style="width:' + pg.pct + '%"></i></span></span><span class="ts">' + (s.tier ? starStr(s.tier) : '') + '</span>' + svg('chev', 'go') + '</button></li>';
}
V.learn = function () {
  TMAP = topicAcc();
  var d = Store.d(), h = '';
  h += '<button type="button" class="searchbar" data-act="nav" data-r="nsearch">' + svg('search') + '<span>Search notes, traps and formulas</span></button>';
  var tabs = [['topics', 'Topics'], ['notes', 'Notes'], ['traps', 'Traps'], ['formulas', 'Formulas'], ['cards', 'Cards']];
  h += '<div class="seg scrollseg" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" class="' + (LEARN.tab === t[0] ? 'on' : '') + '" data-act="learnTab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
  if (LEARN.tab === 'topics') {
    var nx = nextToRead();
    if (nx) h += '<div class="card nextcard"><div><div class="small muted">Start with the highest-yield unread topic</div><b>' + E(nx.id + ' · ' + nx.title) + '</b> <span class="chip tier t' + nx.tier + '">' + starStr(nx.tier) + '</span></div>' + navBtn('btn primary', 'Read', 'read', { k: 'n', id: nx.id }) + '</div>';
    ['Probability', 'Statistical Methods'].forEach(function (u) {
      h += '<h3 class="sect">' + u + '</h3><ul class="list tlist">' + TOPICS.filter(function (t) { return t.unit === u; }).map(topicRow).join('') + '</ul>';
    });
    h += '<h3 class="sect">Numerical analysis and computer</h3><ul class="list tlist">' +
      TOPICS.filter(function (t) { return /^[NC]/.test(t.code); }).map(topicRow).join('') + '</ul>';
    h += '<div class="btnrow mt">' + navBtn('btn', svg('book') + 'Computer chapters', 'cs') + navBtn('btn', svg('book') + 'Gupta &amp; Kapoor', 'gk') + '</div>';
  } else if (LEARN.tab === 'notes') {
    ['Start here', 'Probability', 'Statistical Methods', 'Revise', 'Added'].forEach(function (part) {
      var list = NOTES.filter(function (s) { return s.part === part; });
      if (list.length) h += '<h3 class="sect">' + (part === 'Revise' ? 'Revise vault' : part === 'Added' ? 'Added beyond the notes' : part) + '</h3><ul class="list tlist">' + list.map(function (s) { return secRow('n', s); }).join('') + '</ul>';
    });
  } else if (LEARN.tab === 'traps') {
    h += '<p class="small muted">The Top-1% trap compendium: every statement to learn as a true/false object with its counterexample. Use <b>Recall</b> to test yourself.</p>' +
      '<ul class="list tlist">' + TRAPS.map(function (s) { return secRow('t', s); }).join('') + '</ul>' +
      '<div class="btnrow mt"><button type="button" class="btn primary" data-act="nbLaunch" data-bank="tf-trap">' + svg('play') + 'Trap statements drill (66)</button></div>';
  } else if (LEARN.tab === 'formulas') {
    h += '<div class="btnrow mb"><button type="button" class="btn primary" data-act="nav" data-r="dists">' + svg('sigma') + 'Open handbook</button><button type="button" class="btn" data-act="nbLaunch" data-bank="dh">Formula mock</button><button type="button" class="btn" data-act="deckHb">Flashcards</button></div>' +
      '<ul class="list dlist">' + DISTS.map(distRow).join('') + '</ul>';
  } else {
    h += decksHtml();
  }
  return h;
};

/* ----------------------------------------------------------------- Topic */
V.topic = function (p) {
  var code = p.c, t = TOPIC_BY[code];
  if (!t) return '<div class="card"><h2>Topic not found</h2>' + navBtn('btn primary', 'Learn', 'learn') + '</div>';
  TMAP = topicAcc();
  var sec = NOTE_BY[code], st = topicStat(code), h = '';
  Store.d().last = { r: 'topic', p: { c: code }, t: code + ' · ' + topicName(code), ts: Date.now() };
  h += '<div class="rd-head"><div class="rd-code">' + E(code) + ' · ' + E(t.unit) + '</div><h1>' + E(sec ? sec.title : t.key) + '</h1><div class="rd-meta">' +
    (sec && sec.tier ? '<span class="chip tier t' + sec.tier + '">' + starStr(sec.tier) + ' ' + TIER_LBL[sec.tier] + '</span>' : '') +
    '<span class="chip">' + (sec ? sec.pyq : t.pyq || 0) + ' PYQs</span>' + (sec && sec.f27 ? '<span class="chip">~' + sec.f27 + ' in 2027</span>' : '') +
    (st.acc >= 0 ? '<span class="chip ' + (st.acc >= 70 ? 'ok' : st.acc >= 45 ? 'warn' : 'bad') + '">' + st.acc + '% accuracy</span>' : '') + '</div>' +
    (sec && sec.lede ? '<p class="lede">' + NR(sec.lede) + '</p>' : '<p class="small muted">' + E(t.key) + '</p>') + '</div>';
  h += '<div class="actgrid">';
  if (sec) h += navBtn('act big', svg('book') + '<b>Read notes</b><small>' + readMins(sec) + ' min · ' + st.pg.read + '/' + st.pg.total + ' read</small>', 'read', { k: 'n', id: code });
  var tp = sectionsFor(TRAPS, code), tl = tp.pri.concat(tp.rel);
  if (tl.length) h += navBtn('act', svg('warn') + '<b>Trap pack</b><small>' + tl.length + ' section' + (tl.length === 1 ? '' : 's') + '</small>', 'read', { k: 't', id: tl[0].id });
  var ds = DISTS.filter(function (x) { return x.code === code; });
  if (ds.length) h += navBtn('act', svg('sigma') + '<b>Formulas</b><small>' + ds.length + ' law' + (ds.length === 1 ? '' : 's') + '</small>', 'dist', { id: ds[0].id });
  var nc = deckKeys({ code: code }).length;
  if (nc) h += '<button type="button" class="act" data-act="deckTopic" data-c="' + code + '">' + svg('cards') + '<b>Flashcards</b><small>' + nc + ' cards</small></button>';
  if (/^C/.test(code)) h += navBtn('act', svg('book') + '<b>Computer bank</b><small>chapter sets</small>', 'cs');
  h += '</div>';
  if (ds.length > 1) h += '<div class="chiprow wrapchips">' + ds.map(function (x) { return navBtn('chip link', E(x.name), 'dist', { id: x.id }); }).join('') + '</div>';
  h += practiceCard(code);
  var bp = sec ? '' : '';
  return h + bp;
};

/* ------------------------------------------------------------- Exam hub */
function nmMocks() {
  var ids = nbIds(['nm']), k = Math.max(1, Math.floor(ids.length / 26)), out = [];
  for (var i = 0; i < k; i++) out.push([]);
  ids.forEach(function (id, i) { out[i % k].push(id); });
  return out;
}
function examRow(title, sub, mins, n, act, attrs) {
  return '<li class="erow"><div class="el"><b>' + title + '</b><span class="small muted">' + sub + '</span></div><div class="er"><span class="chip">' + n + ' Q · ' + mins + ' min</span>' +
    '<button type="button" class="btn sm primary" data-act="' + act + '"' + (attrs || '') + '>Start</button></div></li>';
}
V.examhub = function () {
  var st = paperCfg(), h = '';
  if (!EX.year) EX.year = META.years[META.years.length - 1];
  h += '<div class="pagehead"><h1>Exam mode</h1><p class="small muted">Timed, scored, no hints. Pattern: ' + markLabel() + ' marks, ' + minPerQ() + ' min per question, answer any question where you can remove one option.</p></div>';
  h += '<h3 class="sect">Time-boxed mocks <small class="muted">topics weighted by the 2027 forecast</small></h3><div class="bigtiles">' +
    [[10, 'Quick 10', 'Warm-up'], [20, 'Sprint 20', 'Half paper'], [40, 'Blueprint 40', 'Paper-I block']].map(function (x) {
      return '<button type="button" class="bt" data-act="blueprint" data-n="' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + '</span><em>' + Math.round(x[0] * minPerQ()) + ' min</em></button>';
    }).join('') + '</div>';
  var wk = weakTopics(4);
  if (wk.length) h += '<button type="button" class="wide-act" data-act="weakMock">' + svg('target') + '<span><b>Weak-area mock</b><small>20 Q from ' + wk.slice(0, 3).map(function (w) { return w.code; }).join(', ') + '</small></span>' + svg('chev') + '</button>';

  h += '<h3 class="sect">Past papers</h3><div class="card"><div class="chiprow scrollchips" role="group" aria-label="Year">' +
    META.years.map(function (y) { return '<button type="button" class="tchip' + (EX.year === y ? ' on' : '') + '" data-act="exYear" data-y="' + y + '">' + y + '</button>'; }).join('') + '</div>' +
    '<div class="btnrow mt col2"><button type="button" class="btn primary" data-act="exPaper" data-scope="all">' + EX.year + ' full paper <small>80 Q · ' + st.fullPaperMinutes + ' min</small></button>' +
    '<button type="button" class="btn" data-act="exPaper" data-scope="ps">Prob + Stat only <small>' + DATA.filter(function (q) { return q.year === EX.year && /^[PS]/.test(q.topicCode); }).length + ' Q</small></button></div>' +
    '<div class="btnrow mt">' + '<button type="button" class="btn ghost sm" data-act="setup" data-k="section">Sectional</button><button type="button" class="btn ghost sm" data-act="setup" data-k="topic">Topic</button><button type="button" class="btn ghost sm" data-act="setup" data-k="custom">Custom builder</button></div></div>';

  h += '<h3 class="sect">Drill sets and notes mocks</h3><ul class="list elist">';
  ['drill-1', 'drill-2'].forEach(function (id) { var b = NB_BANK[id]; h += examRow(E(b.name), E(b.desc.length > 110 ? b.desc.slice(0, 108) + '…' : b.desc), b.time, b.n, 'nbLaunch', ' data-bank="' + id + '" data-mode="exam"'); });
  nmMocks().forEach(function (m, i) { h += examRow('Notes mock ' + (i + 1 < 10 ? '0' : '') + (i + 1), 'Mixed topics, written from your notes', Math.round(m.length * minPerQ()), m.length, 'nmStart', ' data-i="' + i + '"'); });
  h += '</ul><h3 class="sect">Rapid true / false</h3><ul class="list elist">';
  ['tf-notes', 'tf-sm', 'tf-trap'].forEach(function (id) { var b = NB_BANK[id]; h += examRow(E(b.name), E(b.desc.length > 100 ? b.desc.slice(0, 98) + '…' : b.desc), b.time, b.n, 'nbLaunch', ' data-bank="' + id + '" data-mode="exam"'); });
  var dh = NB_BANK.dh;
  h += '</ul><h3 class="sect">Formulas</h3><ul class="list elist">' + examRow('Distribution formula mock', 'PMF/PDF, CDF, mean, variance, mode, skewness, kurtosis, MGF, CF, PGF', Math.round(30 * minPerQ()), dh.n, 'nbLaunch', ' data-bank="dh" data-mode="exam"') + '</ul>';
  h += '<h3 class="sect">More banks</h3><div class="btnrow wrapbtn">' + navBtn('btn', 'PYQs', 'pyq') + navBtn('btn', 'Sectional', 'sectional') + navBtn('btn', 'PYQ mocks', 'mocks') + navBtn('btn', 'Forecasts', 'forecast') + navBtn('btn', 'Computer', 'cs') + navBtn('btn', 'Gupta &amp; Kapoor', 'gk') + '</div>';
  return h;
};

function examClick(act, t) {
  switch (act) {
    case 'exYear': EX.year = +t.getAttribute('data-y'); render(); return true;
    case 'exPaper': {
      var scope = t.getAttribute('data-scope'), y = EX.year;
      var qs = DATA.filter(function (q) { return q.year === y && (scope === 'all' || /^[PS]/.test(q.topicCode)); });
      qs.sort(function (a, b) { return a.questionNumber - b.questionNumber; });
      nbStart({ title: y + (scope === 'all' ? ' full paper' : ' Probability + Stat Methods'), sub: 'Authentic PYQs in printed order', ids: qs.map(function (q) { return q.id; }), time: scope === 'all' ? paperCfg().fullPaperMinutes : Math.round(qs.length * minPerQ()), shuffle: false, authentic: true, kind: 'year', tag: 'year' }, 'exam');
      START.n = qs.length; START.timer = 'bank'; startRefresh();
      return true;
    }
    case 'nmStart': {
      var i = +t.getAttribute('data-i'), ids = nmMocks()[i];
      nbStart({ title: 'Notes mock ' + (i + 1 < 10 ? '0' : '') + (i + 1), sub: 'Mixed topics from your notes', ids: ids, shuffle: true, tag: 'nm' + i }, 'exam');
      START.n = ids.length; startRefresh();
      return true;
    }
    case 'weakMock': {
      var wk = weakTopics(4).slice(0, 3), ids2 = [];
      wk.forEach(function (w) { ids2 = ids2.concat(shuffle(ordinalIds(DATA.filter(function (q) { return q.topicCode === w.code; })).concat(nbIds(['nm', 'drill-1', 'drill-2'], w.code)).filter(function (id) { return BY_ID[id].options && BY_ID[id].options.length === 4; })).slice(0, 8)); });
      nbStart({ title: 'Weak-area mock', sub: wk.map(function (w) { return w.code; }).join(', '), ids: shuffle(ids2), shuffle: true, tag: 'weak' }, 'exam');
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ More */
V.more = function () {
  var rows = [
    ['cs', 'book', 'Computer', 'Chapter-wise practice sets and pointer sheets'],
    ['gk', 'book', 'Gupta &amp; Kapoor', 'Chapters 5–8 textbook problem bank'],
    ['forecast', 'exam', 'Forecast mocks', 'AI-generated 2027 practice, kept apart from PYQs'],
    ['search', 'search', 'Search questions', 'Find any PYQ, forecast, notes or textbook question'],
    ['nsearch', 'search', 'Search notes &amp; formulas', 'Full text across notes, traps and handbook'],
    ['analytics', 'chart', 'Analytics', 'Accuracy by year, unit, topic, question type'],
    ['history', 'clock', 'Attempt history', 'Every paper you submitted'],
    ['settings', 'gear', 'Settings &amp; data', 'Marking scheme, backup, restore, reset'],
    ['help', 'list', 'How it works', 'Modes, time plan, shortcuts'],
    ['audit', 'check', 'Data audit', 'Validation report for every bank']
  ];
  var h = '<ul class="list morelist"><li><button type="button" class="mrow" data-act="disp"><span class="mi">' + svg('aa') + '</span><span class="mt2"><b>Display &amp; reading</b><small>Text size, spacing, density, daily goal, exam date</small></span>' + svg('chev', 'go') + '</button></li>';
  rows.forEach(function (r) {
    h += '<li><button type="button" class="mrow" data-act="nav" data-r="' + r[0] + '"><span class="mi">' + svg(r[1]) + '</span><span class="mt2"><b>' + r[2] + '</b><small>' + r[3] + '</small></span>' + svg('chev', 'go') + '</button></li>';
  });
  return h + '</ul>';
};

V.help = function () {
  return '<div class="pagehead"><h1>How it works</h1></div>' +
    '<div class="card help"><h3>Three modes</h3><p><b>Learn</b> — read the notes and traps, study the formula handbook, flashcards, and practise with explanations after every answer.</p>' +
    '<p><b>Exam</b> — timed and scored at ' + markLabel() + ', ' + minPerQ() + ' min per question. The pace chip tells you if you are ahead or behind. Your place is saved: closing the app mid-paper does not lose it.</p>' +
    '<p><b>Revise</b> — everything you got wrong, skipped, marked, bookmarked or saved, plus a spaced-repetition queue (Again returns in 10 min, Good in days, Easy in weeks).</p></div>' +
    '<div class="card help"><h3>Fast learning</h3><ul class="nb-ul"><li><b>Recall</b> blurs the bold answers in the notes and the values in the handbook. Tap a blur to reveal it.</li>' +
    '<li><b>Traps only</b> shows just the warning statements of a notes section.</li><li>Tap any <span class="qref">2019 Q32</span> tag to open that past-year question in a sheet.</li>' +
    '<li><b>Save for revision</b> on a notes group puts it in your Revise queue.</li></ul></div>' +
    '<div class="card help"><h3>Time plan</h3><p>Set a daily goal in <b>Display &amp; reading</b>. Home builds a plan that fits it: due revision first, then the next highest-yield unread topic, a drill and flashcards. Sessions have a length picker, and every length shows its minutes.</p></div>' +
    '<div class="card help"><h3>Phone tips</h3><ul class="nb-ul"><li>Swipe left/right to move between questions in a paper.</li><li>The back button steps back through screens and closes sheets.</li><li>Aa in the top bar adjusts text size, spacing and density. Everything works offline.</li></ul></div>';
};

/* ---------------------------------------------------------- display sheet */
function dispSheet() {
  var u = uiPrefs();
  var h = sheetHead('Display &amp; reading', 'Saved on this device') +
    '<div class="prev"><b>Sample.</b> ' + R('For $X\\sim\\mathrm{Bin}(n,p)$, the mean is $np$ and the variance is $npq$.') + ' <span class="qref">2022 Q48</span></div>' +
    '<div class="st-sec"><div class="st-lab">Text size <span id="fsv">' + Math.round(u.fs * 100) + '%</span></div><input type="range" class="rng" min="0.85" max="1.5" step="0.05" value="' + u.fs + '" data-act="uiFs" aria-label="Text size"></div>' +
    '<div class="st-sec"><div class="st-lab">Line spacing <span id="lsv">' + u.ls + '</span></div><input type="range" class="rng" min="1.3" max="1.95" step="0.05" value="' + u.ls + '" data-act="uiLs" aria-label="Line spacing"></div>' +
    '<div class="st-sec"><div class="st-lab">Density</div><div class="chiprow">' + [['compact', 'Compact'], ['comfy', 'Comfortable'], ['roomy', 'Roomy']].map(function (x) { return '<button type="button" class="tchip' + (u.dens === x[0] ? ' on' : '') + '" data-act="uiDens" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
    '<div class="st-sec"><div class="st-lab">Daily study goal</div><div class="chiprow wrapchips">' + [30, 45, 60, 90, 120, 180].map(function (m) { return '<button type="button" class="tchip' + (u.goal === m ? ' on' : '') + '" data-act="uiGoal" data-v="' + m + '">' + (m >= 60 ? (m / 60) + ' h' : m + ' min') + '</button>'; }).join('') + '</div></div>' +
    '<div class="st-sec"><label class="f"><span>Exam date (for the countdown)</span><input type="date" value="' + E(u.examDate || '') + '" data-act="uiExam"></label></div>' +
    '<div class="st-sec switches"><label class="switch"><input type="checkbox" data-act="uiFocus"' + (u.focus ? ' checked' : '') + '><span>Break reminder every 25 min</span></label>' +
    '<label class="switch"><input type="checkbox" data-act="uiWake"' + (u.wake ? ' checked' : '') + '><span>Keep the screen awake</span></label>' +
    '<label class="switch"><input type="checkbox" data-act="uiRm"' + (u.rm ? ' checked' : '') + '><span>Reduce motion</span></label></div>' +
    '<div class="btnrow mt"><button type="button" class="btn" data-act="uiReset">Reset display</button><button type="button" class="btn primary" data-act="sheetClose">Done</button></div>';
  openSheet(h, 'tall');
}
function screenClick(act, t) {
  var u = uiPrefs();
  switch (act) {
    case 'learnTab': LEARN.tab = t.getAttribute('data-t'); render(); return true;
    case 'disp': dispSheet(); return true;
    case 'uiDens': u.dens = t.getAttribute('data-v'); Store.save(); applyUI(); dispSheet(); return true;
    case 'uiGoal': u.goal = +t.getAttribute('data-v'); Store.save(); dispSheet(); return true;
    case 'uiReset': Store.d().ui = { pat27: u.pat27 }; applyUI(); Store.save(); dispSheet(); return true;
  }
  return false;
}
/* sliders, switches and the date field live in the sheet, outside #app */
function uiChange(act, t) {
  var u = uiPrefs();
  switch (act) {
    case 'uiFs': u.fs = +t.value; applyUI(); Store.save(); var a = document.getElementById('fsv'); if (a) a.textContent = Math.round(u.fs * 100) + '%'; return true;
    case 'uiLs': u.ls = +t.value; applyUI(); Store.save(); var b = document.getElementById('lsv'); if (b) b.textContent = String(u.ls); return true;
    case 'uiFocus': u.focus = !!t.checked; Store.save(); return true;
    case 'uiWake': u.wake = !!t.checked; Store.save(); setWake(u.wake); return true;
    case 'uiRm': u.rm = !!t.checked; Store.save(); applyUI(); return true;
    case 'uiExam': u.examDate = t.value; Store.save(); return true;
  }
  return false;
}

/* --------------------------------- additions to the original screens */
var _settings = V.settings;
V.settings = function () {
  var h = _settings();
  var d = Store.d();
  h += '<div class="card"><h3>Study data</h3><p class="small muted">' + Object.keys(d.sr || {}).length + ' items in the spaced-repetition schedule · ' + Object.keys(d.qh || {}).length + ' questions with an answer history · ' + Object.keys(d.nsave || {}).length + ' saved note groups.</p>' +
    '<div class="btnrow"><button type="button" class="btn" data-act="patternReset">Set UPSC pattern (+2.5, −1/3, 1.5 min/Q, 120 min)</button>' +
    '<button type="button" class="btn danger" data-act="srReset">Reset revision schedule</button></div></div>';
  return h;
};
var _audit = V.audit;
V.audit = function () {
  var h = _audit(), bad = [], mathBad = ML.mathErrors().length;
  NDATA.forEach(function (q) {
    if (!q.options || q.options.length < 2 || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) bad.push(q.id + ': bad key');
    if (!q.topicCode || !TOPIC_BY[q.topicCode]) bad.push(q.id + ': unknown topic ' + q.topicCode);
  });
  h += '<div class="card"><h3>ISS 2027 notes banks</h3><p class="small">' + NDATA.length + ' questions in ' + NMETA.banks.length + ' banks · ' + NOTES.length + ' notes sections · ' + TRAPS.length + ' trap sections · ' + DISTS.length + ' distributions · ' +
    (bad.length ? bad.length + ' error(s)' : 'all structural checks passed') + ' · ' + mathBad + ' formula render error(s) so far.</p>' +
    '<div class="scrollx"><table class="dt"><thead><tr><th>Bank</th><th class="num">Questions</th></tr></thead><tbody>' +
    NMETA.banks.map(function (b) { return '<tr><td>' + E(b.name) + '</td><td class="num">' + b.n + '</td></tr>'; }).join('') + '</tbody></table></div>' +
    (bad.length ? '<ul class="small">' + bad.slice(0, 40).map(function (e) { return '<li>' + E(e) + '</li>'; }).join('') + '</ul>' : '') + '<p class="tiny muted">' + E(NMETA.provenance || '') + '</p></div>';
  return h;
};
function extraClick(act, t) {
  var d = Store.d();
  switch (act) {
    case 'patternReset': {
      var st = d.settings; st.marksCorrect = 2.5; st.negativeMarkingEnabled = true; st.negativeMarkFraction = 1 / 3; st.minutesPerQuestion = 1.5; st.fullPaperMinutes = 120;
      Store.save(); toast('UPSC pattern applied.'); render(); return true;
    }
    case 'srReset': if (window.confirm('Reset the whole revision schedule? Wrong-answer lists are kept.')) { d.sr = {}; Store.save(); toast('Schedule cleared.'); render(); } return true;
  }
  return false;
}

/* the builder screen needs a builder object even when reached from history */
var _setup = V.setup;
V.setup = function () {
  if (!BUILDER) { BUILDER = newBuilder('custom'); }
  return _setup();
};
