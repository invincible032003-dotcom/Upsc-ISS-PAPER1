/* ======================================================================
   NB-8.  Practice banks laid out like the Computer portion: a tab strip,
          then set cards with a coverage bar and Learn / Exam buttons.
          Reached from the top-left menu: PYQs, Topics, Sectional, PYQ mocks,
          Forecasts (Computer and Gupta & Kapoor keep their own screens).
   ====================================================================== */
var PQ = { y: 0, su: 0, tu: 0, fu: 'Probability', open: {} };
var PSUB = [['pyq', 'PYQs'], ['ptopics', 'Topics'], ['sectional', 'Sectional'], ['mocks', 'PYQ mocks'], ['forecast', 'Forecasts']];
var UNIT_SHORT = ['Prob', 'Stat', 'Num', 'Comp'];

/* ------------------------------------------------------------- helpers */
function yearQs(y) {
  return DATA.filter(function (q) { return q.year === y; }).sort(function (a, b) { return a.questionNumber - b.questionNumber; });
}
function ids(list) { return list.map(function (q) { return q.id; }); }
function qhCov(qs) {
  var qh = Store.d().qh || {}, seen = 0, att = 0, ok = 0;
  qs.forEach(function (q) { var h = qh[q.id]; if (h && h.a) { seen++; att += h.a; ok += h.c; } });
  return { n: qs.length, seen: seen, acc: att ? Math.round(100 * ok / att) : -1 };
}
function bestFor(name) {
  var best = null, exam = null, att = 0;
  (Store.d().history || []).forEach(function (a) {
    if (a.name !== name) return;
    att++;
    if (best === null || a.pct > best) best = a.pct;
    if (a.mode === 'exam' && (exam === null || a.pct > exam)) exam = a.pct;
  });
  return { best: best === null ? null : Math.round(best), exam: exam === null ? null : Math.round(exam), att: att };
}
function covHtml(cv) {
  var p = cv.n ? Math.round(100 * cv.seen / cv.n) : 0;
  return '<div class="pcov"><div class="progbar"><i class="' + (cv.seen === cv.n && cv.n ? 'ok' : '') + '" style="width:' + p + '%"></i></div><span>' + cv.seen + '/' + cv.n +
    (cv.acc >= 0 ? ' · ' + cv.acc + '% right' : '') + '</span></div>';
}
function unitMix(qs) {
  var c = {};
  qs.forEach(function (q) { var i = META.units.indexOf(q.unit); c[i] = (c[i] || 0) + 1; });
  return Object.keys(c).sort().map(function (i) { return UNIT_SHORT[i] + ' ' + c[i]; }).join(' · ');
}
function subNav(cur) {
  return '<div class="seg scrollseg subnav" role="tablist" aria-label="Practice banks">' + PSUB.map(function (s) {
    return '<button type="button" role="tab" class="' + (cur === s[0] ? 'on' : '') + '" data-act="nav" data-r="' + s[0] + '">' + s[1] + '</button>';
  }).join('') + '</div>';
}
function tabBtn(act, attrs, top, sub, cv, on) {
  return '<button type="button" role="tab" class="ptab' + (on ? ' on' : '') + '" data-act="' + act + '" ' + attrs + '><b>' + top + '</b><span>' + sub + '</span>' +
    '<i class="bar"><i style="width:' + (cv && cv.n ? Math.round(100 * cv.seen / cv.n) : 0) + '%"></i></i></button>';
}
function setCard(o) {
  var b = bestFor(o.name);
  return '<div class="pset' + (o.next ? ' next' : '') + '"><div class="phd"><b>' + o.title + '</b>' + (o.range ? '<span class="rng">' + o.range + '</span>' : '') +
    (o.next ? '<span class="chip brand">Next</span>' : '') + '<span class="sp"></span>' +
    (b.best !== null ? '<span class="best">best ' + b.best + '%' + (b.exam !== null ? ' · exam ' + b.exam + '%' : '') + '</span>' : '') + '</div>' +
    (o.themes ? '<div class="themes">' + o.themes + '</div>' : '') + (o.cov ? covHtml(o.cov) : '') +
    '<div class="btnrow"><button type="button" class="btn sm primary" data-act="pGo" data-key="' + E(o.key) + '" data-mode="learn">Learn</button>' +
    '<button type="button" class="btn sm" data-act="pGo" data-key="' + E(o.key) + '" data-mode="exam">Exam</button>' +
    (o.more !== false ? '<button type="button" class="btn sm ghost" data-act="pSheet" data-key="' + E(o.key) + '">Length…</button>' : '') + '</div></div>';
}
function screenHead(title, sub, cv) {
  return '<div class="phead"><h1>' + title + '</h1><div class="small muted">' + sub + '</div>' +
    (cv ? '<div class="phc">' + covHtml(cv) + '</div>' : '') + '</div>';
}

