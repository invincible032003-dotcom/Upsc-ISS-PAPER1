#!/usr/bin/env python3
"""Convert the ASCII mathematics in the AI-derived explanations into real
LaTeX, so the dashboard and the PDFs typeset every formula with KaTeX.

Only explanation fields are touched - exam shortcut, tips, solution steps and
source notes.  The authentic question stems and options are never altered by
this script: they already carry the source booklets' own LaTeX.

How it works
------------
A maximal-expression scanner walks the text and matches the longest run that
parses as an arithmetic expression:

    EXPR  := ATOM ( OP ATOM | ATOM )*
    ATOM  := number | identifier (sub/sup/primes)? | balanced (...) [...] {...}
    OP    := =  <  >  <=  >=  !=  ~  ->  +  -  *  /  |

An identifier is a single letter, a Greek name, or a known function or
operator name - never an English word, so prose can never be pulled into a
formula.  A run is accepted only if it carries a genuine mathematical signal
(a superscript, a subscript, a relation, a quotient, a function application),
which keeps prose such as "Answer (d).", "I/O" or "SSL/TLS" out of math mode.

    python3 build/mathify.py --dry     # report only, writes nothing
    python3 build/mathify.py           # rewrite build/answers/*.json
"""
import glob
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GREEK = ('alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta '
         'iota kappa lambda mu nu xi rho varrho sigma varsigma tau upsilon '
         'phi varphi chi psi omega').split()
GREEK_UC = 'Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega'.split()
GREEK_ALL = set(GREEK) | set(GREEK_UC)

FUNCS = ('exp log ln sin cos tan cot sec csc sinh cosh tanh arcsin arccos '
         'arctan max min lim limsup liminf sup inf det gcd').split()
OPNAMES = 'Var Cov Corr Bias MSE SE plim'.split()

IDENTS = GREEK_ALL | set(FUNCS) | set(OPNAMES) | {
    'dx', 'dy', 'dt', 'du', 'dv', 'dz', 'ds', 'dw', 'dp', 'dq',
    'sup', 'inf', 'sqrt', 'mod',
}

PROT = '\x11'
PROT_END = '\x12'
SPACE = '\x13'

stats = Counter()


def protect(latex):
    """Wrap ready-made LaTeX so the scanner treats it as one atom."""
    return PROT + latex.replace(' ', SPACE) + PROT_END


# ==========================================================================
# 1.  phrase rules - multi-word mathematics no scanner could infer
# ==========================================================================
def lim_atom(s):
    s = s.strip().strip(',')
    if s in GREEK_ALL:
        return '\\' + s
    return re.sub(r'\binfinity\b', r'\\infty', s)


