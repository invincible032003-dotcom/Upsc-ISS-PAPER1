/* ======================================================================
   NB-3.  Question banks: badges, reveal panes, start sheet, blueprint mock,
          session persistence, time management, result insights
   ====================================================================== */
var MIN_PER_Q = { learn: 2, exam: 1.5 };
function paperCfg() { return Store.d().settings; }
function minPerQ() { return paperCfg().minutesPerQuestion || 1.5; }
function markLabel() {
  var st = paperCfg();
  return '+' + fx(st.marksCorrect, 2).replace(/\.?0+$/, '') + (st.negativeMarkingEnabled ? ' / −' + fx(st.negativeMarkFraction * st.marksCorrect, 2) : ' / 0');
}

/* -------------------------------------------------------------- badges */
function nbBadge(q) {
  var b = q.nbBank, lab = b === 'nm' ? 'Notes mock' : b === 'dh' ? 'Formula mock' : /^tf/.test(b) ? 'True/False' : 'Drill';
  return '<span class="nb-badge">NOTES · ' + lab + '</span>';
}
function nbMetaLine(q) {
  return '<div class="qmeta">' + nbBadge(q) + '<span>' + E(q.id) + '</span><span>' + E(q.topicCode + ' · ' + topicName(q.topicCode)) +
    '</span><span>' + E(clsName(q.cls)) + '</span></div>';
}

/* ------------------------------------------------ reveal panes (learning mode) */
function nbRevealPanes(q, chosen, opts) {
  opts = opts || {};
  var study = ROUTE.name === 'study';
  var answered = chosen !== null && chosen !== undefined;
  var ok = answered && chosen === q.correctAnswer;
  var cls = !answered ? (study ? 'verdict-ok' : 'verdict-skip') : (ok ? 'verdict-ok' : 'verdict-bad');
  var verdict = !answered ? (study ? 'Answer' : 'Not answered') : (ok ? 'Correct' : 'Incorrect');
  var h = '<div class="pane ' + cls + '"><div class="hd"><span class="step">1</span>' + verdict + '</div><div class="bd">';
  if (!study) h += '<div class="small"><b>Your answer:</b> ' + (answered ? '(' + LET[chosen] + ') ' + R(q.options[chosen]) : '<span class="muted">not attempted</span>') + '</div>';
  h += '<div class="small' + (study ? '' : ' mt') + '"><b>Correct answer:</b> (' + LET[q.correctAnswer] + ') ' + R(q.options[q.correctAnswer]) + '</div></div></div>';

  var steps = q.solution || [];
  h += '<div class="pane"><div class="hd"><span class="step">2</span>' + (q.questionType === 'True/False' ? 'Reason' : 'Why') + '</div><div class="bd">';
  if (steps.length > 1) { h += '<ol>'; steps.forEach(function (s) { h += '<li>' + R(s.text) + '</li>'; }); h += '</ol>'; }
  else h += '<div>' + R(q.examShortcut) + '</div>';
  h += '</div></div>';

  if (q.cls) {
    var c = ledgerCounts(), tc = TRAP_CLS[q.cls];
    h += '<div class="pane"><div class="hd"><span class="step">3</span>Trap class</div><div class="bd small">' +
      '<span class="chip warn">' + E(clsName(q.cls)) + '</span> ' + (tc ? E(tc[1]) : '') +
      (c[q.cls] ? '<div class="mt muted">You have missed <b>' + c[q.cls] + '</b> question' + (c[q.cls] === 1 ? '' : 's') + ' of this class so far.</div>' : '') + '</div></div>';
  }
  h += nbNotesPane(q);
  var on = !!(Store.d().marked || {})[q.id];
  h += '<div class="btnrow mt"><button type="button" class="btn sm' + (on ? ' on' : '') + '" data-act="flagQ" data-qid="' + E(q.id) + '">' + svg('flag') + '<span>' + (on ? 'Marked for revision' : 'Mark for revision') + '</span></button></div>';
  return h;
}