/* --------------------------------------------- set keys -> question lists */
function unitQs(u) { return DATA.filter(function (q) { return q.unit === META.units[u]; }); }
function nextSetKey(keys) {
  var seenAny = (Store.d().history || []).map(function (a) { return a.name; });
  for (var i = 0; i < keys.length; i++) if (seenAny.indexOf(keys[i]) < 0) return i;
  return -1;
}
function resolveSet(key) {
  var p = key.split('|').map(decodeURIComponent), kind = p[0], st = paperCfg(), mpq = minPerQ();
  if (kind === 'py') {                              /* PYQ set: 20 questions of one paper, printed order */
    var y = +p[1], k = +p[2], qs = yearQs(y).slice((k - 1) * 20, k * 20);
    return { title: y + ' · Set ' + k, sub: 'Q' + ((k - 1) * 20 + 1) + '–' + ((k - 1) * 20 + qs.length), ids: ids(qs), shuffle: false, kind: 'custom', tag: 'pyq' };
  }
  if (kind === 'pyall') {
    var qa = yearQs(+p[1]);
    return { title: p[1] + ' full paper', sub: 'Authentic paper, printed order', ids: ids(qa), time: st.fullPaperMinutes, shuffle: false, authentic: true, kind: 'year', tag: 'year' };
  }
  if (kind === 'pyps') {
    var qp = yearQs(+p[1]).filter(function (q) { return /^[PS]/.test(q.topicCode); });
    return { title: p[1] + ' Probability + Stat Methods', sub: 'Authentic questions, printed order', ids: ids(qp), time: Math.round(qp.length * mpq), shuffle: false, authentic: true, kind: 'year', tag: 'year' };
  }
  if (kind === 'rand') {                            /* random cross-paper mock; "unseen" prefers questions never answered */
    var n = +p[2], pool = DATA.slice(), qh = Store.d().qh || {};
    if (p[1] === 'unseen') pool.sort(function (a, b) { return ((qh[a.id] ? 1 : 0) - (qh[b.id] ? 1 : 0)) || (Math.random() - 0.5); });
    else if (p[1] === 'ps') { pool = pool.filter(function (q) { return /^[PS]/.test(q.topicCode); }); shuffle(pool); }
    else shuffle(pool);
    pool = pool.filter(function (q) { return q.options && q.options.length === 4 && scorable(q); }).slice(0, n);
    var nm = p[1] === 'unseen' ? 'Unseen PYQs · ' + n : p[1] === 'ps' ? 'Random Prob + Stat · ' + n : 'Random PYQs · ' + n;
    return { title: nm, sub: 'Drawn across 2018–2026', ids: ids(pool), time: Math.round(pool.length * mpq), shuffle: true, kind: 'custom', tag: 'rand' };
  }
  if (kind === 'sec') {                             /* sectional: one unit, one year (or all years) */
    var u = +p[1], un = META.units[u], us = META.taxonomy[un].short, list = p[2] === 'all' ? unitQs(u) : yearQs(+p[2]).filter(function (q) { return q.unit === un; });
    var isAll = p[2] === 'all';
    return { title: isAll ? us + ' · all years' : p[2] + ' · ' + us, sub: un, ids: ids(list), shuffle: isAll, kind: 'section', tag: 'sec' };
  }
  if (kind === 'secr') {
    var u2 = +p[1], n2 = +p[2], l2 = shuffle(unitQs(u2).filter(function (q) { return q.options && q.options.length === 4 && scorable(q); })).slice(0, n2);
    return { title: META.taxonomy[META.units[u2]].short + ' · random ' + n2, sub: META.units[u2], ids: ids(l2), time: Math.round(l2.length * mpq), shuffle: true, kind: 'section', tag: 'secr' };
  }
  if (kind === 'pt') {                              /* topic (optionally one subtopic) across every year */
    var code = p[1], tq = DATA.filter(function (q) { return q.topicCode === code && (!p[2] || q.subtopic === p[2]); });
    return { title: code + ' · ' + (p[2] || topicName(code)), sub: p[2] ? topicName(code) : 'Every year, 2018–2026', ids: ids(tq), shuffle: true, code: code, kind: 'topic', tag: 'topic' };
  }
  if (kind === 'fc') {
    var m = FMETA.mocks.filter(function (x) { return x.id === p[1]; })[0];
    return { title: m.name, sub: 'FORECAST · AI-generated, not PYQ', ids: m.questionIds.filter(function (i) { return BY_ID[i]; }), shuffle: false, kind: 'forecast', tag: 'fc' };
  }
  if (kind === 'fct') {
    var fl = FDATA.filter(function (q) { return q.topic === p[1]; });
    return { title: 'Forecast · ' + p[1], sub: 'FORECAST · AI-generated, not PYQ', ids: ids(fl), shuffle: true, kind: 'forecast', tag: 'fct' };
  }
  return null;
}
/* Learn / Exam straight from a set card, as in the Computer portion */
function directStart(spec, mode) {
  if (!spec || !spec.ids.length) { toast('Nothing to practise here yet.'); return; }
  silentFinish();
  var list = spec.ids.slice(); if (spec.shuffle) shuffle(list);
  var qs = list.map(function (i) { return BY_ID[i]; }).filter(Boolean), exam = mode === 'exam';
  var minutes = spec.time || Math.round(qs.length * minPerQ());
  buildSession({
    kind: spec.kind || 'custom', name: spec.title,
    desc: qs.length + ' questions · ' + (exam ? 'Exam ' + markLabel() : 'Learning') + (spec.sub ? ' · ' + spec.sub : ''),
    mode: exam ? 'exam' : 'learn', questions: qs, shuffleQ: false, shuffleO: false,
    timed: exam, minutes: minutes, authentic: !!spec.authentic, extra: { title: spec.title, tag: spec.tag || '', code: spec.code || '' }
  });
}

