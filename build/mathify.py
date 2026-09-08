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
         'iota kappa lambda mu nu xi pi rho varrho sigma varsigma tau upsilon '
         'phi varphi chi psi omega').split()
GREEK_UC = 'Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega'.split()
# non-Greek single symbols that spell out as a LaTeX command in the same way
SYMBOLS = 'nabla partial ell'.split()
GREEK_ALL = set(GREEK) | set(GREEK_UC) | set(SYMBOLS)

FUNCS = ('exp log ln sin cos tan cot sec csc sinh cosh tanh arcsin arccos '
         'arctan max min lim limsup liminf sup inf det gcd').split()
OPNAMES = 'Var Cov Corr Bias MSE SE sd plim floor ceil'.split()

# named distributions: "X ~ Binomial(n, p)" wants the name upright
DISTS = ('Binomial Bin Poisson Exponential Exp Geometric Bernoulli '
         'Hypergeometric Multinomial Cauchy Laplace Lognormal Weibull Normal '
         'Uniform Rectangular Pareto Rayleigh NegBin Student Beta Dirichlet '
         'BVN Gumbel Logistic Triangular').split()

# upright statistical abbreviations that behave as single symbols
STATNAMES = 'SD CV Sk IQR MAD RSS TSS ESS SST SSE SSR'.split()

# two-letter runs that are genuinely products of variables in this corpus
PRODVARS = set('xy yx xx yy pq qp np nq ab ba bc cb cd ac bd ad uv vu '
               'xz yz zx st ts rs sr abc bcd abd acd abcd bcde npq pqr '
               'xyz ijk XY YX UV VU XZ ZX YZ ZY XW WX YW ZW'.split())

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


PROT_RE = re.compile(PROT + '[^' + PROT_END + ']*' + PROT_END)


def sub_free(pattern, repl, t):
    """re.sub, but never inside LaTeX that an earlier rule already produced.

    Without this, a later rule would rewrite the inside of a finished atom -
    \\operatorname{Sk} would come back as \\operatorname{S_{k}."""
    out = []
    pos = 0
    for m in PROT_RE.finditer(t):
        out.append(re.sub(pattern, repl, t[pos:m.start()]))
        out.append(m.group(0))
        pos = m.end()
    out.append(re.sub(pattern, repl, t[pos:]))
    return ''.join(out)


# ==========================================================================
# 1.  phrase rules - multi-word mathematics no scanner could infer
# ==========================================================================
def lim_atom(s):
    s = s.strip().strip(',')
    if s in GREEK_ALL:
        return '\\' + s
    return re.sub(r'\binfinity\b', r'\\infty', s)


