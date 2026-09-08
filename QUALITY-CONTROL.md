# Final Quality-Control Record

UPSC ISS Statistics Paper-I (Objective) — 2018–2026 PYQ Offline Mock Engine
plus the 2027 AI-generated forecast bank

Everything below was executed, not asserted. The commands that produce each
result are named so any claim can be re-run.

```
sh build/run_all.sh          # rebuilds and re-validates the whole project
```

---

## 0. The two banks

The project ships **two separate question banks** and they are never mixed.

| | Authentic | Forecast |
|---|---|---|
| What it is | previous-year questions | AI-generated 2027 practice |
| Count | 720 | 750 |
| Coverage | 4 units, 2018–2026 | Probability 375, Statistical Methods 375 |
| Id shape | `2023-Q12` | `FP-041`, `FS-207` |
| Global in `questions.js` | `window.quizData` | `window.forecastData` |
| Mocks | year, sectional, topic, subtopic, custom | 30 named mocks of exactly 25 |
| PDFs | 4 unit volumes | `Probability_Forecast.pdf`, `Statistical_Methods_Forecast.pdf` |
| Per-question layout in the PDF | 6 sections | 4 sections |

Separation is **enforced and tested**, not merely asserted:

- `python3 build/reconcile.py` proves no id is shared, that every forecast
  record carries `isForecast` and no authentic record does, that the 30 mocks
  hold exactly 25 questions each, that no forecast question is used twice and
  that the mocks cover the whole forecast bank.
- `node build/test_dashboard.mjs` drives the browser and proves the PYQ mock
  builders read only `window.quizData`, that a forecast mock starts with 25
  forecast questions, and that the forecast reveal order and badging are right.
- `python3 build/verify_forecast_pdf.py` proves **no authentic PYQ id appears
  anywhere** in either forecast volume, and `python3 build/verify_pdf.py`
  proves the four PYQ volumes contain exactly the 720 authentic items.

---

## 1. Counts — reconciled at every stage

`python3 build/reconcile.py` → **RECONCILIATION PASSED**

| Year | source CSV | extracted | answer bank | merged | questions.js |
|---|---|---|---|---|---|
| 2018 | 80 | 80 | 80 | 80 | 80 |
| 2019 | 80 | 80 | 80 | 80 | 80 |
| 2020 | 80 | 80 | 80 | 80 | 80 |
| 2021 | 80 | 80 | 80 | 80 | 80 |
| 2022 | 80 | 80 | 80 | 80 | 80 |
| 2023 | 80 | 80 | 80 | 80 | 80 |
| 2024 | 80 | 80 | 80 | 80 | 80 |
| 2025 | 80 | 80 | 80 | 80 | 80 |
| 2026 | 80 | 80 | 80 | 80 | 80 |
| **Total** | **720** | **720** | **720** | **720** | **720** |

| Unit | source CSV | mined file | extracted | questions.js | PDF |
|---|---|---|---|---|---|
| Probability | 196 | 196 | 196 | 196 | 196 |
| Statistical Methods | 164 | 164 | 164 | 164 | 164 |
| Numerical Analysis | 180 | 180 | 180 | 180 | 180 |
| Computer Application and Data Processing | 180 | 180 | 180 | 180 | 180 |
| **Total** | **720** | **720** | **720** | **720** | **720** |

The count was calculated, not assumed: the source question bank was parsed and
counted, and the four independently mined topic files were counted separately.
The two sources agree on 720, on every per-year total and on every per-unit
total.

---

## 2. Data audit

`python3 build/qc.py` → `DATA-AUDIT.txt`, **0 blocking errors, 0 warnings**

```
Duplicates:                                 0 (ids) / 0 (near-identical text)
Missing options:                            1   (2019-Q48, absent from the scan)
Missing answers:                            2   (excluded from scoring)
Missing solutions:                          0
Missing shortcuts:                          0
Missing tips:                               0
Classification issues:                      0
Source issues (flagged and preserved):     13
```

Classification: 4 units → 45 syllabus topics → 95 syllabus concepts. Every one
of the 720 questions carries all three levels.

Answer-key distribution: (a) 158, (b) 225, (c) 177, (d) 158 across the 718
keyed items — no positional bias worth noting.

Question-type mix: Numerical 381, Conceptual 126, Theoretical 99, Factual 86,
Definition 28.

