/* ======================================================================
   NB-2.  Notes + trap compendium reader, note search, distribution handbook
   ====================================================================== */
var RD = { kind: 'n', id: '', recall: false, traps: false };
var TIER_LBL = { 1: 'Tier 1 · must-win', 2: 'Tier 2 · high yield', 3: 'Tier 3 · cover' };
var TRAP_CLS = {
  val:   ['Value', 'A computed number, formula or parameter is off (slip in a standard result).'],
  hyp:   ['Hypothesis', 'A theorem is used without checking its conditions (independence, finiteness, iid, positivity).'],
  impl:  ['Implication', 'The converse or the direction of an implication is assumed.'],
  sign:  ['Sign / direction', 'Sign, inequality direction or which regression line is which.'],
  conv:  ['Convention', 'Geometric / negative binomial (trials or failures), rate or mean, shape or scale.'],
  supp:  ['Support', 'The support or range is ignored, so limits or a formula are wrong.'],
  exist: ['Existence', 'A moment, mean or variance that does not exist is treated as if it did.'],
  inv:   ['Invariance', 'What is unchanged by origin, scale or transformation is misjudged.']
};
function clsName(c) { return TRAP_CLS[c] ? TRAP_CLS[c][0] : (c || 'Other'); }

/* ------------------------------------------------------------ text helpers */
/* KaTeX/markdown-lite render, then turn "[2019 Q32]" into a tap target that opens the question */
function NR(text) {
  var h = R(text);
  if (h.indexOf('[20') < 0) return h;
  return h.replace(REF_RE, function (m, y, a, b) {
    var id = y + '-Q' + (+a < 10 ? '0' + (+a) : a);
    return '<button type="button" class="qref" data-act="qref" data-id="' + id + '">' + y + ' Q' + a + (b ? '–' + b : '') + '</button>';
  });
}
function snippet(text, n) {
  var s = ML.strip(String(text).replace(/\*\*|\*/g, '').replace(/\[20\d\d Q[\d–-]+\]/g, '')).replace(/\s+/g, ' ');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function pAttr(o) {
  var out = [];
  for (var k in o) if (o[k] !== undefined && o[k] !== null && o[k] !== '') out.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k]));
  return out.join('&');
}
function pParse(s) {
  var o = {};
  if (!s) return o;
  s.split('&').forEach(function (kv) { var i = kv.indexOf('='); o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); });
  return o;
}
function navBtn(cls, label, route, params, extra) {
  return '<button type="button" class="' + cls + '" data-act="nav" data-r="' + route + '"' +
    (params ? ' data-p="' + E(pAttr(params)) + '"' : '') + (extra || '') + '>' + label + '</button>';
}

/* ------------------------------------------------------------ section data */
function secOf(kind, id) { return (kind === 't' ? TRAP_BY : NOTE_BY)[id]; }
function secList(kind) { return kind === 't' ? TRAPS : NOTES; }
function gkey(kind, id, gi) { return kind + ':' + id + ':' + gi; }
function nkey(kind, id, gi) { return 'n:' + kind + '|' + id + '|' + gi; }
function secChars(sec) {
  if (sec._ch != null) return sec._ch;
  var n = 0;
  sec.groups.forEach(function (g) {
    g.blocks.forEach(function (b) {
      if (b.t === 'ul') b.items.forEach(function (i) { n += i.x.length; });
      else if (b.t === 'table') { b.head.forEach(function (c) { n += c.length; }); b.rows.forEach(function (r) { r.forEach(function (c) { n += c.length; }); }); }
      else if (b.x) n += b.x.length;
    });
  });
  sec._ch = n + (sec.lede || '').length;
  return sec._ch;
}
function groupChars(g) {
  var n = 0;
  g.blocks.forEach(function (b) {
    if (b.t === 'ul') b.items.forEach(function (i) { n += i.x.length; });
    else if (b.t === 'table') b.rows.forEach(function (r) { r.forEach(function (c) { n += c.length; }); });
    else if (b.x) n += b.x.length;
  });
  return n;
}
function readMins(sec) { return Math.max(1, Math.round(secChars(sec) / 1100)); }
function secProgress(kind, id) {
  var sec = secOf(kind, id), r = (Store.d().nr || {})[kind + ':' + id] || {}, n = 0;
  if (!sec) return { read: 0, total: 0, pct: 0 };
  sec.groups.forEach(function (g, gi) { if (r[gi]) n++; });
  return { read: n, total: sec.groups.length, pct: Math.round(100 * n / Math.max(1, sec.groups.length)) };
}
function hasTrap(g) {
  return g.blocks.some(function (b) { return b.t === 'trap' || (b.t === 'ul' && b.items.some(function (i) { return i.k === 'trap'; })); });
}
function topicName(code) {
  var s = NOTE_BY[code];
  if (s) return s.title;
  var t = TOPIC_BY[code];
  return t ? t.key : code;
}
function starStr(tier) { return tier ? '★★★'.slice(0, 4 - tier) : ''; }

