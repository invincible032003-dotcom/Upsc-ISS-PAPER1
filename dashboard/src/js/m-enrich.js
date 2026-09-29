/* ======================================================================
   NB-0.  ISS 2027 notes integration: taxonomy, indexes, enrichment
   ====================================================================== */
var NMETA = window.nbMeta || { banks: [], total: 0 };
var NOTES = window.notesData || [];
var TRAPS = window.trapData || [];
var DISTS = window.distData || [];
var TOPICS = [], TOPIC_BY = {}, UNIT_OF = {};
(function () {
  var tx = META.taxonomy || {};
  (META.units || []).forEach(function (u, ui) {
    var tps = (tx[u] && tx[u].topics) || {};
    Object.keys(tps).forEach(function (key) {
      var code = tps[key].code;
      var t = { code: code, key: key, name: key, unit: u, ui: ui, n: +code.replace(/\D/g, ''), pyq: tps[key].count };
      UNIT_OF[code] = u; TOPICS.push(t); TOPIC_BY[code] = t;
    });
  });
  TOPICS.sort(function (a, b) { return a.ui - b.ui || a.n - b.n; });
})();
NDATA.forEach(function (q) {
  var t = TOPIC_BY[q.topicCode];
  if (t) { q.unit = t.unit; q.topic = t.key; q.subtopic = t.key; }
});
var NB_BANK = {};
(NMETA.banks || []).forEach(function (b) { NB_BANK[b.id] = b; });
/* forecast questions carry the topic name, not a code: map it to the syllabus codes it covers */
var FC_MAP = {
  'classical and axiomatic probability': ['P1'], 'conditional probability and bayes theorem': ['P2'],
  'standard discrete distributions': ['P4'], 'standard continuous distributions': ['P5'],
  'distribution functions and transformations': ['P3', 'P7'], 'characteristic function, mgf and pgf': ['P9'],
  'random vectors and joint distributions': ['P6'], 'mathematical and conditional expectation': ['P8'],
  'modes of convergence and 0-1 laws': ['P10', 'P11'], 'probability inequalities': ['P12'],
  'laws of large numbers and central limit theorem': ['P13'], 'data presentation and measurement scales': ['S1'],
  'measures of location, dispersion, skewness and kurtosis': ['S2', 'S3'], 'association of attributes': ['S4'],
  'curve fitting and orthogonal polynomials': ['S5'], 'bivariate normal distribution': ['S6'], 'regression analysis': ['S7'],
  'correlation analysis': ['S8'], 'standard errors and large-sample tests': ['S9'], 'small-sample tests': ['S11'],
  'sampling distributions and exact tests': ['S10', 'S11'], 'non-parametric tests': ['S12'], 'order statistics': ['S13'],
  'asymptotic relative efficiency': ['S14']
};
FDATA.forEach(function (q) { q.fcCodes = FC_MAP[String(q.topic || '').toLowerCase()] || []; });
var BY_CODE = {};
ALL.forEach(function (q) {
  var cs = q.isForecast ? q.fcCodes : (q.topicCode ? [q.topicCode] : []);
  cs.forEach(function (c) { (BY_CODE[c] = BY_CODE[c] || []).push(q); });
});

var NOTE_BY = {}, TRAP_BY = {}, DIST_BY = {};
NOTES.forEach(function (s) { NOTE_BY[s.id] = s; });
TRAPS.forEach(function (s) { TRAP_BY[s.id] = s; });
DISTS.forEach(function (d) { DIST_BY[d.id] = d; });

/* sections attached to a syllabus code: primary (a section about it) and related (fact banks, extras) */
function sectionsFor(list, code) {
  var pri = [], rel = [];
  list.forEach(function (s) {
    var cs = s.codes || [];
    if (cs.indexOf(code) < 0) return;
    (cs.length <= 2 ? pri : rel).push(s);
  });
  return { pri: pri, rel: rel };
}
/* blueprint numbers (PYQs, forecast per paper, tier) come from each primary notes section */
function blueprint(code) {
  var s = NOTE_BY[code];
  return s && s.tier ? { pyq: s.pyq, f27: s.f27, tier: s.tier } : null;
}

/* every "[2019 Q32]" in the notes points at a PYQ; index them so a question can show what the notes say */
var NOTE_REFS = {};
var REF_RE = /\[(20\d\d) Q(\d+)(?:[–-](\d+))?\]/g;
(function () {
  function add(text, sec, gi, kind) {
    var m; REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(text))) {
      var a = +m[2], b = m[3] ? +m[3] : a;
      for (var k = a; k <= b && k - a < 8; k++) {
        var id = m[1] + '-Q' + (k < 10 ? '0' + k : k), arr = (NOTE_REFS[id] = NOTE_REFS[id] || []);
        var dup = false;
        arr.forEach(function (r) { if (r.s === sec.id && r.g === gi && r.x === text) dup = true; });
        if (!dup) arr.push({ s: sec.id, g: gi, x: text, k: kind });
      }
    }
  }
  NOTES.forEach(function (sec) {
    sec.groups.forEach(function (g, gi) {
      g.blocks.forEach(function (b) {
        if (b.t === 'ul') b.items.forEach(function (it) { add(it.x, sec, gi, it.k || ''); });
        else if (b.t === 'table') b.rows.forEach(function (r) { add(r.join(' · '), sec, gi, 'row'); });
        else if (b.x) add(b.x, sec, gi, b.t);
      });
    });
  });
})();