### Source defects — preserved verbatim, never silently corrected

| Item | Defect | What was done |
|---|---|---|
| 2018-Q3 | piecewise density integrates to 11/12, not 1; the correct value is not among the options | left unkeyed, excluded from scoring |
| 2019-Q48 | the four options are missing from the source scan | left unkeyed, excluded from scoring |
| 2019-Q22 | the true statement set {1,4} is not offered | keyed to the only defensible option, caveat printed |
| 2019-Q24 | printed SE 0.06 vs exact 0.0648 | keyed with caveat |
| 2019-Q32 | option prints (m+n+1) where the hypergeometric variance has (m+n−1) | keyed as the only structurally correct option, caveat printed |
| 2021-Q33 | chi-square additivity stated without independence | keyed with caveat |
| 2021-Q40 | printed SD 1.396 vs exact 2.396 | keyed with caveat |
| 2022-Q12 | the exact value 4.8 is not among the options | keyed with caveat |
| 2022-Q68 | third differences are non-zero, so the stated quadratic fails | keyed with caveat |
| 2024-Q55 | HTTP/FTP/SMTP are application-layer; "NMP" is not a standard protocol | keyed with caveat |
| 2026-Q10 | answer depends on the geometric / negative-binomial counting convention | keyed under the stated convention, both values explained |
| 2026-Q43 | the determinant order in statement II is convention-dependent | keyed, both readings explained |
| 2026-Q73 | textbooks split the absolute-loader functions differently | keyed among the options offered, discrepancy explained |

Every one of these appears with its note in the dashboard, on the Data Audit
screen, and under the question in the PDF.

---

## 3. Strict LaTeX typesetting

`node build/test_katex.mjs` — **22,127 formulas, 0 parse errors**

| | |
|---|---|
| Engine | KaTeX 0.16.22, vendored and **inlined** into `index.html` |
| Formulas in the dataset | 22,127 (22,066 inline, 61 display) |
| Text fields scanned | 19,729, across all 1,470 questions (720 PYQ + 750 forecast) |
| Parse failures | **0** — every formula compiles under `throwOnError` |
| Formulas rendering empty | 0 |
| Embedded math fonts | 20 WOFF2 faces, all loading |
| Network requests during validation | 0 |

Everything is LaTeX, not an approximation of it: the question stems, the four
options, the shared stems, and every Exam Shortcut, Tips & Tricks entry and
Step-by-Step Solution step. `build/mathify.py` converted the explanations from
the ASCII mathematics they were drafted in into real LaTeX — 11,448 formulas
across 604 of the 720 records — using a maximal-expression scanner that only
ever admits identifiers it recognises as mathematical, so prose (`Answer (d).`,
`I/O`, `SSL/TLS`, `ROM/PROM/EPROM`, `(=, +=, -=, ...)`, `New -> Ready ->
Running`, `binary = 2, octal = 8`) is never dragged into math mode. On top of
the scanner sit phrase rules for mathematics no scanner could infer from
punctuation alone:

| Rule | Example in, LaTeX out |
|---|---|
| integrals and sums written in words | `integral from 0 to 1 of` → `\int_{0}^{1}`, `sum xy` → `\sum xy` |
| named distributions, set upright | `Beta(n-1, 2)` → `\text{Beta}(n-1, 2)`, `Exponential(h(x))` → `\text{Exponential}(h(x))` |
| distribution parameters typeset too | `BVN(mu1, mu2, sigma1^2, sigma2^2, rho)` → `\text{BVN}(\mu_{1}, \mu_{2}, \sigma_{1}^{2}, \sigma_{2}^{2}, \rho)` |
| probability of a described event | `P(9th is defective \| above)` → `\operatorname{P}\!\left(\text{9th is defective}\mid\text{above}\right)` |
| operators applied to a modulus | `E\|X_k\|` → `\operatorname{E}\lvert X_{k}\rvert` |
| upright statistical abbreviations | `Sk = 3(Mean - Median)/SD` → `\operatorname{Sk} = 3(\text{Mean} - \text{Median})/\operatorname{SD}` |
| finite-difference operators | `nabla^3 y_5`, `chi-square_3`, `xbar`, `p_hat` → `\nabla^{3} y_{5}`, `\chi^{2}_{3}`, `\bar{x}`, `\hat{p}` |
| products written with x or a dot | `16 x 256 x 16 x 512`, `delta.mu`, `sd(X) . sd(20X)` → `\times`, `\cdot` |
| roots, however written | `sqrt(3/2)`, `sqrt[(1-r12^2)(1-r23^2)]`, `sqrt 2` → `\sqrt{...}` |
| named subscripts | `t_cache`, `rate_X`, `dpi^2` → `t_{\text{cache}}`, `\text{rate}_{X}`, `\text{dpi}^{2}` |