/* --------------------------------------------------------------- PYQs */
V.pyq = function () {
  if (!PQ.y) PQ.y = META.years[META.years.length - 1];
  var all = qhCov(DATA), h = subNav('pyq') + screenHead('Previous-year questions', META.totalQuestions + ' authentic questions · ' + META.years[0] + '–' + META.years[META.years.length - 1], all);
  h += '<div class="ptabs scrollchips" role="tablist" aria-label="Year">' + META.years.slice().reverse().map(function (y) {
    return tabBtn('pYear', 'data-y="' + y + '"', y, yearQs(y).length + ' Q', qhCov(yearQs(y)), PQ.y === y);
  }).join('') + '</div>';
  var qs = yearQs(PQ.y), nSets = Math.ceil(qs.length / 20), keys = [];
  for (var k = 1; k <= nSets; k++) keys.push('py|' + PQ.y + '|' + k);
  var nxt = nextSetKey(keys.map(function (x, i) { return PQ.y + ' · Set ' + (i + 1); }));
  h += '<div class="psets">';
  for (var s = 1; s <= nSets; s++) {
    var part = qs.slice((s - 1) * 20, s * 20);
    h += setCard({ key: keys[s - 1], name: PQ.y + ' · Set ' + s, title: 'Set ' + s, range: 'Q' + ((s - 1) * 20 + 1) + '–' + ((s - 1) * 20 + part.length) + ' · ' + part.length,
      themes: unitMix(part), cov: qhCov(part), next: nxt === s - 1, more: false });
  }
  h += '</div><div class="card pwhole"><b>Whole ' + PQ.y + ' paper</b><div class="btnrow">' +
    '<button type="button" class="btn sm primary" data-act="pGo" data-key="pyall|' + PQ.y + '" data-mode="exam">All ' + qs.length + ' · exam ' + paperCfg().fullPaperMinutes + ' min</button>' +
    '<button type="button" class="btn sm" data-act="pGo" data-key="pyall|' + PQ.y + '" data-mode="learn">Learn all</button>' +
    '<button type="button" class="btn sm ghost" data-act="pGo" data-key="pyps|' + PQ.y + '" data-mode="exam">Prob + Stat only</button></div></div>';
  return h;
};