/* ------------------------------------------------------------- block views */
function convFig() {
  /* convergence hierarchy, drawn inline so the notes need no image */
  function box(x, y, w, t) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="34" rx="9" class="fb"/><text x="' + (x + w / 2) + '" y="' + (y + 21) + '" text-anchor="middle" class="ft">' + t + '</text>';
  }
  function arr(x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="fl" marker-end="url(#ah)"/>'; }
  return '<figure class="nb-fig"><svg viewBox="0 0 380 232" role="img" aria-label="Implications between modes of convergence">' +
    '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" class="fa"/></marker></defs>' +
    box(8, 14, 108, 'almost surely') + box(8, 118, 108, 'in Lʳ (r ≥ 1)') +
    box(140, 66, 108, 'in probability') + box(266, 66, 108, 'in distribution') +
    arr(116, 34, 138, 76) + arr(116, 138, 138, 108) + arr(248, 83, 264, 83) +
    '<text x="8" y="196" class="fn">Lˢ ⇒ Lʳ for s &gt; r ≥ 1 (Lyapunov).</text>' +
    '<text x="8" y="212" class="fn">Prob. ⇒ a.s. only along a subsequence.</text>' +
    '<text x="8" y="228" class="fn">Dist. ⇒ prob. only if the limit is a constant.</text>' +
    '</svg><figcaption>Arrows are one-way. Probability ⇒ Lʳ needs uniform integrability; a.s. ⇒ Lʳ needs domination.</figcaption></figure>';
}

function tableMode(b) {
  var nc = b.head.length, tot = 0, cells = 0;
  b.rows.forEach(function (r) { r.forEach(function (c) { tot += c.length; cells++; }); });
  var avg = cells ? tot / cells : 0;
  if (nc <= 2) return 'plain';
  return avg > 34 ? 'stack' : 'scroll';
}
function tableHtml(b) {
  var mode = tableMode(b), nc = b.head.length;
  var heads = b.head.map(function (c) { return E(ML.strip(c)); });
  var h = '<div class="tblwrap ' + mode + '"><table class="nb-tbl c' + nc + '"><thead><tr>';
  b.head.forEach(function (c, i) { h += '<th' + (i === 0 ? ' class="fc"' : '') + '>' + NR(c) + '</th>'; });
  h += '</tr></thead><tbody>';
  b.rows.forEach(function (r) {
    h += '<tr>';
    r.forEach(function (c, i) {
      h += i === 0 ? '<th scope="row" class="fc" data-h="' + heads[0] + '">' + NR(c) + '</th>'
                   : '<td data-h="' + heads[i] + '">' + NR(c) + '</td>';
    });
    h += '</tr>';
  });
  return h + '</tbody></table></div>';
}
function blockHtml(b, trapsOnly) {
  if (b.t === 'p') return trapsOnly ? '' : '<p class="nb-p">' + NR(b.x) + '</p>';
  if (b.t === 'trap') return '<div class="nb-callout trap"><span class="tag">Trap</span><div>' + NR(b.x) + '</div></div>';
  if (b.t === 'key') return trapsOnly ? '' : '<div class="nb-callout key"><span class="tag">Key</span><div>' + NR(b.x) + '</div></div>';
  if (b.t === 'ul') {
    var items = trapsOnly ? b.items.filter(function (i) { return i.k === 'trap'; }) : b.items;
    if (!items.length) return '';
    return '<ul class="nb-ul">' + items.map(function (i) {
      return '<li class="' + (i.k ? 'k-' + i.k : '') + '">' + (i.k === 'trap' ? '<span class="tag">Trap</span>' : '') + NR(i.x) + '</li>';
    }).join('') + '</ul>';
  }
  if (trapsOnly) return '';
  if (b.t === 'table') return tableHtml(b);
  if (b.t === 'fig') return b.x === 'conv' ? convFig() : '';
  if (b.t === 'launch') {
    var bk = NB_BANK[b.bank];
    return '<div class="nb-launch"><button type="button" class="btn primary" data-act="nbLaunch" data-bank="' + E(b.bank) + '">' + svg('play') + E(b.x) + '</button>' +
      (bk ? '<span class="small muted">' + bk.n + ' items' + (bk.time ? ' · ' + bk.time + ' min' : '') + '</span>' : '') + '</div>';
  }
  return '';
}
function groupBodyHtml(kind, id, gi, trapsOnly, noFoot) {
  var sec = secOf(kind, id), g = sec.groups[gi], h = '';
  g.blocks.forEach(function (b) { h += blockHtml(b, trapsOnly); });
  if (noFoot) return h;
  var d = Store.d(), k = kind + ':' + id;
  var rd = !!((d.nr || {})[k] || {})[gi], sv = !!(d.nsave || {})[nkey(kind, id, gi)];
  h += '<div class="gfoot">' +
    '<button type="button" class="btn sm' + (rd ? ' on' : '') + '" data-act="grpRead" data-k="' + kind + '" data-id="' + id + '" data-g="' + gi + '">' + svg('check') + '<span>' + (rd ? 'Read' : 'Mark read') + '</span></button>' +
    '<button type="button" class="btn sm' + (sv ? ' on' : '') + '" data-act="grpSave" data-k="' + kind + '" data-id="' + id + '" data-g="' + gi + '">' + svg('star') + '<span>' + (sv ? 'Saved' : 'Save for revision') + '</span></button>' +
    (gi < sec.groups.length - 1 ? '<button type="button" class="btn sm ghost" data-act="grpNext" data-g="' + (gi + 1) + '"><span>Next</span>' + svg('chev') + '</button>' : '') +
    '</div>';
  return h;
}

