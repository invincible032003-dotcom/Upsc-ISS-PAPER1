/* ======================================================================
   NB-7.  App shell: top app bar, bottom navigation / desktop rail, history
          and the Android back button, in-session bar, swipe, click routing
   ====================================================================== */
var TABS = [['home', 'Home', 'home'], ['learn', 'Learn', 'learn'], ['examhub', 'Exam', 'exam'], ['revise', 'Revise', 'revise'], ['more', 'More', 'more']];
var ROOT_SET = { home: 1, learn: 1, examhub: 1, revise: 1, more: 1 };
/* top-level screens (reached from the menu or the tabs) show the menu button; detail screens show back */
var TOP_SET = { home: 1, learn: 1, examhub: 1, revise: 1, more: 1, pyq: 1, ptopics: 1, sectional: 1, mocks: 1, forecast: 1, cs: 1, gk: 1, dists: 1, cards: 1,
  search: 1, nsearch: 1, analytics: 1, history: 1, settings: 1, audit: 1, help: 1 };
var TAB_OF = {
  home: 'home',
  learn: 'learn', topic: 'learn', read: 'learn', dists: 'learn', dist: 'learn', nsearch: 'learn', cards: 'learn', cs: 'learn', gk: 'learn',
  examhub: 'examhub', setup: 'examhub', forecast: 'examhub', pyq: 'examhub', mocks: 'examhub', sectional: 'examhub', ptopics: 'learn',
  revise: 'revise', revlist: 'revise', rev: 'revise', ledger: 'revise', mistakes: 'revise', bookmarks: 'revise',
  more: 'more', search: 'more', analytics: 'more', history: 'more', settings: 'more', audit: 'more', help: 'more'
};
var TITLES = { home: 'Statistics Paper-I', learn: 'Learn', examhub: 'Exam', revise: 'Revise', more: 'More', nsearch: 'Search notes', dists: 'Formula handbook',
  cards: 'Flashcards', search: 'Search questions', analytics: 'Analytics', history: 'Attempt history', settings: 'Settings & data', audit: 'Data audit',
  mistakes: 'Wrong answers', bookmarks: 'Bookmarks', help: 'How it works', cs: 'Computer', gk: 'Gupta Kapoor', forecast: 'Forecasts', pyq: 'PYQs', mocks: 'PYQ mocks', sectional: 'Sectional PYQs', ptopics: 'PYQs by topic', setup: 'Set up a mock',
  ledger: 'Error ledger', study: 'Study card' };
var LAST_TAB = 'home', NAV_REPLACE = false;

function liveSession() { return !!(S && !S.finished && ROUTE.name === 'exam'); }
function sessionTab() { return S ? (S.mode === 'learn' ? 'learn' : S.kind === 'mistakes' ? 'revise' : 'examhub') : 'examhub'; }
function routeTitle() {
  var n = ROUTE.name;
  if (n === 'read') { var s = secOf(ROUTE.k === 't' ? 't' : 'n', ROUTE.id); return s ? s.title : 'Notes'; }
  if (n === 'topic') return ROUTE.c ? ROUTE.c + ' · ' + topicName(ROUTE.c) : 'Topic';
  if (n === 'dist') return DIST_BY[ROUTE.id] ? DIST_BY[ROUTE.id].name : 'Distribution';
  if ((n === 'exam' || n === 'result' || n === 'review') && S) return S.name + (n === 'exam' ? '' : ' · ' + (n === 'result' ? 'Result' : 'Review'));
  if (n === 'rev') return REV.title || 'Revision';
  if (n === 'revlist') return (COLL[ROUTE.k] || COLL.wrong)[0];
  return TITLES[n] || 'Study app';
}

/* -------------------------------------------------------- history + go() */
var baseGo = go;
go = function (name, params) {
  var viaSent = SENT;
  if (SHEET) closeSheet(true);
  document.body.classList.remove('pal-open');
  SENT = false;
  drawerHide();
  if (!viaSent) { try { history.replaceState(Object.assign({}, history.state || {}, { y: window.pageYOffset }), ''); } catch (e) {} }
  baseGo(name, params);
  var rep = NAV_REPLACE && !viaSent;
  if (!rep) DEPTH++;
  var st = { iss: 1, r: ROUTE, d: DEPTH, y: 0 };
  try { (rep || viaSent) ? history.replaceState(st, '') : history.pushState(st, ''); } catch (e) {}
};
try {
  history.replaceState({ iss: 1, base: 1, d: -1 }, '');
  history.pushState({ iss: 1, r: { name: 'home' }, d: 0, y: 0 }, '');
} catch (e) {}