def dist_args(a):
    """Typeset a distribution's parameter list: (mu1, sigma1^2) -> LaTeX."""
    if not a:
        return a
    a = to_latex(a)
    return re.sub(r'(?<![\\{A-Za-z])([a-z]{3,})(\s*)(?![A-Za-z}])',
                  lambda m: (m.group(0) if m.group(1) in IDENTS
                             else r'\text{%s%s}' % (m.group(1), m.group(2))), a)


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

    # the word "sum" standing for a summation sign:  sum(X_i^2), sum |x - a|,
    # sum xy.  "the sum of squares" and "sum is smallest" stay prose.
    t = re.sub(r'(?<![A-Za-z\\])sum\s*(?=[(\[|])',
               lambda m: protect(r'\sum') + ' ', t)

    def _sumv(m):
        w = m.group(1)
        # only a lower-case operand: "the sum X + Y" is English, "sum xy" is
        # sigma notation
        if w.islower() and (len(w) == 1 or w in IDENTS or w in PRODVARS):
            stats['sum'] += 1
            return protect(r'\sum') + ' ' + w
        return m.group(0)
    t = re.sub(r'(?<![A-Za-z\\])sum\s+([A-Za-z]+)(?![A-Za-z])', _sumv, t)

    t = re.sub(r'\bPROD\s*\(', lambda m: protect(r'\prod') + '(', t)
    t = re.sub(r'\bproduct\s+from\s+\S+\s+to\s+\S+\s+of\s+',
               lambda m: protect(r'\prod') + ' ', t, flags=re.I)

    def _chi(m):
        stats['chi'] += 1
        return protect(r'\chi^{2}_{%s}' % lim_atom(m.group(1)))
    t = re.sub(r'\bchi[- ]?squares?\s*\(\s*([^()]{1,14}?)\s*\)',
               _chi, t, flags=re.I)
    t = re.sub(r'\bchi[- ]?squared?_([A-Za-z0-9]+)',
               lambda m: protect(r'\chi^{2}_{%s}' % m.group(1)), t, flags=re.I)
    t = re.sub(r'\bchi[- ]?squared?\b(?!\s*\()',
               lambda m: protect(r'\chi^{2}'), t, flags=re.I)

    def _bar(m):
        stats['bar'] += 1
        return protect(r'\bar{%s}' % m.group(1))
    t = re.sub(r'\b([A-Za-z])[-_ ]?bar(?![A-Za-z])', _bar, t)

    t = re.sub(r'\binfinity\b', lambda m: protect(r'\infty'), t, flags=re.I)
    t = re.sub(r'\blim\s+sup\b', 'limsup', t)
    t = re.sub(r'\blim\s+inf\b', 'liminf', t)
    t = re.sub(r'\bunion\s+over\s+[^,.;]{0,24}?\s+of\s+',
               lambda m: protect(r'\bigcup') + ' ', t, flags=re.I)
    t = re.sub(r'\bintersection\s+over\s+[^,.;]{0,24}?\s+of\s+',
               lambda m: protect(r'\bigcap') + ' ', t, flags=re.I)

    # a dot used as a multiplication sign - "sd(X) . sd(20X)", "delta.mu".
    # A sentence full stop is always followed by a capitalised word, and the
    # abbreviations i.e. / d.f. / i.i.d. carry a trailing dot.
    def _dot(m):
        stats['product_dot'] += 1
        return ' * '
    t = re.sub(r'(?<=[A-Za-z0-9\)\]\}]) \. (?=[A-Za-z0-9(\[+-])'
               r'(?![A-Z][a-z]{2,})', _dot, t)

    def _tightdot(m):
        a, b = m.group(1), m.group(2)
        if (len(a) == 1 and len(b) == 1) or a not in IDENTS and b not in IDENTS:
            return m.group(0)
        stats['product_dot'] += 1
        return a + ' * ' + b
    t = re.sub(r'(?<![A-Za-z0-9.])([A-Za-z]{1,7})\.([A-Za-z]{1,7})'
               r'(?![A-Za-z0-9])(?!\.[A-Za-z0-9])', _tightdot, t)

    # p_hat is an estimate; t_cache is a named quantity; dpi^2 is a unit
    t = sub_free(r'(?<![A-Za-z0-9\\])([A-Za-z])_hat(?![A-Za-z0-9])',
                 lambda m: protect(r'\hat{%s}' % m.group(1)), t)

    def _wordsub(m):
        if m.group(2) in IDENTS:
            return m.group(0)
        stats['named_sub'] += 1
        return protect(r'%s_{\text{%s}}' % (m.group(1), m.group(2)))
    t = sub_free(r'(?<![A-Za-z0-9\\])([A-Za-z])_([a-z]{3,})(?![A-Za-z0-9])',
                 _wordsub, t)

    def _wordsup(m):
        if m.group(1) in IDENTS:
            return m.group(0)
        stats['named_sub'] += 1
        return protect(r'\text{%s}^{%s}' % (m.group(1), m.group(2)))
    t = sub_free(r'(?<![A-Za-z0-9\\])([a-z]{3,})\^(-?\d+)(?![A-Za-z0-9])',
                 _wordsup, t)

    # named distributions, set upright:  X ~ Binomial(n, p), Exponential(h(x))
    DIST_ALT = '|'.join(sorted(DISTS, key=len, reverse=True))

    def _dist(m):
        stats['distribution'] += 1
        return protect(r'\text{%s}(%s)'
                       % (m.group(1), dist_args(m.group(2).strip())))
    t = re.sub(r'(?<![A-Za-z\\])(' + DIST_ALT +
               r')\(((?:[^()]|\([^()]*\)){0,60})\)', _dist, t)

    # a distribution named after ~ but written without parameters
    def _distbare(m):
        stats['distribution'] += 1
        return '~ ' + protect(r'\text{%s}' % m.group(1))
    t = re.sub(r'~\s*(' + DIST_ALT + r')(?![A-Za-z(])', _distbare, t)

    # upright statistical abbreviations - SD, CV, IQR, RSS ...
    def _statname(m):
        stats['stat_name'] += 1
        return protect(r'\operatorname{%s}' % m.group(1))
    t = re.sub(r'(?<![A-Za-z\\])(' +
               '|'.join(sorted(STATNAMES, key=len, reverse=True)) +
               r')(?![A-Za-z])', _statname, t)

    # partial-correlation notation r12.3, and the corrected sums Sxy, Syy
    t = re.sub(r'(?<![A-Za-z0-9\\])r(\d{2,3})\.(\d+)(?![A-Za-z0-9])',
               lambda m: protect(r'r_{%s.%s}' % (m.group(1), m.group(2))), t)
    t = re.sub(r'(?<![A-Za-z\\])S(xx|xy|yx|yy)(?![A-Za-z0-9])',
               lambda m: protect(r'S_{%s}' % m.group(1)), t)

    # sqrt2, sqrt3 - a root written without brackets
    t = re.sub(r'\bsqrt(\d+)(?![A-Za-z0-9])',
               lambda m: protect(r'\sqrt{%s}' % m.group(1)), t)

    # a chain of numeric products:  2x2, 1024 x 1024, 16 x 256 x 16 x 512.
    # "2^4 x 2^8" must not be cut into "4 x 2", hence the ^ and _ guards.
    def _xchain(m):
        stats['times_chain'] += 1
        return protect(r' \times '.join(re.split(r'\s*[x×]\s*', m.group(0))))
    t = re.sub(r'(?<![A-Za-z0-9^_.,])\d+(?:,\d{3})*(?:\.\d+)?'
               r'(?:\s*[x×]\s*\d+(?:,\d{3})*(?:\.\d+)?)+'
               r'(?![A-Za-z0-9^_,])(?!\.\d)', _xchain, t)

    # an ellipsis inside a formula:  f[x_0, x_1, ..., x_n], (x0 x1 ... xn)
    t = re.sub(r'(?<![.\w])\.\.\.(?!\.)', lambda m: protect(r'\ldots'), t)

    # the generic last node of an indexed list, written without the underscore
    t = sub_free(r'(?<![A-Za-z0-9\\])([xy])([nkm])(?![A-Za-z0-9])',
                 lambda m: protect('%s_{%s}' % (m.group(1), m.group(2))), t)

    def _capidx(m):
        if m.group(0) in GREEK_ALL:
            return m.group(0)         # Xi and Pi are Greek capitals
        return protect('%s_{%s}' % (m.group(1), m.group(2)))
    t = sub_free(r'(?<![A-Za-z0-9\\])([B-HJ-NP-Z])([ijkmn])(?![A-Za-z0-9])',
                 _capidx, t)

    # f+ , f- , g+ , g- : the half-step values of the central-difference rules
    t = sub_free(r'(?<![A-Za-z0-9\\])([fgy])([+-])(?=[\s,.;=)])',
                 lambda m: protect('%s_{%s}' % (m.group(1), m.group(2))), t)

    # a difference of named statistics:  (Mean - Median)
    def _statpair(m):
        stats['stat_name'] += 1
        return protect(r'(\text{%s} %s \text{%s})'
                       % (m.group(1), m.group(2), m.group(3)))
    t = re.sub(r'\((Mean|Median|Mode)\s*([-+])\s*(Mean|Median|Mode)\)',
               _statpair, t)

    # an operator applied to an absolute value:  E|X|, E|X_k|, r|a|
    def _opabs(m):
        name, inner = m.group(1), m.group(2)
        if name in OPNAMES or name in ('P', 'E', 'V', 'Pr'):
            head = r'\operatorname{%s}' % name
        elif len(name) == 1:
            head = name
        else:
            return m.group(0)
        stats['op_abs'] += 1
        return protect(head + r'\lvert ' + to_latex(inner) + r'\rvert ')
    t = re.sub(r"(?<![A-Za-z\\])([A-Za-z]{1,4})\|"
               r"([A-Za-z0-9 +\-*/^_.']{1,18})\|(?![A-Za-z0-9])", _opabs, t)

    # a superscript whose exponent really is prose:  2^(address lines).
    # Words only - "e^(-sigma^2 t^2/2)" is mathematics, not text.
    def _suptext(m):
        inner = m.group(2).strip()
        words = re.findall(r'[A-Za-z]{3,}', inner)
        if not words or all(w in IDENTS for w in words):
            return m.group(0)
        stats['sup_text'] += 1
        return protect(r'%s^{\text{%s}}' % (m.group(1), inner))
    t = re.sub(r'(?<![A-Za-z0-9_^])([A-Za-z0-9]{1,4})\^\(([A-Za-z][A-Za-z ]*)\)',
               _suptext, t)

    # a named variable carrying a subscript:  rate_X, SUM_j.  Greek letters and
    # function names are NOT prose - "sigma_2" must stay a real sigma so that a
    # following exponent still attaches to it.
    def _namesub(m):
        if m.group(1) in IDENTS or m.group(1) in DISTS:
            return m.group(0)
        stats['named_sub'] += 1
        return protect(r'\text{%s}_{%s}' % (m.group(1), m.group(2)))
    t = sub_free(r'(?<![A-Za-z\\])([A-Za-z]{3,})_([A-Za-z0-9]+)\b',
                 _namesub, t)

    def _opw_side(p):
        """One side of the bar inside P(...): upright text, or plain symbols."""
        if not re.search(r'[a-z]{3,}', p):
            p = re.sub(r'(?<=[A-Za-z])(\d+)', r'_{\1}', p)
            return re.sub(r'_\{?([A-Za-z0-9+\-]+)\}?', r'_{\1}', p)
        mm = re.match(r'^([A-Za-z]\d*(?:_\{?[A-Za-z0-9+\-]+\}?)?'
                      r'(?:\s*,\s*[A-Za-z]\d*(?:_\{?[A-Za-z0-9+\-]+\}?)?)*)'
                      r'\s+([a-z].*)$', p)
        if mm:
            head = re.sub(r'_\{?([A-Za-z0-9+\-]+)\}?', r'_{\1}', mm.group(1))
            return head + r'\ \text{' + mm.group(2) + '}'
        if re.search(r'[_^]', p):
            return None
        return r'\text{' + p + '}'

    def _opw(m):
        # "P(no event occurs)", "P(A_n infinitely often)" and
        # "P(white | urn 3)" read far better as an operator applied to upright
        # text than as a row of italics.  A single | is a conditioning bar.
        inner = m.group(2).strip()
        if re.search(r'[\\=]', inner) or len(inner) > 90:
            return m.group(0)
        sides = [p.strip() for p in inner.split('|')]
        if len(sides) > 2 or not all(sides):
            return m.group(0)
        bodies = []
        for p in sides:
            b = _opw_side(p)
            if b is None:
                return m.group(0)
            bodies.append(b)
        stats['op_of_phrase'] += 1
        return protect(r'\operatorname{%s}\!\left(%s\right)'
                       % (m.group(1), r'\mid '.join(bodies)))
    t = re.sub(r'\b(P|E|V|Var|Cov|Corr|SE|MSE|Bias|Pr)'
               r'\(([^()]*?[a-z]{3,}[^()]*?)\)', _opw, t)
    return t


