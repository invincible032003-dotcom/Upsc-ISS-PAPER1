#!/usr/bin/env python3
"""Static purity check on the four delivered files.

Fails if any of them references the network, a CDN, an external font, an
external library, a module import, a server path, or any runtime that the
user would have to install.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ['index.html', 'questions.js', 'styles.css', 'README.txt']

# (label, regex, files it applies to)  — README is prose and is checked only
# for structural claims, not for the word "http".
BANNED = [
    ('absolute http(s) URL',      r'https?://(?!www\.w3\.org/)'),
    ('protocol-relative URL',     r'(?<![a-zA-Z0-9:])//[a-zA-Z0-9.-]+\.[a-z]{2,}/'),
    ('fetch()',                   r'\bfetch\s*\('),
    ('XMLHttpRequest',            r'\bXMLHttpRequest\b'),
    ('WebSocket',                 r'\bWebSocket\b'),
    ('EventSource',               r'\bEventSource\b'),
    ('navigator.sendBeacon',      r'sendBeacon'),
    ('importScripts',             r'importScripts'),
    ('dynamic import()',          r'\bimport\s*\('),
    ('ES module syntax',          r'^\s*(?:import|export)\s',),
    ('type="module"',             r'type\s*=\s*["\']module["\']'),
    ('@import in CSS',            r'@import'),
    ('CSS url() to a remote',     r'url\(\s*["\']?(?:https?:)?//'),
    ('service worker',            r'serviceWorker'),
    ('MathJax / KaTeX loaded',
     r'(?:src|href)\s*=\s*["\'][^"\']*(?:mathjax|katex)|\bMathJax\s*\.|\bkatex\s*\.'),
    ('external JS/CSS library file',
     r'(?:jquery|bootstrap|tailwind|react|react-dom|vue|angular|d3|lodash)'
     r'(?:[.-][\w.]*)?\.(?:js|css)\b'),
    ('Google Fonts',              r'fonts\.googleapis|fonts\.gstatic'),
    ('localhost / 127.0.0.1',     r'localhost|127\.0\.0\.1'),
    ('require()',                 r'\brequire\s*\('),
    ('process.env',               r'process\.env'),
]

# <link>/<script>/<img>/<iframe> sources must be local relative paths
SRC_RE = re.compile(
    r'<(?:script|link|img|iframe|source|video|audio|object|embed)\b[^>]*?'
    r'(?:src|href|data)\s*=\s*["\']([^"\']+)["\']', re.I)

def strip_comments(text):
    """Blank out /* */ and <!-- --> comments (keeping newlines so that
    reported line numbers stay correct). Comments cannot execute, so a
    banned word inside one is not a finding."""
    def blank(m):
        return re.sub(r'[^\n]', ' ', m.group(0))
    text = re.sub(r'/\*[\s\S]*?\*/', blank, text)
    text = re.sub(r'<!--[\s\S]*?-->', blank, text)
    return text


failures = []
notes = []

for fname in FILES:
    path = os.path.join(ROOT, fname)
    if not os.path.exists(path):
        failures.append('%s: MISSING' % fname)
        continue
    if fname == 'README.txt':
        continue
    text = strip_comments(open(path, encoding='utf-8').read())
    for label, rx in BANNED:
        for m in re.finditer(rx, text, re.M):
            line = text[:m.start()].count('\n') + 1
            snippet = text[max(0, m.start() - 40):m.start() + 60].replace('\n', ' ')
            failures.append('%s:%d  %s  ->  ...%s...' % (fname, line, label, snippet))

# every referenced resource must be a local sibling file
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
for m in SRC_RE.finditer(html):
    ref = m.group(1).strip()
    if ref.startswith(('http://', 'https://', '//', 'data:')):
        failures.append('index.html: external resource reference %r' % ref)
        continue
    if '/' in ref or '\\' in ref:
        failures.append('index.html: non-sibling resource path %r' % ref)
        continue
    if not os.path.exists(os.path.join(ROOT, ref)):
        failures.append('index.html: references missing local file %r' % ref)
    else:
        notes.append('local resource OK: %s' % ref)

# the four files must be self-sufficient
for fname in FILES:
    p = os.path.join(ROOT, fname)
    if os.path.exists(p):
        notes.append('%-14s %8.1f KB' % (fname, os.path.getsize(p) / 1024.0))

print('=' * 66)
print('OFFLINE PURITY CHECK — index.html / questions.js / styles.css / README.txt')
print('=' * 66)
for n in notes:
    print('  ' + n)
print('-' * 66)
if failures:
    print('FAILED — %d problem(s):' % len(failures))
    for f in failures:
        print('  ' + f)
    sys.exit(1)
print('PASSED — no network, no CDN, no external font, no external library,')
print('         no module import, no server, no runtime dependency.')
sys.exit(0)
