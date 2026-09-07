#!/usr/bin/env python3
"""Phase 1 QC pass: reconcile extracted PYQs against the authored answer bank.

Writes build/merged.json (the single source of truth for Phases 2 and 3) and
prints a Data Audit report.  Exits non-zero if any blocking defect is found.
"""
import json
import glob
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'build')

UNITS = [
    'Probability',
    'Statistical Methods',
    'Numerical Analysis',
    'Computer Application and Data Processing',
]
VALID_TYPES = {'Numerical', 'Conceptual', 'Theoretical', 'Factual', 'Definition'}
VALID_CONF = {'high', 'medium', 'source-defect'}

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


# ---------------------------------------------------------------- load inputs
questions = json.load(open(os.path.join(B, 'extracted.json')))

def canon(qid):
    """Normalise 2018-Q1 / 2018-Q01 to the canonical zero-padded form."""
    m = re.match(r'^(\d{4})-Q0*(\d+)$', qid)
    if not m:
        err('malformed answer id %r' % qid)
        return qid
    return '%s-Q%02d' % (m.group(1), int(m.group(2)))


answers = {}
for path in sorted(glob.glob(os.path.join(B, 'answers', '*.json'))):
    part = json.load(open(path))
    for raw, rec in part.items():
        qid = canon(raw)
        if qid in answers:
            err('duplicate answer id %s (second occurrence in %s)'
                % (qid, os.path.basename(path)))
        answers[qid] = rec

# ---------------------------------------------------------- structural checks
seen = set()
for q in questions:
    qid = '%d-Q%02d' % (q['year'], q['questionNumber'])
    if qid in seen:
        err('duplicate question id %s' % qid)
    seen.add(qid)

missing = sorted(seen - set(answers))
extra = sorted(set(answers) - seen)
for qid in missing:
    err('no answer record for %s' % qid)
for qid in extra:
    err('answer record %s has no matching question' % qid)

# ------------------------------------------------------------- per-item audit
merged = []
defects = []
by_year = Counter()
by_unit = Counter()
by_topic = Counter()
by_type = Counter()
by_conf = Counter()
answer_dist = Counter()
year_unit = defaultdict(Counter)

for q in questions:
    qid = '%d-Q%02d' % (q['year'], q['questionNumber'])
    a = answers.get(qid)
    if a is None:
        continue

    # --- question-side integrity
    if not q['stem'] or len(q['stem']) < 5:
        err('%s: stem missing or too short' % qid)
    opts = q['options'] or None
    if opts is None:
        if a.get('confidence') != 'source-defect':
            err('%s: options missing but not flagged as source-defect' % qid)
    else:
        if len(opts) != 4:
            err('%s: %d options (expected 4)' % (qid, len(opts)))
        for i, o in enumerate(opts):
            if not o or not o.strip():
                err('%s: option %s is empty' % (qid, 'abcd'[i]))
        if len(set(o.strip() for o in opts)) != 4:
            warn('%s: duplicate option text' % qid)

    # --- classification
    if q['unit'] not in UNITS:
        err('%s: unknown unit %r' % (qid, q['unit']))
    if not q['topic']:
        err('%s: missing topic classification' % qid)

    # --- answer-side integrity
    ans = a.get('answer')
    conf = a.get('confidence')
    if conf not in VALID_CONF:
        err('%s: bad confidence %r' % (qid, conf))
    if ans is None:
        if conf != 'source-defect':
            err('%s: null answer without source-defect confidence' % qid)
        if not a.get('issue'):
            err('%s: null answer without an issue note' % qid)
    else:
        if not isinstance(ans, int) or not 0 <= ans <= 3:
            err('%s: answer index %r out of range' % (qid, ans))
        elif opts is None:
            err('%s: answer index given but options missing' % qid)
        answer_dist['abcd'[ans]] += 1

    if a.get('type') not in VALID_TYPES:
        err('%s: bad type %r' % (qid, a.get('type')))

    sc = a.get('shortcut')
    if not sc or len(sc) < 30:
        err('%s: shortcut missing or too short' % qid)

    tips = a.get('tips')
    if not isinstance(tips, list) or len(tips) < 3:
        err('%s: needs at least 3 tips (found %r)' %
            (qid, len(tips) if isinstance(tips, list) else tips))
    else:
        for t in tips:
            if not t or len(t) < 20:
                err('%s: tip too short: %r' % (qid, t))

    sol = a.get('solution')
    if not isinstance(sol, list) or len(sol) < 3:
        err('%s: needs at least 3 solution steps (found %r)' %
            (qid, len(sol) if isinstance(sol, list) else sol))
    else:
        for s in sol:
            if not s or len(s) < 12:
                err('%s: solution step too short: %r' % (qid, s))
        last = sol[-1].lower()
        if ans is not None:
            letter = 'abcd'[ans]
            if ('(%s)' % letter) not in last:
                err('%s: final solution step does not name option (%s): %r'
                    % (qid, letter, sol[-1][:90]))
        else:
            if 'defect' not in last.lower() and 'no option' not in last.lower():
                warn('%s: source-defect item final step: %r' % (qid, last[:90]))

    if conf == 'source-defect' or a.get('issue'):
        defects.append((qid, q['unit'], a.get('issue', '')))

    by_year[q['year']] += 1
    by_unit[q['unit']] += 1
    by_topic[(q['unit'], q['topic'])] += 1
    by_type[a.get('type')] += 1
    by_conf[conf] += 1
    year_unit[q['year']][q['unit']] += 1

    merged.append({
        'id': qid,
        'year': q['year'],
        'qno': q['questionNumber'],
        'unit': q['unit'],
        'topicCode': q['topicCode'],
        'topic': q['topic'],
        'subtopic': q.get('minedSubtopic') or q['topic'],
        'form': q['form'],
        'sharedStem': q['sharedStem'] or '',
        'stem': q['stem'],
        'options': opts,
        'answer': ans,
        'confidence': conf,
        'type': a.get('type'),
        'issue': a.get('issue', ''),
        'shortcut': sc,
        'tips': tips,
        'solution': sol,
    })

