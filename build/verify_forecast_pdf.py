#!/usr/bin/env python3
"""Verify the two FORECAST PDFs against the forecast question bank.

The PDFs are typeset by the same renderer the dashboard uses, so the
comparison is made against build/forecast-rendered.json (the renderer's own
plain-text output) rather than against raw LaTeX.

Per PDF:
  * readable, paginated, with an extractable text layer
  * the text splits into exactly one block per forecast question of that unit
  * no question from the other unit leaks in, and none is duplicated
  * NO authentic PYQ id appears anywhere in the volume
  * every block carries the four required sections in the exact order
        QUESTION -> OPTIONS -> ANSWER -> EXAM SHORTCUT
  * the stem and all four options are reproduced inside the block
  * the printed answer letter and text match the database key
  * every block is stamped FORECAST, and the cover and the running footer
    both say the content is AI-generated and not a previous-year question

Run:  node build/dump_forecast_rendered.mjs && python3 build/verify_forecast_pdf.py
"""
import json
import os
import re
import sys
import unicodedata
from collections import Counter

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PDFS = [
    ('Probability_Forecast.pdf', 'Probability', 'FP'),
    ('Statistical_Methods_Forecast.pdf', 'Statistical Methods', 'FS'),
]

HEADS = [
    ('QUESTION', re.compile(r'^QUESTION\s*$', re.M)),
    ('OPTIONS', re.compile(r'^OPTIONS\s*$', re.M)),
    ('ANSWER', re.compile(r'^ANSWER \(AI-generated', re.M)),
    ('EXAM SHORTCUT', re.compile(r'^EXAM SHORTCUT \(AI-generated', re.M)),
]
ANY_HEAD = re.compile(
    r'^(QUESTION|OPTIONS|ANSWER \(AI-generated|EXAM SHORTCUT \(AI-generated)', re.M)
HEAD_NAME = {
    'QUESTION': 'QUESTION', 'OPTIONS': 'OPTIONS',
    'ANSWER (AI-generated': 'ANSWER',
    'EXAM SHORTCUT (AI-generated': 'EXAM SHORTCUT',
}
ORDER = ['QUESTION', 'OPTIONS', 'ANSWER', 'EXAM SHORTCUT']

# question header: "12.  FORECAST · FP-070   Subtopic"
Q_HEAD = re.compile(r'^\s*\d+\.\s*FORECAST\s*·\s*(F[PS]-\d{3})\b', re.M)
Q_HEAD_LAY = re.compile(r'^\s*\d+\.\s+FORECAST\s*·\s*(F[PS]\s*-\s*\d{3})\b', re.M)

failures = []


def ok(name, cond, detail=''):
    if cond:
        print('  PASS  ' + name)
    else:
        failures.append(name + ('  ->  ' + detail if detail else ''))
        print('  FAIL  ' + name + ('  ->  ' + detail if detail else ''))


def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    for d in '−–—‐‑':
        s = s.replace(d, '-')
    return re.sub(r'[^0-9a-zA-Z]+', '', s).lower()


def missing_chars(src, blob):
    """Characters of the reference that the block does not contain."""
    need = Counter(norm(src))
    have = Counter(norm(blob))
    lost = need - have
    return sum(lost.values()), need


def prose_in_order(src, blob):
    """Letters-only subsequence check on the prose around the formulas."""
    a = re.sub(r'[^a-z]', '', norm(src))
    b = re.sub(r'[^a-z]', '', norm(blob))
    if len(a) < 20:
        return 1.0
    i = 0
    for ch in b:
        if ch == a[i]:
            i += 1
            if i == len(a):
                return 1.0
    return i / float(len(a))


rpath = os.path.join(ROOT, 'build', 'forecast-rendered.json')
if not os.path.exists(rpath):
    print('build/forecast-rendered.json missing — run node build/dump_forecast_rendered.mjs')
    sys.exit(1)
rendered = json.load(open(rpath, encoding='utf-8'))
bank = json.load(open(os.path.join(ROOT, 'build', 'forecast-merged.json'),
                      encoding='utf-8'))
by_unit = {}
for r in bank['questions']:
    by_unit.setdefault(r['unit'], []).append(r)

rows = []
total_pages = 0
total_blocks = 0