Every formula the converter produced was then re-validated by KaTeX under
`throwOnError`, and the whole answer bank re-passed `build/qc.py` with zero
errors and zero warnings, so the conversion is provably presentation-only.

The same engine typesets the dashboard and the PDFs, so a formula looks
identical in both.

---

## 4. Offline purity

`python3 build/check_offline.py` → **PASSED**

| File | Size |
|---|---|
| `index.html` | 726 KB (includes the inlined KaTeX engine and its 20 math fonts) |
| `questions.js` | 2574 KB |
| `styles.css` | 18 KB |
| `README.txt` | 10 KB |

Statically verified absent from all four files: absolute or protocol-relative
URLs, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`,
`importScripts`, dynamic `import()`, ES-module syntax, `type="module"`,
`@import`, remote `url()`, service workers, an externally loaded MathJax or
KaTeX, jQuery, React, Vue, Bootstrap, Tailwind, Google Fonts, `localhost`,
`require()`, `process.env`, and any font referenced by path rather than
embedded as a `data:` URI. The only external references in `index.html` are
`styles.css` and `questions.js`, both local siblings.

Dynamically verified: the application was driven through every screen with a
Playwright route interceptor aborting anything that is not `file://` — **zero
non-`file://` requests were issued**, and zero console errors were raised.

KaTeX is **vendored**, not fetched: the engine, its stylesheet and all twenty
WOFF2 math faces are embedded in `index.html` as inline `<script>`, inline
`<style>` and `data:` URIs. The checker audits that bundle separately and
confirms it contains no URL, no font path and no network call of any kind
(its only absolute URLs are the two W3C XML namespaces every SVG and MathML
document carries). The count of `@font-face` rules and embedded WOFF2 faces
must match exactly — 20 and 20.

---

## 5. Rendering sweep

`node build/test_render.mjs` — **19,729 text fields across all 1,470
questions** (720 authentic + 750 forecast) rendered inside a 360 px container:

- no leftover LaTeX commands — PASS
- no stray `$` delimiters — PASS
- nothing renders empty — PASS
- nothing overflows a 360 px card — PASS
- no JavaScript errors — PASS

---

## 6. Functional test suite

`node build/test_dashboard.mjs` — **110 assertions, 110 passed, 0 failed**,
driven over `file://`.

| Master-prompt test | Result |
|---|---|
| **A** — no network dependency | zero non-`file://` requests, zero console errors |
| **B** — 2026 Full Mock → Strict Exam | 80 questions, printed order, timer, palette, mark-for-review, nothing revealed, submit confirmation; score / percentage / accuracy / correct / incorrect / unanswered / time all verified against a deliberately planted 25-right-15-wrong-40-blank pattern |
| **C** — 2023 → Probability | length matches the dataset; every question checked to be a 2023 Probability item |
| **C2** — 2023 → Statistical Methods | same, verified question by question |
| **cross-year topic mock** | whole topic pulled across nine papers, every item carries the topic |
| **D** — 2018–2026 → Probability | all 196 present, no duplicates, every id real |
| **E** — Probability → Bayes' Theorem | filter exact, every item carries the concept |
| **F** — mistake bank | wrong answers collected automatically, skipped tracked separately, retry-incorrect and retry-unanswered both start real mocks, bookmarks persist |
| **G** — responsive | no horizontal overflow at 360, 800, 820, 1340 and 1440 px, nor on the exam screen at 360 px; no touch target under 32 px |

Also verified: Learning Mode reveals nothing before an answer and then reveals
the four panes in the fixed order **1 verdict → 2 exam shortcut → 3 tips &
tricks → 4 step-by-step solution**, locking the options afterwards; the same
order holds in review. Keyboard 1–4 / ← / → / M all work. The timer
auto-submits at zero and still produces a scored result. Analytics render unit,
year, topic, subtopic and question-type breakdowns plus the weak-area engine.
Export produces valid JSON and import accepts it back.