# ==========================================================================
# 2.  the maximal-expression scanner
# ==========================================================================
OPENERS = {'(': ')', '[': ']'}
OPS = ['<=', '>=', '!=', '->', '=', '<', '>', '+-', '-+', '+', '-', '*', '/',
       '~', '|', ',']
REL_OPS = {'=', '<', '>', '<=', '>=', '!=', '~', '->'}
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
    raw = s[i + 1:j - 1]
    inner = re.sub(PROT + r'[^' + PROT_END + r']*' + PROT_END, ' ', raw)
    for w in WORDY.findall(inner):    # reject prose: "(see below)", "(WiGig)"
        if w not in IDENTS and not product_run(w):
            return -1                 # "(npq)", "(abc)" are products, though
    if PROT not in raw and raw and not re.search(r'[A-Za-z0-9]', raw):
        return -1                     # "(=, +=, -=, ...)" is a code listing
    return j


ABBREV = re.compile(r'^[A-Za-z]\.[A-Za-z]\.')

# short English words that could follow an arithmetic operator; a letter run
# in this set is prose, never a product of variables
SHORT_WORDS = set(
    'in of to is as so we it at by on or an if no do up be the and for not '
    'but are has its all any can may one two see use let now set sum per via '
    'out own off far few top end key bit low new old way add get how why who '
    'you was did too my me us he go on ok vs eg ie our her him his she say '
    'had yet due non pre sub nth odd row col box net job map had say man men '
    'day lot bad big cut end far fit fix full gap job key law lay led let lie '
    'mix nor odd oil out own pay put ran red run sat saw sit six sky son sun '
    'ten tie top try war win yes yet '
    # domain abbreviations that are words, never products of variables
    'cdf pdf pmf mgf pgf cfn iid var cov avg std err val arg ans eqn fig tab '
    'ref iff obs est raw hex dec oct abs sqr sim ols mle mvu ucp asy '
    'cpu gpu ram rom sql xml csv gui usb dns tcp udp ftp ssl www alu isp lan '
    'wan url http nic dma cui gis rle jpg png gif txt zip '
    'dll exe obj src lib dat doc ppt xls bat sys ini log tmp'.split())


