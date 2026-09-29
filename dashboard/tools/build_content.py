#!/usr/bin/env python3
"""Compile the hand-transcribed note sources in content/*.txt into JS data.

Authoring format (one directive per line, blank lines ignored):

  @sec ID | Title | Part            start a section (a chapter in the Notes tab)
  @meta key=value key=value          codes=P6,P7 pyq=40 f27=4.8 tier=1 src=notes|traps
  @lede text                         lede paragraph shown above the section
  @grp Title                         start a fold-out group inside the section
  - text                             bullet
  -! text                            bullet flagged TRAP
  -* text                            bullet flagged KEY / high-yield
  .p text                            paragraph
  .trap text                         standalone TRAP callout paragraph
  .key text                          standalone KEY callout paragraph
  .fig id                            named diagram drawn by the app (e.g. conv)
  .launch bank | label               button that starts a practice bank
  | a | b | c |                      table row (first row = header, `|---|` optional)
  $$ ... $$                          display maths on its own line

Maths is LaTeX between $...$ ; pipes inside maths must be written \\mid or \\vert.
"""
import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def parse_sections(path):
    secs, cur, grp, table, ul = [], None, None, None, None
    def flush_table():
        nonlocal table
        if table is None: return
        rows = [r for r in table if not re.fullmatch(r'\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?', '|'.join(r))]
        head, body = rows[0], rows[1:]
        ensure_grp()['blocks'].append({'t': 'table', 'head': head, 'rows': body})
        table = None
    def ensure_grp():
        nonlocal grp
        if grp is None:
            grp = {'title': '', 'blocks': []}
            cur['groups'].append(grp)
        return grp
    def flush_ul():
        nonlocal ul
        ul = None
    for ln, raw in enumerate(open(path, encoding='utf-8'), 1):
        line = raw.rstrip('\n')
        if not line.strip() or line.lstrip().startswith('#!'):
            flush_table(); flush_ul(); continue
        if line.startswith('|'):
            if cur is None: raise SystemExit(f'{path}:{ln}: table before @sec')
            cells = [c.strip() for c in line.strip().strip('|').split(' | ')] if ' | ' in line else [c.strip() for c in line.strip().strip('|').split('|')]
            if table is None:
                flush_ul(); table = []
            table.append(cells); continue
        else:
            flush_table()
        if line.startswith('@sec '):
            flush_ul()
            parts = [p.strip() for p in line[5:].split('|')]
            cur = {'id': parts[0], 'title': parts[1], 'part': parts[2] if len(parts) > 2 else '', 'codes': [], 'lede': '', 'groups': []}
            secs.append(cur); grp = None; continue
        if cur is None: raise SystemExit(f'{path}:{ln}: content before @sec')
        if line.startswith('@meta '):
            for kv in line[6:].split():
                k, v = kv.split('=', 1)
                if k == 'codes': cur['codes'] = [c for c in v.split(',') if c]
                elif k in ('pyq', 'tier'): cur[k] = int(v)
                elif k == 'f27': cur[k] = float(v)
                else: cur[k] = v
            continue
        if line.startswith('@lede '):
            cur['lede'] = line[6:].strip(); continue
        if line.startswith('@grp '):
            flush_ul()
            grp = {'title': line[5:].strip(), 'blocks': []}
            cur['groups'].append(grp); continue
        m = re.match(r'^-([!*]?) (.*)$', line)
        if m:
            g = ensure_grp()
            if ul is None:
                ul = {'t': 'ul', 'items': []}; g['blocks'].append(ul)
            item = {'x': m.group(2).strip()}
            if m.group(1) == '!': item['k'] = 'trap'
            elif m.group(1) == '*': item['k'] = 'key'
            ul['items'].append(item); continue
        flush_ul()
        m = re.match(r'^\.launch ([\w-]+) \| (.*)$', line)
        if m:
            ensure_grp()['blocks'].append({'t': 'launch', 'bank': m.group(1), 'x': m.group(2).strip()}); continue
        m = re.match(r'^\.(p|trap|key|fig) (.*)$', line)
        if m:
            ensure_grp()['blocks'].append({'t': m.group(1), 'x': m.group(2).strip()}); continue
        if line.startswith('$$'):
            ensure_grp()['blocks'].append({'t': 'p', 'x': line.strip()}); continue
        raise SystemExit(f'{path}:{ln}: cannot parse: {line[:80]}')
    flush_table()
    return secs

def js(varname, obj, comment=''):
    body = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    return f'/* {comment} */\nwindow.{varname} = {body};\n'

def main():
    out = {}
    notes = []
    for f in sorted(os.listdir(os.path.join(ROOT, 'content'))):
        if f.startswith('notes-') and f.endswith('.txt'):
            notes += parse_sections(os.path.join(ROOT, 'content', f))
    traps = []
    for f in sorted(os.listdir(os.path.join(ROOT, 'content'))):
        if f.startswith('traps-') and f.endswith('.txt'):
            traps += parse_sections(os.path.join(ROOT, 'content', f))
    with open(os.path.join(ROOT, 'src', 'notes-data.js'), 'w', encoding='utf-8') as fh:
        fh.write(js('notesData', notes, 'ISS 2027 Probability & Statistical Methods notes - generated by tools/build_content.py'))
    with open(os.path.join(ROOT, 'src', 'traps-data.js'), 'w', encoding='utf-8') as fh:
        fh.write(js('trapData', traps, 'Probability Top-1% Trap Compendium - generated by tools/build_content.py'))
    n = sum(len(b.get('items', [1])) for s in notes for g in s['groups'] for b in g['blocks'])
    t = sum(len(b.get('items', [1])) for s in traps for g in s['groups'] for b in g['blocks'])
    print(f'notes: {len(notes)} sections, {n} blocks/items; traps: {len(traps)} sections, {t} blocks/items')

if __name__ == '__main__':
    main()
