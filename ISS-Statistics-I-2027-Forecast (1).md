---
title: "UPSC ISS — STATISTICS-I (Objective) · 2027 Forecast & 90%+ Blueprint"
author: "Evidence base: 720 PYQs (2018–2026), KDD pattern-mining pipeline v1.0.0"
date: "Compiled 24 Aug 2026"
---

# UPSC ISS · STATISTICS-I (OBJECTIVE) — Forecast to 90%+

**Target paper:** ISS 2027, Statistics-I (Objective). 80 questions · 200 marks · 120 minutes · $+2.5$ per correct, $-\tfrac{1}{3}\times 2.5 = -0.8\overline{3}$ per wrong.
**Evidence base:** all 9 papers 2018–2026 (720 questions), parsed, topic-tagged, clustered (HDBSCAN), association-mined (FP-Growth, all 4 rules significant at $p=0.0005$ by permutation test), plus direct structural re-analysis of the full question corpus (position maps, named-method frequencies, repeat detection).

> **Honesty box.** $N = 9$ papers is small-sample. Counts below are directional forecasts with empirical ranges, not guarantees. Bootstrap cluster stability ARI $= 0.61 \pm 0.15$; ~32% of questions carry no lexical topic cue (pure-formula items) and were assigned by paper-position imputation. Treat every interval as "planning band", not prophecy.

---

## 1 · The arithmetic of 90% (read this first)

Score $S = 2.5C - \tfrac{2.5}{3}W$, with $C+W+\text{skips}=80$. Target $S \ge 180$.

| Path | Correct $C$ | Wrong $W$ | Skipped | Score | % |
|---|---|---|---|---|---|
| Perfectionist | 72 | 0 | 8 | 180.0 | 90.0 |
| Balanced | 74 | 6 | 0 | 180.0 | 90.0 |
| **Recommended** | **75** | **3** | **2** | **185.0** | **92.5** |
| Elite | 76 | 4 | 0 | 186.7 | 93.3 |

**Operational meaning:** you must *own* $\approx 75$ of 80 questions. The syllabus-share table (§2) shows that **Numerical Analysis + Computer ≈ 40 questions every single year** with near-zero variance — these are bounded, memorizable, and must run at ~100% accuracy. That converts the task into: score $\ge 35/40$ on the Probability + Statistical-Methods half.

**Guessing calculus** (per question, marks): random 4-way guess $\mathbb{E} = \tfrac14(2.5) - \tfrac34(0.8\overline{3}) = 0$; after eliminating one option $\mathbb{E} = +0.28$; after eliminating two $\mathbb{E} = +0.83$. → *Never* blind-guess; guess only with ≥1 confident elimination; at a 90% target keep total wrong ≤ 5.

**Time:** 90 s/question average. Protocol in §10.

---

## 2 · Structural forecast — the 2027 paper blueprint

Section shares after position-based imputation of untagged questions (all 9 years sum to 80):

| Syllabus section | '18 | '19 | '20 | '21 | '22 | '23 | '24 | '25 | '26 | Mean | **2027 forecast** | Marks at stake |
|---|--|--|--|--|--|--|--|--|--|--|--|--|
| (i) Probability | 31 | 32 | 32 | 29 | 35 | 36 | 40 | 37 | 29 | 33.4 | **33 ± 4** | ~82.5 |
| (ii) Statistical Methods | 10 | 9 | 8 | 11 | 5 | 4 | 2 | 5 | 11 | 7.2 | **7 ± 3** | ~17.5 |
| (iii) Numerical Analysis | 21 | 20 | 21 | 20 | 20 | 20 | 19 | 18 | 20 | 19.9 | **20 ± 1** | ~50 |
| (iv) Computer & Data Processing | 18 | 19 | 19 | 20 | 20 | 20 | 19 | 20 | 20 | 19.4 | **20 ± 1** | ~49 |

**Key structural facts (all 9/9 years):**