/* -------------------------------------------------------------- the reader */
V.read = function (p) {
  var kind = p.k === 't' ? 't' : 'n';
  var sec = secOf(kind, p.id);
  if (!sec) return '<div class="card"><h2>Section not found</h2>' + navBtn('btn primary', 'Back to Learn', 'learn') + '</div>';
  var u = uiPrefs();
  RD.kind = kind; RD.id = sec.id; RD.recall = !!u.recall;
  if (!p.keep) RD.traps = false;
  Store.d().last = { r: 'read', p: { k: kind, id: sec.id }, t: sec.title, ts: Date.now() };
  var list = secList(kind), ix = list.indexOf(sec);
  var pg = secProgress(kind, sec.id);
  var focus = p.g !== undefined && p.g !== '' ? +p.g : -1;
  var h = '<div class="reader' + (RD.recall ? ' recall' : '') + '" data-kind="' + kind + '" data-id="' + sec.id + '">';

  h += '<div class="rd-head"><div class="rd-code">' + (sec.codes && sec.codes.length === 1 ? E(sec.codes[0]) + ' · ' : '') + E(sec.part) + '</div>' +
    '<h1>' + E(sec.title) + '</h1><div class="rd-meta">';
  if (sec.tier) h += '<span class="chip tier t' + sec.tier + '">' + starStr(sec.tier) + ' ' + TIER_LBL[sec.tier] + '</span>';
  if (sec.pyq) h += '<span class="chip">' + sec.pyq + ' PYQs</span>';
  if (sec.f27) h += '<span class="chip">~' + sec.f27 + ' in 2027</span>';
  h += '<span class="chip">' + svg('clock') + ' ' + readMins(sec) + ' min read</span></div>';
  if (sec.lede) h += '<p class="lede">' + NR(sec.lede) + '</p>';
  h += '<div class="rd-prog"><div class="bar"><i class="ok" style="width:' + pg.pct + '%"></i></div><span class="small muted">' + pg.read + '/' + pg.total + ' read</span></div>';
  h += '</div>';

  h += '<div class="rd-tools" role="toolbar" aria-label="Reader tools">' +
    '<button type="button" class="tchip' + (RD.recall ? ' on' : '') + '" data-act="rdRecall" aria-pressed="' + RD.recall + '">' + svg('eye') + 'Recall</button>' +
    (kind === 'n' ? '<button type="button" class="tchip' + (RD.traps ? ' on' : '') + '" data-act="rdTraps" aria-pressed="' + RD.traps + '">' + svg('warn') + 'Traps only</button>' : '') +
    '<button type="button" class="tchip" data-act="rdAll">' + svg('list') + 'Expand all</button>' +
    '<button type="button" class="tchip" data-act="rdNone">Collapse</button></div>';

  var shown = 0;
  sec.groups.forEach(function (g, gi) {
    var tr = kind === 'n' && RD.traps;
    if (tr && !hasTrap(g)) return;
    shown++;
    var open = focus >= 0 ? gi === focus : (shown === 1 || sec.groups.length === 1);
    var d = Store.d(), rd = !!((d.nr || {})[kind + ':' + sec.id] || {})[gi], sv = !!(d.nsave || {})[nkey(kind, sec.id, gi)];
    h += '<details class="grp' + (rd ? ' done' : '') + '" id="g' + gi + '" data-g="' + gi + '"' + (open ? ' open' : '') + '>' +
      '<summary><span class="gn">' + (gi + 1) + '</span><span class="gt">' + NR(g.title) + '</span>' +
      (hasTrap(g) ? '<span class="gi trapdot" title="contains traps">!</span>' : '') +
      '<span class="gi sv">' + (sv ? svg('star') : '') + '</span><span class="gi rd">' + (rd ? svg('check') : '') + '</span>' + svg('chev', 'gc') + '</summary>' +
      '<div class="gbody" data-fill="' + gi + '">' + (open ? groupBodyHtml(kind, sec.id, gi, tr) : '') + '</div></details>';
  });
  if (!shown) h += '<div class="empty">No trap-flagged statements in this section.</div>';

  /* practise + hand-offs */
  var codes = sec.codes || [];
  if (kind === 'n' && codes.length === 1) h += practiceCard(codes[0]);
  if (kind === 'n' && codes.length === 1) {
    var ds = DISTS.filter(function (x) { return x.code === codes[0]; });
    if (ds.length) {
      h += '<div class="card hb-links"><h3>Formula cards for this topic</h3><div class="chiprow wrapchips">' +
        ds.map(function (x) { return navBtn('chip link', E(x.name), 'dist', { id: x.id }); }).join('') + '</div></div>';
    }
    var tp = sectionsFor(TRAPS, codes[0]);
    var tl = tp.pri.concat(tp.rel);
    if (tl.length) {
      h += '<div class="card"><h3>Trap-compendium sections that cover ' + E(codes[0]) + '</h3><div class="chiprow wrapchips">' +
        tl.map(function (x) { return navBtn('chip link', E(x.id + ' · ' + x.title), 'read', { k: 't', id: x.id }); }).join('') + '</div></div>';
    }
  }
  h += '<div class="rd-pager">' +
    (ix > 0 ? navBtn('pg prev', svg('back') + '<span><small>Previous</small>' + E(list[ix - 1].title) + '</span>', 'read', { k: kind, id: list[ix - 1].id }) : '<span></span>') +
    (ix < list.length - 1 ? navBtn('pg next', '<span><small>Next</small>' + E(list[ix + 1].title) + '</span>' + svg('chev'), 'read', { k: kind, id: list[ix + 1].id }) : '<span></span>') +
    '</div></div>';
  return h;
};

