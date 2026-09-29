/* ==========================================================================
   UPSC ISS Statistics Paper-I — Offline Mock Engine
   All application logic. No modules, no fetch, no network, no dependencies.
   ========================================================================== */
(function () {
'use strict';

var DATA = window.quizData || [];          /* 720 AUTHENTIC PYQs only */
var FDATA = window.forecastData || [];     /* FORECAST / AI-GENERATED  */
var FMETA = window.forecastMeta || null;
var GDATA = window.gkData || [];          /* GUPTA & KAPOOR Ch 5-8 textbook bank */
var GMETA = window.gkMeta || null;
var CDATA = window.csData || [];          /* COMPUTER book bank (chapter-wise sets) */
var CMETA = window.csMeta || null;
var ALL = DATA.concat(FDATA, GDATA, CDATA);
var META = window.quizMeta || {};
var DEFAULT_CFG = window.quizConfig || {};
var app = document.getElementById('app');

/* ======================================================================
   1.  MATH-LITE  —  offline LaTeX subset renderer (no MathJax, no KaTeX)
   ====================================================================== */
var ML = (function () {

  /* ------------------------------------------------------------------
     Mathematics is typeset by KaTeX, vendored and inlined in the <head>
     of this file.  Nothing is fetched at runtime: the stylesheet, the
     script and all twenty WOFF2 math faces are embedded.  We parse real
     LaTeX - no hand-rolled approximation.
     ------------------------------------------------------------------ */

  var mathErrors = [];

  /* Macros that fill small gaps between the notation used in the source
     booklets and KaTeX's built-in command set.  Nothing here changes the
     meaning of a formula; it only teaches KaTeX names the papers use. */
  var MACROS = {
    '\\dfrac': '\\displaystyle\\frac{#1}{#2}',
    '\\tfrac': '\\textstyle\\frac{#1}{#2}',
    '\\Var': '\\operatorname{Var}',
    '\\Cov': '\\operatorname{Cov}',
    '\\Corr': '\\operatorname{Corr}',
    '\\E': '\\operatorname{E}',
    '\\sgn': '\\operatorname{sgn}',
    '\\tr': '\\operatorname{tr}',
    '\\rank': '\\operatorname{rank}',
    '\\diag': '\\operatorname{diag}',
    '\\Bias': '\\operatorname{Bias}',
    '\\MSE': '\\operatorname{MSE}',
    '\\SE': '\\operatorname{SE}',
    '\\plim': '\\operatorname*{plim}',
    '\\iid': '\\overset{\\text{iid}}{\\sim}',
    '\\eqd': '\\overset{d}{=}',
    '\\convd': '\\xrightarrow{\\,d\\,}',
    '\\convp': '\\xrightarrow{\\,p\\,}',
    '\\indep': '\\perp\\!\\!\\!\\perp',
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\Prob': '\\operatorname{P}'
  };

  var KOPTS_INLINE = {
    displayMode: false, throwOnError: true, strict: 'error', trust: false,
    output: 'html', macros: MACROS, minRuleThickness: 0.06, maxExpand: 2000
  };
  var KOPTS_BLOCK = {
    displayMode: true, throwOnError: true, strict: 'error', trust: false,
    output: 'html', macros: MACROS, minRuleThickness: 0.06, maxExpand: 2000
  };

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* KaTeX call with a hard fallback, so a single bad formula can never take
     the page down.  Failures are recorded for the validation harness. */
  function tex(src, display) {
    var code = String(src === null || src === undefined ? '' : src).trim();
    if (code === '') return '';
    if (typeof window.katex === 'undefined') {
      return '<span class="math-fallback">' + esc(code) + '</span>';
    }
    try {
      return window.katex.renderToString(code, display ? KOPTS_BLOCK : KOPTS_INLINE);
    } catch (e) {
      if (mathErrors.length < 400) {
        mathErrors.push({ src: code, error: String(e && e.message || e) });
      }
      /* second chance: let KaTeX render what it can and colour the rest */
      try {
        var opts = {};
        var base = display ? KOPTS_BLOCK : KOPTS_INLINE;
        for (var k in base) opts[k] = base[k];
        opts.throwOnError = false;
        opts.errorColor = '#ab2020';
        return window.katex.renderToString(code, opts);
      } catch (e2) {
        return '<span class="math-fallback">' + esc(code) + '</span>';
      }
    }
  }

  /* ---- markdown-lite + math mixing ---------------------------------- */
  function inline(t, parts) {
    if (t === null || t === undefined || t === '') return '';
    var h = esc(t);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    /* all mathematics in the data is LaTeX inside $...$ (checked by
       tools/check_latex.py), so prose needs no ASCII-maths fallback */
    h = h.replace(/\u0001(\d+)\u0002/g, function (m, n) {
      var p = parts[+n];
      if (!p) return '';
      /* KaTeX breaks a long inline formula at its top-level relations and
         binary operators, so almost everything wraps by itself.  Only a long
         run with nothing to break at - a printed data list, say - needs its
         own horizontally scrollable line. */
      var cls = 'mq';
      if (p.b) cls = 'mq mq-block';
      else if (p.s.length > 90 && !/[=<>+]|\\le|\\ge|\\ne|\\sim|\\to/.test(p.s)) {
        cls = 'mq mq-long';
      }
      return '<span class="' + cls + '">' + tex(p.s, p.b) + '</span>';
    });
    return h;
  }

  function renderTable(run, parts) {
    var body = run.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
    var rows = body.split(/\|\s*\|/);
    var grid = rows.map(function (r) {
      return r.split('|').map(function (c) { return c.trim(); });
    });
    /* drop the |---|---| separator row */
    var sepAt = -1;
    for (var k = 0; k < grid.length; k++) {
      var allDash = grid[k].length > 0 && grid[k].every(function (c) {
        return /^:?-{2,}:?$/.test(c);
      });
      if (allDash) { sepAt = k; break; }
    }
    var head = null, rest = grid;
    if (sepAt > 0) { head = grid[sepAt - 1]; rest = grid.slice(sepAt + 1); }
    else if (sepAt === 0) { rest = grid.slice(1); }
    var h = '<div class="scrollx"><table class="qtbl">';
    if (head) {
      h += '<thead><tr>';
      head.forEach(function (c) { h += '<th>' + inline(c, parts) + '</th>'; });
      h += '</tr></thead>';
    }
    h += '<tbody>';
    rest.forEach(function (r) {
      h += '<tr>';
      r.forEach(function (c) { h += '<td>' + inline(c, parts) + '</td>'; });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }

  /* Rendering the same stem repeatedly (lists, palettes, re-renders) is
     common, and KaTeX is the expensive part, so memoise on the source text. */
  var CACHE = {};
  var CACHE_KEYS = [];
  var CACHE_MAX = 4000;

  function render(src) {
    if (src === null || src === undefined) return '';
    var s = String(src);
    if (s === '') return '';
    if (CACHE.hasOwnProperty(s)) return CACHE[s];
    var html = renderUncached(s);
    CACHE[s] = html;
    CACHE_KEYS.push(s);
    if (CACHE_KEYS.length > CACHE_MAX) delete CACHE[CACHE_KEYS.shift()];
    return html;
  }

  function renderUncached(src) {
    var s = String(src);
    var parts = [];
    var masked = s.replace(/\$\$([\s\S]*?)\$\$/g, function (m, a) {
      parts.push({ b: true, s: a }); return '\u0001' + (parts.length - 1) + '\u0002';
    });
    masked = masked.replace(/\$([^$]*)\$/g, function (m, a) {
      parts.push({ b: false, s: a }); return '\u0001' + (parts.length - 1) + '\u0002';
    });
    /* markdown blockquote markers carried over from the source booklets.
       Math has already been masked out, so a bare '>' here is never an
       inequality sign. */
    masked = masked.replace(/^\s*>\s*/, '')
                   .replace(/\s>\s*(?=\u0001)/g, ' ')
                   .replace(/\s>\s*(?=\*\*)/g, ' ');
    /* pipe tables (markdown-lite) — math is already masked out */
    var re = /\|(?:[^|\n]*\|)+/g, out = '', last = 0, m2;
    while ((m2 = re.exec(masked)) !== null) {
      if (m2[0].indexOf('---') < 0) continue;
      out += inline(masked.slice(last, m2.index), parts);
      out += renderTable(m2[0], parts);
      last = m2.index + m2[0].length;
    }
    out += inline(masked.slice(last), parts);
    return out;
  }

  /* plain-text version (for search indexing) */
  function strip(src) {
    if (!src) return '';
    return String(src)
      .replace(/\$\$?/g, ' ')
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/[{}\\^_|&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return {
    render: render, esc: esc, strip: strip, tex: tex,
    mathErrors: function () { return mathErrors.slice(); },
    clearCache: function () { CACHE = {}; CACHE_KEYS = []; }
  };
})();

var R = ML.render;
var E = ML.esc;

/* ======================================================================
   2.  LOCAL STORAGE
   ====================================================================== */
var Store = (function () {
  var KEY = 'upsc.iss.stat1.v1';
  var available = true;
  var cache = null;

  function blank() {
    return {
      v: 1,
      settings: {
        marksCorrect: DEFAULT_CFG.marksCorrect,
        marksIncorrect: DEFAULT_CFG.marksIncorrect,
        negativeMarkingEnabled: DEFAULT_CFG.negativeMarkingEnabled,
        negativeMarkFraction: DEFAULT_CFG.negativeMarkFraction,
        minutesPerQuestion: DEFAULT_CFG.defaultMinutesPerQuestion,
        fullPaperMinutes: DEFAULT_CFG.fullPaperMinutes,
        defaultMode: 'exam',
        timerOn: true
      },
      history: [],
      bookmarks: {},
      mistakes: {},
      skipped: {},
      seq: 0
    };
  }

  function load() {
    if (cache) return cache;
    try {
      var raw = window.localStorage.getItem(KEY);
      cache = raw ? JSON.parse(raw) : blank();
    } catch (e) {
      available = false;
      cache = blank();
    }
    if (!cache || cache.v !== 1) cache = blank();
    var b = blank();
    for (var k in b) if (!cache.hasOwnProperty(k)) cache[k] = b[k];
    for (var sk in b.settings) {
      if (!cache.settings.hasOwnProperty(sk)) cache.settings[sk] = b.settings[sk];
    }
    return cache;
  }

  function save() {
    if (!cache) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(cache)); }
    catch (e) { available = false; }
  }

  function reset(what) {
    var b = blank();
    var d = load();
    if (what === 'all') { cache = b; }
    else if (what === 'history') { d.history = []; }
    else if (what === 'mistakes') { d.mistakes = {}; d.skipped = {}; }
    else if (what === 'bookmarks') { d.bookmarks = {}; }
    save();
  }

  return {
    d: load, save: save, reset: reset, blank: blank,
    ok: function () { load(); return available; },
    nextId: function () { var d = load(); d.seq = (d.seq || 0) + 1; return 'a' + Date.now().toString(36) + '-' + d.seq; }
  };
})();

/* ======================================================================
   3.  INDEXES + HELPERS
   ====================================================================== */
var BY_ID = {};
ALL.forEach(function (q) { BY_ID[q.id] = q; });

var SEARCH_INDEX = ALL.map(function (q) {
  return (q.id + ' ' + (q.isCS ? 'computer chapter ' + q.csChapter + ' ' + q.subtopic + ' set ' +
          q.csSet + ' ' + q.questionType + ' ' + (q.code || '') : q.isForecast ? 'forecast 2027' : q.isGK ? 'gupta kapoor chapter ' +
          q.gkChapter + ' ' + q.gkTopicLabel + ' ' + q.gkSection + ' ' + q.difficulty : q.year) + ' ' + q.unit + ' ' +
          q.topic + ' ' + q.subtopic + ' ' + q.questionType + ' ' +
          ML.strip(q.sharedStem) + ' ' + ML.strip(q.question) + ' ' +
          (q.stmts || []).map(ML.strip).join(' ') + ' ' + ML.strip(q.ask) + ' ' +
          (q.options || []).map(ML.strip).join(' ')).toLowerCase();
});

var LET = ['a', 'b', 'c', 'd'];

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function hms(sec) {
  sec = Math.max(0, Math.round(sec));
  var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return (h > 0 ? h + ':' : '') + pad2(m) + ':' + pad2(s);
}
function humanTime(sec) {
  sec = Math.max(0, Math.round(sec));
  var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h) return h + 'h ' + m + 'm';
  if (m) return m + 'm ' + s + 's';
  return s + 's';
}
function pct(a, b) { return b > 0 ? (100 * a / b) : 0; }
function fx(n, d) { return (Math.round(n * Math.pow(10, d || 1)) / Math.pow(10, d || 1)).toFixed(d || 1); }
function dateStr(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
         ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
function uniqBy(arr, key) {
  var seen = {}, out = [];
  arr.forEach(function (x) { var k = key(x); if (!seen[k]) { seen[k] = 1; out.push(x); } });
  return out;
}
function closest(el, sel) {
  while (el && el.nodeType === 1) {
    if (el.matches && el.matches(sel)) return el;
    el = el.parentElement;
  }
  return null;
}
function scorable(q) { return q.correctAnswer !== null && q.correctAnswer !== undefined; }

/* ======================================================================
   4.  AUTOMATIC VALIDATION  (master prompt §32 / §33)
   ====================================================================== */
var AUDIT = (function () {
  var rep = {
    perYear: {}, total: DATA.length, errors: [], warnings: [],
    duplicateIds: 0, duplicateText: 0, missingOptions: 0, missingAnswers: 0,
    missingSolutions: 0, missingShortcuts: 0, missingTips: 0,
    classificationIssues: 0, sourceIssues: 0, mathIssues: 0, orphans: 0,
    units: {}, topics: 0, subtopics: 0
  };
  var ids = {}, yq = {}, texts = {}, topics = {}, subs = {};
  var validUnits = {};
  (META.units || []).forEach(function (u) { validUnits[u] = 1; });

  DATA.forEach(function (q) {
    rep.perYear[q.year] = (rep.perYear[q.year] || 0) + 1;
    rep.units[q.unit] = (rep.units[q.unit] || 0) + 1;

    if (ids[q.id]) { rep.duplicateIds++; rep.errors.push(q.id + ': duplicate question id'); }
    ids[q.id] = 1;

    var k = q.year + '#' + q.questionNumber;
    if (yq[k]) { rep.duplicateIds++; rep.errors.push(k + ': duplicate year/question number'); }
    yq[k] = 1;

    if (!q.question || String(q.question).length < 5) {
      rep.errors.push(q.id + ': question text missing');
    }
    if (!q.options || q.options.length !== 4) {
      rep.missingOptions++;
      if (!q.sourceIssue) rep.errors.push(q.id + ': options missing/incomplete and not flagged');
      else rep.sourceIssues++;
    }
    if (!scorable(q)) {
      rep.missingAnswers++;
      if (q.sourceIssue) { if (q.options && q.options.length === 4) rep.sourceIssues++; }
      else rep.errors.push(q.id + ': no correct answer and no source note');
    } else if (q.correctAnswer < 0 || q.correctAnswer > 3) {
      rep.errors.push(q.id + ': correct-answer index out of range');
    }
    if (!q.solution || !q.solution.length) { rep.missingSolutions++; rep.errors.push(q.id + ': solution missing'); }
    if (!q.examShortcut) { rep.missingShortcuts++; rep.errors.push(q.id + ': exam shortcut missing'); }
    if (!q.tipsTricks || !q.tipsTricks.length) { rep.missingTips++; rep.errors.push(q.id + ': tips missing'); }

    if (!validUnits[q.unit]) { rep.classificationIssues++; rep.errors.push(q.id + ': invalid unit'); }
    if (!q.topic) { rep.classificationIssues++; rep.errors.push(q.id + ': topic missing'); }
    if (!q.subtopic) { rep.classificationIssues++; rep.errors.push(q.id + ': subtopic missing'); }
    topics[q.unit + '|' + q.topic] = 1;
    subs[q.unit + '|' + q.subtopic] = 1;

    if (q.sourceIssue && scorable(q) && q.options && q.options.length === 4) rep.sourceIssues++;

    /* duplicate question text across the dataset */
    var norm = ML.strip(q.question).toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (norm.length > 40) {
      if (texts[norm]) {
        rep.duplicateText++;
        rep.warnings.push(q.id + ': question text closely matches ' + texts[norm]);
      } else texts[norm] = q.id;
    }

    /* mathematical notation sanity: balanced $ and balanced braces in math */
    var blob = [q.sharedStem, q.question].concat(q.options || []).join(' ');
    var dollars = (blob.match(/\$/g) || []).length;
    if (dollars % 2 !== 0) { rep.mathIssues++; rep.warnings.push(q.id + ': unbalanced $ delimiters'); }
    var open = (blob.match(/(^|[^\\])\{/g) || []).length;
    var close = (blob.match(/(^|[^\\])\}/g) || []).length;
    if (open !== close) { rep.mathIssues++; rep.warnings.push(q.id + ': unbalanced braces in notation'); }
  });

  rep.topics = Object.keys(topics).length;
  rep.subtopics = Object.keys(subs).length;
  rep.ok = rep.errors.length === 0;
  return rep;
})();

/* ======================================================================
   5.  SESSION ENGINE
   ====================================================================== */
var S = null;          /* current session */
var TICK = null;

function buildSession(opts) {
  var qs = opts.questions.slice();
  if (opts.shuffleQ) shuffle(qs);
  var items = qs.map(function (q) {
    var order = (q.options && q.options.length && q.options.length !== 4)
      ? q.options.map(function (x, i) { return i; }) : [0, 1, 2, 3];
    if (opts.shuffleO && q.options && q.options.length === 4) shuffle(order);
    return { qid: q.id, order: order };
  });
  var st = Store.d().settings;
  var limit = 0;
  if (opts.timed) {
    limit = Math.round((opts.minutes || (items.length * st.minutesPerQuestion)) * 60);
  }
  S = {
    id: Store.nextId(),
    kind: opts.kind,
    name: opts.name,
    desc: opts.desc || '',
    mode: opts.mode,
    items: items,
    answers: items.map(function () { return null; }),
    marked: items.map(function () { return false; }),
    revealed: items.map(function () { return false; }),
    visited: items.map(function () { return false; }),
    spent: items.map(function () { return 0; }),
    cur: 0,
    startTs: Date.now(),
    lastTs: Date.now(),
    limitSec: limit,
    authentic: !!opts.authentic,
    finished: false,
    result: null
  };
  S.visited[0] = true;
  startTick();
  go('exam');
}

function startTick() {
  stopTick();
  TICK = window.setInterval(function () {
    if (!S || S.finished) { stopTick(); return; }
    var now = Date.now();
    S.spent[S.cur] += (now - S.lastTs) / 1000;
    S.lastTs = now;
    var el = document.getElementById('timer');
    if (el) {
      var elapsed = (now - S.startTs) / 1000;
      if (S.limitSec) {
        var left = S.limitSec - elapsed;
        if (left <= 0) { finishSession(true); return; }
        el.textContent = hms(left);
        el.className = 'timer' + (left < 300 ? ' low' : '');
      } else {
        el.textContent = hms(elapsed);
      }
    }
  }, 1000);
}
function stopTick() { if (TICK) { window.clearInterval(TICK); TICK = null; } }

function markSpent() {
  if (!S) return;
  var now = Date.now();
  S.spent[S.cur] += (now - S.lastTs) / 1000;
  S.lastTs = now;
}

function curQ() { return BY_ID[S.items[S.cur].qid]; }

function chosenOriginal(idx) {
  var a = S.answers[idx];
  if (a === null) return null;
  return S.items[idx].order[a];
}

function gotoQ(n) {
  if (!S || n < 0 || n >= S.items.length) return;
  markSpent();
  S.cur = n;
  S.visited[n] = true;
  render();
  window.scrollTo(0, 0);
}

function chooseOption(displayIdx) {
  if (!S || S.finished) return;
  if (displayIdx < 0 || displayIdx >= S.items[S.cur].order.length) return;
  if (S.mode === 'learn' && S.revealed[S.cur]) return;   /* locked after reveal */
  S.answers[S.cur] = (S.answers[S.cur] === displayIdx && S.mode === 'exam') ? null : displayIdx;
  if (S.mode === 'learn' && S.answers[S.cur] !== null) S.revealed[S.cur] = true;
  if (S.kind === 'cs' && S.mode === 'learn' && S.answers[S.cur] !== null) {
    csMarkQ(curQ().id, chosenOriginal(S.cur) === curQ().correctAnswer);
  }
  render();
}

function finishSession(auto) {
  if (!S || S.finished) return;
  markSpent();
  stopTick();
  S.finished = true;
  S.endTs = Date.now();
  S.autoSubmitted = !!auto;
  S.result = scoreSession(S);
  persistAttempt(S);
  go('result');
  window.scrollTo(0, 0);
}

function scoreSession(sess) {
  var st = Store.d().settings;
  var neg = st.negativeMarkingEnabled ? (st.negativeMarkFraction * st.marksCorrect) : 0;
  var r = {
    total: sess.items.length, attempted: 0, correct: 0, incorrect: 0,
    unanswered: 0, excluded: 0, score: 0, maxScore: 0, perQ: []
  };
  sess.items.forEach(function (it, i) {
    var q = BY_ID[it.qid];
    var chosen = chosenOriginal(i);
    var rec = { qid: it.qid, chosen: chosen, marked: sess.marked[i],
                secs: Math.round(sess.spent[i]), status: '' };
    if (!scorable(q)) {
      r.excluded++;
      rec.status = 'excluded';
      if (chosen !== null) r.attempted++;
    } else {
      r.maxScore += st.marksCorrect;
      if (chosen === null) { r.unanswered++; rec.status = 'unanswered'; }
      else {
        r.attempted++;
        if (chosen === q.correctAnswer) {
          r.correct++; rec.status = 'correct'; r.score += st.marksCorrect;
        } else {
          r.incorrect++; rec.status = 'incorrect'; r.score -= neg;
        }
      }
    }
    r.perQ.push(rec);
  });
  r.seconds = Math.round(((sess.endTs || Date.now()) - sess.startTs) / 1000);
  r.pct = pct(r.score, r.maxScore);
  r.accuracy = pct(r.correct, r.correct + r.incorrect);
  r.avgPerAttempt = r.attempted ? r.seconds / r.attempted : 0;
  return r;
}

function persistAttempt(sess) {
  var d = Store.d();
  var res = sess.result;
  d.history.unshift({
    id: sess.id, name: sess.name, kind: sess.kind, desc: sess.desc,
    mode: sess.mode, ts: sess.endTs,
    total: res.total, attempted: res.attempted, correct: res.correct,
    incorrect: res.incorrect, unanswered: res.unanswered, excluded: res.excluded,
    score: res.score, maxScore: res.maxScore, pct: res.pct,
    accuracy: res.accuracy, seconds: res.seconds,
    perQ: res.perQ.map(function (p) {
      return { qid: p.qid, chosen: p.chosen, status: p.status, secs: p.secs };
    })
  });
  if (d.history.length > 60) d.history.length = 60;
  if (sess.kind === 'cs') csRecord(sess);

  res.perQ.forEach(function (p) {
    if (p.status === 'incorrect') {
      var m = d.mistakes[p.qid] || { c: 0, t: 0 };
      m.c++; m.t = sess.endTs; d.mistakes[p.qid] = m;
      if (d.skipped[p.qid]) delete d.skipped[p.qid];
    } else if (p.status === 'unanswered') {
      var s2 = d.skipped[p.qid] || { c: 0, t: 0 };
      s2.c++; s2.t = sess.endTs; d.skipped[p.qid] = s2;
    } else if (p.status === 'correct') {
      if (d.mistakes[p.qid]) delete d.mistakes[p.qid];
      if (d.skipped[p.qid]) delete d.skipped[p.qid];
    }
  });
  Store.save();
}

/* ======================================================================
   6.  ROUTING
   ====================================================================== */
var ROUTE = { name: 'home' };
var BUILDER = null;
var REVIEW = { idx: 0, filter: 'all' };
var SEARCH = { q: '', unit: '', year: '', bank: '' };
var STUDY = { qid: null, back: 'home' };

function go(name, params) {
  ROUTE = { name: name };
  if (params) for (var k in params) ROUTE[k] = params[k];
  render();
  window.scrollTo(0, 0);
}

/* ======================================================================
   7.  SHARED VIEW FRAGMENTS
   ====================================================================== */
function crumb(parts) {
  return '<div class="crumb">' + parts.map(function (p, i) {
    return i === parts.length - 1 ? '<b>' + E(p) + '</b>' : E(p);
  }).join(' &rsaquo; ') + '</div>';
}

function provenanceBanner() {
  return '<div class="banner info"><b>Answer-key provenance.</b> The 720 questions and their ' +
    'options are authentic UPSC PYQs, reproduced verbatim. None of the source booklets carried ' +
    'an official answer key, so every answer, Exam Shortcut, Tips &amp; Tricks note and ' +
    'Step-by-Step Solution in this app is an <b>AI-derived explanation</b> produced for this ' +
    'project — a study aid, not an official UPSC solution.</div>';
}

function provenanceBadge(q) {
  if (q.isCS) return '<span class="cs-topic">' + E(csChapter(q.csChapter) ? csChapter(q.csChapter).title : q.subtopic) + '</span>';
  if (q.isGK) return '<span class="gk-badge">GUPTA KAPOOR &middot; Ch ' + q.gkChapter + ' &middot; not PYQ</span>';
  return q.isForecast ? '<span class="fc-badge">FORECAST &middot; AI-generated</span>'
                       : '<span class="pyq-badge">Authentic PYQ</span>';
}

/* Full classification line (id, unit, topic, subtopic, question type) -
   shown only in Review and the Study Card, i.e. after an attempt is over.
   The live attempt screen (V.exam) shows just the provenance badge, so
   answering a question is not cluttered with labels the solver did not
   ask to see. */
function qMetaLine(q) {
  if (q.isCS) return csMetaLine(q);
  return '<div class="qmeta">' + provenanceBadge(q) +
    '<span>' + E(q.id) + '</span><span>' + E(q.unit) +
    '</span><span>' + E(q.topic) + '</span><span>' + E(q.subtopic) +
    '</span><span>' + E(q.questionType) + '</span>' +
    (q.isGK ? '<span>' + E(q.gkTopicLabel) + '</span><span>\u00a7' + E(q.gkSection) + '</span>' : '') + '</div>';
}

function sharedStemHtml(q) {
  if (!q.sharedStem) return '';
  return '<div class="shared"><span class="lbl">Common data for this group</span>' +
         R(q.sharedStem) + '</div>';
}

function bookmarkBtn(qid) {
  var on = !!Store.d().bookmarks[qid];
  return '<button type="button" class="btn sm' + (on ? ' primary' : '') +
    '" data-act="bookmark" data-qid="' + E(qid) + '">' +
    (on ? '\u2605 Bookmarked' : '\u2606 Bookmark') + '</button>';
}

/* the four reveal panes, in the fixed order required by the master prompt */
function revealPanes(q, chosenOriginal, opts) {
  opts = opts || {};
  if (q.isCS) return csRevealPanes(q, chosenOriginal, opts);
  if (q.isGK) return gkRevealPanes(q, chosenOriginal, opts);
  var h = '';
  var isCorrect = scorable(q) && chosenOriginal === q.correctAnswer;
  var answered = chosenOriginal !== null && chosenOriginal !== undefined;

  /* 1 — Correct / Incorrect */
  var cls = !scorable(q) ? 'verdict-skip' : (!answered ? 'verdict-skip' : (isCorrect ? 'verdict-ok' : 'verdict-bad'));
  var verdict = !scorable(q) ? 'Not scored — source defect'
              : (!answered ? 'Not answered' : (isCorrect ? 'Correct' : 'Incorrect'));
  h += '<div class="pane ' + cls + '"><div class="hd"><span class="step">1</span>' +
       E(verdict) + '</div><div class="bd">';
  h += '<div class="small"><b>Your answer:</b> ' +
       (answered ? '(' + LET[chosenOriginal] + ') ' + R(q.options[chosenOriginal])
                 : '<span class="muted">not attempted</span>') + '</div>';
  h += '<div class="small mt"><b>Correct answer:</b> ' +
       (scorable(q) ? '(' + LET[q.correctAnswer] + ') ' + R(q.options[q.correctAnswer])
                    : '<span class="muted">no valid option in the source paper</span>') + '</div>';
  h += '</div></div>';

  /* 2 — Exam Shortcut */
  var aiNote = q.isForecast
    ? '<div class="ai-note">FORECAST / AI-GENERATED. This is not a previous-year ' +
      'question and there is no official UPSC solution for it.</div>'
    : '<div class="ai-note">AI-derived explanation. Not an official UPSC solution.</div>';
  h += '<div class="pane"><div class="hd"><span class="step">2</span>Exam Shortcut ' +
       '<span class="chip">~30 sec</span></div><div class="bd">' +
       R(q.examShortcut) + aiNote + '</div></div>';

  /* 3 — Tips & Tricks */
  h += '<div class="pane"><div class="hd"><span class="step">3</span>Tips &amp; Tricks</div>' +
       '<div class="bd"><ul>';
  (q.tipsTricks || []).forEach(function (t) { h += '<li>' + R(t) + '</li>'; });
  h += '</ul>' + aiNote + '</div></div>';

  /* 4 — Step-by-Step Solution */
  h += '<div class="pane"><div class="hd"><span class="step">4</span>Step-by-Step Solution</div>' +
       '<div class="bd"><ol>';
  (q.solution || []).forEach(function (s) { h += '<li>' + R(s.text) + '</li>'; });
  h += '</ol>' + aiNote + '</div></div>';

  if (opts.topic !== false) {
    var ti = (META.topicIntel || {})[q.topicCode];
    if (ti) {
      h += '<div class="pane"><div class="hd">Topic intelligence · ' + E(ti.code) + ' ' +
           E(ti.name) + '</div><div class="bd small">' +
           '<p><b>Weight.</b> ' + E(ti.weight) + '</p>' +
           '<p><b>Examiner\u2019s pattern.</b> ' + R(ti.pattern) + '</p>' +
           '<p><b>Must-know.</b> ' + R(ti.mustKnow) + '</p></div></div>';
    }
  }
  return h;
}

function optionList(q, order, selected, opts) {
  opts = opts || {};
  if (!q.options || !q.options.length) {
    return '<div class="srcissue">The four answer options for this question are missing from ' +
      'the source scan. The stem is reproduced exactly as printed; nothing has been invented.</div>';
  }
  var h = '<ul class="opts">';
  for (var d = 0; d < order.length; d++) {
    var orig = order[d];
    var cls = 'opt';
    if (opts.showAnswer) {
      if (scorable(q) && orig === q.correctAnswer) cls += ' correct';
      else if (selected === d) cls += ' wrong';
    } else if (selected === d) cls += ' sel';
    h += '<li><button type="button" class="' + cls + '"' +
         (opts.disabled ? ' disabled' : '') +
         ' data-act="opt" data-i="' + d + '">' +
         '<span class="k">' + LET[d] + '</span><span class="v">' +
         (q.isCS ? csR(q.options[orig]) : R(q.options[orig])) + '</span>' +
         '</button></li>';
  }
  return h + '</ul>';
}

/* ======================================================================
   8.  SCREENS
   ====================================================================== */
var V = {};

/* ------------------------------------------------------------- 8.1 home */
V.home = function () {
  var d = Store.d();
  var nMis = Object.keys(d.mistakes).length;
  var nSkip = Object.keys(d.skipped).length;
  var nBm = Object.keys(d.bookmarks).length;
  var h = '';

  if (!AUDIT.ok) {
    h += '<div class="banner" style="background:var(--bad-bg);border-color:var(--bad-line);color:var(--bad)">' +
      '<b>Dataset validation failed:</b> ' + AUDIT.errors.length +
      ' error(s). <button class="btn sm" data-act="go" data-r="audit">Open data audit</button></div>';
  }
  if (!Store.ok()) {
    h += '<div class="banner info"><b>Local storage unavailable.</b> Your browser is blocking ' +
      'site data for local files, so history, bookmarks and the mistake bank will not survive ' +
      'a reload. Everything else works normally.</div>';
  }

  h += '<div class="card"><h1>UPSC ISS Statistics Paper-I &mdash; Objective</h1>' +
    '<p class="card-sub">' + META.totalQuestions + ' authentic previous-year questions from ' +
    META.years.length + ' papers (' + META.years[0] + '\u2013' + META.years[META.years.length - 1] +
    '), classified against the official syllabus. Runs entirely offline.</p>' +
    '<div class="kpis">' +
    '<div class="kpi"><div class="v">' + META.totalQuestions + '</div><div class="l">Questions</div></div>' +
    '<div class="kpi"><div class="v">' + META.years.length + '</div><div class="l">Papers</div></div>' +
    '<div class="kpi"><div class="v">' + AUDIT.topics + '</div><div class="l">Topics</div></div>' +
    '<div class="kpi"><div class="v">' + AUDIT.subtopics + '</div><div class="l">Subtopics</div></div>' +
    '</div></div>';

  h += provenanceBanner();

  h += '<h2>Practise</h2><div class="grid g3">';
  h += tile('setup', { k: 'year' }, 'Full Year Mocks',
    'Any of the nine authentic papers, in the original order.', META.years.length + ' papers · 80 questions each');
  h += tile('setup', { k: 'section' }, 'Sectional Mocks',
    'By unit \u2014 single year, or across 2018\u20132026.', '4 units');
  h += tile('setup', { k: 'topic' }, 'Topic Mocks',
    'Unit \u2192 topic, drawn from every paper.', AUDIT.topics + ' syllabus topics');
  h += tile('setup', { k: 'subtopic' }, 'Subtopic Mocks',
    'Drill down to a single syllabus concept.', AUDIT.subtopics + ' concepts');
  h += tile('setup', { k: 'custom' }, 'Custom Mock',
    'Pick years, units, topics, length, mode and order.', 'Full control');
  h += tile('go', { r: 'mistakes' }, 'Practice My Mistakes',
    'Everything you have answered incorrectly, plus questions you skipped.',
    nMis + ' incorrect · ' + nSkip + ' skipped');
  h += '</div>';

  if (FMETA) {
    var fp = FMETA.perUnit['Probability'] || 0;
    var fs = FMETA.perUnit['Statistical Methods'] || 0;
    var fpm = FMETA.mocks.filter(function (m) { return m.unit === 'Probability'; }).length;
    var fsm = FMETA.mocks.length - fpm;
    h += '<h2 class="mt">Forecast practice <span class="fc-badge">AI-GENERATED &middot; NOT PYQ</span></h2>';
    h += '<div class="banner warn"><b>These are not previous-year questions.</b> The ' +
      FMETA.total + ' forecast items below were written for the 2027 attempt and are kept ' +
      'in a separate bank from the ' + META.totalQuestions + ' authentic PYQs. They never ' +
      'appear in a year, sectional, topic, subtopic or custom mock, and they are excluded ' +
      'from the PYQ analytics.</div>';
    h += '<div class="grid g3">';
    h += tile('go', { r: 'forecast', u: 'Probability' }, 'Probability Forecast Mocks',
      'Named sectional mocks of exactly ' + FMETA.mockSize + ' questions each, spread across the topic grid.',
      fpm + ' mocks \u00b7 ' + fp + ' questions');
    h += tile('go', { r: 'forecast', u: 'Statistical Methods' }, 'Statistical Methods Forecast Mocks',
      'Named sectional mocks of exactly ' + FMETA.mockSize + ' questions each, spread across the topic grid.',
      fsm + ' mocks \u00b7 ' + fs + ' questions');
    h += tile('go', { r: 'forecast' }, 'All Forecast Mocks',
      'Every named forecast mock in one list, with its topic coverage.',
      FMETA.mocks.length + ' mocks \u00b7 ' + FMETA.total + ' questions');
    h += '</div>';
  }

  h += csHomeSection();
  h += gkHomeSection();

  h += '<h2 class="mt">Review &amp; track</h2><div class="grid g3">';
  h += tile('go', { r: 'analytics' }, 'Analytics',
    'Accuracy by year, unit, topic, subtopic and question type; weak-area engine.',
    d.history.length + ' attempt(s) recorded');
  h += tile('go', { r: 'history' }, 'Attempt History',
    'Every mock you have submitted, with score trend.', d.history.length + ' attempt(s)');
  h += tile('go', { r: 'bookmarks' }, 'My Bookmarks',
    'Questions you flagged to come back to.', nBm + ' bookmarked');
  h += tile('go', { r: 'search' }, 'Search the Question Bank',
    'Find questions by text, year, unit, topic, subtopic or id. Forecast hits are badged.',
    META.totalQuestions + ' PYQs' + (FMETA ? ' + ' + FMETA.total + ' forecast' : ''));
  h += tile('go', { r: 'audit' }, 'Data Audit',
    'Automatic validation report, counts and flagged source issues.',
    AUDIT.ok ? 'All checks passed' : AUDIT.errors.length + ' error(s)');
  h += tile('go', { r: 'settings' }, 'Settings &amp; Data',
    'Marking scheme, timer, export / import / reset.', Store.ok() ? 'Saved locally' : 'Storage blocked');
  h += '</div>';

  h += '<div class="card mt"><h3>Paper composition</h3><div class="scrollx">' +
    '<table class="dt"><thead><tr><th>Year</th>';
  META.units.forEach(function (u) { h += '<th class="num">' + E(META.taxonomy[u].short) + '</th>'; });
  h += '<th class="num">Total</th></tr></thead><tbody>';
  META.years.forEach(function (y) {
    h += '<tr><td><b>' + y + '</b></td>';
    META.units.forEach(function (u) {
      h += '<td class="num">' + META.perYearUnit[y][u] + '</td>';
    });
    h += '<td class="num"><b>' + META.perYear[y] + '</b></td></tr>';
  });
  h += '<tr><td><b>Total</b></td>';
  META.units.forEach(function (u) { h += '<td class="num"><b>' + META.taxonomy[u].count + '</b></td>'; });
  h += '<td class="num"><b>' + META.totalQuestions + '</b></td></tr>';
  h += '</tbody></table></div></div>';

  return h;
};

V.forecast = function (p) {
  var want = (p && p.u) || '';
  var h = crumb(['Home', 'Forecast practice' + (want ? ' \u00b7 ' + want : '')]);
  if (!FMETA) {
    return h + '<div class="card"><h1>No forecast bank loaded</h1></div>';
  }
  h += '<div class="card"><h1>Forecast Mocks <span class="fc-badge">AI-GENERATED</span></h1>' +
    '<p class="card-sub">' + FMETA.total + ' forecast questions for the 2027 attempt, dealt into ' +
    FMETA.mocks.length + ' named mocks of exactly ' + FMETA.mockSize + ' questions each. Every ' +
    'question appears in exactly one mock, and each mock is spread across as many topics as ' +
    'the bank allows.</p>' +
    '<div class="banner warn"><b>Provenance.</b> ' + E(FMETA.provenance.questions) + '</div>' +
    '</div>';

  var units = want ? [want] : ['Probability', 'Statistical Methods'];
  units.forEach(function (u) {
    var ms = FMETA.mocks.filter(function (m) { return m.unit === u; });
    if (!ms.length) return;
    h += '<h2 class="mt">' + E(u) + ' <span class="muted tiny">' +
      (FMETA.perUnit[u] || 0) + ' questions \u00b7 ' + ms.length + ' mocks</span></h2>';
    h += '<div class="grid g3">';
    ms.forEach(function (m) {
      h += '<div class="tile fc-tile"><span class="t">' + E(m.name) + '</span>' +
        '<span class="d">' + m.count + ' questions \u00b7 ' + m.topics.length +
        ' topic(s)</span><span class="n">' + E(m.topics.slice(0, 3).join(' \u00b7 ')) +
        (m.topics.length > 3 ? ' \u00b7 \u2026' : '') + '</span>' +
        '<span class="fc-actions">' +
        '<button type="button" class="btn sm primary" data-act="fcStart" data-m="' + E(m.id) +
        '" data-mode="learning">Learning</button> ' +
        '<button type="button" class="btn sm" data-act="fcStart" data-m="' + E(m.id) +
        '" data-mode="exam">Strict Exam</button></span></div>';
    });
    h += '</div>';
  });
  return h;
};

function startForecastMock(mockId, mode) {
  if (!FMETA) return;
  var m = null;
  FMETA.mocks.forEach(function (x) { if (x.id === mockId) m = x; });
  if (!m) return;
  var qs = m.questionIds.map(function (i) { return BY_ID[i]; }).filter(Boolean);
  if (!qs.length) { window.alert('That forecast mock is empty.'); return; }
  var st = Store.d().settings;
  buildSession({
    kind: 'forecast',
    name: m.name,
    desc: 'FORECAST / AI-GENERATED \u00b7 ' + qs.length + ' questions \u00b7 ' + m.unit +
          ' \u00b7 mode: ' + (mode === 'exam' ? 'Strict Exam' : 'Learning'),
    mode: mode === 'exam' ? 'exam' : 'learn',
    questions: qs,
    shuffleQ: false, shuffleO: false,
    timed: st.timerOn,
    minutes: Math.round(qs.length * st.minutesPerQuestion),
    authentic: false
  });
}

function tile(act, params, title, desc, note) {
  var attrs = '';
  for (var k in params) attrs += ' data-' + k + '="' + E(params[k]) + '"';
  return '<button type="button" class="tile" data-act="' + act + '"' + attrs + '>' +
    '<span class="t">' + title + '</span><span class="d">' + desc + '</span>' +
    (note ? '<span class="n">' + note + '</span>' : '') + '</button>';
}

/* ---------------------------------------------------------- 8.2 setup */
function newBuilder(kind) {
  var st = Store.d().settings;
  return {
    kind: kind,
    years: [], units: [], topics: [], subtopics: [],
    /* Sectional Mocks default to a practice-length 25 questions; the count
       field still caps at whatever the year+unit filters actually match,
       so a single-year selection shows only that paper's real count rather
       than being padded up to 25. Every other mock kind still defaults to
       "all matching questions" (0). */
    count: kind === 'section' ? 25 : 0,
    mode: st.defaultMode, timed: st.timerOn,
    minutes: 0, shuffleQ: false, shuffleO: false
  };
}

function builderQuestions(B) {
  var qs = DATA.filter(function (q) {
    if (B.years.length && B.years.indexOf(String(q.year)) < 0) return false;
    if (B.units.length && B.units.indexOf(q.unit) < 0) return false;
    if (B.topics.length && B.topics.indexOf(q.topic) < 0) return false;
    if (B.subtopics.length && B.subtopics.indexOf(q.subtopic) < 0) return false;
    return true;
  });
  qs = uniqBy(qs, function (q) { return q.id; });
  qs.sort(function (a, b) { return a.year - b.year || a.questionNumber - b.questionNumber; });
  return qs;
}

function builderName(B) {
  if (B.kind === 'year') return B.years[0] + ' Full Paper';
  var bits = [];
  if (B.years.length === 1) bits.push(B.years[0]);
  else if (B.years.length > 1) bits.push(B.years.length + ' years');
  else bits.push('2018\u20132026');
  if (B.subtopics.length === 1) bits.push(B.subtopics[0]);
  else if (B.topics.length === 1) bits.push(B.topics[0]);
  else if (B.units.length === 1) bits.push(META.taxonomy[B.units[0]].short);
  else if (B.units.length > 1) bits.push(B.units.length + ' units');
  else bits.push('All units');
  return bits.join(' \u00b7 ');
}

function builderDesc(B, n) {
  var st = Store.d().settings;
  var p = [];
  p.push('Years: ' + (B.years.length ? B.years.join(', ') : 'all 2018\u20132026'));
  p.push('Units: ' + (B.units.length ? B.units.map(function (u) { return META.taxonomy[u].short; }).join(', ') : 'all four'));
  if (B.topics.length) p.push('Topics: ' + B.topics.join(', '));
  if (B.subtopics.length) p.push('Subtopics: ' + B.subtopics.join(', '));
  p.push('Questions: ' + n);
  p.push('Mode: ' + (B.mode === 'exam' ? 'Strict Exam' : 'Learning'));
  p.push('Timer: ' + (B.timed ? (B.minutes || Math.round(n * st.minutesPerQuestion)) + ' min' : 'off (stopwatch)'));
  p.push('Order: ' + (B.shuffleQ ? 'randomised' : 'paper order') +
         ', options ' + (B.shuffleO ? 'randomised' : 'as printed'));
  return p.join(' \u00b7 ');
}

V.setup = function () {
  var B = BUILDER;
  var st = Store.d().settings;
  var titles = { year: 'Full Year Mock', section: 'Sectional Mock', topic: 'Topic Mock',
                 subtopic: 'Subtopic Mock', custom: 'Custom Mock' };
  var h = crumb(['Home', 'Mock setup', titles[B.kind]]);
  h += '<div class="card"><h1>' + titles[B.kind] + '</h1>';

  if (B.kind === 'year') {
    h += '<p class="card-sub">An authentic paper simulation: the actual questions, in the ' +
      'original printed order, with the original options and numbering. Question order and ' +
      'option order are never randomised for a full paper.</p>';
    h += '<label class="f"><span>Paper</span><select data-act="setYear">';
    META.years.forEach(function (y) {
      h += '<option value="' + y + '"' + (B.years[0] == y ? ' selected' : '') + '>' +
        y + ' \u2014 ' + META.perYear[y] + ' questions</option>';
    });
    h += '</select></label>';
  }

  if (B.kind === 'section' || B.kind === 'custom' || B.kind === 'topic' || B.kind === 'subtopic') {
    h += '<label class="f"><span>Years <span class="hint">(none selected = all nine papers)</span></span>' +
      '<div class="checks">';
    META.years.forEach(function (y) {
      h += '<label><input type="checkbox" data-act="tgYear" value="' + y + '"' +
        (B.years.indexOf(String(y)) >= 0 ? ' checked' : '') + '> ' + y + '</label>';
    });
    h += '</div></label>';

    h += '<label class="f"><span>Units <span class="hint">(none selected = all four)</span></span>' +
      '<div class="checks">';
    META.units.forEach(function (u) {
      h += '<label><input type="checkbox" data-act="tgUnit" value="' + E(u) + '"' +
        (B.units.indexOf(u) >= 0 ? ' checked' : '') + '> ' + E(META.taxonomy[u].short) +
        ' <span class="muted tiny">(' + META.taxonomy[u].count + ')</span></label>';
    });
    h += '</div></label>';
  }

  if (B.kind === 'topic' || B.kind === 'subtopic' || B.kind === 'custom') {
    var unitsFor = B.units.length ? B.units : META.units;
    h += '<label class="f"><span>Topics <span class="hint">(none selected = every topic in the chosen units)</span></span>';
    unitsFor.forEach(function (u) {
      h += '<div class="mt tiny muted"><b>' + E(META.taxonomy[u].short) + '</b></div><div class="checks">';
      var tps = META.taxonomy[u].topics;
      Object.keys(tps).forEach(function (t) {
        h += '<label><input type="checkbox" data-act="tgTopic" value="' + E(t) + '"' +
          (B.topics.indexOf(t) >= 0 ? ' checked' : '') + '> ' +
          E(tps[t].code) + ' \u00b7 ' + E(t) + ' <span class="muted tiny">(' + tps[t].count + ')</span></label>';
      });
      h += '</div>';
    });
    h += '</label>';
  }

  if (B.kind === 'subtopic' || B.kind === 'custom') {
    var subMap = {};
    var unitsFor2 = B.units.length ? B.units : META.units;
    unitsFor2.forEach(function (u) {
      var tps = META.taxonomy[u].topics;
      Object.keys(tps).forEach(function (t) {
        if (B.topics.length && B.topics.indexOf(t) < 0) return;
        Object.keys(tps[t].subtopics).forEach(function (sname) {
          subMap[sname] = (subMap[sname] || 0) + tps[t].subtopics[sname];
        });
      });
    });
    var subNames = Object.keys(subMap).sort();
    h += '<label class="f"><span>Subtopics / syllabus concepts <span class="hint">(none selected = all)</span></span><div class="checks">';
    subNames.forEach(function (sn) {
      h += '<label><input type="checkbox" data-act="tgSub" value="' + E(sn) + '"' +
        (B.subtopics.indexOf(sn) >= 0 ? ' checked' : '') + '> ' + E(sn) +
        ' <span class="muted tiny">(' + subMap[sn] + ')</span></label>';
    });
    h += '</div></label>';
  }

  var qs = builderQuestions(B);
  var maxN = qs.length;

  if (B.kind !== 'year') {
    h += '<div class="grid g2">';
    h += '<label class="f"><span>Number of questions <span class="hint">(0 = all ' + maxN + ')</span></span>' +
      '<input type="number" min="0" max="' + maxN + '" step="1" value="' + B.count +
      '" data-act="setCount"></label>';
    h += '<label class="f"><span>Time limit in minutes <span class="hint">(0 = auto, ' +
      st.minutesPerQuestion + ' min/question)</span></span>' +
      '<input type="number" min="0" step="1" value="' + B.minutes + '" data-act="setMinutes"></label>';
    h += '</div>';
  }

  h += '<label class="f"><span>Mode</span><div class="checks">' +
    '<label><input type="radio" name="mode" data-act="setMode" value="exam"' +
    (B.mode === 'exam' ? ' checked' : '') + '> Strict Exam Mode</label>' +
    '<label><input type="radio" name="mode" data-act="setMode" value="learn"' +
    (B.mode === 'learn' ? ' checked' : '') + '> Learning Mode</label>' +
    '</div><div class="hint">Strict Exam Mode hides the answer, shortcut, tips and solution ' +
    'until you submit. Learning Mode reveals them one question at a time, in the fixed order: ' +
    'verdict &rarr; exam shortcut &rarr; tips &amp; tricks &rarr; step-by-step solution.</div></label>';

  h += '<label class="f"><span>Options</span><div class="checks">' +
    '<label><input type="checkbox" data-act="tgTimed"' + (B.timed ? ' checked' : '') +
    '> Timer with limit (auto-submit at 0)</label>';
  if (B.kind !== 'year') {
    h += '<label><input type="checkbox" data-act="tgShuffleQ"' + (B.shuffleQ ? ' checked' : '') +
      '> Randomise question order</label>' +
      '<label><input type="checkbox" data-act="tgShuffleO"' + (B.shuffleO ? ' checked' : '') +
      '> Randomise option order</label>';
  } else {
    h += '<span class="hint">Authentic full papers always keep the printed question and option order.</span>';
  }
  h += '</div></label>';

  var n = B.count > 0 ? Math.min(B.count, maxN) : maxN;
  h += '<div class="banner" id="mockSummary"><b>This mock:</b> ' + E(builderDesc(B, n)) + '</div>';

  if (maxN === 0) {
    h += '<div class="banner info">No questions match this selection. Widen the filters.</div>';
  }
  h += '<div class="btnrow">' +
    '<button type="button" class="btn primary" id="startBtn" data-act="startMock"' +
    (maxN ? '' : ' disabled') +
    '>Start \u2014 ' + n + ' question' + (n === 1 ? '' : 's') + '</button>' +
    '<button type="button" class="btn" data-act="go" data-r="home">Cancel</button></div>';
  h += '</div>';
  return h;
};

/* Numeric fields must NOT trigger a full re-render: the change event fires on
   blur, i.e. during the mousedown of whatever the user clicks next, and
   replacing the DOM at that moment swallows that click.  Update in place. */
function refreshSetupSummary() {
  var B = BUILDER;
  if (!B) return;
  var maxN = builderQuestions(B).length;
  var n = B.count > 0 ? Math.min(B.count, maxN) : maxN;
  var sm = document.getElementById('mockSummary');
  if (sm) sm.innerHTML = '<b>This mock:</b> ' + E(builderDesc(B, n));
  var sb = document.getElementById('startBtn');
  if (sb) {
    sb.textContent = 'Start \u2014 ' + n + ' question' + (n === 1 ? '' : 's');
    sb.disabled = maxN === 0;
  }
}

/* ----------------------------------------------------------- 8.3 exam */
V.exam = function () {
  if (!S) { return V.home(); }
  var it = S.items[S.cur];
  var q = BY_ID[it.qid];
  var st = Store.d().settings;
  var answered = 0, markedN = 0;
  S.answers.forEach(function (a) { if (a !== null) answered++; });
  S.marked.forEach(function (m) { if (m) markedN++; });

  var elapsed = ((S.finished ? S.endTs : Date.now()) - S.startTs) / 1000;
  var tdisp = S.limitSec ? hms(Math.max(0, S.limitSec - elapsed)) : hms(elapsed);

  var h = '';
  h += '<div class="exam-head">' +
    '<span class="qpos">Q ' + (S.cur + 1) + ' / ' + S.items.length + '</span>' +
    '<span class="chip' + (S.mode === 'exam' ? ' brand' : ' mark') + '">' +
    (S.mode === 'exam' ? 'Strict Exam' : 'Learning') + '</span>' +
    (S.authentic ? '<span class="chip">Authentic paper</span>' : '') +
    '<span class="spacer"></span>' +
    '<span class="chip ok">' + answered + ' answered</span>' +
    '<span class="chip mark">' + markedN + ' marked</span>' +
    '<span id="timer" class="timer">' + tdisp + '</span>' +
    '<span class="navpair">' +
    '<button type="button" class="btn sm" data-act="prevQ" title="Previous question"' +
    (S.cur === 0 ? ' disabled' : '') + '>&larr;</button>' +
    '<button type="button" class="btn sm primary" data-act="nextQ" title="Next question"' +
    (S.cur === S.items.length - 1 ? ' disabled' : '') + '>&rarr;</button>' +
    '</span>' +
    '</div>';

  h += '<div class="progbar"><i style="width:' +
    fx(pct(answered, S.items.length), 1) + '%"></i></div>';

  h += '<div class="exam-layout mt">';

  /* ---- main column ---- */
  h += '<div>';
  h += '<div class="card">';
  h += '<div class="qmeta">' + provenanceBadge(q) + '</div>';
  h += sharedStemHtml(q);
  h += '<div class="qtext">' + qBody(q) + '</div>';
  if (!q.options || !q.options.length) {
    h += optionList(q, it.order, S.answers[S.cur], {});
  } else {
    var reveal = (S.mode === 'learn' && S.revealed[S.cur]);
    h += optionList(q, it.order, S.answers[S.cur],
      { showAnswer: reveal, disabled: reveal });
  }
  h += '<div class="btnrow mt">' +
    '<button type="button" class="btn' + (S.marked[S.cur] ? ' primary' : '') +
    '" data-act="markQ">' + (S.marked[S.cur] ? '\u25c9 Marked for review' : '\u25cb Mark for review') + '</button>' +
    bookmarkBtn(q.id) +
    (S.answers[S.cur] !== null && S.mode === 'exam'
      ? '<button type="button" class="btn ghost" data-act="clearAns">Clear response</button>' : '') +
    '</div>';

  if (S.mode === 'learn' && S.revealed[S.cur]) {
    if (q.sourceIssue) {
      h += '<div class="srcissue mt"><b>Source note.</b> ' + E(q.sourceIssue) + '</div>';
    }
    h += '<div class="reveal">' + revealPanes(q, chosenOriginal(S.cur)) + '</div>';
  } else if (S.mode === 'learn') {
    if (!q.isCS) h += '<div class="banner mt">Choose an option to reveal the verdict, the exam shortcut, ' +
      'the tips and the full solution.</div>';
  }
  h += '</div>';

  h += '<div class="btnrow exam-actions">' +
    '<button type="button" class="btn primary" data-act="submitMock">Submit</button>' +
    '<button type="button" class="btn danger" data-act="abandon">Abandon</button>' +
    '</div>';
  h += '</div>';

  /* ---- palette column ---- */
  h += '<div class="exam-side"><div class="card">' +
    '<h3>Question palette</h3><div class="palette">';
  for (var i = 0; i < S.items.length; i++) {
    var c = 'pal';
    var ans = S.answers[i] !== null;
    if (ans && S.marked[i]) c += ' both';
    else if (S.marked[i]) c += ' marked';
    else if (ans) c += ' answered';
    if (i === S.cur) c += ' cur';
    c += ' pal';
    h += '<button type="button" class="' + c + '" data-act="jump" data-i="' + i + '">' +
      (i + 1) + '</button>';
  }
  h += '</div><div class="legend">' +
    '<span><i style="background:var(--ok-bg);border-color:var(--ok-line)"></i>Answered</span>' +
    '<span><i style="background:var(--mark-bg);border-color:var(--mark-line)"></i>Marked</span>' +
    '<span><i style="background:var(--surface-2)"></i>Not visited</span>' +
    '</div>' +
    '<div class="tiny muted mt">Keyboard: 1\u20134 select an option, \u2190 \u2192 move, ' +
    'M marks for review.</div>' +
    '<div class="btnrow pal-actions"><button type="button" class="btn primary" data-act="submitMock">Submit</button>' +
    '<button type="button" class="btn danger" data-act="abandon">Abandon</button></div>' +
    '</div></div>';

  h += '</div>';
  return h;
};

/* --------------------------------------------------------- 8.4 result */
V.result = function () {
  if (!S || !S.result) return V.home();
  var r = S.result;
  var st = Store.d().settings;
  var h = crumb(['Home', S.name, 'Result']);

  if (S.autoSubmitted) {
    h += '<div class="banner info"><b>Time expired.</b> The paper was submitted automatically.</div>';
  }

  h += '<div class="card"><h1>' + E(S.name) + '</h1>' +
    '<p class="card-sub">' + E(S.desc || '') + '</p>' +
    '<div class="kpis">' +
    '<div class="kpi"><div class="v">' + fx(r.score, 2) + ' / ' + r.maxScore + '</div><div class="l">Score</div></div>' +
    '<div class="kpi"><div class="v">' + fx(r.pct, 1) + '%</div><div class="l">Percentage</div></div>' +
    '<div class="kpi ok"><div class="v">' + fx(r.accuracy, 1) + '%</div><div class="l">Accuracy</div></div>' +
    '<div class="kpi"><div class="v">' + humanTime(r.seconds) + '</div><div class="l">Time taken</div></div>' +
    '</div>' +
    '<div class="kpis mt">' +
    '<div class="kpi"><div class="v">' + r.attempted + '</div><div class="l">Attempted</div></div>' +
    '<div class="kpi ok"><div class="v">' + r.correct + '</div><div class="l">Correct</div></div>' +
    '<div class="kpi bad"><div class="v">' + r.incorrect + '</div><div class="l">Incorrect</div></div>' +
    '<div class="kpi warn"><div class="v">' + r.unanswered + '</div><div class="l">Unanswered</div></div>' +
    '</div>';

  h += '<div class="small muted mt">Total questions ' + r.total +
    (r.excluded ? ' \u00b7 ' + r.excluded + ' excluded from scoring (source defect)' : '') +
    ' \u00b7 average time per attempted question ' +
    (r.attempted ? humanTime(r.avgPerAttempt) : '\u2014') +
    ' \u00b7 marking: +' + st.marksCorrect + ' correct, ' +
    (st.negativeMarkingEnabled ? '\u2212' + fx(st.negativeMarkFraction * st.marksCorrect, 3) : '0') +
    ' incorrect, 0 unanswered.</div>';
  h += '<div class="tiny muted mt">The marking scheme and paper duration are configurable ' +
    'settings, not official UPSC values \u2014 the source booklets did not state either.</div>';
  h += '</div>';

  /* per-unit / per-topic breakdown */
  h += breakdownCard(r.perQ, 'unit', 'Performance by unit');
  h += breakdownCard(r.perQ, 'topic', 'Performance by topic');
  h += breakdownCard(r.perQ, 'questionType', 'Performance by question type');
  if (S.kind === 'gk') h += breakdownCard(r.perQ, 'gkTopicLabel', 'Performance by Gupta Kapoor subtopic');
  if (S.kind === 'cs') h += breakdownCard(r.perQ, 'subtopic', 'Performance by chapter');

  /* result palette */
  h += '<div class="card"><h3>Question map</h3><div class="palette">';
  r.perQ.forEach(function (p, i) {
    var c = 'pal ' + (p.status === 'correct' ? 'gcorrect'
      : p.status === 'incorrect' ? 'gwrong' : 'gskip');
    h += '<button type="button" class="' + c + '" data-act="reviewAt" data-i="' + i + '">' +
      (i + 1) + '</button>';
  });
  h += '</div><div class="legend">' +
    '<span><i style="background:var(--ok-bg);border-color:var(--ok-line)"></i>Correct</span>' +
    '<span><i style="background:var(--bad-bg);border-color:var(--bad-line)"></i>Incorrect</span>' +
    '<span><i style="background:var(--surface-3)"></i>Unanswered / not scored</span>' +
    '</div></div>';

  h += '<div class="btnrow mb">' +
    '<button type="button" class="btn primary" data-act="reviewAt" data-i="0">Review all questions</button>' +
    (r.incorrect ? '<button type="button" class="btn" data-act="retryIncorrect">Retry incorrect (' + r.incorrect + ')</button>' : '') +
    (r.unanswered ? '<button type="button" class="btn" data-act="retryUnanswered">Retry unanswered (' + r.unanswered + ')</button>' : '') +
    '<button type="button" class="btn" data-act="retakeSame">Retake this mock</button>' +
    (S.kind === 'cs' ? '<button type="button" class="btn" data-act="go" data-r="cs">Back to Computer</button>' : '') +
    '<button type="button" class="btn ghost" data-act="go" data-r="analytics">Analytics</button>' +
    '<button type="button" class="btn ghost" data-act="go" data-r="home">Home</button>' +
    '</div>';
  return h;
};

function breakdownCard(perQ, field, title) {
  var agg = {};
  perQ.forEach(function (p) {
    var q = BY_ID[p.qid];
    if (!q) return;
    var k = q[field];
    var a = agg[k] || (agg[k] = { n: 0, c: 0, w: 0, s: 0 });
    a.n++;
    if (p.status === 'correct') a.c++;
    else if (p.status === 'incorrect') a.w++;
    else if (p.status === 'unanswered') a.s++;
  });
  var keys = Object.keys(agg).sort(function (a, b) { return agg[b].n - agg[a].n; });
  if (!keys.length) return '';
  var h = '<div class="card"><h3>' + title + '</h3><div class="scrollx"><table class="dt">' +
    '<thead><tr><th>' + (field === 'unit' ? 'Unit' : field === 'topic' ? 'Topic' : field === 'gkTopicLabel' ? 'Subtopic' : field === 'subtopic' ? 'Chapter' : 'Type') +
    '</th><th class="num">Q</th><th class="num">Correct</th><th class="num">Wrong</th>' +
    '<th class="num">Skipped</th><th class="num">Accuracy</th><th style="width:110px">&nbsp;</th></tr></thead><tbody>';
  keys.forEach(function (k) {
    var a = agg[k];
    var acc = pct(a.c, a.c + a.w);
    h += '<tr><td>' + E(k) + '</td><td class="num">' + a.n + '</td><td class="num">' + a.c +
      '</td><td class="num">' + a.w + '</td><td class="num">' + a.s + '</td>' +
      '<td class="num">' + (a.c + a.w ? fx(acc, 0) + '%' : '\u2014') + '</td>' +
      '<td><div class="bar"><i class="' + (acc >= 70 ? 'ok' : acc >= 40 ? 'warn' : 'bad') +
      '" style="width:' + fx(acc, 0) + '%"></i></div></td></tr>';
  });
  return h + '</tbody></table></div></div>';
}

/* --------------------------------------------------------- 8.5 review */
V.review = function () {
  if (!S || !S.result) return V.home();
  var r = S.result;
  var list = r.perQ.map(function (p, i) { return i; });
  if (REVIEW.filter === 'incorrect') list = list.filter(function (i) { return r.perQ[i].status === 'incorrect'; });
  else if (REVIEW.filter === 'correct') list = list.filter(function (i) { return r.perQ[i].status === 'correct'; });
  else if (REVIEW.filter === 'unanswered') list = list.filter(function (i) { return r.perQ[i].status === 'unanswered'; });
  else if (REVIEW.filter === 'marked') list = list.filter(function (i) { return r.perQ[i].marked; });
  if (!list.length) list = [0];

  var pos = list.indexOf(REVIEW.idx);
  if (pos < 0) { REVIEW.idx = list[0]; pos = 0; }

  var p = r.perQ[REVIEW.idx];
  var q = BY_ID[p.qid];
  var it = S.items[REVIEW.idx];

  var h = crumb(['Home', S.name, 'Review']);
  h += '<div class="card"><div class="btnrow mb">';
  [['all', 'All ' + r.perQ.length], ['incorrect', 'Incorrect ' + r.incorrect],
   ['correct', 'Correct ' + r.correct], ['unanswered', 'Unanswered ' + r.unanswered],
   ['marked', 'Marked']].forEach(function (f) {
    h += '<button type="button" class="btn sm' + (REVIEW.filter === f[0] ? ' primary' : '') +
      '" data-act="revFilter" data-f="' + f[0] + '">' + f[1] + '</button>';
  });
  h += '</div>';

  h += '<div class="qmeta">Question ' + (REVIEW.idx + 1) + ' of ' + r.perQ.length +
    ' \u00b7 ' + (pos + 1) + ' of ' + list.length + ' in this filter \u00b7 time spent ' +
    humanTime(p.secs) + '</div>';
  h += qMetaLine(q);
  h += sharedStemHtml(q);
  h += '<div class="qtext">' + qBody(q) + '</div>';
  h += optionList(q, it.order, S.answers[REVIEW.idx], { showAnswer: true, disabled: true });
  h += '<div class="btnrow mt">' + bookmarkBtn(q.id) +
    '<button type="button" class="btn sm" data-act="study" data-qid="' + E(q.id) +
    '" data-back="review">Open as study card</button></div>';
  if (q.sourceIssue) {
    h += '<div class="srcissue mt"><b>Source note.</b> ' + E(q.sourceIssue) + '</div>';
  }
  h += '<div class="reveal">' + revealPanes(q, p.chosen) + '</div>';
  h += '</div>';

  h += '<div class="btnrow mb">' +
    '<button type="button" class="btn" data-act="revStep" data-d="-1"' + (pos === 0 ? ' disabled' : '') + '>&larr; Previous</button>' +
    '<button type="button" class="btn" data-act="revStep" data-d="1"' + (pos === list.length - 1 ? ' disabled' : '') + '>Next &rarr;</button>' +
    '<span style="flex:1"></span>' +
    '<button type="button" class="btn ghost" data-act="go" data-r="result">Back to result</button>' +
    '<button type="button" class="btn ghost" data-act="go" data-r="home">Home</button></div>';

  h += '<div class="card"><h3>Jump to question</h3><div class="palette">';
  r.perQ.forEach(function (pp, i) {
    var c = 'pal ' + (pp.status === 'correct' ? 'gcorrect' : pp.status === 'incorrect' ? 'gwrong' : 'gskip') +
      (i === REVIEW.idx ? ' cur' : '');
    h += '<button type="button" class="' + c + '" data-act="reviewAt" data-i="' + i + '">' + (i + 1) + '</button>';
  });
  h += '</div></div>';
  return h;
};

/* --------------------------------------------------- 8.6 study card */
V.study = function () {
  var q = BY_ID[STUDY.qid];
  if (!q) return V.home();
  var h = crumb(['Home', 'Study card', q.id]);
  h += '<div class="card">';
  h += qMetaLine(q);
  h += sharedStemHtml(q);
  h += '<div class="qtext">' + qBody(q) + '</div>';
  h += optionList(q, (q.options && q.options.length) ? q.options.map(function (x, i) { return i; }) : [0, 1, 2, 3],
    null, { showAnswer: true, disabled: true });
  h += '<div class="btnrow mt">' + bookmarkBtn(q.id) +
    '<button type="button" class="btn sm ghost" data-act="go" data-r="' + E(STUDY.back) + '">Back</button></div>';
  if (q.sourceIssue) h += '<div class="srcissue mt"><b>Source note.</b> ' + E(q.sourceIssue) + '</div>';
  h += '<div class="reveal">' + revealPanes(q, null) + '</div>';
  h += '</div>';
  if (q.isCS) h += '';
  else if (q.isGK) h += '<div class="tiny muted mb">Source: ' + gkSourceLine(q) + '.</div>';
  else h += '<div class="tiny muted mb">Source: ' + E(q.sourceFile) + ' \u00b7 original question number ' +
    q.sourceQuestionNumber + ' of the ' + q.sourceYear + ' paper.</div>';
  return h;
};

/* ------------------------------------------------------ 8.7 analytics */
function historyPerQ() {
  var d = Store.d(), out = [];
  d.history.forEach(function (a) {
    (a.perQ || []).forEach(function (p) {
      if (BY_ID[p.qid]) out.push(p);
    });
  });
  return out;
}

function aggBy(perQ, fn) {
  var agg = {};
  perQ.forEach(function (p) {
    var q = BY_ID[p.qid];
    if (!q) return;
    var k = fn(q);
    var a = agg[k] || (agg[k] = { n: 0, c: 0, w: 0, s: 0, t: 0 });
    a.n++; a.t += p.secs || 0;
    if (p.status === 'correct') a.c++;
    else if (p.status === 'incorrect') a.w++;
    else if (p.status === 'unanswered') a.s++;
  });
  return agg;
}

function aggTable(agg, label, minAttempt) {
  var keys = Object.keys(agg).sort(function (a, b) {
    return pct(agg[b].c, agg[b].c + agg[b].w) - pct(agg[a].c, agg[a].c + agg[a].w);
  });
  if (!keys.length) return '<div class="empty">No data yet.</div>';
  var h = '<div class="scrollx"><table class="dt"><thead><tr><th>' + label +
    '</th><th class="num">Seen</th><th class="num">Correct</th><th class="num">Wrong</th>' +
    '<th class="num">Skipped</th><th class="num">Accuracy</th><th style="width:110px">&nbsp;</th></tr></thead><tbody>';
  keys.forEach(function (k) {
    var a = agg[k], att = a.c + a.w, acc = pct(a.c, att);
    h += '<tr><td>' + E(k) + '</td><td class="num">' + a.n + '</td><td class="num">' + a.c +
      '</td><td class="num">' + a.w + '</td><td class="num">' + a.s + '</td><td class="num">' +
      (att >= (minAttempt || 1) ? fx(acc, 0) + '%' : '\u2014') + '</td>' +
      '<td><div class="bar"><i class="' + (acc >= 70 ? 'ok' : acc >= 40 ? 'warn' : 'bad') +
      '" style="width:' + fx(acc, 0) + '%"></i></div></td></tr>';
  });
  return h + '</tbody></table></div>';
}

function weakAreas(minAttempt) {
  var perQ = historyPerQ();
  var agg = aggBy(perQ, function (q) { return q.unit + ' \u2014 ' + q.topic; });
  var rows = [];
  Object.keys(agg).forEach(function (k) {
    var a = agg[k], att = a.c + a.w;
    if (att >= (minAttempt || 3)) rows.push({ k: k, att: att, acc: pct(a.c, att), a: a });
  });
  rows.sort(function (x, y) { return x.acc - y.acc; });
  return rows;
}

V.analytics = function () {
  var d = Store.d();
  var perQ = historyPerQ();
  var h = crumb(['Home', 'Analytics']);

  if (!d.history.length) {
    return h + '<div class="card"><h1>Analytics</h1><div class="empty">' +
      'No attempts recorded yet. Finish a mock and your performance by year, unit, topic, ' +
      'subtopic and question type will appear here.</div>' +
      '<div class="btnrow"><button class="btn primary" data-act="go" data-r="home">Start a mock</button></div></div>';
  }

  var tot = { n: perQ.length, c: 0, w: 0, s: 0, t: 0 };
  perQ.forEach(function (p) {
    if (p.status === 'correct') tot.c++;
    else if (p.status === 'incorrect') tot.w++;
    else if (p.status === 'unanswered') tot.s++;
    tot.t += p.secs || 0;
  });
  var attempted = tot.c + tot.w;

  h += '<div class="card"><h1>Analytics</h1>' +
    '<p class="card-sub">Across ' + d.history.length + ' recorded attempt(s).</p>' +
    '<div class="kpis">' +
    '<div class="kpi"><div class="v">' + tot.n + '</div><div class="l">Questions seen</div></div>' +
    '<div class="kpi ok"><div class="v">' + fx(pct(tot.c, attempted), 1) + '%</div><div class="l">Overall accuracy</div></div>' +
    '<div class="kpi"><div class="v">' + attempted + '</div><div class="l">Attempted</div></div>' +
    '<div class="kpi warn"><div class="v">' + tot.s + '</div><div class="l">Skipped</div></div>' +
    '</div>' +
    '<div class="small muted mt">Average ' +
    (tot.n ? humanTime(tot.t / tot.n) : '\u2014') + ' per question seen. Unique questions ' +
    'touched: ' + Object.keys(perQ.reduce(function (o, p) { o[p.qid] = 1; return o; }, {})).length +
    ' of ' + META.totalQuestions + '.</div></div>';

  /* weak-area engine */
  var weak = weakAreas(3);
  h += '<div class="card"><h3>Weak-area engine</h3>';
  if (!weak.length) {
    h += '<p class="small muted">Attempt at least three questions in a topic and it will be ' +
      'ranked here.</p>';
  } else {
    var worst = weak[0], best = weak[weak.length - 1];
    h += '<div class="grid g2">';
    h += '<div class="banner" style="background:var(--bad-bg);border-color:var(--bad-line);color:var(--bad)">' +
      '<b>Weakest topic:</b> ' + E(worst.k) + '<br>Accuracy ' + fx(worst.acc, 0) + '% over ' +
      worst.att + ' attempted question(s).<br><b>Recommendation:</b> practise this topic\u2019s PYQs next.</div>';
    h += '<div class="banner" style="background:var(--ok-bg);border-color:var(--ok-line);color:var(--ok)">' +
      '<b>Strongest topic:</b> ' + E(best.k) + '<br>Accuracy ' + fx(best.acc, 0) + '% over ' +
      best.att + ' attempted question(s).</div>';
    h += '</div>';
    h += '<div class="scrollx"><table class="dt"><thead><tr><th>Topic</th><th class="num">Attempted</th>' +
      '<th class="num">Accuracy</th><th style="width:110px">&nbsp;</th></tr></thead><tbody>';
    weak.slice(0, 8).forEach(function (r) {
      h += '<tr><td>' + E(r.k) + '</td><td class="num">' + r.att + '</td><td class="num">' +
        fx(r.acc, 0) + '%</td><td><div class="bar"><i class="' +
        (r.acc >= 70 ? 'ok' : r.acc >= 40 ? 'warn' : 'bad') + '" style="width:' + fx(r.acc, 0) +
        '%"></i></div></td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="btnrow mt"><button type="button" class="btn primary" data-act="practiceWeak">' +
      'Practice My Weak Areas</button></div>';
  }
  h += '</div>';

  /* trends */
  var hist = d.history.slice(0, 15).slice().reverse();
  h += '<div class="card"><h3>Trend across attempts</h3><div class="scrollx"><table class="dt">' +
    '<thead><tr><th>#</th><th>Mock</th><th>When</th><th class="num">Score %</th>' +
    '<th class="num">Accuracy</th><th class="num">Attempted</th><th class="num">Time</th>' +
    '<th style="width:110px">&nbsp;</th></tr></thead><tbody>';
  hist.forEach(function (a, i) {
    h += '<tr><td class="num">' + (i + 1) + '</td><td>' + E(a.name) + '</td><td class="tiny">' +
      dateStr(a.ts) + '</td><td class="num">' + fx(a.pct, 1) + '%</td><td class="num">' +
      fx(a.accuracy, 1) + '%</td><td class="num">' + a.attempted + '/' + a.total +
      '</td><td class="num">' + humanTime(a.seconds) + '</td>' +
      '<td><div class="bar"><i class="' + (a.pct >= 70 ? 'ok' : a.pct >= 40 ? 'warn' : 'bad') +
      '" style="width:' + fx(Math.max(0, Math.min(100, a.pct)), 0) + '%"></i></div></td></tr>';
  });
  h += '</tbody></table></div></div>';

  h += '<div class="card"><h3>By unit</h3>' + aggTable(aggBy(perQ, function (q) { return q.unit; }), 'Unit') + '</div>';
  h += '<div class="card"><h3>By year</h3>' + aggTable(aggBy(perQ, function (q) { return String(q.year); }), 'Year') + '</div>';
  h += '<div class="card"><h3>By topic</h3>' + aggTable(aggBy(perQ, function (q) { return q.topic; }), 'Topic') + '</div>';
  h += '<div class="card"><h3>By subtopic (syllabus concept)</h3>' +
    aggTable(aggBy(perQ, function (q) { return q.subtopic; }), 'Subtopic') + '</div>';
  h += '<div class="card"><h3>By question type</h3>' +
    aggTable(aggBy(perQ, function (q) { return q.questionType; }), 'Type') + '</div>';
  return h;
};

/* -------------------------------------------------------- 8.8 history */
V.history = function () {
  var d = Store.d();
  var h = crumb(['Home', 'Attempt history']);
  h += '<div class="card"><h1>Attempt history</h1>';
  if (!d.history.length) {
    h += '<div class="empty">Nothing yet. Submit a mock and it will be listed here.</div></div>';
    return h;
  }
  var byName = {};
  d.history.forEach(function (a) { (byName[a.name] = byName[a.name] || []).push(a); });

  h += '<div class="scrollx"><table class="dt"><thead><tr><th>Mock</th><th>Mode</th><th>When</th>' +
    '<th class="num">Score</th><th class="num">%</th><th class="num">Acc.</th>' +
    '<th class="num">C</th><th class="num">W</th><th class="num">U</th><th class="num">Time</th></tr></thead><tbody>';
  d.history.forEach(function (a) {
    h += '<tr><td>' + E(a.name) + '</td><td class="tiny">' + (a.mode === 'exam' ? 'Exam' : 'Learning') +
      '</td><td class="tiny">' + dateStr(a.ts) + '</td>' +
      '<td class="num">' + fx(a.score, 2) + '/' + a.maxScore + '</td>' +
      '<td class="num">' + fx(a.pct, 1) + '</td><td class="num">' + fx(a.accuracy, 1) + '</td>' +
      '<td class="num">' + a.correct + '</td><td class="num">' + a.incorrect + '</td>' +
      '<td class="num">' + a.unanswered + '</td><td class="num">' + humanTime(a.seconds) + '</td></tr>';
  });
  h += '</tbody></table></div></div>';

  h += '<div class="card"><h3>Progress on repeated mocks</h3>';
  var any = false;
  Object.keys(byName).forEach(function (n) {
    var arr = byName[n];
    if (arr.length < 2) return;
    any = true;
    h += '<div class="mb"><b>' + E(n) + '</b><ul class="small" style="margin:6px 0 0;padding-left:20px">';
    arr.slice().reverse().forEach(function (a, i) {
      h += '<li>Attempt ' + (i + 1) + ': ' + fx(a.pct, 1) + '% \u00b7 accuracy ' +
        fx(a.accuracy, 1) + '% \u00b7 ' + dateStr(a.ts) + '</li>';
    });
    h += '</ul></div>';
  });
  if (!any) h += '<p class="small muted">Take the same mock more than once to see a progress line here.</p>';
  h += '</div>';

  h += '<div class="btnrow mb"><button type="button" class="btn danger" data-act="resetHistory">Clear attempt history</button></div>';
  return h;
};

/* ------------------------------------------------------ 8.9 bookmarks */
V.bookmarks = function () {
  var d = Store.d();
  var ids = Object.keys(d.bookmarks).filter(function (i) { return BY_ID[i]; });
  ids.sort(function (a, b) { return d.bookmarks[b] - d.bookmarks[a]; });
  var h = crumb(['Home', 'My bookmarks']);
  h += '<div class="card"><h1>My bookmarks</h1>' +
    '<p class="card-sub">' + ids.length + ' question(s) flagged.</p>';
  if (!ids.length) {
    h += '<div class="empty">No bookmarks yet. Use the \u2606 Bookmark button on any question.</div></div>';
    return h;
  }
  h += '<div class="btnrow mb">' +
    '<button type="button" class="btn primary" data-act="practiceIds" data-src="bookmarks">' +
    'Practise these ' + ids.length + ' question(s)</button>' +
    '<button type="button" class="btn danger" data-act="resetBookmarks">Clear all bookmarks</button></div>';
  h += '<label class="f"><span>Filter</span><input type="search" id="bmq" placeholder="year, unit, topic or text\u2026" value="' +
    E(SEARCH.q) + '" data-act="bmFilter"></label>';
  var qq = SEARCH.q.toLowerCase();
  h += '<ul class="list">';
  ids.forEach(function (id) {
    var q = BY_ID[id];
    var idx = ALL.indexOf(q);
    if (qq && SEARCH_INDEX[idx].indexOf(qq) < 0) return;
    h += bmRow(q);
  });
  h += '</ul></div>';
  return h;
};

function bmRow(q) {
  return '<li><div class="top"><span class="id">' + E(q.id) + '</span>' +
    '<span class="chip">' + E(META.taxonomy[q.unit].short) + '</span>' +
    '<span class="chip">' + E(q.topic) + '</span></div>' +
    '<div class="small">' + qBody(q) + '</div>' +
    '<div class="btnrow mt"><button type="button" class="btn sm" data-act="study" data-qid="' +
    E(q.id) + '" data-back="bookmarks">Open study card</button>' +
    '<button type="button" class="btn sm ghost" data-act="bookmark" data-qid="' + E(q.id) +
    '">Remove bookmark</button></div></li>';
}

/* ------------------------------------------------------- 8.10 mistakes */
V.mistakes = function () {
  var d = Store.d();
  var mis = Object.keys(d.mistakes).filter(function (i) { return BY_ID[i]; });
  var skp = Object.keys(d.skipped).filter(function (i) { return BY_ID[i]; });
  mis.sort(function (a, b) { return d.mistakes[b].c - d.mistakes[a].c; });

  var h = crumb(['Home', 'Practice my mistakes']);
  h += '<div class="card"><h1>Mistake bank</h1>' +
    '<p class="card-sub">Questions you answered incorrectly stay here until you get them right. ' +
    'Questions you skipped are tracked separately.</p>' +
    '<div class="kpis">' +
    '<div class="kpi bad"><div class="v">' + mis.length + '</div><div class="l">Incorrect</div></div>' +
    '<div class="kpi warn"><div class="v">' + skp.length + '</div><div class="l">Skipped</div></div>' +
    '<div class="kpi"><div class="v">' + Object.keys(d.bookmarks).length + '</div><div class="l">Bookmarked</div></div>' +
    '<div class="kpi"><div class="v">' + d.history.length + '</div><div class="l">Attempts</div></div>' +
    '</div>';
  h += '<div class="btnrow mt">' +
    (mis.length ? '<button type="button" class="btn primary" data-act="practiceIds" data-src="mistakes">Retry incorrect (' + mis.length + ')</button>' : '') +
    (skp.length ? '<button type="button" class="btn" data-act="practiceIds" data-src="skipped">Retry unanswered (' + skp.length + ')</button>' : '') +
    (mis.length + skp.length ? '<button type="button" class="btn" data-act="practiceIds" data-src="both">Practise all (' + (mis.length + skp.length) + ')</button>' : '') +
    (mis.length + skp.length ? '<button type="button" class="btn danger" data-act="resetMistakes">Clear mistake bank</button>' : '') +
    '</div>';
  if (!mis.length && !skp.length) {
    h += '<div class="empty">Nothing here yet \u2014 submit a mock and any question you get ' +
      'wrong or leave blank will be collected automatically.</div>';
  }
  h += '</div>';

  if (mis.length) {
    h += '<div class="card"><h3>Incorrect (' + mis.length + ')</h3><ul class="list">';
    mis.slice(0, 60).forEach(function (id) {
      var q = BY_ID[id];
      h += '<li><div class="top"><span class="id">' + E(q.id) + '</span>' +
        '<span class="chip bad">missed ' + d.mistakes[id].c + '\u00d7</span>' +
        '<span class="chip">' + E(q.topic) + '</span></div>' +
        '<div class="small">' + qBody(q) + '</div>' +
        '<div class="btnrow mt"><button type="button" class="btn sm" data-act="study" data-qid="' +
        E(q.id) + '" data-back="mistakes">Open study card</button></div></li>';
    });
    if (mis.length > 60) h += '<li class="muted small">\u2026 and ' + (mis.length - 60) + ' more.</li>';
    h += '</ul></div>';
  }
  if (skp.length) {
    h += '<div class="card"><h3>Skipped (' + skp.length + ')</h3><ul class="list">';
    skp.slice(0, 40).forEach(function (id) {
      var q = BY_ID[id];
      h += '<li><div class="top"><span class="id">' + E(q.id) + '</span>' +
        '<span class="chip warn">skipped ' + d.skipped[id].c + '\u00d7</span>' +
        '<span class="chip">' + E(q.topic) + '</span></div>' +
        '<div class="small">' + qBody(q) + '</div>' +
        '<div class="btnrow mt"><button type="button" class="btn sm" data-act="study" data-qid="' +
        E(q.id) + '" data-back="mistakes">Open study card</button></div></li>';
    });
    if (skp.length > 40) h += '<li class="muted small">\u2026 and ' + (skp.length - 40) + ' more.</li>';
    h += '</ul></div>';
  }
  return h;
};

/* --------------------------------------------------------- 8.11 search */
V.search = function () {
  var h = crumb(['Home', 'Search']);
  h += '<div class="card"><h1>Search the question bank</h1>' +
    '<p class="card-sub">Searches question text, options, year, unit, topic, subtopic and ' +
    'question id across all ' + META.totalQuestions + ' authentic PYQs' +
    (GMETA ? ', the ' + GMETA.total + ' Gupta Kapoor textbook problems' : '') +
    (CMETA ? ', the ' + CMETA.total + ' Computer questions' : '') +
    (FMETA ? ' and all ' + FMETA.total + ' forecast problems. Forecast hits carry the ' +
      'FORECAST badge and are never mixed into a PYQ mock.' : '.') + '</p>';
  h += '<label class="f"><span>Query</span><input type="search" id="sq" autocomplete="off" ' +
    'placeholder="Bayes, 2023, Regression, Runge-Kutta, 2026-Q12\u2026" value="' + E(SEARCH.q) +
    '" data-act="searchInput"></label>';
  h += '<div class="grid ' + (FMETA ? 'g3' : 'g2') + '">';
  h += '<label class="f"><span>Unit</span><select data-act="searchUnit"><option value="">All units</option>';
  META.units.forEach(function (u) {
    h += '<option value="' + E(u) + '"' + (SEARCH.unit === u ? ' selected' : '') + '>' + E(u) + '</option>';
  });
  h += '</select></label>';
  h += '<label class="f"><span>Year</span><select data-act="searchYear"><option value="">All years</option>';
  META.years.forEach(function (y) {
    h += '<option value="' + y + '"' + (SEARCH.year == y ? ' selected' : '') + '>' + y + '</option>';
  });
  h += '</select></label>';
  if (FMETA) {
    h += '<label class="f"><span>Bank</span><select data-act="searchBank">' +
      '<option value=""' + (SEARCH.bank ? '' : ' selected') + '>All banks</option>' +
      '<option value="pyq"' + (SEARCH.bank === 'pyq' ? ' selected' : '') +
        '>Authentic PYQs only</option>' +
      '<option value="fc"' + (SEARCH.bank === 'fc' ? ' selected' : '') +
        '>Forecast (AI-generated) only</option>' +
      (GMETA ? '<option value="gk"' + (SEARCH.bank === 'gk' ? ' selected' : '') +
        '>Gupta Kapoor (Ch 5\u20138) only</option>' : '') +
      (CMETA ? '<option value="cs"' + (SEARCH.bank === 'cs' ? ' selected' : '') +
        '>Computer only</option>' : '') + '</select></label>';
  }
  h += '</div>';

  var qq = SEARCH.q.trim().toLowerCase();
  var terms = qq ? qq.split(/\s+/) : [];
  var hits = [];
  for (var i = 0; i < ALL.length; i++) {
    var q = ALL[i];
    if (SEARCH.bank === 'pyq' && (q.isForecast || q.isGK || q.isCS)) continue;
    if (SEARCH.bank === 'cs' && !q.isCS) continue;
    if (SEARCH.bank === 'fc' && !q.isForecast) continue;
    if (SEARCH.bank === 'gk' && !q.isGK) continue;
    if (SEARCH.unit && q.unit !== SEARCH.unit) continue;
    if (SEARCH.year && !q.isForecast && String(q.year) !== String(SEARCH.year)) continue;
    if (SEARCH.year && q.isForecast) continue;
    var idx = SEARCH_INDEX[i], ok = true;
    for (var t = 0; t < terms.length; t++) {
      if (idx.indexOf(terms[t]) < 0) { ok = false; break; }
    }
    if (ok) hits.push(q);
  }
  h += '<div class="small muted mb">' + hits.length + ' match(es).' +
    (hits.length ? ' <button type="button" class="btn sm" data-act="practiceSearch">' +
      'Practise these ' + Math.min(hits.length, 200) + '</button>' : '') + '</div>';
  h += '<ul class="list">';
  hits.slice(0, 60).forEach(function (q) {
    h += '<li><div class="top">' +
      (q.isForecast ? '<span class="fc-badge">FORECAST</span>' : '') +
      (q.isGK ? '<span class="gk-badge">GUPTA KAPOOR</span>' : '') +
      (q.isCS ? '<span class="cs-badge">COMPUTER</span>' : '') +
      '<span class="id">' + E(q.id) + '</span>' +
      '<span class="chip">' + E(META.taxonomy[q.unit] ? META.taxonomy[q.unit].short : q.unit) + '</span>' +
      '<span class="chip">' + E(q.topic) + '</span>' +
      '<span class="chip">' + E(q.subtopic) + '</span></div>' +
      '<div class="small">' + qBody(q) + '</div>' +
      '<div class="btnrow mt"><button type="button" class="btn sm" data-act="study" data-qid="' +
      E(q.id) + '" data-back="search">Open study card</button>' + bookmarkBtn(q.id) + '</div></li>';
  });
  h += '</ul>';
  if (hits.length > 60) h += '<div class="muted small">Showing the first 60 of ' + hits.length + '.</div>';
  h += '</div>';
  return h;
};

/* ------------------------------------------------------- 8.12 settings */
V.settings = function () {
  var d = Store.d(), st = d.settings;
  var h = crumb(['Home', 'Settings & data']);
  h += '<div class="card"><h1>Settings</h1>';
  h += '<div class="banner info"><b>No official marking scheme was supplied.</b> The nine source ' +
    'booklets in this build did not state a marking scheme or a paper duration, so nothing below ' +
    'is presented as official. Set the values your own preparation uses.</div>';
  h += '<div class="grid g2">';
  h += '<label class="f"><span>Marks per correct answer</span>' +
    '<input type="number" step="0.25" min="0" value="' + st.marksCorrect + '" data-act="setCfg" data-k="marksCorrect"></label>';
  h += '<label class="f"><span>Negative marking fraction of a correct mark</span>' +
    '<input type="number" step="0.0001" min="0" max="1" value="' + st.negativeMarkFraction +
    '" data-act="setCfg" data-k="negativeMarkFraction"></label>';
  h += '<label class="f"><span>Minutes per question (auto timer)</span>' +
    '<input type="number" step="0.1" min="0.1" value="' + st.minutesPerQuestion +
    '" data-act="setCfg" data-k="minutesPerQuestion"></label>';
  h += '<label class="f"><span>Full-paper minutes (80 questions)</span>' +
    '<input type="number" step="1" min="1" value="' + st.fullPaperMinutes +
    '" data-act="setCfg" data-k="fullPaperMinutes"></label>';
  h += '</div>';
  h += '<label class="f"><span>Behaviour</span><div class="checks">' +
    '<label><input type="checkbox" data-act="setCfgBool" data-k="negativeMarkingEnabled"' +
    (st.negativeMarkingEnabled ? ' checked' : '') + '> Apply negative marking</label>' +
    '<label><input type="checkbox" data-act="setCfgBool" data-k="timerOn"' +
    (st.timerOn ? ' checked' : '') + '> Timed mocks by default</label>' +
    '</div></label>';
  h += '<label class="f"><span>Default mode</span><div class="checks">' +
    '<label><input type="radio" name="dmode" data-act="setDefMode" value="exam"' +
    (st.defaultMode === 'exam' ? ' checked' : '') + '> Strict Exam</label>' +
    '<label><input type="radio" name="dmode" data-act="setDefMode" value="learn"' +
    (st.defaultMode === 'learn' ? ' checked' : '') + '> Learning</label></div></label>';
  h += '</div>';

  h += '<div class="card"><h3>Export / import progress</h3>' +
    '<p class="small muted">Everything is stored in this browser only. Export writes a plain ' +
    'JSON file you can copy to another device; import replaces the current data.</p>' +
    '<div class="btnrow mb">' +
    '<button type="button" class="btn primary" data-act="exportData">Download progress JSON</button>' +
    '<button type="button" class="btn" data-act="showExport">Show JSON to copy</button>' +
    '<label class="btn" style="cursor:pointer">Import from file' +
    '<input type="file" accept="application/json,.json" style="display:none" data-act="importFile"></label>' +
    '</div>' +
    '<label class="f"><span>Or paste exported JSON here and import</span>' +
    '<textarea id="importbox" rows="5" style="width:100%;font-family:var(--font-mono);font-size:.8rem;' +
    'border:1px solid var(--line-2);border-radius:var(--r-s);padding:8px;background:var(--surface);' +
    'color:var(--ink)"></textarea></label>' +
    '<div class="btnrow"><button type="button" class="btn" data-act="importText">Import pasted JSON</button></div>' +
    '</div>';

  h += '<div class="card"><h3>Reset</h3><div class="btnrow">' +
    '<button type="button" class="btn danger" data-act="resetHistory">Reset attempt history</button>' +
    '<button type="button" class="btn danger" data-act="resetMistakes">Reset mistake bank</button>' +
    '<button type="button" class="btn danger" data-act="resetBookmarks">Reset bookmarks</button>' +
    '<button type="button" class="btn danger" data-act="resetAll">Reset everything</button>' +
    '</div></div>';

  h += '<div class="card"><h3>About this build</h3><div class="small">' +
    '<p><b>Dataset:</b> ' + META.totalQuestions + ' authentic PYQs, ' + META.years.length +
    ' papers, version ' + E(META.datasetVersion) + '.</p>';
  Object.keys(META.provenance).forEach(function (k) {
    h += '<p><b>' + E(k) + ':</b> ' + E(META.provenance[k]) + '</p>';
  });
  h += '<p><b>Offline:</b> this application makes no network request of any kind. There is no ' +
    'CDN, no API, no server, no external font and no external library. It runs from ' +
    '<code>file://</code> by opening <code>index.html</code>.</p></div></div>';
  return h;
};

/* ---------------------------------------------------------- 8.13 audit */
V.audit = function () {
  var h = crumb(['Home', 'Data audit']);
  h += '<div class="card"><h1>Data audit</h1>' +
    '<p class="card-sub">Validation runs automatically every time the application loads.</p>';
  h += '<div class="kpis">' +
    '<div class="kpi"><div class="v">' + AUDIT.total + '</div><div class="l">Total questions</div></div>' +
    '<div class="kpi ' + (AUDIT.ok ? 'ok' : 'bad') + '"><div class="v">' + AUDIT.errors.length +
    '</div><div class="l">Errors</div></div>' +
    '<div class="kpi warn"><div class="v">' + AUDIT.warnings.length + '</div><div class="l">Warnings</div></div>' +
    '<div class="kpi"><div class="v">' + AUDIT.sourceIssues + '</div><div class="l">Source issues</div></div>' +
    '</div></div>';

  h += '<div class="card"><h3>Counts</h3><div class="scrollx"><table class="dt">' +
    '<thead><tr><th>Year</th><th class="num">Questions</th><th>Source file</th></tr></thead><tbody>';
  META.years.forEach(function (y) {
    h += '<tr><td>' + y + '</td><td class="num">' + (AUDIT.perYear[y] || 0) + '</td><td class="tiny">' +
      E(META.sourceFiles[y]) + '</td></tr>';
  });
  h += '<tr><td><b>TOTAL</b></td><td class="num"><b>' + AUDIT.total + '</b></td><td>9 papers</td></tr>';
  h += '</tbody></table></div>';

  h += '<div class="scrollx mt"><table class="dt"><thead><tr><th>Check</th><th class="num">Count</th></tr></thead><tbody>' +
    row2('Duplicate ids', AUDIT.duplicateIds) +
    row2('Duplicate / near-duplicate question text', AUDIT.duplicateText) +
    row2('Missing options', AUDIT.missingOptions) +
    row2('Missing answers', AUDIT.missingAnswers) +
    row2('Missing solutions', AUDIT.missingSolutions) +
    row2('Missing exam shortcuts', AUDIT.missingShortcuts) +
    row2('Missing tips', AUDIT.missingTips) +
    row2('Classification issues', AUDIT.classificationIssues) +
    row2('Mathematical-notation warnings', AUDIT.mathIssues) +
    row2('Source issues flagged and preserved', AUDIT.sourceIssues) +
    row2('Distinct topics', AUDIT.topics) +
    row2('Distinct subtopics', AUDIT.subtopics) +
    '</tbody></table></div></div>';

  if (GMETA) {
    h += '<div class="card"><h3>Gupta Kapoor textbook bank</h3><p class="small">' + GK_AUDIT.total +
      ' problems, kept apart from the PYQs above \u00b7 ' + (GK_AUDIT.ok ? 'all structural checks passed'
      : GK_AUDIT.errors.length + ' error(s)') + '.</p>' + (GK_AUDIT.errors.length ? '<ul class="small">' +
      GK_AUDIT.errors.slice(0, 50).map(function (e) { return '<li>' + E(e) + '</li>'; }).join('') + '</ul>' : '') +
      '</div>';
  }

  if (CMETA) {
    h += '<div class="card"><h3>Computer bank</h3><p class="small">' + CS_AUDIT.total +
      ' questions in ' + CMETA.nSets + ' sets across ' + CMETA.chapters.length + ' chapters, kept apart from the PYQs above \u00b7 ' +
      (CS_AUDIT.ok ? 'all structural checks passed'
      : CS_AUDIT.errors.length + ' error(s)') + '.</p>' + (CS_AUDIT.errors.length ? '<ul class="small">' +
      CS_AUDIT.errors.slice(0, 50).map(function (e) { return '<li>' + E(e) + '</li>'; }).join('') + '</ul>' : '') +
      '</div>';
  }

  var flagged = DATA.filter(function (q) { return q.sourceIssue; });
  h += '<div class="card"><h3>Flagged source issues (' + flagged.length + ')</h3>' +
    '<p class="small muted">These are defects in the printed source papers. Nothing has been ' +
    'silently rewritten: the stem and options are reproduced exactly as printed and the problem ' +
    'is recorded here and on the question itself. Items with no valid option are excluded from ' +
    'scoring.</p><ul class="list">';
  flagged.forEach(function (q) {
    h += '<li><div class="top"><span class="id">' + E(q.id) + '</span>' +
      '<span class="chip">' + E(q.unit) + '</span>' +
      (scorable(q) ? '<span class="chip warn">keyed with caveat</span>'
                   : '<span class="chip bad">not scored</span>') + '</div>' +
      '<div class="small">' + E(q.sourceIssue) + '</div>' +
      '<div class="btnrow mt"><button type="button" class="btn sm" data-act="study" data-qid="' +
      E(q.id) + '" data-back="audit">Open study card</button></div></li>';
  });
  h += '</ul></div>';

  if (AUDIT.errors.length) {
    h += '<div class="card"><h3>Errors</h3><ul class="small">';
    AUDIT.errors.slice(0, 200).forEach(function (e) { h += '<li>' + E(e) + '</li>'; });
    h += '</ul></div>';
  }
  if (AUDIT.warnings.length) {
    h += '<div class="card"><h3>Warnings</h3><ul class="small">';
    AUDIT.warnings.slice(0, 200).forEach(function (e) { h += '<li>' + E(e) + '</li>'; });
    h += '</ul></div>';
  }
  return h;
};

function row2(a, b) {
  return '<tr><td>' + a + '</td><td class="num">' + b + '</td></tr>';
}

/* GK-JS-BEGIN */
/* ======================================================================
   GK.  GUPTA & KAPOOR  —  Chapters 5–8 textbook problem bank
   Injected by ch5-8-dashboard-src/integrate.py; edit it there, not here.
   The bank lives in window.gkData / window.gkMeta and is kept apart from
   the authentic PYQs: it never enters a year, sectional, topic, subtopic
   or custom mock, and the PYQ data audit ignores it.
   ====================================================================== */
var GK = { ch: 0, t: '', diff: 0, pick: {}, open: {} };
var GK_BY_TOPIC = {};
GDATA.forEach(function (q) { (GK_BY_TOPIC[q.gkTopic] = GK_BY_TOPIC[q.gkTopic] || []).push(q); });
var GK_DIFF = ['', 'Foundation', 'Exam-level', 'Elite'];

/* question body shared by every screen: the stem, then (for multiple-
   statement items) the numbered statements and the closing question */
function qBody(q) {
  if (q.isCS) return csBody(q);
  var h = R(q.question);
  if (q.stmts && q.stmts.length) {
    h += '<ol class="stmts">';
    q.stmts.forEach(function (s) { h += '<li>' + R(s) + '</li>'; });
    h += '</ol>';
    if (q.ask) h += '<div class="ask">' + R(q.ask) + '</div>';
  }
  return h;
}

function gkChapter(num) {
  var out = null;
  (GMETA ? GMETA.chapters : []).forEach(function (c) { if (c.num === +num) out = c; });
  return out;
}

function gkTopic(code) {
  var out = null;
  (GMETA ? GMETA.chapters : []).forEach(function (c) {
    c.topics.forEach(function (t) { if (t.code === code) out = t; });
  });
  return out;
}

function gkRelatedPyqs(tm) {
  return DATA.filter(function (q) {
    return tm.relCodes.indexOf(q.topicCode) >= 0 || tm.relSubs.indexOf(q.subtopic) >= 0;
  });
}

function gkSourceLine(q) {
  return 'Gupta &amp; Kapoor, <i>Fundamentals of Mathematical Statistics</i>, Chapter ' +
    q.gkChapter + ', §' + E(q.gkSection) + ', p. ' + E(q.gkPage) + ' · subtopic ' +
    E(q.gkTopic) + ' ' + E(q.gkTopicTitle);
}

/* reveal order for the textbook bank:
   verdict -> Step-by-Step Solution -> Exam Shortcut -> Tips & Tricks */
function gkRevealPanes(q, chosen, opts) {
  opts = opts || {};
  if (ROUTE.name === 'study') opts.peek = true;     /* study card: show the key, no verdict */
  var h = '';
  var answered = chosen !== null && chosen !== undefined;
  var ok = answered && chosen === q.correctAnswer;
  var cls = !answered ? (opts.peek ? 'verdict-ok' : 'verdict-skip') : (ok ? 'verdict-ok' : 'verdict-bad');
  var verdict = !answered ? (opts.peek ? 'Answer' : 'Not answered') : (ok ? 'Correct' : 'Incorrect');
  h += '<div class="pane ' + cls + '"><div class="hd"><span class="step">1</span>' + E(verdict) +
    '</div><div class="bd">';
  if (!opts.peek) {
    h += '<div class="small"><b>Your answer:</b> ' +
      (answered ? '(' + LET[chosen] + ') ' + R(q.options[chosen])
                : '<span class="muted">not attempted</span>') + '</div>';
  }
  h += '<div class="small' + (opts.peek ? '' : ' mt') + '"><b>Correct answer:</b> (' +
    LET[q.correctAnswer] + ') ' + R(q.options[q.correctAnswer]) + '</div>';
  h += '</div></div>';

  var note = '<div class="ai-note">Gupta &amp; Kapoor practice problem written for this ' +
    'dashboard (not a previous-year question). ' + (q.gkVerified
      ? 'The key is confirmed by an exact or numerical computation.'
      : 'The key is checked by hand against the stated theorem or definition.') + '</div>';

  h += '<div class="pane"><div class="hd"><span class="step">2</span>Step-by-Step Solution</div>' +
    '<div class="bd"><ol>';
  (q.solution || []).forEach(function (s) { h += '<li>' + R(s.text) + '</li>'; });
  h += '</ol></div></div>';

  h += '<div class="pane"><div class="hd"><span class="step">3</span>Exam Shortcut ' +
    '<span class="chip">~30 sec</span></div><div class="bd">' + R(q.examShortcut) + '</div></div>';

  h += '<div class="pane"><div class="hd"><span class="step">4</span>Tips &amp; Tricks</div>' +
    '<div class="bd"><ul>';
  (q.tipsTricks || []).forEach(function (t) { h += '<li>' + R(t) + '</li>'; });
  h += '</ul>' + note + '</div></div>';

  if (opts.topic !== false) {
    var tm = gkTopic(q.gkTopic);
    h += '<div class="pane"><div class="hd">Source &amp; syllabus</div><div class="bd small">' +
      '<p>' + gkSourceLine(q) + '</p>' +
      (tm ? '<p><b>Syllabus.</b> ' + E(tm.unit) + ' › ' + E(tm.topicCode) + ' ' +
        E(tm.pyqTopic) + ' › ' + E(tm.subtopic) + '</p>' : '') + '</div></div>';
  }
  return h;
}

function gkOptionList(q, pick) {
  var done = pick !== undefined && pick !== null;
  var h = '<ul class="opts">';
  for (var i = 0; i < q.options.length; i++) {
    var cls = 'opt';
    if (done) {
      if (i === q.correctAnswer) cls += ' correct';
      else if (i === pick) cls += ' wrong';
    }
    h += '<li><button type="button" class="' + cls + '"' + (done ? ' disabled' : '') +
      ' data-act="gkOpt" data-qid="' + E(q.id) + '" data-i="' + i + '">' +
      '<span class="k">' + LET[i] + '</span><span class="v">' + R(q.options[i]) + '</span></button></li>';
  }
  return h + '</ul>';
}

function gkItem(q, n) {
  var pick = GK.pick.hasOwnProperty(q.id) ? GK.pick[q.id] : null;
  var open = pick !== null || !!GK.open[q.id];
  var h = '<li class="gk-item" id="gk-' + E(q.id.replace(/[^A-Za-z0-9-]/g, '-')) + '">' +
    '<div class="top"><span class="gk-n">' + n + '</span><span class="id">' + E(q.id) + '</span>' +
    '<span class="chip' + (q.difficulty === 'Elite' ? ' mark' : q.difficulty === 'Foundation' ? '' : ' brand') +
    '">' + E(q.difficulty) + '</span>' +
    '<span class="chip">' + E(q.questionType) + '</span>' +
    '<span class="chip">§' + E(q.gkSection) + ' · p. ' + E(q.gkPage) + '</span>' +
    (q.gkVerified ? '<span class="chip ok" title="Answer confirmed by an exact or numerical computation">computed ✓</span>' : '') +
    '</div>' +
    '<div class="qtext">' + qBody(q) + '</div>' + gkOptionList(q, pick) +
    '<div class="btnrow">' +
    (open ? '<button type="button" class="btn sm" data-act="gkHide" data-qid="' + E(q.id) + '">' +
            (pick !== null ? 'Try again' : 'Hide solution') + '</button>'
          : '<button type="button" class="btn sm" data-act="gkShow" data-qid="' + E(q.id) + '">Show solution</button>') +
    bookmarkBtn(q.id) +
    '<button type="button" class="btn sm ghost" data-act="study" data-qid="' + E(q.id) +
    '" data-back="gk">Study card</button></div>';
  if (open) {
    h += '<div class="reveal">' + gkRevealPanes(q, pick, { peek: pick === null, topic: false }) + '</div>';
  }
  return h + '</li>';
}

function gkSheetBlock(b) {
  if (b.t === 'p') return '<p>' + R(b.text) + '</p>';
  if (b.t === 'ul') {
    return '<ul>' + b.items.map(function (x) { return '<li>' + R(x) + '</li>'; }).join('') + '</ul>';
  }
  if (b.t === 'table') {
    var h = '<div class="scrollx"><table class="dt gk-dt">';
    if (b.head && b.head.length) {
      h += '<thead><tr>' + b.head.map(function (c) { return '<th>' + R(c) + '</th>'; }).join('') + '</tr></thead>';
    }
    h += '<tbody>' + b.rows.map(function (r) {
      return '<tr>' + r.map(function (c) { return '<td>' + R(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
    return h;
  }
  return '';
}

function gkSheetView(ch) {
  var sheets = GMETA.sheets.filter(function (s) { return s.ch === ch.num; });
  var h = '<div class="card"><h2>Key results &mdash; Chapter ' + ch.num + '</h2>' +
    '<p class="card-sub">Theorems, remarks and formulas of ' + E(ch.title) + ' that the ' +
    'objective paper draws on, with the one-line shortcuts used in the solutions.</p></div>';
  h += '<div class="grid g2 gk-sheets">';
  sheets.forEach(function (s) {
    h += '<div class="card gk-sheet"><h3>' + E(s.title) + '</h3><div class="sheet-body">' +
      s.blocks.map(gkSheetBlock).join('') + '</div></div>';
  });
  return h + '</div>';
}

function gkTopicView(ch, tm) {
  var qs = GK_BY_TOPIC[tm.code] || [];
  var shown = GK.diff ? qs.filter(function (q) { return q.difficultyLevel === GK.diff; }) : qs;
  var rel = gkRelatedPyqs(tm);
  var h = '<div class="card gk-topic">' +
    '<h2><span class="gk-code">' + E(tm.code) + '</span> ' + E(tm.title) + '</h2>' +
    '<p class="small"><b>Syllabus link:</b> ' + E(tm.unit) + ' › ' + E(tm.topicCode) + ' ' +
    E(tm.pyqTopic) + ' › ' + E(tm.subtopic) + '</p>' +
    '<p class="small muted">“' + E(tm.syllabus) + '”</p>' +
    '<div class="btnrow">' +
    '<button type="button" class="btn primary" data-act="gkPractice" data-scope="topic" data-mode="learn">' +
      'Practise ' + qs.length + ' (Learning)</button>' +
    '<button type="button" class="btn" data-act="gkPractice" data-scope="topic" data-mode="exam">Strict Exam</button>' +
    (rel.length ? '<button type="button" class="btn ghost" data-act="gkPyq">Related PYQs (' + rel.length + ')</button>' : '') +
    '</div>' +
    '<div class="btnrow mt gk-filter">';
  [0, 1, 2, 3].forEach(function (d) {
    var n = d ? qs.filter(function (q) { return q.difficultyLevel === d; }).length : qs.length;
    h += '<button type="button" class="btn sm' + (GK.diff === d ? ' primary' : '') +
      '" data-act="gkDiff" data-d="' + d + '"' + (n ? '' : ' disabled') + '>' +
      (d ? GK_DIFF[d] : 'All') + ' ' + n + '</button>';
  });
  h += '</div></div>';
  if (!shown.length) return h + '<div class="empty">No problems at this level.</div>';
  h += '<ul class="list gk-list">';
  shown.forEach(function (q, i) { h += gkItem(q, i + 1); });
  return h + '</ul>';
}

V.gk = function () {
  var h = crumb(['Home', 'Gupta Kapoor']);
  if (!GMETA || !GDATA.length) {
    return h + '<div class="card"><h1>Gupta Kapoor bank not loaded</h1></div>';
  }
  var ch = gkChapter(GK.ch) || GMETA.chapters[0];
  GK.ch = ch.num;
  var tm = GK.t === 'sheet' ? null : gkTopic(GK.t);
  if (GK.t !== 'sheet' && (!tm || tm.ch !== ch.num)) { tm = ch.topics[0]; GK.t = tm.code; }

  h = crumb(['Home', 'Gupta Kapoor', 'Chapter ' + ch.num, tm ? tm.code + ' ' + tm.title : 'Key results']);
  h += '<div class="card gk-head"><h1>Gupta &amp; Kapoor <span class="gk-badge">CH 5–8 · TEXTBOOK BANK</span></h1>' +
    '<p class="card-sub">' + GMETA.total + ' ISS-standard objective problems built from every theorem, ' +
    'remark, result and formula of ' + E(GMETA.source) + '. Each one opens with the verdict, then the ' +
    'step-by-step solution, the exam shortcut and the tips &amp; tricks.</p>' +
    '<div class="kpis">' +
    '<div class="kpi"><div class="v">' + GMETA.total + '</div><div class="l">Problems</div></div>' +
    '<div class="kpi"><div class="v">' + GMETA.chapters.length + '</div><div class="l">Chapters</div></div>' +
    '<div class="kpi"><div class="v">' + GMETA.nTopics + '</div><div class="l">Subtopics</div></div>' +
    '<div class="kpi ok"><div class="v">' + GMETA.nVerified + '</div><div class="l">Computed keys</div></div>' +
    '</div>' +
    '<div class="banner info mt"><b>Not previous-year questions.</b> ' + E(GMETA.provenance) + '</div></div>';

  h += '<div class="gk-tabs" role="tablist" aria-label="Chapters">';
  GMETA.chapters.forEach(function (c) {
    var on = c.num === ch.num;
    h += '<button type="button" role="tab" aria-selected="' + on + '" class="gk-tab' + (on ? ' on' : '') +
      '" data-act="gkCh" data-ch="' + c.num + '"><b>Chapter ' + c.num + '</b><span>' + E(c.short) +
      '</span><small>' + c.n + ' problems</small></button>';
  });
  h += '</div>';

  h += '<div class="card gk-chap"><div class="gk-chap-hd"><h2>Chapter ' + ch.num + ' · ' + E(ch.title) + '</h2>' +
    '<div class="btnrow">' +
    '<button type="button" class="btn sm" data-act="gkPractice" data-scope="chapter" data-mode="learn">Practise chapter (' + ch.n + ')</button>' +
    '<button type="button" class="btn sm" data-act="gkPractice" data-scope="chapter" data-mode="exam">Chapter mock</button>' +
    '</div></div>' +
    '<div class="gk-subtabs" role="tablist" aria-label="Subtopics">';
  ch.topics.forEach(function (t) {
    var on = tm && t.code === tm.code;
    h += '<button type="button" role="tab" aria-selected="' + on + '" class="gk-sub' + (on ? ' on' : '') +
      '" data-act="gkTopic" data-t="' + E(t.code) + '"><b>' + E(t.code) + '</b> ' + E(t.title) +
      ' <span class="gk-count">' + t.n + '</span></button>';
  });
  h += '<button type="button" role="tab" aria-selected="' + !tm + '" class="gk-sub gk-sheet-tab' + (!tm ? ' on' : '') +
    '" data-act="gkTopic" data-t="sheet"><b>∑</b> Key results &amp; formulas</button>';
  h += '</div></div>';

  h += tm ? gkTopicView(ch, tm) : gkSheetView(ch);
  return h;
};

function gkHomeSection() {
  if (!GMETA || !GDATA.length) return '';
  var h = '<h2 class="mt">Gupta Kapoor · Chapters 5–8 <span class="gk-badge">TEXTBOOK BANK &middot; NOT PYQ</span></h2>';
  h += '<div class="grid g3">';
  GMETA.chapters.forEach(function (c) {
    h += tile('gkGo', { ch: c.num }, 'Chapter ' + c.num + ' · ' + E(c.short),
      E(c.title), c.n + ' problems · ' + c.topics.length + ' subtopics');
  });
  h += tile('gkGo', { ch: GMETA.chapters[0].num, t: 'sheet' }, 'Key results &amp; formula sheets',
    'Theorems, remarks and shortcuts for last-day revision, chapter by chapter.', GMETA.sheets.length + ' sheets');
  h += tile('gkPractice', { scope: 'all', mode: 'exam' }, 'Gupta Kapoor full mock',
    'Every chapter, shuffled, under strict exam conditions.', GMETA.total + ' problems');
  h += '</div>';
  return h;
}

function gkPractice(scope, mode) {
  var qs, label;
  if (scope === 'all') { qs = GDATA.slice(); label = 'Chapters 5–8'; }
  else if (scope === 'chapter') {
    qs = GDATA.filter(function (q) { return q.gkChapter === GK.ch; });
    label = 'Chapter ' + GK.ch;
  } else {
    var tm = gkTopic(GK.t);
    if (!tm) return;
    qs = (GK_BY_TOPIC[tm.code] || []).slice();
    label = tm.code + ' ' + tm.title;
  }
  if (!qs.length) return;
  var st = Store.d().settings;
  var exam = mode === 'exam';
  buildSession({
    kind: 'gk',
    name: 'Gupta Kapoor · ' + label,
    desc: 'GUPTA & KAPOOR TEXTBOOK BANK (not PYQ) · ' + qs.length + ' questions · mode: ' +
          (exam ? 'Strict Exam' : 'Learning'),
    mode: exam ? 'exam' : 'learn',
    questions: qs,
    shuffleQ: exam, shuffleO: false,
    timed: st.timerOn,
    minutes: Math.round(qs.length * st.minutesPerQuestion),
    authentic: false
  });
}

/* delegated clicks for this tab; returns true when handled */
function gkClick(act, t) {
  var qid = t.getAttribute('data-qid');
  switch (act) {
    case 'gkGo':
      GK.ch = +t.getAttribute('data-ch');
      GK.t = t.getAttribute('data-t') || '';
      GK.diff = 0;
      go('gk');
      return true;
    case 'gkCh':
      GK.ch = +t.getAttribute('data-ch'); GK.t = ''; GK.diff = 0;
      render();
      return true;
    case 'gkTopic':
      GK.t = t.getAttribute('data-t'); GK.diff = 0;
      render();
      return true;
    case 'gkDiff': GK.diff = +t.getAttribute('data-d'); render(); return true;
    case 'gkOpt': GK.pick[qid] = +t.getAttribute('data-i'); render(); return true;
    case 'gkShow': GK.open[qid] = true; render(); return true;
    case 'gkHide': delete GK.open[qid]; delete GK.pick[qid]; render(); return true;
    case 'gkPractice':
      if (S && !S.finished && ROUTE.name === 'exam') return true;
      gkPractice(t.getAttribute('data-scope'), t.getAttribute('data-mode'));
      return true;
    case 'gkPyq': {
      var tm = gkTopic(GK.t);
      if (!tm) return true;
      practiceFromIds(gkRelatedPyqs(tm).map(function (q) { return q.id; }),
        'Related PYQs · ' + tm.code + ' ' + tm.title, 'custom');
      return true;
    }
  }
  return false;
}

/* consistency check of the textbook bank, reported on the audit screen */
var GK_AUDIT = (function () {
  var errs = [], ids = {};
  GDATA.forEach(function (q) {
    if (ids[q.id]) errs.push(q.id + ': duplicate id');
    ids[q.id] = 1;
    if (!q.options || q.options.length !== 4) errs.push(q.id + ': needs four options');
    if (!scorable(q) || q.correctAnswer < 0 || q.correctAnswer > 3) errs.push(q.id + ': bad key');
    if (!q.solution || !q.solution.length) errs.push(q.id + ': solution missing');
    if (!q.examShortcut) errs.push(q.id + ': exam shortcut missing');
    if (!q.tipsTricks || q.tipsTricks.length < 3) errs.push(q.id + ': fewer than three tips');
    if (!gkTopic(q.gkTopic)) errs.push(q.id + ': unknown subtopic ' + q.gkTopic);
  });
  return { ok: !errs.length, errors: errs, total: GDATA.length };
})();
/* GK-JS-END */
/* ======================================================================
   CS.  COMPUTER  —  chapter-wise practice sets (11 chapters).
   Injected by computer-dashboard-src/integrate.py; edit it there, not here.
   The bank lives in window.csData / window.csMeta and is kept apart from
   the authentic PYQs: it never enters a year, sectional, topic, subtopic
   or custom PYQ mock, and the PYQ data audit ignores it.
   ====================================================================== */
var CS = { ch: 0, view: 'sets', bset: 1, ri: 0, pick: {}, open: {}, sheetOpen: 0, sheetAll: false };
var CS_BY_SET = {};
var CS_BY_CH = {};
CDATA.forEach(function (q) {
  var k = q.csChapter + '-' + q.csSet;
  (CS_BY_SET[k] = CS_BY_SET[k] || []).push(q);
  (CS_BY_CH[q.csChapter] = CS_BY_CH[q.csChapter] || []).push(q);
});

/* progress kept in its own key so the PYQ store's 60-attempt history cap
   never erases which sets have been covered */
var CsStore = (function () {
  var KEY = 'upsc.iss.cs.v1';
  var cache = null;
  function blank() { return { v: 1, sets: {}, q: {} }; }
  function load() {
    if (cache) return cache;
    try {
      var raw = window.localStorage.getItem(KEY);
      cache = raw ? JSON.parse(raw) : blank();
    } catch (e) { cache = blank(); }
    if (!cache || cache.v !== 1 || !cache.sets || !cache.q) cache = blank();
    return cache;
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) {}
  }
  function replace(obj) {
    cache = (obj && obj.v === 1 && obj.sets && obj.q) ? obj : blank();
    save();
  }
  return { d: load, save: save, replace: replace, reset: function () { cache = blank(); save(); } };
})();

/* text renderer for this bank: `code spans` are shown literally (so C
   operators such as *, $, | and <> can never be read as markup), the rest
   goes through the shared markdown-lite + KaTeX renderer */
function csR(s) {
  if (s === null || s === undefined || s === '') return '';
  var parts = String(s).split('`'), h = '';
  for (var i = 0; i < parts.length; i++) {
    h += (i % 2) ? '<code>' + E(parts[i]) + '</code>' : R(parts[i]);
  }
  return h;
}

function csBody(q) {
  var h = csR(q.question);
  if (q.code) h += '<pre class="cs-code">' + E(q.code) + '</pre>';
  if (q.stmts && q.stmts.length) {
    h += '<ol class="stmts">';
    q.stmts.forEach(function (s) { h += '<li>' + csR(s) + '</li>'; });
    h += '</ol>';
  }
  if (q.ask) h += '<div class="ask">' + csR(q.ask) + '</div>';
  return h;
}

function csChapter(num) {
  var out = null;
  (CMETA ? CMETA.chapters : []).forEach(function (c) { if (c.num === +num) out = c; });
  return out;
}

function csSheet(num) {
  var out = null;
  (CMETA ? CMETA.sheets : []).forEach(function (s) { if (s.ch === +num) out = s; });
  return out;
}

function csSetQs(ch, k) { return CS_BY_SET[ch + '-' + k] || []; }
function csSetName(ch, k) { return 'Computer · Ch ' + ch + ' · Set ' + k; }

function csRelatedPyqs(c) {
  return DATA.filter(function (q) { return c.relCodes.indexOf(q.topicCode) >= 0; });
}

/* the one clean line above a question: chapter · set · number */
function csMetaLine(q) {
  var c = csChapter(q.csChapter);
  return '<div class="qmeta cs-meta"><span class="cs-topic">' + E(c ? c.title : q.subtopic) + '</span>' +
    '<span>Set ' + q.csSet + '</span><span>' + E(q.csLabel) + '</span></div>';
}

/* coverage helpers */
function csCov(qs) {
  var st = CsStore.d().q, seen = 0, ok = 0;
  qs.forEach(function (q) {
    if (st.hasOwnProperty(q.id)) { seen++; if (st[q.id] === 1) ok++; }
  });
  return { n: qs.length, seen: seen, ok: ok };
}

function csMarkQ(qid, correct) {
  var d = CsStore.d();
  d.q[qid] = correct ? 1 : 0;
  CsStore.save();
}

/* called from persistAttempt() for every submitted Computer session */
function csRecord(sess) {
  var d = CsStore.d(), r = sess.result;
  r.perQ.forEach(function (p) {
    if (p.status === 'correct') d.q[p.qid] = 1;
    else if (p.status === 'incorrect') d.q[p.qid] = 0;
  });
  if (sess.csSetId) {
    var s = d.sets[sess.csSetId] || { att: 0, best: 0, bestExam: null, last: 0, ts: 0 };
    var score = r.total ? Math.round(100 * r.correct / r.total) : 0;
    s.att++; s.last = score; s.ts = sess.endTs || Date.now();
    if (score > s.best) s.best = score;
    if (sess.mode === 'exam') s.bestExam = Math.max(s.bestExam === null ? 0 : s.bestExam, Math.round(r.pct));
    d.sets[sess.csSetId] = s;
  }
  CsStore.save();
}

/* the answer, in a fixed order: verdict -> Explanation -> Exam shortcut.
   The options above already show right and wrong in colour, so the
   verdict is a single line. */
function csRevealPanes(q, chosen, opts) {
  opts = opts || {};
  if (ROUTE.name === 'study') opts.peek = true;
  var answered = chosen !== null && chosen !== undefined;
  var ans = '<span class="ans">(' + LET[q.correctAnswer] + ') ' + csR(q.options[q.correctAnswer]) + '</span>';
  var h;
  if (!answered && opts.peek) h = '<div class="cs-verdict peek"><span class="ic">✓</span><span>Answer ' + ans + '</span></div>';
  else if (!answered) h = '<div class="cs-verdict skip"><span class="ic">–</span><span>Not answered · ' + ans + '</span></div>';
  else if (chosen === q.correctAnswer) h = '<div class="cs-verdict ok"><span class="ic">✓</span><span>Correct</span></div>';
  else h = '<div class="cs-verdict bad"><span class="ic">✗</span><span>Incorrect · answer ' + ans + '</span></div>';
  h += '<div class="cs-block cs-exp"><div class="lbl">Explanation</div><div class="tx">' + csR(q.explanation) + '</div></div>';
  h += '<div class="cs-block cs-short"><div class="lbl">Exam shortcut</div><div class="tx">' + csR(q.examShortcut) + '</div></div>';
  return h;
}

function csOptionList(q, pick) {
  var done = pick !== undefined && pick !== null;
  var h = '<ul class="opts">';
  for (var i = 0; i < q.options.length; i++) {
    var cls = 'opt';
    if (done) {
      if (i === q.correctAnswer) cls += ' correct';
      else if (i === pick) cls += ' wrong';
    }
    h += '<li><button type="button" class="' + cls + '"' + (done ? ' disabled' : '') +
      ' data-act="csOpt" data-qid="' + E(q.id) + '" data-i="' + i + '">' +
      '<span class="k">' + LET[i] + '</span><span class="v">' + csR(q.options[i]) + '</span></button></li>';
  }
  return h + '</ul>';
}

/* chapter button: number, title and a coverage bar */
function csChapBtn(cc, act, on) {
  var cv = csCov(CS_BY_CH[cc.num] || []);
  return '<button type="button"' + (act === 'csCh' ? ' role="tab" aria-selected="' + on + '"' : '') +
    ' class="cs-tab' + (on ? ' on' : '') + '" data-act="' + act + '" data-ch="' + cc.num + '"><b>' + cc.num +
    '</b><span>' + E(cc.title) + '</span><i class="bar"><i style="width:' + fx(pct(cv.seen, cv.n), 1) + '%"></i></i></button>';
}

function csSetsView(c) {
  var rec = CsStore.d().sets;
  var next = null;
  c.sets.forEach(function (s) {
    if (next === null && !rec[c.num + '-' + s.k]) next = s.k;
  });
  var h = '<div class="cs-sets">';
  c.sets.forEach(function (s) {
    var qs = csSetQs(c.num, s.k);
    var r = rec[c.num + '-' + s.k];
    var sc = csCov(qs);
    h += '<div class="cs-set' + (s.k === next ? ' next' : '') + '">' +
      '<div class="hd"><b>Set ' + s.k + '</b><span class="rng">Q' + s.from + '–' + s.to + ' · ' + s.n + '</span>' +
      (s.k === next ? '<span class="chip brand">Next</span>' : '') + '<span class="sp"></span>' +
      (r ? '<span class="best">best ' + r.best + '%' + (r.bestExam !== null ? ' · exam ' + r.bestExam + '%' : '') + '</span>' : '') +
      '</div>' +
      (s.themes ? '<div class="themes">' + E(s.themes) + '</div>' : '') +
      '<div class="cov"><div class="progbar"><i class="' + (sc.seen === sc.n ? 'ok' : '') + '" style="width:' +
      fx(pct(sc.seen, sc.n), 1) + '%"></i></div><span>' + sc.seen + '/' + sc.n + '</span></div>' +
      '<div class="btnrow"><button type="button" class="btn sm primary" data-act="csStart" data-set="' + s.k +
      '" data-mode="learn">Learn</button><button type="button" class="btn sm" data-act="csStart" data-set="' + s.k +
      '" data-mode="exam">Exam</button><button type="button" class="btn sm ghost" data-act="csBrowse" data-set="' + s.k +
      '">Revise</button></div></div>';
  });
  h += '</div>';
  h += '<div class="card cs-whole"><b>Whole chapter</b><div class="btnrow">' +
    '<button type="button" class="btn sm" data-act="csChapterMock" data-mode="exam">All ' + c.n + ' · exam</button>' +
    '<button type="button" class="btn sm ghost" data-act="csChapterMock" data-mode="random">Random 20</button></div></div>';
  return h;
}

/* pointers: one fold-out section per heading, one open at a time */
function csSheetView(c) {
  var sh = csSheet(c.num);
  if (!sh) return '<div class="empty">No pointers for this chapter yet.</div>';
  var n = 0;
  sh.sections.forEach(function (s) { n += s.items.length; });
  var h = '<div class="cs-sheet-bar"><span class="small muted">' + n + ' points · <span class="hy">★</span> high-yield</span>' +
    '<span class="sp"></span><button type="button" class="btn sm ghost" data-act="csSheetAll">' +
    (CS.sheetAll ? 'Collapse all' : 'Expand all') + '</button>' +
    '<button type="button" class="btn sm ghost noprint" data-act="csPrint">Print</button></div><div class="cs-acc">';
  sh.sections.forEach(function (s, i) {
    var open = CS.sheetAll || CS.sheetOpen === i;
    h += '<details class="cs-sec"' + (open ? ' open' : '') + ' data-i="' + i + '"><summary><span class="k">' + (i + 1) +
      '</span><span class="t">' + E(s.title) + '</span><span class="n">' + s.items.length + '</span></summary><ul>';
    s.items.forEach(function (b) {
      h += '<li>' + csR(b).replace(/★/g, '<span class="hy" title="high-yield">★</span>') + '</li>';
    });
    h += '</ul></details>';
  });
  return h + '</div>';
}

/* revise: one question at a time, with a number strip to jump and
   Prev / Next (or a swipe) to move */
function csReviseView(c) {
  var k = Math.min(Math.max(1, CS.bset), c.sets.length);
  CS.bset = k;
  var qs = csSetQs(c.num, k);
  var i = Math.min(Math.max(0, CS.ri), qs.length - 1);
  CS.ri = i;
  var q = qs[i];
  var st = CsStore.d().q;
  var pick = CS.pick.hasOwnProperty(q.id) ? CS.pick[q.id] : null;
  var open = pick !== null || !!CS.open[q.id];
  var h = '<div class="card cs-rev"><div class="cs-pills" role="tablist" aria-label="Sets">';
  c.sets.forEach(function (s) {
    h += '<button type="button" role="tab" aria-selected="' + (s.k === k) + '" class="cs-pill' + (s.k === k ? ' on' : '') +
      '" data-act="csBrowse" data-set="' + s.k + '">Set ' + s.k + '</button>';
  });
  h += '</div><div class="cs-strip" aria-label="Questions">';
  qs.forEach(function (x, j) {
    var cls = 'cs-num' + (st.hasOwnProperty(x.id) ? (st[x.id] === 1 ? ' ok' : ' bad') : '') + (j === i ? ' cur' : '');
    h += '<button type="button" class="' + cls + '" data-act="csRi" data-i="' + j + '" aria-label="Question ' + (j + 1) + '">' +
      (j + 1) + '</button>';
  });
  h += '</div><div class="cs-rev-hd">' + csMetaLine(q) + bookmarkBtn(q.id) + '</div>' +
    '<div class="qtext">' + csBody(q) + '</div>' + csOptionList(q, pick);
  if (open) h += '<div class="reveal">' + csRevealPanes(q, pick, { peek: pick === null }) + '</div>';
  h += '<div class="cs-pager">' +
    '<button type="button" class="btn" data-act="csRi" data-d="-1" data-i="' + (i - 1) + '"' + (i === 0 ? ' disabled' : '') +
    '>‹ Prev</button>' +
    (open ? '<button type="button" class="btn mid" data-act="csHide" data-qid="' + E(q.id) + '">' +
            (pick !== null ? 'Try again' : 'Hide answer') + '</button>'
          : '<button type="button" class="btn mid" data-act="csShow" data-qid="' + E(q.id) + '">Show answer</button>') +
    '<button type="button" class="btn primary" data-act="csRi" data-d="1" data-i="' + (i + 1) + '"' +
    (i === qs.length - 1 ? ' disabled' : '') + '>Next ›</button></div>';
  return h + '</div>';
}

function csPyqView(c) {
  var rel = csRelatedPyqs(c);
  var h = '<div class="card"><div class="cs-pyqrow">';
  var ti = META.topicIntel || {};
  c.relCodes.forEach(function (k) {
    var n = DATA.filter(function (q) { return q.topicCode === k; }).length;
    h += '<span class="chip">' + E(ti[k] ? ti[k].name : k) + ' · ' + n + '</span>';
  });
  h += '</div><div class="btnrow"><button type="button" class="btn primary" data-act="csPyq"' +
    (rel.length ? '' : ' disabled') + '>Practise all ' + rel.length + '</button></div></div>';
  if (rel.length) {
    h += '<ul class="list">';
    rel.slice().sort(function (a, b) { return b.year - a.year || a.questionNumber - b.questionNumber; })
      .forEach(function (q) {
        h += '<li><div class="top"><span class="pyq-badge">' + q.year + ' Q' + q.questionNumber + '</span></div>' +
          '<div class="small">' + R(q.question) + '</div>' +
          '<div class="btnrow mt"><button type="button" class="btn sm ghost" data-act="study" data-qid="' + E(q.id) +
          '" data-back="cs">Study card</button></div></li>';
      });
    h += '</ul>';
  }
  return h;
}

V.cs = function () {
  if (!CMETA || !CDATA.length) {
    return crumb(['Home', 'Computer']) + '<div class="card"><h1>Computer bank not loaded</h1></div>';
  }
  var c = csChapter(CS.ch) || CMETA.chapters[0];
  CS.ch = c.num;
  var views = { sets: 'Sets', sheet: 'Pointers', read: 'Revise', pyq: 'PYQs' };
  if (!views[CS.view]) CS.view = 'sets';
  var h = crumb(['Home', 'Computer', 'Chapter ' + c.num, views[CS.view]]);

  var all = csCov(CDATA);
  var p = Math.round(pct(all.seen, all.n));
  h += '<div class="cs-top"><div class="cs-top-l"><h1>Computer</h1><span class="small muted">' + CMETA.total +
    ' questions · ' + CMETA.chapters.length + ' chapters · ' + CMETA.nSets + ' sets</span></div>' +
    '<div class="cs-ring" style="--p:' + p + '" title="Questions covered"><span>' + p + '%<small>done</small></span></div></div>';

  h += '<div class="cs-tabs" role="tablist" aria-label="Chapters">';
  CMETA.chapters.forEach(function (cc) { h += csChapBtn(cc, 'csCh', cc.num === c.num); });
  h += '</div>';

  var rel = csRelatedPyqs(c);
  var cv = csCov(CS_BY_CH[c.num] || []);
  h += '<div class="card cs-chap"><div class="cs-chap-hd"><h2>' + E(c.title) + '</h2><span class="small muted">Chapter ' +
    c.num + ' · ' + c.n + ' questions · ' + cv.seen + ' done</span></div>' +
    '<div class="cs-subtabs" role="tablist" aria-label="Chapter views">';
  [['sets', 'Sets', c.sets.length], ['sheet', 'Pointers', null], ['read', 'Revise', null], ['pyq', 'PYQs', rel.length]]
    .forEach(function (v) {
      var on = CS.view === v[0];
      h += '<button type="button" role="tab" aria-selected="' + on + '" class="cs-sub' + (on ? ' on' : '') +
        '" data-act="csView" data-v="' + v[0] + '">' + E(v[1]) + (v[2] !== null ? '<span class="n">' + v[2] + '</span>' : '') +
        '</button>';
    });
  h += '</div></div>';

  if (CS.view === 'sheet') h += csSheetView(c);
  else if (CS.view === 'read') h += csReviseView(c);
  else if (CS.view === 'pyq') h += csPyqView(c);
  else h += csSetsView(c);
  return h;
};

function csHomeSection() {
  if (!CMETA || !CDATA.length) return '';
  var all = csCov(CDATA);
  var h = '<h2 class="mt">Computer</h2><div class="card cs-home"><div class="cs-home-hd"><span>' + CMETA.total +
    ' questions · ' + CMETA.nSets + ' sets</span><span class="sp"></span><b>' +
    Math.round(pct(all.seen, all.n)) + '% done</b></div><div class="cs-tabs cs-grid">';
  CMETA.chapters.forEach(function (c) { h += csChapBtn(c, 'csGo', false); });
  h += '</div><div class="btnrow mt"><button type="button" class="btn sm" data-act="csGo" data-ch="' +
    CMETA.chapters[0].num + '" data-v="sheet">Pointers</button>' +
    '<button type="button" class="btn sm" data-act="csMix" data-n="20">Mixed drill · 20</button></div></div>';
  return h;
}

function csStartSet(k, mode) {
  var c = csChapter(CS.ch);
  if (!c) return;
  var qs = csSetQs(c.num, k);
  if (!qs.length) return;
  var st = Store.d().settings;
  var exam = mode === 'exam';
  var s = c.sets[k - 1];
  buildSession({
    kind: 'cs',
    name: csSetName(c.num, k),
    desc: 'Chapter ' + c.num + ' \u00b7 ' + c.title + ' \u00b7 Set ' + k + ' \u00b7 Q' + s.from + '\u2013' + s.to +
      ' \u00b7 ' + qs.length + ' questions \u00b7 ' + (exam ? 'Exam' : 'Learning'),
    mode: exam ? 'exam' : 'learn',
    questions: qs,
    shuffleQ: exam, shuffleO: false,
    timed: exam && st.timerOn,
    minutes: Math.round(qs.length * st.minutesPerQuestion),
    authentic: false
  });
  S.csSetId = c.num + '-' + k;
}

function csStartPool(qs, name, desc) {
  if (!qs.length) return;
  var st = Store.d().settings;
  buildSession({
    kind: 'cs', name: name, desc: desc, mode: 'exam', questions: qs,
    shuffleQ: true, shuffleO: false, timed: st.timerOn,
    minutes: Math.round(qs.length * st.minutesPerQuestion), authentic: false
  });
}

/* bring the answer into view once it opens, moving as little as possible */
function csShowReveal() {
  var r = app.querySelector('.cs-rev .reveal');
  if (r && r.scrollIntoView) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* accordion: opening one pointer section closes the others */
app.addEventListener('toggle', function (ev) {
  var d = ev.target;
  if (!d || !d.classList || !d.classList.contains('cs-sec')) return;
  var i = +d.getAttribute('data-i');
  if (d.open) {
    CS.sheetOpen = i;
    if (!CS.sheetAll) {
      Array.prototype.forEach.call(app.querySelectorAll('.cs-sec[open]'), function (o) { if (o !== d) o.open = false; });
      var sum = d.querySelector('summary');
      if (sum && sum.scrollIntoView) setTimeout(function () { sum.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 0);
    }
  } else if (CS.sheetOpen === i) CS.sheetOpen = -1;
}, true);

/* delegated clicks for this tab; returns true when handled */
function csClick(act, t) {
  var qid = t.getAttribute('data-qid');
  switch (act) {
    case 'csGo':
      CS.ch = +t.getAttribute('data-ch');
      CS.view = t.getAttribute('data-v') || 'sets';
      CS.bset = 1; CS.ri = 0; CS.sheetOpen = 0;
      go('cs');
      return true;
    case 'csCh':
      CS.ch = +t.getAttribute('data-ch'); CS.bset = 1; CS.ri = 0; CS.sheetOpen = 0;
      render();
      return true;
    case 'csView': CS.view = t.getAttribute('data-v'); render(); return true;
    case 'csBrowse':
      CS.view = 'read'; CS.bset = +t.getAttribute('data-set') || 1; CS.ri = 0;
      render();
      var rv = app.querySelector('.cs-rev');
      if (rv && rv.scrollIntoView) rv.scrollIntoView({ block: 'start' });
      return true;
    case 'csRi': {
      if (t.disabled) return true;
      CS.ri = +t.getAttribute('data-i');
      render();
      var card = app.querySelector('.cs-rev');
      if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start' });
      return true;
    }
    case 'csOpt': {
      var q = BY_ID[qid];
      var i = +t.getAttribute('data-i');
      CS.pick[qid] = i;
      if (q) csMarkQ(qid, i === q.correctAnswer);
      render(); csShowReveal();
      return true;
    }
    case 'csShow': CS.open[qid] = true; render(); csShowReveal(); return true;
    case 'csHide': delete CS.open[qid]; delete CS.pick[qid]; render(); return true;
    case 'csSheetAll': CS.sheetAll = !CS.sheetAll; if (!CS.sheetAll) CS.sheetOpen = 0; render(); return true;
    case 'csPrint': {
      var was = CS.sheetAll;
      CS.sheetAll = true; render();
      window.print();
      CS.sheetAll = was; render();
      return true;
    }
    case 'csStart':
      if (S && !S.finished && ROUTE.name === 'exam') return true;
      csStartSet(+t.getAttribute('data-set'), t.getAttribute('data-mode'));
      return true;
    case 'csChapterMock': {
      var c = csChapter(CS.ch);
      if (!c) return true;
      var qs = (CS_BY_CH[c.num] || []).slice();
      if (t.getAttribute('data-mode') === 'random') {
        shuffle(qs);
        csStartPool(qs.slice(0, 20), 'Computer \u00b7 Ch ' + c.num + ' \u00b7 Random 20',
          'Chapter ' + c.num + ' \u00b7 ' + c.title + ' \u00b7 20 random questions \u00b7 Exam');
      } else {
        csStartPool(qs, 'Computer \u00b7 Ch ' + c.num + ' \u00b7 Whole chapter',
          'Chapter ' + c.num + ' \u00b7 ' + c.title + ' \u00b7 all ' + qs.length + ' questions \u00b7 Exam');
      }
      return true;
    }
    case 'csMix': {
      var n = +t.getAttribute('data-n') || 20;
      var pool = CDATA.slice();
      shuffle(pool);
      csStartPool(pool.slice(0, n), 'Computer \u00b7 Mixed drill (' + n + ')',
        'All chapters \u00b7 ' + n + ' questions \u00b7 Exam');
      return true;
    }
    case 'csPyq': {
      var cc = csChapter(CS.ch);
      if (!cc) return true;
      practiceFromIds(csRelatedPyqs(cc).map(function (x) { return x.id; }),
        'PYQs \u00b7 Computer Ch ' + cc.num, 'custom');
      return true;
    }
  }
  return false;
}

/* consistency check of the Computer bank, reported on the audit screen */
var CS_AUDIT = (function () {
  var errs = [], ids = {};
  CDATA.forEach(function (q) {
    if (ids[q.id]) errs.push(q.id + ': duplicate id');
    ids[q.id] = 1;
    if (!q.options || (q.options.length !== 4 && q.options.length !== 2)) errs.push(q.id + ': needs two or four options');
    if (!scorable(q) || q.correctAnswer < 0 || q.correctAnswer >= (q.options || []).length) errs.push(q.id + ': bad key');
    if (!q.explanation) errs.push(q.id + ': explanation missing');
    if (!q.examShortcut) errs.push(q.id + ': exam shortcut missing');
    if (!csChapter(q.csChapter)) errs.push(q.id + ': unknown chapter');
  });
  (CMETA ? CMETA.chapters : []).forEach(function (c) {
    var n = 0;
    c.sets.forEach(function (s) {
      var got = csSetQs(c.num, s.k).length;
      if (got !== s.n) errs.push('Chapter ' + c.num + ' set ' + s.k + ': ' + got + ' questions, meta says ' + s.n);
      n += got;
    });
    if (n !== c.n) errs.push('Chapter ' + c.num + ': sets hold ' + n + ' of ' + c.n + ' questions');
  });
  return { ok: !errs.length, errors: errs, total: CDATA.length };
})();
/* CS-JS-END */

/* ------------------------------------------------ Android / mobile shell
   Injected by computer-dashboard-src/integrate.py; edit it there.
   Adds the bottom navigation bar, the in-session action bar with a pop-up
   palette sheet, a screen title in the top bar, swipe between questions,
   and Android back-button support (browser history). Every control proxies
   to the dashboard's own buttons, so the app logic is unchanged; on
   desktop the bars stay hidden by CSS. */
var MOB_ICON = {
  home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  cs: 'M3 5h18v11H3zM8.5 20h7M12 16v4',
  gk: 'M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3zM21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z',
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM20 20l-4.8-4.8',
  prev: 'M15 5l-7 7 7 7', next: 'M9 5l7 7-7 7',
  mark: 'M6 4h12v16l-6-4-6 4z', grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  done: 'M5 12.5l4.5 4.5L19 7'
};
var MOB_NAV = [['home', 'Home'], ['cs', 'Computer'], ['gk', 'G&K'], ['search', 'Search']];

function mobSvg(k) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + MOB_ICON[k] + '"/></svg>';
}

function mobLeaveSession() {
  if (S && !S.finished && ROUTE.name === 'exam') {
    if (!window.confirm('Leave the mock in progress? Your answers will be lost.')) return false;
    stopTick(); S = null;
  }
  return true;
}

var MOB_TITLES = { home: 'Offline Mock Engine', cs: 'Computer', gk: 'Gupta Kapoor', search: 'Search' };
var mobRevSeen = {};

function mobPalette(open) {
  document.body.classList.toggle('pal-open', !!open);
}

function mobSync() {
  var r = ROUTE.name;
  mobPalette(false);
  /* top app bar: the name of the current screen */
  var tt = document.querySelector('#topbar .mtitle');
  if (tt) {
    var title = MOB_TITLES[r];
    if (!title && S && (r === 'exam' || r === 'result' || r === 'review')) title = S.name + (r === 'exam' ? '' : ' \u00b7 ' + (r === 'result' ? 'Result' : 'Review'));
    if (!title) { var cb = app.querySelector('.crumb b'); title = cb ? cb.textContent : 'Offline Mock Engine'; }
    tt.textContent = title;
  }
  var active = (r === 'cs' || r === 'gk' || r === 'search') ? r : 'home';
  if ((r === 'exam' || r === 'result' || r === 'review') && S) {
    active = S.kind === 'cs' ? 'cs' : S.kind === 'gk' ? 'gk' : 'home';
  }
  var nav = document.getElementById('bnav');
  if (nav) {
    Array.prototype.forEach.call(nav.querySelectorAll('button'), function (b) {
      var on = b.getAttribute('data-r') === active;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  var live = r === 'exam' && S && !S.finished;
  document.body.classList.toggle('in-session', !!live);
  var bar = document.getElementById('msess');
  if (bar && live) {
    var last = S.cur === S.items.length - 1;
    bar.innerHTML =
      '<button type="button" data-proxy="prevQ" aria-label="Previous question"' + (S.cur === 0 ? ' disabled' : '') + '>' +
        mobSvg('prev') + '<span class="lbl">Prev</span></button>' +
      '<button type="button" data-proxy="markQ" class="' + (S.marked[S.cur] ? 'on' : '') + '" aria-pressed="' +
        !!S.marked[S.cur] + '" aria-label="Mark for review">' + mobSvg('mark') + '<span class="lbl">Mark</span></button>' +
      '<button type="button" data-proxy="palette" aria-label="Question palette">' + mobSvg('grid') +
        '<span class="pos">' + (S.cur + 1) + '/' + S.items.length + '</span></button>' +
      (last ? '<button type="button" data-proxy="submitMock" class="pri">' + mobSvg('done') + 'Submit</button>'
            : '<button type="button" data-proxy="nextQ" class="pri">Next' + mobSvg('next') + '</button>');
  }
  /* learning mode: the first time an answer opens, bring it into view */
  if (live && S.mode === 'learn' && S.revealed[S.cur]) {
    var key = S.startTs + ':' + S.cur;
    if (!mobRevSeen[key]) {
      mobRevSeen[key] = 1;
      var rv = app.querySelector('.reveal');
      if (rv && rv.scrollIntoView) rv.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  /* keep the selected chip of every scrolling row in view */
  [['.cs-tabs', '.cs-tab.on'], ['.cs-pills', '.cs-pill.on'], ['.cs-strip', '.cs-num.cur']].forEach(function (p) {
    var row = app.querySelector(p[0]);
    var on = row && row.querySelector(p[1]);
    if (on && row.scrollWidth > row.clientWidth) {
      row.scrollLeft = Math.max(0, on.offsetLeft - row.offsetLeft - (row.clientWidth - on.offsetWidth) / 2);
    }
  });
}

(function mobShell() {
  var brand = document.querySelector('#topbar .brand');
  if (brand) {
    var tt = document.createElement('span');
    tt.className = 'mtitle';
    tt.textContent = 'Offline Mock Engine';
    brand.insertBefore(tt, brand.firstChild);
  }

  var nav = document.createElement('nav');
  nav.id = 'bnav';
  nav.setAttribute('aria-label', 'Main');
  nav.innerHTML = MOB_NAV.map(function (n) {
    return '<button type="button" data-r="' + n[0] + '"><span class="ic">' + mobSvg(n[0]) + '</span>' + E(n[1]) + '</button>';
  }).join('');
  document.body.appendChild(nav);
  nav.addEventListener('click', function (ev) {
    var t = closest(ev.target, '[data-r]');
    if (!t || !mobLeaveSession()) return;
    go(t.getAttribute('data-r'));
  });

  var bar = document.createElement('div');
  bar.id = 'msess';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Question navigation');
  document.body.appendChild(bar);
  bar.addEventListener('click', function (ev) {
    var t = closest(ev.target, '[data-proxy]');
    if (!t || t.disabled) return;
    var a = t.getAttribute('data-proxy');
    if (a === 'palette') { mobPalette(!document.body.classList.contains('pal-open')); return; }
    var b = app.querySelector('[data-act="' + a + '"]');
    if (b && !b.disabled) b.click();
  });

  var scrim = document.createElement('div');
  scrim.id = 'mscrim';
  document.body.appendChild(scrim);
  scrim.addEventListener('click', function () { mobPalette(false); });

  if (window.MutationObserver) new MutationObserver(mobSync).observe(app, { childList: true });

  /* swipe left / right between questions (mock) and review steps */
  var sx = 0, sy = 0, st = 0, ok = false;
  app.addEventListener('touchstart', function (e) {
    ok = e.touches.length === 1 &&
      !closest(e.target, 'pre, table, .cs-code, .scrollx, .cs-tabs, .cs-subtabs, .cs-pills, .cs-strip, .exam-side, ' +
        '.katex-display, input, textarea, select');
    if (!ok) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (!ok) return;
    ok = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6 || Date.now() - st > 800) return;
    var fwd = dx < 0;
    var b = null;
    if (ROUTE.name === 'exam' && S && !S.finished) b = app.querySelector('[data-act="' + (fwd ? 'nextQ' : 'prevQ') + '"]');
    else if (ROUTE.name === 'review') b = app.querySelector('[data-act="revStep"][data-d="' + (fwd ? '1' : '-1') + '"]');
    else if (ROUTE.name === 'cs' && CS.view === 'read') b = app.querySelector('.cs-pager [data-d="' + (fwd ? '1' : '-1') + '"]');
    if (b && !b.disabled) b.click();
  }, { passive: true });

  /* Android back button: every go() becomes a history entry */
  var baseGo = go;
  go = function (name, params) {
    baseGo(name, params);
    try { history.pushState({ iss: 1, r: ROUTE }, ''); } catch (e) {}
  };
  try { history.replaceState({ iss: 1, r: { name: 'home' } }, ''); } catch (e) {}
  window.addEventListener('popstate', function (ev) {
    if (document.body.classList.contains('pal-open')) {
      mobPalette(false);
      try { history.pushState({ iss: 1, r: ROUTE }, ''); } catch (e) {}
      return;
    }
    if (!mobLeaveSession()) {
      try { history.pushState({ iss: 1, r: ROUTE }, ''); } catch (e) {}
      return;
    }
    var r = ev.state && ev.state.r ? ev.state.r : { name: 'home' };
    if (r.name === 'exam') r = { name: S && S.finished ? 'result' : 'home' };
    if ((r.name === 'result' || r.name === 'review') && !(S && S.finished)) r = { name: 'home' };
    ROUTE = r;
    render();
    window.scrollTo(0, 0);
  });
})();
/* ======================================================================
   9.  RENDER + EVENTS
   ====================================================================== */
function render() {
  var fn = V[ROUTE.name] || V.home;
  app.innerHTML = fn(ROUTE);
}

function startFromBuilder() {
  var B = BUILDER;
  var st = Store.d().settings;
  var qs = builderQuestions(B);
  if (!qs.length) return;
  if (B.kind !== 'year' && B.count > 0 && B.count < qs.length) {
    var pick = qs.slice();
    shuffle(pick);
    qs = pick.slice(0, B.count);
    qs.sort(function (a, b) { return a.year - b.year || a.questionNumber - b.questionNumber; });
  }
  var minutes = B.minutes > 0 ? B.minutes
    : (B.kind === 'year' ? st.fullPaperMinutes : Math.round(qs.length * st.minutesPerQuestion));
  buildSession({
    kind: B.kind,
    name: builderName(B),
    desc: builderDesc(B, qs.length),
    mode: B.mode,
    questions: qs,
    shuffleQ: B.kind === 'year' ? false : B.shuffleQ,
    shuffleO: B.kind === 'year' ? false : B.shuffleO,
    timed: B.timed,
    minutes: minutes,
    authentic: B.kind === 'year'
  });
}

function practiceFromIds(ids, name, kind) {
  var qs = ids.map(function (i) { return BY_ID[i]; }).filter(Boolean);
  qs = uniqBy(qs, function (q) { return q.id; });
  if (!qs.length) { window.alert('Nothing to practise here yet.'); return; }
  var st = Store.d().settings;
  buildSession({
    kind: kind || 'custom',
    name: name,
    desc: qs.length + ' question(s) \u00b7 mode: ' + (st.defaultMode === 'exam' ? 'Strict Exam' : 'Learning'),
    mode: st.defaultMode,
    questions: qs,
    shuffleQ: true, shuffleO: false,
    timed: st.timerOn,
    minutes: Math.round(qs.length * st.minutesPerQuestion),
    authentic: false
  });
}

app.addEventListener('click', function (ev) {
  var t = closest(ev.target, '[data-act]');
  if (!t) return;
  var act = t.getAttribute('data-act');
  var d = Store.d();

  if (gkClick(act, t)) return;
  if (csClick(act, t)) return;
  switch (act) {
    case 'go':
      if (S && !S.finished && ROUTE.name === 'exam') {
        if (!window.confirm('Leave the mock in progress? Your answers will be lost.')) return;
        stopTick(); S = null;
      }
      go(t.getAttribute('data-r'),
         t.getAttribute('data-u') ? { u: t.getAttribute('data-u') } : null);
      return;

    case 'fcStart':
      startForecastMock(t.getAttribute('data-m'), t.getAttribute('data-mode'));
      return;

    case 'setup':
      BUILDER = newBuilder(t.getAttribute('data-k'));
      if (BUILDER.kind === 'year') BUILDER.years = [String(META.years[META.years.length - 1])];
      go('setup');
      return;

    case 'startMock': startFromBuilder(); return;

    case 'opt': chooseOption(+t.getAttribute('data-i')); return;
    case 'jump': gotoQ(+t.getAttribute('data-i')); return;
    case 'prevQ': gotoQ(S.cur - 1); return;
    case 'nextQ': gotoQ(S.cur + 1); return;
    case 'markQ': S.marked[S.cur] = !S.marked[S.cur]; render(); return;
    case 'clearAns': S.answers[S.cur] = null; render(); return;

    case 'submitMock': {
      var un = 0;
      S.answers.forEach(function (a) { if (a === null) un++; });
      var msg = 'Submit this mock?\n\nAnswered: ' + (S.items.length - un) +
        '\nUnanswered: ' + un + '\n\nYou cannot return to the paper after submitting.';
      if (window.confirm(msg)) finishSession(false);
      return;
    }
    case 'abandon':
      if (window.confirm('Abandon this mock? Nothing will be saved.')) {
        stopTick(); S = null; go('home');
      }
      return;

    case 'reviewAt':
      REVIEW.idx = +t.getAttribute('data-i');
      REVIEW.filter = 'all';
      go('review');
      return;
    case 'revFilter': REVIEW.filter = t.getAttribute('data-f'); render(); return;
    case 'revStep': {
      var r = S.result;
      var list = r.perQ.map(function (p, i) { return i; });
      if (REVIEW.filter === 'incorrect') list = list.filter(function (i) { return r.perQ[i].status === 'incorrect'; });
      else if (REVIEW.filter === 'correct') list = list.filter(function (i) { return r.perQ[i].status === 'correct'; });
      else if (REVIEW.filter === 'unanswered') list = list.filter(function (i) { return r.perQ[i].status === 'unanswered'; });
      else if (REVIEW.filter === 'marked') list = list.filter(function (i) { return r.perQ[i].marked; });
      var p2 = list.indexOf(REVIEW.idx) + (+t.getAttribute('data-d'));
      if (p2 >= 0 && p2 < list.length) { REVIEW.idx = list[p2]; render(); window.scrollTo(0, 0); }
      return;
    }

    case 'retryIncorrect':
      practiceFromIds(S.result.perQ.filter(function (p) { return p.status === 'incorrect'; })
        .map(function (p) { return p.qid; }), 'Retry incorrect \u00b7 ' + S.name, 'mistakes');
      return;
    case 'retryUnanswered':
      practiceFromIds(S.result.perQ.filter(function (p) { return p.status === 'unanswered'; })
        .map(function (p) { return p.qid; }), 'Retry unanswered \u00b7 ' + S.name, 'mistakes');
      return;
    case 'retakeSame':
      practiceFromIds(S.result.perQ.map(function (p) { return p.qid; }), S.name + ' (retake)', S.kind);
      return;

    case 'practiceIds': {
      var src = t.getAttribute('data-src');
      var ids = src === 'mistakes' ? Object.keys(d.mistakes)
        : src === 'skipped' ? Object.keys(d.skipped)
        : src === 'bookmarks' ? Object.keys(d.bookmarks)
        : Object.keys(d.mistakes).concat(Object.keys(d.skipped));
      var nm = src === 'mistakes' ? 'Practice My Mistakes'
        : src === 'skipped' ? 'Retry unanswered'
        : src === 'bookmarks' ? 'My bookmarks practice' : 'Mistakes + skipped';
      practiceFromIds(ids, nm, 'mistakes');
      return;
    }
    case 'practiceWeak': {
      var weak = weakAreas(3).slice(0, 3).map(function (r) { return r.k.split(' \u2014 ')[1]; });
      var pool = DATA.filter(function (q) { return weak.indexOf(q.topic) >= 0; });
      shuffle(pool);
      practiceFromIds(pool.slice(0, 40).map(function (q) { return q.id; }),
        'Practice My Weak Areas', 'custom');
      return;
    }
    case 'practiceSearch': {
      var qq = SEARCH.q.trim().toLowerCase();
      var terms = qq ? qq.split(/\s+/) : [];
      var hits = [];
      for (var i = 0; i < DATA.length; i++) {
        var q = DATA[i];
        if (SEARCH.unit && q.unit !== SEARCH.unit) continue;
        if (SEARCH.year && String(q.year) !== String(SEARCH.year)) continue;
        var ok = true;
        for (var k = 0; k < terms.length; k++) if (SEARCH_INDEX[i].indexOf(terms[k]) < 0) { ok = false; break; }
        if (ok) hits.push(q.id);
      }
      practiceFromIds(hits.slice(0, 200), 'Search practice' + (qq ? ' \u00b7 ' + SEARCH.q : ''), 'custom');
      return;
    }

    case 'bookmark': {
      var qid = t.getAttribute('data-qid');
      if (d.bookmarks[qid]) delete d.bookmarks[qid];
      else d.bookmarks[qid] = Date.now();
      Store.save();
      render();
      return;
    }
    case 'study':
      STUDY.qid = t.getAttribute('data-qid');
      STUDY.back = t.getAttribute('data-back') || 'home';
      go('study');
      return;

    case 'resetHistory':
      if (window.confirm('Clear all attempt history? Analytics will be reset.')) { Store.reset('history'); render(); }
      return;
    case 'resetMistakes':
      if (window.confirm('Clear the mistake bank?')) { Store.reset('mistakes'); render(); }
      return;
    case 'resetBookmarks':
      if (window.confirm('Remove all bookmarks?')) { Store.reset('bookmarks'); render(); }
      return;
    case 'resetAll':
      if (window.confirm('Erase ALL local data: history, analytics, mistakes, bookmarks and settings?')) {
        Store.reset('all'); Store.save(); CsStore.reset(); go('home');
      }
      return;

    case 'exportData': exportData(); return;
    case 'showExport': showExport(); return;
    case 'importText': {
      var box = document.getElementById('importbox');
      if (box && box.value.trim()) doImport(box.value);
      else window.alert('Paste the exported JSON into the box first.');
      return;
    }
  }
});

/* change / input events */
app.addEventListener('change', function (ev) {
  var t = closest(ev.target, '[data-act]');
  if (!t) return;
  var act = t.getAttribute('data-act');
  var B = BUILDER, d = Store.d();

  function toggle(arr, val, on) {
    var i = arr.indexOf(val);
    if (on && i < 0) arr.push(val);
    if (!on && i >= 0) arr.splice(i, 1);
  }

  switch (act) {
    case 'setYear': B.years = [t.value]; render(); return;
    case 'tgYear': toggle(B.years, t.value, t.checked); render(); return;
    case 'tgUnit': toggle(B.units, t.value, t.checked);
      B.topics = B.topics.filter(function (tp) {
        return !B.units.length || B.units.some(function (u) { return !!META.taxonomy[u].topics[tp]; });
      });
      render(); return;
    case 'tgTopic': toggle(B.topics, t.value, t.checked); render(); return;
    case 'tgSub': toggle(B.subtopics, t.value, t.checked); render(); return;
    case 'setCount': B.count = Math.max(0, parseInt(t.value, 10) || 0); refreshSetupSummary(); return;
    case 'setMinutes': B.minutes = Math.max(0, parseInt(t.value, 10) || 0); refreshSetupSummary(); return;
    case 'setMode': B.mode = t.value; render(); return;
    case 'tgTimed': B.timed = t.checked; render(); return;
    case 'tgShuffleQ': B.shuffleQ = t.checked; render(); return;
    case 'tgShuffleO': B.shuffleO = t.checked; render(); return;

    case 'setCfg': {
      var v = parseFloat(t.value);
      if (!isNaN(v)) { d.settings[t.getAttribute('data-k')] = v; Store.save(); }
      return;
    }
    case 'setCfgBool': d.settings[t.getAttribute('data-k')] = t.checked; Store.save(); return;
    case 'setDefMode': d.settings.defaultMode = t.value; Store.save(); return;

    case 'searchUnit': SEARCH.unit = t.value; render(); focusSearch(); return;
    case 'searchYear': SEARCH.year = t.value; render(); focusSearch(); return;
    case 'searchBank': SEARCH.bank = t.value; render(); focusSearch(); return;

    case 'importFile': {
      var f = t.files && t.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { doImport(String(fr.result)); };
      fr.readAsText(f);
      return;
    }
  }
});

var searchTimer = null;
app.addEventListener('input', function (ev) {
  var t = closest(ev.target, '[data-act]');
  if (!t) return;
  var act = t.getAttribute('data-act');
  if (act === 'setCount' && BUILDER) {
    BUILDER.count = Math.max(0, parseInt(t.value, 10) || 0);
    refreshSetupSummary();
    return;
  }
  if (act === 'setMinutes' && BUILDER) {
    BUILDER.minutes = Math.max(0, parseInt(t.value, 10) || 0);
    refreshSetupSummary();
    return;
  }
  if (act === 'searchInput' || act === 'bmFilter') {
    SEARCH.q = t.value;
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () { render(); focusSearch(); }, 180);
  }
});

function focusSearch() {
  var el = document.getElementById('sq') || document.getElementById('bmq');
  if (el) {
    el.focus();
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
  }
}

/* top bar */
document.getElementById('topbar').addEventListener('click', function (ev) {
  var t = closest(ev.target, '[data-act]');
  if (!t || t.getAttribute('data-act') !== 'go') return;
  if (S && !S.finished && ROUTE.name === 'exam') {
    if (!window.confirm('Leave the mock in progress? Your answers will be lost.')) return;
    stopTick(); S = null;
  }
  go(t.getAttribute('data-r'));
});

/* keyboard shortcuts */
document.addEventListener('keydown', function (ev) {
  var tag = (ev.target && ev.target.tagName) || '';
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || ev.target.isContentEditable) return;
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

  if (ROUTE.name === 'exam' && S && !S.finished) {
    if (ev.key >= '1' && ev.key <= '4') { chooseOption(+ev.key - 1); ev.preventDefault(); return; }
    if (ev.key === 'ArrowLeft') { gotoQ(S.cur - 1); ev.preventDefault(); return; }
    if (ev.key === 'ArrowRight') { gotoQ(S.cur + 1); ev.preventDefault(); return; }
    if (ev.key === 'm' || ev.key === 'M') { S.marked[S.cur] = !S.marked[S.cur]; render(); ev.preventDefault(); return; }
  }
  if (ROUTE.name === 'review' && S && S.result) {
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      var btn = app.querySelector('[data-act="revStep"][data-d="' + (ev.key === 'ArrowLeft' ? '-1' : '1') + '"]');
      if (btn && !btn.disabled) btn.click();
      ev.preventDefault();
      return;
    }
  }
  if (ev.key === 'h' || ev.key === 'H') { go('home'); return; }
  if (ev.key === 's' || ev.key === 'S') { go('search'); focusSearch(); return; }
});

/* leaving the page mid-exam */
window.addEventListener('beforeunload', function (ev) {
  if (S && !S.finished) { ev.preventDefault(); ev.returnValue = ''; return ''; }
});

/* ======================================================================
   10. EXPORT / IMPORT
   ====================================================================== */
function exportPayload() {
  var d = Store.d();
  return JSON.stringify({
    app: 'upsc-iss-stat1-mock-engine',
    v: 1,
    exportedAt: new Date().toISOString(),
    datasetVersion: META.datasetVersion,
    data: d,
    cs: CsStore.d()
  }, null, 1);
}

function exportData() {
  var txt = exportPayload();
  try {
    var blob = new Blob([txt], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'iss-stat1-progress-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  } catch (e) {
    showExport();
  }
}

function showExport() {
  var txt = exportPayload();
  var back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = '<div class="modal"><h3>Progress JSON</h3>' +
    '<p class="small muted">Select all and copy. Paste it into the import box on another device.</p>' +
    '<textarea rows="12" style="width:100%;font-family:var(--font-mono);font-size:.72rem;' +
    'border:1px solid var(--line-2);border-radius:5px;padding:8px;background:var(--surface);' +
    'color:var(--ink)"></textarea>' +
    '<div class="btnrow mt"><button type="button" class="btn primary" data-close="1">Close</button></div></div>';
  document.body.appendChild(back);
  var ta = back.querySelector('textarea');
  ta.value = txt;
  ta.focus(); ta.select();
  back.addEventListener('click', function (e) {
    if (e.target === back || (e.target.getAttribute && e.target.getAttribute('data-close'))) {
      document.body.removeChild(back);
    }
  });
}

function doImport(text) {
  var obj;
  try { obj = JSON.parse(text); }
  catch (e) { window.alert('That is not valid JSON.'); return; }
  var payload = obj && obj.data ? obj.data : obj;
  if (!payload || typeof payload !== 'object' || !payload.settings) {
    window.alert('This file does not look like an exported progress file.');
    return;
  }
  if (!window.confirm('Import will REPLACE your current history, bookmarks, mistakes and settings. Continue?')) return;
  var d = Store.d();
  var b = Store.blank();
  d.settings = payload.settings || b.settings;
  d.history = payload.history || [];
  d.bookmarks = payload.bookmarks || {};
  d.mistakes = payload.mistakes || {};
  d.skipped = payload.skipped || {};
  d.seq = payload.seq || 0;
  Store.save();
  if (obj && obj.cs) CsStore.replace(obj.cs);
  window.alert('Progress imported: ' + d.history.length + ' attempt(s).');
  go('home');
}

/* ======================================================================
   11. BOOT
   ====================================================================== */
if (!DATA.length) {
  app.innerHTML = '<div class="card"><h1>Question database not loaded</h1>' +
    '<p>Make sure <code>questions.js</code>, <code>styles.css</code> and <code>index.html</code> ' +
    'are all in the same folder, then reopen <code>index.html</code>.</p></div>';
} else {
  /* small read-only hook, used by the build-time validation harness and handy
     for anyone who wants to inspect the dataset from the browser console */
  window.ISSApp = {
    version: META.datasetVersion,
    audit: AUDIT,
    render: R,
    strip: ML.strip,
    mathErrors: ML.mathErrors,
    gk: { total: GDATA.length, audit: GK_AUDIT },
    cs: { total: CDATA.length, audit: CS_AUDIT },
    session: function () {
      return S ? { ids: S.items.map(function (i) { return i.qid; }),
                   order: S.items.map(function (i) { return i.order; }),
                   name: S.name, kind: S.kind,
                   cur: S.cur, mode: S.mode, finished: S.finished } : null;
    }
  };
  if (window.console && window.console.log) {
    window.console.log('[ISS Stat-I] dataset ' + META.datasetVersion + ' · ' + DATA.length +
      ' questions · audit ' + (AUDIT.ok ? 'PASSED' : 'FAILED (' + AUDIT.errors.length + ' errors)'));
  }
  render();
}

})();
