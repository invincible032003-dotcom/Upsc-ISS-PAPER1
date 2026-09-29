/* ======================================================================
   NB-5.  REVISE mode: due queue (spaced repetition), wrong answers, skipped,
          marked, bookmarks, saved notes, trap-class error ledger
   ====================================================================== */
var REV = { keys: [], i: 0, phase: 'front', pick: null, title: '', stats: [0, 0, 0, 0], t0: 0, done: false, back: 'revise', hit: 0, seen: 0 };
var RL = { k: 'wrong', more: 40 };
var COLL = {
  wrong:   ['Wrong answers', 'Every question you got wrong stays here until you answer it right.', 'bad'],
  skipped: ['Skipped', 'Questions you left blank in a paper.', 'warn'],
  marked:  ['Marked for review', 'Questions you flagged during a paper or in Learn mode.', 'mark'],
  bm:      ['Bookmarks', 'Questions you starred to keep.', 'brand'],
  notes:   ['Saved notes', 'Note groups you saved for revision.', 'ok']
};

/* ----------------------------------------------------------- data helpers */
function revIds(k) {
  var d = Store.d(), src = k === 'wrong' ? d.mistakes : k === 'skipped' ? d.skipped : k === 'marked' ? d.marked : k === 'bm' ? d.bookmarks : {};
  var ids = Object.keys(src || {}).filter(function (i) { return BY_ID[i]; });
  ids.sort(function (a, b) {
    var x = src[a], y = src[b];
    var tx = typeof x === 'object' ? x.t : x, ty = typeof y === 'object' ? y.t : y;
    return (ty || 0) - (tx || 0);
  });
  return ids;
}
function savedNotes() {
  var d = Store.d(), out = [];
  Object.keys(d.nsave || {}).forEach(function (k) {
    var p = k.slice(2).split('|'), sec = secOf(p[0], p[1]);
    if (sec && sec.groups[+p[2]]) out.push({ key: k, kind: p[0], sid: p[1], gi: +p[2], sec: sec, g: sec.groups[+p[2]], t: d.nsave[k] });
  });
  out.sort(function (a, b) { return b.t - a.t; });
  return out;
}
function revCount(k) { return k === 'notes' ? savedNotes().length : revIds(k).length; }
function dueKeys() {
  return srDueKeys().filter(function (k) {
    if (k.charAt(0) === 'q') return !!BY_ID[k.slice(2)];
    if (k.charAt(0) === 'c') return !!cardMeta(k);
    if (k.charAt(0) === 'n') { var p = k.slice(2).split('|'), s = secOf(p[0], p[1]); return !!(s && s.groups[+p[2]]); }
    return false;
  });
}
function ledgerCounts() {
  var d = Store.d(), c = {};
  Object.keys(d.mistakes || {}).forEach(function (id) {
    var q = BY_ID[id];
    if (q && q.cls) c[q.cls] = (c[q.cls] || 0) + (d.mistakes[id].c || 1);
  });
  return c;
}
function topicAcc() {
  var qh = Store.d().qh || {}, m = {};
  Object.keys(qh).forEach(function (id) {
    var q = BY_ID[id]; if (!q || !q.topicCode) return;
    var a = m[q.topicCode] = m[q.topicCode] || { a: 0, c: 0 };
    a.a += qh[id].a; a.c += qh[id].c;
  });
  Object.keys(m).forEach(function (c) { m[c].acc = m[c].a ? m[c].c / m[c].a : 0; });
  return m;
}
function weakTopics(minAtt) {
  var m = topicAcc(), out = [];
  Object.keys(m).forEach(function (c) { if (m[c].a >= (minAtt || 4) && m[c].acc < 0.65 && TOPIC_BY[c]) out.push({ code: c, acc: m[c].acc, a: m[c].a }); });
  out.sort(function (a, b) { return a.acc - b.acc; });
  return out;
}
function dueSummary() {
  var keys = dueKeys(), q = 0, c = 0, n = 0;
  keys.forEach(function (k) { var t = k.charAt(0); if (t === 'q') q++; else if (t === 'c') c++; else n++; });
  var mins = Math.max(1, Math.round(q * 1 + c * 0.4 + n * 1.5));
  return { keys: keys, q: q, c: c, n: n, total: keys.length, mins: mins };
}