/* group bodies are drawn when first opened: the longest sections hold 16 groups */
function fillGroup(det) {
  var body = det.querySelector('.gbody');
  if (!body || body.firstChild) return;
  var rd = det.closest('.reader');
  if (!rd) return;
  body.innerHTML = groupBodyHtml(rd.getAttribute('data-kind'), rd.getAttribute('data-id'), +det.getAttribute('data-g'), rd.getAttribute('data-kind') === 'n' && RD.traps);
}

/* --------------------------------------------------------- reader actions */
function readerClick(act, t) {
  var d = Store.d();
  switch (act) {
    case 'rdRecall': {
      var u = uiPrefs(); u.recall = !u.recall; Store.save();
      var r = app.querySelector('.reader'); if (r) r.classList.toggle('recall', u.recall);
      t.classList.toggle('on', u.recall); t.setAttribute('aria-pressed', String(u.recall));
      RD.recall = u.recall;
      toast(u.recall ? 'Recall mode: tap a blurred answer to reveal it.' : 'Recall mode off.');
      return true;
    }
    case 'rdTraps': RD.traps = !RD.traps; ROUTE.keep = true; render(); return true;
    case 'rdAll':
      Array.prototype.forEach.call(app.querySelectorAll('.reader details.grp'), function (x) { x.open = true; fillGroup(x); });
      return true;
    case 'rdNone':
      Array.prototype.forEach.call(app.querySelectorAll('.reader details.grp'), function (x) { x.open = false; });
      return true;
    case 'rdReveal':
      Array.prototype.forEach.call(app.querySelectorAll('.recall-on, .reader.recall'), function (x) { x.classList.remove('recall'); });
      return true;
    case 'grpRead': case 'grpSave': {
      var kind = t.getAttribute('data-k'), id = t.getAttribute('data-id'), gi = +t.getAttribute('data-g');
      var det = closest(t, 'details.grp');
      if (act === 'grpRead') {
        var key = kind + ':' + id;
        d.nr = d.nr || {}; var rec = d.nr[key] = d.nr[key] || {};
        if (rec[gi]) delete rec[gi]; else rec[gi] = Date.now();
        Store.save();
        var on = !!rec[gi];
        t.classList.toggle('on', on); t.lastChild.textContent = on ? 'Read' : 'Mark read';
        if (det) { det.classList.toggle('done', on); det.querySelector('.gi.rd').innerHTML = on ? svg('check') : ''; }
        var pg = secProgress(kind, id), bar = app.querySelector('.rd-prog');
        if (bar) { bar.querySelector('i').style.width = pg.pct + '%'; bar.querySelector('span').textContent = pg.read + '/' + pg.total + ' read'; }
        if (on && pg.read === pg.total) toast('Section finished. Take the practice set below while it is fresh.', { ms: 3600 });
      } else {
        var nk = nkey(kind, id, gi);
        d.nsave = d.nsave || {};
        var on2;
        if (d.nsave[nk]) { delete d.nsave[nk]; on2 = false; }
        else { d.nsave[nk] = Date.now(); srEnsure(nk); on2 = true; }
        Store.save();
        t.classList.toggle('on', on2); t.lastChild.textContent = on2 ? 'Saved' : 'Save for revision';
        if (det) det.querySelector('.gi.sv').innerHTML = on2 ? svg('star') : '';
        toast(on2 ? 'Saved. It will come back in your Revise queue.' : 'Removed from revision.');
      }
      return true;
    }
    case 'grpNext': {
      var gi2 = +t.getAttribute('data-g'), nx = app.querySelector('#g' + gi2), cur = closest(t, 'details.grp');
      if (cur) cur.open = false;
      if (nx) { nx.open = true; fillGroup(nx); nx.scrollIntoView({ block: 'start', behavior: uiPrefs().rm ? 'auto' : 'smooth' }); }
      return true;
    }
    case 'qref': qSheet(t.getAttribute('data-id')); return true;
    case 'openNote': {
      var q = { k: t.getAttribute('data-k') || 'n', id: t.getAttribute('data-id') };
      if (t.getAttribute('data-g')) q.g = t.getAttribute('data-g');
      closeSheet(true);
      go('read', q);
      return true;
    }
  }
  return false;
}

