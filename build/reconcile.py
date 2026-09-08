#!/usr/bin/env python3
"""Phase 4 — cross-reconciliation.

Counts must agree at every stage of the pipeline:

    source CSV  ->  extracted.json  ->  answer bank  ->  merged.json
                ->  questions.js (window.quizData)  ->  the four PDFs

Also re-checks the two independent sources against each other (the cleaned
question bank and the four topic-mined markdown files) and prints the final
data audit table.
"""
import csv
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'build')

UNITS = ['Probability', 'Statistical Methods', 'Numerical Analysis',
         'Computer Application and Data Processing']
MINED = {
    'Probability': '01-PROBABILITY.md',
    'Statistical Methods': '02-STATISTICAL-METHODS.md',
    'Numerical Analysis': '03-NUMERICAL-ANALYSIS.md',
    'Computer Application and Data Processing': '04-COMPUTER-APPLICATIONS.md',
}
PDF_OF = {
    'Probability': 'Probability.pdf',
    'Statistical Methods': 'Statistical_Methods.pdf',
    'Numerical Analysis': 'Numerical_Analysis.pdf',
    'Computer Application and Data Processing':
        'Computer_Application_and_Data_Processing.pdf',
}

failures = []


def ok(name, cond, detail=''):
    print(('  PASS  ' if cond else '  FAIL  ') + name +
          ('  ->  ' + detail if detail and not cond else ''))
    if not cond:
        failures.append(name + ('  ->  ' + detail if detail else ''))


print('=' * 74)
print('PHASE 4 — CROSS-RECONCILIATION')
print('=' * 74)

# ---------------------------------------------------------------- stage 1
rows = list(csv.DictReader(open(os.path.join(ROOT, 'question-bank.csv'),
                                encoding='utf-8')))
csv_year = Counter(int(r['year']) for r in rows)
csv_part = Counter(r['part'] for r in rows)

# ---------------------------------------------------------------- stage 2
extracted = json.load(open(os.path.join(B, 'extracted.json')))
ex_year = Counter(q['year'] for q in extracted)
ex_unit = Counter(q['unit'] for q in extracted)

# ---------------------------------------------------------------- stage 3
import glob
answers = {}
dupes = 0
for path in sorted(glob.glob(os.path.join(B, 'answers', '*.json'))):
    for raw, rec in json.load(open(path)).items():
        m = re.match(r'^(\d{4})-Q0*(\d+)$', raw)
        qid = '%s-Q%02d' % (m.group(1), int(m.group(2)))
        if qid in answers:
            dupes += 1
        answers[qid] = rec

# ---------------------------------------------------------------- stage 4
merged = json.load(open(os.path.join(B, 'merged.json')))
mg_year = Counter(r['year'] for r in merged)
mg_unit = Counter(r['unit'] for r in merged)

# ---------------------------------------------------------------- stage 5
qjs = open(os.path.join(ROOT, 'questions.js'), encoding='utf-8').read()
m = re.search(r'window\.quizData = \[\n(.*?)\n\];\n', qjs, re.S)
data = json.loads('[' + m.group(1) + ']')
mf = re.search(r'window\.forecastData = \[\n(.*)\n\];\n?$', qjs, re.S)
fdata = json.loads('[' + mf.group(1) + ']') if mf else []
mfm = re.search(r'window\.forecastMeta = (\{.*?\});\n', qjs, re.S)
fmeta = json.loads(mfm.group(1)) if mfm else None
js_year = Counter(q['year'] for q in data)
js_unit = Counter(q['unit'] for q in data)

# ---------------------------------------------------------------- stage 6
pdf_summary = json.load(open(os.path.join(B, 'pdf-summary.json')))
pdf_unit = {s['unit']: s['questions'] for s in pdf_summary}

# ---------------------------------------------------------------- mined files
mined_counts = {}
for unit, fname in MINED.items():
    text = open(os.path.join(ROOT, fname), encoding='utf-8').read()
    ids = re.findall(r'^\*\*\[(\d{4})\s*·\s*Q(\d{1,2})\]\*\*', text, re.M)
    mined_counts[unit] = len(ids)

print('\n-- Stage counts per year ' + '-' * 48)
print('  %-6s %6s %6s %6s %6s %6s' %
      ('year', 'CSV', 'extr', 'ans', 'merged', 'js'))