/* -------------------------------------------------------------- pools */
function ordinalIds(list) { return list.map(function (q) { return q.id; }); }
function nbIds(banks, code) {
  return NDATA.filter(function (q) { return banks.indexOf(q.nbBank) >= 0 && (!code || q.topicCode === code); }).map(function (q) { return q.id; });
}
function topicPools(code) {
  var pools = [], add = function (id, label, sub, ids, extra) {
    if (ids.length) pools.push({ id: id, label: label, sub: sub, ids: ids, time: 0 });
  };
  add('nm', 'Notes MCQs', 'Written from these notes', nbIds(['nm'], code));
  add('drill', 'Drill sets', 'Forecast drills D1–D74', nbIds(['drill-1', 'drill-2'], code));
  add('tf', 'True / False', 'Rapid-fire statements', nbIds(['tf-notes', 'tf-sm', 'tf-trap'], code));
  add('dh', 'Formula MCQs', 'Handbook values', nbIds(['dh'], code));
  add('pyq', 'Past-year questions', '2018–2026, authentic', ordinalIds(DATA.filter(function (q) { return q.topicCode === code; })));
  add('fc', 'Forecast bank', 'AI-generated, not PYQ', ordinalIds(FDATA.filter(function (q) { return q.fcCodes.indexOf(code) >= 0; })));
  add('gk', 'Gupta &amp; Kapoor', 'Textbook problems', ordinalIds(GDATA.filter(function (q) { return q.topicCode === code; })));
  return pools;
}
function estMin(n, mode) { return Math.max(1, Math.round(n * (mode === 'learn' ? MIN_PER_Q.learn : minPerQ()))); }
function practiceCard(code) {
  var pools = topicPools(code);
  if (!pools.length) return '';
  var h = '<div class="card practice"><h3>Practise ' + E(code) + ' now</h3><p class="small muted">Learn shows the explanation after every answer; Exam is timed and scored (' + markLabel() + ').</p><ul class="prow-list">';
  pools.forEach(function (p) {
    h += '<li><div class="pl"><b>' + p.label + '</b><span class="small muted">' + p.ids.length + ' Q · ~' + estMin(p.ids.length, 'exam') + ' min · ' + p.sub + '</span></div><div class="pb">' +
      '<button type="button" class="btn sm" data-act="poolStart" data-c="' + E(code) + '" data-pool="' + p.id + '" data-mode="learn">Learn</button>' +
      '<button type="button" class="btn sm primary" data-act="poolStart" data-c="' + E(code) + '" data-pool="' + p.id + '" data-mode="exam">Exam</button></div></li>';
  });
  return h + '</ul></div>';
}

