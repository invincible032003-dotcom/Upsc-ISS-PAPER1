/* ======================================================================
   NB-4.  Flashcards: every notes-table row and every handbook value becomes
          a card; they feed the same spaced-repetition runner as questions
   ====================================================================== */
var CARD_INDEX = null;
var DECK_PROPS = { all: null, basic: ['mean', 'var', 'median', 'mode'], shape: ['skew', 'kurt', 'exkurt'], gen: ['mgf', 'cf', 'pgf'], dens: ['pmf', 'pdf', 'cdf'] };
var DECK_ST = { hb: 'all', hbk: 'all', nt: 'all', n: 20 };

function cardsIndex() {
  if (CARD_INDEX) return CARD_INDEX;
  var out = [];
  [['n', NOTES], ['t', TRAPS]].forEach(function (pair) {
    pair[1].forEach(function (sec) {
      sec.groups.forEach(function (g, gi) {
        g.blocks.forEach(function (b, bi) {
          if (b.t !== 'table' || b.head.length < 2) return;
          b.rows.forEach(function (r, ri) {
            if (r.filter(function (c) { return c && c.trim(); }).length < 2) return;
            out.push({ key: 'c:t|' + pair[0] + '|' + sec.id + '|' + gi + '|' + bi + '|' + ri, deck: 't', kind: pair[0], sid: sec.id, part: sec.part, code: (sec.codes || []).length === 1 ? sec.codes[0] : '' });
          });
        });
      });
    });
  });
  DISTS.forEach(function (d) {
    DPROPS.forEach(function (p) {
      if (!d.f[p[0]]) return;
      out.push({ key: 'c:d|' + d.id + '|' + p[0], deck: 'd', dist: d.id, prop: p[0], kind: d.kind, code: d.code });
    });
  });
  CARD_INDEX = out;
  return out;
}
var CARD_BY = null;
function cardMeta(key) {
  if (!CARD_BY) { CARD_BY = {}; cardsIndex().forEach(function (c) { CARD_BY[c.key] = c; }); }
  return CARD_BY[key];
}

/* front / back HTML of a card */
function cardOf(key) {
  var m = cardMeta(key);
  if (!m) return null;
  var p = key.slice(2).split('|');
  if (p[0] === 'd') {
    var d = DIST_BY[p[1]], lab = DPROPS.filter(function (x) { return x[0] === p[2]; })[0][1];
    return { tag: distKind(d) + ' law', title: d.name, code: d.code,
      front: '<div class="cf-q">What is the <b>' + E(lab) + '</b> of the <b>' + E(d.name) + '</b> law?</div><div class="cf-sub">' + R(d.title) + '</div>',
      back: '<div class="hb-v big open">' + R(d.f[p[2]]) + '</div>', open: { r: 'dist', p: { id: d.id } } };
  }
  var kind = p[1], sec = secOf(kind, p[2]), gi = +p[3], bi = +p[4], ri = +p[5];
  var b = sec.groups[gi].blocks[bi], row = b.rows[ri], head = b.head;
  var shortKey = row[0].length <= 4 && head.length >= 3;
  var front = shortKey ? row[0] + ' · ' + row[1] : row[0];
  var first = shortKey ? 2 : 1, back = '';
  for (var i = first; i < row.length; i++) {
    if (!row[i] || !row[i].trim()) continue;
    back += '<div class="cf-f"><span class="cf-l">' + NR(head[i]) + '</span><div class="cf-t">' + NR(row[i]) + '</div></div>';
  }
  return { tag: sec.id + ' · ' + sec.title, title: sec.groups[gi].title, code: m.code,
    front: '<div class="cf-l">' + NR(head[shortKey ? 1 : 0]) + '</div><div class="cf-q">' + NR(front) + '</div>', back: back,
    open: { r: 'read', p: { k: kind, id: sec.id, g: String(gi) } } };
}

function deckKeys(spec) {
  var list = cardsIndex().filter(function (c) {
    if (spec.deck && c.deck !== spec.deck) return false;
    if (spec.code && c.code !== spec.code) return false;
    if (spec.kind && c.kind !== spec.kind) return false;
    if (spec.part && c.part !== spec.part) return false;
    if (spec.props && spec.props.indexOf(c.prop) < 0) return false;
    return true;
  });
  return list.map(function (c) { return c.key; });
}
function deckCounts(keys) {
  var sr = Store.d().sr || {}, now = Date.now(), due = 0, fresh = 0;
  keys.forEach(function (k) { if (!sr[k]) fresh++; else if (sr[k].due <= now) due++; });
  return { n: keys.length, due: due, fresh: fresh };
}
/* due cards first, then new ones, never more than n */
function deckQueue(keys, n) {
  var sr = Store.d().sr || {}, now = Date.now(), due = [], fresh = [];
  keys.forEach(function (k) { if (!sr[k]) fresh.push(k); else if (sr[k].due <= now) due.push(k); });
  due.sort(function (a, b) { return sr[a].due - sr[b].due; });
  shuffle(fresh);
  return due.concat(fresh).slice(0, n);
}