---

## 7. The four PDFs

`node build/gen_pdf.mjs` then `python3 build/verify_pdf.py` — **all checks passed**

| PDF | Questions | Topics | Pages | Size |
|---|---|---|---|---|
| `Probability.pdf` | 196 | 13 | 179 | 2.2 MB |
| `Statistical_Methods.pdf` | 164 | 14 | 155 | 1.9 MB |
| `Numerical_Analysis.pdf` | 180 | 8 | 173 | 2.0 MB |
| `Computer_Application_and_Data_Processing.pdf` | 180 | 10 | 177 | 1.9 MB |
| **Total** | **720** | **45** | **684** | |

Verified per PDF, mechanically:

- the text splits into exactly one block per question of that unit — 196/164/180/180
- no duplicated block, none missing, nothing from another unit leaking in
- every block carries the six sections **in the exact required order**:
  QUESTION → OPTIONS → ANSWER → EXAM SHORTCUT → TIPS & TRICKS → STEP-BY-STEP SOLUTION
- the authentic stem is reproduced with **zero characters lost**, compared
  against the renderer's own output, and its prose appears in document order
  (a formula is laid out in two dimensions, so the order in which a text
  extractor emits its glyphs carries no meaning — that is why the two are
  checked separately)
- all four options reproduced with zero characters lost
- the printed answer letter matches the database key for every question
- every block labels its explanations *AI-derived*
- every flagged source defect carries its note; unkeyed items print "Not keyed"
- each syllabus topic forms one contiguous section
- the cover states the provenance and the footer repeats it on every page

---

## 7b. The two forecast PDFs

`node build/gen_forecast_pdf.mjs` then `python3 build/verify_forecast_pdf.py`
— **all checks passed**

| PDF | Questions | Topics | Named mocks | Pages | Size |
|---|---|---|---|---|---|
| `Probability_Forecast.pdf` | 375 | 11 | 15 | 194 | 1.3 MB |
| `Statistical_Methods_Forecast.pdf` | 375 | 13 | 15 | 194 | 1.3 MB |
| **Total** | **750** | **24** | **30** | **388** | |

Verified per PDF, mechanically:

- the text splits into exactly one block per forecast question of that unit — 375/375
- no duplicated block, none missing, nothing from the other unit leaking in
- **no authentic PYQ id appears anywhere in either volume**
- every block carries the four sections **in the exact required order**:
  QUESTION → OPTIONS → ANSWER → EXAM SHORTCUT
- the stem is reproduced with **zero characters lost**, compared against the
  renderer's own output, and its prose appears in document order
- all four options reproduced with zero characters lost
- the printed answer letter and text match the database key for every question
- every block is stamped FORECAST; the cover carries the AI-GENERATED stamp
  and says these are not previous-year questions; the running footer repeats
  the provenance on all 194 pages of each volume
- every named forecast mock for the unit is listed in the contents

---

## 7c. The forecast bank itself

`python3 build/forecast_build.py` — parses `build/forecast/*.txt`, validates,
converts to LaTeX and deals the named mocks.

| | |
|---|---|
| Forecast questions | 750 (Probability 375, Statistical Methods 375) |
| Topics | 24 |
| Concepts | 112 |
| Named mocks | 30, of **exactly 25** questions each |
| Questions left out of every mock | **0** |
| Questions used in more than one mock | **0** |

Every record is rejected at build time unless it has a well-formed id, exactly
four options with no two identical, a key in a–d, an Exam Shortcut, at least
two Tips & Tricks entries, at least two solution steps and a topic and
subtopic. Stems are compared against each other so no question can be
duplicated, and the final solution step must name the keyed option.

Answers were verified rather than transcribed. Where the supplied material
carried a defect it was corrected and the correction is recorded here:

| Item | Defect in the supplied material | What was done |
|---|---|---|
| urn / total-probability item | two options printed the same value (9/15 and 3/5) | option (a) changed to 8/15 so the four options are distinct |
| Poisson parity item | options (c) and (d) were the same quantity, `(1+e^(-2λ))/2` and `e^(-λ)cosh λ` | option (d) changed to `e^(-λ)sinh λ`, which is the odd-parity complement |
| uniform range item | options (a) 2/3 and (d) 4/6 were the same number | option (d) replaced |
| concurrent-deviations item | the stem said "n = 10 pairs" but the key used 9 pairs of deviations | stem restated as 10 observations giving 9 pairs of deviations |

