/* ======================================================================
   NB-1.  Core: icons, adjustable display, sheets, toast, study clock,
          flags, spaced repetition
   ====================================================================== */
var IC = {
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  learn: 'M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5C20 4.7 19.3 4 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z',
  exam: 'M9 4h6l1 2h3v14H5V6h3zM9 13l2.2 2.2L15.5 11',
  revise: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
  more: 'M4 7h16M4 12h16M4 17h16',
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM20 20l-4.8-4.8',
  aa: 'M3 19 8 6l5 13M5 15h6M15 19l3.5-9L22 19M16.3 16.5h4.4',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9-4.3-4.1 5.9-.8z',
  flag: 'M6 21V4M6 4h11l-2 4 2 4H6',
  check: 'M5 12.5l4.5 4.5L19 7',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  chev: 'M9 5l7 7-7 7',
  play: 'M8 5v14l11-7z',
  cards: 'M8 8h12v12H8zM4 16V4h12',
  sigma: 'M18 5H7l6 7-6 7h11',
  warn: 'M12 4l9 16H3zM12 10v4M12 17.2v.3',
  clock: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v4l3 2',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6z',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  gear: 'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  plus: 'M12 5v14M5 12h14',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  target: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 12h.01',
  chart: 'M5 20V10M12 20V4M19 20v-7'
};
function svg(k, cls) {
  return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (IC[k] || '') + '"/></svg>';
}
function dayKey(ts) {
  var d = new Date(ts || Date.now());
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

/* ----------------------------------------------------- display preferences */
var UIDEF = { fs: 1, ls: 1.55, dens: 'comfy', rm: false, wake: false, goal: 60, focus: false, recall: false };
function uiPrefs() {
  var d = Store.d();
  if (!d.ui) d.ui = {};
  for (var k in UIDEF) if (!(k in d.ui)) d.ui[k] = UIDEF[k];
  return d.ui;
}
var WAKE = null;
function applyUI() {
  var u = uiPrefs(), r = document.documentElement;
  r.style.setProperty('--fs', String(u.fs));
  r.style.setProperty('--ls', String(u.ls));
  r.setAttribute('data-dens', u.dens);
  r.classList.toggle('reduce-motion', !!u.rm);
  setWake(!!u.wake);
}
function setWake(on) {
  try {
    if (!on) { if (WAKE) { WAKE.release(); WAKE = null; } return; }
    if (navigator.wakeLock && !WAKE) {
      navigator.wakeLock.request('screen').then(function (l) { WAKE = l; l.addEventListener('release', function () { WAKE = null; }); }, function () {});
    }
  } catch (e) {}
}
document.addEventListener('visibilitychange', function () {
  if (!document.hidden && uiPrefs().wake) setWake(true);
  if (document.hidden) Store.save();
});

/* --------------------------------------------------------- sheets + history
   A bottom sheet (or the question palette) owns ONE sentinel history entry so
   the Android back button closes it instead of leaving the screen.  Closing by
   touch pops that entry; closing by back has already popped it. */
var SHEET = null, SENT = false, SKIP_POP = 0, AFTER_POP = null, DEPTH = 0;
function pushSent() {
  if (SENT) return;
  SENT = true;
  try { history.pushState({ iss: 1, sheet: 1, d: DEPTH }, ''); } catch (e) { SENT = false; }
}
function popSent(after) {
  if (!SENT) { if (after) after(); return; }
  SENT = false; AFTER_POP = after || null; SKIP_POP++;
  try { history.back(); } catch (e) { SKIP_POP--; var a = AFTER_POP; AFTER_POP = null; if (a) a(); }
}
function openSheet(html, cls) {
  if (SHEET && SHEET.parentNode) SHEET.parentNode.removeChild(SHEET);
  var w = document.createElement('div');
  w.className = 'sheet-wrap';
  w.innerHTML = '<div class="scrim" data-sheet-close="1"></div><div class="sheet ' + (cls || '') +
    '" role="dialog" aria-modal="true"><div class="grab"></div><div class="sheet-body">' + html + '</div></div>';
  var tt = document.getElementById('toast'); if (tt) tt.className = '';
  document.body.appendChild(w);
  document.body.classList.add('sheet-open');
  window.requestAnimationFrame(function () { w.classList.add('on'); });
  SHEET = w;
  pushSent();
  return w;
}
/* closeSheet(true): drop the DOM only (the caller navigates and replaces the sentinel);
   closeSheet(): close and pop history;  closeSheet(fn): close, pop history, then run fn */
function closeSheet(arg) {
  var w = SHEET;
  if (w) {
    SHEET = null;
    document.body.classList.remove('sheet-open');
    w.classList.remove('on');
    window.setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 220);
  }
  if (arg === true) return;
  popSent(typeof arg === 'function' ? arg : null);
}
function sheetHead(title, sub) {
  return '<div class="sheet-hd"><div><h3>' + title + '</h3>' + (sub ? '<div class="small muted">' + sub + '</div>' : '') +
    '</div><button type="button" class="icbtn" data-act="sheetClose" aria-label="Close">' + svg('close') + '</button></div>';
}
function sheetSet(html) {
  var b = SHEET && SHEET.querySelector('.sheet-body');
  if (b) b.innerHTML = html;
}