def product_run(w):
    """Is this letter run a product of single-letter variables (xy, ab, pq)?"""
    if w in PRODVARS:
        return True
    if re.fullmatch(r'[a-z][A-Z]', w):
        return True               # a coefficient times a variable: aX, cY, hD
    return (2 <= len(w) <= 3 and w.islower() and w not in SHORT_WORDS
            and w not in IDENTS)


def match_atom(s, i, after_arith=False, juxta=False, allow_sign=False):
    """One atom at s[i]; returns (end, carries_math_signal) or (-1, False).

    after_arith says the previous token was + - * or /, in which case a short
    lower-case letter run is read as a product of variables (xy, ab, pq)
    rather than as prose.  juxta says the atom follows another atom directly,
    where only a known product run may be a product.  allow_sign permits a
    leading + or - (or +-), as in "= -1" and "r = +-sqrt(t)".
    """
    n = len(s)
    if i >= n:
        return -1, False
    if ABBREV.match(s[i:]):
        return -1, False              # i.e., e.g., d.f.

    j = i
    signal = False
    if allow_sign:
        ms = re.match(r'\+-|-\+|[+-]', s[j:])
        if ms and j + ms.end() < n and (s[j + ms.end()].isdigit()
                                        or s[j + ms.end()].isalpha()
                                        or s[j + ms.end()] in OPENERS
                                        or s[j + ms.end()] == PROT):
            j += ms.end()

    if s[j] == PROT:
        e = s.find(PROT_END, j)
        if e < 0:
            return -1, False
        j = e + 1
        signal = True
    elif s[j].isdigit():
        j += re.match(r'\d+(?:,\d{3})*(?:\.\d+)?%?', s[j:]).end()
    elif s[j].isalpha():
        w = re.match(r'[A-Za-z]+', s[j:]).group(0)
        # a single letter is a variable; anything longer must be a known
        # mathematical name.  Two-letter English words ("so", "is", "of")
        # must never be swallowed into a formula.
        if len(w) > 1 and w not in IDENTS:
            script_follows = (j + len(w) < n and s[j + len(w)] in '^_')
            ok = (after_arith or script_follows) and product_run(w)
            if not (ok or (juxta and w in PRODVARS)):
                return -1, False
        if w in GREEK_ALL or w in FUNCS or w in OPNAMES or w == 'sqrt':
            signal = True
        j += len(w)
        m2 = re.match(r'\d+', s[j:])  # A1, X2, H0, s2 - indexed variables
        if m2:
            j += m2.end()
            signal = True
        # a function applied to a bracketed argument: sqrt(y), exp(-x),
        # log(n), and the single-letter form f(x), E(X), P(A n B)
        if (w in FUNCS or w in OPNAMES or w == 'sqrt' or len(w) == 1) \
                and j < n and s[j] in OPENERS:
            e = match_group(s, j)
            if e > 0:
                j = e
                signal = True
    elif s[j] in OPENERS:
        e = match_group(s, j)
        if e < 0:
            return -1, False
        if re.search(r'[+\-*/^_=<>|]', s[j:e]) or re.search(r'\d', s[j:e]):
            signal = True
        j = e
    elif s[j] == '|':
        # an absolute value - |X - Y|, |m|, |t| - may open an expression
        e = s.find('|', j + 1)
        if e < 0:
            return -1, False
        inner = s[j + 1:e]
        if not inner or len(inner) > 18 or not re.fullmatch(
                r"[A-Za-z0-9 +\-*/^_.']{1,18}", inner):
            return -1, False
        for w in WORDY.findall(inner):
            if w not in IDENTS:
                return -1, False
        signal = True
        j = e + 1
    else:
        return -1, False

    while j < n:                      # primes, sub/superscripts, factorial
        if s[j] == "'" and not (j + 1 < n and s[j + 1] == 's'):
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
        elif s[j] == '!' and not (j + 1 < n and s[j + 1] == '='):
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
                        # "- a Vandermonde denominator" is prose, not "minus a"
                        if w in ('a', 'A', 'I') and re.match(
                                r'\s+[A-Za-z]', s[nxt + 1:]):
                            okay = False
                    if not okay:
                        return -1, ''
            while k < len(s) and s[k] == ' ':
                k += 1
            return k, op
    return -1, ''