/* --------------------------------------------------------- start sheet */
var START = null;
var POOL_TITLE = { nm: 'Notes MCQs', drill: 'Drills', tf: 'True / False', dh: 'Formula MCQs', pyq: 'PYQs', fc: 'Forecast', gk: 'Gupta & Kapoor' };
function nbStart(spec, mode) {
  var total = spec.ids.length;
  START = { spec: spec, mode: mode || spec.mode || 'learn', n: 0, timer: 'auto', shuffle: spec.shuffle !== false };
  START.n = spec.time && total <= 90 ? total : Math.min(total, 20);
  var w = openSheet(startHtml(), 'tall');
  return w;
}
function lenChoices(total) {
  var c = [], base = [5, 10, 20, 30, 40, 60, 80];
  base.forEach(function (n) { if (n < total) c.push(n); });
  c.push(total);
  return c;
}
function startHtml() {
  var s = START, sp = s.spec, total = sp.ids.length, exam = s.mode === 'exam';
  var fullBank = sp.time && s.n === total;
  var mins = !exam ? estMin(s.n, 'learn') : (s.timer === 'off' ? estMin(s.n, 'exam') : (s.timer === 'bank' && fullBank ? sp.time : Math.round(s.n * minPerQ())));
  var h = sheetHead(E(sp.title), sp.sub ? E(sp.sub) : total + ' questions available');
  h += '<div class="st-sec"><div class="st-lab">Mode</div><div class="seg2">' +
    '<button type="button" class="' + (!exam ? 'on' : '') + '" data-act="stMode" data-m="learn"><b>Learn</b><small>Explanation after every answer, no timer</small></button>' +
    '<button type="button" class="' + (exam ? 'on' : '') + '" data-act="stMode" data-m="exam"><b>Exam</b><small>Timed and scored ' + markLabel() + '</small></button></div></div>';
  h += '<div class="st-sec"><div class="st-lab">How many questions</div><div class="chiprow wrapchips">';
  lenChoices(total).forEach(function (n) {
    h += '<button type="button" class="tchip' + (s.n === n ? ' on' : '') + '" data-act="stN" data-n="' + n + '">' + (n === total ? 'All ' + n : n) + '<small> · ' + (exam ? Math.round(n * minPerQ()) : estMin(n, 'learn')) + ' min</small></button>';
  });
  h += '</div></div>';
  if (exam) {
    h += '<div class="st-sec"><div class="st-lab">Clock</div><div class="chiprow wrapchips">' +
      '<button type="button" class="tchip' + (s.timer === 'auto' ? ' on' : '') + '" data-act="stTimer" data-t="auto">Paper pace ' + minPerQ() + ' min/Q</button>' +
      (fullBank ? '<button type="button" class="tchip' + (s.timer === 'bank' ? ' on' : '') + '" data-act="stTimer" data-t="bank">Bank time ' + sp.time + ' min</button>' : '') +
      '<button type="button" class="tchip' + (s.timer === 'off' ? ' on' : '') + '" data-act="stTimer" data-t="off">No timer</button></div></div>';
  }
  h += '<div class="st-sec"><label class="switch"><input type="checkbox" data-act="stShuffle"' + (s.shuffle ? ' checked' : '') + '><span>Shuffle question order</span></label></div>';
  h += '<div class="st-sum"><b>' + s.n + ' questions</b> · about <b>' + mins + ' min</b> ' + (exam ? '· ' + markLabel() : '· no marks, learn as you go') + '</div>';
  h += '<button type="button" class="btn primary block lg" data-act="stGo">' + svg('play') + 'Start ' + (exam ? 'exam' : 'learning') + '</button>';
  return h;
}
function startRefresh() {
  var b = SHEET && SHEET.querySelector('.sheet-body');
  if (b) b.innerHTML = startHtml();
}
/* starting something new while a paper is open: keep what was answered, drop the rest */
function silentFinish() {
  if (!S || S.finished) return;
  var ans = 0; S.answers.forEach(function (a) { if (a !== null) ans++; });
  if (!ans) { discardSession(); return; }
  markSpent(); stopTick();
  S.finished = true; S.endTs = Date.now(); S.result = scoreSession(S);
  persistAttempt(S);
}
function nbGo() {
  var s = START; if (!s) return;
  silentFinish();
  var sp = s.spec, exam = s.mode === 'exam';
  var ids = sp.ids.slice(), total = ids.length;
  if (s.n < total) {
    var idx = ids.map(function (x, i) { return i; });
    shuffle(idx);
    idx = idx.slice(0, s.n).sort(function (a, b) { return a - b; });
    ids = idx.map(function (i) { return ids[i]; });
  }
  if (s.shuffle) shuffle(ids);
  var qs = ids.map(function (i) { return BY_ID[i]; }).filter(Boolean);
  if (!qs.length) { toast('Nothing to practise here yet.'); return; }
  var fullBank = sp.time && s.n === total;
  var minutes = s.timer === 'bank' && fullBank ? sp.time : Math.round(qs.length * minPerQ());
  var extra = { title: sp.title, tag: sp.tag || '', code: sp.code || '' };
  buildSession({
    kind: sp.kind || 'nb',
    name: sp.title,
    desc: qs.length + ' questions · ' + (exam ? 'Exam ' + markLabel() : 'Learning') + (sp.sub ? ' · ' + sp.sub : ''),
    mode: exam ? 'exam' : 'learn',
    questions: qs,
    shuffleQ: false, shuffleO: false,
    timed: exam && s.timer !== 'off',
    minutes: minutes,
    authentic: !!sp.authentic,
    extra: extra
  });
}
function launchBank(id, mode) {
  var b = NB_BANK[id];
  if (!b) return;
  nbStart({ title: b.name, sub: b.desc.length > 90 ? '' : b.desc, ids: nbIds([id]), time: b.time, shuffle: !/^drill/.test(id) && b.kind !== 'tf', tag: id }, mode || 'learn');
}
function launchPool(code, pool, mode) {
  var p = topicPools(code).filter(function (x) { return x.id === pool; })[0];
  if (!p) return;
  nbStart({ title: code + ' · ' + (POOL_TITLE[pool] || pool), sub: topicName(code), ids: p.ids, shuffle: pool !== 'drill', code: code, tag: pool }, mode);
}