years = sorted(csv_year)
for y in years:
    na = sum(1 for k in answers if k.startswith(str(y)))
    print('  %-6d %6d %6d %6d %6d %6d' %
          (y, csv_year[y], ex_year[y], na, mg_year[y], js_year[y]))
print('  %-6s %6d %6d %6d %6d %6d' %
      ('TOTAL', sum(csv_year.values()), sum(ex_year.values()), len(answers),
       len(merged), len(data)))

print('\n-- Stage counts per unit ' + '-' * 48)
print('  %-44s %6s %6s %6s %6s %6s' % ('unit', 'CSV', 'mined', 'extr', 'js', 'PDF'))
for u in UNITS:
    print('  %-44s %6d %6d %6d %6d %6d' %
          (u, csv_part[u], mined_counts[u], ex_unit[u], js_unit[u], pdf_unit[u]))
print('  %-44s %6d %6d %6d %6d %6d' %
      ('TOTAL', sum(csv_part.values()), sum(mined_counts.values()),
       sum(ex_unit.values()), sum(js_unit.values()), sum(pdf_unit.values())))

print('\n-- Reconciliation ' + '-' * 55)
ok('CSV and extracted.json agree per year',
   all(csv_year[y] == ex_year[y] for y in years))
ok('every extracted question has exactly one answer record',
   len(answers) == len(extracted) and dupes == 0,
   '%d answers, %d questions, %d duplicate ids' % (len(answers), len(extracted), dupes))
ok('merged.json matches the extraction', len(merged) == len(extracted))
ok('questions.js matches merged.json', len(data) == len(merged))
ok('the four PDFs together hold every question',
   sum(pdf_unit.values()) == len(data),
   '%d in PDFs vs %d in the database' % (sum(pdf_unit.values()), len(data)))
ok('per-unit counts agree across CSV, mined files, database and PDFs',
   all(csv_part[u] == mined_counts[u] == ex_unit[u] == js_unit[u] == pdf_unit[u]
       for u in UNITS))
ok('per-year counts agree across every stage',
   all(csv_year[y] == ex_year[y] == mg_year[y] == js_year[y] for y in years))
ok('80 questions in every paper', all(csv_year[y] == 80 for y in years),
   ', '.join('%d:%d' % (y, csv_year[y]) for y in years if csv_year[y] != 80))
ok('9 papers', len(years) == 9, str(years))

ids_js = set(q['id'] for q in data)
ok('question ids are unique in questions.js', len(ids_js) == len(data))
ok('question ids match merged.json exactly',
   ids_js == set(r['id'] for r in merged))

# ---------------------------------------------------------------- content
print('\n-- Content integrity ' + '-' * 52)
bad_opts = [q['id'] for q in data
            if (not q['options'] or len(q['options']) != 4) and not q['sourceIssue']]
ok('every question has four options or a source note', not bad_opts,
   ', '.join(bad_opts[:6]))
bad_key = [q['id'] for q in data
           if q['correctAnswer'] is None and not q['sourceIssue']]
ok('every question is keyed or carries a source note', not bad_key,
   ', '.join(bad_key[:6]))
bad_expl = [q['id'] for q in data
            if not q['examShortcut'] or not q['tipsTricks'] or not q['solution']]
ok('every question has a shortcut, tips and a solution', not bad_expl,
   ', '.join(bad_expl[:6]))
bad_cls = [q['id'] for q in data
           if q['unit'] not in UNITS or not q['topic'] or not q['subtopic']]
ok('every question is fully classified', not bad_cls, ', '.join(bad_cls[:6]))

# stem/option fidelity: questions.js must equal the CSV-derived extraction
csv_by_id = {}
for r in rows:
    csv_by_id['%s-Q%02d' % (r['year'], int(r['q_no']))] = r
drift = []
for q in data:
    ex = next(e for e in extracted
              if e['year'] == q['year'] and e['questionNumber'] == q['questionNumber'])
    if ex['stem'] != q['question']:
        drift.append(q['id'] + ' stem')
    if (ex['options'] or []) != (q['options'] or []):
        drift.append(q['id'] + ' options')
ok('no stem or option drift between extraction and questions.js', not drift,
   '%d drifted: %s' % (len(drift), ', '.join(drift[:6])))

