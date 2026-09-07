#!/usr/bin/env python3
"""Derive a third classification level (syllabus concept / subtopic) for every
PYQ by matching its text against a lexicon taken verbatim from the official
UPSC ISS Statistics-I syllabus (README.md).

Matching runs in three passes so that the finest evidence always wins:
  pass 1 - the question's own text (shared stem + stem + options)
  pass 2 - the mined topic name, for items whose wording is too terse
  pass 3 - fall back to the mined topic name itself

The lexicon is scoped per unit, so a Numerical-Analysis keyword can never leak
into a Probability item.  A regex written as '!...' is matched case-sensitively
(used for acronyms such as ARE, OS, CD that collide with ordinary words).

Output: build/subtopics.json  {questionId: syllabusConcept}
"""
import json
import os
import re
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LEX = {
    'Probability': [
        ("Bayes' Theorem", r"bayes|posterior probability"),
        ("Law of Total Probability", r"total probability|law of total"),
        ("Borel & Kolmogorov 0-1 Laws", r"borel|zero[- ]one law|0-1 law|infinitely often"),
        ("Tchebycheff's Inequality", r"chebysh|tchebych|chebich|markov'?s inequality"),
        ("Kolmogorov's Inequality", r"kolmogorov'?s inequality"),
        ("Central Limit Theorem", r"central limit|lindeberg|lyapunov|liapounov|\bCLT\b"),
        ("Laws of Large Numbers",
         r"law of large|weak law|strong law|!\bWLLN\b|!\bSLLN\b"),
        ("Characteristic Function", r"characteristic function|\bc\.f\.|\\phi_?\{?[XY]"),
        ("Probability Generating Function", r"probability generating|\bp\.?g\.?f\b"),
        ("Moment Generating Function",
         r"moment generating|\bm\.?g\.?f\b|M_\{?[XYZ]|moment[- ]generating"),
        ("Inversion, Uniqueness & Continuity Theorems",
         r"inversion theorem|uniqueness theorem|continuity theorem"),
        ("Modes of Convergence",
         r"converges? (?:in|almost|with probability)|convergence in|in probability|"
         r"in distribution|mean square|almost sure|converge[sd]? to"),
        ("Multinomial Distribution", r"multinomial"),
        ("Hypergeometric Distribution", r"hyper ?geometric"),
        ("Negative Binomial Distribution", r"negative binomial|pascal distribution"),
        ("Geometric Distribution", r"geometric distribution|geometric with param"),
        ("Binomial Distribution", r"binomial"),
        ("Poisson Distribution", r"poisson"),
        ("Bernoulli Distribution", r"bernoulli"),
        ("Lognormal Distribution", r"log ?normal"),
        ("Cauchy Distribution", r"cauchy"),
        ("Laplace Distribution", r"laplace|double exponential"),
        ("Beta Distribution", r"beta distribution|beta variate|beta function|B\(m,\s*n\)"),
        ("Gamma Distribution", r"gamma distribution|gamma variate|gamma function|\\Gamma\("),
        ("Exponential Distribution", r"exponential"),
        ("Uniform / Rectangular Distribution",
         r"uniform|rectangular distribution|!\bU\(0"),
        ("Normal Distribution",
         r"normal distribution|standard normal|!\bN\(0|!\bN\(\\mu|\\Phi\("),
        ("Conditional Expectation",
         r"conditional expectation|conditional (?:mean|variance)|E\(.*\\mid|E\[.*\\mid"),
        ("Conditional Distributions",
         r"conditional (?:distribution|density|pdf|pmf|p\.d\.f|p\.m\.f)|given \$?[XY]"),
        ("Marginal Distributions", r"marginal"),
        ("Random Vectors & Joint Distributions",
         r"joint|bivariate|random vector|jointly distributed"),
        ("Distributions of Functions of Random Variables",
         r"distribution of \$?[A-Z]|transformation|jacobian|distribution of the"),
        ("Mathematical Expectation",
         r"expectation|expected value|\bE\(|\bE\[|\bmoment|variance of"),
        ("Distribution Functions & Their Properties",
         r"distribution function|\bc\.d\.f|\bcdf\b"),
        ("Discrete & Continuous Random Variables",
         r"random variable|probability (?:mass|density) function|\bpmf\b|\bpdf\b|"
         r"p\.d\.f|p\.m\.f"),
        ("Conditional Probability", r"conditional probability|\\mid|given that"),
        ("Classical & Axiomatic Definitions of Probability",
         r"independent events|mutually exclusive|sample space|axiom|at random|"
         r"probability that"),
    ],
    'Statistical Methods': [
        ("Kolmogorov-Smirnov Test", r"kolmogorov[- ]smirnov|!\bK-S\b"),
        ("Wald-Wolfowitz Test", r"wald[- ]wolfowitz"),
        ("Mann-Whitney Test", r"mann[- ]whitney"),
        ("Wilcoxon Test", r"wilcoxon"),
        ("Sign Test", r"sign test"),
        ("Median Test", r"median test"),
        ("Run Test", r"\bruns?\b[^.]{0,40}test|test[^.]{0,40}\bruns?\b|number of runs"),
        ("Goodness of Fit Test", r"goodness of fit"),
        ("Non-parametric Tests",
         r"non[- ]?parametric|distribution[- ]free|kruskal|friedman|spearman|kendall"),
        ("Asymptotic Relative Efficiency",
         r"asymptotic relative efficiency|!\bARE\b|relative efficiency"),
        ("Intraclass Correlation", r"intra[- ]?class"),
        ("Correlation Ratio", r"correlation ratio"),
        ("Partial Correlation",
         r"partial correlation|partial regression|r_\{?\d\d\.\d|b_\{?\d\d\.\d"),
        ("Multiple Correlation", r"multiple correlation|R_\{?\d\.\d\d|R\^2_"),
        ("Distribution of the Correlation Coefficient",
         r"correlation coefficient|coefficient of correlation|correlation between|"
         r"\\rho|karl pearson"),
        ("Bivariate Normal Distribution", r"bivariate normal|!\bBVN\b"),
        ("Polynomial Regression",
         r"polynomial regression|second degree[^.]{0,20}regression|parabolic"),
        ("Linear Regression", r"regression|line of best fit"),
        ("Curve Fitting & Orthogonal Polynomials",
         r"curve fitting|least squares|orthogonal polynomial|fitting a curve|"
         r"fitted (?:curve|line)"),
        ("Association & Contingency",
         r"contingency|association|attribute|yule|colligation|\bconsistent\b.*class"),
        ("Order Statistics - Range",
         r"sample range|distribution of the range|range of (?:the |a )?(?:sample|"
         r"random sample)"),
        ("Order Statistics - Minimum, Maximum & Median",
         r"order statistic|smallest (?:observation|value)|largest (?:observation|value)|"
         r"sample median|minimum of|maximum of|X_\{\(\d|Y_\{?\(?1\)?\b"),
        ("Skewness", r"skew"),
        ("Kurtosis", r"kurtosis|leptokurtic|platykurtic|mesokurtic"),
        ("F-Distribution", r"!\bF[- ]distribution|F_\{|snedecor|variance ratio"),
        ("Chi-square Distribution", r"chi[- ]?squares?|\\chi\^?\{?2"),
        ("t-Distribution", r"student|t[- ]distribution|t[- ]statistic|t_\{"),
        ("Small Sample Tests", r"small sample|t[- ]test|paired"),
        ("Large Sample Tests & Standard Errors",
         r"standard error|large sample|finite population correction|\bZ[- ]test"),
        ("Tests of Significance",
         r"significan|null hypothesis|alternative hypothesis|critical (?:value|region)|"
         r"level of significance|type i|type ii|\bp[- ]value|\bpower\b.*test|"
         r"reject.*hypothesis"),
        ("Sampling Distribution of Sample Variance",
         r"sample variance|sampling distribution[^.]{0,30}variance|!\bS\^2|!\bs\^2"),
        ("Sampling Distribution of Sample Mean",
         r"sample mean|sampling distribution|\\bar\s*\{?[Xx]|\\overline\{?[Xx]"),
        ("Bivariate & Multivariate Data",
         r"bivariate|multivariate|two variables|scatter"),
        ("Measures of Dispersion",
         r"variance|standard deviation|dispersion|mean deviation|quartile deviation|"
         r"coefficient of variation|\brange\b"),
        ("Measures of Location",
         r"arithmetic mean|geometric mean|harmonic mean|\bmedian\b|\bmode\b|"
         r"\baverage\b|percentile|quartile|measure of (?:location|central)|\bmean\b"),
        ("Frequency Distribution & Presentation of Data",
         r"frequency distribution|histogram|ogive|class interval|frequency table|"
         r"\bchart|diagram|tabulat"),
    ],
    'Numerical Analysis': [
        ("Runge-Kutta Method", r"runge[- ]?kutta|!\bRK[24]?\b"),
        ("Picard's Method", r"picard"),
        ("Milne's Method", r"milne"),
        ("Euler's Method", r"euler"),
        ("Weddle's Rule", r"weddle|waddle"),
        ("Simpson's Three-Eighth Rule", r"three[- ]eight|3/8|three-?eighth"),
        ("Simpson's One-Third Rule", r"simpson"),
        ("Trapezoidal Rule", r"trapezoid"),
        ("Inverse Interpolation", r"inverse interpolation"),
        ("Bessel's Formula", r"bessel"),
        ("Stirling's Formula", r"stirling|sterling"),
        ("Gauss Central Difference Formula", r"gauss"),
        ("Lagrange's Formula (Unequal Intervals)", r"lagrange"),
        ("Newton's Divided Difference Formula", r"divided difference"),
        ("Newton-Gregory Backward Interpolation Formula",
         r"backward interpolation|newton[^.]{0,25}backward|gregory[^.]{0,25}backward"),
        ("Newton-Gregory Forward Interpolation Formula",
         r"forward interpolation|newton[^.]{0,25}forward|gregory|newton'?s formula"),
        ("Error Terms in Interpolation Formulae",
         r"truncation error|error term|remainder term|error in interpolat|"
         r"global (?:truncation )?error"),
        ("Numerical Integration",
         r"numerical integration|quadrature|\\int|approximate.*area|area bounded"),
        ("Interpolation & Extrapolation",
         r"interpolat|extrapolat|estimate the value of"),
        ("Summation of Series",
         r"summation of|sum of the series|geometric progression|"
         r"first difference of a function|\\sum|series"),
        ("Differences of Zero", r"differences? of zero|\\Delta\^\{?n\}?\s*0"),
        ("Factorial Representation of a Polynomial",
         r"factorial (?:polynomial|notation|representation)|x\^\{\(\d|\bx\^\(\d"),
        ("Separation of Symbols", r"separation of symbols|symbolic"),
        ("Sub-division of Intervals",
         r"sub[- ]?division|interval of differenc|equal subinterval|step (?:size|length)"),
        ("Delta, E and D Operators",
         r"\\Delta|\\nabla|\\delta|\\mu|operator|shift operator|!\bE\^"),
        ("Finite Differences of Different Orders",
         r"finite difference|difference table|forward difference|backward difference|"
         r"central difference|\bdifference\b"),
    ],
    'Computer Application and Data Processing': [
        ("Computer Security, Virus, Antivirus, Firewall, Spyware, Malware",
         r"virus|antivirus|firewall|spyware|malware|\bworm\b|trojan|phishing|"
         r"security|encrypt|ransomware|hacker|cyber|\bISO/IEC 27001"),
        ("Number Systems & Binary Arithmetic",
         r"binary|octal|hexadecimal|number system|two'?s complement|"
         r"one'?s complement|!\bBCD\b|gray code|!\bASCII\b|unicode|bitwise|radix|"
         r"boolean|karnaugh|logic gate|!\bXOR\b|!\bNAND\b|!\bNOR\b|flip[- ]?flop"),
        ("Network - LAN, WAN, Internet, Intranet",
         r"!\bLAN\b|!\bWAN\b|!\bMAN\b|internet|intranet|network|router|"
         r"protocol|!\bIP\b|!\bTCP\b|!\bHTTP|topolog|ethernet|wi-?fi|802\.|"
         r"bandwidth|modem|!\bISP\b|!\bURL\b|!\bDNS\b|packet|!\bOSI\b|!\bARP\b|"
         r"!\bFTP\b|!\bSMTP\b|!\bMAC\b address"),
        ("Database, Information & DBMS",
         r"database|!\bDBMS\b|!\bSQL\b|primary key|normalis|normaliz|"
         r"!\bER\b model|frontend|front[- ]end|backend|back[- ]end|data warehouse|"
         r"data mining|!\bDDL\b|!\bDML\b|relation(?:al)? model"),
        ("Operating Systems, Packages & Utilities",
         r"operating system|!\bOS\b|!\bUNIX\b|linux|windows|kernel|shell|"
         r"\bprocess\b|scheduling|deadlock|paging|page fault|virtual memory|thread|"
         r"semaphore|file system|utility|multiprogramming|time[- ]sharing|"
         r"segmentation|swapping|\bbooting\b"),
        ("Low & High Level Languages, Compiler, Assembler",
         r"compiler|assembler|interpreter|linker|loader|high[- ]level|low[- ]level|"
         r"machine language|assembly|source code|object code|!\bC\+\+|\bjava\b|"
         r"python|cobol|fortran|programming language|\bsyntax\b"),
        ("Algorithm & Flowchart", r"algorithm|flow ?chart|pseudo ?code"),
        ("Variables, Control Structures, Arrays, Functions, Loops",
         r"\barray\b|\bloop\b|control structure|conditional statement|\bfunction\b|"
         r"\bmodule\b|recursion|variable|exception|debug|if[- ]then|do[- ]while|"
         r"for loop|switch|\bstack\b|\bqueue\b|linked list|sorting|searching|pointer|"
         r"\bstring\b"),
        ("Memory - RAM, ROM & Units of Computer Memory",
         r"!\bRAM\b|!\bROM\b|cache|memory|\bbits?\b|\bbytes?\b|kilobyte|megabyte|"
         r"gigabyte|terabyte|!\bKB\b|!\bMB\b|!\bGB\b|!\bTB\b|register|storage|"
         r"!\bEPROM\b|!\bPROM\b|!\bDRAM\b|!\bSRAM\b|buffer"),
        ("Hardware: Input, Output & Peripheral Devices",
         r"printer|plotter|scanner|keyboard|mouse|monitor|!\bdpi\b|peripheral|"
         r"input device|output device|hard ?disk|optical|!\bCD\b|!\bDVD\b|laser|"
         r"!\bUSB\b|touch ?screen|!\bOCR\b|!\bOMR\b|!\bMICR\b|barcode|joystick|"
         r"light pen|speaker|!\bDMA\b|interrupt"),
        ("Units of a Computer System: CPU, ALU, Control, I/O",
         r"!\bCPU\b|!\bALU\b|arithmetic (?:and|&) logic|control unit|accumulator|"
         r"program counter|instruction register|!\bRISC\b|!\bCISC\b|clock speed|"
         r"microprocessor|\bbus\b|\bfetch\b|pipeline"),
        ("Operations of a Computer & Basics",
         r"computer|hardware|software|data processing|multimedia|virtual reality"),
    ],
}


