#!/usr/bin/env python3
"""Build the FORECAST question bank from build/forecast/*.txt.

The forecast bank is AI-GENERATED practice material for the 2027 attempt. It is
kept in its own files, its own records and its own globals, and every record is
stamped FORECAST / AI-GENERATED so it can never be confused with the 720
authentic PYQs.

Source format (one blank line between records):

    @ id | topic | subtopic
    Q question stem
    O option a
    O option b
    O option c
    O option d
    A b
    S exam shortcut (one line, ~30 second method)
    T tip
    T tip
    X solution step
    X solution step

A line that starts with a directive letter plus a space starts a new field; any
other non-empty line continues the field before it.

    python3 build/forecast_build.py            # validate, mathify, write JSON
    python3 build/forecast_build.py --raw      # skip the LaTeX conversion
"""
import glob
import json
import os
import re
import sys
from collections import Counter, OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mathify                                            # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'build', 'forecast')
OUT = os.path.join(ROOT, 'build', 'forecast-merged.json')

UNIT_OF_PREFIX = {'P': 'Probability', 'S': 'Statistical Methods'}
LETTERS = ['a', 'b', 'c', 'd']
MOCK_SIZE = 25

errors = []
warnings = []


def fail(msg):
    errors.append(msg)


# ==========================================================================
# 1.  parse
# ==========================================================================
def parse_file(path):
    recs = []
    cur = None
    field = None
    for lineno, raw in enumerate(open(path, encoding='utf-8'), 1):
        line = raw.rstrip('\n').rstrip()
        where = '%s:%d' % (os.path.basename(path), lineno)
        if not line.strip():
            field = None
            continue
        if line.startswith('#'):
            continue
        m = re.match(r'^([@QOASTX]) (.*)$', line)
        if m:
            tag, body = m.group(1), m.group(2).strip()
            if tag == '@':
                if cur:
                    recs.append(cur)
                bits = [b.strip() for b in body.split('|')]
                if len(bits) != 3:
                    fail('%s: @ line needs "id | topic | subtopic"' % where)
                    bits = (bits + ['', '', ''])[:3]
                cur = OrderedDict([
                    ('id', bits[0]), ('topic', bits[1]), ('subtopic', bits[2]),
                    ('question', ''), ('options', []), ('answerLetter', ''),
                    ('shortcut', ''), ('tips', []), ('solution', []),
                    ('where', where),
                ])
                field = None
                continue
            if cur is None:
                fail('%s: content before the first @ record' % where)
                continue
            if tag == 'Q':
                cur['question'] = body
                field = ('question', None)
            elif tag == 'O':
                cur['options'].append(body)
                field = ('options', len(cur['options']) - 1)
            elif tag == 'A':
                cur['answerLetter'] = body.strip().lower()
                field = None
            elif tag == 'S':
                cur['shortcut'] = body
                field = ('shortcut', None)
            elif tag == 'T':
                cur['tips'].append(body)
                field = ('tips', len(cur['tips']) - 1)
            elif tag == 'X':
                cur['solution'].append(body)
                field = ('solution', len(cur['solution']) - 1)
            continue
        # continuation line
        if cur is None or field is None:
            fail('%s: stray line %r' % (where, line[:50]))
            continue
        key, idx = field
        if idx is None:
            cur[key] = (cur[key] + ' ' + line.strip()).strip()
        else:
            cur[key][idx] = (cur[key][idx] + ' ' + line.strip()).strip()
    if cur:
        recs.append(cur)
    return recs


# ==========================================================================
# 2.  validate
# ==========================================================================
def validate(recs):
    seen_ids = {}
    seen_stems = {}
    for r in recs:
        w = r['where']
        rid = r['id']
        if not re.match(r'^F[PS]-\d{3}$', rid):
            fail('%s: id %r must look like FP-001 or FS-001' % (w, rid))
        if rid in seen_ids:
            fail('%s: duplicate id %s (first at %s)' % (w, rid, seen_ids[rid]))
        seen_ids[rid] = w
        if not r['question']:
            fail('%s [%s]: empty question' % (w, rid))
        key = re.sub(r'[^a-z0-9<>=+\-]', '', r['question'].lower())
        if key and key in seen_stems:
            fail('%s [%s]: stem duplicates %s' % (w, rid, seen_stems[key]))
        seen_stems[key] = rid
        if len(r['options']) != 4:
            fail('%s [%s]: %d option(s), need exactly 4'
                 % (w, rid, len(r['options'])))
        norm = [re.sub(r'\s+', '', o).lower() for o in r['options']]
        for i in range(len(norm)):
            for j in range(i + 1, len(norm)):
                if norm[i] and norm[i] == norm[j]:
                    fail('%s [%s]: options (%s) and (%s) are identical'
                         % (w, rid, LETTERS[i], LETTERS[j]))
        if r['answerLetter'] not in LETTERS:
            fail('%s [%s]: answer %r must be a, b, c or d'
                 % (w, rid, r['answerLetter']))
        if not r['shortcut']:
            fail('%s [%s]: no EXAM SHORTCUT' % (w, rid))
        if len(r['tips']) < 2:
            fail('%s [%s]: %d tip(s), need at least 2' % (w, rid, len(r['tips'])))
        if len(r['solution']) < 2:
            fail('%s [%s]: %d solution step(s), need at least 2'
                 % (w, rid, len(r['solution'])))
        if not r['topic'] or not r['subtopic']:
            fail('%s [%s]: topic/subtopic missing' % (w, rid))
        last = r['solution'][-1].lower() if r['solution'] else ''
        if r['answerLetter'] and '(%s)' % r['answerLetter'] not in last:
            warnings.append('%s: final solution step does not name option (%s)'
                            % (rid, r['answerLetter']))