/* --------------------------------------------------------------- deck screen */
function deckRow(id, title, sub, keys) {
  var c = deckCounts(keys);
  return '<li class="deck"><div class="dl"><b>' + title + '</b><span class="small muted">' + sub + '</span>' +
    '<span class="dc"><span class="chip">' + c.n + ' cards</span>' + (c.due ? '<span class="chip warn">' + c.due + ' due</span>' : '') + (c.fresh ? '<span class="chip">' + c.fresh + ' new</span>' : '') + '</span></div>' +
    '<button type="button" class="btn primary sm" data-act="deckGo" data-d="' + id + '"' + (c.n ? '' : ' disabled') + '>' + svg('play') + 'Start</button></li>';
}
var DECKS = {
  hb_all: { t: 'Formula cards · everything', s: 'One card per value: PMF/PDF, CDF, mean … PGF', spec: { deck: 'd' } },
  hb_d: { t: 'Formula cards · discrete laws', s: 'Bernoulli → multinomial', spec: { deck: 'd', kind: 'd' } },
  hb_c: { t: 'Formula cards · continuous laws', s: 'Uniform → bivariate normal', spec: { deck: 'd', kind: 'c' } },
  hb_basic: { t: 'Mean, variance, median, mode', s: 'The four numbers asked most', spec: { deck: 'd', props: DECK_PROPS.basic } },
  hb_shape: { t: 'Skewness and kurtosis', s: 'γ₁, β₂ and excess kurtosis', spec: { deck: 'd', props: DECK_PROPS.shape } },
  hb_gen: { t: 'MGF, CF and PGF', s: 'Generating functions of every law', spec: { deck: 'd', props: DECK_PROPS.gen } },
  hb_dens: { t: 'PMF, PDF and CDF', s: 'Definitions and distribution functions', spec: { deck: 'd', props: DECK_PROPS.dens } },
  nt_all: { t: 'Notes tables · all', s: 'Every row of every table in the notes', spec: { deck: 't', kind: 'n' } },
  nt_p: { t: 'Notes tables · Probability', s: 'P1–P13, banks and extras', spec: { deck: 't', kind: 'n', part: 'Probability' } },
  nt_s: { t: 'Notes tables · Statistical Methods', s: 'S1–S14', spec: { deck: 't', kind: 'n', part: 'Statistical Methods' } },
  nt_u: { t: 'Look-right-but-wrong', s: 'Statements to unlearn, blueprint and protocol', spec: { deck: 't', kind: 'n', part: 'Start here' } },
  nt_x: { t: 'Vault and added results', s: 'Revise vault plus results added beyond the notes', spec: { deck: 't', kind: 'n', parts: ['Revise', 'Added'] } },
  tr_all: { t: 'Trap compendium tables', s: 'Every table in T1–T14', spec: { deck: 't', kind: 't' } }
};
function deckSpec(id) {
  var d = DECKS[id]; if (!d) return null;
  var s = d.spec;
  if (s.parts) {
    var keys = [];
    s.parts.forEach(function (p) { keys = keys.concat(deckKeys({ deck: 't', kind: 'n', part: p })); });
    return keys;
  }
  return deckKeys(s);
}
function decksHtml() {
  var h = '<div class="pagehead"><h1>Flashcards</h1><p class="small muted">Cards are generated from your notes and the handbook. Rate each one honestly: Again returns in 10 minutes, Good in a few days, and the interval grows as you get them right.</p></div>';
  h += '<div class="chiprow wrapchips"><span class="small muted">Session length</span>' + [10, 20, 40].map(function (n) {
    return '<button type="button" class="tchip' + (DECK_ST.n === n ? ' on' : '') + '" data-act="deckN" data-n="' + n + '">' + n + ' cards<small> · ' + Math.max(1, Math.round(n * 0.4)) + ' min</small></button>';
  }).join('') + '</div>';
  h += '<h3 class="mt">Formulas</h3><ul class="list decks">';
  ['hb_basic', 'hb_shape', 'hb_gen', 'hb_dens', 'hb_d', 'hb_c', 'hb_all'].forEach(function (id) { h += deckRow(id, DECKS[id].t, DECKS[id].s, deckSpec(id)); });
  h += '</ul><h3 class="mt">Notes and traps</h3><ul class="list decks">';
  ['nt_u', 'nt_p', 'nt_s', 'nt_x', 'nt_all', 'tr_all'].forEach(function (id) { h += deckRow(id, DECKS[id].t, DECKS[id].s, deckSpec(id)); });
  return h + '</ul>';
}
V.cards = function () { return decksHtml(); };

function cardsClick(act, t) {
  switch (act) {
    case 'deckN': DECK_ST.n = +t.getAttribute('data-n'); render(); return true;
    case 'deckGo': {
      var id = t.getAttribute('data-d'), keys = deckSpec(id);
      var q = deckQueue(keys, DECK_ST.n);
      if (!q.length) { toast('Nothing left in this deck. Come back when cards are due.'); return true; }
      revStart(q, DECKS[id].t, { back: 'cards' });
      return true;
    }
    case 'deckHb': revStart(deckQueue(deckSpec('hb_all'), DECK_ST.n), 'Formula cards', { back: 'dists' }); return true;
    case 'deckTopic': {
      var code = t.getAttribute('data-c');
      var ks = deckKeys({ code: code }), q2 = deckQueue(ks, DECK_ST.n);
      if (!q2.length) { toast('No cards for this topic yet.'); return true; }
      revStart(q2, code + ' · flashcards', { back: 'topic' });
      return true;
    }
  }
  return false;
}