/* ------------------------------------------------------------ PYQ mocks */
V.mocks = function () {
  var h = subNav('mocks') + screenHead('PYQ mocks', 'Full authentic papers at ' + markLabel() + ', ' + paperCfg().fullPaperMinutes + ' minutes for 80 questions');
  h += '<h3 class="sect">Mixed mocks</h3><div class="psets">';
  [['rand|all|40', 'Random 40', 'Any unit, any year', 'pm-r40'], ['rand|all|80', 'Random 80', 'A fresh full-length paper', 'pm-r80'], ['rand|unseen|40', 'Unseen 40', 'Questions you have not answered yet', 'pm-u40'], ['rand|ps|40', 'Prob + Stat 40', 'The block these notes cover', 'pm-p40']].forEach(function (m) {
    h += '<div class="pset"><div class="phd"><b>' + m[1] + '</b><span class="sp"></span></div><div class="themes">' + m[2] + '</div><div class="btnrow">' +
      '<button type="button" class="btn sm primary" data-act="pGo" data-key="' + m[0] + '" data-mode="exam">Exam</button>' +
      '<button type="button" class="btn sm" data-act="pGo" data-key="' + m[0] + '" data-mode="learn">Learn</button></div></div>';
  });
  h += '</div><h3 class="sect">Year papers</h3><div class="psets">';
  META.years.slice().reverse().forEach(function (y) {
    var qs = yearQs(y), ps = qs.filter(function (q) { return /^[PS]/.test(q.topicCode); }), b = bestFor(y + ' full paper');
    h += '<div class="pset"><div class="phd"><b>' + y + ' full paper</b><span class="rng">' + qs.length + ' Q · ' + paperCfg().fullPaperMinutes + ' min</span><span class="sp"></span>' +
      (b.best !== null ? '<span class="best">best ' + b.best + '%' + (b.att > 1 ? ' · ' + b.att + ' tries' : '') + '</span>' : '') + '</div>' +
      '<div class="themes">' + unitMix(qs) + '</div>' + covHtml(qhCov(qs)) +
      '<div class="btnrow"><button type="button" class="btn sm primary" data-act="pGo" data-key="pyall|' + y + '" data-mode="exam">Exam</button>' +
      '<button type="button" class="btn sm" data-act="pGo" data-key="pyall|' + y + '" data-mode="learn">Learn</button>' +
      '<button type="button" class="btn sm ghost" data-act="pGo" data-key="pyps|' + y + '" data-mode="exam">Prob + Stat ' + ps.length + '</button></div></div>';
  });
  h += '</div><div class="btnrow mt">' + '<button type="button" class="btn ghost" data-act="setup" data-k="custom">Custom mock builder</button>' + '</div>';
  return h;
};

/* ------------------------------------------------------------ Sectional */
V.sectional = function () {
  var u = PQ.su, un = META.units[u], us = META.taxonomy[un].short, qs = unitQs(u);
  var h = subNav('sectional') + screenHead('Sectional PYQs', 'One unit at a time, year by year or across all papers');
  h += '<div class="ptabs scrollchips" role="tablist" aria-label="Unit">' + META.units.map(function (x, i) {
    return tabBtn('pSecU', 'data-u="' + i + '"', META.taxonomy[x].short, unitQs(i).length + ' Q', qhCov(unitQs(i)), u === i);
  }).join('') + '</div>';
  h += '<div class="psets"><div class="pset"><div class="phd"><b>' + E(us) + ' · all years</b><span class="rng">' + qs.length + ' Q</span></div>' + covHtml(qhCov(qs)) +
    '<div class="btnrow"><button type="button" class="btn sm primary" data-act="pSheet" data-key="sec|' + u + '|all" data-mode="learn">Learn…</button>' +
    '<button type="button" class="btn sm" data-act="pSheet" data-key="sec|' + u + '|all" data-mode="exam">Exam…</button>' +
    '<button type="button" class="btn sm ghost" data-act="pGo" data-key="secr|' + u + '|25" data-mode="exam">Random 25</button></div></div></div>';
  h += '<h3 class="sect">By year</h3><div class="psets">';
  META.years.slice().reverse().forEach(function (y) {
    var yq = yearQs(y).filter(function (q) { return q.unit === un; });
    if (!yq.length) return;
    h += setCard({ key: 'sec|' + u + '|' + y, name: y + ' · ' + us, title: y, range: yq.length + ' Q', themes: E(topicList(yq)), cov: qhCov(yq), more: false });
  });
  return h + '</div>';
};
function topicList(qs) {
  var c = {};
  qs.forEach(function (q) { if (q.topicCode) c[q.topicCode] = (c[q.topicCode] || 0) + 1; });
  return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 5).map(function (k) { return k + '×' + c[k]; }).join(' · ');
}