merged.sort(key=lambda r: (r['year'], r['qno']))

# ------------------------------------------------------------------- report
out = []
w = out.append
w('=' * 72)
w('UPSC ISS STATISTICS PAPER-I  --  PHASE 1 DATA AUDIT')
w('=' * 72)
w('')
w('TOTAL AUTHENTIC PYQs EXTRACTED : %d' % len(questions))
w('TOTAL ANSWER RECORDS AUTHORED  : %d' % len(answers))
w('TOTAL MERGED RECORDS           : %d' % len(merged))
w('')
w('-- Per-year counts ' + '-' * 53)
for y in sorted(by_year):
    row = year_unit[y]
    w('  %d : %2d questions   (Prob %2d | Stat %2d | Num %2d | Comp %2d)'
      % (y, by_year[y], row['Probability'], row['Statistical Methods'],
         row['Numerical Analysis'],
         row['Computer Application and Data Processing']))
w('  %s' % ('-' * 66))
w('  ALL  : %d questions' % sum(by_year.values()))
w('')
w('-- Per-unit counts ' + '-' * 53)
for u in UNITS:
    w('  %-45s %3d' % (u, by_unit[u]))
w('  %-45s %3d' % ('TOTAL', sum(by_unit.values())))
w('')
w('-- Subtopic coverage (%d distinct syllabus topics) %s'
  % (len(by_topic), '-' * 18))
for u in UNITS:
    w('  [%s]' % u)
    for (uu, t), n in sorted(by_topic.items()):
        if uu == u:
            w('      %-62s %3d' % (t[:62], n))
w('')
w('-- Question-type mix ' + '-' * 51)
for t, n in by_type.most_common():
    w('  %-14s %3d  (%.1f%%)' % (t, n, 100.0 * n / len(merged)))
w('')
w('-- Answer-key distribution ' + '-' * 45)
tot = sum(answer_dist.values())
for k in 'abcd':
    w('  option (%s) : %3d  (%.1f%%)' % (k, answer_dist[k],
                                         100.0 * answer_dist[k] / tot))
w('  keyed      : %3d' % tot)
w('  unkeyed    : %3d  (source defects, excluded from scoring)'
  % (len(merged) - tot))
w('')
w('-- Confidence ' + '-' * 58)
for c, n in by_conf.most_common():
    w('  %-15s %3d' % (c, n))
w('')
w('-- Flagged source defects / caveats (%d) %s' % (len(defects), '-' * 28))
for qid, unit, issue in defects:
    w('  %s [%s]' % (qid, unit))
    w('      %s' % (issue[:200] if issue else '(no note)'))
w('')
w('-- Shared-stem groups ' + '-' * 50)
shared = sum(1 for r in merged if r['sharedStem'])
w('  questions carrying a shared stem : %d' % shared)
w('')
w('-- Validation result ' + '-' * 51)
w('  blocking errors : %d' % len(errors))
w('  warnings        : %d' % len(warnings))
for e in errors[:80]:
    w('  ERROR   %s' % e)
if len(errors) > 80:
    w('  ... and %d more errors' % (len(errors) - 80))
for x in warnings[:40]:
    w('  WARNING %s' % x)
if len(warnings) > 40:
    w('  ... and %d more warnings' % (len(warnings) - 40))
w('')
w('=' * 72)

report = '\n'.join(out)
print(report)

with open(os.path.join(B, 'merged.json'), 'w') as fh:
    json.dump(merged, fh, ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, 'DATA-AUDIT.txt'), 'w') as fh:
    fh.write(report + '\n')

sys.exit(1 if errors else 0)