/* -------------------------------------------------------------- the hub */
V.revise = function () {
  var d = Store.d(), ds = dueSummary(), h = '';
  h += '<div class="rv-hero"><div class="rvh-t"><div class="rvh-n">' + ds.total + '</div><div><b>due now</b><div class="small muted">' +
    (ds.total ? ds.q + ' questions · ' + ds.c + ' cards · ' + ds.n + ' notes · about ' + ds.mins + ' min' : 'Nothing is due. Add wrong answers or saved notes and they return on schedule.') + '</div></div></div>' +
    (ds.total ? '<div class="btnrow mt"><button type="button" class="btn primary lg" data-act="revDue" data-n="10">' + svg('play') + 'Quick 10 <small>~' + Math.max(1, Math.min(ds.mins, 10)) + ' min</small></button>' +
      '<button type="button" class="btn" data-act="revDue" data-n="25">Do 25</button><button type="button" class="btn" data-act="revDue" data-n="999">All ' + ds.total + '</button></div>' : '') + '</div>';

  h += '<h3 class="sect">My collections</h3><div class="collgrid">';
  Object.keys(COLL).forEach(function (k) {
    var n = revCount(k);
    h += '<button type="button" class="coll ' + COLL[k][2] + '" data-act="nav" data-r="revlist" data-p="k=' + k + '"><span class="cn">' + n + '</span><span class="cl">' + COLL[k][0] + '</span></button>';
  });
  var lc = ledgerCounts(), lt = 0; Object.keys(lc).forEach(function (c) { lt += lc[c]; });
  h += '<button type="button" class="coll" data-act="nav" data-r="ledger"><span class="cn">' + lt + '</span><span class="cl">Error ledger</span></button></div>';

  var wk = weakTopics(4);
  if (wk.length) {
    h += '<h3 class="sect">Weak topics <small class="muted">accuracy under 65%</small></h3><ul class="list wk">';
    wk.slice(0, 5).forEach(function (w) {
      h += '<li><div class="wl"><b>' + E(w.code) + '</b> ' + E(topicName(w.code)) + '<div class="bar"><i class="' + (w.acc >= .5 ? 'warn' : 'bad') + '" style="width:' + Math.round(w.acc * 100) + '%"></i></div></div>' +
        '<div class="wb">' + navBtn('btn sm', 'Notes', NOTE_BY[w.code] ? 'read' : 'topic', NOTE_BY[w.code] ? { k: 'n', id: w.code } : { c: w.code }) +
        '<button type="button" class="btn sm primary" data-act="wkPractice" data-c="' + w.code + '">Drill</button></div></li>';
    });
    h += '</ul>';
  }

  var hist = (d.history || []).slice(0, 4);
  if (hist.length) {
    h += '<h3 class="sect">Recent sessions</h3><ul class="list recent">';
    hist.forEach(function (a) {
      h += '<li><div><b>' + E(a.name) + '</b><div class="small muted">' + dateStr(a.ts) + ' · ' + (a.mode === 'exam' ? 'Exam' : 'Learn') + ' · ' + a.correct + '/' + a.total + ' correct</div></div><span class="chip ' + (a.pct >= 60 ? 'ok' : a.pct >= 35 ? 'warn' : 'bad') + '">' + fx(a.pct, 0) + '%</span></li>';
    });
    h += '</ul>';
  }
  h += '<div class="btnrow mt"><button type="button" class="btn" data-act="nav" data-r="cards">' + svg('cards') + 'Flashcards</button>' +
    '<button type="button" class="btn ghost" data-act="nav" data-r="history">History</button><button type="button" class="btn ghost" data-act="nav" data-r="analytics">Analytics</button></div>';
  return h;
};