def phrase_rules(t):
    def _int(m):
        stats['integral'] += 1
        return protect(r'\int_{%s}^{%s}' % (lim_atom(m.group(1)),
                                            lim_atom(m.group(2)))) + ' '
    t = re.sub(r'\bintegral\s+from\s+(\S+?)\s+to\s+(\S+?)\s+of\s+',
               _int, t, flags=re.I)

    def _int0(m):
        stats['integral'] += 1
        return protect(r'\int') + ' '
    t = re.sub(r'\bintegral\s+(?:over\s+[^,.;]{0,32}?\s+)?of\s+',
               _int0, t, flags=re.I)

    def _sum(m):
        stats['sum'] += 1
        return protect(r'\sum_{%s=%s}^{%s}' % (lim_atom(m.group(1)),
                                               lim_atom(m.group(2)),
                                               lim_atom(m.group(3)))) + ' '
    t = re.sub(r'\bsum\s+from\s+(\w+)\s*=\s*(\S+?)\s+to\s+(\S+?)\s+of\s+',
               _sum, t, flags=re.I)

    def _sum0(m):
        stats['sum'] += 1
        return protect(r'\sum') + ' '
    t = re.sub(r'\bsum\s+over\s+(?:all\s+)?\w+(?:\s*>=?\s*\w+)?\s+of\s+',
               _sum0, t, flags=re.I)

    t = re.sub(r'\bPROD\s*\(', lambda m: protect(r'\prod') + '(', t)
    t = re.sub(r'\bproduct\s+from\s+\S+\s+to\s+\S+\s+of\s+',
               lambda m: protect(r'\prod') + ' ', t, flags=re.I)

    def _chi(m):
        stats['chi'] += 1
        return protect(r'\chi^{2}_{%s}' % lim_atom(m.group(1)))
    t = re.sub(r'\bchi[- ]?squares?\s*\(\s*([^()]{1,14}?)\s*\)',
               _chi, t, flags=re.I)
    t = re.sub(r'\bchi[- ]?squared?\b(?!\s*\()',
               lambda m: protect(r'\chi^{2}'), t, flags=re.I)

    def _bar(m):
        stats['bar'] += 1
        return protect(r'\bar{%s}' % m.group(1))
    t = re.sub(r'\b([A-Za-z])[- ]?bar\b', _bar, t)

    t = re.sub(r'\binfinity\b', lambda m: protect(r'\infty'), t, flags=re.I)

    def _opw(m):
        # "P(no event occurs)" and "P(A_n infinitely often)" read far better
        # as an operator applied to upright text than as a row of italics
        inner = m.group(2).strip()
        if re.search(r'[\\=|]', inner) or len(inner) > 48:
            return m.group(0)
        head = ''
        mm = re.match(r'^([A-Za-z]\d*(?:_\{?[A-Za-z0-9+\-]+\}?)?'
                      r'(?:\s*,\s*[A-Za-z]\d*(?:_\{?[A-Za-z0-9+\-]+\}?)?)*)'
                      r'\s+([a-z].*)$', inner)
        if mm:
            head, inner = mm.group(1), mm.group(2)
        elif re.search(r'[_^]', inner):
            return m.group(0)
        stats['op_of_phrase'] += 1
        if head:
            head = re.sub(r'_\{?([A-Za-z0-9+\-]+)\}?', r'_{\1}', head)
            body = head + r'\ \text{' + inner + '}'
        else:
            body = r'\text{' + inner + '}'
        return protect(r'\operatorname{%s}\!\left(%s\right)'
                       % (m.group(1), body))
    t = re.sub(r'\b(P|E|V|Var|Cov|Corr|SE|MSE|Bias|Pr)'
               r'\(([^()]*?[a-z]{3,}[^()]*?)\)', _opw, t)
    return t


# ==========================================================================
# 2.  the maximal-expression scanner
# ==========================================================================
OPENERS = {'(': ')', '[': ']'}
OPS = ['<=', '>=', '!=', '->', '=', '<', '>', '+', '-', '*', '/', '~', '|', ',']
REL_OPS = {'=', '<', '>', '<=', '>=', '!=', '~'}
WORDY = re.compile(r'[A-Za-z]{3,}')


def match_group(s, i):
    """Balanced bracket group at s[i]; return end index, or -1."""
    if i >= len(s) or s[i] not in OPENERS:
        return -1
    stack = [s[i]]
    j = i + 1
    while j < len(s) and stack:
        c = s[j]
        if c in OPENERS:
            stack.append(c)
        elif c in ')]':
            if OPENERS[stack[-1]] != c:
                return -1
            stack.pop()
        elif c in '.;' and j + 1 < len(s) and s[j + 1] == ' ':
            return -1                 # a sentence boundary cannot be inside
        j += 1
    if stack:
        return -1
    inner = re.sub(PROT + r'[^' + PROT_END + r']*' + PROT_END, ' ', s[i + 1:j - 1])
    for w in WORDY.findall(inner):    # reject prose: "(see below)", "(WiGig)"
        if w not in IDENTS:
            return -1
    if inner and not re.search(r'[A-Za-z0-9]', inner):
        return -1                     # "(=, +=, -=, ...)" is a code listing
    return j


ABBREV = re.compile(r'^[A-Za-z]\.[A-Za-z]\.')

# short English words that could follow an arithmetic operator; a letter run
# in this set is prose, never a product of variables
SHORT_WORDS = set(
    'in of to is as so we it at by on or an if no do up be the and for not '
    'but are has its all any can may one two see use let now set sum per via '
    'out own off far few top end key bit low new old way add get how why who '
    'you was did too my me us he go on ok vs eg ie'.split())