/* open groups fill lazily; blurred answers reveal on tap */
app.addEventListener('toggle', function (ev) {
  var d = ev.target;
  if (d && d.classList && d.classList.contains('grp') && d.open) fillGroup(d);
}, true);
app.addEventListener('click', function (ev) {
  var rd = closest(ev.target, '.reader.recall, .hbcard.recall, .deckcard.recall');
  if (!rd) return;
  var tgt = closest(ev.target, 'strong, .nb-tbl td, .hb-v, .rcv');
  if (tgt && !tgt.classList.contains('shown')) { tgt.classList.add('shown'); ev.preventDefault(); ev.stopPropagation(); }
}, true);

/* ------------------------------------------------------- PYQ in a sheet */
function qSheet(id) {
  var q = BY_ID[id];
  if (!q) { toast('That question is not in this build.'); return; }
  var bm = !!Store.d().bookmarks[id];
  var h = sheetHead(E(q.id), E(q.isForecast ? 'Forecast' : q.isNB ? 'ISS 2027 notes' : q.year ? 'PYQ ' + q.year : '')) + qMetaLine(q) + sharedStemHtml(q) +
    '<div class="qtext">' + qBody(q) + '</div>' +
    optionList(q, (q.options || []).map(function (x, i) { return i; }), null, { showAnswer: true, disabled: true }) +
    '<div class="btnrow mt"><button type="button" class="btn sm' + (bm ? ' on' : '') + '" data-act="sheetBm" data-qid="' + E(id) + '">' + svg('star') + (bm ? 'Bookmarked' : 'Bookmark') + '</button>' +
    '<button type="button" class="btn sm primary" data-act="study" data-qid="' + E(id) + '" data-back="back">Full solution</button></div>' +
    '<div class="reveal">' + (scorable(q) ? '<div class="pane"><div class="hd">Exam shortcut</div><div class="bd">' + R(q.examShortcut) + '</div></div>' : '') + '</div>';
  openSheet(h, 'tall');
}

/* ------------------------------------------- "what the notes say" for a question */
function nbNotesPane(q) {
  var refs = NOTE_REFS[q.id] || [], h = '', seen = {}, n = 0;
  refs.forEach(function (r) {
    var k = r.s + ':' + r.g;
    if (seen[k] || n >= 3) return;
    seen[k] = 1; n++;
    var sec = NOTE_BY[r.s], g = sec && sec.groups[r.g];
    if (!sec) return;
    h += '<li><button type="button" class="chip link" data-act="openNote" data-k="n" data-id="' + E(r.s) + '" data-g="' + r.g + '">' + E(sec.id + ' · ' + sec.title) + ' › ' + E(snippet(g.title, 40)) + '</button>' +
      '<div class="snip">' + E(snippet(r.x, 230)) + '</div></li>';
  });
  var code = q.topicCode, sec2 = code && NOTE_BY[code];
  var tp = code ? sectionsFor(TRAPS, code) : { pri: [], rel: [] };
  var links = '';
  if (sec2) links += '<button type="button" class="btn sm" data-act="openNote" data-k="n" data-id="' + E(code) + '">Notes: ' + E(sec2.title) + '</button>';
  tp.pri.concat(tp.rel).slice(0, 2).forEach(function (s) { links += '<button type="button" class="btn sm ghost" data-act="openNote" data-k="t" data-id="' + E(s.id) + '">Traps ' + E(s.id) + '</button>'; });
  if (q.nbBank === 'dh') {
    var m = /^DH-(?:R-)?(.+)-[a-z]+$/.exec(q.id), dd = m && DIST_BY[m[1]];
    if (dd) links += '<button type="button" class="btn sm" data-act="nav" data-r="dist" data-p="id=' + E(dd.id) + '">Handbook: ' + E(dd.name) + '</button>';
  }
  if (!h && !links) return '';
  return '<div class="pane"><div class="hd">In your notes</div><div class="bd small">' +
    (h ? '<ul class="nb-refs">' + h + '</ul>' : '') + (links ? '<div class="btnrow' + (h ? ' mt' : '') + '">' + links + '</div>' : '') + '</div></div>';
}