/* ---------------------------------------------------- collection lists */
V.revlist = function (p) {
  var k = p.k && COLL[p.k] ? p.k : 'wrong';
  if (RL.k !== k) { RL.k = k; RL.more = 40; }
  var d = Store.d(), meta = COLL[k], h = '';
  h += '<div class="pagehead"><h1>' + meta[0] + '</h1><p class="small muted">' + meta[1] + '</p></div>';
  if (k === 'notes') {
    var ns = savedNotes();
    if (!ns.length) return h + '<div class="empty">Nothing saved. In any notes group, tap <b>Save for revision</b>.</div>';
    h += '<div class="btnrow mb"><button type="button" class="btn primary" data-act="revNotes">' + svg('play') + 'Revise these ' + ns.length + '</button></div><ul class="list">';
    ns.forEach(function (n) {
      h += '<li class="rli"><div class="top"><span class="chip brand">' + E(n.sid) + '</span><span class="small muted">' + E(n.sec.title) + '</span></div><div class="rq"><b>' + NR(n.g.title) + '</b></div>' +
        '<div class="btnrow mt">' + navBtn('btn sm', 'Open', 'read', { k: n.kind, id: n.sid, g: n.gi }) + '<button type="button" class="btn sm ghost" data-act="grpUnsave" data-key="' + E(n.key) + '">Remove</button></div></li>';
    });
    return h + '</ul>';
  }
  var ids = revIds(k);
  if (!ids.length) return h + '<div class="empty">' + (k === 'wrong' ? 'No wrong answers yet. Take a drill or a mock and every miss lands here automatically.' : 'Nothing here yet.') + '</div>';
  h += '<div class="btnrow mb col2">' +
    '<button type="button" class="btn primary" data-act="revListPractice" data-mode="learn">' + svg('book') + 'Learn these ' + ids.length + '</button>' +
    '<button type="button" class="btn" data-act="revListPractice" data-mode="exam">' + svg('exam') + 'Test me</button>' +
    '<button type="button" class="btn" data-act="revListCards">' + svg('revise') + 'As revision cards</button>' +
    '<button type="button" class="btn danger ghost" data-act="revListClear">Clear</button></div>';
  h += '<ul class="list">';
  ids.slice(0, RL.more).forEach(function (id) {
    var q = BY_ID[id], m = k === 'wrong' ? d.mistakes[id] : k === 'skipped' ? d.skipped[id] : null;
    h += '<li class="rli"><div class="top"><span class="id">' + E(id) + '</span>' + (q.topicCode ? '<span class="chip">' + E(q.topicCode) + '</span>' : '') +
      (q.cls ? '<span class="chip warn">' + E(clsName(q.cls)) + '</span>' : '') + (m ? '<span class="chip ' + (k === 'wrong' ? 'bad' : 'warn') + '">' + (k === 'wrong' ? 'missed ' : 'skipped ') + m.c + '×</span>' : '') + '</div>' +
      '<div class="rq">' + qBody(q) + '</div>' +
      '<div class="btnrow mt"><button type="button" class="btn sm" data-act="study" data-qid="' + E(id) + '" data-back="back">Solution</button>' +
      '<button type="button" class="btn sm ghost" data-act="revRemove" data-k="' + k + '" data-qid="' + E(id) + '">Remove</button></div></li>';
  });
  h += '</ul>';
  if (ids.length > RL.more) h += '<button type="button" class="btn block" data-act="revMore">Show more (' + (ids.length - RL.more) + ' left)</button>';
  return h;
};
V.mistakes = function () { return V.revlist({ k: 'wrong' }); };
V.bookmarks = function () { return V.revlist({ k: 'bm' }); };

