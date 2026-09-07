#!/usr/bin/env python3
"""Extract per-topic 'Examiner's pattern' and 'Must-know' intelligence from the
four topic-mined markdown files.  Output: build/topicintel.json keyed by topic
code (P1..P13, S1..S14, N1..N8, C1..C10)."""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [
    '01-PROBABILITY.md',
    '02-STATISTICAL-METHODS.md',
    '03-NUMERICAL-ANALYSIS.md',
    '04-COMPUTER-APPLICATIONS.md',
]

HEAD = re.compile(r'^##\s+([PSNC]\d+)\s+[-—]\s+(.+?)\s*$')
WEIGHT = re.compile(r'^\*\*Weight:\*\*\s*(.+?)\s*$')
PATTERN = re.compile(r"^\*\*Examiner's pattern\.\*\*\s*(.+?)\s*$")
MUSTKNOW = re.compile(r'^\*\*Must-know\.\*\*\s*(.+?)\s*$')

intel = {}
for fname in FILES:
    code = None
    for line in open(os.path.join(ROOT, fname), encoding='utf-8'):
        line = line.rstrip('\n')
        m = HEAD.match(line)
        if m:
            code = m.group(1)
            intel[code] = {'code': code, 'name': m.group(2), 'weight': '',
                           'pattern': '', 'mustKnow': ''}
            continue
        if not code:
            continue
        m = WEIGHT.match(line)
        if m and not intel[code]['weight']:
            intel[code]['weight'] = re.sub(r'\*\*', '', m.group(1))
            continue
        m = PATTERN.match(line)
        if m and not intel[code]['pattern']:
            intel[code]['pattern'] = re.sub(r'\*\*|\*', '', m.group(1))
            continue
        m = MUSTKNOW.match(line)
        if m and not intel[code]['mustKnow']:
            intel[code]['mustKnow'] = re.sub(r'\*\*|\*', '', m.group(1))

with open(os.path.join(ROOT, 'build', 'topicintel.json'), 'w') as fh:
    json.dump(intel, fh, ensure_ascii=False, indent=1)

full = sum(1 for v in intel.values() if v['pattern'] and v['mustKnow'])
print('topic codes captured : %d' % len(intel))
print('with pattern+mustKnow: %d' % full)
for c in sorted(intel, key=lambda s: (s[0], int(s[1:]))):
    v = intel[c]
    print('  %-4s %-62s pat=%d mk=%d' %
          (c, v['name'][:62], len(v['pattern']), len(v['mustKnow'])))