/* ---------------------------------------------------------- blueprint mock */
function blueprintIds(total) {
  var codes = TOPICS.filter(function (t) { var s = NOTE_BY[t.code]; return /^[PS]/.test(t.code) && s && s.f27; });
  var sum = 0; codes.forEach(function (t) { sum += NOTE_BY[t.code].f27; });
  var quotas = codes.map(function (t) { var x = total * NOTE_BY[t.code].f27 / sum; return { t: t, n: Math.floor(x), r: x - Math.floor(x) }; });
  var got = 0; quotas.forEach(function (q) { got += q.n; });
  quotas.slice().sort(function (a, b) { return b.r - a.r; }).forEach(function (q) { if (got < total) { q.n++; got++; } });
  var qh = Store.d().qh || {}, out = [], used = {};
  quotas.forEach(function (Q) {
    if (!Q.n) return;
    var code = Q.t.code;
    function pick(list) { return list.filter(function (q) { return q.options && q.options.length === 4 && scorable(q) && !used[q.id]; }); }
    function rank(list) {
      return list.map(function (q) { var h = qh[q.id]; return { q: q, k: (h ? 1 + h.c / Math.max(1, h.a) : 0) + Math.random() * 0.6 }; })
        .sort(function (a, b) { return a.k - b.k; }).map(function (x) { return x.q; });
    }
    var cand = rank(pick(DATA.filter(function (q) { return q.topicCode === code; })))
      .concat(rank(pick(FDATA.filter(function (q) { return q.fcCodes.indexOf(code) >= 0; }))))
      .concat(rank(pick(NDATA.filter(function (q) { return q.topicCode === code && (q.nbBank === 'nm' || /^drill/.test(q.nbBank)); }))));
    cand.slice(0, Q.n).forEach(function (q) { used[q.id] = 1; out.push(q.id); });
  });
  return shuffle(out);
}
function launchBlueprint(n) {
  var ids = blueprintIds(n);
  nbStart({ title: 'Blueprint mock · ' + n + ' Q', sub: 'Topics weighted by the 2027 forecast; unseen questions first', ids: ids, shuffle: true, tag: 'blueprint', kind: 'nb', time: Math.round(n * minPerQ()) }, 'exam');
}

/* -------------------------------------------------- live session persistence */
function nbSaveLive() {
  if (!S || S.finished) return;
  var d = Store.d();
  d.live = S;
  Store.save();
}
function liveInfo() {
  var d = Store.d(), L = d.live;
  if (!L || L.finished || !L.items || !L.items.length) return null;
  var ok = L.items.every(function (it) { return BY_ID[it.qid]; });
  if (!ok) return null;
  var answered = 0; L.answers.forEach(function (a) { if (a !== null) answered++; });
  var left = L.limitSec ? Math.max(0, L.limitSec - (Date.now() - L.startTs) / 1000) : 0;
  return { L: L, answered: answered, total: L.items.length, left: left };
}
function resumeLive() {
  var li = liveInfo();
  if (!li) { delete Store.d().live; Store.save(); toast('That session is no longer available.'); return; }
  S = li.L; S.lastTs = Date.now();
  if (S.limitSec && (Date.now() - S.startTs) / 1000 >= S.limitSec) { startTick(); finishSession(true); return; }
  startTick();
  go('exam');
}