---

## 8. Master-prompt final checklist (§42)

| Item | Evidence |
|---|---|
| All 9 papers processed | reconcile.py, per-year table |
| Actual count reported | 720, calculated from two independent sources |
| Every question has a unique ID | reconcile.py: ids unique and matching |
| No placeholder questions | 0 missing stems; 1 missing option set is a flagged source defect |
| Yearly paper order preserved | test B walks the first five and finds Q1..Q5 in printed order; full papers never shuffle |
| Full mocks work | test B |
| Sectional mocks work | tests C, C2, D |
| Topic mocks work | cross-year topic mock |
| Subtopic mocks work | test E |
| Custom mocks work | test F (length honoured), timer test |
| Strict Exam Mode works | test B, including the no-leak checks |
| Learning Mode works | reveal-order test |
| Timer works | exam-head timer assertions |
| Auto-submit works | clock fast-forward test |
| Mark-for-review works | palette state assertion + keyboard M |
| Scoring works | counts matched a planted answer pattern exactly |
| Percentage works | result KPI assertion |
| Accuracy works | result KPI assertion |
| Unanswered counted | 40 blanks counted as 40 |
| Review works | review pane assertions |
| Exact reveal order works | verified in both Learning Mode and review |
| Analytics work | five breakdowns asserted |
| Weak-area engine works | asserted present with its recommendation |
| Mistake bank works | test F |
| Retry Incorrect works | offered and starts a mock |
| Retry Unanswered works | offered and starts a mock |
| Bookmarks work | round-tripped through local storage |
| Attempt history works | history length asserted after submission |
| Export/import works | JSON round trip |
| Search works | query returns results and can be practised; forecast hits are badged |
| Forecast bank imported and labelled | 750 items, separate array, `isForecast` on every record, FORECAST badge in the UI and on every PDF entry |
| Forecast answers verified | every key re-derived during the build; four defects in the supplied material corrected and recorded |
| Forecast exam shortcut on every item | 750/750, enforced by `build/forecast_build.py` |
| Named forecast sectional mocks | 30 mocks, exactly 25 questions each, no repetition, whole bank covered |
| Forecast PDFs | 2 volumes, 750 questions, QUESTION → OPTIONS → ANSWER → EXAM SHORTCUT |
| No duplicate questions in generated mocks | test D checks all 196 ids |
| Source fidelity preserved | reconcile.py finds zero stem/option drift; PDFs lose zero characters |
| No runtime network dependencies | check_offline.py + live interception |
| No CDN | check_offline.py |
| No external fonts | check_offline.py; system font stacks only |
| No server | opens from `file://` |
| No Python/Node/npm requirement | the four delivered files contain no such reference; the tooling is build-time only |
| `file://` target works | the entire suite runs over `file://` |
| Mobile responsive design works | five viewports, no overflow, no small touch targets |
| Mathematical notation readable offline | 19,729 fields swept; 22,127 formulas compiled by the embedded KaTeX engine with zero parse errors and zero network requests |

---

## 9. Defects found by testing, and fixed

1. **CSS class collision.** The top bar's inner `.bar` element picked up the
   progress-bar utility class, washing out the header. Renamed to `.topline`.
2. **Swallowed click.** The numeric setup fields re-rendered the screen on
   `change`, which fires on blur — i.e. during the mousedown of the next click —
   so the first click on *Start* was lost. Those fields now update in place.
3. **Vacuous responsive test.** `body { overflow-x: hidden }` was hiding real
   overflow and making the layout assertions meaningless. Removed; the layout
   was then verified genuinely clean at 360 px across all 720 questions.
4. **Colliding fractions in the PDF.** Stacked fractions in the options list
   overlapped the `(a)`–`(d)` markers. The options list is now a flex row with
   line height sized for tall mathematics.
5. **Blockquote markers.** Five shared stems carried markdown `>` markers from
   the source booklets and rendered them literally. The renderer now strips
   blockquote markers (safely — mathematics is masked out first).
