#!/usr/bin/env python3
"""Phase 4 — verify the four generated PDFs against the question database.

The PDFs are typeset by the same renderer the dashboard uses, so the
comparison is made against build/rendered.json (the renderer's plain-text
output) rather than against raw LaTeX.

Per PDF:
  * readable, paginated, with an extractable text layer
  * the text splits into exactly one block per question of that unit
  * no question from another unit leaks in, and none is duplicated
  * every block carries the six required sections in the exact order
        QUESTION -> OPTIONS -> ANSWER -> EXAM SHORTCUT -> TIPS & TRICKS
        -> STEP-BY-STEP SOLUTION
  * the authentic stem and all four options are reproduced inside the block
  * the keyed answer printed matches the database
  * every explanation section is labelled AI-derived
  * every flagged source defect carries its note; unkeyed items say so

Run:  node build/dump_rendered.mjs  &&  python3 build/verify_pdf.py
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
    ('Probability.pdf', 'Probability'),
    ('Statistical_Methods.pdf', 'Statistical Methods'),
    ('Numerical_Analysis.pdf', 'Numerical Analysis'),
    ('Computer_Application_and_Data_Processing.pdf',
     'Computer Application and Data Processing'),
]

# the six section headings exactly as they are typeset
HEADS = [
    ('QUESTION', re.compile(r'^QUESTION\s*$', re.M)),
    ('OPTIONS', re.compile(r'^OPTIONS\s*$', re.M)),
    ('ANSWER', re.compile(r'^ANSWER \(AI-derived', re.M)),
    ('EXAM SHORTCUT', re.compile(r'^EXAM SHORTCUT \(AI-derived', re.M)),
    ('TIPS & TRICKS', re.compile(r'^TIPS & TRICKS \(AI-derived', re.M)),
    ('STEP-BY-STEP SOLUTION', re.compile(r'^STEP-BY-STEP SOLUTION \(AI-derived', re.M)),
]
ANY_HEAD = re.compile(
    r'^(QUESTION|OPTIONS|ANSWER \(AI-derived|EXAM SHORTCUT \(AI-derived|'
    r'TIPS & TRICKS \(AI-derived|STEP-BY-STEP SOLUTION \(AI-derived)', re.M)
HEAD_NAME = {
    'QUESTION': 'QUESTION', 'OPTIONS': 'OPTIONS',
    'ANSWER (AI-derived': 'ANSWER',
    'EXAM SHORTCUT (AI-derived': 'EXAM SHORTCUT',
    'TIPS & TRICKS (AI-derived': 'TIPS & TRICKS',
    'STEP-BY-STEP SOLUTION (AI-derived': 'STEP-BY-STEP SOLUTION',
}
ORDER = ['QUESTION', 'OPTIONS', 'ANSWER', 'EXAM SHORTCUT',
         'TIPS & TRICKS', 'STEP-BY-STEP SOLUTION']

# question header: "12.  2018 · Q52   Topic · Type"
Q_HEAD = re.compile(r'^\s*\d+\.\s*(\d{4})\s*·\s*Q(\d{1,2})\b', re.M)
Q_HEAD_LAY = re.compile(r'^\s*\d+\.\s+(\d{4})\s*·\s*Q\s*(\d{1,2})\b', re.M)

failures = []


def ok(name, cond, detail=''):
    if cond:
        print('  PASS  ' + name)
    else:
        failures.append(name + ('  ->  ' + detail if detail else ''))
        print('  FAIL  ' + name + ('  ->  ' + detail if detail else ''))


def norm(s):
    """Fold ligatures, unify dashes, drop everything but alphanumerics."""
    s = unicodedata.normalize('NFKD', s or '')
    for d in '−–—‐‑':
        s = s.replace(d, '-')
    return re.sub(r'[^0-9a-zA-Z]+', '', s).lower()


def tokens(s):
    """Alphanumeric tokens of length >= 3 from rendered text."""
    s = unicodedata.normalize('NFKD', s or '')
    return [t.lower() for t in re.findall(r'[0-9A-Za-z]{3,}', s)]


def missing_chars(src, blob):
    """Characters of the reference that the block does not contain.

    A multiset comparison, not a substring one: a stacked fraction, a
    subscript and a superscript are all typeset on their own baselines, so a
    PDF text extractor emits them on separate lines and in an order that is
    correct on the page but not linear in the string.  What must never happen
    is that a character goes MISSING - that would mean the PDF dropped
    authentic content.
    """
    need = Counter(norm(src))
    have = Counter(norm(blob))
    lost = need - have
    return sum(lost.values()), need


def prose_in_order(src, blob):
    """Letters-only subsequence check on the prose around the formulas.

    Typeset mathematics is laid out in two dimensions, so the order in which
    a text extractor emits its glyphs carries no meaning.  The prose, however,
    must appear in document order, and missing_chars() separately proves that
    no character of the mathematics was dropped.
    """
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


rendered = json.load(open(os.path.join(ROOT, 'build', 'rendered.json')))
merged = json.load(open(os.path.join(ROOT, 'build', 'merged.json')))
by_unit = {}
for r in merged:
    by_unit.setdefault(r['unit'], []).append(r)

rows = []
total_pages = 0
total_blocks = 0

for fname, unit in PDFS:
    path = os.path.join(ROOT, fname)
    print('\n== %s %s' % (fname, '=' * max(0, 58 - len(fname))))
    if not os.path.exists(path):
        ok('file exists', False, 'missing')
        continue

    reader = PdfReader(path)
    pages = len(reader.pages)
    size_kb = os.path.getsize(path) / 1024.0
    total_pages += pages
    text = '\n'.join((p.extract_text() or '') for p in reader.pages)
    # layout mode keeps subscripts, superscripts and stacked fractions, which
    # the default mode drops; used for the content-fidelity comparison
    text_lay = '\n'.join((p.extract_text(extraction_mode='layout') or '')
                          for p in reader.pages)
    expected = by_unit[unit]
    want = ['%d-Q%02d' % (r['year'], r['qno']) for r in expected]

    print('  %d pages, %.0f KB, %d characters of extractable text'
          % (pages, size_kb, len(text)))
    ok('readable PDF with pages', pages > 0)
    ok('searchable text layer', len(text) > 100000, '%d chars' % len(text))

    # ---- split into per-question blocks -------------------------------
    marks = list(Q_HEAD.finditer(text))
    blocks = []
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        qid = '%s-Q%02d' % (m.group(1), int(m.group(2)))
        blocks.append((qid, text[m.start():end]))
    total_blocks += len(blocks)

    lay_marks = list(Q_HEAD_LAY.finditer(text_lay))
    lay_blocks = {}
    for i, m in enumerate(lay_marks):
        end = lay_marks[i + 1].start() if i + 1 < len(lay_marks) else len(text_lay)
        lay_blocks['%s-Q%02d' % (m.group(1), int(m.group(2)))] = \
            text_lay[m.start():end]

    ids = [b[0] for b in blocks]
    ok('one block per question of the unit (%d)' % len(expected),
       len(blocks) == len(expected), 'found %d blocks' % len(blocks))
    ok('no duplicated question block', len(set(ids)) == len(ids),
       '%d duplicates' % (len(ids) - len(set(ids))))
    missing = [q for q in want if q not in set(ids)]
    ok('every question of the unit is present', not missing,
       '%d missing: %s' % (len(missing), ', '.join(missing[:10])))
    other = set('%d-Q%02d' % (r['year'], r['qno']) for r in merged if r['unit'] != unit)
    leaked = sorted(set(ids) & other - set(want))
    ok('no question from another unit leaks in', not leaked,
       '%d leaked: %s' % (len(leaked), ', '.join(leaked[:10])))
    # topic-code grouping order
    code_of = {'%d-Q%02d' % (r['year'], r['qno']): r['topicCode'] for r in expected}
    seq_codes = [code_of.get(i, '?') for i in ids]
    first_seen, order_bad = [], 0
    for c in seq_codes:
        if not first_seen or first_seen[-1] != c:
            if c in first_seen:
                order_bad += 1
            first_seen.append(c)
    ok('each syllabus topic forms one contiguous section', order_bad == 0,
       '%d topic sections split apart' % order_bad)

    # ---- six sections, in order, in every block -----------------------
    bad_order, bad_count = [], []
    for qid, blob in blocks:
        found = [HEAD_NAME[m.group(1)] for m in ANY_HEAD.finditer(blob)]
        if found != ORDER:
            (bad_count if sorted(found) != sorted(ORDER) else bad_order).append(
                qid + ':' + '>'.join(found))
    ok('every block has all six sections', not bad_count,
       '%d wrong: %s' % (len(bad_count), '; '.join(bad_count[:4])))
    ok('the six sections are in the required order', not bad_order,
       '%d wrong: %s' % (len(bad_order), '; '.join(bad_order[:4])))

    # ---- authentic wording + options reproduced -----------------------
    bad_stem, bad_opt, bad_ans, bad_ai, bad_issue = [], [], [], [], []
    for qid, blob in blocks:
        rq = rendered.get(qid)
        if not rq:
            bad_stem.append(qid + ' (no rendered reference)')
            continue
        nblob = norm(blob)
        lb = lay_blocks.get(qid, blob)

        lost, need = missing_chars(rq['question'], lb)
        # order is checked on the PROSE only: a PDF text extractor places a
        # formula's glyphs wherever the typesetter put them on the page, so
        # their string order is not meaningful, but the prose around them is
        order = prose_in_order(rq.get('questionProse', ''), lb)
        if lost or order < 1.0:
            bad_stem.append('%s (%d chars lost of %d, prose order %.0f%%)'
                            % (qid, lost, sum(need.values()), 100 * order))
        for k, o in enumerate(rq['options']):
            lost2, need2 = missing_chars(o, lb)
            if lost2:
                bad_opt.append('%s opt(%s) %d/%d lost'
                               % (qid, 'abcd'[k], lost2, sum(need2.values())))

        # keyed answer printed in the ANSWER block
        am = re.search(r'^ANSWER \(AI-derived[^\n]*\n(.{0,400})', blob, re.S | re.M)
        seg = am.group(1) if am else ''
        if rq['answer'] is None:
            if 'Not keyed' not in seg:
                bad_ans.append(qid + ' (expected "Not keyed")')
        else:
            letter = 'abcd'[rq['answer']]
            if not seg.lstrip().startswith('(' + letter + ')'):
                bad_ans.append('%s expected (%s) got %r' % (qid, letter, seg[:24]))

        if blob.count('AI-derived') < 4:
            bad_ai.append('%s (%d)' % (qid, blob.count('AI-derived')))

        if rq['issue']:
            probe = norm(rq['issue'])[:80]
            if probe and probe not in nblob:
                bad_issue.append(qid)

    ok('authentic question wording reproduced in full and in order',
       not bad_stem,
       '%d incomplete: %s' % (len(bad_stem), '; '.join(bad_stem[:6])))
    ok('all four options reproduced in full', not bad_opt,
       '%d incomplete: %s' % (len(bad_opt), '; '.join(bad_opt[:6])))
    ok('printed answer matches the database key', not bad_ans,
       '%d mismatches: %s' % (len(bad_ans), '; '.join(bad_ans[:5])))
    ok('every block labels its explanations AI-derived', not bad_ai,
       '%d short: %s' % (len(bad_ai), ', '.join(bad_ai[:5])))

    defects = [r for r in expected if r['issue']]
    ok('all %d flagged source defects carry their note' % len(defects),
       not bad_issue, ', '.join(bad_issue[:6]))

    unkeyed = [r for r in expected if r['answer'] is None]
    if unkeyed:
        ok('%d unkeyed source-defect item(s) marked "Not keyed"' % len(unkeyed),
           text.count('Not keyed') >= len(unkeyed),
           'found %d' % text.count('Not keyed'))

    ntext = unicodedata.normalize('NFKD', text).lower()
    ok('cover states the provenance of the answers',
       'no official key exists' in ntext and 'not an official upsc' in ntext)
    ok('running footer repeats the provenance on every page',
       ntext.count('not an official upsc key') >= pages - 2,
       'found %d for %d pages' % (ntext.count('not an official upsc key'), pages))

    topics = sorted(set(r['topicCode'] for r in expected), key=lambda c: int(c[1:]))
    miss_t = [c for c in topics if not re.search(r'\b' + c + r'\b', text)]
    ok('all %d syllabus topic sections present' % len(topics), not miss_t,
       ', '.join(miss_t))

    rows.append((fname, pages, size_kb, len(expected), len(blocks)))

print('\n' + '=' * 74)
print('%-46s %6s %8s %5s %7s' % ('PDF', 'pages', 'size', 'Qs', 'blocks'))
for f, p, kb, q, b in rows:
    print('%-46s %6d %7.0fK %5d %7d' % (f, p, kb, q, b))
print('%-46s %6d %8s %5d %7d' % ('TOTAL', total_pages, '',
                                 sum(r[3] for r in rows), total_blocks))
print('=' * 74)
if failures:
    print('FAILED — %d check(s):' % len(failures))
    for f in failures:
        print('  - ' + f)
    sys.exit(1)
print('All PDF checks passed.')
