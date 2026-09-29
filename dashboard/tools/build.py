#!/usr/bin/env python3
"""Assemble the single-file offline dashboard.

    python3 tools/build.py            ->  dist/UPSC-ISS-Statistics-Study-App.html

Steps: apply the anchored patches to src/app.base.js, splice in the modules in
src/js/, then drop styles, KaTeX and every data script into src/template.html.
"""
import os, re, sys, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from patches import PATCHES

def rd(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as fh:
        return fh.read()

MODULES = ['m-core.js', 'm-notes.js', 'm-banks.js', 'm-cards.js', 'm-revise.js', 'm-screens.js', 'm-practice.js', 'm-shell.js']

def build_app():
    app = rd('src', 'app.base.js')
    for name, old, new, count in PATCHES:
        n = app.count(old)
        if n != count:
            raise SystemExit(f'patch "{name}": anchor found {n}x, expected {count}\n--- anchor ---\n{old}')
        app = app.replace(old, new)
    # the old mobile shell is replaced wholesale by the new modules
    a = app.index('/* ------------------------------------------------ Android / mobile shell')
    b = app.index('/* ======================================================================\n   9.  RENDER + EVENTS')
    mods = []
    for m in MODULES:
        path = os.path.join(ROOT, 'src', 'js', m)
        if os.path.exists(path):
            mods.append(rd('src', 'js', m))
        else:
            print('  (skipping missing module', m + ')')
    app = app[:a] + '\n'.join(mods) + '\n' + app[b:]
    app = app.replace('/*NB-ENRICH*/', rd('src', 'js', 'm-enrich.js'))
    return app

def main():
    css = rd('src', 'styles.base.css')
    mob = os.path.join(ROOT, 'src', 'styles.mobile.css')
    if os.path.exists(mob):
        css += '\n' + rd('src', 'styles.mobile.css')
    subs = {
        '{{STYLES}}': css,
        '{{KATEX_CSS}}': rd('src', 'katex.css'),
        '{{KATEX_JS}}': rd('src', 'katex.js'),
        '{{PYQ}}': rd('src', 'pyq-data.js'),
        '{{GK}}': rd('src', 'gk-data.js'),
        '{{CS}}': rd('src', 'cs-data.js'),
        '{{NOTES}}': rd('src', 'notes-data.js'),
        '{{TRAPS}}': rd('src', 'traps-data.js'),
        '{{NB}}': rd('src', 'nb-data.js'),
        '{{DIST}}': rd('src', 'dist-data.js'),
        '{{APP}}': build_app(),
        '{{THEME}}': rd('src', 'theme.js'),
    }
    html = rd('src', 'template.html')
    for k, v in subs.items():
        assert html.count(k) == 1, k
        # str.replace with a lambda-free approach: split/join avoids backslash processing
        head, tail = html.split(k)
        html = head + v.rstrip('\n') + tail
    out_dir = os.path.join(ROOT, 'dist')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, 'UPSC-ISS-Statistics-Study-App.html')
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write(html)
    print('wrote', out, f'{len(html)/1e6:.2f} MB', hashlib.sha1(html.encode()).hexdigest()[:10])

if __name__ == '__main__':
    main()
