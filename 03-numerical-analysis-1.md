# ISS Paper-I · Topic (iii) NUMERICAL ANALYSIS — PYQ Data-Mine (2018–2026)

**Corpus:** 720 Q total. **Numerical Analysis = exactly 180 Q (25% of paper, 20 Q/year — every single year, no exceptions).** Block position shifts (sometimes one contiguous 20, sometimes split into two 10-Q blocks around the Computer section) but the *count* never does. This is the most mechanically self-contained topic in the paper — almost every question is "apply a named formula correctly," so the shortcut sheet below **is** the exam.

---

## Master weightage grid

| # | Subtopic | ~Total | Read |
|---|---|---|---|
| A | Operators ($\Delta,E,\nabla,\delta,\mu$) — identities & algebra | 22 | **highest density of pure formula-recall**; one master identity block covers most |
| B | Factorial polynomials, separation of symbols, differences of zero | 10 | small but near-guaranteed 1/year |
| C | Newton–Gregory forward/backward interpolation | 12 | classic "missing value in a table" template |
| D | Divided differences & Newton's divided-difference formula | 20 | second-largest bucket; properties (symmetry, linearity) tested as often as computation |
| E | Lagrange's interpolation formula (incl. inverse-Lagrange) | 14 | |
| F | Central-difference formulas (Gauss fwd/bwd, Stirling, Bessel) | 6 | rare but near-verbatim range-of-$p$ template |
| G | Error terms in interpolation | 8 | bound-comparison and truncation-order statements |
| H | Inverse interpolation | 5 | usually folded into a Lagrange or iterative-method question |
| I | Numerical differentiation | 8 | central > forward > backward in frequency |
| J | Numerical integration (Trapezoidal, Simpson 1/3 & 3/8, Weddle) | 30 | **single largest bucket** — rule-choice + error-formula + direct computation |
| K | Summation of series | 6 | small, but the antidifference trick is a clean 2-line shortcut |
| L | Numerical ODEs (Euler, Picard, RK, Milne) | 29 | second-largest; **Milne's method never once appears in 9 years — flagged gap below** |

---

## A. Operator Algebra — the master identity block

$$E=1+\Delta,\qquad \Delta=E-1,\qquad \nabla=1-E^{-1},\qquad \delta=E^{1/2}-E^{-1/2},\qquad \mu=\tfrac12\!\left(E^{1/2}+E^{-1/2}\right)$$
$$\boxed{\Delta-\nabla=\Delta\nabla=\delta^2}\qquad \mu^2=1+\frac{\delta^2}4\qquad \mu\delta=\tfrac12(\Delta+\nabla)$$
$$\Delta=\frac{\delta^2}2+\delta\sqrt{1+\frac{\delta^2}4}\ ,\qquad \nabla=\delta\sqrt{1+\frac{\delta^2}4}-\frac{\delta^2}2\ ,\qquad \mu=\sqrt{1+\frac{\delta^2}4}$$
Product rule: $\Delta(u_xv_x)=u_x\Delta v_x+v_{x+1}\Delta u_x=v_x\Delta u_x+u_{x+1}\Delta v_x$ (both forms valid — pick whichever matches the offered option). $E^n=(1+\Delta)^n$; $E,\Delta,\nabla,\delta$ all commute and satisfy $\Delta^n\Delta^m=\Delta^{n+m}$ etc. On $e^{ax+b}$ (step $h=1$): $\Delta e^{ax+b}=e^{ax+b}(e^a-1)$, so $\Delta^n e^{ax+b}=e^{ax+b}(e^a-1)^n$ — **not** $(e^a-1)^{n+1}$, a routine off-by-one distractor.

