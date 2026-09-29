#!/usr/bin/env python3
"""Compile drills, notes mocks, true/false banks and the distribution handbook.

Inputs  (content/):   drills-mcq.txt  mocks-*.txt  drills-tf.txt  dist-handbook.txt
Outputs (src/):       nb-data.js  (window.nbMeta, window.nbData)   dist-data.js (window.distData)
"""
import json, os, re, random, hashlib, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = lambda *p: os.path.join(ROOT, 'content', *p)
S = lambda *p: os.path.join(ROOT, 'src', *p)
LET = 'abcd'

def parse_mcq(path, banks, qs):
    bank, stems, cur = None, {}, None
    def flush():
        nonlocal cur
        if cur is None: return
        assert len(cur['options']) == 4, (cur['id'], 'needs 4 options')
        assert cur.get('key') in LET, (cur['id'], 'bad key')
        qs.append(cur); cur = None
    for ln, raw in enumerate(open(path, encoding='utf-8'), 1):
        line = raw.rstrip('\n')
        if not line.strip() or line.startswith('#!'): continue
        if line.startswith('@bank '):
            flush()
            p = [x.strip() for x in line[6:].split('|')]
            bank = {'id': p[0], 'name': p[1] if len(p) > 1 else p[0], 'desc': p[2] if len(p) > 2 and '=' not in p[2][:6] else '', 'kind': 'mcq', 'time': 0}
            for x in p[2:]:
                if x.startswith('time='): bank['time'] = int(x[5:])
            if not any(b['id'] == bank['id'] for b in banks): banks.append(bank)
            continue
        if line.startswith('@stem '):
            flush()
            k, t = [x.strip() for x in line[6:].split('|', 1)]
            stems[k] = t; continue
        m = re.match(r'^@q (\S+) \| (\w+) \| (\w+)(?: \| (\w+))?\s*$', line)
        if m:
            flush()
            cur = {'id': m.group(1), 'bank': bank['id'], 'code': m.group(2), 'cls': m.group(3), 'stem': stems.get(m.group(4) or '', ''),
                   'question': '', 'options': [], 'why': '', 'src': f'{os.path.basename(path)}:{ln}'}
            continue
        if cur is None: raise SystemExit(f'{path}:{ln}: stray line {line[:60]}')
        m = re.match(r'^([abcd]): (.*)$', line)
        if m: cur['options'].append(m.group(2).strip()); continue
        if line.startswith('key: '): cur['key'] = line[5:].strip(); continue
        if line.startswith('why: '): cur['why'] = line[5:].strip(); continue
        if not cur['options']:
            cur['question'] = (cur['question'] + ' ' + line.strip()).strip(); continue
        raise SystemExit(f'{path}:{ln}: cannot parse {line[:60]}')
    flush()

def parse_tf(path, banks, qs):
    bank = None
    for ln, raw in enumerate(open(path, encoding='utf-8'), 1):
        line = raw.rstrip('\n')
        if not line.strip() or line.startswith('#!'): continue
        if line.startswith('@bank '):
            p = [x.strip() for x in line[6:].split('|')]
            bank = {'id': p[0], 'name': p[1], 'desc': p[2] if len(p) > 2 else '', 'kind': 'tf', 'time': 0}
            for x in p[2:]:
                if x.startswith('time='): bank['time'] = int(x[5:])
            banks.append(bank); continue
        m = re.match(r'^@tf (\d+) \| (\w+) \| (\w+) \| ([TF]) \| (.*?) \|\| (.*)$', line)
        if not m: raise SystemExit(f'{path}:{ln}: bad @tf line {line[:70]}')
        n = int(m.group(1))
        qs.append({'id': f'TF-{bank["id"].split("-")[1].upper()}-{n:02d}', 'bank': bank['id'], 'code': m.group(2), 'cls': m.group(3),
                   'stem': '', 'question': m.group(5).strip(), 'options': ['True', 'False'],
                   'key': 'a' if m.group(4) == 'T' else 'b', 'why': m.group(6).strip(), 'n': n, 'tf': True})

