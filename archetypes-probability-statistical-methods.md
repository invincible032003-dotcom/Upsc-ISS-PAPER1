# Question-Archetype Taxonomy — ISS Statistics Paper I (Probability + Statistical Methods)
Cuts across topic/subtopic: classifies *how* a question is built, not *what* it's about.

## A. Statement / Theorem-Verification Archetypes
1. **Theorem-condition matching** — "Consider statements 1,2,3... which hold?" Tests exact hypotheses of a named theorem (LLN, CLT, Chebyshev, uniqueness thm).
2. **Property/Remark verification** — checks a stated property of a distribution/estimator (e.g. "mean = variance for $\chi^2_n$", "$t_n \to N(0,1)$").
3. **Statement-1/Statement-2 (assertion–reason)** — two claims; is each true, does one explain the other.
4. **Definition-boundary check** — tests whether a definition applies at an edge case (e.g. BVN density existence when $|\rho|=1$).

## B. Formula/Plug-in Archetypes
5. **Direct moment plug-in** — $X\sim D(\theta)$ given; find $E(X)$, $\mathrm{Var}(X)$, a probability, from the standard formula.
6. **Statistic plug-in** — given $\bar x, s, n$; compute test statistic / CI directly from the formula.
7. **Data-table computation** — $r$, $\chi^2$, association coefficient computed from a small given table.

## C. Derivation-Step Archetypes
8. **Conditional-expectation derivation** — $f(x,y)$ given; integrate to get $E(Y\mid X)$, marginal, or regression line.
9. **Constant-matching derivation** — find $C$ so that a given ratio of r.v.s equals a named distribution ($t$, $F$, Cauchy).
10. **Transform-and-identify** — $Y=g(X)$ given; derive $f_Y$ via Jacobian/CDF method.
11. **Multi-step chained derivation** — one setup, sequential sub-results ($E\to \mathrm{Var}\to$ MGF of the same derived variable).

## D. Application Archetypes
12. **Inequality bound** — Chebyshev/Markov/Kolmogorov applied to bound a probability from $\mu,\sigma$.
13. **Bayes'/total-probability scenario** — worded real-world setup, posterior asked.
14. **Generating-function manipulation** — build/exploit MGF, CF, or PGF (composition, uniqueness, moments via differentiation).
15. **Order-statistic derivation** — pdf/CDF/moment of $\min, \max$, median, range from $F(x)$.
16. **Non-parametric test mechanics** — compute/apply sign, run, Wilcoxon, Mann–Whitney, KS statistic.

## E. Structural Archetypes
17. **Shared-setup cluster** — one context (joint pdf / BVN / sample) drives 2–5 chained sub-questions.
18. **Pure combinatorial counting** — classical probability, no distribution theory.
19. **Asymptotic/convergence identification** — mode of convergence, limiting law, CLT/LLN recognition.

---
**Quick tag key:** Thm=A1–A4 · Fml=B5–B7 · Der=C8–C11 · App=D12–D16 · Struct=E17–E19
