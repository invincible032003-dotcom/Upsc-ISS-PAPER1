#!/usr/bin/env python3
"""Generate questions.js — the offline question database consumed by index.html.

Exposes three globals, all plain assignments (no modules, no fetch, no network):
    window.quizMeta   build metadata, unit/topic taxonomy, topic intelligence
    window.quizData   the 720 authentic PYQ records
    window.quizConfig default marking / timing configuration (kept separate
                      from the question data, per master prompt section 16)
"""
import json
import os
from collections import OrderedDict, Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'build')

SOURCE_FILES = {
    2018: 'STATISTICS-PAPER-1-2018-2.md',
    2019: 'STATS_P1_IESISS-2019.md',
    2020: 'STAT-1-IESISS-2020.md',
    2021: 'Statistics-I-2021.md',
    2022: 'Stat_I_2022.md',
    2023: 'STATISTICS-PAPER-I-2023.md',
    2024: 'STATISTICS-PAPER-I-2024.md',
    2025: 'QP-IES-ISS-25-STATISTICS-PAPER-I-2025.md',
    2026: 'UPSC ISS 2026 QP Stats 1 (1).md',
}

UNITS = [
    'Probability',
    'Statistical Methods',
    'Numerical Analysis',
    'Computer Application and Data Processing',
]
UNIT_SHORT = {
    'Probability': 'Probability',
    'Statistical Methods': 'Statistical Methods',
    'Numerical Analysis': 'Numerical Analysis',
    'Computer Application and Data Processing': 'Computer Application',
}

merged = json.load(open(os.path.join(B, 'merged.json')))
intel = json.load(open(os.path.join(B, 'topicintel.json')))
subs = json.load(open(os.path.join(B, 'subtopics.json')))

records = []
for i, r in enumerate(merged, 1):
    rec = OrderedDict()
    rec['id'] = r['id']
    rec['globalId'] = i
    rec['year'] = r['year']
    rec['questionNumber'] = r['qno']
    rec['unit'] = r['unit']
    rec['topicCode'] = r['topicCode']
    rec['topic'] = r['topic']
    rec['subtopic'] = subs[r['id']]
    rec['form'] = r['form']
    rec['sharedStem'] = r['sharedStem']
    rec['question'] = r['stem']
    rec['options'] = r['options'] or []
    rec['correctAnswer'] = r['answer']          # 0-based, null on source defect
    rec['questionType'] = r['type']
    rec['answerConfidence'] = r['confidence']
    rec['sourceIssue'] = r['issue']
    rec['examShortcut'] = r['shortcut']
    rec['tipsTricks'] = r['tips']
    rec['solution'] = [{'step': n, 'text': t}
                       for n, t in enumerate(r['solution'], 1)]
    rec['sourceYear'] = r['year']
    rec['sourceQuestionNumber'] = r['qno']
    rec['sourceFile'] = SOURCE_FILES[r['year']]
    records.append(rec)

# ------------------------------------------------------------------ taxonomy
years = sorted({r['year'] for r in records})
tax = OrderedDict()
for u in UNITS:
    topics = OrderedDict()
    for r in records:
        if r['unit'] != u:
            continue
        t = topics.setdefault(r['topic'], OrderedDict(
            [('code', r['topicCode']), ('count', 0), ('subtopics', {})]))
        t['count'] += 1
        t['subtopics'][r['subtopic']] = t['subtopics'].get(r['subtopic'], 0) + 1
    for t in topics.values():
        t['subtopics'] = OrderedDict(sorted(t['subtopics'].items()))
    tax[u] = OrderedDict([
        ('short', UNIT_SHORT[u]),
        ('count', sum(t['count'] for t in topics.values())),
        ('topics', OrderedDict(sorted(topics.items()))),
    ])

per_year = Counter(r['year'] for r in records)
per_year_unit = {}
for y in years:
    per_year_unit[y] = {u: sum(1 for r in records
                               if r['year'] == y and r['unit'] == u)
                        for u in UNITS}