/* ------------------------------------------------------- pace + warnings */
function paceInfo(elapsed) {
  if (!S || !S.limitSec || S.mode !== 'exam') return null;
  var per = S.limitSec / S.items.length, expected = elapsed / per;
  var done = S.cur + (S.answers[S.cur] !== null ? 1 : 0);
  var diff = Math.round(done - expected);
  if (diff >= 2) return { c: 'ok', t: '▲ ' + diff + ' ahead' };
  if (diff <= -2) return { c: diff <= -4 ? 'bad' : 'warn', t: '▼ ' + (-diff) + ' behind' };
  return { c: '', t: '● on pace' };
}
function nbPaceChip() {
  if (!S || S.finished || S.mode !== 'exam' || !S.limitSec) return '';
  var p = paceInfo((Date.now() - S.startTs) / 1000);
  return '<span id="pace" class="chip pace ' + (p ? p.c : '') + '">' + (p ? p.t : '') + '</span>';
}
function nbTick(left, elapsed) {
  if (!S || S.finished) return;
  if (left <= 300 && !S._w5 && S.limitSec >= 900) { S._w5 = 1; toast('5 minutes left. Answer every question where you can remove one option.', { ms: 4800 }); }
  if (left <= 60 && !S._w1) { S._w1 = 1; toast('1 minute left. Fill the blanks you can still narrow down.', { ms: 4800 }); }
  var chip = document.getElementById('pace');
  if (chip) { var p = paceInfo(elapsed); if (p) { chip.className = 'chip pace ' + p.c; chip.textContent = p.t; } }
  if (Math.round(elapsed) % 15 === 0) nbSaveLive();
}

/* ------------------------------------------------- after a session ends */
function nbAfterAttempt(sess) {
  var d = Store.d(), res = sess.result, now = Date.now();
  if (!d.sr) d.sr = {};
  res.perQ.forEach(function (p, i) {
    var q = BY_ID[p.qid];
    if (!q) return;
    if (p.status === 'correct' || p.status === 'incorrect') qhRecord(p.qid, p.status === 'correct', p.chosen);
    var k = 'q:' + p.qid;
    if (p.status === 'incorrect') {
      var e = srEnsure(k);
      e.b = 0; e.l = (e.l || 0) + 1; e.last = now; e.due = now + 86400000;
    } else if (p.status === 'correct' && d.sr[k] && d.sr[k].due <= now) {
      srRate(k, 2);
    }
    if (sess.marked && sess.marked[i]) { d.marked = d.marked || {}; d.marked[p.qid] = now; }
  });
  d.last = { r: 'result', p: {}, t: sess.name + ' · result', ts: now };
  delete d.live;
}

