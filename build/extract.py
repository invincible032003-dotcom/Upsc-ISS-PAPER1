#!/usr/bin/env python3
"""Phase 1 extraction: question-bank.csv -> normalized JSON, cross-validated
against the four topic-mined markdown files."""
import csv, re, json, os, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, 'build')

MINED = {
    'Probability':                             '01-PROBABILITY.md',
    'Statistical Methods':                     '02-STATISTICAL-METHODS.md',
    'Numerical Analysis':                      '03-NUMERICAL-ANALYSIS.md',
    'Computer Application and Data Processing':'04-COMPUTER-APPLICATIONS.md',
}

OPT_RE = re.compile(r'\(a\)(.*?)\(b\)(.*?)\(c\)(.*?)\(d\)(.*)$', re.S)

def norm_ws(s):
    return re.sub(r'\s+', ' ', s).strip()

def strip_trailing(s):
    s = norm_ws(s)
    s = re.sub(r'[\s]*$', '', s)
    return s

def parse_options(text):
    """Split trailing (a)..(b)..(c)..(d).. off a question string.
    Uses the LAST viable match so option letters occurring inside the stem
    (statement lists, matching tables) do not truncate the stem."""
    best = None
    for m in re.finditer(r'\(a\)', text):
        cand = OPT_RE.search(text, m.start())
        if cand and cand.start() == m.start():
            best = cand
    if not best:
        return None, None
    stem = text[:best.start()]
    opts = [strip_trailing(g) for g in best.groups()]
    return strip_trailing(stem), opts

# ---------------------------------------------------------------- mined index
def load_mined():
    idx = {}
    for part, fn in MINED.items():
        path = os.path.join(ROOT, fn)
        with open(path, encoding='utf-8') as fh:
            lines = fh.read().split('\n')
        cur_key = None
        cur_buf = []
        cur_sub = None
        subs = {}
        def flush():
            if cur_key:
                idx[cur_key] = {'part': part, 'raw': '\n'.join(cur_buf).strip(),
                                'subtopic_code': cur_sub}
        for ln in lines:
            m = re.match(r'^##\s+(P|S|N|C)(\d+)\s+—\s+(.*)$', ln)
            if m:
                cur_sub = (m.group(1) + m.group(2), m.group(3).strip())
            m = re.match(r'^\*\*\[(\d{4})\s*·\s*Q(\d+)\]\*\*\s*(.*)$', ln)
            if m:
                flush()
                cur_key = (int(m.group(1)), int(m.group(2)))
                cur_buf = [m.group(3)]
                continue
            if cur_key is not None:
                if ln.startswith('**[') or ln.startswith('## ') or ln.startswith('---') or ln.startswith('> **Shared stem'):
                    flush(); cur_key = None; cur_buf = []
                    m2 = re.match(r'^##\s+(P|S|N|C)(\d+)\s+—\s+(.*)$', ln)
                    if m2:
                        cur_sub = (m2.group(1)+m2.group(2), m2.group(3).strip())
                else:
                    cur_buf.append(ln)
        flush()
    return idx

def tokens(s):
    s = re.sub(r'[^a-z0-9]+', ' ', s.lower())
    return set(t for t in s.split() if len(t) > 2)

def main():
    mined = load_mined()
    rows = list(csv.DictReader(open(os.path.join(ROOT, 'question-bank.csv'), encoding='utf-8')))
    out, issues = [], []
    for r in rows:
        year = int(r['year']); qno = int(r['q_no'])
        qtext = r['question_text']
        stem, opts = parse_options(qtext)
        flags = []
        if opts is None:
            stem, opts = strip_trailing(qtext), []
            flags.append('MISSING_OPTIONS_IN_SOURCE')
        elif any(not o for o in opts):
            flags.append('EMPTY_OPTION_TEXT')
        m = mined.get((year, qno))
        if not m:
            flags.append('NOT_FOUND_IN_MINED_FILE')
        else:
            if m['part'] != r['part']:
                flags.append('PART_MISMATCH:%s' % m['part'])
            a, b = tokens(stem), tokens(m['raw'])
            if a and b:
                j = len(a & b) / len(a | b)
                if j < 0.45:
                    flags.append('LOW_TEXT_OVERLAP:%.2f' % j)
        rec = {
            'year': year, 'questionNumber': qno,
            'unit': r['part'],
            'topicCode': r['topic_code'], 'topic': r['topic_name'],
            'form': r['form'], 'answerType': r['answer_type'],
            'sourceConfidence': r['confidence'],
            'hasSharedStem': r['has_shared_stem'] == 'Y',
            'sharedStem': norm_ws(r['shared_stem']),
            'stem': stem, 'options': opts,
            'minedSubtopic': (m['subtopic_code'][1] if m and m['subtopic_code'] else None),
            'minedRaw': (m['raw'] if m else None),
            'flags': flags,
        }
        out.append(rec)
        if flags:
            issues.append((year, qno, flags))
    out.sort(key=lambda x: (x['year'], x['questionNumber']))
    with open(os.path.join(OUT, 'extracted.json'), 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print('extracted %d questions' % len(out))
    from collections import Counter
    c = Counter(q['year'] for q in out)
    for y in sorted(c): print('  %d: %d' % (y, c[y]))
    print('flagged: %d' % len(issues))
    for y, q, f in issues[:60]:
        print('   %d Q%-3d %s' % (y, q, ';'.join(f)))

if __name__ == '__main__':
    main()