meta = OrderedDict([
    ('title', 'UPSC ISS Statistics Paper-I (Objective) — Offline Mock Engine'),
    ('datasetVersion', '1.0'),
    ('totalQuestions', len(records)),
    ('years', years),
    ('units', UNITS),
    ('perYear', {str(y): per_year[y] for y in years}),
    ('perYearUnit', {str(y): per_year_unit[y] for y in years}),
    ('sourceFiles', {str(y): SOURCE_FILES[y] for y in years}),
    ('taxonomy', tax),
    ('topicIntel', intel),
    ('provenance', OrderedDict([
        ('questions',
         'AUTHENTIC. Every question stem and every option is reproduced verbatim '
         'from the nine uploaded UPSC ISS Statistics Paper-I booklets (2018-2026). '
         'Wording, option text and option order are unaltered; original question '
         'numbers and paper order are preserved.'),
        ('answers',
         'AI-DERIVED. None of the nine source booklets carried an official UPSC '
         'answer key. Every correct answer in this database was worked out and '
         'independently re-verified during the build. They are study aids, not '
         'official keys.'),
        ('explanations',
         'AI-DERIVED EXPLANATION. Every Exam Shortcut, Tips & Tricks entry and '
         'Step-by-Step Solution was written for this project. None is an official '
         'UPSC solution.'),
        ('classification',
         'Unit and topic are taken from the official syllabus taxonomy and the '
         'four topic-mined source files. Subtopic (syllabus concept) is derived '
         'by matching each question against phrases taken verbatim from the '
         'official syllabus text.'),
        ('syntheticQuestions',
         'NONE. This build contains no AI-generated practice questions. Every one '
         'of the 720 items is an authentic PYQ.'),
    ])),
])

config = OrderedDict([
    ('_note',
     'Marking and timing are configuration, not question data. The source '
     'booklets supplied to this build did not state a marking scheme or a paper '
     'duration, so nothing here is claimed to be official. Change these values '
     'in Settings; they are persisted in local storage.'),
    ('marksCorrect', 1),
    ('marksIncorrect', 0),
    ('marksUnanswered', 0),
    ('negativeMarkingEnabled', False),
    ('negativeMarkFraction', 0.3333),
    ('defaultMinutesPerQuestion', 1.5),
    ('fullPaperMinutes', 120),
    ('markingSchemeIsOfficial', False),
    ('durationIsOfficial', False),
])

out = os.path.join(ROOT, 'questions.js')
with open(out, 'w', encoding='utf-8') as fh:
    fh.write('/* questions.js — UPSC ISS Statistics Paper-I offline question bank\n')
    fh.write(' * 720 authentic PYQs, 2018-2026 (80 per year x 9 papers).\n')
    fh.write(' * Plain global assignments only: no modules, no fetch, no network.\n')
    fh.write(' * Loaded by index.html with a normal <script src> tag under file://\n')
    fh.write(' */\n')
    fh.write('window.quizMeta = ')
    fh.write(json.dumps(meta, ensure_ascii=False, indent=1))
    fh.write(';\n\n')
    fh.write('window.quizConfig = ')
    fh.write(json.dumps(config, ensure_ascii=False, indent=1))
    fh.write(';\n\n')
    fh.write('window.quizData = [\n')
    for i, rec in enumerate(records):
        fh.write(json.dumps(rec, ensure_ascii=False, separators=(',', ':')))
        fh.write(',\n' if i < len(records) - 1 else '\n')
    fh.write('];\n')

size = os.path.getsize(out)
print('wrote %s' % out)
print('  records   : %d' % len(records))
print('  size      : %.2f MB' % (size / 1048576.0))
print('  units     : %d' % len(tax))
print('  topics    : %d' % sum(len(v['topics']) for v in tax.values()))
print('  subtopics : %d' % len({r['subtopic'] for r in records}))
print('  years     : %s' % ', '.join(str(y) for y in years))