/* ------------------------------------------------------- result insights */
function nbResultExtras() {
  if (!S || !S.result) return '';
  var r = S.result, st = paperCfg(), h = '';
  var target = minPerQ() * 60, avg = r.total ? r.seconds / r.total : 0;
  var neg = st.negativeMarkingEnabled ? st.negativeMarkFraction * st.marksCorrect : 0;
  h += '<div class="card"><h3>Time &amp; marks strategy</h3><div class="kpis">' +
    '<div class="kpi' + (avg > target * 1.15 ? ' warn' : ' ok') + '"><div class="v">' + Math.round(avg) + 's</div><div class="l">Avg per question</div></div>' +
    '<div class="kpi"><div class="v">' + Math.round(target) + 's</div><div class="l">Paper pace</div></div>' +
    '<div class="kpi bad"><div class="v">−' + fx(r.incorrect * neg, 2) + '</div><div class="l">Lost to wrong</div></div>' +
    '<div class="kpi warn"><div class="v">' + r.unanswered + '</div><div class="l">Left blank</div></div></div>';
  if (r.unanswered && neg > 0 && S.mode === 'exam') {
    var ev1 = (1 / 3) * st.marksCorrect - (2 / 3) * neg;
    h += '<p class="small mt">Blind guessing is worth about <b>' + fx((1 / 4) * st.marksCorrect - (3 / 4) * neg, 2) + '</b> per blank; with one option removed it is worth <b>+' + fx(ev1, 2) + '</b>. ' +
      'You left ' + r.unanswered + ' blank. Practise removing one option first, then answer.</p>';
  }
  var slow = r.perQ.map(function (p, i) { return { i: i, s: p.secs, st: p.status }; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3).filter(function (x) { return x.s > target * 1.4; });
  if (slow.length) {
    h += '<div class="small mt"><b>Slowest questions</b> (skip-and-return candidates)</div><div class="chiprow wrapchips">' +
      slow.map(function (x) { return '<button type="button" class="chip link" data-act="reviewAt" data-i="' + x.i + '">Q' + (x.i + 1) + ' · ' + Math.round(x.s) + 's' + (x.st === 'incorrect' ? ' ✕' : '') + '</button>'; }).join('') + '</div>';
  }
  h += '</div>';

  /* trap classes and weakest topic, for the notes banks and PYQs alike */
  var byCls = {}, byTopic = {};
  r.perQ.forEach(function (p) {
    var q = BY_ID[p.qid]; if (!q) return;
    if (q.cls) { var a = byCls[q.cls] = byCls[q.cls] || { n: 0, w: 0 }; a.n++; if (p.status === 'incorrect') a.w++; }
    if (q.topicCode && p.status === 'incorrect') byTopic[q.topicCode] = (byTopic[q.topicCode] || 0) + 1;
  });
  var ck = Object.keys(byCls);
  if (ck.length) {
    h += '<div class="card"><h3>By trap class</h3><div class="scrollx"><table class="dt"><thead><tr><th>Class</th><th class="num">Q</th><th class="num">Wrong</th><th style="width:110px"> </th></tr></thead><tbody>';
    ck.sort(function (a, b) { return byCls[b].w - byCls[a].w; }).forEach(function (c) {
      var a = byCls[c], acc = pct(a.n - a.w, a.n);
      h += '<tr><td>' + E(clsName(c)) + '</td><td class="num">' + a.n + '</td><td class="num">' + a.w + '</td><td><div class="bar"><i class="' + (acc >= 70 ? 'ok' : acc >= 40 ? 'warn' : 'bad') + '" style="width:' + Math.round(acc) + '%"></i></div></td></tr>';
    });
    h += '</tbody></table></div></div>';
  }
  var wt = Object.keys(byTopic).sort(function (a, b) { return byTopic[b] - byTopic[a]; }).slice(0, 3);
  h += '<div class="card next-steps"><h3>What to do next</h3><div class="btnrow">';
  if (r.incorrect + r.unanswered) h += '<button type="button" class="btn primary" data-act="nav" data-r="revise">' + svg('revise') + 'Revise ' + (r.incorrect) + ' wrong answer' + (r.incorrect === 1 ? '' : 's') + '</button>';
  wt.forEach(function (c) {
    h += navBtn('btn', svg('book') + E(c + ' notes') + ' <small>(' + byTopic[c] + ' missed)</small>', NOTE_BY[c] ? 'read' : 'topic', NOTE_BY[c] ? { k: 'n', id: c } : { c: c });
  });
  h += '</div><p class="tiny muted mt">Every wrong answer is now in Revise and returns tomorrow through spaced repetition.</p></div>';
  return h;
}

/* ------------------------------------------------------ submit / exit sheets */
function submitSheet() {
  if (!S || S.finished) return;
  var ans = 0, mk = 0, first = -1;
  S.answers.forEach(function (a, i) { if (a !== null) ans++; else if (first < 0) first = i; });
  S.marked.forEach(function (m) { if (m) mk++; });
  var left = S.limitSec ? Math.max(0, S.limitSec - (Date.now() - S.startTs) / 1000) : 0;
  var un = S.items.length - ans;
  var h = sheetHead('Submit this paper?', S.limitSec ? hms(left) + ' left' : 'No timer') +
    '<div class="kpis"><div class="kpi ok"><div class="v">' + ans + '</div><div class="l">Answered</div></div>' +
    '<div class="kpi warn"><div class="v">' + un + '</div><div class="l">Unanswered</div></div>' +
    '<div class="kpi"><div class="v">' + mk + '</div><div class="l">Marked</div></div></div>' +
    (un && S.mode === 'exam' ? '<p class="small mt">Unanswered questions score 0. If you can remove even one option, answering has a positive expected value at ' + markLabel() + '.</p>' : '') +
    '<div class="btnrow mt col">' +
    '<button type="button" class="btn primary block lg" data-act="submitFinal">' + svg('check') + 'Submit now</button>' +
    (un ? '<button type="button" class="btn block" data-act="jumpUn" data-i="' + first + '">Go to first unanswered</button>' : '') +
    '<button type="button" class="btn ghost block" data-act="sheetClose">Keep working</button></div>';
  openSheet(h);
}
function exitSheet(next) {
  if (!S || S.finished) { if (next) next(); return; }
  PENDING_NAV = next || null;
  var ans = 0; S.answers.forEach(function (a) { if (a !== null) ans++; });
  var h = sheetHead('Leave this session?', E(S.name)) +
    '<p class="small muted">' + ans + ' of ' + S.items.length + ' answered. Your place is saved on this device, so you can resume it from Home.</p>' +
    '<div class="btnrow mt col">' +
    '<button type="button" class="btn primary block lg" data-act="sheetClose">' + svg('play') + 'Keep going</button>' +
    '<button type="button" class="btn block" data-act="exitPause">Pause and leave (resume later)</button>' +
    (ans ? '<button type="button" class="btn block" data-act="submitFinal">Finish now and see the result</button>' : '') +
    '<button type="button" class="btn danger block" data-act="exitDiscard">Discard this session</button></div>';
  openSheet(h);
}
var PENDING_NAV = null;
function discardSession() {
  stopTick(); S = null;
  var d = Store.d(); delete d.live; Store.save();
}

/* ------------------------------------------------------------- click router */
function bankClick(act, t) {
  switch (act) {
    case 'nbLaunch': launchBank(t.getAttribute('data-bank'), t.getAttribute('data-mode')); return true;
    case 'nbLaunchDist': {
      var id = t.getAttribute('data-id');
      var ids = NDATA.filter(function (q) { return q.nbBank === 'dh' && (q.id.indexOf('DH-' + id + '-') === 0 || q.id.indexOf('DH-R-' + id + '-') === 0); }).map(function (q) { return q.id; });
      nbStart({ title: DIST_BY[id].name + ' · formula quiz', sub: 'Handbook MCQs', ids: ids, shuffle: true, tag: 'dh' }, 'learn');
      return true;
    }
    case 'poolStart': launchPool(t.getAttribute('data-c'), t.getAttribute('data-pool'), t.getAttribute('data-mode')); return true;
    case 'blueprint': launchBlueprint(+t.getAttribute('data-n')); return true;
    case 'stMode': START.mode = t.getAttribute('data-m'); startRefresh(); return true;
    case 'stN': START.n = +t.getAttribute('data-n'); if (START.timer === 'bank' && !(START.spec.time && START.n === START.spec.ids.length)) START.timer = 'auto'; startRefresh(); return true;
    case 'stTimer': START.timer = t.getAttribute('data-t'); startRefresh(); return true;
    case 'stShuffle': START.shuffle = !!t.checked; startRefresh(); return true;
    case 'stGo': { var s0 = START; closeSheet(true); START = s0; nbGo(); return true; }
    case 'resumeLive': resumeLive(); return true;
    case 'submitMock': submitSheet(); return true;
    case 'abandon': exitSheet(null); return true;
    case 'submitFinal': closeSheet(true); finishSession(false); return true;
    case 'jumpUn': closeSheet(); window.setTimeout(function () { gotoQ(+t.getAttribute('data-i')); }, 60); return true;
    case 'exitPause': {
      var nx = PENDING_NAV; PENDING_NAV = null;
      nbSaveLive(); stopTick();
      closeSheet(function () { S = null; if (nx) nx(); else go('home'); toast('Session paused. Resume it from Home.'); });
      return true;
    }
    case 'exitDiscard': {
      var nx2 = PENDING_NAV; PENDING_NAV = null;
      closeSheet(function () { discardSession(); if (nx2) nx2(); else go('home'); });
      return true;
    }
    case 'flagQ': {
      var qid = t.getAttribute('data-qid'), on = !((Store.d().marked || {})[qid]);
      nbFlag(qid, on);
      t.classList.toggle('on', on);
      var lab = t.querySelector('span'); if (lab) lab.textContent = on ? 'Marked for revision' : 'Mark for revision';
      toast(on ? 'Marked. Find it under Revise › Marked.' : 'Mark removed.');
      return true;
    }
    case 'sheetBm': {
      var q2 = t.getAttribute('data-qid'), d = Store.d();
      if (d.bookmarks[q2]) delete d.bookmarks[q2]; else d.bookmarks[q2] = Date.now();
      Store.save(); t.classList.toggle('on', !!d.bookmarks[q2]); t.lastChild.textContent = d.bookmarks[q2] ? 'Bookmarked' : 'Bookmark';
      return true;
    }
  }
  return false;
}