def product_run(w):
    """Is this letter run a product of single-letter variables (xy, ab, pq)?"""
    return (2 <= len(w) <= 3 and w.islower() and w not in SHORT_WORDS
            and w not in IDENTS)


def match_atom(s, i, after_arith=False):
    """One atom at s[i]; returns (end, carries_math_signal) or (-1, False).

    after_arith says the previous token was + - * or /, in which case a short
    lower-case letter run is read as a product of variables (xy, ab, pq)
    rather than as prose.
    """
    n = len(s)
    if i >= n:
        return -1, False
    if ABBREV.match(s[i:]):
        return -1, False              # i.e., e.g., d.f.
    if s[i] == PROT:
        j = s.find(PROT_END, i)
        return (j + 1, True) if j > 0 else (-1, False)

    j = i
    signal = False
    if s[j].isdigit():
        j += re.match(r'\d+(?:\.\d+)?%?', s[j:]).end()
    elif s[j].isalpha():
        w = re.match(r'[A-Za-z]+', s[j:]).group(0)
        # a single letter is a variable; anything longer must be a known
        # mathematical name.  Two-letter English words ("so", "is", "of")
        # must never be swallowed into a formula.
        if len(w) > 1 and w not in IDENTS:
            if not (after_arith and product_run(w)):
                return -1, False
        if w in GREEK_ALL or w in FUNCS or w in OPNAMES:
            signal = True
        j += len(w)
        m2 = re.match(r'\d+', s[j:])  # A1, X2
        if m2:
            j += m2.end()
    elif s[j] in OPENERS:
        e = match_group(s, j)
        if e < 0:
            return -1, False
        if re.search(r'[+\-*/^_=<>|]', s[j:e]) or re.search(r'\d', s[j:e]):
            signal = True
        j = e
    else:
        return -1, False

    while j < n:                      # primes, sub/superscripts, factorial
        if s[j] == "'":
            j += 1
            signal = True
        elif s[j] in '^_':
            k = j + 1
            if k < n and s[k] == '{':          # already-LaTeX group: R^2_{1.23}
                e = s.find('}', k)
                if e < 0:
                    break
                j = e + 1
            elif k < n and s[k] in OPENERS:
                e = match_group(s, k)
                if e < 0:
                    break
                j = e
            else:
                m = re.match(r'-?[A-Za-z0-9]+', s[k:])
                if not m:
                    break
                j = k + m.end()
            signal = True
        elif s[j] == '!' and (j + 1 >= n or s[j + 1] in ' ,)='):
            j += 1
            signal = True
        else:
            break
    return j, signal


def match_op(s, i):
    """Operator plus surrounding spaces; returns (end, op) or (-1, '')."""
    j = i
    while j < len(s) and s[j] == ' ':
        j += 1
    spaced_before = j > i
    for op in OPS:
        if s.startswith(op, j):
            k = j + len(op)
            if op == ',':
                # a comma joins operands only when it sits tight against the
                # left operand and is followed by a space: "1, x, x^2"
                if spaced_before or k >= len(s) or s[k] != ' ':
                    return -1, ''
            if op == '-' and spaced_before:
                # " - " between two spaces is very often a prose dash; only
                # keep it when what follows is unmistakably an operand
                if k < len(s) and s[k] == ' ':
                    nxt = k
                    while nxt < len(s) and s[nxt] == ' ':
                        nxt += 1
                    if nxt >= len(s):
                        return -1, ''
                    nc = s[nxt]
                    okay = nc.isdigit() or nc in OPENERS or nc == PROT
                    if not okay and nc.isalpha():
                        w = re.match(r'[A-Za-z]+', s[nxt:]).group(0)
                        okay = len(w) == 1 or w in IDENTS or product_run(w)
                    if not okay:
                        return -1, ''
            while k < len(s) and s[k] == ' ':
                k += 1
            return k, op
    return -1, ''