6. **Fraction baseline.** Fractions sat low against the following text;
   switched to `vertical-align: middle`.
7. **Solution steps split mid-sentence.** 51 solution steps had been written as
   a short continuation line (`= 8/9.`); merged into their preceding step.
8. **Invisible mathematics in the PDF.** Chromium's default `font-display`
   blocks text while a face loads, and `page.pdf()` fired before the embedded
   KaTeX fonts were ready, so every glyph printed blank while the fraction
   rules still drew. Fixed by setting `font-display: swap` on all twenty faces
   and awaiting the full font set before printing.
9. **Colliding option markers, second time.** With real LaTeX the option list
   needed a taller line box again; the flex row was re-tuned.
10. **A long inline formula broke its sentence.** The "give it its own line"
    rule fired on any formula over 90 characters, orphaning the trailing full
    stop. It now applies only to a run with no relation or operator for the
    typesetter to break at — a printed data list, essentially.
11. **Verification method, not the PDF.** pypdf's default extraction mode
    discards KaTeX-positioned glyphs entirely. The content check was moved to
    layout-mode extraction (which keeps them) and the order check to the prose
    around the formulas.
12. **Greek letters typeset as words.** The named-subscript rule fired on
    `sigma_2`, producing an upright `\text{sigma}` and — worse — sealing the
    atom so the following `^2` was orphaned outside the formula. The rule now
    refuses any name the converter already knows as a symbol, and a finished
    atom accepts trailing scripts, so `sigma_2^2` and `ybar^2` typeset whole.
13. **Later rules rewriting finished LaTeX.** A rule meant for `Zi` matched the
    `Sk` inside an already-built `\operatorname{Sk}` and produced
    `\operatorname{S_{k}`, which KaTeX rejected. Substitutions now run only on
    the prose between finished atoms (`sub_free`).
14. **Prose pulled into mathematics.** `a chi-square test` became
    `$a \chi^{2}$ test`, `- a Vandermonde denominator` was read as a
    subtraction, `statement 3's` as a prime, and `(.so / .dll)` as a quotient.
    Articles, prose dashes, apostrophes and file extensions are now excluded
    explicitly, and the Computer-unit explanations were re-read end to end to
    confirm nothing else was affected.
15. **Formulas cut in half.** `2^4 x 2^8` was being split at `4 x 2` by the
    numeric-product rule, `1,440,000 x 80` at the thousands separator, and
    `16 x 256 x 16 x 512.` was rejected outright because of the sentence's full
    stop. All three now typeset as one formula.
16. **Residual ASCII mathematics.** A systematic audit of the explanation
    fields for surviving ASCII notation (`^`, `<=`, `~`, `|x|`, `sqrt(`, bare
    Greek names, `Name(...)` distributions) drove the phrase-rule table above.
    The count of genuine residues fell from 897 to 253, and every one of the
    253 was inspected: they are English prose — the C operator list
    `& | ^ ~ << >>`, pipeline arrows `preprocessor -> compiler -> assembler`,
    definition lists `binary = 2, octal = 8` — which must stay prose.

---

## 10. What is authentic and what is not

- **Questions and options: authentic.** Reproduced verbatim from the nine
  source booklets. Wording, option text, option order and question numbers are
  unaltered. Verified by comparing two independent extractions of the same
  papers, and again by comparing the PDFs against the database.
- **Typesetting: LaTeX throughout.** Every formula, in the questions and in
  the explanations, is LaTeX compiled by KaTeX. The conversion of the
  explanations from ASCII to LaTeX changed only presentation — no answer, no
  step and no numerical value was altered by it, and all 720 records
  re-passed the answer-bank QC afterwards.
- **Answers, exam shortcuts, tips and solutions: AI-derived.** None of the nine
  source booklets carried an official UPSC answer key. Every answer and every
  explanation was worked out for this project and is labelled *AI-derived
  explanation* wherever it appears — in the dashboard, on the PDF cover, in the
  running footer of every PDF page, and on every individual explanation
  section.
- **Synthetic practice questions: none.** All 720 items are real PYQs. Nothing
  has been generated, padded or invented.
- **Marking scheme and paper duration: not official.** The sources did not
  state either, so the application ships configurable defaults (+1 / 0 / 0 and
  1.5 minutes per question) and says on screen that they are not official.