for fname, unit, prefix in PDFS:
    path = os.path.join(ROOT, fname)
    print('\n== %s %s' % (fname, '=' * max(0, 54 - len(fname))))
    if not os.path.exists(path):
        ok('file exists', False, 'missing')
        continue

    reader = PdfReader(path)
    pages = len(reader.pages)
    size_kb = os.path.getsize(path) / 1024.0
    total_pages += pages
    text = '\n'.join((p.extract_text() or '') for p in reader.pages)
    text_lay = '\n'.join((p.extract_text(extraction_mode='layout') or '')
                         for p in reader.pages)
    expected = sorted(by_unit[unit], key=lambda r: r['id'])
    want = [r['id'] for r in expected]

    print('  %d pages, %.0f KB, %d characters of extractable text'
          % (pages, size_kb, len(text)))
    ok('readable PDF with pages', pages > 0)
    ok('searchable text layer', len(text) > 20000, '%d chars' % len(text))

    # ---- split into per-question blocks -------------------------------
    # Default extraction is used for the structural checks (it keeps the
    # section headings on their own lines); layout extraction is used for the
    # content-fidelity checks, because the default mode discards glyphs that
    # KaTeX positions off the baseline - subscripts, superscripts and the
    # numerator and denominator of a stacked fraction.
    starts = [(m.start(), m.group(1)) for m in Q_HEAD.finditer(text)]
    blocks = {}
    for i, (pos, qid) in enumerate(starts):
        end = starts[i + 1][0] if i + 1 < len(starts) else len(text)
        blocks.setdefault(qid, []).append(text[pos:end])

    lay_starts = [(m.start(), re.sub(r'\s+', '', m.group(1)))
                  for m in Q_HEAD_LAY.finditer(text_lay)]
    lay_blocks = {}
    for i, (pos, qid) in enumerate(lay_starts):
        end = lay_starts[i + 1][0] if i + 1 < len(lay_starts) else len(text_lay)
        lay_blocks[qid] = text_lay[pos:end]

    total_blocks += len(starts)
    ok('one block per forecast question of the unit (%d)' % len(want),
       len(starts) == len(want), 'found %d' % len(starts))
    dupes = [q for q, v in blocks.items() if len(v) > 1]
    ok('no duplicated question block', not dupes, ', '.join(dupes[:6]))
    absent = [q for q in want if q not in blocks]
    ok('every forecast question of the unit is present', not absent,
       ', '.join(absent[:6]))
    alien = [q for q in blocks if q not in want]
    ok('no question from the other unit leaks in', not alien,
       ', '.join(alien[:6]))

    # ------------------------------------------- no authentic PYQ inside
    pyq = set(re.findall(r'\b(20(?:1[89]|2[0-6]))\s*-\s*Q\d{1,2}\b', text))
    ok('no authentic PYQ id appears in this forecast volume', not pyq,
       ', '.join(sorted(pyq)[:5]))

    # -------------------------------------------------- per-question checks
    bad_sections, bad_order, bad_stem, bad_opts, bad_key, bad_stamp = \
        [], [], [], [], [], []
    for r in expected:
        qid = r['id']
        blk = blocks.get(qid, [''])[0]
        lay = lay_blocks.get(qid, blk)
        ref = rendered.get(qid)
        if ref is None:
            bad_stem.append(qid + ' (no rendered reference)')
            continue

        present = [name for name, rx in HEADS if rx.search(blk)]
        if len(present) != 4:
            bad_sections.append('%s missing %s' % (
                qid, ','.join(n for n, _ in HEADS if n not in present)))
        seq = [HEAD_NAME[m.group(1)] for m in ANY_HEAD.finditer(blk)]
        if seq != ORDER:
            bad_order.append('%s %s' % (qid, seq))

        lost, need = missing_chars(ref['question'], lay)
        if lost > 0:
            bad_stem.append('%s lost %d/%d chars' % (qid, lost, sum(need.values())))
        elif prose_in_order(ref['questionProse'], lay) < 0.995:
            bad_stem.append('%s prose out of order' % qid)

        for k, o in enumerate(ref['options']):
            lo, ne = missing_chars(o, lay)
            if lo > 0:
                bad_opts.append('%s option %s lost %d/%d'
                                % (qid, 'abcd'[k], lo, sum(ne.values())))

        letter = 'abcd'[r['answer']]
        if not re.search(r'\(\s*%s\s*\)' % letter, blk):
            bad_key.append('%s expected (%s)' % (qid, letter))
        else:
            lo, _ = missing_chars(ref['answerText'], lay)
            if lo > 0:
                bad_key.append('%s answer text lost %d chars' % (qid, lo))

        if 'FORECAST' not in blk:
            bad_stamp.append(qid)

    ok('every block has all four sections', not bad_sections,
       '; '.join(bad_sections[:4]))
    ok('the four sections are in the required order', not bad_order,
       '; '.join(bad_order[:3]))
    ok('question wording reproduced in full and in order', not bad_stem,
       '; '.join(bad_stem[:4]))
    ok('all four options reproduced in full', not bad_opts,
       '; '.join(bad_opts[:4]))
    ok('printed answer matches the database key', not bad_key,
       '; '.join(bad_key[:4]))
    ok('every block is stamped FORECAST', not bad_stamp,
       ', '.join(bad_stamp[:6]))

    # --------------------------------------------------------- provenance
    cover = reader.pages[0].extract_text() or ''
    ok('cover states that these are not previous-year questions',
       'not previous-year questions' in cover.lower()
       or 'These are not previous-year questions' in cover)
    ok('cover carries the AI-GENERATED stamp', 'AI-GENERATED' in cover)
    foot_pages = sum(1 for p in reader.pages
                     if 'FORECAST / AI-GENERATED' in (p.extract_text() or ''))
    ok('running footer repeats the provenance on every page',
       foot_pages == pages, '%d of %d pages' % (foot_pages, pages))
    ok('every named mock for this unit is listed',
       all(m['name'] in text for m in bank['mocks'] if m['unit'] == unit))

    rows.append((fname, pages, size_kb, len(want), len(starts)))

print('\n' + '=' * 74)
print('%-40s %6s %8s %5s %7s' % ('PDF', 'pages', 'size', 'Qs', 'blocks'))
for f, p, kb, q, b in rows:
    print('%-40s %6d %7.0fK %5d %7d' % (f, p, kb, q, b))
print('%-40s %6d %8s %5d %7d' % ('TOTAL', total_pages, '',
                                 sum(r[3] for r in rows), total_blocks))
print('=' * 74)

if failures:
    print('\n%d FORECAST PDF CHECK(S) FAILED' % len(failures))
    for f in failures:
        print('  - ' + f)
    sys.exit(1)
print('All forecast PDF checks passed.')