/* ------------------------------------------------------------ note search */
var NSEARCH = null;
function nsIndex() {
  if (NSEARCH) return NSEARCH;
  NSEARCH = [];
  [['n', NOTES], ['t', TRAPS]].forEach(function (pair) {
    pair[1].forEach(function (sec) {
      sec.groups.forEach(function (g, gi) {
        var parts = [sec.title, g.title, sec.lede || ''];
        g.blocks.forEach(function (b) {
          if (b.t === 'ul') b.items.forEach(function (i) { parts.push(i.x); });
          else if (b.t === 'table') { parts.push(b.head.join(' ')); b.rows.forEach(function (r) { parts.push(r.join(' ')); }); }
          else if (b.x) parts.push(b.x);
        });
        var txt = ML.strip(parts.join(' ').replace(/\*\*/g, '')).toLowerCase();
        NSEARCH.push({ k: pair[0], id: sec.id, gi: gi, title: sec.title, gt: g.title, txt: txt, code: (sec.codes || [])[0] || '' });
      });
    });
  });
  DISTS.forEach(function (d) {
    var parts = [d.name, d.title].concat(Object.keys(d.f).map(function (k) { return k + ' ' + d.f[k]; }), d.rel);
    NSEARCH.push({ k: 'd', id: d.id, gi: 0, title: d.name + ' distribution', gt: 'Formula card', txt: (d.name + ' ' + ML.strip(parts.join(' '))).toLowerCase(), code: d.code });
  });
  return NSEARCH;
}
var NQ = { q: '' };
V.nsearch = function () {
  var h = '<div class="pagehead"><h1>Search notes &amp; formulas</h1><p class="small muted">Finds a phrase in every notes group, trap statement and distribution card.</p></div>';
  h += '<label class="f srch"><input type="search" id="nsq" autocomplete="off" placeholder="e.g. negative binomial, Yule, Cauchy, Kolmogorov…" value="' + E(NQ.q) + '" data-act="nsInput"></label>';
  h += '<div id="nsres">' + nsResults() + '</div>';
  return h;
};
function nsResults() {
  var qq = NQ.q.trim().toLowerCase();
  if (qq.length < 2) return '<div class="empty">Type at least two letters.</div>';
  var terms = qq.split(/\s+/), hits = [];
  nsIndex().forEach(function (e) {
    var sc = 0;
    for (var i = 0; i < terms.length; i++) {
      var ix = e.txt.indexOf(terms[i]);
      if (ix < 0) return;
      sc += (e.title.toLowerCase().indexOf(terms[i]) >= 0 ? 6 : 0) + (e.gt.toLowerCase().indexOf(terms[i]) >= 0 ? 4 : 0) + 1;
    }
    hits.push({ e: e, sc: sc });
  });
  hits.sort(function (a, b) { return b.sc - a.sc; });
  if (!hits.length) return '<div class="empty">No match. Try a shorter word.</div>';
  var h = '<div class="small muted mb">' + hits.length + ' match' + (hits.length === 1 ? '' : 'es') + '</div><ul class="list nsl">';
  hits.slice(0, 40).forEach(function (x) {
    var e = x.e, at = e.txt.indexOf(terms[0]), from = Math.max(0, at - 50);
    var sn = e.txt.slice(from, from + 150);
    h += '<li><button type="button" class="nsrow" data-act="nsOpen" data-k="' + e.k + '" data-id="' + E(e.id) + '" data-g="' + e.gi + '">' +
      '<span class="top"><span class="chip ' + (e.k === 't' ? 'warn' : e.k === 'd' ? 'mark' : 'brand') + '">' + (e.k === 't' ? 'Trap' : e.k === 'd' ? 'Formula' : 'Notes') + '</span><b>' + E(e.title) + '</b></span>' +
      '<span class="small muted">' + E(e.gt.replace(/[$\\]/g, '')) + '</span><span class="snip">' + (from > 0 ? '…' : '') + E(sn) + '…</span></button></li>';
  });
  return h + '</ul>';
}

/* --------------------------------------------------- distribution handbook */
var DPROPS = [['par', 'Parameters'], ['support', 'Support'], ['pmf', 'PMF'], ['pdf', 'PDF'], ['cdf', 'CDF'], ['q', 'Quantile'],
              ['mean', 'Mean'], ['var', 'Variance'], ['median', 'Median'], ['mode', 'Mode'], ['skew', 'Skewness γ₁'],
              ['kurt', 'Kurtosis β₂'], ['exkurt', 'Excess kurtosis γ₂'], ['mom', 'Moments'],
              ['mgf', 'MGF'], ['cf', 'Characteristic function'], ['pgf', 'PGF']];