def scan(s, i, allow_sign=False):
    """Longest expression starting at i; returns (end, has_signal)."""
    end, signal = match_atom(s, i, allow_sign=allow_sign)
    if end < 0:
        # "np = 3.9", "pq = 2/9", "ad = bc": a product of variables may open
        # an expression, but only when a relation follows it immediately
        e2, sig2 = match_atom(s, i, after_arith=True)
        if e2 < 0:
            return -1, False
        oe, op = match_op(s, e2)
        if oe < 0 or op not in REL_OPS:
            return -1, False
        end, signal = e2, sig2
    ops = 0
    while True:
        oe, op = match_op(s, end)
        if oe > 0:
            tight = s[end] == op[0] if end < len(s) else False
            ae, sig = match_atom(s, oe, allow_sign=True,
                                 after_arith=(op in ('+', '-', '*', '/', '+-',
                                                     '-+') or op in REL_OPS))
            if ae > 0:
                end = ae
                if op != ',':
                    ops += 1
                signal = signal or sig or op in REL_OPS or op == '/' or ops >= 2
                # "X+Y" written tight is arithmetic; "X - ray" is not
                if op in ('+', '-', '*') and tight and ae - oe <= 1:
                    signal = True
                continue
        k = end + 1 if (end < len(s) and s[end] == ' ') else end
        ae, sig = match_atom(s, k, juxta=True)
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
CLOSERS = {'(': ')', '[': ']', '{': '}'}