function rootOf(name) {
  var tab = name === 'study' ? LAST_TAB : (TAB_OF[name] || 'home');
  return tab;
}
function goBack() {
  var doBack = function () { if (DEPTH > 0) history.back(); else go(rootOf(ROUTE.name)); };
  if (liveSession()) exitSheet(doBack); else doBack();
}
function navTo(name, params) {
  var dest = function () {
    NAV_REPLACE = !!(TOP_SET[name] && TOP_SET[ROUTE.name]);
    go(name, params);
    NAV_REPLACE = false;
  };
  if (name === ROUTE.name && TOP_SET[name] && !SHEET) { window.scrollTo(0, 0); return; }
  if (liveSession()) exitSheet(dest); else dest();
}

window.addEventListener('popstate', function (ev) {
  if (SKIP_POP > 0) {
    SKIP_POP--;
    if (!SKIP_POP && AFTER_POP) { var f = AFTER_POP; AFTER_POP = null; f(); }
    return;
  }
  var st = ev.state || {};
  DEPTH = st.d || 0;
  if (SENT) {                                  /* system back while a sheet or the palette was open */
    SENT = false;
    if (SHEET) closeSheet(true);
    drawerHide();
    document.body.classList.remove('pal-open');
    return;
  }
  if (st.base) {                               /* back past the first screen: Home first, then leave the app */
    DEPTH = 0;
    if (liveSession()) {
      var keep0 = ROUTE;
      try { history.pushState({ iss: 1, r: keep0, d: 0, y: 0 }, ''); } catch (e) {}
      exitSheet(function () { go('home'); });
      return;
    }
    if (ROUTE.name !== 'home') {
      try { history.pushState({ iss: 1, r: { name: 'home' }, d: 0, y: 0 }, ''); } catch (e) {}
      ROUTE = { name: 'home' }; render(); window.scrollTo(0, 0);
      return;
    }
    history.back();
    return;
  }
  var r = st.r || { name: 'home' };
  if (liveSession()) {                         /* back during a paper: ask first, stay on the paper */
    var keep = ROUTE;
    DEPTH = (st.d || 0) + 1;
    try { history.pushState({ iss: 1, r: keep, d: DEPTH, y: 0 }, ''); } catch (e) {}
    exitSheet(function () { go(r.name, r); });
    return;
  }
  if (r.name === 'exam') r = { name: S ? (S.finished ? 'result' : 'exam') : 'home' };   /* a paper left for the notes is still running */
  if ((r.name === 'result' || r.name === 'review') && !(S && S.finished)) r = { name: 'home' };
  if (r.name === 'rev' && !REV.keys.length) r = { name: 'revise' };
  ROUTE = r;
  render();
  window.scrollTo(0, st.y || 0);
});

/* ---------------------------------------------------------------- the shell */
var NAV_BUILT = false;
function buildNav() {
  var nav = document.getElementById('bnav');
  if (!nav || NAV_BUILT) return;
  NAV_BUILT = true;
  nav.innerHTML = TABS.map(function (t) {
    return '<button type="button" data-act="nav" data-r="' + t[0] + '" data-tab="' + t[0] + '"><span class="ic">' + svg(t[2]) + '<i class="badge" hidden></i></span><span class="lb">' + t[1] + '</span></button>';
  }).join('');
  var menu = document.getElementById('tbMenu'); if (menu) menu.innerHTML = svg('more');
  var back = document.getElementById('tbBack'); if (back) back.innerHTML = svg('back');
  var s = document.getElementById('tbSearch'); if (s) s.innerHTML = svg('search');
  var a = document.getElementById('tbAa'); if (a) a.innerHTML = svg('aa');
  var bar = document.createElement('div');
  bar.id = 'msess'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Question navigation');
  document.body.appendChild(bar);
  var scrim = document.createElement('div'); scrim.id = 'mscrim'; document.body.appendChild(scrim);
  scrim.addEventListener('click', function () { palClose(); });
  bar.addEventListener('click', function (ev) {
    var t = closest(ev.target, '[data-proxy]');
    if (!t || t.disabled) return;
    var a2 = t.getAttribute('data-proxy');
    if (a2 === 'palette') { if (document.body.classList.contains('pal-open')) palClose(); else palOpen(); return; }
    var b = app.querySelector('[data-act="' + a2 + '"]');
    if (b && !b.disabled) b.click();
  });
}
function palOpen() { document.body.classList.add('pal-open'); pushSent(); }
function palClose() { if (!document.body.classList.contains('pal-open')) return; document.body.classList.remove('pal-open'); popSent(); }