/* --------------------------------------------------------------- Topics */
V.ptopics = function () {
  var u = PQ.tu, un = META.units[u], h = subNav('ptopics') + screenHead('PYQs by topic', 'Every question on a syllabus topic, from all nine papers');
  h += '<div class="ptabs scrollchips" role="tablist" aria-label="Unit">' + META.units.map(function (x, i) {
    return tabBtn('pTopU', 'data-u="' + i + '"', META.taxonomy[x].short, Object.keys(META.taxonomy[x].topics).length + ' topics', qhCov(unitQs(i)), u === i);
  }).join('') + '</div><ul class="list ptlist">';
  var tps = META.taxonomy[un].topics;
  Object.keys(tps).sort(function (a, b) { return (+tps[a].code.replace(/\D/g, '')) - (+tps[b].code.replace(/\D/g, '')); }).forEach(function (name) {
    var code = tps[name].code, qs = DATA.filter(function (q) { return q.topicCode === code; }), cv = qhCov(qs), sec = NOTE_BY[code], open = !!PQ.open[code];
    h += '<li class="ptopic' + (open ? ' open' : '') + '"><button type="button" class="ptrow" data-act="pTopic" data-c="' + code + '" aria-expanded="' + open + '"><span class="tc ' + (cv.seen ? (cv.acc >= 70 ? 'ok' : cv.acc >= 45 ? 'warn' : 'bad') : 'none') + '">' + code + '</span>' +
      '<span class="tb"><b>' + E(sec ? sec.title : name) + '</b><span class="small muted">' + qs.length + ' PYQs' + (sec && sec.f27 ? ' · ~' + sec.f27 + ' in 2027' : '') + (cv.acc >= 0 ? ' · ' + cv.acc + '% right' : '') + '</span>' +
      '<span class="mbar"><i style="width:' + (qs.length ? Math.round(100 * cv.seen / qs.length) : 0) + '%"></i></span></span>' + svg('chev', 'go') + '</button>';
    if (open) {
      var subs = tps[name].subtopics || {};
      h += '<div class="ptbody"><div class="btnrow"><button type="button" class="btn sm primary" data-act="pSheet" data-key="pt|' + code + '" data-mode="learn">Learn all ' + qs.length + '</button>' +
        '<button type="button" class="btn sm" data-act="pSheet" data-key="pt|' + code + '" data-mode="exam">Exam</button>' +
        (sec ? navBtn('btn sm ghost', 'Notes', 'read', { k: 'n', id: code }) : '') + '</div>';
      var sk = Object.keys(subs);
      if (sk.length > 1) h += '<div class="small muted mt">Subtopics</div><div class="chiprow wrapchips">' + sk.map(function (s) {
        return '<button type="button" class="chip link" data-act="pSheet" data-key="' + E('pt|' + code + '|' + encodeURIComponent(s)) + '" data-mode="learn">' + E(s) + ' · ' + subs[s] + '</button>';
      }).join('') + '</div>';
      h += '</div>';
    }
    h += '</li>';
  });
  return h + '</ul>';
};