def balanced_end(s, i):
    """End index of the bracket group opening at s[i], or -1."""
    if i >= len(s) or s[i] not in CLOSERS:
        return -1
    stack = [s[i]]
    j = i + 1
    while j < len(s) and stack:
        if s[j] in CLOSERS:
            stack.append(s[j])
        elif s[j] in ')]}':
            if CLOSERS[stack[-1]] != s[j]:
                return -1
            stack.pop()
        j += 1
    return -1 if stack else j


def rewrite_scripts(x):
    """^( ... ) and _( ... ) -> ^{ ... }, with nesting: t^((k+1)/k)."""
    guard = 0
    while guard < 24:
        guard += 1
        m = re.search(r'[\^_]\(', x)
        if not m:
            return x
        k = m.end() - 1
        e = balanced_end(x, k)
        if e < 0:
            return x
        x = x[:m.start()] + x[m.start()] + '{' + x[k + 1:e - 1] + '}' + x[e:]
    return x


def rewrite_sqrt(x):
    """sqrt(...) and sqrt[...] -> \\sqrt{...}, however deeply nested."""
    guard = 0
    while guard < 12:
        guard += 1
        m = re.search(r'\bsqrt\s*[\(\[]', x)
        if not m:
            return x
        k = m.end() - 1
        e = balanced_end(x, k)
        if e < 0:
            return x[:m.start()] + r'\sqrt ' + x[m.end():]
        x = x[:m.start()] + r'\sqrt{' + x[k + 1:e - 1] + '}' + x[e:]
    return x


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
    x = x.replace('+-', r' \pm ').replace('-+', r' \mp ')
    x = re.sub(r'(?<![<>=!\\])~', r' \\sim ', x)

    x = rewrite_sqrt(x)
    x = re.sub(r'(?<!\\)\bsqrt\s*([A-Za-z0-9]+)(?![A-Za-z0-9])',
               lambda m: r'\sqrt{%s}' % m.group(1), x)
    x = re.sub(r'\bC\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)',
               lambda m: r'\binom{%s}{%s}' % (m.group(1), m.group(2)), x)

    # |x| is an absolute value; a lone | inside P(...) is conditioning
    x = re.sub(r"(?<![A-Za-z0-9])\|([^|()]{1,16}?)\|(?![A-Za-z0-9])",
               lambda m: r'\lvert %s\rvert ' % m.group(1), x)
    x = x.replace('|', r'\mid ')

    x = rewrite_scripts(x)
    # an exponent is digits, or a name with an optional index - never a
    # digit run glued to a letter run, or X^2Y^2 would become X^{2Y}^{2}
    SCR = r'(-?\d+|-?[a-z]+\d*|-?[A-Z]\d*)'
    x = re.sub(r'\^' + SCR + r'(?![}])', lambda m: '^{%s}' % m.group(1), x)
    x = re.sub(r'_' + SCR + r'(?![}])', lambda m: '_{%s}' % m.group(1), x)
    # y0, y1, A1, X2 are indexed variables in this corpus
    x = re.sub(r'(?<![\\A-Za-z_^])([A-Za-z])(\d+)(?![A-Za-z0-9}])',
               lambda m: '%s_{%s}' % (m.group(1), m.group(2)), x)

    GREEK_ALT = '|'.join(sorted(GREEK_ALL, key=len, reverse=True))
    x = re.sub(r'(?<![A-Za-z\\])(' + GREEK_ALT + r')(\d+)(?![A-Za-z0-9])',
               lambda m: '\\%s_{%s}' % (m.group(1), m.group(2)), x)
    x = re.sub(r'(?<![A-Za-z\\])(' + GREEK_ALT + r')(?![A-Za-z])',
               lambda m: '\\' + m.group(1), x)
    x = re.sub(r'(?<![A-Za-z\\])(' + '|'.join(FUNCS) + r')(?![A-Za-z])',
               lambda m: '\\' + m.group(1), x)
    x = re.sub(r'(?<![A-Za-z\\])(' + '|'.join(OPNAMES) + r')(?![A-Za-z])',
               lambda m: r'\operatorname{%s}' % m.group(1), x)
    x = re.sub(r'(?<![A-Za-z\\{])(Pr|E|P|V)(?=\s*[\(\[])',
               lambda m: r'\operatorname{%s}' % m.group(1), x)

    x = re.sub(r'(?<=[\d}])\s*[x×]\s*(?=[\d(])', r' \\times ', x)
    # a spaced x is multiplication when it sits between two finished operands
    x = re.sub(r'(?<=[\d\)\]])\s+[x×]\s+(?=[\d\(\[\\]|[A-Za-z][\^_])',
               r' \\times ', x)
    x = re.sub(r'(?<![A-Za-z0-9])([a-wyz])\s+[x×]\s+(?=[a-wyz][\^_ ])',
               r'\1 \\times ', x)
    x = re.sub(r'(?<=[\w\)\}' + HOLD_B + r'])\s*\*\s*'
               r'(?=[\w\(\\' + HOLD_A + r'])', r' \\cdot ', x)

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
        # a leading sign belongs to the expression: "-log U", "+-sqrt(t)"
        signed = (c in '+-' and i + 1 < n
                  and (s[i + 1].isdigit() or s[i + 1].isalpha()
                       or s[i + 1] in OPENERS or s[i + 1] == PROT))
        if not (c.isdigit() or c.isalpha() or c in OPENERS or c == PROT
                or c == '|' or signed):
            out.append(c)
            i += 1
            continue
        prev = s[i - 1] if i > 0 else ''
        prime = prev == "'" and i >= 2 and s[i - 2].isalnum()
        if i > 0 and (prev.isalnum() or prev in '\\_^' or prime):
            out.append(c)
            i += 1
            continue
        end, signal = scan(s, i, allow_sign=signed)
        # a two-letter Greek name (mu, pi, xi, nu) is a whole formula on its
        # own, but only where it stands as a word - never inside f(xi)
        head = s[i:end].strip() if end > i else ''
        short_ok = (0 < end - i < MIN_LEN
                    and (head in GREEK_ALL
                         or re.fullmatch(r'[A-Za-z]\d+', head))
                    and (end >= n or not (s[end].isalnum() or s[end] == ')')))
        if end < 0 or not signal or (end - i < MIN_LEN and not short_ok):
            m = re.match(r'[A-Za-z]+|\d+(?:\.\d+)?', s[i:])
            step = m.end() if m else 1
            out.append(s[i:i + step])
            i += step
            continue
        expr = s[i:end].rstrip(' ')
        ms = re.search(r'(?:^|\s)sqrt$', expr)
        if ms:                         # "sqrt(2) sqrt(sum)" - argument refused
            expr = expr[:ms.start()]
            if len(expr) < MIN_LEN:
                out.append(s[i:i + 1])
                i += 1
                continue
        end = i + len(expr)
        if re.fullmatch(r'[A-Z]/[A-Z]', expr):
            out.append(expr)           # I/O, A/D, R/W - acronyms, not ratios
            i = end
            continue
        if re.match(r'^\([a-d]\)', expr):
            out.append(s[i:i + 3])     # "option (d) 13/24" - an option label
            i += 3
            continue
        if re.match(r'^[aAI] (?![-+*/=<>~|,])', expr):
            out.append(s[i:i + 2])     # "a chi-square test" - an article
            i += 2
            continue
        if expr in GREEK_ALL and end < n and s[end] == '-' \
                and end + 1 < n and s[end + 1].isalpha():
            out.append(expr)           # "the Gamma-Beta connection"
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