def compile_lex():
    out = {}
    for unit, rows in LEX.items():
        comp = []
        for label, rx in rows:
            parts_ci, parts_cs = [], []
            for alt in rx.split('|'):
                (parts_cs if alt.startswith('!') else parts_ci).append(
                    alt[1:] if alt.startswith('!') else alt)
            pair = []
            if parts_ci:
                pair.append(re.compile('|'.join(parts_ci), re.I))
            if parts_cs:
                pair.append(re.compile('|'.join(parts_cs)))
            comp.append((label, pair))
        out[unit] = comp
    return out


COMPILED = compile_lex()


def classify(unit, text):
    for label, regexes in COMPILED.get(unit, []):
        for rx in regexes:
            if rx.search(text):
                return label
    return None


def main():
    merged = json.load(open(os.path.join(ROOT, 'build', 'merged.json')))
    out = {}
    hits = Counter()
    p1 = p2 = p3 = 0
    for r in merged:
        own = ' '.join(filter(None, [r['sharedStem'], r['stem'],
                                     ' '.join(r['options'] or [])]))
        c = classify(r['unit'], own)
        if c:
            p1 += 1
        else:
            c = classify(r['unit'], r['topic'])
            if c:
                p2 += 1
            else:
                c = r['topic']
                p3 += 1
        out[r['id']] = c
        hits[(r['unit'], c)] += 1

    with open(os.path.join(ROOT, 'build', 'subtopics.json'), 'w') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)

    print('questions classified        : %d' % len(out))
    print('  pass 1 (question text)    : %d' % p1)
    print('  pass 2 (topic name)       : %d' % p2)
    print('  pass 3 (topic name as-is) : %d' % p3)
    print('distinct syllabus concepts  : %d' % len(hits))
    for u in LEX:
        rows = sorted(((c, n) for (uu, c), n in hits.items() if uu == u),
                      key=lambda t: -t[1])
        print('\n[%s]  %d concepts, %d questions'
              % (u, len(rows), sum(n for _, n in rows)))
        for c, n in rows:
            print('    %-58s %3d' % (c[:58], n))


if __name__ == '__main__':
    main()