/* ------------------------------------------------------------ Forecasts */
V.forecast = function (p) {
  if (!FMETA) return '<div class="card"><h1>No forecast bank loaded</h1></div>';
  if (p && p.u) PQ.fu = p.u;
  var tab = PQ.fu, h = subNav('forecast') + screenHead('Forecast practice', FMETA.total + ' AI-generated questions for 2027 in ' + FMETA.mocks.length + ' mocks of ' + FMETA.mockSize, qhCov(FDATA));
  h += '<div class="banner info"><b>Not previous-year questions.</b> Forecast items are kept apart from the PYQs and never appear in a PYQ mock or in PYQ analytics.</div>';
  h += '<div class="ptabs scrollchips" role="tablist" aria-label="Forecast">' + ['Probability', 'Statistical Methods'].map(function (u) {
    var ms = FMETA.mocks.filter(function (m) { return m.unit === u; }), qs = [];
    ms.forEach(function (m) { qs = qs.concat(m.questionIds.map(function (i) { return BY_ID[i]; }).filter(Boolean)); });
    return tabBtn('pFcU', 'data-u="' + u + '"', E(u === 'Probability' ? 'Probability' : 'Stat Methods'), ms.length + ' mocks', qhCov(qs), tab === u);
  }).join('') + tabBtn('pFcU', 'data-u="topic"', 'By topic', '24 topics', qhCov(FDATA), tab === 'topic') + '</div>';
  if (tab === 'topic') {
    var tc = {};
    FDATA.forEach(function (q) { (tc[q.topic] = tc[q.topic] || []).push(q); });
    h += '<ul class="list ptlist">' + Object.keys(tc).sort().map(function (t) {
      var cv = qhCov(tc[t]);
      return '<li class="ptopic"><button type="button" class="ptrow" data-act="pSheet" data-key="' + E('fct|' + encodeURIComponent(t)) + '" data-mode="learn"><span class="tc none">' + tc[t].length + '</span><span class="tb"><b>' + E(t) + '</b>' +
        '<span class="mbar"><i style="width:' + Math.round(100 * cv.seen / cv.n) + '%"></i></span></span>' + svg('chev', 'go') + '</button></li>';
    }).join('') + '</ul>';
    return h;
  }
  var ms2 = FMETA.mocks.filter(function (m) { return m.unit === tab; }), names = ms2.map(function (m) { return m.name; }), nx = nextSetKey(names);
  h += '<div class="psets">';
  ms2.forEach(function (m, i) {
    var qs = m.questionIds.map(function (x) { return BY_ID[x]; }).filter(Boolean);
    h += setCard({ key: 'fc|' + m.id, name: m.name, title: E(m.name.replace(/^.*Forecast Mock /, 'Mock ')), range: m.count + ' Q', themes: E(m.topics.slice(0, 3).join(' · ') + (m.topics.length > 3 ? ' · …' : '')), cov: qhCov(qs), next: nx === i, more: false });
  });
  return h + '</div>';
};

/* ------------------------------------------------- top-left menu (drawer) */
var DRAWER_OF = { pyq: 'pyq', ptopics: 'ptopics', sectional: 'sectional', mocks: 'mocks', forecast: 'forecast', cs: 'cs', gk: 'gk', home: 'home', learn: 'learn', read: 'learn', topic: 'learn',
  dists: 'dists', dist: 'dists', cards: 'cards', revise: 'revise', revlist: 'revise', rev: 'revise', ledger: 'revise', analytics: 'analytics', history: 'history', search: 'search', nsearch: 'search',
  settings: 'settings', help: 'help', audit: 'settings', examhub: 'examhub', more: 'more' };
