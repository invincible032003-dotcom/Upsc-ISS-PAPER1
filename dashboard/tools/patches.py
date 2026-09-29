"""Anchored patches applied to src/app.base.js (the original application, kept pristine).

Every entry is (name, old, new, expected_count).  build.py asserts that `old`
occurs exactly `expected_count` times, so a change in the base file fails the
build instead of silently producing a half-patched app.
"""

PATCHES = []

def P(name, old, new, count=1):
    PATCHES.append((name, old, new, count))

# ---------------------------------------------------------------- data + config
P('data: add the notes banks to ALL',
  "var ALL = DATA.concat(FDATA, GDATA, CDATA);",
  "var NDATA = window.nbData || [];          /* ISS 2027 NOTES banks: drills, mocks, true/false, handbook MCQs */\n"
  "var ALL = DATA.concat(FDATA, GDATA, CDATA, NDATA);")

P('config: UPSC pattern defaults (+2.5, -1/3, 1.5 min/question, 120 min)',
  "var DEFAULT_CFG = window.quizConfig || {};",
  "var DEFAULT_CFG = (function (c) {\n"
  "  var o = {}; for (var k in c) o[k] = c[k];\n"
  "  o.marksCorrect = 2.5; o.negativeMarkingEnabled = true; o.negativeMarkFraction = 1 / 3;\n"
  "  o.defaultMinutesPerQuestion = 1.5; o.fullPaperMinutes = 120;\n"
  "  return o;\n"
  "})(window.quizConfig || {});")

P('enrich: taxonomy, indexes, note references (m-enrich.js)',
  "var app = document.getElementById('app');",
  "var app = document.getElementById('app');\n/*NB-ENRICH*/")

P('store: new persistent keys',
  "      skipped: {},\n      seq: 0",
  "      skipped: {},\n"
  "      ui: {}, study: { days: {} }, sr: {}, qh: {}, marked: {}, nr: {}, nsave: {}, last: null,\n"
  "      seq: 0")

P('import: restore the new keys',
  "  d.seq = payload.seq || 0;",
  "  d.seq = payload.seq || 0;\n"
  "  ['ui', 'study', 'sr', 'qh', 'marked', 'nr', 'nsave'].forEach(function (k) { d[k] = payload[k] || b[k]; });\n"
  "  d.last = payload.last || null;")

# ---------------------------------------------------------------- search + badges
P('search index: notes banks',
  ": q.isForecast ? 'forecast 2027' :",
  ": q.isNB ? 'notes ' + q.nbBank + ' ' + q.topicCode + ' ' + q.cls + ' ' + q.questionType : q.isForecast ? 'forecast 2027' :")

P('search: PYQ-only filter excludes notes',
  "if (SEARCH.bank === 'pyq' && (q.isForecast || q.isGK || q.isCS)) continue;",
  "if (SEARCH.bank === 'pyq' && (q.isForecast || q.isGK || q.isCS || q.isNB)) continue;\n"
  "    if (SEARCH.bank === 'nb' && !q.isNB) continue;")

P('search: bank picker gets the notes option',
  "'>Computer only</option>' : '') + '</select></label>';",
  "'>Computer only</option>' : '') +\n"
  "      '<option value=\"nb\"' + (SEARCH.bank === 'nb' ? ' selected' : '') + '>ISS 2027 notes banks only</option>' +\n"
  "      '</select></label>';")

P('search: notes badge on hits',
  "(q.isCS ? '<span class=\"cs-badge\">COMPUTER</span>' : '') +",
  "(q.isCS ? '<span class=\"cs-badge\">COMPUTER</span>' : '') + (q.isNB ? nbBadge(q) : '') +")

P('provenance badge',
  "function provenanceBadge(q) {\n  if (q.isCS)",
  "function provenanceBadge(q) {\n  if (q.isNB) return nbBadge(q);\n  if (q.isCS)")

P('meta line',
  "function qMetaLine(q) {\n  if (q.isCS) return csMetaLine(q);",
  "function qMetaLine(q) {\n  if (q.isNB) return nbMetaLine(q);\n  if (q.isCS) return csMetaLine(q);")