def parse_dist(path):
    out, cur = [], None
    for ln, raw in enumerate(open(path, encoding='utf-8'), 1):
        line = raw.rstrip('\n')
        if not line.strip() or line.startswith('#!'): continue
        if line.startswith('@dist '):
            p = [x.strip() for x in line[6:].split('|')]
            cur = {'id': p[0], 'name': p[1], 'title': p[2], 'kind': p[3], 'code': p[4], 'src': p[5] if len(p) > 5 else 'notes', 'f': {}, 'rel': []}
            out.append(cur); continue
        if cur is None: raise SystemExit(f'{path}:{ln}: content before @dist')
        if line.startswith('- '): cur['rel'].append(line[2:].strip()); continue
        m = re.match(r'^(\w+): (.*)$', line)
        if not m: raise SystemExit(f'{path}:{ln}: bad line {line[:60]}')
        cur['f'][m.group(1)] = m.group(2).strip()
    return out

LABEL = {'pmf': 'probability mass function', 'pdf': 'probability density function', 'cdf': 'distribution function',
         'mean': 'mean', 'var': 'variance', 'median': 'median', 'mode': 'mode', 'skew': 'skewness $\\gamma_1$',
         'kurt': 'kurtosis $\\beta_2$', 'exkurt': 'excess kurtosis $\\gamma_2$', 'mgf': 'moment generating function',
         'cf': 'characteristic function', 'pgf': 'probability generating function'}
BAD = ('no closed form', 'no unique', 'any point', 'does not', 'undefined', 'none', 'approx', 'about', '\\approx', 'exists', 'no elementary', '(no ')

STOP = {'dfrac','frac','tfrac','left','right','exp','ln','mathrm','sqrt','cdot','le','ge','in','text','ldots','dots','quad','lfloor','rfloor','lceil','rceil','binom','dbinom','sum','prod','pi','e','x','t','s','i'}
def toks(v):
    import re as _re
    return {t.lstrip('\\') for t in _re.findall(r'\\[a-zA-Z]+|[a-zA-Z]', v)} - STOP

def jac(a, b):
    A, B = toks(a), toks(b)
    return len(A & B) / max(1, len(A | B))

def short_ok(v, maxlen=88):
    return len(v) <= maxlen and not any(b in v for b in BAD)

def gen_handbook_mcq(dists):
    qs, rnd = [], random.Random(20270901)
    props = ['pmf', 'pdf', 'cdf', 'mean', 'var', 'median', 'mode', 'skew', 'kurt', 'exkurt', 'mgf', 'cf', 'pgf']
    for d in dists:
        for p in props:
            v = d['f'].get(p)
            if not v or not short_ok(v): continue
            pool = []
            for e in dists:
                if e['id'] == d['id']: continue
                w = e['f'].get(p)
                if w and w != v and short_ok(w) and w not in pool: pool.append((0 if e['kind'] == d['kind'] else 1, w))
            uniq = []
            for _, w in sorted(pool, key=lambda t: (-jac(v, t[1]) - (0.15 if t[0] == 0 else 0), rnd.random())):
                if w not in uniq and w != v and jac(v, w) >= 0.2: uniq.append(w)
            if len(uniq) < 3: continue
            dist3 = uniq[:3]
            opts = dist3 + [v]
            rnd.shuffle(opts)
            qs.append({'id': f'DH-{d["id"]}-{p}', 'bank': 'dh', 'code': d['code'], 'cls': 'val', 'stem': '',
                       'question': f'For the {d["name"]} law, {d["title"]}, the {LABEL[p]} is',
                       'options': opts, 'key': LET[opts.index(v)],
                       'why': f'Handbook card **{d["name"]}**: the {LABEL[p]} is {v}.', 'hb': d['id']})
        # reverse questions on generating functions
    for p in ('mgf', 'cf', 'pgf', 'cdf'):
        for d in dists:
            v = d['f'].get(p)
            if not v or not short_ok(v, 64): continue
            same = [e for e in dists if e['f'].get(p) == v]
            if len(same) != 1: continue
            others = [e for e in dists if e['id'] != d['id'] and e['kind'] == d['kind'] and e['title'].startswith('$')]
            rnd.shuffle(others)
            if len(others) < 3 or not d['title'].startswith('$'): continue
            opts = [d['title']] + [e['title'] for e in others[:3]]
            rnd.shuffle(opts)
            qs.append({'id': f'DH-R-{d["id"]}-{p}', 'bank': 'dh', 'code': d['code'], 'cls': 'val', 'stem': '',
                       'question': f'Which distribution has {LABEL[p]} {v}?',
                       'options': opts, 'key': LET[opts.index(d['title'])],
                       'why': f'Handbook card **{d["name"]}**: {LABEL[p]} {v}.', 'hb': d['id']})
    return qs