function drawerHtml() {
  var d = Store.d(), ds = dueSummary(), cs = CMETA ? csCov(CDATA) : { seen: 0, n: 0 }, py = qhCov(DATA), fc = qhCov(FDATA);
  var cur = DRAWER_OF[ROUTE.name] || '';
  function it(r, ic, t, sub, badge) {
    return '<button type="button" class="ditem' + (cur === r ? ' on' : '') + '" data-act="nav" data-r="' + r + '">' + svg(ic) + '<span class="dl"><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
      (badge ? '<span class="db">' + badge + '</span>' : '') + '</button>';
  }
  var secs = todaySecs();
  var h = '<div class="dhead"><div class="dh1">Statistics Paper-I</div><div class="dh2">UPSC ISS 2027 · works offline</div><div class="dh3"><span>' + Math.floor(secs / 60) + ' min today</span><span>' + streakDays() + '-day streak</span></div></div><div class="dscroll">';
  h += '<div class="dgrp">Practise</div>' +
    it('pyq', 'list', 'PYQs', META.totalQuestions + ' · year by year', py.n ? Math.round(100 * py.seen / py.n) + '%' : '') +
    it('ptopics', 'target', 'Topics', 'PYQs by syllabus topic') +
    it('sectional', 'chart', 'Sectional', 'One unit at a time') +
    it('mocks', 'exam', 'PYQ mocks', 'Full papers and random mocks') +
    it('forecast', 'bolt', 'Forecasts', FMETA ? FMETA.total + ' · AI-generated' : '', fc.n ? Math.round(100 * fc.seen / fc.n) + '%' : '') +
    it('cs', 'monitor', 'Computer', CMETA ? CMETA.total + ' · chapter sets' : '', cs.n ? Math.round(100 * cs.seen / cs.n) + '%' : '') +
    it('gk', 'book', 'Gupta &amp; Kapoor', GMETA ? GMETA.total + ' · Ch 5–8' : '');
  h += '<div class="dgrp">Study</div>' + it('learn', 'learn', 'Notes &amp; traps', 'Topics, sections, recall') + it('dists', 'sigma', 'Formula handbook', DISTS.length + ' distributions') + it('cards', 'cards', 'Flashcards', 'Formulas and notes tables');
  h += '<div class="dgrp">My progress</div>' + it('revise', 'revise', 'Revise', 'Wrong · marked · due', ds.total ? String(ds.total) : '') + it('examhub', 'clock', 'Exam hub', 'Timed drills and mocks') +
    it('analytics', 'chart', 'Analytics', '') + it('history', 'clock', 'History', '') + it('search', 'search', 'Search', 'Questions, notes, formulas');
  h += '<div class="dgrp">App</div>' + it('settings', 'gear', 'Settings &amp; data', 'Marking, backup, reset') +
    '<button type="button" class="ditem" data-act="disp">' + svg('aa') + '<span class="dl"><b>Display &amp; reading</b><small>Text size, spacing, goal</small></span></button>' + it('help', 'list', 'How it works', '');
  return h + '</div>';
}
function buildDrawer() {
  var d = document.getElementById('drawer');
  if (d) return d;
  d = document.createElement('div');
  d.id = 'drawer'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<div class="dscrim" data-drawer-close="1"></div><nav class="dpanel" aria-label="Sections"></nav>';
  document.body.appendChild(d);
  var sx = 0, sy = 0;
  d.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  d.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0];
    if (t.clientX - sx < -70 && Math.abs(t.clientY - sy) < 60) drawerClose();
  }, { passive: true });
  return d;
}
function drawerOpen() {
  if (SHEET) closeSheet(true);
  var d = buildDrawer();
  d.querySelector('.dpanel').innerHTML = drawerHtml();
  d.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
  pushSent();
  var on = d.querySelector('.ditem.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
}
/* drop the drawer without touching history (a navigation follows and replaces the sentinel) */
function drawerHide() {
  document.body.classList.remove('drawer-open');
  var d = document.getElementById('drawer'); if (d) d.setAttribute('aria-hidden', 'true');
}
function drawerClose(after) { if (!document.body.classList.contains('drawer-open')) { if (after) after(); return; } drawerHide(); popSent(after); }

/* ------------------------------------------------------------ home tiles */
function practiceTiles() {
  var t = [['pyq', 'list', 'PYQs', 'Year by year'], ['ptopics', 'target', 'Topics', 'By syllabus topic'], ['sectional', 'chart', 'Sectional', 'One unit at a time'], ['mocks', 'exam', 'PYQ mocks', 'Full papers'],
    ['forecast', 'bolt', 'Forecasts', 'AI-generated 2027'], ['cs', 'monitor', 'Computer', 'Chapter sets'], ['gk', 'book', 'Gupta &amp; Kapoor', 'Textbook problems']];
  return '<div class="card"><div class="plh"><h3>Practice banks</h3><button type="button" class="chip link" data-act="menu">Menu ☰</button></div><div class="ptiles">' + t.map(function (x) {
    return '<button type="button" class="ptile" data-act="nav" data-r="' + x[0] + '"><span class="pi">' + svg(x[1]) + '</span><span class="pt"><b>' + x[2] + '</b><small>' + x[3] + '</small></span></button>';
  }).join('') + '</div></div>';
}

/* ------------------------------------------------------------------ clicks */
function practiceClick(act, t) {
  switch (act) {
    case 'menu': drawerOpen(); return true;
    case 'pYear': PQ.y = +t.getAttribute('data-y'); render(); return true;
    case 'pSecU': PQ.su = +t.getAttribute('data-u'); render(); return true;
    case 'pTopU': PQ.tu = +t.getAttribute('data-u'); render(); return true;
    case 'pFcU': PQ.fu = t.getAttribute('data-u'); render(); return true;
    case 'pTopic': { var c = t.getAttribute('data-c'); PQ.open[c] = !PQ.open[c]; render(); return true; }
    case 'pGo': directStart(resolveSet(t.getAttribute('data-key')), t.getAttribute('data-mode')); return true;
    case 'pSheet': {
      var sp = resolveSet(t.getAttribute('data-key'));
      if (!sp || !sp.ids.length) { toast('Nothing to practise here yet.'); return true; }
      nbStart(sp, t.getAttribute('data-mode') || 'learn');
      return true;
    }
  }
  return false;
}
