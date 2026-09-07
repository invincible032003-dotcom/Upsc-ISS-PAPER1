# ISS Paper-I · Topic (i) PROBABILITY — PYQ Data-Mine (2018–2026)

**Corpus:** 9 papers × 80 Q (2018,2019,2020,2021,2022,2023,2024,2025,2026) = 720 Q. **Probability ≈ 192 Q (~24% of paper, ~21 Q/year)** — always inside the first 40 (Prob+Stat Methods block; NA/CS live at Q41–80 in a shifting split). Counts below are data-mined by re-solving each item, not pattern-matched — ±1–2 at subtopic level on genuinely dual-tagged items.

**Syllabus-boundary rule (read this first):** χ², Student's-t, F are **never** filed here even when the *derivation* is pure RV-transformation, because the official syllabus lists them only under Statistical Methods ("sampling distributions of sample mean, sample variance, t, chi-square and F"), not among the 16 Probability-named laws. Bivariate Normal is syllabus-placed under Statistical Methods too — its full treatment (conditional mean/var, regression form, correlation) is in `02-statistical-methods.md`; only ρ-free / pure-independence joint-normal items stay here. Order statistics (min/max/range/median notation $X_{(r)}$) are SM. This keeps both files syllabus-accurate instead of splitting by "what technique it feels like."

---

## Master weightage grid

| # | Subtopic | ~Total | Years hit | Read |
|---|---|---|---|---|
| A | Classical/axiomatic probability, combinatorics | 14 | every year | stable, Q1-type opener almost every paper |
| B | Total probability & Bayes' theorem | 11 | every year | **guaranteed 1/paper**, often 2 |
| C | Discrete laws (Binomial, Poisson, Geometric, NegBin, Hypergeom, Multinomial) as subject | 26 | every year | Binomial > Poisson > Geometric in frequency |
| D | Continuous laws (Uniform, Exponential, Normal, Cauchy, Laplace, Beta, Gamma, Lognormal) as subject | 34 | every year | Beta/Gamma pair is the single most-recycled engine |
| E | Joint/marginal/conditional dist'ns, random vectors, transformations (incl. Jacobian) | 42 | every year | **largest bucket** — treat as highest-yield |
| F | Expectation, conditional expectation, moments | 21 | every year | tail-sum formula, symmetric-alternating-series traps |
| G | MGF / PGF / characteristic function | 18 | every year | CF questions rising 2024–26 |
| H | Modes of convergence, Borel/Kolmogorov 0-1 law | 12 | 18,19,20?,21,22,24,25 | conceptual "statement-truth" MCQs, no computation |
| I | Chebyshev's / Markov-type inequalities | 8 | 18,19,20,21,23,24,26 | plug-in, rarely a trap once formula is known |
| J | LLN & CLT | 12 | every year | "at least ___" phrasing ⇒ Chebyshev, not exact CLT |
| K | Distribution-function properties, PIT, CDF-validity puzzles | 14 | every year | "find $\alpha$ for valid CDF" is a recurring template |

*(Rows don't sum to 192 — E, K and several subject-distribution items legitimately double-count a question's mechanism vs. its label; use this as a revision map, not an audit trail.)*

---

## A. Classical & Axiomatic Probability

**Core tools**
$$P\Big(\bigcup_{i=1}^n A_i\Big)=1-\prod_{i=1}^n\big(1-P(A_i)\big)\ \text{(independent events)} \qquad P(A\cup B)=P(A)+P(B)-P(A\cap B)$$
Boole's inequality: $P(\bigcup A_i)\le \sum P(A_i)$. For "ordered/unordered, with/without replacement" counting, the four-case table (permutations $n^{(r)}$, combinations $\binom nr$, with-repetition $n^r$, $\binom{n+r-1}{r}$) is the whole game.