- **Numerical + Computer = half the paper (≈ 40 Q / 100 marks), variance ±1.** This is the single most exploitable pattern in the corpus. Both are finite, list-like domains.
- **Paper layout.** Papers open with 2–4 consecutive Probability blocks, then Numerical and Computer blocks of 10. Two layout regimes observed: *contiguous* (2018–21, 2023–24, 2026: P,P,P,(S),N,N,C,C) and *sandwich* (2022, 2025: P,P,N,C,P,P,N,C). → Do not assume section order in the hall; the content mix is fixed, the ordering is not.
- **Statistical Methods is the squeeze section**: it fell from 8–11 Q (2018–21) to 2–5 (2022–25), rebounding to 11 in 2026. Its questions are largely correlation/regression identities — cheap marks, small surface.
- **Linked mini-sets are the new pattern**: "shared context" question sets appeared 2021 (5 Q), 2022 (2), then 2025 (7) and 2026 (9). Expect **2–3 data-sharing sets (≈ 6–10 questions) in 2027** (e.g., 2025's five-question Poisson block Q40–44).
- **Format mix:** ~90% single-stem computation MCQs; statement-evaluation items ("I / II — which are correct?") surged 2023–25 (8, 18, 16) and persisted in 2026 (~6). Match-the-following: 1 occurrence in 9 years. No assertion–reason format ever.
- Mean question length 30–41 words, stable; difficulty is in *speed*, not depth.

---

## 3 · Topic-level forecast for 2027

Counts by pipeline topic tag (keyword-tagged portion of the corpus; untagged pure-formula items mostly belong to the Probability rows — so treat Probability rows as floors):

| Topic | 9-yr total | '24 | '25 | '26 | Trend | Priority | **2027 band** |
|---|--|--|--|--|--|--|--|
| Computer fundamentals & IT | 104* | 12 | 13 | 8 | stable | 1.00 | **19–20 (imputed)** |
| Continuous distributions | 91 | 14 | 11 | 11 | stable | 1.00 | **10–14** |
| Numerical interpolation & operators | 80 | 8 | 7 | 7 | stable | 0.96 | **8–11** |
| Numerical integration & ODE | 56 | 10 | 8 | 8 | rising | 0.85 | **8–10** |
| Bivariate / conditional / random vectors | 51 | 2 | 7 | 7 | stable | 0.83 | **5–8** |
| Probability axioms & events | 26 | 3 | 3 | 2 | mildly rising | 0.65 | **2–5** |
| Descriptive stats & correlation | 27 | 0 | 2 | 2 | compressed | 0.59 | **2–5** |
| Discrete distributions | 21 | 1 | 7 | 2 | spiky | 0.69 | **2–4** |
| MGF / characteristic functions | 9 | 0 | 4 | 1 | recent uptick | 0.37 | **1–3** |
| Order statistics | 8 | 2 | 1 | 2 | steady trickle | 0.37 | **1–3** |
| Estimation / testing / inference | 5 | 0 | 1 | 2 | creeping in | 0.29 | **1–2** |
| Limit theorems & convergence | 6 | 0 | 2 | 0 | emerging | 0.23 | **0–2** |
| Combinatorial probability | 2 | 0 | 0 | 0 | rare | 0.14 | **0–1** |

\*Keyword-tagged only; position-imputed true count ≈ 19–20/yr.

**Association rules (all significant, $p = 0.0005$):** Integration↔Interpolation (lift 4.0, confidence up to 1.0) — they co-occur as one numerical super-section; Continuous↔Bivariate (lift 1.9) — continuous-distribution knowledge is routinely tested *through* joint/conditional setups. **Study them as bundles, not separate chapters.**

**Repeat dividend:** ~1–3 questions per recent paper are verbatim/near-verbatim PYQ repeats (e.g., 2022 Q12 ≡ 2019 Q25, the $\mathbb{E}(T^2\bar{X}^2)$ question, word-for-word), and **≈ 20% of each recent paper is a re-skinned PYQ archetype** (same family, new numbers — e.g., the $\Delta$-operator algebra family recurs every year). → Solving all 9 PYQ papers to 100% mastery is worth roughly 15–20 free questions.

---

## 4 · Tier map (where your 200 marks live)

| Tier | Blocks | Expected Q | Marks | Required accuracy |
|---|---|--|--|--|
| **S — bankers** | Computer (all), Numerical (all), standard continuous distributions | ~45 | ~112 | 95–100% |
| **A — core** | Joint/marginal/conditional + bivariate normal, discrete distributions, probability axioms/Bayes-type, correlation & regression identities | ~22 | ~55 | 90% |
| **B — differentiators** | MGF/CF properties, order statistics, sampling distributions ($\chi^2,t,F$), convergence & limit theorems, expectation identities | ~9 | ~22 | 75%+ |
| **C — tail insurance** | Non-parametric tests, ARE, intraclass/correlation-ratio, Borel–Kolmogorov 0-1 laws, inequalities, never-yet-asked named methods (Milne, Stirling/Bessel central formulas, Weddle, differences of zero) | ~4 | ~10 | know 1 fact each |

Tier C is exactly what separates 85% from 92%: each item below (§5–§8) carries a one-line fact that converts a coin-flip into a mark.

---

## 5 · Section (i) Probability — high-yield bank (~33 Q)

### 5.1 Distribution master table (memorize cold — highest-asked first)

Mining note: the Normal family is named in 41 questions across 9 papers (most of any distribution), Poisson 12 (7 of them in 2025 alone), Binomial 11, Exponential 11, Uniform 7, Beta 7 (mode asked 2025 Q1), Cauchy 4, Geometric 4, Laplace 3, Gamma 3; Lognormal/Neg-binomial/Hypergeometric/Multinomial are ≤1 each but syllabus-listed → one-fact coverage.

| Distribution | pmf/pdf | Mean | Variance | MGF $M_X(t)$ | Must-know fact |
|---|---|---|---|---|---|
| Bernoulli($p$) | $p^x q^{1-x}$ | $p$ | $pq$ | $q+pe^t$ | building block |
| Binomial($n,p$) | $\binom{n}{x}p^xq^{n-x}$ | $np$ | $npq$ | $(q+pe^t)^n$ | mode $\lfloor (n{+}1)p \rfloor$; additive in $n$; var $<$ mean |
| Poisson($\lambda$) | $e^{-\lambda}\lambda^x/x!$ | $\lambda$ | $\lambda$ | $e^{\lambda(e^t-1)}$ | mean $=$ var; sum of ind. Poissons is Poisson; $X\mid X{+}Y$ is Binomial; mode $\lfloor\lambda\rfloor$ ('25 blitz: 7 Qs incl. truncated Poisson) |
| Geometric($p$) | $q^{x}p,\ x\ge 0$ | $q/p$ | $q/p^2$ | $\frac{p}{1-qe^t}$ | **memoryless** (unique discrete); watch support convention ($x\ge 1$: mean $1/p$) |
| Negative binomial($r,p$) | $\binom{x+r-1}{r-1}p^rq^x$ | $rq/p$ | $rq/p^2$ | $\left(\frac{p}{1-qe^t}\right)^r$ | var $>$ mean (overdispersion); sum of $r$ geometrics |
| Hypergeometric($N,K,n$) | $\frac{\binom{K}{x}\binom{N-K}{n-x}}{\binom{N}{n}}$ | $n\frac{K}{N}$ | $n\frac{K}{N}\frac{N-K}{N}\frac{N-n}{N-1}$ | — | fpc factor $\frac{N-n}{N-1}$; → Binomial as $N\to\infty$ |
| Multinomial | $\frac{n!}{\prod x_i!}\prod p_i^{x_i}$ | $np_i$ | $np_i(1{-}p_i)$ | — | $\operatorname{Cov}(X_i,X_j) = -np_ip_j$ |
| Uniform/Rectangular($a,b$) | $\frac{1}{b-a}$ | $\frac{a+b}{2}$ | $\frac{(b-a)^2}{12}$ | $\frac{e^{bt}-e^{at}}{(b-a)t}$ | $aX{+}b$ stays uniform ('25 Q3); $F(X)\sim U(0,1)$ |
| Exponential($\lambda$) | $\lambda e^{-\lambda x}$ | $1/\lambda$ | $1/\lambda^2$ | $\frac{\lambda}{\lambda-t}$ | **memoryless** (unique continuous); $\min_i X_i \sim \text{Exp}(\sum\lambda_i)$; $P(X_1{<}X_2)=\frac{\lambda_1}{\lambda_1+\lambda_2}$ |
| Gamma($\alpha,\lambda$) | $\frac{\lambda^\alpha}{\Gamma(\alpha)}x^{\alpha-1}e^{-\lambda x}$ | $\alpha/\lambda$ | $\alpha/\lambda^2$ | $\left(\frac{\lambda}{\lambda-t}\right)^\alpha$ | additive in $\alpha$; mode $\frac{\alpha-1}{\lambda}$; $\chi^2_n=\Gamma(\tfrac n2,\tfrac12)$ |
| Beta-I($\alpha,\beta$) | $\frac{x^{\alpha-1}(1-x)^{\beta-1}}{B(\alpha,\beta)}$ | $\frac{\alpha}{\alpha+\beta}$ | $\frac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}$ | — | **mode $\frac{\alpha-1}{\alpha+\beta-2}$** (asked '25 Q1); $\frac{X}{X+Y}$ of ind. Gammas; Beta(1,1)=U(0,1) |
| Beta-II($\alpha,\beta$) | $\frac{x^{\alpha-1}}{B(\alpha,\beta)(1+x)^{\alpha+\beta}}$ | $\frac{\alpha}{\beta-1}$ | — | — | $X/(1{-}X)$ transform of Beta-I |
| Normal($\mu,\sigma^2$) | $\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$ | $\mu$ | $\sigma^2$ | $e^{\mu t+\frac{\sigma^2t^2}{2}}$ | linear combos normal; mean deviation $=\sigma\sqrt{2/\pi}\approx 0.798\sigma$; QD:MD:SD $=10{:}12{:}15$; points of inflexion $\mu\pm\sigma$; $X{+}Y \perp X{-}Y$ for iid normal |
| Cauchy($\theta,\lambda$) | $\frac{\lambda/\pi}{\lambda^2+(x-\theta)^2}$ | none | none | CF $e^{it\theta-\lambda|t|}$ | **no mean/moments**; $\bar{X}\sim$ same Cauchy (CLT fails); ratio of two std normals; $=t_1$ |
| Laplace($\mu,b$) | $\frac{1}{2b}e^{-|x-\mu|/b}$ | $\mu$ | $2b^2$ | $\frac{e^{\mu t}}{1-b^2t^2}$ | difference of two iid exponentials; kurtosis 6 (excess 3) |
| Lognormal($\mu,\sigma^2$) | $\frac{1}{x\sigma\sqrt{2\pi}}e^{-\frac{(\ln x-\mu)^2}{2\sigma^2}}$ | $e^{\mu+\sigma^2/2}$ | $e^{2\mu+\sigma^2}(e^{\sigma^2}{-}1)$ | none | median $e^\mu$ < mean; moments do **not** determine it |

### 5.2 Foundations, conditional structure, expectation (recurring archetypes)

- **Axioms & consequences:** $P(A\cup B)=P(A)+P(B)-P(AB)$; Boole: $P(\cup A_i)\le \sum P(A_i)$; Bonferroni: $P(\cap A_i)\ge 1-\sum P(A_i^c)$; continuity of $P$; $P$ finitely vs countably additive (classical vs axiomatic definitions).
- **Total probability & Bayes:** $P(A)=\sum_i P(A\mid B_i)P(B_i)$; $P(B_j\mid A)=\frac{P(A\mid B_j)P(B_j)}{\sum_i P(A\mid B_i)P(B_i)}$. Asked in urn/machine/defective-item costume, never by name.
- **Distribution functions:** $F$ non-decreasing, right-continuous, $F(-\infty)=0$, $F(\infty)=1$; $P(X=x)=F(x)-F(x^-)$; number of discontinuities is countable; $F(X)\sim U(0,1)$ for continuous $F$; mixed distributions (mass + density) appear in statement-format questions.
- **Transformations:** $Y=g(X)\Rightarrow f_Y(y)=f_X(g^{-1}(y))\left|\frac{d}{dy}g^{-1}(y)\right|$; $Y=X^2 \Rightarrow f_Y(y)=\frac{f_X(\sqrt y)+f_X(-\sqrt y)}{2\sqrt y}$; Jacobian method for vectors; $-2\ln U \sim \chi^2_2$ i.e. $\text{Exp}(1/2)$.
- **Expectation identities (annual!):** tower rule $\mathbb{E}[\mathbb{E}(Y\mid X)]=\mathbb{E}(Y)$; variance decomposition $\operatorname{Var}(Y)=\mathbb{E}[\operatorname{Var}(Y\mid X)]+\operatorname{Var}[\mathbb{E}(Y\mid X)]$.
  *Live example ('23 Q2):* $X\sim N(0,1)$, $Y\mid X\sim U(x-1,x+1)$: $\mathbb{E}(Y\mid X)=X\Rightarrow\mathbb{E}[\mathbb{E}^2(Y\mid X)]=\mathbb{E}(X^2)=1$.
  *Live example ('26 Q15):* $p(x)=x/15$ on $\{1..5\}$: $\mathbb{E}(X\mid X>1)=\frac{\sum_{2}^{5}x^2/15}{14/15}=\frac{54}{14}=\frac{27}{7}$.
- **Random vectors:** marginals from joints (integrate/sum out); independence $\iff f(x,y)=f_1(x)f_2(y)$ on a product support (watch triangular supports — classic trap); $\operatorname{Cov}(aX{+}bY, cX{+}dY)=ac\sigma_X^2+bd\sigma_Y^2+(ad{+}bc)\sigma_{XY}$, so $\operatorname{Cov}(X{+}Y,X{-}Y)=\sigma_X^2-\sigma_Y^2$.
- **Bivariate normal $BN(\mu_1,\mu_2,\sigma_1^2,\sigma_2^2,\rho)$** (14 questions in 9 yrs): $\;\mathbb{E}(Y\mid X{=}x)=\mu_2+\rho\frac{\sigma_2}{\sigma_1}(x-\mu_1)$, $\operatorname{Var}(Y\mid X)=\sigma_2^2(1-\rho^2)$; uncorrelated $\Rightarrow$ independent (only within BN); marginals normal but normal marginals $\nRightarrow$ BN.
  *Live example ('24 Q36):* $BN(1,0,36,16,\tfrac12)$: $\mathbb{E}(Y\mid X{=}7)=0+\tfrac12\cdot\tfrac46(7-1)=2$ ✓; $\operatorname{Cov}(X{+}Y,Y{-}X)=\sigma_2^2-\sigma_1^2=-20$.

### 5.3 Generating functions, inequalities, limit theorems (Tier B — 2 to 4 Q)

- **MGF/CF/PGF:** uniqueness (MGF in a neighbourhood of 0; CF always); CF exists always, $\varphi(0)=1$, $|\varphi(t)|\le 1$, uniformly continuous, $\varphi_{aX+b}(t)=e^{ibt}\varphi(at)$, real $\iff$ symmetric law; inversion & Lévy continuity theorems (statement level). PGF: $\mathbb{E}(X)=P'(1)$, $\operatorname{Var}=P''(1)+P'(1)-[P'(1)]^2$. Know the CF pairs: Normal $e^{i\mu t-\sigma^2t^2/2}$, Cauchy $e^{-|t|}$ (the classic "which has no MGF but this CF" item), Poisson $e^{\lambda(e^{it}-1)}$.
- **Inequalities:** Chebyshev $P(|X-\mu|\ge k)\le \sigma^2/k^2$; Markov $P(X\ge a)\le \mathbb{E}(X)/a$; Kolmogorov: $P\!\left(\max_{k\le n}|S_k|\ge \varepsilon\right)\le \operatorname{Var}(S_n)/\varepsilon^2$ (Chebyshev for the running maximum).
- **Convergence hierarchy:** $\xrightarrow{a.s.} \Rightarrow \xrightarrow{P} \Rightarrow \xrightarrow{d}$; $\xrightarrow{m.s.} \Rightarrow \xrightarrow{P}$; $\xrightarrow{d}$ to a **constant** $\Rightarrow \xrightarrow{P}$; no other implications hold in general (counterexample-type statement questions). Slutsky: $X_n\xrightarrow{d}X,\ Y_n\xrightarrow{P}c \Rightarrow X_n+Y_n\xrightarrow{d}X+c,\ X_nY_n\xrightarrow{d}cX$.
- **Laws:** WLLN (Khinchin: iid, finite mean suffices); SLLN (Kolmogorov: iid finite mean; independent case $\sum \sigma_k^2/k^2<\infty$); CLT (Lindeberg–Lévy: iid, finite $\sigma^2$; note Cauchy violates). Borel–Cantelli: $\sum P(A_n)<\infty \Rightarrow P(A_n \text{ i.o.})=0$; independent + $\sum P(A_n)=\infty \Rightarrow P=1$ (Borel 0-1). Kolmogorov 0-1: tail events have probability 0 or 1.

---

## 6 · Section (ii) Statistical Methods — compact bank (~7 Q)

Recent papers compress this section into correlation/regression identities plus one sampling-distribution item. Non-parametrics last appeared as a cluster in 2022.

- **Correlation & regression (the annual core):** $b_{yx}b_{xy}=r^2$; both coefficients share sign of $r$; $\frac{|b_{yx}+b_{xy}|}{2}\ge |r|$ (AM–GM); regression lines intersect at $(\bar x,\bar y)$; angle $\tan\theta=\frac{1-r^2}{|r|}\cdot\frac{\sigma_x\sigma_y}{\sigma_x^2+\sigma_y^2}$ ($r=0$: perpendicular; $r=\pm1$: coincide); $r$ invariant to positive linear scaling.
- **Partial/multiple:** $r_{12.3}=\frac{r_{12}-r_{13}r_{23}}{\sqrt{(1-r_{13}^2)(1-r_{23}^2)}}$; $1-R_{1.23}^2=(1-r_{12}^2)(1-r_{13.2}^2)$; $R_{1.23}\ge|r_{12}|$; $R^2_{1.23}=\frac{r_{12}^2+r_{13}^2-2r_{12}r_{13}r_{23}}{1-r_{23}^2}$; **product of partial regression coefficients $b_{13.2}\,b_{31.2}=r_{13.2}^2$** (asked '26 Q23). Rank: $r_s = 1-\frac{6\sum d_i^2}{n(n^2-1)}$. Correlation ratio: $r^2\le \eta_{YX}^2\le 1$ ($\eta$ captures nonlinearity). Intraclass $r \in [-\frac{1}{k-1},1]$. Contingency: $\chi^2=\sum\frac{(O-E)^2}{E}$, Yule's $Q=\frac{ad-bc}{ad+bc}$.
- **Sampling distributions (normal parent):** $\bar X\sim N(\mu,\sigma^2/n)$; $\frac{(n-1)s^2}{\sigma^2}\sim\chi^2_{n-1}$; $\bar X \perp s^2$ (characterizes the normal); $t_n$: mean 0, var $\frac{n}{n-2}$; $\chi^2_n$: mean $n$, var $2n$, $\mathbb{E}(\chi^2_n)^2$-type moments via $\mathbb{E}[(\chi^2_n)^2]=n(n+2)$; $F_{m,n}$: $1/F\sim F_{n,m}$, $t_n^2=F_{1,n}$, mean $\frac{n}{n-2}$.
  *Live repeat ('19 Q25 ≡ '22 Q12):* $n{=}5$ std normal: $T=\sum(X_i-\bar X)^2\sim\chi^2_4 \perp \bar X^2$, so $\mathbb{E}(T^2\bar X^2)=[8+16]\cdot\tfrac15=\tfrac{24}{5}$.
- **Order statistics (steady 1–3 Q):** $f_{(k)}(x)=\frac{n!}{(k-1)!(n-k)!}F^{k-1}(1-F)^{n-k}f(x)$; $F_{(n)}=F^n$, $F_{(1)}=1-(1-F)^n$; for $U(0,1)$: $X_{(k)}\sim\text{Beta}(k,n{-}k{+}1)$, $\mathbb{E}X_{(k)}=\frac{k}{n+1}$; range of $n$ uniforms $\sim \text{Beta}(n-1,2)$, $\mathbb{E}(R)=\frac{n-1}{n+1}$; min of exponentials exponential (rate sum); exponential spacings independent.
- **Non-parametric one-liners (Tier C):** sign test → median, uses Binomial$(n,\tfrac12)$; Wilcoxon signed-rank → symmetry, $\mathbb{E}(T^+)=\frac{n(n+1)}{4}$; Mann–Whitney $U=W-\frac{n_1(n_1+1)}{2}$, $\mathbb{E}(U)=\frac{n_1n_2}{2}$; run test → randomness, $\mathbb{E}(R)=\frac{2n_1n_2}{n_1+n_2}+1$; Wald–Wolfowitz → two samples identical (runs on pooled ordered sample); K–S → GoF via $\sup_x|F_n-F_0|$, distribution-free; **ARE:** sign vs $t$ $=2/\pi\approx0.64$, Wilcoxon/M–W vs $t$ $=3/\pi\approx0.955$ (normal).
- Charts/frequency-distribution basics: 1 question at most; know histogram (area ∝ frequency), ogive→median, $\text{mode} \approx 3\,\text{median} - 2\,\text{mean}$; $\beta_1,\beta_2$ definitions, $\beta_2\ge\beta_1+1$.

---

## 7 · Section (iii) Numerical Analysis — the bankable 20

Every year: 18–21 questions. Sub-mix per year (mined): quadrature 3–6, ODE methods 1–4, interpolation formulas 3–6, operator/difference algebra 3–6, divided differences 1–5.

### 7.1 Finite-difference operator algebra (3–6 Q, every year)

$$E f(x)=f(x+h),\quad \Delta=E-1,\quad \nabla=1-E^{-1},\quad \delta=E^{1/2}-E^{-1/2},\quad \mu=\tfrac12\!\left(E^{1/2}+E^{-1/2}\right),\quad hD=\ln E$$

- Identities bank: $\Delta-\nabla=\Delta\nabla=\delta^2$; $\Delta=E\nabla=\delta E^{1/2}$; $\mu^2=1+\tfrac{\delta^2}{4}$; $E=e^{hD}$; $\Delta^n f_k = \nabla^n f_{k+n}$.
- Product/quotient rules: $\Delta(fg)=f\,\Delta g+Eg\,\Delta f$; $\Delta\!\left(\tfrac{1}{f}\right)=-\tfrac{\Delta f}{f\,Ef}$; **$\Delta\log f(x)=\log\!\left(1+\tfrac{\Delta f}{f}\right)$** (asked verbatim '26 Q41 and '22).
- Polynomials: $\Delta^n[a_nx^n+\dots]=a_n\,n!\,h^n$ (constant), $\Delta^{n+1}=0$. *Live ('19 Q52):* $\Delta^{10}$ of a degree-10 polynomial with leading coefficient $abcd$ → $abcd\cdot 10!$.
- Factorial polynomials: $x^{(n)}=x(x-1)\cdots(x-n+1)$, $\Delta x^{(n)}=nx^{(n-1)}$ ($h{=}1$); any polynomial re-expandable in $x^{(k)}$ (synthetic division).
- Differences of zero: $\Delta^n 0^m = \sum_j (-1)^{n-j}\binom{n}{j}j^m$; key values $\Delta^n0^n=n!$, $\Delta^n 0^{n+1}=\frac{n(n+1)!}{2}$. Separation of symbols & fractional shifts ($E^{3/2}u_{10}$-type, asked '18 Q47) — evaluate via $E^{p}=(1+\Delta)^p$ binomially.

### 7.2 Interpolation (4–7 Q)

- **Newton–Gregory forward** ($p=\frac{x-x_0}{h}$): $f(x)\approx\sum_k \binom{p}{k}\Delta^k f_0$, error $\binom{p}{n+1}h^{n+1}f^{(n+1)}(\xi)$; use near the **start** of the table; backward (∇, $p=\frac{x-x_n}{h}$) near the **end**.
- **Divided differences:** $f[x_0,\dots,x_n]=\sum_i \frac{f(x_i)}{\prod_{j\ne i}(x_i-x_j)}$ — **symmetric** in all arguments; $f[x_0,\dots,x_n]=\frac{f^{(n)}(\xi)}{n!}$; equals $\frac{\Delta^n f_0}{n!\,h^n}$ on equal spacing; $n$th DD of a degree-$n$ polynomial is constant $a_n$, $(n{+}1)$th is 0 (favourite MCQ).
- **Lagrange (unequal intervals):** $L_i(x)=\prod_{j\ne i}\frac{x-x_j}{x_i-x_j}$; $L_i(x_j)=\delta_{ij}$; $\sum_i L_i(x)\equiv 1$ (quick-check trick); error $\frac{f^{(n+1)}(\xi)}{(n+1)!}\prod(x-x_i)$. Inverse interpolation: swap roles of $x,y$ in Lagrange, or successive approximation.
- **Central formulas (never yet asked by name in 9 papers — one-line insurance):** Gauss forward/backward zigzag the central diagonal; **Stirling** = average of the two Gauss formulas, best for $|p|<\tfrac14$; **Bessel** best for $\tfrac14<p<\tfrac34$. Know just these selection rules.

### 7.3 Numerical integration (3–6 Q — Simpson is the single most-asked method in the corpus: 23 Qs)

With $n$ subintervals of width $h=\frac{b-a}{n}$:

| Rule | Formula | Error | Exact for degree | Constraint |
|---|---|---|---|---|
| Trapezoidal | $\tfrac{h}{2}[y_0+2(y_1+\dots+y_{n-1})+y_n]$ | $-\tfrac{(b-a)h^2}{12}f''(\xi)$ | 1 | any $n$ |
| Simpson $\tfrac13$ | $\tfrac{h}{3}[y_0+4\,\Sigma_{odd}+2\,\Sigma_{even}+y_n]$ | $-\tfrac{(b-a)h^4}{180}f^{(4)}(\xi)$ | **3** (bonus degree) | $n$ even |
| Simpson $\tfrac38$ | $\tfrac{3h}{8}[y_0+3y_1+3y_2+2y_3+\dots+y_n]$ | $-\tfrac{(b-a)h^4}{80}f^{(4)}(\xi)$ | 3 | $n\equiv 0 \ (\mathrm{mod}\ 3)$ |
| Weddle | $\tfrac{3h}{10}[y_0+5y_1+y_2+6y_3+y_4+5y_5+y_6]$ | $O(h^7)$ | 5 | $n\equiv 0\ (\mathrm{mod}\ 6)$ |

Archetypes: compute a small table integral; compare exact vs rule error; "which rule needs $n$ divisible by 3/6"; degree-of-precision statements; error-order ranking Trapezoidal $<$ Simpson.

### 7.4 ODE methods (2–4 Q, rising — Euler asked 4× in 2026)

- **Euler:** $y_{n+1}=y_n+hf(x_n,y_n)$ — global error $O(h)$; modified/Heun $O(h^2)$. Two-step hand computation is the standard question.
- **RK4:** $k_1=hf(x_n,y_n)$, $k_2=hf(x_n+\tfrac h2,y_n+\tfrac{k_1}2)$, $k_3=hf(x_n+\tfrac h2,y_n+\tfrac{k_2}2)$, $k_4=hf(x_n+h,y_n+k_3)$, $y_{n+1}=y_n+\tfrac16(k_1+2k_2+2k_3+k_4)$; local error $O(h^5)$, global $O(h^4)$; RK1 = Euler, RK2 = modified Euler.
- **Picard:** $y^{(k+1)}(x)=y_0+\int_{x_0}^{x} f\big(t,y^{(k)}(t)\big)\,dt$ — first/second iterate computations (asked '25 ×2).
- **Milne (predictor–corrector, never yet asked — insurance line):** predictor $y_{n+1}^{p}=y_{n-3}+\tfrac{4h}{3}(2f_{n-2}-f_{n-1}+2f_n)$; corrector $y_{n+1}=y_{n-1}+\tfrac h3(f_{n-1}+4f_n+f_{n+1})$ (Simpson-based).
- Summation of series via differences: telescoping $\sum_a^b \Delta g = g(b{+}1)-g(a)$; geometric-term series (syllabus-listed, occasional).

---

## 8 · Section (iv) Computer Application — the memorization sheet (~20 Q)

Sub-theme mix per paper (mined 9-yr totals): networks/internet ~5–6, memory/CPU/hardware ~5, OS ~2–3, security ~2–3, number systems ~2–3, programming/flowcharts ~2, languages/translators ~1, database ~1. Pure recall — this block is where 50 marks are won at near-zero risk.

- **Number systems:** binary/octal/hex conversions (practice to 30 s); $n$ bits → $2^n$ patterns, signed range $[-2^{n-1}, 2^{n-1}{-}1]$; 1's complement = flip bits; **2's complement = flip + 1** (*live '24 Q46:* $-59 \to 59=00111011 \to 11000100 \to \mathbf{11000101}$); BCD ≠ binary; hex digit = 4 bits (nibble); 1 byte = 8 bits; KB/MB/GB = $2^{10}/2^{20}/2^{30}$ B.
- **Hardware:** CPU = ALU + CU + registers (MAR, MDR, PC, IR, accumulator); memory hierarchy register < cache < RAM < disk (speed ↓, size ↑); RAM volatile (SRAM cache vs DRAM main), ROM/PROM/EPROM/EEPROM non-volatile; input vs output vs both (touchscreen, modem); peripherals.
- **OS:** functions (process/memory/file/device management); multiprogramming vs multitasking vs multiprocessing vs time-sharing; **paging with swapping = demand paging** (*live '26 Q65*); virtual memory; deadlock (4 Coffman conditions); scheduling (FCFS, RR, SJF); spooling.
- **Networks:** LAN < MAN < WAN; topologies (star/bus/ring/mesh — mesh links $=\binom n2$); OSI 7 layers vs TCP/IP 4; devices per layer (hub-physical, switch-data link, router-network); IP addressing (IPv4 32-bit dotted, IPv6 128-bit), DNS, URL parts; internet vs intranet vs extranet; HTTP/FTP/SMTP/POP3/TCP vs UDP.
- **Security:** virus (attaches to host) vs worm (self-replicates over network) vs Trojan (disguised) vs spyware (monitors) vs ransomware (encrypts) vs phishing (social engineering); firewall filters traffic; antivirus signatures; malware = umbrella term.
- **Software & languages:** system vs application software; compiler (whole program, object code) vs interpreter (line-by-line) vs assembler (assembly→machine); low-level (machine/assembly) vs high-level; utilities.
- **Programming:** algorithm (finite, definite, effective) & flowchart symbols (oval terminator, parallelogram I/O, rectangle process, diamond decision); variables/scope; control structures (sequence/selection/iteration); arrays (contiguous, 0-indexed offsets); functions/modules; loop types (entry vs exit controlled: `while` vs `do-while`); exceptions; debugging (syntax vs logic vs runtime error); frontend vs backend; database/DBMS basics (tables, primary key, SQL as query language).

---

## 9 · 25 archetypes most likely to appear in 2027

Each is a recurring family (evidence in brackets); master the bolded result.

1. Mode/mean/variance of Beta or Gamma — **$\text{mode}_{Beta}=\frac{\alpha-1}{\alpha+\beta-2}$** ['25 Q1, '25 Q2]
2. Linear transform of uniform stays uniform: $U(2a{+}b,10a{+}b)$-type ['25 Q3]
3. Dice/coin compound expectation — **condition on the coin, then average** ['25 Q4-family, annual]
4. Truncated/conditional pmf expectation — **renormalize then sum** ['26 Q15]
5. Tower/variance-decomposition: $\mathbb{E}[\mathbb{E}(Y|X)]$, $\operatorname{Var}(Y)$ split ['23 Q2, recurring]
6. Bivariate normal conditional mean/variance + $\operatorname{Cov}(X{+}Y, X{-}Y)=\sigma_X^2-\sigma_Y^2$ ['24 Q36, 14 Qs total]
7. Joint density on triangular support — **check independence via product-support test** [cluster 14/16]
8. Poisson additivity / $X\mid X{+}Y\sim$ Binomial / truncated Poisson ['25 Q40–44 block]
9. Memorylessness of exponential/geometric — $P(X>s{+}t\mid X>s)=P(X>t)$ [recurring]
10. Cauchy pathology — **no mean; $\bar X$ is Cauchy; CLT inapplicable** [4 Qs]
11. Normal facts: MD $=0.798\sigma$, inflexion at $\mu\pm\sigma$, linear combinations ['18–'26, 41 Qs name Normal]
12. $F(x)$ properties / mixed distribution statement-evaluation [6 Qs]
13. Order statistics of $U(0,1)$ or exponential min — **$X_{(k)}\sim\text{Beta}(k,n{-}k{+}1)$**, $\min\sim\text{Exp}(\sum\lambda_i)$ [11 Qs]
14. $\chi^2/t/F$ moment identity with $\bar X\perp s^2$ — **$\mathbb{E}(T^2\bar X^2)=\mathbb{E}(T^2)\mathbb{E}(\bar X^2)$** [verbatim repeat '19 Q25 = '22 Q12]
15. CF/MGF recognition — match $e^{-|t|}$, $e^{\lambda(e^{it}-1)}$, $(1-b^2t^2)^{-1}$ to their laws ['24 ×3, '25]
16. Convergence-mode implication chains (statement format) — **a.s. ⇒ P ⇒ d; d→constant ⇒ P** ['21, '22, '25]
17. Chebyshev bound plug-in [3 Qs; '19, '21×2]
18. Regression identities — $b_{yx}b_{xy}=r^2$, angle formula, $b_{13.2}b_{31.2}=r_{13.2}^2$ ['26 Q22–23]
19. $\Delta$-operator algebra — **$\Delta\log f=\log(1+\Delta f/f)$**, $\Delta(fg)$, $\Delta-\nabla=\delta^2$ [every year; '26 Q41]
20. $\Delta^n$ of degree-$n$ polynomial $=a_n n!h^n$ ['19 Q52-family, recurs]
21. Newton/Lagrange numeric interpolation from a 4–5 point table [4–7 Qs/yr]
22. Divided-difference properties — symmetry, constancy for polynomials ['20–'21 heavy, steady]
23. Trapezoidal/Simpson computation + error-term/precision-degree theory [23 Simpson Qs; '24 ×5]
24. Euler/Picard two-step hand iteration ['26 ×4, '25 ×2]
25. Computer set-pieces: 2's complement of a negative number; demand paging; virus vs worm vs Trojan; OSI layer of router/switch; compiler vs interpreter [every year, ~20 Qs]

---

## 10 · Execution system for 90%+

**Three-pass protocol (120 min):**

- **Pass 1 (0–55 min):** answer every "instant" question (< 60 s each) across the whole paper — expect ~50, dominated by Computer + operator algebra + standard-distribution facts. Flag the rest.
- **Pass 2 (55–105 min):** the ~25 computational questions (interpolation tables, quadrature, Euler/Picard, conditional expectations). Budget 2 min hard cap each; park anything stuck.
- **Pass 3 (105–120 min):** the ~5 parked items. Apply the guessing calculus (§1): attempt only with ≥1 elimination; leave true coin-flips blank. Verify bubbling.

**Error budget:** ≤2 careless in bankers (S), ≤2 in core (A), ≤1 elsewhere. Practice papers: track *cause* (concept / speed / careless) — at this level almost all losses are speed-induced careless errors, which timed drilling fixes.

**Preparation cadence (8 weeks):**

| Weeks | Focus | Output target |
|---|---|---|
| 1–2 | §7 Numerical + §5.1 distribution table | 20/20 numerical on any PYQ paper |
| 3–4 | §5.2 conditional/joint + bivariate normal + §6 identities | 90% on probability halves of 2023–26 |
| 5 | §8 Computer sheet (2 passes) + number-system speed drills | 19/20 computer |
| 6 | §5.3 + Tier C one-liners (non-parametrics, laws, inequalities) | zero blind spots on statement items |
| 7 | Full PYQ mocks: 2024, 2025, 2026 timed | ≥ 170 each |
| 8 | Redo every past error + verbatim-repeat bank (all 9 papers) | ≥ 180 stable |

**Final 48 h:** re-memorize only §5.1 table, §7.3 quadrature table, RK4, §8 sheet, and the 25 archetypes.

---

## 11 · Risk register (what could break the forecast)

| Risk | Evidence | Hedge |
|---|---|---|
| Statement-format surge (like 2024's ~18) | 8→18→16→6 across 2023–26 | drill "I/II/III" items from 2023–25; they test *exact* theorem hypotheses (iid? finite variance? independence?) |
| Single-topic blitz via linked sets | 2025: 7 Poisson Qs incl. one 5-Q data block | §5.1 depth on every named distribution, not just the big four |
| Stat-Methods rebound to 11 Q | happened in 2026 after 4 lean years | §6 is short — learn all of it, it's ≤ 2 days of work |
| Never-asked syllabus items debut | Milne, Stirling/Bessel, Weddle, differences of zero, ARE, intraclass, K–S, Borel 0-1 all ≤ 3 hits in 9 yrs | the one-line insurance facts embedded above |
| Inference creep | Estimation/testing: 0→1→2 Qs ('24→'25→'26) | know unbiasedness, consistency, MSE $=$ var $+$ bias$^2$, and the standard-error table for $\bar X$, $p$, $\bar X_1-\bar X_2$ |
| Layout shuffle (sandwich papers) | 2022, 2025 | navigate by content, not by expected section position |

---

## 12 · Methodology appendix

- **Pipeline:** regex parsing (2 header conventions, 3 preamble styles auto-detected) → keyword lexicon topic-tagging → Box-Cox/Yeo-Johnson/RobustScaler/Quantile feature matrix → HDBSCAN (Optuna, 60 trials) → FP-Growth on (year, 10-question block) transactions → 200× bootstrap ARI, 2000× permutation tests. Validation: silhouette 0.375, Davies–Bouldin 0.93, noise fraction 48.3%, all 4 association rules $p=0.0005$.
- **This document adds:** position-based section imputation (resolves the 32.5% unclassified residue to section level with 0 unknowns), per-year named-method frequency mining, verbatim/near-duplicate repeat detection (token-Jaccard ≥ 0.5 cross-year, manually spot-verified), format-mix and shared-context trend analysis, and the scoring/execution layer.
- **Caveats:** 9 yearly observations; forecast bands are empirical min–max tempered by 2024–26 recency; the 2027 paper setter is under no obligation to cooperate. The strategy is robust to ±1 block-level shuffles because Tier-S coverage is syllabus-complete for sections (iii)–(iv).

*Forecast compiled from your uploaded corpus and pipeline outputs. May your difference tables always telescope.* 