var REV_SEEN = {};
function sessionBar() {
  var bar = document.getElementById('msess');
  if (!bar) return;
  if (!liveSession()) { bar.innerHTML = ''; return; }
  var last = S.cur === S.items.length - 1;
  bar.innerHTML =
    '<button type="button" data-proxy="prevQ" aria-label="Previous question"' + (S.cur === 0 ? ' disabled' : '') + '>' + svg('back') + '<span class="lbl">Prev</span></button>' +
    '<button type="button" data-proxy="markQ" class="' + (S.marked[S.cur] ? 'on' : '') + '" aria-pressed="' + !!S.marked[S.cur] + '" aria-label="Mark for review">' + svg('flag') + '<span class="lbl">Mark</span></button>' +
    '<button type="button" data-proxy="palette" aria-label="Question palette">' + svg('list') + '<span class="pos">' + (S.cur + 1) + '/' + S.items.length + '</span></button>' +
    (last ? '<button type="button" data-proxy="submitMock" class="pri">' + svg('check') + 'Submit</button>'
          : '<button type="button" data-proxy="nextQ" class="pri">Next' + svg('chev') + '</button>');
}

function nbAfterRender() {
  var name = ROUTE.name, live = liveSession();
  var tab = (name === 'exam' || name === 'result' || name === 'review') ? sessionTab() : name === 'study' ? LAST_TAB : (TAB_OF[name] || 'home');
  if (name !== 'study') LAST_TAB = tab;
  var b = document.body;
  b.classList.toggle('in-session', live);
  b.classList.toggle('in-rev', name === 'rev' && !REV.done && REV.keys.length > 0);
  b.setAttribute('data-route', name);
  buildNav();
  var tt = document.querySelector('#topbar .mtitle'); if (tt) tt.textContent = routeTitle();
  var bk = document.getElementById('tbBack'); if (bk) bk.hidden = !!TOP_SET[name] && !live;
  var mn = document.getElementById('tbMenu'); if (mn) mn.hidden = !TOP_SET[name] || live;
  var nav = document.getElementById('bnav');
  if (nav) {
    Array.prototype.forEach.call(nav.querySelectorAll('button'), function (x) {
      var on = x.getAttribute('data-tab') === tab;
      x.classList.toggle('on', on);
      if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
    });
    var due = dueKeys().length, bd = nav.querySelector('[data-tab="revise"] .badge');
    if (bd) { bd.hidden = !due; bd.textContent = due > 99 ? '99+' : due; }
  }
  sessionBar();
  if (live) nbSaveLive();
  /* learning mode: bring a freshly opened answer into view */
  if (live && S.mode === 'learn' && S.revealed[S.cur]) {
    var key = S.startTs + ':' + S.cur;
    if (!REV_SEEN[key]) {
      REV_SEEN[key] = 1;
      var rv = app.querySelector('.reveal');
      if (rv && rv.scrollIntoView) rv.scrollIntoView({ block: 'nearest', behavior: uiPrefs().rm ? 'auto' : 'smooth' });
    }
  }
  /* reader deep link: open the requested group and bring it to the top */
  if (name === 'read' && ROUTE.g !== undefined && ROUTE.g !== '' && !ROUTE._done) {
    ROUTE._done = true;
    var el = document.getElementById('g' + ROUTE.g);
    if (el) window.setTimeout(function () { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }, 30);
  }
  Array.prototype.forEach.call(app.querySelectorAll('.scrollchips, .scrollseg'), function (row) {
    var on = row.querySelector('.on');
    if (on && row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2);
  });
  readProgress();
  Store.save();
}
function readProgress() {
  var p = document.querySelector('#tbProg i');
  if (!p) return;
  var n = ROUTE.name;
  if (n !== 'read' && n !== 'dist' && n !== 'topic') { p.style.width = '0'; return; }
  var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
  p.style.width = (max > 0 ? Math.min(100, 100 * (window.pageYOffset || h.scrollTop) / max) : 0) + '%';
}
var _rp = 0;
window.addEventListener('scroll', function () {
  if (_rp) return;
  _rp = window.requestAnimationFrame(function () { _rp = 0; readProgress(); });
}, { passive: true });