**Anchors:** 19-Q79 ($\tfrac12\delta^2+\delta\sqrt{1+\delta^2/4}=\Delta$, direct identity) · 20-Q66 ($\mu\delta=\tfrac12(\Delta+\nabla)$) · 20-Q75 (which operator pairs commute — **all of them do**, "does not commute" options are always wrong) · 22-Q61 (4-statement operator-identity block, count how many hold — usually **all** hold since they're standard identities) · 22-Q64 ($\Delta-\nabla=\Delta\nabla$, direct) · 22-Q66/67 (product-rule variant matching; $\mu,\Delta,\nabla$ in terms of $\delta$ — verify the **missing-$\delta$-factor trap**: an option that drops $\delta$ multiplying $\sqrt{1+\delta^2/4}$ is structurally wrong, not just numerically) · 23-Q30/2026-Q45 ($\tfrac{\Delta^2}E e^x\times\tfrac{Ee^x}{\Delta^2e^x}=1$ when $h=1$ but $=e^{x+h}$-flavoured when $h\ne1$ is stated — **this exact question repeats across 2022-Q23 and 2026-Q45**, watch which interval-of-differencing is stated) · 25-Q66 (which of 4 stated relations hold — spot the **sign errors** deliberately inserted into 2 of the 4 as distractors) · 26-Q41 ($\Delta[\log f(x)]=\log\!\big(1+\Delta f(x)/f(x)\big)$, direct) · 26-Q47 ($\mu[f(x)g(x)]=\mu f\,\mu g+\tfrac14\delta f\,\delta g$).

**TRAP:** $\Delta^n e^{ax+b}=e^{ax+b}(e^a-1)^n$ (25-Q... wait this is 2022-Q30) has a companion trap where an $e^a$ multiplier is *added* to one option — always re-derive from $\Delta e^{ax+b}=e^{a(x+1)+b}-e^{ax+b}=e^{ax+b}(e^a-1)$ rather than recalling the closed form, since the exponent structure is easy to misremember under time pressure.

---

## B. Factorial Polynomials, Separation of Symbols, Differences of Zero

$$x^{(n)}=x(x-1)(x-2)\cdots(x-n+1)\ (\text{step }1)\qquad \Delta x^{(n)}=nx^{(n-1)}\ (\text{power-rule analogue})$$
For step $h$: $x^{(n)}$ generalises to $x(x-h)(x-2h)\cdots(x-(n-1)h)$, and $\Delta^n x^{(n)}=n!\,h^n$ exactly (constant — this is the discrete analogue of "$n$-th derivative of $x^n$ is $n!$"). $\Delta^m 0^n$ ($0^n$ meaning factorial powers evaluated via the falling-factorial-of-zero convention) follows the same recursion — compute via the explicit finite-difference table rather than a remembered number.

**Anchors:** 18-Q42 ($x^3$ as $Ax^{(3)}+Bx^{(2)}+Cx+D$ with $h=2$ — re-expand $x^{(3)}=x(x-2)(x-4)$ etc. **at the stated step**, not step 1) · 19-Q52/53 ($\Delta^{10}$ on a degree-10-in-disguise product $\Rightarrow abcd\times10!$; $\Delta^50^3,\Delta^30^5$ pair) · 20-Q68 ($(3x+8)^{(4)}$ at $x=2$ — substitute *then* expand the falling factorial, don't expand symbolically first) · 21-Q70 ($\Delta^nx^{(n)}=n!h^n$, direct recall) · 23-Q45 (coefficient of $x^4$ inside a sum of falling-factorial terms — convert each $x^{(k)}$ back to ordinary powers **only for the terms that can contribute to $x^4$**, i.e. $k\ge4$, saving half the expansion) · 26-Q49 ($\Delta^4$ of a degree-4 product of 4 linear factors $\Rightarrow$ constant $=4!\times(\text{product of leading coefficients})$, a direct application of $\Delta^nx^{(n)}=n!h^n$ once you recognise the product as effectively a scaled $x^{(4)}$).

**TRAP:** When a step size $h\ne1$ is stated (18-Q42, and any "interval of differencing $=h$" preamble), $x^{(n)}$ must be built with spacing $h$ — reusing the $h=1$ falling-factorial coefficients is the single most common error in this subtopic.

---

## C. Newton–Gregory Forward & Backward Interpolation

$$y_p=y_0+p\Delta y_0+\frac{p(p-1)}{2!}\Delta^2y_0+\frac{p(p-1)(p-2)}{3!}\Delta^3y_0+\cdots,\quad p=\frac{x-x_0}h\ \text{(forward, near table start)}$$
$$y_p=y_n+p\nabla y_n+\frac{p(p+1)}{2!}\nabla^2y_n+\cdots,\quad p=\frac{x-x_n}h\ \text{(backward, near table end)}$$

**Anchors:** 18-Q50 (population-estimate extrapolation, forward formula, answer as a *range* not exact value — build only as many difference-table rows as the data supports) · 18-Q46 (missing interior term $\alpha$ — assume the data is degree-$(n-1)$-polynomial-consistent for $n$ points, build the difference table, and the *last* difference column being non-constant pins down $\alpha$) · 20-Q74/22-Q68 (**identical dataset** $f(20)=512,f(30)=439,f(40)=346,f(50)=243$ across two different exam years — statement 1 "fits degree $<2$" is checked via 2nd-difference constancy; statement 2 extrapolates via forward/backward formulas in the *same* question) · 23-Q51/52 (forward formula to extrapolate $u_2$ **before** the table start — treat $p$ as negative; backward formula for $u_{8.5}$ mid-table-end) · 26-Q42 (cubic-in-4-points table, direct forward-difference extrapolation to $f(4)$).

**TRAP:** Forward/backward formula choice is about **proximity to the relevant end of the table**, not about extrapolating vs. interpolating — 23-Q51 asks for a point *before* $x_0$ (still solved via the forward formula with negative $p$), which trips students expecting "backward = extrapolate left."

---

## D. Divided Differences & Newton's Divided-Difference Formula

$$f[x_0,x_1]=\frac{f(x_1)-f(x_0)}{x_1-x_0},\qquad f[x_0,\dots,x_k]=\frac{f[x_1,\dots,x_k]-f[x_0,\dots,x_{k-1}]}{x_k-x_0}$$
**Properties (tested as statements more than computed):** symmetric in all arguments (order of $x_i$'s doesn't matter); linear operator; the $n$-th divided difference of a degree-$n$ polynomial is the **constant** leading coefficient (degree-$(n+1)$-and-higher differences vanish) — and critically, "constant" $\ne$ "necessarily zero" (a specifically-tested distinction). $f(x)=1/x\Rightarrow f[x_1,\dots,x_n]=\dfrac{(-1)^{n-1}}{x_1x_2\cdots x_n}$. Newton's formula: $f(x)=f(x_0)+(x-x_0)f[x_0,x_1]+(x-x_0)(x-x_1)f[x_0,x_1,x_2]+\cdots$ — works for **unequal** spacing, unlike Newton–Gregory.

**Anchors:** 18-Q41/22-Q65/23-Q59-60 (**the recycled cubic**: $f(1{,}\dots,6)=12,40,90,168,280,432$ resolves to $f(x)=x^3+5x^2+6x$ — verify: $f(1)=1+5+6=12$✓, $f(2)=8+20+12=40$✓ — this exact series appears **three separate times** across the corpus, occasionally only asking for degree/constant-term rather than the full polynomial) · 18-Q43/21-Q41 ($n$-th divided diff of $n$-th degree poly is constant — direct statement recall) · 18-Q53/21-Q49 ($f(x)=1/x$, 3rd/2nd divided difference formula, direct) · 18-Q80/26-Q46 (**identical question, identical arguments** $2,4,9,10$, third divided difference of $x^3-2x$ — appears in 2019 and again in 2026, seven years apart, same numbers) · 20-Q65 (3-statement property block — symmetry, constancy, linearity all **true**) · 20-Q71/72 (build lowest-degree polynomial from divided differences; extend a divided-difference table to find $f(8)$) · 21-Q61/66/69 (2nd divided diff via a determinant identity $\det A/60$; extrapolate $f(100)$ from 5 equally-spaced-in-$x^2$-ish points; $f(3)$ from 6 points via full Newton divided-difference build) · 23-Q41-44 (min arguments needed for 3rd divided diff of a cubic $=4$ points; generalised 2-variable-notation divided difference $\Delta^2_{y,z}x^3=1/x+1/y+1/z$; polynomial-value-sum relations $U(0)+U(4),U(1)+U(3)\Rightarrow U(2)$ via symmetric-point algebra) · 24-Q70 ("3rd divided difference of a **cubic** is always constant **but not necessarily zero**" — the correct option; contrast with the *4th* divided difference of a cubic, which **is** always exactly zero) · 25-Q23 (9th vs. 10th divided difference of $1/x$ — use the closed form directly rather than extending a table by hand) · 26-Q43/44 (statement-pair on $(n+1)$-th divided diff $=0$ for degree-$n$ + determinant representation; lowest-degree polynomial from 6 points via divided-difference table).

**TRAP:** "$n$-th divided difference of a degree-$n$ polynomial is constant" is **routinely mis-answered as "is zero"** — the constant is the *leading coefficient* (nonzero unless the polynomial is genuinely degree $<n$); it's the $(n{+}1)$-th and higher differences that vanish (24-Q70 is built exactly to catch this).

---

## E. Lagrange's Interpolation Formula (& Inverse Lagrange)

$$f(x)=\sum_{i=0}^n f(x_i)\prod_{j\ne i}\frac{x-x_j}{x_i-x_j}$$
Works for **unequal** spacing (its main advantage over Newton–Gregory). **Inverse interpolation via Lagrange:** swap the roles of $x$ and $y$ — fit $x$ as a Lagrange polynomial in $y$, then evaluate at the target $y$-value directly (no iteration needed, unlike the general inverse-interpolation method in §H).

**Anchors:** 18-Q51/59 (find missing $\alpha$ inside the table itself by inverting Lagrange — treat the *unknown* as the interpolation target); slope at $x=2$ via Lagrange-based numerical differentiation, i.e. differentiate the fitted cubic symbolically) · 18-Q54 ($f(3)$ from $f(n^2)=n^3$, $n=1,2,3$ — re-map to points $(1,1),(4,8),(9,27)$ first, **the trap is forgetting to square the $n$-values before applying Lagrange**) · 20-Q78 (degree-2 polynomial via 3-point Lagrange, direct) · 21-Q44/48/62/65/66 (degree-from-data-count check; interpolating polynomial reconstruction; extrapolation $f(100)$; choice-of-method statement (Lagrange/Newton-divided-diff both valid for unequal spacing, **both correct** is a frequent right answer) · 22-Q27 (**inverse** Lagrange: given $y$-values at unknown $x$-positions, back out $x$ for a target $y=7$) · 23-Q54 (mixed-spacing data — combination of Trapezoidal *and* Simpson, **not** pure Lagrange, testing whether you notice the data doesn't support higher-order fitting throughout) · 24-Q75 (roots of the least-degree polynomial through 3 points — solve the fitted quadratic/cubic's roots, a rare "solve after interpolating" 2-step question) · 25-Q63/64/70 (inverse Lagrange via a symmetric weighted-form fit, $g(\beta)=b$ by inspection of the interpolation-identity structure — **no computation needed** if you recognise $f(b)=\beta$ makes $g(\beta)=b$ directly by definition of inverse function; quadratic-via-Lagrange then evaluate outside the fitted range; direct 4-point Lagrange).

**TRAP:** 25-Q63 looks like it needs a full Lagrange expansion but is actually an identity: since $f$ interpolates $(a,\alpha),(b,\beta),(c,\gamma)$ and $g$ is $f$'s inverse by construction, $g(\beta)=b$ **by definition** — recognising "$g$ is literally $f^{-1}$ restated" saves the entire computation.

---

## F. Central-Difference Formulas — Gauss, Stirling, Bessel

Gauss forward: best for $0<p<0.5$ (interpolate just past a tabular point); Gauss backward: best for $-0.5<p<0$. **Stirling's formula** (average of Gauss fwd/bwd): best near $p\approx0$ (center of table). **Bessel's formula**: best for $0.25\lesssim p\lesssim0.75$ (midway between two tabular points) — Gauss-forward-style even differences sit *above* the central horizontal line, odd differences sit *on* it.

**Anchors:** 19-Q57 (Gauss forward difference placement statement) · 22-Q26 (Bessel's most-appropriate $p$-range: $0.25$ to $0.75$, direct recall).

**TRAP:** The four central-difference formulas are chosen purely by **where $p$ falls**, not by data shape or degree — memorise the range table above as a single lookup, don't re-derive from first principles under time pressure.

---

## G. Error Terms in Interpolation

**Lagrange/general truncation error:** $E(x)=\dfrac{(x-x_0)(x-x_1)\cdots(x-x_n)}{(n+1)!}f^{(n+1)}(\xi)$ for some $\xi$ in the data range. Newton-forward and Lagrange interpolating polynomials through the **same** $n+1$ points are algebraically identical (uniqueness of the interpolating polynomial) — so their truncation-error bounds are **equal**, never "twice" or "half." Linear-interpolation error is bounded by $\frac18\times$(2nd difference) on equally-spaced data (from $\max\frac{(x-x_0)(x-x_1)}4$ over the sub-interval $=h^2/4$, combined with the 2nd-derivative/2nd-difference correspondence).

**Anchors:** 23-Q46 (linear-interpolation error bound $=\frac18\times$2nd difference, direct recall) · 24-Q74 (choose step $h$ so linear-interpolation truncation error on $\sin x$ stays $\le10^{-5}$ — bound $\frac{h^2}8\max|f''|\le10^{-5}$, solve for $h$) · 24-Q76 (Newton-forward vs. Lagrange truncation-error-bound ratio — **exactly 1**, i.e. "$\varepsilon$", since both fit the identical unique polynomial) · 26-Q56 (Lagrange error-term formula, direct — watch the **denominator power**: $(n+1)!$ with derivative order $n+1$, not $n!$ with order $n$, a routine off-by-one distractor pair).

---

## H. Inverse Interpolation

Two routes: (1) fit $x$ as a function of $y$ via Lagrange directly (exact, no iteration, when the $y$'s are usable as the independent variable — see §E), or (2) iterate the forward Newton-Gregory formula, solving for $p$ given a target $y$ (successive approximation, since $p$ appears inside factorial-product terms).

**Anchors:** 19-Q60 (iterative inverse interpolation, $h=5$, converge to $x$ for $y=3000$) · 20-Q61 (which formula best handles a *newly inserted* point without recomputing — **Newton's divided-difference formula**, since Lagrange needs full recomputation and Newton-forward needs equal spacing preserved).

---

## I. Numerical Differentiation

$$f'(x_i)\approx\frac{f_{i+1}-f_{i-1}}{2h}\ (\text{central, }O(h^2))\qquad f''(x_i)\approx\frac{f_{i-1}-2f_i+f_{i+1}}{h^2}\ (\text{central, }O(h^2))$$
$$f''(x_i)\approx\frac{f_i-2f_{i+1}+f_{i+2}}{h^2}\ (\text{forward, }O(h),\text{ less accurate})$$

**Anchors:** 21-Q67 ($\Delta^2/E$ operator applied to $x^3$ reduces to the central-difference-style second-derivative approximation, $=6x$) · 22-Q28 (central 2nd-derivative formula, direct) · 25-Q62/68 (forward-difference 2nd-derivative approximation, direct formula recall; numeric central-difference computation for $f''(6.3)$ from a 4-point table — build the difference table, don't guess the formula).

**TRAP:** Central-difference approximations are $O(h^2)$-accurate; forward/backward are only $O(h)$ — a question explicitly stating "error $O(h^2)$" (25-Q68) is telling you **which formula to use** before you've even looked at the data.

---

## J. Numerical Integration — Trapezoidal, Simpson's 1/3 & 3/8, Weddle's Rule

| Rule | Requires | Formula (one panel width shown) | Exact for degree $\le$ | Error (single panel) |
|---|---|---|---|---|
| Trapezoidal | any $n$ | $\frac h2(f_0+2f_1+\cdots+2f_{n-1}+f_n)$ | 1 | $-\frac{h^3}{12}f''(\xi)$ per panel |
| Simpson's 1/3 | $n$ even | $\frac h3(f_0+4f_1+2f_2+\cdots+4f_{n-1}+f_n)$ | **3** (not just 2!) | $-\frac{h^5}{90}f^{(4)}(\xi)$ per 2-panel block |
| Simpson's 3/8 | $n$ multiple of 3 | $\frac{3h}8(f_0+3f_1+3f_2+2f_3+\cdots+f_n)$ | 3 | $-\frac{3h^5}{80}f^{(4)}(\xi)$ per 3-panel block |
| Weddle's | $n$ multiple of 6 | $\frac{3h}{10}(f_0+5f_1+f_2+6f_3+f_4+5f_5+f_6)$ | **6** | very small, rarely asked numerically |

**Global Trapezoidal error:** $-\dfrac{(b-a)h^2}{12}f''(\xi)=-\dfrac{nh^3}{12}f''(\xi)$.

**Anchors:** 18-Q56–59 (Simpson-1/3-as-degree-2-arcs geometric statement, **true**; Weddle exact-for-degree-6, **true**; direct Simpson-3/8 numeric; 3-point quadrature-coefficient-matching for max order — solve by forcing exactness on $1,x,x^2$) · 18-Q44/24-Q64 (**RK4 applied to $dy/dx=f(x)$ alone collapses to Simpson's 1/3 rule**: $y(h)=\frac h6[f(0)+4f(h/2)+f(h)]$ — same identity tested in both 2018 and 2024, a genuinely important cross-topic shortcut linking §J and §L) · 19-Q71/72/73 (Trapezoidal numeric for $\ln2$; Simpson-1/3 even-subinterval requirement, direct; Simpson-3/8 numeric from a table) · 20-Q73/76/79 ($|A-B|$ Simpson-vs-exact comparison — Simpson is *exact* for $x^2$ (degree $2\le3$) so $|A-B|=0$ **exactly**, a zero-trap; direct Simpson numeric; area-under-curve via Simpson from a 7-point table) · 21-Q45/63 (Simpson-3/8 subinterval-multiple-of-3 requirement, direct; two-statement block on Simpson-3/8's per-panel cubic assumption + Trapezoidal's "any number of subintervals" flexibility, **both true**) · 22-Q21/22/24/25 (Trapezoidal global-error formula recall; Euler local-truncation-error bound $\le h^2/2$; **combined** Trapezoidal-then-Simpson over two different sub-ranges of one integral — apply each rule to its own segment and add; inverse-operator particular-solution style question dressed as $1/(E-8)$ acting on $x^2\cdot2^x$) · 23-Q47/48/53/54 (Trapezoidal error for $x^3$: $h^2/6$ direct from the cubic's constant 2nd-derivative; 3-point quadrature-coefficient matching; **irregular-spacing** data ⇒ no closed-form rule applies cleanly, general answer is "no single named rule"; **mixed-density** data (some points at spacing $h$, others at $h/2$) ⇒ combination of Trapezoidal and Simpson-1/3 across sub-ranges) · 24-Q63/68/69/77–79 (Simpson-1/3 error numeric for $x^4$; rule-choice for $b=a+8h$ ⇒ **Simpson-1/3 then Weddle** combination, since $8=2+6$; back-solve $f(2)$ from *two different* rule results on the same integral — set up both formulas as simultaneous equations; 3-point quadrature-coefficient matching (Simpson-1/3 in disguise, coefficients $h/3,4h/3,h/3$); 3-statement exactness-for-cubic block, **Simpson-1/3 and 3/8 both exact, Trapezoidal not**; real river cross-section Simpson-1/3 application) · 25-Q24–27 (Simpson-1/3-given, **back-solve** what Trapezoidal would give on the *same* data — needs $f(1)$ recovered from the Simpson value first, then re-applied to the Trapezoidal formula, a genuine 2-step "reverse-engineer the function value" question; direct Simpson-1/3 area from a 5-point table; error-formula algebra to find $h$; 4-statement exactness-degree block) · 26-Q50–53 (**same 5-point table as 25-Q25**, reused with a scaling wrapper "$2520A=?$"; Trapezoidal and Simpson-1/3 both applied to the *same* 5-point data, compare directly; global Trapezoidal truncation-error-formula recall).

**TRAP:** Simpson's 1/3 rule is exact for **cubics**, not just the quadratics it's literally fitted from — this surprising one-degree "bonus" (because the degree-3 error term integrates to zero by odd-symmetry about each panel's midpoint) is worth a guaranteed mark whenever a question tests exactness-by-degree (18-Q56, 24-Q78, 25-Q27). Rule-choice questions for oddly-sized intervals ($b-a=8h$, mixed spacings) are almost always "**combine** two rules across sub-ranges," never a single named rule stretched to fit.

---

## K. Summation of Series

If $u_x=\Delta v_x$ (i.e. $u_x$ is expressible as *some* function's first difference), then $\displaystyle\sum_{x=a}^{b-1}u_x=v_b-v_a$ (telescoping) — the practical method is: express $u_x$ in **factorial-polynomial** form, antidifference term-by-term using $\Delta^{-1}x^{(n)}=\dfrac{x^{(n+1)}}{n+1}$ (discrete analogue of the power rule for integration), then evaluate at the limits. For a geometric-progression general term $ar^x$: $\Delta^{-1}(ar^x)=\dfrac{ar^x}{r-1}$ (since $\Delta(r^x)=r^x(r-1)$).

**Anchors:** 20-Q70 (function whose first difference is $9x^2+11x+5$ — convert to falling-factorial form, antidifference each power, convert back) · 25-Q61 (identical technique, first difference $3x^2+x+4$) · 25-Q69/26-Q59 (2-point/3-point quadrature-coefficient matching questions that are really "summation of series in disguise" via the $\binom nk\Delta^k$ expansion of $\sum y_i$ — recognise the binomial-Newton-forward identity $\sum_{k=1}^n y_k = \left[\binom n1+\binom n2\Delta+\cdots\right]y_1$ directly rather than expanding).

---

## L. Numerical Solution of Differential Equations — Euler, Picard, Runge–Kutta, Milne

$$\text{Euler: } y_{n+1}=y_n+hf(x_n,y_n)\quad(\text{local error }O(h^2),\text{ global }O(h))$$
$$\text{Picard: } y^{(k+1)}(x)=y_0+\int_{x_0}^x f\big(t,y^{(k)}(t)\big)\,dt\quad(\text{iterate from } y^{(0)}=y_0)$$
$$\text{RK4: } k_1=hf(x_0,y_0),\ k_2=hf(x_0+\tfrac h2,y_0+\tfrac{k_1}2),\ k_3=hf(x_0+\tfrac h2,y_0+\tfrac{k_2}2),\ k_4=hf(x_0+h,y_0+k_3),\quad y_1=y_0+\tfrac16(k_1+2k_2+2k_3+k_4)$$
**RK4's local truncation error is $O(h^5)$** (global $O(h^4)$) — don't confuse local vs. global order (a recurring 2-option trap pair).

**Absolute stability for $y'=\lambda y,\ \lambda<0$:** forward Euler stable iff $|1+\lambda h|<1\iff 0<h<\dfrac{2}{|\lambda|}$; **backward Euler is A-stable — stable for every $h>0$, no restriction at all.**

**Anchors:** 18-Q44/24-Q64 (RK4-reduces-to-Simpson's-1/3 for $f(x,y)=f(x)$ only — see §J cross-reference) · 18-Q60/21-Q50 (Picard successive-approximation constant-term extraction) · 19-Q74/75/78 (Euler numeric; Picard 3rd-approximation series; RK2 numeric) · 20-Q64 (Euler over 5 steps, answer given as a *range* — build the recursion, don't over-solve for exact decimals) · 21-Q42 (RK4 full numeric at $x=0.1$) · 22-Q22 (Euler local-truncation-error **bound**, not exact value — $\le h^2/2\max|f'|$-style, use the bound formula directly) · 23-Q57/58 (Euler absolute-stability range $-2<\lambda h<2$ for **general** $\lambda$ sign — note this differs from the $\lambda<0$-only boxed version above when $\lambda$'s sign isn't restricted in the question; RK4 exact closed-form match to the Taylor series of $e^{-h}$, since $dy/dx=-y$ has exact solution $e^{-x}$) · 24-Q61/62 (Picard 2nd approximation; 3-statement order-comparison, RK4 $>$ both Euler variants **in order**, forward/backward Euler share the **same order** as each other) · 24-Q80/26-Q60 (**forward-Euler stability interval**, $dy/dx=-8y\Rightarrow0<h<1/4$; $dy/dx=-20y\Rightarrow0<h<0.1$ — same formula, different $\lambda$, both solved by the boxed stability condition above) · 25-Q28/29/30/65 (Euler-vs-exact absolute error; Picard-1st-iterate-vs-exact absolute error — **both require first solving the ODE exactly** as a reference, which is often the harder half of the question; multi-step Euler numeric; 4th Picard iterate — often converges to a recognisable closed form well before $k=4$, check for early convergence rather than grinding every iteration) · 26-Q48/54/55/57 (2nd Picard iterate direct; forward Euler single-step numeric; **backward** Euler stability — always stable, direct recall; forward Euler numeric for a nonlinear ODE).

**GAP — worth knowing:** *Milne's method appears zero times across all 9 years (2018–2026) despite being explicitly named in the syllabus.* Either a low-probability inclusion for 2027 or deliberately avoided as MCQ-unfriendly (it's a predictor-corrector *multistep* method, awkward to test in a single numeric MCQ). Keep the *concept* (predictor: $y_{n+1}=y_{n-3}+\frac{4h}3(2f_n-f_{n-1}+2f_{n-2})$; corrector uses Simpson's rule internally) at recognition level only — don't over-invest computation practice here relative to Euler/Picard/RK4.

**TRAP:** RK4's local truncation error is $O(h^5)$ — a very common wrong-option pairing offers $O(h^4)$ (which is actually the *global* order) as bait (21-Q47 tests exactly this local-vs-global distinction).

---

## Recycled / repeated PYQs — the highest-confidence "will reappear" list

- **Cubic $12,40,90,168,280,432\to x^3+5x^2+6x$**: 2018-Q41, 2022-Q65, 2023-Q59–60 — three appearances, sometimes asking only for degree/constant term.
- **3rd divided difference of $x^3-2x$ at $2,4,9,10$**: 2019-Q80, 2026-Q46 — identical numbers, seven years apart.
- **$(\Delta^2/E)e^x\times\dfrac{Ee^x}{\Delta^2e^x}$**: 2022-Q23, 2026-Q45 — same structure, watch the stated interval of differencing.
- **RK4 collapsing to Simpson's-1/3 for $f(x)$-only ODEs**: 2018-Q44, 2024-Q64.
- **$f(20)=512,f(30)=439,f(40)=346,f(50)=243$ Newton–Gregory table**: 2020-Q74, 2022-Q68.
- **The 5-point Simpson table** ($x=0,\frac14,\frac12,\frac34,1$; $f=1,\frac45,\frac23,\frac47,\frac12$): 2025-Q25, 2026-Q50 (same data, different final numeric wrapper).
- **Forward-Euler stability for $dy/dx=-\lambda y$**: 2023-Q57 (general), 2024-Q80 ($\lambda=8$), 2026-Q60 ($\lambda=20$) — same formula, new $\lambda$ every time it reappears.

---

## Revision priority
1. **J** (integration) — 30 questions, and the rule-choice logic (§J's table) resolves most of them without heavy arithmetic.
2. **A + D** (operators + divided differences) — together ~42 questions, nearly all pure identity-recall once the master boxes above are memorised.
3. **L** (ODEs) — 29 questions; know the 3 stability/order facts (RK4 $O(h^5)$ local, backward-Euler A-stable, forward-Euler's $2/|\lambda|$ bound) cold, they resolve a disproportionate share.
4. **E, C** (Lagrange, Newton–Gregory) — high question count but genuinely low trap density once the range-of-applicability rule (equal vs. unequal spacing) is internalised.
5. Skip disproportionate Milne's-method drilling — allocate that time to Simpson/RK4/divided-difference fluency instead.
