#!/usr/bin/env python3
"""Inline KaTeX into index.html so the delivered application typesets real
LaTeX while remaining four self-contained files with no network access.

KaTeX (MIT, https://katex.org) is vendored under build/vendor/katex.  This
script embeds:

  * katex.min.css, with every @font-face rewritten to a base64 data: URI of
    the WOFF2 face (the TTF/WOFF fallbacks are dropped - every browser this
    project targets supports WOFF2)
  * katex.min.js

between the KATEX-BUNDLE markers in index.html.  Running it again simply
replaces the previous bundle, so it is idempotent.
"""
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VEND = os.path.join(ROOT, 'build', 'vendor', 'katex')
INDEX = os.path.join(ROOT, 'index.html')

START = '<!--KATEX-BUNDLE-START-->'
END = '<!--KATEX-BUNDLE-END-->'


def font_data_uri(name):
    path = os.path.join(VEND, 'fonts', name)
    with open(path, 'rb') as fh:
        b64 = base64.b64encode(fh.read()).decode('ascii')
    return 'data:font/woff2;base64,' + b64


def build_css():
    css = open(os.path.join(VEND, 'katex.min.css'), encoding='utf-8').read()

    # each @font-face lists ttf, woff and woff2; keep woff2 only, inlined
    def fix_src(m):
        block = m.group(0)
        woff2 = re.search(r'url\(fonts/([A-Za-z0-9_\-]+\.woff2)\)', block)
        if not woff2:
            return block
        uri = font_data_uri(woff2.group(1))
        return 'src:url(%s) format("woff2")' % uri

    css = re.sub(r'src:url\(fonts/[^;{}]*', fix_src, css)
    # font-display:swap so text is never invisible while a face is loading -
    # Chromium's default (block) hid every glyph when printing to PDF
    css = css.replace('@font-face{', '@font-face{font-display:swap;')
    missed = re.findall(r'url\(fonts/[^)]*\)', css)
    if missed:
        print('ERROR: %d font references were not inlined, e.g. %s'
              % (len(missed), missed[0]))
        sys.exit(1)
    return css


def main():
    css = build_css()
    js = open(os.path.join(VEND, 'katex.min.js'), encoding='utf-8').read()

    bundle = (
        START + '\n'
        '<!-- KaTeX 0.16.22 (MIT licence, https://katex.org) vendored and\n'
        '     inlined by build/vendor_katex.py.  Nothing is fetched at runtime:\n'
        '     the stylesheet, the script and all twenty WOFF2 math faces are\n'
        '     embedded in this file. -->\n'
        '<style id="katex-css">\n' + css + '\n</style>\n'
        '<script id="katex-js">\n' + js + '\n</script>\n'
        + END
    )

    html = open(INDEX, encoding='utf-8').read()
    if START not in html or END not in html:
        print('ERROR: KATEX-BUNDLE markers not found in index.html')
        sys.exit(1)
    new = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda m: bundle,
                 html, flags=re.S)
    open(INDEX, 'w', encoding='utf-8').write(new)

    print('inlined KaTeX into index.html')
    print('  css      : %8.1f KB (with %d embedded WOFF2 faces)'
          % (len(css) / 1024.0, len(os.listdir(os.path.join(VEND, 'fonts')))))
    print('  js       : %8.1f KB' % (len(js) / 1024.0))
    print('  index.html now %8.1f KB' % (os.path.getsize(INDEX) / 1024.0))


if __name__ == '__main__':
    main()