**Anchors:** 18-Q1 (4-event union, independent) · 21-Q29 (16 around a round table, exactly 4 between A,B — circular arrangement trap: fix A, count B's position) · 22-Q8 ($2n$ boys/$2n$ girls into equal batches — hypergeometric-flavoured combinatorics) · 24-Q21 (unit square geometric probability) · 25-Q5 (miner-in-mine: **recursive expectation**, not counting — see §F) · 26-Q20 (quadratic real-roots ⇒ area on $XY$-plane).

**TRAP:** Circular-arrangement and "at least one" problems are graded almost every year on whether you fixed a reference point / used the complement — always compute $1-P(\text{none})$ for "at least one" phrasing rather than direct summation.

---

## B. Total Probability & Bayes' Theorem

$$P(A_i\mid B)=\frac{P(B\mid A_i)P(A_i)}{\sum_j P(B\mid A_j)P(A_j)}$$

**Anchors:** 18-Q4 (3 urns) · 19-Q12 (2 cannons) · 19-Q13 (5% treated patients) · 20-Q40 (3 factories, defective bulb) · 22-Q44 (fair vs two-headed coin) · 23-Q1 (3 rental agencies — pure law of total probability, no inversion needed) · 26-Q12 (3 urns, white ball).

**TRAP:** UPSC always sets up **≥3 sources** (never 2) to force full LOTP before Bayes — computing only for the asked source without normalising by the *other two* is the #1 error. Also watch "given a defective was found" vs "probability of defective" — the former needs the Bayes denominator, the latter stops at LOTP (23-Q1 stops at LOTP; 20-Q40, 26-Q12 need the full ratio).

---

## C. Discrete Distributions (as subject)

| Law | Mean | Var | pgf/MGF | Note |
|---|---|---|---|---|
| Bernoulli($p$) | $p$ | $pq$ | $q+pe^t$ | |
| Binomial($n,p$) | $np$ | $npq$ | $(q+pe^t)^n$ | mode $=\lfloor(n+1)p\rfloor$ |
| Poisson($\lambda$) | $\lambda$ | $\lambda$ | $e^{\lambda(e^t-1)}$ | sum of independent Poissons is Poisson |
| Geometric($p$), support $1,2,\dots$ | $1/p$ | $q/p^2$ | $\dfrac{pt}{1-qt}$ | memoryless; min of iid geometrics is geometric |
| Negative Binomial($r,p$) | $rq/p$ | $rq/p^2$ | $\left(\dfrac{p}{1-qt}\right)^r$ | "$r$-th success" waiting-time generalisation |
| Hypergeometric($N,K,n$) | $n\frac KN$ | $n\frac KN\frac{N-K}N\frac{N-n}{N-1}$ | — | finite-population analogue of Binomial |
| Multinomial | $E(X_i)=np_i$ | $np_i(1-p_i)$ | $\mathrm{Cov}(X_i,X_j)=-np_ip_j$ | **always negative covariance** — sign-trap bait |

**Anchors:** 18-Q7 (Binomial(13,0.3) mode+skew) · 19-Q15 (7th child = 2nd daughter → NegBin) · 22-Q1/Q2 (Bernoulli sum ± Binomial complement; Multinomial $\mathrm{cov}$) · 23-Q4 (disguised Binomial via a $\binom{10}{x}2^x3^{10-x}/5^{10}$ pmf — recognise $p=2/5$) · 24-Q10 (Cauchy from normal ratio, contrast with NegBin/Geometric combo in 26-Q10).

**TRAP:** Multinomial covariance is **always negative** ($-np_ip_j$) — any positive-covariance option is an automatic reject. Geometric mean/variance flips completely under the two support conventions ($x=1,2,\dots$ vs. $x=0,1,2,\dots$); always re-derive from the pgf rather than recalling the number.

---

## D. Continuous Distributions (as subject)

| Law | pdf support | Mean | Var | Note |
|---|---|---|---|---|
| Uniform/Rectangular $U(a,b)$ | $[a,b]$ | $\frac{a+b}2$ | $\frac{(b-a)^2}{12}$ | |
| Exponential($\theta$), rate | $x>0$ | $1/\theta$ | $1/\theta^2$ | memoryless; **only** continuous law with it besides trivial cases |
| Normal $N(\mu,\sigma^2)$ | $\mathbb R$ | $\mu$ | $\sigma^2$ | MGF $e^{\mu t+\sigma^2t^2/2}$ |
| Cauchy | $\mathbb R$ | undefined | undefined | ratio of independent $N(0,1)$'s; no moments exist at all |
| Laplace (double-exp), scale $b$ | $\mathbb R$ | $\mu$ | $2b^2$ | $f(x)=\frac1{2b}e^{-|x-\mu|/b}$; **difference of iid Exponentials is Laplace** |
| Beta-I($\alpha,\beta$) | $(0,1)$ | $\frac{\alpha}{\alpha+\beta}$ | $\frac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}$ | mode $\frac{\alpha-1}{\alpha+\beta-2}$, $\alpha,\beta>1$ |
| Beta-II | $(0,\infty)$ | $\frac{\alpha}{\beta-1}$ ($\beta>1$) | — | $Y=\frac{X}{1-X}$, $X\sim$Beta-I $\Rightarrow Y\sim$Beta-II |
| Gamma($\alpha,\lambda$), rate | $x>0$ | $\alpha/\lambda$ | $\alpha/\lambda^2$ | sum of iid Exp($\lambda$) is Gamma($n,\lambda$) |
| Lognormal($\mu,\sigma^2$) | $x>0$ | $e^{\mu+\sigma^2/2}$ | $(e^{\sigma^2}-1)e^{2\mu+\sigma^2}$ | $\log X\sim N(\mu,\sigma^2)$ |