/* ---------------------------------------------------------- error ledger */
V.ledger = function () {
  var d = Store.d(), lc = ledgerCounts(), tot = 0, rep = 0, uniq = 0;
  Object.keys(d.mistakes || {}).forEach(function (id) { if (BY_ID[id]) { uniq++; tot += d.mistakes[id].c; if (d.mistakes[id].c > 1) rep++; } });
  var h = '<div class="pagehead"><h1>Error ledger</h1><p class="small muted">Every mistake is tagged with the trap class it belongs to. Revise the ledger, not the textbook: the target in the compendium is a repeat-error rate under 10%.</p></div>';
  h += '<div class="kpis"><div class="kpi bad"><div class="v">' + uniq + '</div><div class="l">Open mistakes</div></div><div class="kpi"><div class="v">' + tot + '</div><div class="l">Total misses</div></div>' +
    '<div class="kpi ' + (uniq && rep / uniq > .1 ? 'warn' : 'ok') + '"><div class="v">' + (uniq ? Math.round(100 * rep / uniq) : 0) + '%</div><div class="l">Repeat rate</div></div></div>';
  var ks = Object.keys(TRAP_CLS);
  h += '<h3 class="sect">By trap class</h3><ul class="list cls">';
  ks.sort(function (a, b) { return (lc[b] || 0) - (lc[a] || 0); }).forEach(function (c) {
    var n = lc[c] || 0, pool = NDATA.filter(function (q) { return q.cls === c; }).length;
    h += '<li><div class="cl2"><b>' + E(TRAP_CLS[c][0]) + '</b><span class="small muted">' + E(TRAP_CLS[c][1]) + '</span></div><div class="cr"><span class="chip ' + (n ? 'bad' : '') + '">' + n + '</span>' +
      '<button type="button" class="btn sm primary" data-act="clsPractice" data-c="' + c + '"' + (pool ? '' : ' disabled') + '>Drill ' + pool + '</button></div></li>';
  });
  h += '</ul>';
  var un = 0;
  Object.keys(d.mistakes || {}).forEach(function (id) { var q = BY_ID[id]; if (q && !q.cls) un++; });
  if (un) h += '<p class="small muted">' + un + ' wrong answers come from past papers and are not class-tagged. Read the solution and note the class yourself.</p>';
  var tm = topicAcc(), rows = Object.keys(tm).filter(function (c) { return tm[c].a >= 2; }).sort(function (a, b) { return tm[a].acc - tm[b].acc; }).slice(0, 8);
  if (rows.length) {
    h += '<h3 class="sect">Topic accuracy (lowest first)</h3><ul class="list wk">';
    rows.forEach(function (c) {
      h += '<li><div class="wl"><b>' + E(c) + '</b> ' + E(topicName(c)) + ' <span class="small muted">' + tm[c].c + '/' + tm[c].a + '</span><div class="bar"><i class="' + (tm[c].acc >= .7 ? 'ok' : tm[c].acc >= .45 ? 'warn' : 'bad') + '" style="width:' + Math.round(tm[c].acc * 100) + '%"></i></div></div></li>';
    });
    h += '</ul>';
  }
  return h;
};