P('reveal panes',
  "  if (q.isCS) return csRevealPanes(q, chosenOriginal, opts);",
  "  if (q.isNB) return nbRevealPanes(q, chosenOriginal, opts);\n  if (q.isCS) return csRevealPanes(q, chosenOriginal, opts);")

# ---------------------------------------------------------------- session engine
P('session: carry extra info',
  "    authentic: !!opts.authentic,\n    finished: false,",
  "    authentic: !!opts.authentic,\n    extra: opts.extra || null,\n    finished: false,")

P('session: persist hook',
  "  if (sess.kind === 'cs') csRecord(sess);",
  "  if (sess.kind === 'cs') csRecord(sess);\n  nbAfterAttempt(sess);")

P('session: tick hook (pace, warnings)',
  "        el.className = 'timer' + (left < 300 ? ' low' : '');",
  "        el.className = 'timer' + (left < 300 ? ' low' : '');\n        nbTick(left, elapsed);")

P('exam header: pace chip',
  "    '<span id=\"timer\" class=\"timer\">' + tdisp + '</span>' +",
  "    nbPaceChip() +\n    '<span id=\"timer\" class=\"timer\">' + tdisp + '</span>' +")

P('result: time management + trap-class insight',
  "  h += breakdownCard(r.perQ, 'unit', 'Performance by unit');",
  "  h += nbResultExtras();\n  h += breakdownCard(r.perQ, 'unit', 'Performance by unit');")

P('study card: real back navigation',
  "data-act=\"go\" data-r=\"' + E(STUDY.back) + '\">Back</button>",
  "data-act=\"back\">Back</button>")

# ---------------------------------------------------------------- shell + events
P('render: safe render + shell sync',
  "function render() {\n  var fn = V[ROUTE.name] || V.home;\n  app.innerHTML = fn(ROUTE);\n}",
  "function render() {\n  var fn = V[ROUTE.name] || V.home;\n"
  "  try { app.innerHTML = fn(ROUTE); }\n"
  "  catch (err) {\n"
  "    app.innerHTML = '<div class=\"card\"><h2>This screen could not be drawn</h2><p class=\"small muted\">' + E(String(err && err.message || err)) +\n"
  "      '</p><div class=\"btnrow\"><button type=\"button\" class=\"btn primary\" data-act=\"nav\" data-r=\"home\">Home</button></div></div>';\n"
  "    if (window.console) window.console.error(err);\n"
  "  }\n"
  "  nbAfterRender();\n}")

P('events: notes-app router first',
  "  if (gkClick(act, t)) return;\n  if (csClick(act, t)) return;",
  "  if (nbClick(act, t)) return;\n  if (gkClick(act, t)) return;\n  if (csClick(act, t)) return;")

P('boot: expose the new banks to the harness',
  "    cs: { total: CDATA.length, audit: CS_AUDIT },\n",
  "    cs: { total: CDATA.length, audit: CS_AUDIT },\n"
  "    nb: { total: NDATA.length, notes: NOTES.length, traps: TRAPS.length, dists: DISTS.length, go: function (n, p) { go(n, p); }, route: function () { return ROUTE; }, store: function () { return Store.d(); }, save: function () { Store.save(); } },\n")

P('reveal: "in your notes" pane for PYQs',
  "  if (opts.topic !== false) {\n    var ti = (META.topicIntel || {})[q.topicCode];",
  "  h += nbNotesPane(q);\n  if (opts.topic !== false) {\n    var ti = (META.topicIntel || {})[q.topicCode];")

P('keyboard: H and S must not abandon a running paper',
  "  if (ev.key === 'h' || ev.key === 'H') { go('home'); return; }",
  "  if (liveSession()) return;\n  if (ev.key === 'h' || ev.key === 'H') { go('home'); return; }")

P('unload: autosave instead of a scary prompt',
  "  if (S && !S.finished) { ev.preventDefault(); ev.returnValue = ''; return ''; }",
  "  if (S && !S.finished) nbSaveLive();")
