# ISS Paper-I · Topic (ii) STATISTICAL METHODS — PYQ Data-Mine (2018–2026)

**Corpus:** 720 Q total. **Statistical Methods ≈ 168 Q (~21% of paper, ~19 Q/year)**, sharing the Q1–40 block with Probability (exact split shifts year to year — see `01-probability.md` header). This file **owns** Bivariate Normal, χ², t, F, and order statistics by explicit syllabus placement — even where the underlying algebra is pure random-variable manipulation. See the boundary rule in the Probability file if a question feels "misfiled."

---

## Master weightage grid

| # | Subtopic | ~Total | Read |
|---|---|---|---|
| A | Data presentation, measurement scales, frequency distribution | 7 | low-yield, near-verbatim repeats |
| B | Measures of location, dispersion, skewness, kurtosis | 17 | steady every year; combined/pooled-variance sub-pattern recurring |
| C | Association & contingency (attributes) | 11 | Yule's $Q$/$Y$, consistency inequalities, $\chi^2$-of-association |
| D | Curve fitting & orthogonal polynomials | 4 | rare but appears; least-squares-model-comparison sub-pattern |
| E | Bivariate Normal Distribution (full) | ~24 | **single largest subtopic in this file** — near-guaranteed 2–4/year |
| F | Regression (linear, polynomial) | 11 | frequently bundled inside a BVN or correlation question |
| G | Correlation — simple, distribution of $r$, partial, multiple, intraclass, correlation ratio | ~38 | **largest overall** — treat as top priority |
| H | Standard errors & large-sample tests | 14 | CI / SE-of-proportion / two-sample-Z template |
| I | Sampling distributions ($\bar X, s^2, t, \chi^2, F$) + tests based on them | ~32 | second-largest — independence of $\bar X,s^2$ is the recurring engine |
| J | Small-sample tests | (embedded in I/H) | paired vs. unpaired test-choice MCQs |
| K | Non-parametric tests (GOF, sign, median, run, Wilcoxon, Mann–Whitney, Wald–Wolfowitz, KS) | 17 | one of every flavour shows up somewhere across 9 years |
| L | Order statistics (min, max, range, median) | 17 | formula-recall, low derivation depth once memorised |
| M | Asymptotic Relative Efficiency (ARE) | 2 | rare — mean-vs-median ARE is the one recurring instance |

---

## A. Data Presentation & Measurement Scales

Nominal (labels only) → mode; Ordinal (ranked) → median; Interval/Ratio → mean+SD. Data-condensing hierarchy: raw array → frequency distribution → histogram/ogive.

**Anchors:** 18-Q21 (interval/nominal/cross-sectional statement-triple) · 19-Q1 (scale-appropriate statistic triple) · 23-Q21 (which of {array, freq. dist., histogram, ogives} are "data condensing" — **all four qualify**, a common under-selection trap).

---

## B. Measures of Location, Dispersion, Skewness, Kurtosis