/* ------------------------------------------------------ the revision runner */
function revStart(keys, title, opts) {
  keys = keys.filter(function (k) {
    if (k.charAt(0) === 'q') { var q = BY_ID[k.slice(2)]; return q && scorable(q) && q.options && q.options.length; }
    return true;
  });
  if (!keys.length) { toast('Nothing to revise right now.'); return; }
  REV = { keys: keys, i: 0, phase: 'front', pick: null, title: title || 'Revision', stats: [0, 0, 0, 0], t0: Date.now(), done: false, back: (opts && opts.back) || 'revise', hit: 0, seen: 0 };
  go('rev');
}
function revItem() {
  var k = REV.keys[REV.i];
  if (!k) return null;
  var t = k.charAt(0);
  if (t === 'q') return { t: 'q', k: k, q: BY_ID[k.slice(2)] };
  if (t === 'c') return { t: 'c', k: k, c: cardOf(k) };
  var p = k.slice(2).split('|'), sec = secOf(p[0], p[1]);
  return { t: 'n', k: k, kind: p[0], sid: p[1], gi: +p[2], sec: sec };
}
function ratingBar(k, suggest) {
  var pv = srPreview(k), lab = ['Again', 'Hard', 'Good', 'Easy'];
  var h = '<div class="ratebar" role="group" aria-label="How well did you know it?">';
  for (var i = 0; i < 4; i++) h += '<button type="button" class="r' + i + (suggest === i ? ' sug' : '') + '" data-act="revRate" data-r="' + i + '"><b>' + lab[i] + '</b><small>' + pv[i] + '</small></button>';
  return h + '</div>';
}
V.rev = function () {
  if (!REV.keys.length) return '<div class="card"><h2>No revision in progress</h2>' + navBtn('btn primary', 'Open Revise', 'revise') + '</div>';
  var total = REV.keys.length;
  if (REV.done || REV.i >= total) return revSummary();
  var it = revItem(), h = '';
  var left = Math.max(1, Math.round((total - REV.i) * (it.t === 'q' ? 1 : 0.5)));
  h += '<div class="rv-top"><div class="progbar"><i style="width:' + Math.round(100 * REV.i / total) + '%"></i></div><div class="rvt"><b>' + (REV.i + 1) + ' / ' + total + '</b><span class="muted">' + E(REV.title) + ' · ~' + left + ' min left</span></div></div>';
  if (it.t === 'q') {
    var q = it.q, order = q.options.map(function (x, i) { return i; }), back = REV.phase === 'back';
    h += '<div class="card rv-card">' + qMetaLine(q) + sharedStemHtml(q) + '<div class="qtext">' + qBody(q) + '</div>';
    h += optionList(q, order, REV.pick, { showAnswer: back, disabled: back }).replace(/data-act="opt"/g, 'data-act="revPick"');
    if (!back) h += '<div class="btnrow mt"><button type="button" class="btn block" data-act="revShow">Show answer</button></div>';
    else h += '<div class="reveal">' + revealPanes(q, REV.pick) + '</div>';
    h += '</div>';
    if (back) h += ratingBar(it.k, REV.pick === null ? -1 : (REV.pick === q.correctAnswer ? 2 : 0));
  } else if (it.t === 'c') {
    var c = it.c, bk = REV.phase === 'back';
    if (!c) { REV.i++; return V.rev(); }
    h += '<div class="card deckcard' + (bk ? '' : '') + '"><div class="cf-tag">' + E(c.tag) + '</div>' + c.front +
      (bk ? '<hr class="sep"><div class="cf-back">' + c.back + '</div>' + (c.open ? '<div class="btnrow mt">' + navBtn('btn sm ghost', 'Open in notes', c.open.r, c.open.p) + '</div>' : '') : '<div class="btnrow mt"><button type="button" class="btn primary block lg" data-act="revShow">Show answer</button></div>') + '</div>';
    if (bk) h += ratingBar(it.k, -1);
  } else {
    var g = it.sec.groups[it.gi], bk2 = REV.phase === 'back';
    h += '<div class="card"><div class="cf-tag">' + E(it.sid + ' · ' + it.sec.title) + '</div><h2>' + NR(g.title) + '</h2>' +
      (bk2 ? '<div class="reader">' + groupBodyHtml(it.kind, it.sid, it.gi, false, true) + '</div>' : '<p class="muted">Recall the key points, formulas and traps of this group, then reveal.</p><div class="btnrow mt"><button type="button" class="btn primary block lg" data-act="revShow">Reveal</button></div>') + '</div>';
    if (bk2) h += ratingBar(it.k, -1);
  }
  return h;
};
function revSummary() {
  var st = REV.stats, n = st[0] + st[1] + st[2] + st[3], secs = Math.round((Date.now() - REV.t0) / 1000), ds = dueSummary();
  var h = '<div class="rv-done"><div class="big-check">' + svg('check') + '</div><h1>Session complete</h1><p class="muted">' + n + ' item' + (n === 1 ? '' : 's') + ' in ' + humanTime(secs) + '</p>' +
    '<div class="kpis"><div class="kpi bad"><div class="v">' + st[0] + '</div><div class="l">Again</div></div><div class="kpi warn"><div class="v">' + st[1] + '</div><div class="l">Hard</div></div>' +
    '<div class="kpi ok"><div class="v">' + st[2] + '</div><div class="l">Good</div></div><div class="kpi ok"><div class="v">' + st[3] + '</div><div class="l">Easy</div></div></div>';
  if (REV.seen) h += '<p class="small">Questions answered correctly: <b>' + REV.hit + '</b> of ' + REV.seen + '.</p>';
  h += '<p class="small muted">Streak: <b>' + streakDays() + '</b> day' + (streakDays() === 1 ? '' : 's') + ' · ' + ds.total + ' still due</p>' +
    '<div class="btnrow center-row">' + (ds.total ? '<button type="button" class="btn primary" data-act="revDue" data-n="10">' + svg('play') + 'Another 10</button>' : '') +
    navBtn('btn', 'Back to Revise', 'revise') + navBtn('btn ghost', 'Home', 'home') + '</div></div>';
  return h;
}