var DSECT = [['Definition', ['par', 'support', 'pmf', 'pdf', 'cdf', 'q']],
             ['Location, spread, shape', ['mean', 'var', 'median', 'mode', 'skew', 'kurt', 'exkurt', 'mom']],
             ['Generating functions', ['mgf', 'cf', 'pgf']]];
var DIST_ST = { f: 'all', q: '', view: 'list', props: ['mean', 'var'] };

function distName(d) { return d.name + (d.kind === 'd' ? '' : ''); }
function distKind(d) { return d.kind === 'd' ? 'Discrete' : 'Continuous'; }
function distRow(d) {
  return '<li><button type="button" class="drow" data-act="nav" data-r="dist" data-p="id=' + E(d.id) + '">' +
    '<span class="dn"><b>' + E(d.name) + '</b><span class="chip ' + (d.kind === 'd' ? 'brand' : 'mark') + '">' + distKind(d) + '</span>' +
    (d.src !== 'in-notes' ? '<span class="chip warn">added</span>' : '') + '</span>' +
    '<span class="dt2">' + R(d.title) + '</span>' +
    '<span class="dm"><span>mean ' + R(d.f.mean || '') + '</span><span>var ' + R(d.f.var || '') + '</span></span></button></li>';
}
function distFilter() {
  var q = DIST_ST.q.trim().toLowerCase();
  return DISTS.filter(function (d) {
    if (DIST_ST.f === 'd' && d.kind !== 'd') return false;
    if (DIST_ST.f === 'c' && d.kind !== 'c') return false;
    if (DIST_ST.f === 'x' && d.src === 'in-notes') return false;
    if (q && (d.name + ' ' + d.id + ' ' + ML.strip(d.title)).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function distListHtml() {
  var ds = distFilter();
  var h = '';
  if (DIST_ST.view === 'sheet') {
    h += '<div class="chiprow scrollchips" role="group" aria-label="Properties">';
    DPROPS.forEach(function (p) {
      if (p[0] === 'par' || p[0] === 'support') return;
      h += '<button type="button" class="tchip' + (DIST_ST.props.indexOf(p[0]) >= 0 ? ' on' : '') + '" data-act="dProp" data-p="' + p[0] + '">' + p[1] + '</button>';
    });
    h += '</div>';
    h += '<div class="tblwrap scroll sheetwrap"><table class="nb-tbl"><thead><tr><th class="fc">Law</th>';
    DIST_ST.props.forEach(function (k) { h += '<th>' + E(DPROPS.filter(function (p) { return p[0] === k; })[0][1]) + '</th>'; });
    h += '</tr></thead><tbody>';
    ds.forEach(function (d) {
      h += '<tr><th scope="row" class="fc"><button type="button" class="linkbtn" data-act="nav" data-r="dist" data-p="id=' + E(d.id) + '">' + E(d.name) + '</button></th>';
      DIST_ST.props.forEach(function (k) { h += '<td>' + (d.f[k] ? R(d.f[k]) : '<span class="muted">—</span>') + '</td>'; });
      h += '</tr>';
    });
    return h + '</tbody></table></div><p class="tiny muted">Pick up to four properties above. Tap a law to open its full card.</p>';
  }
  h += '<ul class="list dlist">' + ds.map(distRow).join('') + '</ul>';
  if (!ds.length) h += '<div class="empty">No distribution matches.</div>';
  return h;
}
V.dists = function () {
  var nExtra = DISTS.filter(function (d) { return d.src !== 'in-notes'; }).length;
  var h = '<div class="pagehead"><h1>Distribution handbook</h1><p class="small muted">' + DISTS.length + ' laws with PMF/PDF, CDF, mean, variance, median, mode, skewness, kurtosis, MGF, CF, PGF and the results examiners ask. ' + nExtra + ' are added beyond your notes so the syllabus list is complete.</p></div>';
  h += '<div class="seg" role="tablist"><button type="button" class="' + (DIST_ST.view === 'list' ? 'on' : '') + '" data-act="dView" data-v="list">Cards</button><button type="button" class="' + (DIST_ST.view === 'sheet' ? 'on' : '') + '" data-act="dView" data-v="sheet">Cheat sheet</button></div>';
  h += '<div class="chiprow scrollchips" role="group" aria-label="Filter">' +
    [['all', 'All ' + DISTS.length], ['d', 'Discrete'], ['c', 'Continuous'], ['x', 'Added']].map(function (f) {
      return '<button type="button" class="tchip' + (DIST_ST.f === f[0] ? ' on' : '') + '" data-act="dFilter" data-f="' + f[0] + '">' + f[1] + '</button>';
    }).join('') + '</div>';
  h += '<label class="f srch"><input type="search" id="dq" placeholder="Find a law…" value="' + E(DIST_ST.q) + '" data-act="dSearch"></label>';
  h += '<div id="dlistbox">' + distListHtml() + '</div>';
  h += '<div class="btnrow mt"><button type="button" class="btn primary" data-act="nbLaunch" data-bank="dh">' + svg('play') + 'Formula mock (' + (NB_BANK.dh ? NB_BANK.dh.n : 0) + ')</button>' +
    '<button type="button" class="btn" data-act="deckHb">' + svg('cards') + 'Flashcards</button></div>';
  return h;
};
V.dist = function (p) {
  var d = DIST_BY[p.id];
  if (!d) return '<div class="card"><h2>Not found</h2>' + navBtn('btn primary', 'Handbook', 'dists') + '</div>';
  var u = uiPrefs();
  Store.d().last = { r: 'dist', p: { id: d.id }, t: d.name, ts: Date.now() };
  var ix = DISTS.indexOf(d);
  var h = '<div class="hbcard' + (u.recall ? ' recall' : '') + '">';
  h += '<div class="rd-head"><div class="rd-code">' + E(distKind(d)) + ' law · ' + E(d.code) + '</div><h1>' + E(d.name) + '</h1>' +
    '<div class="hb-title">' + R(d.title) + '</div><div class="rd-meta">' +
    '<span class="chip ' + (d.src === 'in-notes' ? 'ok' : 'warn') + '">' + (d.src === 'in-notes' ? 'In your notes' : 'Added: standard result') + '</span>' +
    navBtn('chip link', E(d.code + ' · ' + topicName(d.code)), NOTE_BY[d.code] ? 'read' : 'topic', NOTE_BY[d.code] ? { k: 'n', id: d.code } : { c: d.code }) + '</div></div>';
  h += '<div class="rd-tools"><button type="button" class="tchip' + (u.recall ? ' on' : '') + '" data-act="hbRecall">' + svg('eye') + 'Recall</button>' +
    '<button type="button" class="tchip" data-act="nbLaunchDist" data-id="' + d.id + '">' + svg('play') + 'Quiz me</button></div>';
  DSECT.forEach(function (s) {
    var rows = s[1].filter(function (k) { return d.f[k]; });
    if (!rows.length) return;
    h += '<div class="card hb"><h3>' + s[0] + '</h3><dl>';
    rows.forEach(function (k) {
      var lab = DPROPS.filter(function (p2) { return p2[0] === k; })[0][1];
      h += '<div class="hbr"><dt>' + lab + '</dt><dd class="hb-v' + (k === 'par' || k === 'support' ? ' open' : '') + '">' + R(d.f[k]) + '</dd></div>';
    });
    h += '</dl></div>';
  });
  if (d.rel && d.rel.length) {
    h += '<div class="card hb"><h3>Remarks &amp; results to remember</h3><ul class="nb-ul">' + d.rel.map(function (x) { return '<li>' + R(x) + '</li>'; }).join('') + '</ul></div>';
  }
  h += '<div class="rd-pager">' +
    (ix > 0 ? navBtn('pg prev', svg('back') + '<span><small>Previous</small>' + E(DISTS[ix - 1].name) + '</span>', 'dist', { id: DISTS[ix - 1].id }) : '<span></span>') +
    (ix < DISTS.length - 1 ? navBtn('pg next', '<span><small>Next</small>' + E(DISTS[ix + 1].name) + '</span>' + svg('chev'), 'dist', { id: DISTS[ix + 1].id }) : '<span></span>') + '</div></div>';
  return h;
};

function handbookClick(act, t) {
  switch (act) {
    case 'dView': DIST_ST.view = t.getAttribute('data-v'); render(); return true;
    case 'dFilter': DIST_ST.f = t.getAttribute('data-f'); render(); return true;
    case 'dProp': {
      var k = t.getAttribute('data-p'), i = DIST_ST.props.indexOf(k);
      if (i >= 0) { if (DIST_ST.props.length > 1) DIST_ST.props.splice(i, 1); }
      else { DIST_ST.props.push(k); if (DIST_ST.props.length > 4) DIST_ST.props.shift(); }
      render(); return true;
    }
    case 'hbRecall': {
      var u = uiPrefs(); u.recall = !u.recall; Store.save();
      var c = app.querySelector('.hbcard'); if (c) c.classList.toggle('recall', u.recall);
      t.classList.toggle('on', u.recall);
      return true;
    }
    case 'nsOpen': {
      var kd = t.getAttribute('data-k');
      if (kd === 'd') go('dist', { id: t.getAttribute('data-id') });
      else go('read', { k: kd, id: t.getAttribute('data-id'), g: t.getAttribute('data-g') });
      return true;
    }
  }
  return false;
}