def scan(s, i):
    """Longest expression starting at i; returns (end, has_signal)."""
    end, signal = match_atom(s, i)
    if end < 0:
        return -1, False
    ops = 0
    while True:
        oe, op = match_op(s, end)
        if oe > 0:
            ae, sig = match_atom(s, oe, after_arith=op in '+-*/')
            if ae > 0:
                end = ae
                if op != ',':
                    ops += 1
                signal = signal or sig or op in REL_OPS or op == '/' or ops >= 2
                continue
        k = end + 1 if (end < len(s) and s[end] == ' ') else end
        ae, sig = match_atom(s, k)
        if ae > 0:
            end = ae
            signal = signal or sig
            continue
        break
    return end, signal


# ==========================================================================
# 3.  ASCII -> LaTeX inside an accepted expression
# ==========================================================================
HOLD_A = '\x14'
HOLD_B = '\x15'


def to_latex(x):
    stripped = x.strip()
    if stripped.startswith(PROT) and stripped.endswith(PROT_END) \
       and stripped.count(PROT) == 1:
        return stripped.replace(PROT, '').replace(PROT_END, '').replace(SPACE, ' ')

    # Protected atoms are finished LaTeX already.  Lift them out before the
    # ASCII rewrites run, or "P(\text{-log U > t})" would have its own \log
    # rewritten a second time and end up inside \text{}, which is invalid.
    held = []

    def _hold(m):
        held.append(m.group(1).replace(SPACE, ' '))
        return HOLD_A + str(len(held) - 1) + HOLD_B
    x = re.sub(PROT + r'([^' + PROT_END + r']*)' + PROT_END, _hold, x)

    # set operations, only between set-like operands
    for _ in range(4):               # chains: A1' n A2' n A3' n A4'
        y = re.sub(r"([A-Z][0-9]*'*) n (?=[A-Z(])", r'\1 \\cap ', x)
        y = re.sub(r"([A-Z][0-9]*'*) u (?=[A-Z(])", r'\1 \\cup ', y)
        if y == x:
            break
        x = y

    x = x.replace('<=', r' \le ').replace('>=', r' \ge ')
    x = x.replace('!=', r' \ne ').replace('->', r' \to ')
    x = re.sub(r'(?<![<>=!\\])~', r' \\sim ', x)

    for _ in range(5):
        y = re.sub(r'\bsqrt\s*\(([^()]*)\)',
                   lambda m: r'\sqrt{%s}' % m.group(1), x)
        if y == x:
            break
        x = y
    x = re.sub(r'\bC\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)',
               lambda m: r'\binom{%s}{%s}' % (m.group(1), m.group(2)), x)

    # |x| is an absolute value; a lone | inside P(...) is conditioning
    x = re.sub(r"(?<![A-Za-z0-9])\|([^|()]{1,16}?)\|(?![A-Za-z0-9])",
               lambda m: r'\lvert %s\rvert ' % m.group(1), x)
    x = x.replace('|', r'\mid ')

    x = re.sub(r'\^\(([^()]*)\)', lambda m: '^{%s}' % m.group(1), x)
    x = re.sub(r'_\(([^()]*)\)', lambda m: '_{%s}' % m.group(1), x)
    x = re.sub(r'\^(-?[A-Za-z0-9]+)(?![}])', lambda m: '^{%s}' % m.group(1), x)
    x = re.sub(r'_(-?[A-Za-z0-9]+)(?![}])', lambda m: '_{%s}' % m.group(1), x)
    # y0, y1, A1, X2 are indexed variables in this corpus
    x = re.sub(r'(?<![\\A-Za-z0-9_^{])([A-Za-z])(\d+)(?![A-Za-z0-9}])',
               lambda m: '%s_{%s}' % (m.group(1), m.group(2)), x)

    x = re.sub(r'(?<![A-Za-z\\])(' +
               '|'.join(sorted(GREEK_ALL, key=len, reverse=True)) +
               r')(?![A-Za-z])', lambda m: '\\' + m.group(1), x)
    x = re.sub(r'(?<![A-Za-z\\])(' + '|'.join(FUNCS) + r')(?![A-Za-z])',
               lambda m: '\\' + m.group(1), x)
    x = re.sub(r'(?<![A-Za-z\\])(' + '|'.join(OPNAMES) + r')(?=\s*[\(\[])',
               lambda m: r'\operatorname{%s}' % m.group(1), x)
    x = re.sub(r'(?<![A-Za-z\\{])(Pr|E|P|V)(?=\s*[\(\[])',
               lambda m: r'\operatorname{%s}' % m.group(1), x)

    x = re.sub(r'(?<=\d)\s*[x×]\s*(?=\d)', r' \\times ', x)
    x = re.sub(r'(?<=[\w\)\}])\s*\*\s*(?=[\w\(])', r' \\cdot ', x)

    x = x.replace('%', r'\%').replace('&', r'\&').replace('#', r'\#')
    x = re.sub(HOLD_A + r'(\d+)' + HOLD_B, lambda m: held[int(m.group(1))], x)
    if '\\int' in x:                 # an integrand ends with its differential
        x = re.sub(r'\s+d([xytuvzswpq])\b', r'\\,d\1', x)
    x = x.replace(PROT, '').replace(PROT_END, '').replace(SPACE, ' ')
    return re.sub(r'[ ]+', ' ', x).strip()