/* --------------------------------------------------------------- click routing */
function nbClick(act, t) {
  switch (act) {
    case 'sheetClose': closeSheet(); return true;
    case 'toastAct': {
      var f = TOAST_FN; TOAST_FN = null;
      var el = document.getElementById('toast'); if (el) el.className = '';
      if (f) f();
      return true;
    }
    case 'nav': {
      var nm = t.getAttribute('data-r');
      if (document.body.classList.contains('drawer-open')) {
        if (nm === ROUTE.name) { drawerClose(); return true; }
        drawerHide();
      }
      navTo(nm, pParse(t.getAttribute('data-p')));
      return true;
    }
    case 'back': goBack(); return true;
    case 'study':
      STUDY.qid = t.getAttribute('data-qid');
      STUDY.back = 'back';
      closeSheet(true);
      go('study');
      return true;
  }
  return practiceClick(act, t) || bankClick(act, t) || readerClick(act, t) || handbookClick(act, t) || cardsClick(act, t) || reviseClick(act, t) ||
    screenClick(act, t) || examClick(act, t) || extraClick(act, t);
}

/* controls that live outside #app: top bar, bottom nav, sheets, toast */
document.addEventListener('click', function (ev) {
  /* a handler inside #app may already have re-rendered it: the detached target then
     bubbles here on its own, and must not be handled a second time */
  if (!ev.target.isConnected || closest(ev.target, '#app')) return;
  if (closest(ev.target, '[data-sheet-close]')) { closeSheet(); return; }
  if (closest(ev.target, '[data-drawer-close]')) { drawerClose(); return; }
  var t = closest(ev.target, '[data-act]');
  if (!t) return;
  if (t.tagName === 'INPUT') return;
  var act = t.getAttribute('data-act');
  if (act === 'go') return;                     /* legacy top-bar handler */
  nbClick(act, t);
});
document.addEventListener('change', function (ev) {
  if (closest(ev.target, '#app')) return;
  var t = closest(ev.target, '[data-act]');
  if (!t) return;
  var act = t.getAttribute('data-act');
  if (uiChange(act, t)) return;
  if (act === 'stShuffle') bankClick(act, t);
});
document.addEventListener('input', function (ev) {
  if (closest(ev.target, '#app')) return;
  var t = closest(ev.target, '[data-act]');
  if (t && (t.getAttribute('data-act') === 'uiFs' || t.getAttribute('data-act') === 'uiLs')) uiChange(t.getAttribute('data-act'), t);
});

/* text fields inside pages */
var _nsT = null;
app.addEventListener('input', function (ev) {
  var t = closest(ev.target, '[data-act]');
  if (!t) return;
  var act = t.getAttribute('data-act');
  if (act === 'nsInput') {
    NQ.q = t.value;
    window.clearTimeout(_nsT);
    _nsT = window.setTimeout(function () { var b = document.getElementById('nsres'); if (b) b.innerHTML = nsResults(); }, 160);
  } else if (act === 'dSearch') {
    DIST_ST.q = t.value;
    window.clearTimeout(_nsT);
    _nsT = window.setTimeout(function () { var b = document.getElementById('dlistbox'); if (b) b.innerHTML = distListHtml(); }, 120);
  }
});

/* ------------------------------------------------------ swipe + keyboard */
(function () {
  var sx = 0, sy = 0, st = 0, ok = false;
  app.addEventListener('touchstart', function (e) {
    ok = e.touches.length === 1 && !closest(e.target, 'pre, table, .tblwrap, .scrollx, .scrollchips, .scrollseg, .cs-tabs, .cs-subtabs, .cs-pills, .cs-strip, .exam-side, .katex-display, .mq-long, input, textarea, select');
    if (!ok) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (!ok) return;
    ok = false;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6 || Date.now() - st > 800) return;
    var fwd = dx < 0, b = null;
    if (liveSession()) b = app.querySelector('[data-act="' + (fwd ? 'nextQ' : 'prevQ') + '"]');
    else if (ROUTE.name === 'review') b = app.querySelector('[data-act="revStep"][data-d="' + (fwd ? '1' : '-1') + '"]');
    else if (ROUTE.name === 'cs' && CS.view === 'read') b = app.querySelector('.cs-pager [data-d="' + (fwd ? '1' : '-1') + '"]');
    if (b && !b.disabled) b.click();
  }, { passive: true });
})();

/* first-run: apply the UPSC marking pattern once, then display preferences */
(function () {
  var d = Store.d(), u = uiPrefs();
  if (!u.pat27) {
    var st = d.settings;
    st.marksCorrect = 2.5; st.negativeMarkingEnabled = true; st.negativeMarkFraction = 1 / 3; st.minutesPerQuestion = 1.5; st.fullPaperMinutes = 120;
    u.pat27 = 1; Store.save();
  }
  applyUI();
})();
