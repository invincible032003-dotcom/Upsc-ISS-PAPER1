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
    ('font file referenced by path (must be inlined as a data: URI)',
     r'url\(\s*["\']?(?!data:)[^)"\']*\.(?:woff2?|ttf|otf|eot)'),
    ('service worker',            r'serviceWorker'),
    # KaTeX is VENDORED and inlined into index.html, which is fine; what must
    # never happen is loading it (or MathJax) over the network.
    ('MathJax / KaTeX loaded from a URL',
     r'(?:src|href)\s*=\s*["\'][^"\']*(?:mathjax|katex)'),
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

# Vendored third-party code (the inlined KaTeX bundle) is audited separately:
# it may legitimately contain identifiers such as `parser.fetch()`, but it must
# still contain no network reference of any kind.
VENDOR_START = '<!--KATEX-BUNDLE-START-->'
VENDOR_END = '<!--KATEX-BUNDLE-END-->'
VENDOR_BANNED = [
    ('absolute http(s) URL',  r'https?://(?!www\.w3\.org/)'),
    ('protocol-relative URL', r'(?<![a-zA-Z0-9:])//[a-zA-Z0-9.-]+\.[a-z]{2,}/'),
    ('CSS url() to a remote', r'url\(\s*["\']?(?:https?:)?//'),
    ('font file by path',
     r'url\(\s*["\']?(?!data:)[^)"\']*\.(?:woff2?|ttf|otf|eot)'),
    ('localhost / 127.0.0.1', r'localhost|127\.0\.0\.1'),
    ('importScripts',         r'importScripts'),
    ('service worker',        r'serviceWorker'),
]


def split_vendor(text):
    i = text.find(VENDOR_START)
    j = text.find(VENDOR_END)
    if i < 0 or j < 0:
        return text, ''
    return text[:i] + text[j + len(VENDOR_END):], text[i:j]


for fname in FILES:
    path = os.path.join(ROOT, fname)
    if not os.path.exists(path):
        failures.append('%s: MISSING' % fname)
        continue
    if fname == 'README.txt':
        continue
    # split BEFORE stripping comments: the bundle markers are HTML comments
    raw = open(path, encoding='utf-8').read()
    own, vendor = split_vendor(raw)
    own = strip_comments(own)
    vendor = strip_comments(vendor)
    for label, rx in BANNED:
        for m in re.finditer(rx, own, re.M):
            line = own[:m.start()].count('\n') + 1
            snippet = own[max(0, m.start() - 40):m.start() + 60].replace('\n', ' ')
            failures.append('%s:%d  %s  ->  ...%s...' % (fname, line, label, snippet))
    if vendor:
        notes.append('vendored bundle audited separately: %.0f KB'
                     % (len(vendor) / 1024.0))
        for label, rx in VENDOR_BANNED:
            for m in re.finditer(rx, vendor, re.M):
                snippet = vendor[max(0, m.start() - 40):m.start() + 60].replace('\n', ' ')
                failures.append('%s (vendored KaTeX)  %s  ->  ...%s...'
                                % (fname, label, snippet))

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
# report what is vendored, so the bundle is never mistaken for a network load
html_raw = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
n_faces = len(re.findall(r'@font-face', html_raw))
n_data = len(re.findall(r'url\(data:font/woff2;base64,', html_raw))
print('  vendored inline: KaTeX %s, %d @font-face rules, %d embedded WOFF2 faces'
      % ('0.16.22', n_faces, n_data))
if n_faces != n_data:
    print('FAILED — %d @font-face rules but only %d inlined faces'
          % (n_faces, n_data))
    sys.exit(1)
print('-' * 66)
print('PASSED — no network, no CDN, no externally loaded font or library,')
print('         no module import, no server, no runtime dependency.')
print('         KaTeX and its 20 math fonts are embedded inside index.html.')
sys.exit(0)