**The Gamma↔Beta engine (highest-yield single pattern in the entire subject):** $X\sim G(\alpha_1,\beta),\,Y\sim G(\alpha_2,\beta)$ independent $\Rightarrow \dfrac{X}{X+Y}\sim \text{Beta-I}(\alpha_1,\alpha_2)$, independent of $X+Y\sim G(\alpha_1+\alpha_2,\beta)$. Drives 18-Q9, 18-Q20, 22-Q47/Q48 (density $\propto \frac{x^3}{(1+2x)^6}$ is Beta-II in disguise via $Y=\frac{2X}{1+2X}$), 23-Q18–20 (same Beta-II-via-substitution trick, different exponents).

**Anchors:** 20-Q25 (memoryless-property MCQ — Exponential & Geometric only) · 20-Q34 (max probability an Exponential can assign a fixed-length interval — optimise over $\theta$) · 23-Q3 (Exponential var>mean statement, true only for $0<\theta<1$ since $\mathrm{Var}=1/\theta^2,\ \mathrm{Mean}=1/\theta$) · 25-Q6 (Laplace CDF, piecewise) · 26-Q11 (ratio of independent standard normals ⇒ Cauchy(0,1), not $t_1$ — a $t_1$-Cauchy identity trap).

**TRAP:** "Variance > Mean iff $\theta<1$" for Exponential($\theta$) is a **recurring true/false bait** (18-Q10, 23-Q3) — don't confuse with Poisson where mean=variance always. Cauchy has **no** mean/variance/MGF; any question offering a numeric mean for Cauchy is auto-wrong.

---

## E. Joint/Marginal/Conditional Distributions, Random Vectors, Transformations

This is the single busiest examiner template: give a joint pdf/pmf (often with an unknown normalising constant), then ask for $E(XY)$, $\mathrm{Cov}$, a marginal, a conditional density, or $P(\text{region})$.

**Standard workflow:**
1. Normalise: $\iint f=1$ solves for the constant.
2. Marginal: integrate/sum out the other variable.
3. Conditional: $f_{Y|X}(y|x)=f(x,y)/f_X(x)$.
4. For $g(X,Y)=Z$: use CDF technique or Jacobian $f_Z(z)=f_{X,Y}(x(z),y(z))\left|J\right|$.

**Anchors (representative, not exhaustive — this subtopic alone spans ~40+ items):** 18-Q5 (test $X\perp Y$ vs. $X^2\perp Y^2$ — classic "uncorrelated ≠ independent" twin), 18-Q15/18-Q16 (same twin, pmf and pdf flavour), 20-Q38 (density of a 3-D linear transform via full Jacobian — $8f(\cdots)$, easy to drop the $2^3$ scaling factor), 21-Q4/Q5 (conditional expectation from $f(x,y)=8xy,\,0<x<y<1$), 23-Q8–10 (hierarchical/compound normal, $X\mid Y=y\sim N(12y,y)$, $Y\sim U(0,1)$ implied by the given joint form itself), 25-Q7 (marginal from $f=2,\ 0<x_1<x_2<1$), 26-Q1–3, Q6–9 (three separate joint-pdf mini-sets in one paper — 2026 leaned unusually hard on this subtopic).

**TRAP:** When a joint density is given in a form like $f(x,y)=\frac{1}{\sqrt{2\pi y}}e^{-(x-12y)^2/2y}$ with no separate statement about $Y$'s marginal, **the given form already integrates to something in $x$**; check whether integrating out $x$ leaves a valid density in $y$ alone (often deliberately Uniform) — this is a "hidden marginal" trap seen in 23-Q8–10. Jacobian questions (20-Q38) drop the constant multiplier under time pressure — always write $|J|$ explicitly before substituting.

---

## F. Expectation, Conditional Expectation, Moments

$$E(X)=\sum_{x=0}^\infty P(X>x)\ \text{(non-negative integer } X\text{)}\qquad \text{Tail-sum: } 2\sum_{x\ge0}xP(X>x)=\sigma^2+\mu^2-\mu$$