# ==========================================================================
# 3.  named mocks - exactly 25, broad topic coverage, no repetition
# ==========================================================================
def build_mocks(recs, unit, label):
    """Deal the unit's questions into mocks of exactly MOCK_SIZE.

    Questions are dealt round-robin from the topic queues, largest queue first
    at every step, so each mock spreads across as many topics as the bank
    allows and no question is ever used twice.
    """
    pool = [r for r in recs if r['unit'] == unit]
    by_topic = OrderedDict()
    for r in pool:
        by_topic.setdefault(r['topic'], []).append(r)
    # inside a topic, spread the subtopics too
    for t in by_topic:
        by_sub = OrderedDict()
        for r in by_topic[t]:
            by_sub.setdefault(r['subtopic'], []).append(r)
        spread, queues = [], list(by_sub.values())
        while any(queues):
            for q in queues:
                if q:
                    spread.append(q.pop(0))
        by_topic[t] = spread

    n_mocks = len(pool) // MOCK_SIZE
    mocks = [[] for _ in range(n_mocks)]
    leftovers = []
    order = 0
    while any(by_topic.values()):
        topics = sorted(by_topic, key=lambda t: (-len(by_topic[t]), t))
        topics = [t for t in topics if by_topic[t]]
        if not topics:
            break
        r = by_topic[topics[0]].pop(0)
        placed = False
        for k in range(n_mocks):
            m = mocks[(order + k) % n_mocks] if n_mocks else None
            if m is not None and len(m) < MOCK_SIZE:
                m.append(r)
                order = (order + k + 1) % max(n_mocks, 1)
                placed = True
                break
        if not placed:
            leftovers.append(r)

    out = []
    for i, m in enumerate(mocks, 1):
        m.sort(key=lambda r: r['id'])
        out.append(OrderedDict([
            ('id', 'FM-%s-%02d' % ('P' if unit == 'Probability' else 'S', i)),
            ('name', '%s Forecast Mock %02d' % (label, i)),
            ('unit', unit),
            ('count', len(m)),
            ('topics', sorted({r['topic'] for r in m})),
            ('questionIds', [r['id'] for r in m]),
        ]))
    return out, leftovers


# ==========================================================================
# 4.  driver
# ==========================================================================
def main():
    raw = '--raw' in sys.argv
    files = sorted(glob.glob(os.path.join(SRC, '*.txt')))
    if not files:
        print('no forecast sources in build/forecast/')
        return 1
    recs = []
    for f in files:
        recs.extend(parse_file(f))
    validate(recs)

    for r in recs:
        r['unit'] = UNIT_OF_PREFIX.get(r['id'][1:2], '')
        if not r['unit']:
            fail('%s: cannot infer unit from id' % r['id'])

    if errors:
        print('FORECAST BUILD FAILED — %d error(s)' % len(errors))
        for e in errors[:60]:
            print('  ' + e)
        return 1

    # ---------------------------------------------------------- to LaTeX
    if not raw:
        for r in recs:
            r['question'] = mathify.convert(r['question'])
            r['options'] = [mathify.convert(o) for o in r['options']]
            r['shortcut'] = mathify.convert(r['shortcut'])
            r['tips'] = [mathify.convert(t) for t in r['tips']]
            r['solution'] = [mathify.convert(s) for s in r['solution']]

    for i, r in enumerate(sorted(recs, key=lambda x: x['id']), 1):
        r['n'] = i
        r['answer'] = LETTERS.index(r['answerLetter'])
        r.pop('where', None)

    recs.sort(key=lambda r: r['id'])

    prob_mocks, prob_left = build_mocks(recs, 'Probability', 'Probability')
    sm_mocks, sm_left = build_mocks(recs, 'Statistical Methods',
                                    'Statistical Methods')
    mocks = prob_mocks + sm_mocks
    for m in mocks:
        if m['count'] != MOCK_SIZE:
            fail('%s has %d questions, must be exactly %d'
                 % (m['name'], m['count'], MOCK_SIZE))
    used = Counter()
    for m in mocks:
        used.update(m['questionIds'])
    for qid, c in used.items():
        if c > 1:
            fail('%s appears in %d mocks' % (qid, c))
    if errors:
        print('FORECAST BUILD FAILED — %d error(s)' % len(errors))
        for e in errors[:40]:
            print('  ' + e)
        return 1

    data = OrderedDict([
        ('generated', True),
        ('provenance', 'FORECAST / AI-GENERATED. Not a previous-year question.'),
        ('total', len(recs)),
        ('mockSize', MOCK_SIZE),
        ('questions', recs),
        ('mocks', mocks),
    ])
    json.dump(data, open(OUT, 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    per_unit = Counter(r['unit'] for r in recs)
    print('forecast bank built — %d questions' % len(recs))
    for u in sorted(per_unit):
        left = len(prob_left) if u == 'Probability' else len(sm_left)
        n_m = len([m for m in mocks if m['unit'] == u])
        print('  %-20s %4d questions   %2d mocks x %d   %d unplaced'
              % (u, per_unit[u], n_m, MOCK_SIZE, left))
    topics = Counter((r['unit'], r['topic']) for r in recs)
    print('  topics: %d   subtopics: %d'
          % (len(topics), len({(r['unit'], r['subtopic']) for r in recs})))
    if warnings:
        print('  warnings: %d' % len(warnings))
        for w in warnings[:10]:
            print('    ' + w)
    print('  wrote %s' % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == '__main__':
    sys.exit(main())