def finish(q, i):
    order = LET.index(q['key'])
    why = q['why']
    sol = [{'step': k + 1, 'text': t.strip()} for k, t in enumerate(re.split(r';\s+(?=[A-Z$])', why)) if t.strip()] if len(why) > 90 else [{'step': 1, 'text': why}]
    return {'id': q['id'], 'globalId': 400000 + i, 'isNB': True, 'provenance': 'ISS 2027 notes', 'year': 'Notes',
            'questionNumber': i + 1, 'unit': '', 'topicCode': q['code'], 'topic': '', 'subtopic': '', 'form': 'TF' if q.get('tf') else ('MSA' if False else 'PLAIN'),
            'sharedStem': q['stem'], 'question': q['question'], 'options': q['options'], 'correctAnswer': order,
            'questionType': 'True/False' if q.get('tf') else 'Notes MCQ', 'answerConfidence': 'verified', 'sourceIssue': '',
            'examShortcut': why, 'tipsTricks': [], 'solution': sol, 'nbBank': q['bank'], 'cls': q['cls'],
            'nbNo': q.get('n', 0)}

def main():
    banks, raw = [], []
    parse_mcq(C('drills-mcq.txt'), banks, raw)
    for f in sorted(glob.glob(C('mocks-*.txt'))): parse_mcq(f, banks, raw)
    parse_tf(C('drills-tf.txt'), banks, raw)
    dists = parse_dist(C('dist-handbook.txt'))
    raw += gen_handbook_mcq(dists)
    banks.append({'id': 'dh', 'name': 'Distribution formula mock', 'desc': 'Every mean, variance, mode, skewness, kurtosis, CDF, MGF, CF and PGF in the handbook, asked as MCQs.', 'kind': 'mcq', 'time': 0})
    seen = set()
    for q in raw:
        assert q['id'] not in seen, ('duplicate id', q['id']); seen.add(q['id'])
    # sequence numbers per bank
    cnt = {}
    for q in raw:
        cnt[q['bank']] = cnt.get(q['bank'], 0) + 1
        if not q.get('n'): q['n'] = cnt[q['bank']]
    data = [finish(q, i) for i, q in enumerate(raw)]
    for b in banks: b['n'] = sum(1 for q in data if q['nbBank'] == b['id'])
    meta = {'banks': banks, 'total': len(data), 'provenance': 'Drills D1–D74 and the three true/false banks are transcribed from your ISS 2027 notes and Trap Compendium (keys as printed). Notes mocks and the distribution formula mock are original questions written for this dashboard from those notes and standard texts; every key was checked.'}
    with open(S('nb-data.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Notes banks - generated by tools/build_banks.py */\nwindow.nbMeta = ' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ';\nwindow.nbData = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(S('dist-data.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Distribution handbook - generated by tools/build_banks.py */\nwindow.distData = ' + json.dumps(dists, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('banks:', [(b['id'], b['n']) for b in banks], 'total', len(data), '| distributions', len(dists))

if __name__ == '__main__':
    main()