**Anchors:** 19-Q14 (discrete $E(|X|)$, plain weighted sum) · 21-Q38 (alternating-sign geometric-weight series — sum as $E(X)$ directly via generating-function trick, don't expand term-by-term) · 23-Q14 (tail-sum identity, 2023-Q14 is literally the boxed formula above) · 25-Q4/Q5 (dice+coin expected win; **miner problem — recursive conditioning**: $E[T]=\frac13(3)+\frac13(5+E[T])+\frac13(7+E[T])\Rightarrow E[T]=15$, a classic renewal-style setup, not a finite sum).

**TRAP:** "Recursive expectation" problems (miner-in-mine, gambler-stops-at-first-win) look like they need an infinite series but collapse to one linear equation in $E[T]$ — spot the self-similarity ("if he picks door 2 or 3, he's back to the start") instead of summing a geometric series by hand.

---

## G. MGF / PGF / Characteristic Function

$$M_X(t)=E(e^{tX}),\quad \varphi_X(t)=E(e^{itX})=M_X(it)\ \text{(always exists, unlike MGF)}$$
Uniqueness theorem: MGF determines the distribution when it exists in a neighbourhood of 0. $M_{X+Y}(t)=M_X(t)M_Y(t)$ for independent $X,Y$ — this is the workhorse for "identify $Z=aX+bY$" questions.

**Anchors:** 18-Q17 ($Z=4X-5Y$, independent normals, MGF) · 18-Q18 (PGF of a "throw till 3 or 4" geometric-type) · 21-Q8 (four T/F statements on CF properties — CF *always* exists and is uniformly continuous; it is **not** independent of change of origin/scale, and factorisation of the joint CF does **not** by itself imply independence unless it holds for *all* $t_1,t_2$ jointly, not marginally) · 24-Q23–25 (three back-to-back CF questions on constructed variables — 2024 leaned unusually hard on CF) · 25-Q45–47 (compound MGF via $M_Z(t)=M_Y(\log M_X(t))$ — read this as "Y-fold compounding of X", a **randomly-stopped-sum** construction).

**TRAP:** $M_Y(\log M_X(t))$-type composite MGFs (24-Q26, 25-Q45–47) are testing the random-sum identity $M_{S_N}(t)=M_N(\log M_X(t))$ — recognise the pattern instantly rather than expanding logs.

---

## H. Modes of Convergence · Borel/Kolmogorov 0-1 Laws

Four modes, strength order (a.s. ⟹ prob ⟹ distribution; mean-square ⟹ probability): distribution ← probability ← {a.s., L²}. **Borel–Cantelli:** independent $A_n$, $\sum P(A_n)<\infty\Rightarrow P(\limsup A_n)=0$; $\sum P(A_n)=\infty\Rightarrow P(\limsup A_n)=1$. Kolmogorov 0-1 law: any tail event of an independent sequence has probability exactly 0 or 1.

**Anchors:** 20-Q32 ($X_n=\sqrt n\mathbb 1(U<1/n^2)$ — check a.s. via Borel–Cantelli ($\sum 1/n^2<\infty\Rightarrow$ a.s. convergence to 0) vs. mean-square ($E[X_n^2]=n/n^2\to0$) — **both hold here**, a rare "both true" answer) · 21-Q7 ($\limsup A_n$ with $\sum P(A_n)<\infty\Rightarrow P(E)=0$, direct BC1) · 22-Q46 ("SFSF infinitely often" pattern — independent Bernoulli blocks, BC2 since $\sum P(\text{block})=\infty\Rightarrow$ probability 1) · 22-Q45 (limiting CDF of $F_n\to U(-n,n)$-type — convergence in distribution to a genuine limit, watch for "does not exist" as a valid option).

**TRAP:** These are pure statement-truth items — no algebra, just correctly matching *which* convergence mode a given rate of decay/growth of $P(A_n)$ implies. Always check $\sum P(A_n)$ convergence **first**; it single-handedly resolves BC1 vs BC2.

---

## I. Chebyshev's / Markov-type Inequalities

$$P(|X-\mu|\ge k\sigma)\le \frac1{k^2}\qquad P(X\ge a)\le \frac{E(X)}a\ (X\ge0,\,a>0)$$

**Anchors:** 18-Q19 / 26-analogue (sales mean 16, var 9, $P(10<\text{sales}<22)\ge\ ?$ — here $k\sigma=6\Rightarrow k=2\Rightarrow$ bound $=1-1/4=0.75$) · 19-Q33/34 (same template, twice) · 21-Q23 (**inverse** problem: given the Chebyshev bound $3/4$ on a symmetric interval, back out $E(X^2)$ via $k\sigma=10\Rightarrow \sigma^2=100/4=25\Rightarrow E(X^2)=\mu^2+\sigma^2=144+25=169$) · 24-Q38 (Markov applied to a sample mean of Exponentials, lower-bound flavour — note this uses Markov's raw inequality on $\bar X$, not a "sampling distribution" CLT approach).

**TRAP:** These are **always inequalities** ("at least", "at most") — never solve for an exact probability. The recurring "automobile sales / weekly production, mean $\mu$ var $\sigma^2$, $P(a<X<b)$ at least ___" phrasing is a 100%-reliable signal to reach for Chebyshev, not the Normal table (no normality is ever assumed).

---

## J. Laws of Large Numbers & Central Limit Theorem

WLLN (via Chebyshev): $\bar X_n\xrightarrow{p}\mu$ if $\mathrm{Var}(X_1)<\infty$. SLLN needs only $E|X_1|<\infty$ (stronger conclusion, weaker moment condition — a favourite T/F trap). CLT: $\dfrac{\sum X_i-n\mu}{\sigma\sqrt n}\xrightarrow{d}N(0,1)$.

**Anchors:** 18-Q33 ($\sqrt n\bar X$ for $U[-3,3]$ sample — large-sample distribution is $N(0,\sigma^2)$ with $\sigma^2=3$, i.e. $N(0,3)$, **not** the finite-sample uniform scaling) · 20-Q35 (round-off error CLT, sum of 1000 uniforms) · 21-Q10 (consistency of $f/n$ as SLLN/WLLN application) · 21-Q25/Q26 (CLT with a twist — deduce $\mathrm{Var}(X_1)$ *backward* from a stated convergence) · 22-Q41 (SLLN condition — finite variance is **sufficient but not necessary**; finite mean alone suffices by Kolmogorov's SLLN, a frequently-misremembered fact) · 25-Q49 (WLLN for a shifted-exponential mean).

**TRAP:** SLLN's true minimal condition is $E|X_1|<\infty$ (Kolmogorov), **not** finite variance — 22-Q41's "correct" option tests exactly this over-strong-condition trap. Also: CLT gives the *limiting* distribution of $\sqrt n(\bar X-\mu)/\sigma$; don't apply it when the question is really asking for the *exact* finite-$n$ distribution (18-Q33 is exact only because Uniform's sum has a known but different exact form — the *stated* large-sample answer is the CLT one).

---

## K. Distribution-Function Properties & the "find $\alpha$" CDF-validity Template

A CDF must be non-decreasing, right-continuous, $F(-\infty)=0,\ F(\infty)=1$. **PIT:** $F(X)\sim U(0,1)$ for continuous $F$; consequently $-\log F(X)\sim \text{Exp}(1)$.

**Anchors:** 20-Q33, 20-Q36, 20-Q37 (three separate "find the range of $\alpha$ for $F$ to be a valid CDF" items in the *same* paper — continuity/monotonicity at the breakpoint is the whole exercise) · 21-Q27 (PIT identity, Statement-1/Statement-2 explanation-pair format).

**TRAP:** These reduce to one inequality: value-just-left-of-breakpoint $\le$ value-just-right (monotonicity), **not** equality (that would force continuity, which isn't required for a valid CDF — only right-continuity is). Students who force equality get a single point instead of a range and pick the wrong option.

---

## Recycled / repeated PYQs (cross-year identical or near-identical stems)

- **Beta-II-via-substitution** ($f(x)=kx^3/(1+2x)^6$): 18-Q20 and 22-Q47/48 — same density family, different specific ask (transform vs. normalising constant).
- **F(m,n): $E(X)E(1/X)$**: 18-Q36 verbatim — appears with identical phrasing in the Statistical-Methods F-distribution set too (cross-file duplicate, filed there per the χ²/t/F rule).
- **Chebyshev "sales/production" template**: 18-Q19, 19-Q33, 19-Q34 — same $k$-solving mechanic, different cover story, virtually every year.
- **"$t_5$-construction constant $C$"**: 18-Q35 and 25-Q59 — identical algebraic skeleton ($C(X_i+X_j)/\sqrt{\sum X_k^2}$), filed under Statistical Methods per the syllabus rule but flagged here since the *derivation* is pure Probability machinery.

---

## Revision priority (highest marginal return first)
1. **E** (joint/conditional/transformations) — largest bucket, tests 3–4 skills per question.
2. **D**, esp. the **Gamma↔Beta engine** — same 3–4 line derivation recurs across 5+ years verbatim.
3. **B** (Bayes/LOTP with ≥3 sources) — near-guaranteed, cheap marks once the "don't forget to normalise" habit is automatic.
4. **G** (MGF/PGF, esp. compound/composite MGF) — rising frequency in 2024–26.
5. **I/J** (Chebyshev, LLN/CLT) — low derivation depth, purely "recognise the template."