# ---------------------------------------------------------------- audit table
print('\n-- Data audit ' + '-' * 59)
for y in years:
    print('  %d: %d' % (y, js_year[y]))
print('\n  TOTAL: %d\n' % len(data))
dup_ids = len(data) - len(ids_js)
norm_texts = Counter(re.sub(r'[^a-z0-9]', '', q['question'].lower()) for q in data)
dup_text = sum(1 for t, c in norm_texts.items() if c > 1 and len(t) > 40)
print('  Duplicates: %d (ids) / %d (near-identical question text)' % (dup_ids, dup_text))
print('  Missing options: %d' % sum(1 for q in data if not q['options']))
print('  Missing answers: %d' % sum(1 for q in data if q['correctAnswer'] is None))
print('  Missing solutions: %d' % sum(1 for q in data if not q['solution']))
print('  Missing shortcuts: %d' % sum(1 for q in data if not q['examShortcut']))
print('  Missing tips: %d' % sum(1 for q in data if not q['tipsTricks']))
print('  Classification issues: %d' % len(bad_cls))
print('  Source issues (flagged, preserved): %d'
      % sum(1 for q in data if q['sourceIssue']))
print('  Excluded from scoring (no valid option in source): %d'
      % sum(1 for q in data if q['correctAnswer'] is None))

# ======================================================================
#   FORECAST bank — separate, complete, and never mixed with the PYQs
# ======================================================================
if fmeta:
    fbank = json.load(open(os.path.join(B, 'forecast-merged.json'),
                           encoding='utf-8'))
    fsum = json.load(open(os.path.join(B, 'forecast-pdf-summary.json'),
                          encoding='utf-8'))
    print('\n-- Forecast bank (AI-GENERATED, not PYQ) -----------------------------')
    ok('forecast source bank matches questions.js',
       len(fbank['questions']) == len(fdata) == fmeta['total'],
       '%d / %d / %d' % (len(fbank['questions']), len(fdata), fmeta['total']))
    fids = set(q['id'] for q in fdata)
    ok('forecast ids are unique', len(fids) == len(fdata))
    ok('no id is shared with the authentic PYQ bank', not (fids & ids_js))
    ok('every forecast record is flagged isForecast',
       all(q.get('isForecast') for q in fdata))
    ok('no authentic record is flagged isForecast',
       not any(q.get('isForecast') for q in data))
    ok('every forecast record has 4 options and a key',
       all(len(q['options']) == 4 and q['correctAnswer'] in (0, 1, 2, 3)
           for q in fdata))
    ok('every forecast record has a shortcut, tips and a solution',
       all(q['examShortcut'] and q['tipsTricks'] and q['solution']
           for q in fdata))
    per_unit = Counter(q['unit'] for q in fdata)
    for u in sorted(per_unit):
        print('  %-22s %4d questions' % (u, per_unit[u]))
    used = Counter()
    for mk in fmeta['mocks']:
        used.update(mk['questionIds'])
    ok('every named mock holds exactly %d questions' % fmeta['mockSize'],
       all(mk['count'] == fmeta['mockSize'] and
           len(mk['questionIds']) == fmeta['mockSize'] for mk in fmeta['mocks']))
    ok('no forecast question is used twice across the mocks',
       all(c == 1 for c in used.values()))
    ok('the mocks cover the whole forecast bank',
       set(used) == fids, '%d of %d' % (len(used), len(fids)))
    ok('mock questions never cross units',
       all(all(next(q for q in fdata if q['id'] == i)['unit'] == mk['unit']
               for i in mk['questionIds']) for mk in fmeta['mocks']))
    pdf_total = sum(x['questions'] for x in fsum)
    ok('the two forecast PDFs carry the whole bank', pdf_total == len(fdata),
       '%d in PDFs vs %d in the bank' % (pdf_total, len(fdata)))
    for x in fsum:
        print('  %-34s %4d questions  %3d topics  %2d named mocks'
              % (x['file'], x['questions'], x['topics'], x['mocks']))

print('\n' + '=' * 74)
if failures:
    print('RECONCILIATION FAILED — %d check(s):' % len(failures))
    for f in failures:
        print('  - ' + f)
    sys.exit(1)
print('RECONCILIATION PASSED — every stage agrees.')
print('=' * 74)