# ==========================================================================
# 4.  driver
# ==========================================================================
MIN_LEN = 3


def convert(text):
    if not text:
        return text
    if '$' in text:
        stats['already_latex'] += 1
        return text

    s = phrase_rules(text)
    out = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if not (c.isdigit() or c.isalpha() or c in OPENERS or c == PROT):
            out.append(c)
            i += 1
            continue
        if i > 0 and (s[i - 1].isalnum() or s[i - 1] in "\\_^'"):
            out.append(c)
            i += 1
            continue
        end, signal = scan(s, i)
        if end < 0 or not signal or end - i < MIN_LEN:
            m = re.match(r'[A-Za-z]+|\d+(?:\.\d+)?', s[i:])
            step = m.end() if m else 1
            out.append(s[i:i + step])
            i += step
            continue
        expr = s[i:end].rstrip(' ')
        end = i + len(expr)
        if re.fullmatch(r'[A-Z]/[A-Z]', expr):
            out.append(expr)           # I/O, A/D, R/W - acronyms, not ratios
            i = end
            continue
        latex = to_latex(expr)
        if latex:
            out.append('$' + latex + '$')
            stats['spans'] += 1
        else:
            out.append(expr)
        i = end

    res = ''.join(out)
    res = res.replace(PROT, '').replace(PROT_END, '').replace(SPACE, ' ')
    return wrap_loose_latex(res)


LOOSE = re.compile(r'(\\(?:int|sum|prod|chi|bar|infty|operatorname|lvert|'
                   r'rvert|cap|cup|le|ge|ne|sim|to|times|cdot|binom|sqrt|'
                   r'mid|' + '|'.join(sorted(GREEK_ALL, key=len, reverse=True)) +
                   r')(?:\{[^{}]*\}|[^\s$,.;])*)')


def wrap_loose_latex(res):
    """Delimit any LaTeX that ended up outside a formula.

    Only the prose stretches are examined: text already inside $...$ is left
    strictly alone, otherwise a formula would be wrapped twice."""
    parts = re.split(r'(\$[^$]*\$)', res)
    for k in range(0, len(parts), 2):
        if '\\' in parts[k]:
            parts[k] = LOOSE.sub(lambda m: '$' + m.group(1) + '$', parts[k])
    return ''.join(parts)


def main():
    dry = '--dry' in sys.argv
    files = sorted(glob.glob(os.path.join(ROOT, 'build', 'answers', '*.json')))
    changed = 0
    for path in files:
        data = json.load(open(path, encoding='utf-8'))
        for qid, rec in data.items():
            before = json.dumps(rec, ensure_ascii=False)
            rec['shortcut'] = convert(rec.get('shortcut', ''))
            rec['tips'] = [convert(x) for x in rec.get('tips', [])]
            rec['solution'] = [convert(x) for x in rec.get('solution', [])]
            if rec.get('issue'):
                rec['issue'] = convert(rec['issue'])
            if json.dumps(rec, ensure_ascii=False) != before:
                changed += 1
        if not dry:
            json.dump(data, open(path, 'w', encoding='utf-8'),
                      ensure_ascii=False, indent=2)
    print('records touched: %d' % changed)
    for k, v in sorted(stats.items()):
        print('  %-18s %d' % (k, v))
    if dry:
        print('(dry run - nothing written)')


if __name__ == '__main__':
    main()
