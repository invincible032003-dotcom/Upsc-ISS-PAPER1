# Question-Archetype Taxonomy — ISS Statistics Paper I (Numerical Analysis)
Cuts across subtopic: classifies *how* a question is built, not *which* formula it tests. Unlike Probability/Statistical Methods, almost nothing here is a "scenario" — every archetype below is either pure symbol-manipulation or a numeric march through a fixed procedure.

## A. Algebraic-Identity Archetypes (operators only, no numbers)
1. **Identity count/verification** — "Consider expressions 1,2,3,4… how many/which are correct?" over $E,\Delta,\nabla,\delta,\mu$ relations.
2. **Cross-operator conversion** — express one operator purely in terms of another (e.g. $\Delta,\nabla,\mu$ all in terms of $\delta$); match the one *structurally* correct option among near-identical decoys.
3. **Compound-operator symbolic reduction** — simplify something like $\Delta^2/E$ or $1/(E-a)$ by expanding in terms of $E=1+\Delta$ *first*, then applying to a function — order-of-operations is the whole test.

## B. Table-Based Numeric Archetypes
4. **Missing-entry-in-table** — one tabulated value is unknown ($\alpha$); assume the data fits the implied polynomial degree, build the difference table, solve.
5. **Table-extension (extrapolation)** — extend a table one step beyond its range via the forward or backward formula.
6. **Divided-difference-table build** — construct successive levels to reach a final constant, or to reconstruct the generating polynomial entirely.

## C. Interpolation & Fitting Archetypes
7. **Direct fit-and-evaluate** — fit an interpolating polynomial (Lagrange / Newton–Gregory / divided-difference) through given points, evaluate at a new target $x$.
8. **Inverse interpolation** — same machinery, roles reversed: solve for $x$ given a target $y$.
9. **Method-choice justification** — "which formula is most appropriate here," decided by spacing (equal/unequal) and where the target $p$ falls (start/centre/end of table).
10. **Minimum-degree / uniqueness reasoning** — determine the least polynomial degree consistent with $n$ given points, or verify a stated degree claim.

## D. Quadrature (Integration) Archetypes
11. **Single-rule direct computation** — apply one named rule (Trapezoidal / Simpson-1/3 / Simpson-3/8 / Weddle) to a table or closed-form function; report the number.
12. **Rule-comparison or rule-combination** — two rules applied to the same integral for comparison, or two different rules stitched across sub-ranges of one integral.
13. **Undetermined-coefficients derivation** — find unknown weights in a stated quadrature formula by forcing exactness on a basis $1,x,x^2,\dots$
14. **Error-formula application** — compute/bound the truncation error of a named rule, or back-solve step size $h$ for a target tolerance.

## E. ODE-Solving Archetypes
15. **Step-by-step numeric march** — apply Euler / RK4 / Picard for a fixed number of steps; report the value at the final step.
16. **Iterative-approximation build** — successive Picard iterates $y^{(1)},y^{(2)},\dots$ — occasionally converges to a recognisable closed form before the stated iteration count, rewarding pattern-spotting over grinding.
17. **Stability-interval derivation** — find the range of $h$ for which a method stays (absolutely) stable, given $\lambda$.

## F. Structural Archetypes
18. **Recycled-dataset item** — the exact same table / polynomial / node-set reappears (sometimes verbatim, sometimes with only the specific ask changed) across different exam years.
19. **"How-many-correct" count-style answer** — 2–4 numbered mini-claims; the option set is a bare COUNT ("only one," "only two," "all four"), not a named subset — forces checking every claim independently since there's no partial-credit shortcut.

---
**Quick tag key:** Alg=A1–A3 · Tbl=B4–B6 · Fit=C7–C10 · Quad=D11–D14 · ODE=E15–E17 · Struct=F18–F19