/* ------------------------------------------------------------------- toast */
var TOAST_T = null, TOAST_FN = null;
function toast(msg, opts) {
  opts = opts || {};
  var t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = '<span>' + msg + '</span>' + (opts.label ? '<button type="button" data-act="toastAct">' + E(opts.label) + '</button>' : '');
  TOAST_FN = opts.fn || null;
  t.className = 'on';
  window.clearTimeout(TOAST_T);
  TOAST_T = window.setTimeout(function () { t.className = ''; }, opts.ms || 2600);
}

/* --------------------------------------------------------------- study clock
   Counts only time the person is actually active (touched, scrolled or typed
   within the last 90 s and the page is visible). Feeds the daily-goal ring. */
var CLOCK = { last: Date.now(), run: 0, ticks: 0, nag: 0 };
['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(function (ev) {
  document.addEventListener(ev, function () { CLOCK.last = Date.now(); }, { passive: true, capture: true });
});
function todaySecs() {
  var d = Store.d();
  return (d.study && d.study.days && d.study.days[dayKey()]) || 0;
}
function streakDays() {
  var d = Store.d(), n = 0, ts = Date.now();
  var days = (d.study && d.study.days) || {};
  if (!(days[dayKey(ts)] >= 300)) ts -= 86400000;
  while (days[dayKey(ts)] >= 300) { n++; ts -= 86400000; }
  return n;
}
window.setInterval(function () {
  if (document.hidden) return;
  if (Date.now() - CLOCK.last > 90000) { CLOCK.run = 0; return; }
  var d = Store.d();
  if (!d.study) d.study = { days: {} };
  var k = dayKey();
  d.study.days[k] = (d.study.days[k] || 0) + 5;
  CLOCK.run += 5; CLOCK.ticks++;
  if (CLOCK.ticks % 6 === 0) Store.save();
  var goal = uiPrefs().goal * 60, t = d.study.days[k];
  if (goal && t >= goal && t < goal + 5) toast('Daily goal of ' + uiPrefs().goal + ' min reached. Well done.', { ms: 4000 });
  if (uiPrefs().focus && CLOCK.run >= 1500 && CLOCK.run - CLOCK.nag >= 1500) {
    CLOCK.nag = CLOCK.run;
    toast('25 minutes of focus done. Take a 5-minute break.', { ms: 5000 });
  }
  var el = document.getElementById('ringMin');
  if (el) el.textContent = Math.floor(t / 60);
}, 5000);
window.addEventListener('pagehide', function () { Store.save(); });

/* ----------------------------------------------------------- flag a question */
function nbFlag(qid, on) {
  var d = Store.d();
  if (!d.marked) d.marked = {};
  if (on) { d.marked[qid] = Date.now(); srEnsure('q:' + qid); } else delete d.marked[qid];
  Store.save();
}

/* ----------------------------------------------- spaced repetition (Leitner)
   keys: q:<questionId>  c:<cardId>  n:<kind>|<section>|<group>[|block|item]
   box b -> next review after BOX_DAYS[b] days. */
var BOX_DAYS = [0, 1, 3, 7, 14, 30, 60];
function srEnsure(k) {
  var d = Store.d();
  if (!d.sr) d.sr = {};
  if (!d.sr[k]) d.sr[k] = { b: 0, due: Date.now(), last: 0, l: 0 };
  return d.sr[k];
}
function srRate(k, r) {
  var e = srEnsure(k), now = Date.now();
  if (r === 0) { e.b = 0; e.l = (e.l || 0) + 1; e.due = now + 10 * 60000; }
  else {
    var nb = r === 1 ? Math.max(1, e.b) : Math.min(BOX_DAYS.length - 1, e.b + (r === 3 ? 2 : 1));
    e.b = nb;
    e.due = now + Math.max(BOX_DAYS[nb], 1) * 86400000 * (r === 1 ? 0.6 : 1);
  }
  e.last = now;
  Store.save();
  return e;
}
function srLabel(days) {
  if (days < 0.02) return '<10m';
  if (days < 1) return Math.max(1, Math.round(days * 24)) + 'h';
  if (days < 30) return Math.round(days) + 'd';
  return Math.round(days / 30) + 'mo';
}
function srPreview(k) {
  var e = (Store.d().sr || {})[k] || { b: 0 };
  var top = BOX_DAYS.length - 1;
  return ['<10m',
    srLabel(Math.max(1, BOX_DAYS[Math.max(1, e.b)]) * 0.6),
    srLabel(BOX_DAYS[Math.min(top, e.b + 1)] || 1),
    srLabel(BOX_DAYS[Math.min(top, e.b + 2)] || 3)];
}
function srDueKeys(now) {
  var sr = Store.d().sr || {}, out = [];
  now = now || Date.now();
  Object.keys(sr).forEach(function (k) { if (sr[k].due <= now) out.push(k); });
  out.sort(function (a, b) { return sr[a].due - sr[b].due; });
  return out;
}

/* record one answered question in the per-question history */
function qhRecord(qid, correct, pick) {
  var d = Store.d();
  if (!d.qh) d.qh = {};
  var h = d.qh[qid] || (d.qh[qid] = { a: 0, c: 0, t: 0, p: null });
  h.a++; if (correct) h.c++;
  h.t = Date.now(); if (pick !== undefined && pick !== null) h.p = pick;
}