/* ------------------------------------------------------------------ clicks */
function revisePool(ids, title, mode) {
  ids = ids.filter(function (i) { return BY_ID[i]; });
  if (!ids.length) { toast('Nothing to practise.'); return; }
  nbStart({ title: title, sub: ids.length + ' questions', ids: ids, shuffle: true, tag: 'revise', kind: 'mistakes' }, mode);
}
function reviseClick(act, t) {
  var d = Store.d();
  switch (act) {
    case 'revDue': {
      var n = +t.getAttribute('data-n') || 10, keys = dueKeys().slice(0, n);
      revStart(keys, 'Due now', { back: 'revise' });
      return true;
    }
    case 'revNotes': revStart(savedNotes().map(function (x) { return x.key; }), 'Saved notes', { back: 'revlist' }); return true;
    case 'revListCards': revStart(revIds(RL.k).map(function (i) { return 'q:' + i; }), COLL[RL.k][0], { back: 'revlist' }); return true;
    case 'revListPractice': revisePool(revIds(RL.k), COLL[RL.k][0], t.getAttribute('data-mode')); return true;
    case 'revListClear':
      if (window.confirm('Clear ' + COLL[RL.k][0].toLowerCase() + '?')) {
        var src = RL.k === 'wrong' ? 'mistakes' : RL.k === 'skipped' ? 'skipped' : RL.k === 'marked' ? 'marked' : 'bookmarks';
        d[src] = {}; Store.save(); render();
      }
      return true;
    case 'revRemove': {
      var k = t.getAttribute('data-k'), id = t.getAttribute('data-qid');
      var m = k === 'wrong' ? d.mistakes : k === 'skipped' ? d.skipped : k === 'marked' ? d.marked : d.bookmarks;
      delete m[id]; Store.save();
      toast('Removed.', { label: 'Undo', fn: function () { m[id] = k === 'wrong' || k === 'skipped' ? { c: 1, t: Date.now() } : Date.now(); Store.save(); render(); } });
      render();
      return true;
    }
    case 'revMore': RL.more += 40; render(); return true;
    case 'grpUnsave': { delete d.nsave[t.getAttribute('data-key')]; Store.save(); render(); return true; }
    case 'wkPractice': {
      var code = t.getAttribute('data-c'), ids = ordinalIds(DATA.filter(function (q) { return q.topicCode === code; })).concat(nbIds(['nm', 'drill-1', 'drill-2'], code));
      revisePool(ids, code + ' · weak-topic drill', 'learn');
      return true;
    }
    case 'clsPractice': {
      var c = t.getAttribute('data-c'), mis = Store.d().mistakes || {};
      var pool = NDATA.filter(function (q) { return q.cls === c; }).map(function (q) { return { id: q.id, w: mis[q.id] ? 0 : 1 + Math.random() }; })
        .sort(function (a, b) { return a.w - b.w; }).slice(0, 40).map(function (x) { return x.id; });
      nbStart({ title: 'Trap class · ' + clsName(c), sub: TRAP_CLS[c][1], ids: pool, shuffle: true, tag: 'cls-' + c }, 'learn');
      return true;
    }
    case 'revShow': REV.phase = 'back'; render(); window.scrollTo(0, 0); return true;
    case 'revPick': {
      var it = revItem();
      if (!it || it.t !== 'q' || REV.phase === 'back') return true;
      REV.pick = +t.getAttribute('data-i'); REV.phase = 'back';
      render();
      return true;
    }
    case 'revRate': {
      var r = +t.getAttribute('data-r'), it2 = revItem();
      if (!it2) return true;
      srRate(it2.k, r);
      REV.stats[r]++;
      if (it2.t === 'q') {
        var q = it2.q;
        if (REV.pick !== null) {
          var ok = REV.pick === q.correctAnswer;
          qhRecord(q.id, ok, REV.pick); REV.seen++; if (ok) REV.hit++;
          if (ok) { delete d.mistakes[q.id]; delete d.skipped[q.id]; }
          else { var m2 = d.mistakes[q.id] || { c: 0, t: 0 }; m2.c++; m2.t = Date.now(); d.mistakes[q.id] = m2; }
        }
        if (r >= 2 && REV.pick === null && d.mistakes[q.id]) { /* self-rated as known: keep it in the ledger until answered */ }
      }
      Store.save();
      REV.i++; REV.phase = 'front'; REV.pick = null;
      if (REV.i >= REV.keys.length) REV.done = true;
      render(); window.scrollTo(0, 0);
      return true;
    }
  }
  return false;
}