$$\text{Pearson's Sk}=\frac{\text{Mean}-\text{Mode}}{\text{SD}}=\frac{3(\text{Mean}-\text{Median})}{\text{SD}}\qquad CV=\frac{\text{SD}}{\text{Mean}}\times100$$
Combined mean/variance of two groups ($n_1,\bar x_1,s_1^2$ and $n_2,\bar x_2,s_2^2$):
$$\bar x_{12}=\frac{n_1\bar x_1+n_2\bar x_2}{n_1+n_2},\qquad s_{12}^2=\frac{n_1(s_1^2+d_1^2)+n_2(s_2^2+d_2^2)}{n_1+n_2},\ d_i=\bar x_i-\bar x_{12}$$

**Anchors:** 18-Q23 (Mean 62, Median 65, Sk $=-0.3\Rightarrow$ SD$=10$ via the empirical formula) · 19-Q3 (CV comparison, height vs. weight — "times as variable" phrasing $=$ ratio of CVs) · 21-Q13/Q39 (mean-deviation-from-median-is-minimum property; linear transform of MD) · 22-Q51 ($R$-ratio true/false triple on MD-vs-SD, assumed-mean-vs-true-mean) · 23-Q22 ($\mathrm{Var}(2X+2)=4\mathrm{Var}(X)$ — additive constant vanishes, only the scale-$2$ matters) · 26-Q28 (**combined-variance back-solve**: given combined $(n,\bar x,s^2)$ and one sub-group's stats, invert the pooled-variance formula for the *other* sub-group's variance — appears as a "reverse" of the direct formula, the higher-difficulty variant).

**TRAP:** Combined-variance problems almost always hide the correction term $d_i^2=(\bar x_i-\bar x_{12})^2$ — forgetting it (using a plain weighted average of $s_1^2,s_2^2$) is the single most common Paper-I arithmetic error in this subtopic.

---

## C. Association & Contingency

For attributes, consistency requires $0\le(AB)\le\min[(A),(B)]$ and $(AB)\ge(A)+(B)-N$. For a $2\times2$ table $\begin{smallmatrix}a&b\\c&d\end{smallmatrix}$:
$$\text{Yule's }Q=\frac{ad-bc}{ad+bc}\ (-1\le Q\le1),\qquad Y=\frac{\sqrt{ad}-\sqrt{bc}}{\sqrt{ad}+\sqrt{bc}}\qquad C=\sqrt{\frac{\chi^2}{\chi^2+N}}$$
$Q=Y=1\iff bc=0$; $Q=-1\iff ad=0$; $Q=0\iff ad=bc$ (independence).

**Anchors:** 18-Q24/Q25 (smoking-habit association, $Q$ computation + definition triple) · 19-Q4 ($(AB)=40$ vs. independence value $(A)(B)/N=30\Rightarrow$ positive association) · 20-Q2 (contingency table, solve missing cells from equal-column-total constraint — pure algebra, no stats) · 20-Q12 (inconsistency-condition triple, note the *reversed* inequalities vs. consistency) · 22-Q56 (COVID vaccination 2×2, association + "preventive measure" interpretation) · 23-Q24 ($\chi^2$ for a 2×2 with **proportional rows** — always evaluates to exactly $0$, a favourite zero-trap) · 25-Q20 (male-population literacy/criminality — compare $(AB)$ to $(A)(B)/N$) · 25-Q60/26-analogue (Yule's $Q,Y$ truth-triple, identical structure to the boxed identities above).

**TRAP:** 23-Q24's table has **proportional rows** (30:30 vs 20:20, i.e. Skilled:Unskilled ratio is 1:1 in both) $\Rightarrow$ perfect independence $\Rightarrow \chi^2=0$ exactly — don't grind the full $\sum(O-E)^2/E$ computation; spot proportionality first.

---

## D. Curve Fitting & Orthogonal Polynomials

Least-squares residual sum $\sum(y_i-\hat y_i)^2$ — smaller SSE model is preferred when comparing two fitted forms for prediction at a *new* $x$. Orthogonal (Hermite-type) polynomials for $N(0,1)$: $H_0=1,\,H_1=x,\,H_2=x^2-1,\,H_3=x^3-3x,\dots$

**Anchors:** 21-Q17 (3rd-degree orthogonal polynomial for standard normal $=x^3-3x$ — direct Hermite recall) · 23-Q37 (two competing models $E_1$ (linear), $E_2$ (quadratic) with given SSEs; predict $Y$ at $X=6$ using the **lower-SSE model**, $E_2$ — the SSE comparison *is* the question, not extra context).

---

## E. Bivariate Normal Distribution (full treatment)

$$f(x,y)=\frac{1}{2\pi\sigma_1\sigma_2\sqrt{1-\rho^2}}\exp\left[-\frac{1}{2(1-\rho^2)}\left(\frac{(x-\mu_1)^2}{\sigma_1^2}-\frac{2\rho(x-\mu_1)(y-\mu_2)}{\sigma_1\sigma_2}+\frac{(y-\mu_2)^2}{\sigma_2^2}\right)\right]$$
- $Y\mid X=x\sim N\!\Big(\mu_2+\rho\frac{\sigma_2}{\sigma_1}(x-\mu_1),\ \sigma_2^2(1-\rho^2)\Big)$ — **conditional mean is the regression line; conditional variance is constant in $x$** (homoscedastic).
- Marginals of $X,Y$ are each univariate Normal — but **Normal marginals alone do NOT imply BVN** (a standard T/F trap).
- $aX+bY$ is Normal for every $a,b$ **iff** $(X,Y)$ is BVN — this *is* the defining property (converse direction is the trap: individually-normal-marginals is weaker).
- $X+Y\perp X-Y$ iff $\sigma_1=\sigma_2$ (equal variances) — not a general BVN fact.

**Reading a BVN off an exponent:** given $f(x,y)=\lambda e^{-Q(x,y)}$ with $Q$ quadratic, match $2(1-\rho^2)Q(x,y)$ to the bracket above; the coefficients of $x^2,y^2,xy$ pin down $\sigma_1^2,\sigma_2^2,\rho$ directly by comparison — this is a **pure coefficient-matching exercise**, never integrate to find $\lambda$ by brute force (use $\lambda=\frac1{2\pi\sigma_1\sigma_2\sqrt{1-\rho^2}}$ directly once $\sigma_1,\sigma_2,\rho$ are known).

**Anchors:** 21-Q18–20 (three-question BVN-from-exponent block — $V(X),V(Y)$, then $\lambda$, then regression line, in sequence) · 22-Q13/Q15/Q18 ($E(e^{X+Y})$ via BVN MGF; $E(X_1^2X_2^2)=1+2\rho^2$ for standard BVN; independence-of-sum-and-difference statement triple) · 23-Q26–31 (**six-question BVN block from one exponent** — the single densest BVN cluster in the corpus) · 23-Q39/40 (Cov$(Y-\rho X,X)=0$ — this is literally the "regression residual is uncorrelated with the regressor" fact; MGF of $X^2+Y^2-2\rho XY$) · 24-Q12/Q36 (pdf of $Z=2X-3Y$ from zero-mean BVN; three-statement BVN block with conditional mean/covariance/conditional-variance) · 25-Q13/Q18 (conditional mean+variance numeric; marginal-distribution-of-$X$ MCQ — correct answer is plain $N(\mu_1,\sigma_1^2)$, **not** the conditional form offered as a distractor) · 26-Q13/Q29 (regression coefficient of $Y$ on $X=\rho\sigma_y/\sigma_x$; $\rho=0$ statement-triple).

**TRAP:** The single most-repeated distractor pattern: offering the **conditional** distribution's parameters as the answer to a **marginal** question (25-Q18) — always check which variable is asked "of" before reading off $\mu,\sigma^2$. Second: $\mathrm{Cov}(Y-\rho X,X)=\mathrm{Cov}(Y,X)-\rho\mathrm{Var}(X)=\rho\sigma_1\sigma_2-\rho\sigma_1^2$; this is $0$ **only when $\sigma_1=\sigma_2$** unless the variables are pre-standardised — 23-Q39 is posed on standard BVN($0,0,1,1,\rho$) specifically so it collapses to exactly $0$; don't over-generalise this to unstandardised BVN.

---

## F. Regression — Linear & Polynomial

$$b_{yx}=r\frac{\sigma_y}{\sigma_x},\quad b_{xy}=r\frac{\sigma_x}{\sigma_y},\quad b_{yx}\cdot b_{xy}=r^2\quad(\text{both }b\text{'s share the sign of }r)$$
Regression lines **always intersect at $(\bar x,\bar y)$** — solving two given regression-line equations simultaneously recovers both means for free.

**Anchors:** 18-Q26 (regression of $Y$ on $X$ from a joint pdf, direct $E(Y\mid X=x)$ computation) · 19-Q5/Q6 (given both regression lines symbolically, bound the slope-product $\le1$, or recover $(r,\sigma_x/\sigma_y)$ as $(\sqrt{ac},\sqrt{a/c})$-type expressions) · 22-Q10/Q14 (regression equation from a joint pdf; least-squares point estimate from raw $\sum$'s) · 24-Q15 (two regression equations given as raw linear forms — solve simultaneously for $\bar x,\bar y$, then read off $b_{yx},b_{xy},r$) · 26-Q30 (regression of $Y$ on $X$ is **not linear** here — density $\propto y\,e^{-y/(1+x)}$ makes $E(Y|X=x)=2(1+x)$, still linear in this case but the *family* is Gamma-conditional, testing whether you recognise linear regression can arise from non-BVN joint laws too).

**TRAP:** $b_{yx}b_{xy}=r^2\le1$ is the fastest sanity check on any "given two regression lines, find $k$" question (19-Q5) — if your slope product exceeds 1, you've mislabelled which line is $Y$-on-$X$ vs. $X$-on-$Y$.

---

## G. Correlation — Simple, Distribution of $r$, Partial, Multiple, Intraclass, Correlation Ratio

$$r=\frac{\mathrm{Cov}(X,Y)}{\sigma_x\sigma_y}\ (\text{sign-invariant under }X\to aX+b,\ a>0;\text{ flips if }a<0)$$
**Fisher's Z:** $Z=\frac12\ln\frac{1+r}{1-r}\ \dot\sim\ N\!\left(\frac12\ln\frac{1+\rho}{1-\rho},\ \frac{1}{n-3}\right)$ — the standard error is $1/\sqrt{n-3}$.
**Test of $H_0:\rho=0$:** $t=\dfrac{r\sqrt{n-2}}{\sqrt{1-r^2}}\sim t_{n-2}$.
**Partial correlation:** $r_{12.3}=\dfrac{r_{12}-r_{13}r_{23}}{\sqrt{(1-r_{13}^2)(1-r_{23}^2)}}$.
**Multiple correlation:** $R_{1.23}^2=\dfrac{r_{12}^2+r_{13}^2-2r_{12}r_{13}r_{23}}{1-r_{23}^2}$; always $R_{1.23}^2\ge \max(r_{12}^2,r_{13}^2)$ — **never** smaller than either simple correlation squared.
**Intraclass correlation** ($h$ families, $k$ members each): range is $\left[-\dfrac{1}{k-1},\,1\right]$ — **not** $[-1,1]$.
**Correlation ratio:** $\eta_{YX}^2\ge r_{XY}^2$ always (equality iff regression is exactly linear); $\eta_{YX}\ne\eta_{XY}$ **in general** (asymmetric, unlike $r$).

**Anchors:** 18-Q28 (correlation invariant under $X\to X+3$) · 18-Q29/22-Q16 (equal-pairwise-$\rho$ multiple-correlation formula, two different numeric wrappers of the same identity) · 18-Q30 ($E(1-r^2)^{-1}=\frac{N-3}{N-4}$ under $\rho=0$ — a specific, memorisable moment fact, not a derivation) · 19-Q8 (Fisher's $Z$ variance $=1/(n-3)$ direct recall) · 19-Q19 ($r(X,aY+b)=\mathrm{sign}(a)\cdot r(X,Y)$) · 20-Q9 (Spearman's rank correlation for $n=2$: only $\pm1$ are achievable, $0$ is impossible with two ranked pairs) · 21-Q32/26-Q27 (partial correlation with equal pairwise $r$, and the $R^2\ge r^2$ inequality triple) · 22-Q19 (distribution of $r^2$ under $\rho=0$ is $\text{Beta}\!\left(\frac12,\frac{n-2}2\right)$) · 23-Q32 (intraclass correlation range, direct recall) · 25-Q14 (partial correlation numeric plug-in) · 25-Q15/19 (correlation-ratio truth-triple; minimum significant $r^2$ at 5% via $t_{n-2}$ inversion) · 26-Q22/Q25 (sample-size-for-significance via $t$-test inversion; correlation invariance under **simultaneous** linear transforms of both variables — $r(4x-3,\frac{7-4y}{8})$: the $y$-transform has a *negative* slope $(-4/8)$, flipping the sign).

**TRAP:** Any linear transform with a **negative** coefficient on either variable flips the sign of $r$ (26-Q25) — a frequently-missed detail when both variables are transformed simultaneously. Multiple correlation $R^2$ can **never** be less than the largest simple $r^2$ feeding it — instant elimination tool on 4-option MCQs. Intraclass correlation's lower bound is $-1/(k-1)$, **not** $-1$ — the "obvious" $[-1,1]$ option is always a trap distractor.

---

## H. Standard Errors & Large-Sample Tests

$$SE(\bar x)=\frac{\sigma}{\sqrt n},\quad SE(\bar x_1-\bar x_2)=\sqrt{\frac{\sigma_1^2}{n_1}+\frac{\sigma_2^2}{n_2}},\quad SE(p)=\sqrt{\frac{pq}{n}},\quad SE(p_1-p_2)=\sqrt{p_1q_1/n_1+p_2q_2/n_2}$$
CI for mean: $\bar x\pm Z_{\alpha/2}\cdot\sigma/\sqrt n$. Finite population correction $\dfrac{N-n}{N-1}$ is dropped when $n\ll N$, $n=N$ (trivially, variance $=0$), **or** population is infinite — all three, not just one.

**Anchors:** 19-Q23 ($SE(\bar X_1-\bar X_2)=\sqrt{W_1^2+W_2^2}$, direct) · 19-Q24 (two-proportion large-sample test, four-statement block) · 22-Q59 (95% CI direct plug-in) · 23-Q33 ($SE(r)$ numeric) · 23-Q34/Q35 (CI for mean; SE-of-proportion with an algebraic wrapper $1280000E^2=$?) · 26-Q31/Q32 (sample-size-for-power / "increase needed for significance" two-sample-Z template) · 26-Q33 (Z-test on sample mean, textbook $P(0<Z<1.43)=0.4236$ given) · 26-Q34 (fpc-dropping conditions, three-statement, **all three correct** is the usual answer here).

**TRAP:** "By how much must $n$ increase for the observed difference to become significant" (26-Q32) is a **reverse** Z-test — set $Z=1.645$ (or given critical value), solve for required $n$, then subtract the *current* $n$ — a frequent error is reporting the *required total* $n$ instead of the *increase*.

---

## I. Sampling Distributions ($\bar X$, $s^2$, $t$, $\chi^2$, $F$) & Tests Based on Them

For $X_1,\dots,X_n\sim N(\mu,\sigma^2)$: $\bar X\perp s^2$ (independence — the single most-tested fact in this block), $\dfrac{(n-1)s^2}{\sigma^2}\sim\chi^2_{n-1}$, $\dfrac{\bar X-\mu}{s/\sqrt n}\sim t_{n-1}$, and $\dfrac{s_1^2/\sigma_1^2}{s_2^2/\sigma_2^2}\sim F_{n_1-1,n_2-1}$ for two independent normal samples.

**The $t$-construction recipe** (recurs verbatim across years): $Z\sim N(0,1)\perp V\sim\chi^2_k\ \Rightarrow\ \dfrac{Z}{\sqrt{V/k}}\sim t_k$. "Find constant $C$" questions are pure pattern-matching to this template — identify the $\chi^2_k$ piece (sum of $k$ independent squared-standard-normals) and the numerator's implicit variance to fix $C$.

**Anchors:** 18-Q34/38 (numeric $Z$-computation; $t^2\sim F(1,n)$ identity, normal $=\chi^2_1$ special-case statement) · 18-Q35/25-Q59 (**identical** $t$-construction skeleton, different years — $C=\sqrt{3/2}$ both times) · 18-Q36/22-analogue ($F(m,n)$: $E(X)E(1/X)=\frac{mn}{(m-2)(n-2)}$, note this is **not** $1$ — a tempting-but-wrong "reciprocal expectations cancel" trap) · 19-Q25 ($E(T^2\bar X^2)$ for $T=(n-1)s^2$ from standard-normal sample — uses $\bar X\perp T$ to factor the expectation as $E(T^2)\cdot E(\bar X^2)$, **the independence is what makes this tractable at all**) · 20-Q4/Q18 ($F(5,10)$ mean/mode statements; $F$-test degrees of freedom $=(n_1-1,n_2-1)=(19,36)$ — **off-by-one is the entire trap**) · 22-Q12 (same $E(T^2\bar X^2)$ template as 19-Q25, numbers changed) · 23-Q36/Q38 ($(n-1)s^2/\sigma^2\sim\chi^2_{n-1}$; $(\bar X-\mu_0)/(\sigma/\sqrt n)\sim N(0,1)$ — note **$\sigma$ known** here, so it's $Z$ not $t$, a frequent mislabel) · 24-Q2/Q3 (MGF of $S^2$; $E(1/S^2)$ via inverse-chi-square moment) · 24-Q7 (ratio of normal-combinations $\sim t_3$, count df from the $\chi^2$ piece: 3 squared terms) · 24-Q8/Q9 ($E(1/\chi^2_4)$, $E$ of Normal-sum over $\chi^2$-sum ratio — the latter is $0$ by symmetry/independence, a fast elimination) · 24-Q14 ($\chi^2_m/\chi^2_n$-ratio $F$-statements, watch **which** variable is in the numerator for $F_{m,n}$ vs. $F_{n,m}$) · 24-Q16 (MGF of $\chi^2_{10}$ direct) · 25-Q10/Q56 (asymptotic normality of $\chi^2_n$; **Cochran-type** df-reduction under 3 independent linear constraints on a size-53 normal sample $\Rightarrow\chi^2_{50}$, subtract one df per independent constraint) · 26-Q24/Q35/Q36 ($ns^2/\sigma^2\sim\chi^2_{n-1}$ regardless of $n$ vs. $n-1$ divisor convention in $s^2$'s definition; $P(\chi^2_4$ in a range$)$ via given tail probabilities; $t$-statistic scaling when $s^2$ doubles $\Rightarrow t\to t/\sqrt2$).

**TRAP:** $E(X)E(1/X)$ for $F(m,n)$ is $\dfrac{mn}{(m-2)(n-2)}$, **not 1** — despite $X$ and $1/X\sim F(n,m)$ looking symmetric, their expectations don't cancel because $E(1/X)\ne1/E(X)$ (Jensen's inequality bites). $F$-test degrees of freedom from sample sizes $n_1,n_2$ are $(n_1-1,n_2-1)$ — **always subtract 1 from each**, a trap repeated in 20-Q18 and elsewhere. When $\sigma$ is **given/known**, use $Z$ not $t$ even though a sample is involved (23-Q38) — the $t$-distribution only enters when $\sigma$ is *estimated* by $s$.

---

## J. Small-Sample Tests

Choice-of-test MCQs: paired data (same subjects, two measurements) $\to$ paired-$t$ (reduces to one-sample $t$ on differences); independent small samples, normality assumable $\to$ two-sample $t$; normality **not** assumable $\to$ non-parametric (§K).

**Anchor:** 20-Q3 (clinical trial, cream A/B on the *same* patient's two arms — paired-$t$ is correct **only if normality can be assumed**; the KS/non-parametric options are traps for when it can't).

---

## K. Non-Parametric Tests

| Test | Statistic / key fact |
|---|---|
| Sign test | Binomial$(n,\frac12)$ on $\#(X_i>\theta_0)$; size from binomial tail, e.g. $(0.6)^7\approx0.028$-type given-value plug-ins |
| Run test | $E(R)=\dfrac{2n_1n_2}{n_1+n_2}+1,\ \mathrm{Var}(R)=\dfrac{2n_1n_2(2n_1n_2-n_1-n_2)}{(n_1+n_2)^2(n_1+n_2-1)}$ — tests **randomness**, not location |
| Mann–Whitney $U$ | $U=$ #pairs $(X_i,Y_j)$ with $X_i<Y_j$ (count inversions directly from the merged order — faster than the rank-sum formula under exam time pressure); $E(U)=\frac{n_1n_2}2,\ \mathrm{Var}(U)=\frac{n_1n_2(n_1+n_2+1)}{12}$ |
| Wilcoxon signed-rank | uses **both sign and rank** of differences (vs. sign test: sign only) |
| Wald–Wolfowitz | runs test applied to two-sample *pooled, ordered* data — tests identical distributions |
| Kolmogorov–Smirnov | $D=\sup_x|F_n(x)-F_0(x)|$; the non-parametric analogue of $\chi^2$ **goodness-of-fit** |
| Kruskal–Wallis | rank-based $k$-sample test; **reduces exactly to one-way ANOVA on ranks** — equivalent to ANOVA when all observations are replaced by ranks (not merely "when data are normal") |

**Anchors:** 18-Q37/22-Q53 (KS is the GOF analogue — repeated verbatim across years) · 20-Q1 (KS statistic direct numeric computation, $\max|F_n-F_0|$) · 20-Q5 (run-count in a 30-toss sequence — literally count blocks: **22 runs**, don't reach for the formula when you can just count) · 20-Q6 (sign test for a one-sided location claim) · 21-Q35 (Mann–Whitney $U$ via inversion-counting: merged order gives $U=7$ directly) · 21-Q36 (Mann–Whitney variance, $n_1=15,n_2=20\Rightarrow\mathrm{Var}=900$, direct formula plug-in) · 21-Q40 (runs test on ordered lifetime data, mean/SD-of-$R$ statement pair) · 22-Q57 (property-matching MCQ across all listed tests simultaneously) · 25-Q37 (Kruskal–Wallis = ANOVA **iff ranks replace raw data** — not merely under normality, which is precisely the trap option).

**TRAP:** Mann–Whitney $U$ is fastest computed by **directly counting inversions** in the merged, ordered sequence (21-Q35 solves in one line this way) rather than computing individual ranks and summing — a huge time-saver under exam conditions. Kruskal–Wallis "reduces to ANOVA" is conditioned on the **rank-replacement**, not on normality (25-Q37's correct option is the rank-based one, not the "data are normal" distractor).

---

## L. Order Statistics — Minimum, Maximum, Range, Median

For iid $X_1,\dots,X_n$ with CDF $F$, pdf $f$:
$$f_{X_{(1)}}(x)=n[1-F(x)]^{n-1}f(x)\qquad f_{X_{(n)}}(x)=n[F(x)]^{n-1}f(x)$$
$$f_{X_{(r)}}(x)=\frac{n!}{(r-1)!(n-r)!}[F(x)]^{r-1}[1-F(x)]^{n-r}f(x)$$
Range/median pdfs follow from the joint density of $(X_{(1)},X_{(n)})$ or the general $r$-th order-statistic formula at $r=\frac{n+1}2$ (odd $n$).

**Anchors:** 18-Q39 ($E[X_{(1)}]$, $n=2$, $N(0,\sigma^2)$ — needs the *joint* min/max machinery, not the marginal alone, since $N(0,\sigma^2)$ isn't one-sided) · 18-Q40 (range pdf for $U(0,1)$: $g(r)=n(n-1)r^{n-2}(1-r)$) · 19-Q30 (sample median $>1/2$ probability, $n=3$) · 20-Q7 (probability-integral-transform of an order statistic — $F(X_{(r)})$ is itself the $r$-th order statistic of a $U(0,1)$ sample, a slick invariance fact) · 20-Q10 (sample-median pdf, $n=5$, matches the general-$r$ formula at $r=3$) · 20-Q20 (min of iid $U(10,11)$ "winner's time," direct $f_{X_{(1)}}$) · 21-Q11 ($P(x_3>\frac12)$ for $n=4$ sample from $f=2x$ — needs $P(X_{(3)}>\frac12)=\sum_{k=0}^{1}\binom4k[F(\frac12)]^k[1-F(\frac12)]^{4-k}$, a Binomial-tail shortcut on order statistics) · 24-Q1/Q17/Q20 (min-pdf for Exponential; max-pdf for Exponential; min-pdf for $U[0,2]$ — three near-identical templates across one paper) · 24-Q13 (asymptotic normality of the sample median, variance $\propto\pi/(2n)$ — a specific, memorisable constant, not $\sigma^2/n$) · 25-Q17/Q57 (min of iid Geometric is Geometric — closure property; $2n(M-\theta)\sim\chi^2_{2n}$ for shifted-Exponential minimum, via the memoryless-scaling trick) · 26-Q26/Q38/Q39 (min-CDF for Exponential; survival function of min for Uniform; mean/variance of the median for odd-$n$ Uniform sample).

**TRAP:** Order-statistic questions on a *non-monotone-support* distribution (e.g. $N(0,\sigma^2)$, 18-Q39) can't use the simple $n[1-F(x)]^{n-1}f(x)$ marginal shortcut in isolation to get a clean closed-form expectation — these need either the joint density of extremes or a symmetry argument; watch for whether the underlying law is one-sided (Exponential/Uniform — clean marginal formula suffices) or two-sided (Normal — often needs an extra symmetry trick).

---

## M. Asymptotic Relative Efficiency (ARE)

$$ARE(\hat\theta_1,\hat\theta_2)=\frac{\text{Asymptotic Var}(\hat\theta_2)}{\text{Asymptotic Var}(\hat\theta_1)}$$
For estimating $\mu$ in $N(\mu,\sigma^2)$: sample mean's asymptotic variance is $\sigma^2/n$; sample median's is $\dfrac{\pi\sigma^2}{2n}$ — **mean is always more efficient** ($\pi/2\approx1.57>1$), for **every** $\mu,\sigma^2$, not conditionally.

**Anchor:** 21-Q37 (mean vs. median ARE — correct answer is "for all $\mu$ and $\sigma^2$," not a conditional sub-case; the conditional-looking distractors are bait for over-thinking a universally-true result).

---

## Recycled / repeated PYQs

- **$E(T^2\bar X^2)$ for a size-5 standard-normal sample**: 19-Q25 and 22-Q12 — identical skeleton, different final numeric option set.
- **$F(m,n)$: $E(X)E(1/X)=\frac{mn}{(m-2)(n-2)}$**: appears (nearly) verbatim in both the Probability-file-adjacent 18-Q36 and again independently — a certified recurring formula-recall item.
- **$t$-construction constant, $C(X_i+X_j)/\sqrt{\sum X_k^2}$**: 18-Q35 and 25-Q59, same answer $C=\sqrt{3/2}$.
- **KS ≅ $\chi^2$-GOF non-parametric analogue**: 18-Q37 and 22-Q53, same question, same options, same answer, three exam years apart.
- **Newton-Gregory/χ² table $f(20)=512,f(30)=439,f(40)=346,f(50)=243$**: reused across Numerical Analysis in two different years — flagged here since one framing (20-Q74) borders on "does a low-degree polynomial fit" curve-fitting logic.

---

## Revision priority
1. **G** (correlation family) and **E** (BVN) together account for **~37%** of this entire file — master the exponent-matching BVN trick and the partial/multiple-correlation identities first.
2. **I** (sampling distributions) — the $\bar X\perp s^2$ independence fact single-handedly unlocks 6+ different question templates.
3. **L** (order statistics) — three formulas (min/max/general-$r$) cover nearly every variant seen.
4. **K** (non-parametric) — one fact-table (above) is sufficient; low computational depth once memorised.
5. **C, H** — high value-per-minute since these are short, formula-driven, and rarely have a genuine trap once the identity is known.
