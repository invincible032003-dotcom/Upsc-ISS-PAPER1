# UPSC ISS Statistics-I (Objective Type)
## 2018–2026 PYQ → Elite Offline Mock Engine — Final Master Prompt

---

## 0. Your Role

Act as an elite:

- UPSC ISS Statistics examiner
- PYQ data-mining specialist
- Data engineer
- Frontend engineer
- Exam-platform architect
- Mathematical quality-control specialist
- UX designer

I will provide 9 Markdown files containing UPSC ISS Statistics-I Objective Type papers from 2018 through 2026.

Your job is to transform the complete dataset into a professional, high-fidelity, fully offline UPSC ISS Statistics-I examination and practice platform.

**This is NOT merely a quiz webpage.**

Build a complete:

> PYQ DATABASE + CLASSIFICATION ENGINE + MOCK GENERATOR + REALISTIC EXAM ENGINE + LEARNING ENGINE + SCORING ENGINE + REVIEW ENGINE + ANALYTICS + MISTAKE BANK

Do the entire project autonomously.

---

## 1. Autonomous Execution — Important

I am giving you this ONE master prompt and the 9 Markdown files.

- DO NOT ask me to repeat requirements.
- DO NOT ask me for a separate validation prompt.
- DO NOT ask me for a separate mock-generation prompt.
- DO NOT ask me for a separate offline prompt.
- DO NOT stop after creating a prototype.
- DO NOT create placeholders.
- DO NOT fabricate missing questions.
- DO NOT require me to manually trigger each stage.

Automatically execute the complete pipeline described below.

Only stop and ask me something if a required uploaded file is genuinely unavailable, unreadable, or technically inaccessible.

Otherwise continue autonomously until the complete application is built and validated.

---

## 2. Source-of-Truth Rule

The uploaded 2018–2026 papers are the authoritative source for:

- Actual questions
- Wording
- Options
- Question numbering
- Year
- Answer information contained in the source
- Source solutions where provided

The official syllabus included below is the authoritative classification framework.

- NEVER fabricate a PYQ.
- NEVER create placeholder questions.
- NEVER silently alter a UPSC question.
- NEVER silently change an option.
- NEVER silently change the original question order.

If the source contains an apparent typo or ambiguity:

- Preserve the source faithfully
- Flag the issue
- Do not silently rewrite it

If information is absent from the source, use `"null"` or `"Not available in source"` rather than inventing it.

---

## 3. Dataset — 2018 to 2026

Process ALL nine years:

- 2018
- 2019
- 2020
- 2021
- 2022
- 2023
- 2024
- 2025
- 2026

Expected dataset size is approximately 720 questions.

**IMPORTANT:** Do NOT assume there are exactly 720. Actually extract and count every question. Produce:

```
2018: XX
2019: XX
2020: XX
2021: XX
2022: XX
2023: XX
2024: XX
2025: XX
2026: XX

TOTAL: XXX
```

If the real total is not 720, use the real verified total. NEVER invent questions to reach 720.

---

## 4. Official Statistics-I Syllabus

Use the following as the authoritative classification taxonomy.

### Unit I — Probability

- Classical and axiomatic definitions of Probability and consequences
- Law of total probability
- Conditional probability
- Bayes' theorem and applications
- Discrete and continuous random variables
- Distribution functions and properties

Standard discrete and continuous distributions:

- Bernoulli
- Uniform
- Binomial
- Poisson
- Geometric
- Rectangular
- Exponential
- Normal
- Cauchy
- Hypergeometric
- Multinomial
- Laplace
- Negative binomial
- Beta
- Gamma
- Lognormal

Further topics:

- Random vectors
- Joint and marginal distributions
- Conditional distributions
- Distributions of functions of random variables

Modes of convergence:

- In distribution
- In probability
- With probability one
- Mean square

Further topics:

- Mathematical expectation
- Conditional expectation
- Characteristic function
- Moment generating function
- Probability generating function
- Inversion
- Uniqueness
- Continuity theorems
- Borel 0-1 law
- Kolmogorov 0-1 law
- Tchebycheff's inequality
- Kolmogorov's inequality
- Laws of large numbers
- Central limit theorems for independent variables

### Unit II — Statistical Methods

- Collection, compilation and presentation of data
- Charts
- Diagrams
- Histogram
- Frequency distribution

Measures of:

- Location
- Dispersion
- Skewness
- Kurtosis

Further topics:

- Bivariate and multivariate data
- Association
- Contingency
- Curve fitting
- Orthogonal polynomials
- Bivariate normal distribution

Regression:

- Linear
- Polynomial

Further topics:

- Distribution of correlation coefficient
- Partial correlation
- Multiple correlation
- Intraclass correlation
- Correlation ratio
- Standard errors
- Large sample tests

Sampling distributions of:

- Sample mean
- Sample variance
- t
- Chi-square
- F

Further topics:

- Tests of significance based on them
- Small sample tests

Non-parametric tests:

- Goodness of fit
- Sign
- Median
- Run
- Wilcoxon
- Mann-Whitney
- Wald-Wolfowitz
- Kolmogorov-Smirnov

Order statistics:

- Minimum
- Maximum
- Range
- Median

Further topics:

- Concept of asymptotic relative efficiency

### Unit III — Numerical Analysis

Finite differences:

- Δ operator
- E operator
- D operator
- Factorial representation of polynomial
- Separation of symbols
- Subdivision of intervals
- Differences of zero

Interpolation / extrapolation:

- Newton-Gregory forward, equal intervals
- Newton-Gregory backward, equal intervals
- Divided differences
- Properties of divided differences
- Newton divided-difference formula
- Lagrange interpolation for unequal intervals
- Gauss central difference
- Stirling
- Bessel
- Error terms
- Inverse interpolation
- Different methods of inverse interpolation

Numerical integration:

- Trapezoidal
- Simpson one-third
- Simpson three-eighth
- Waddle's rule

Summation of series:

- General term is first difference of a function
- Geometric progression

Numerical differential equations:

- Euler
- Milne
- Picard
- Runge-Kutta

### Unit IV — Computer Application and Data Processing

- Computer basics
- Computer operations
- CPU
- Memory
- ALU
- Input/output units
- Hardware
- Peripherals

Software:

- System software
- Application software
- Packages
- Utilities

Further topics:

- Number systems
- Operating systems
- Low-level languages
- High-level languages
- Compiler
- Assembler

Memory:

- RAM
- ROM
- Bits
- Bytes

Networks:

- LAN
- WAN
- Internet
- Intranet

Security:

- Virus
- Antivirus
- Firewall
- Spyware
- Malware

Programming basics:

- Algorithm
- Flowchart
- Data
- Information
- Database
- Programming languages
- Frontend
- Backend
- Variables
- Control structures
- Arrays
- Functions
- Modules
- Loops
- Conditionals
- Exceptions
- Debugging

---

## 5. Complete Question Extraction

For EVERY question extract:

- Year
- Original question number
- Exact question text
- All options
- Correct answer, if available
- Source solution, if available
- Source shortcut, if available
- Source tips/tricks, if available

Then classify:

- Unit
- Topic
- Subtopic
- Syllabus concept
- Question type

Possible question-type labels include:

- Numerical
- Conceptual
- Theoretical
- Formula-based
- Computational
- Factual
- Definition
- Mixed

A question may have multiple relevant syllabus concepts where genuinely necessary. Do NOT force a wrong classification simply to make the data fit one category.

---

## 6. PYQ Data Structure

Create `questions.js`. It MUST expose `window.quizData = [...]`.

Each question should follow a structure similar to:

```javascript
{
  id: "2026-Q01",
  globalId: 1,

  year: 2026,
  questionNumber: 1,

  unit: "Probability",
  topic: "Conditional Probability",
  subtopic: "Bayes' Theorem",
  syllabusConcept: "Bayes' theorem and applications",

  question: "...",

  options: [
    "...",
    "...",
    "...",
    "..."
  ],

  correctAnswer: 2,

  questionType: "Numerical",

  examShortcut: "...",

  tipsTricks: [
    "...",
    "..."
  ],

  solution: [
    { step: 1, text: "..." },
    { step: 2, text: "..." }
  ],

  sourceYear: 2026,
  sourceQuestionNumber: 1,
  sourceFile: "Statistics-I-2026.md"
}
```

Adapt the structure if necessary, but retain all essential information.

---

## 7. Source Fidelity

- Preserve actual UPSC PYQs.
- Do not rewrite them for style.
- Do not simplify away mathematical information.
- Do not "correct" source wording silently.
- Do not change option order.
- Do not change original question numbers.
- Do not mix questions between years.
- For official yearly mocks, preserve the original sequence.

---

## 8. Solution / Shortcut / Tips Policy

Never pretend an AI-generated explanation is an official UPSC solution.

- If the source provides a solution → preserve its mathematical meaning.
- If the source provides no solution → do not invent an "official solution."
- If you generate an educational explanation, label it **"AI-derived explanation."**
- Likewise for **Exam Shortcut** and **Tips & Tricks.**

Clearly distinguish source-derived information from AI-derived educational material.

---

## 9. Learning Mode — Exact Reveal Order

Learning Mode must reveal answer information in **exactly** this order after the user answers:

1. **Correct / Incorrect** — show the user's selected answer, the correct answer, and correct/incorrect status.
2. **Exam Shortcut** — the fastest useful UPSC-style solving method. Aim for approximately a 30-second strategy when applicable.
3. **Tips & Tricks** — traps, formula recognition, elimination techniques, calculation shortcuts, common mistakes, distractor patterns, memory aids.
4. **Step-by-Step Solution** — the full logical/mathematical reasoning.

NEVER change this order.

---

## 10. Strict Exam Mode

Create a genuine examination mode.

During the exam, hide:

- Correct answer
- Correctness
- Solution
- Shortcut
- Tips

...until submission.

Provide:

- Timer
- Next / previous
- Question navigation
- Question-number grid
- Answered/unanswered indicators
- Mark for review
- Submit button
- Submission confirmation
- Auto-submit when timer expires

The UI must not accidentally reveal the correct answer through styling, labels, source metadata, or option highlighting.

---

## 11. Year-wise Authentic Full Mocks

Provide:

- 2018 Full Mock
- 2019 Full Mock
- 2020 Full Mock
- 2021 Full Mock
- 2022 Full Mock
- 2023 Full Mock
- 2024 Full Mock
- 2025 Full Mock
- 2026 Full Mock

For each authentic yearly mock:

- Use that year's actual PYQs
- Preserve original question order
- Preserve original options
- Preserve original numbering
- Preserve actual question count

Do NOT randomize official paper order.

Example: `2026 → Full Length → Strict Exam` must behave like a 2026 paper simulation.

---

## 12. Sectional Mocks

The platform MUST support sectional mocks.

**Unit-level**

- Probability
- Statistical Methods
- Numerical Analysis
- Computer Application & Data Processing

**Year + Unit** — e.g. `2023 → Probability`, `2023 → Statistical Methods`, `2024 → Numerical Analysis`, `2026 → Computer Application & Data Processing`.

**Cross-year** — e.g. `2018–2026 → Probability`, `2018–2026 → Statistical Methods`, etc.

Only questions actually classified into the selected section should appear.

---

## 13. Topic-wise Mocks

Allow: Unit → Topic → Subtopic → Syllabus Concept.

Examples:

- Probability → Bayes' theorem
- Probability → Normal distribution
- Probability → Characteristic functions
- Statistical Methods → Regression
- Statistical Methods → Correlation
- Statistical Methods → Sampling distributions
- Numerical Analysis → Newton-Gregory
- Numerical Analysis → Numerical integration
- Numerical Analysis → Runge-Kutta
- Computer → Number systems

Generate available topics dynamically from the actual classified dataset. Do not manually invent topic lists disconnected from the data.

---

## 14. Custom Mock Generator

Allow selection of:

- Year(s)
- Unit(s)
- Topic(s)
- Subtopic(s)
- Question count
- Mode
- Question order

Examples:

- "50 questions → Probability → 2018–2026"
- "30 questions → Regression + Correlation"
- "40 questions → Numerical Analysis"
- "25 questions → Computer"

Prevent duplicate questions within a generated mock.

---

## 15. Randomization

For custom practice:

- Optionally randomize question order
- Optionally randomize option order

When options are randomized, update the correct-answer mapping correctly.

For authentic yearly full-paper mode: **NEVER** randomize question order.

---

## 16. Scoring Engine

After every completed mock, automatically calculate:

- Total questions
- Attempted
- Correct
- Incorrect
- Unanswered
- Score
- Percentage
- Accuracy
- Time taken
- Average time per attempted question

Keep marking configuration separate from question data. If a specific marking scheme is defined by the source/configuration, implement it accurately. Do not silently assume a marking scheme.

---

## 17. Post-Submission Result

After submission, display a clear result dashboard, e.g.:

```
Score: 54/80
Percentage: 67.5%

Attempted: 75
Correct: 54
Incorrect: 21
Unanswered: 5

Accuracy: 72%

Time: 1h 48m
Average attempted-question time: ...
```

Then provide complete review.

---

## 18. Question-by-Question Review

For every attempted/unattempted question, show:

- Original question
- Options
- User's answer
- Correct answer
- Status
- Exam Shortcut
- Tips & Tricks
- Step-by-Step Solution

Allow navigation between reviewed questions.

---

## 19. Analytics

Track performance by:

- Overall
- Year
- Unit
- Topic
- Subtopic
- Syllabus concept
- Question type

Example:

| Unit | Accuracy |
|---|---|
| Probability | 82% |
| Statistical Methods | 76% |
| Numerical Analysis | 91% |
| Computer Application | 68% |

Also calculate:

- Strongest unit
- Weakest unit
- Strongest topics
- Weakest topics
- Accuracy trend
- Score trend
- Attempt trend
- Time trend

---

## 20. Weak-Area Engine

Automatically identify weak areas. Example:

- **Weakest topic:** Conditional Probability
- **Accuracy:** 54%
- **Questions attempted:** 24
- **Recommendation:** Practice Conditional Probability PYQs

Provide **"Practice My Weak Areas"** — this should generate a targeted mock from the user's weak areas.

---

## 21. Mistake Bank

Maintain a local incorrect-question bank. Features:

- Practice My Mistakes
- Retry Incorrect
- Retry Unanswered
- Bookmark
- Mark for Review

Questions answered incorrectly should automatically become available in the mistake bank.

---

## 22. Bookmarks

Allow users to bookmark questions. Provide **"My Bookmarks"** with filtering/search.

---

## 23. Attempt History

Store locally:

- Mock name
- Date/time
- Score
- Percentage
- Accuracy
- Correct
- Incorrect
- Unanswered
- Time taken

Display progress across attempts, e.g.:

**2026 Full Mock**
- Attempt 1: 54%
- Attempt 2: 67%
- Attempt 3: 74%

---

## 24. Local Storage

Use browser local storage only. Persist:

- Attempt history
- Bookmarks
- Mistakes
- Settings
- Progress

No backend. No cloud database. No server.

Provide: Export Progress, Import Progress, Reset Progress, Reset History. Export/import should use local JSON files.

---

## 25. Search

Provide fast search across:

- Question text
- Year
- Unit
- Topic
- Subtopic
- Syllabus concept

Examples: "Bayes", "2023", "Regression", "Runge-Kutta".

---

## 26. Question Navigation

Provide:

- Question number grid
- Answered indicator
- Unanswered indicator
- Marked-for-review indicator
- Previous / next
- Jump to question
- Submit

The interface must remain fast with the entire dataset.

---

## 27. Mobile-First UI

Primary targets:

- Samsung Galaxy Tab A9
- iPad/iOS
- Desktop/laptop

Requirements:

- Responsive layout
- Portrait mode
- Landscape mode
- Large touch targets
- Readable text
- Readable mathematical notation
- No horizontal scrolling
- Fast interaction
- Mobile-friendly navigation

Also support desktop keyboard interaction.

---

## 28. Offline-First — Absolute Requirement

This is a 100% offline application. It MUST operate without Internet access.

No:

- CDN
- External API
- External images
- External fonts
- Google Fonts
- External icon libraries
- Tailwind CDN
- Bootstrap CDN
- Online MathJax
- External JavaScript libraries
- Network requests
- Server
- Localhost
- Python
- Node.js
- npm
- Database
- Backend

Everything required must be local. The user must be able to open `index.html` directly. Target `file://` execution.

Do NOT rely on server-side routing. Do NOT rely on runtime network requests. Do NOT rely on ES-module imports that fail under local-file execution.

---

## 29. iOS / iPadOS Compatibility

Design around iOS/iPadOS local-file restrictions.

- The core quiz engine must work from local HTML/CSS/JS.
- Do not rely on `fetch()` for loading the local question database.
- Do not dynamically request external resources.
- Avoid browser APIs that require a server.

The application should remain usable when opened locally through the device's file-management/browser workflow.

---

## 30. File Structure

Create:

```
ISS-Statistics-Mock/
│
├── index.html
├── questions.js
├── styles.css
└── README.txt
```

Keep it portable. The user should be able to copy the entire folder to another device. Opening `index.html` should launch the application.

---

## 31. Mathematical Readability

Mathematics must remain readable offline. Do not depend on online MathJax. Use an offline-safe mathematical representation.

Ensure symbols/formulas such as P(A|B), E(X), Var(X), σ², μ, χ², t, F, Σ, ∫, Δ, E, D remain readable.

Do not allow malformed LaTeX to break the interface.

---

## 32. Validation — Automatic Internal Stage

Validation is mandatory and must happen automatically. Do NOT ask me to trigger it.

Validate:

**Files**
- All nine files found
- All years found
- Files readable

**Counts**
- Questions per year
- Total questions

**Question integrity**
- Unique IDs
- Unique year/question number
- Question text exists
- Options exist
- Correct-answer index valid

**Metadata**
- Valid unit
- Valid topic
- Valid subtopic
- Valid syllabus mapping

**Duplicates** — detect duplicate IDs, duplicate questions, suspicious duplicates across years.

**Missing data** — detect missing options, missing answers, missing solutions, missing shortcuts, missing tips.

**Mathematics** — detect malformed mathematical notation, broken rendering, suspicious expressions.

**Referential integrity** — detect orphan solutions, orphan question IDs, duplicate IDs.

Do not silently modify substantive source data to make validation pass.

---

## 33. Data Audit

Produce an internal validation/audit report:

```
2018: XX
2019: XX
2020: XX
2021: XX
2022: XX
2023: XX
2024: XX
2025: XX
2026: XX

TOTAL: XXX

Duplicates: X
Missing options: X
Missing answers: X
Missing solutions: X
Classification issues: X
Source issues: X
```

If there are problems that can be fixed without altering source data, fix them. If a source problem cannot be safely resolved, preserve the source and flag it.

---

## 34. No-Hallucination Rule

Actual PYQs and AI-generated material must never be confused.

- Official-year mocks contain only actual uploaded PYQs.
- If synthetic practice questions are ever added in the future, label them **"AI-GENERATED PRACTICE."**
- Never mix synthetic questions into official-year PYQ mocks.

---

## 35. Authentic Paper vs Practice Mock

Implement clearly different behaviours:

- **Authentic full paper** — actual paper, actual questions, actual order, actual options.
- **Sectional PYQ mock** — filtered actual PYQs.
- **Topic mock** — filtered actual PYQs.
- **Custom random mock** — user-defined selection.
- **Mistake mock** — previously incorrect questions.

Do not mix these behaviours.

---

## 36. Keyboard Shortcuts

| Key | Action |
|---|---|
| 1 | Select option 1 |
| 2 | Select option 2 |
| 3 | Select option 3 |
| 4 | Select option 4 |
| ← | Previous question |
| → | Next question |
| M | Mark for review |

Do not activate these shortcuts while typing into text inputs.

---

## 37. Accessibility

Provide:

- Readable font sizes
- Sufficient contrast
- Visible focus states
- Keyboard navigation
- Descriptive controls
- Touch-friendly controls

Prioritize clarity over unnecessary visual effects.

---

## 38. Performance

The complete dataset may contain approximately 720 questions.

- Do not render all questions unnecessarily at once.
- Render only what is needed.
- Keep JavaScript lightweight.
- Avoid unnecessary dependencies.

The dashboard should remain responsive on a Samsung Tab A9.

---

## 39. Dashboard

Create a polished home dashboard.

**Home**
- Full Year Mocks
- Sectional Mocks
- Topic Mocks
- Subtopic Mocks
- Custom Mock
- Practice My Mistakes
- Bookmarks
- Analytics
- Attempt History

**Mock setup** — display selected year(s), selected unit, selected topic, selected subtopic, question count, mode, timer, order/randomization settings.

**Exam screen** — display question, options, timer, progress, navigation, mark for review.

**Result screen** — display score, percentage, accuracy, correct, incorrect, unanswered, time, topic performance.

**Review screen** — display user's answer, correct answer, Exam Shortcut, Tips & Tricks, Step-by-Step Solution.

---

## 40. Exam Realism

The interface should feel like a serious competitive examination platform.

Avoid unnecessary animations, decorative clutter, and distracting effects.

Prioritize speed, readability, accuracy, navigation, and exam focus.

---

## 41. Final Offline Test

Before declaring completion, perform the following checks conceptually and through available tooling:

**Test A** — Disable Internet. Open `index.html`. Verify application functionality does not depend on network access.

**Test B** — `2026 Full Mock → Strict Exam`. Verify actual questions, original order, timer, navigation, marking, no answer reveal. Submit and verify score, percentage, accuracy, correct, incorrect, unanswered, time, review, solutions.

**Test C** — `2023 → Probability`. Verify only 2023 Probability questions appear.

**Test D** — `2018–2026 → Probability`. Verify all matching questions appear without duplicates.

**Test E** — `Probability → Bayes' Theorem`. Verify topic filtering works.

**Test F** — Answer questions incorrectly. Open "Practice My Mistakes." Verify those questions appear.

**Test G** — Test Android/tablet responsive layout, iPad/iOS responsive layout, and desktop layout.

---

## 42. Final Quality-Control Checklist

Before delivery verify:

- [ ] All 9 papers processed
- [ ] Actual count reported
- [ ] Every question has a unique ID
- [ ] No placeholder questions
- [ ] Yearly paper order preserved
- [ ] Full mocks work
- [ ] Sectional mocks work
- [ ] Topic mocks work
- [ ] Subtopic mocks work
- [ ] Custom mocks work
- [ ] Strict Exam Mode works
- [ ] Learning Mode works
- [ ] Timer works
- [ ] Auto-submit works
- [ ] Mark-for-review works
- [ ] Scoring works
- [ ] Percentage works
- [ ] Accuracy works
- [ ] Unanswered questions counted
- [ ] Review works
- [ ] Exact reveal order works
- [ ] Analytics work
- [ ] Weak-area engine works
- [ ] Mistake bank works
- [ ] Retry Incorrect works
- [ ] Retry Unanswered works
- [ ] Bookmarks work
- [ ] Attempt history works
- [ ] Export/import works
- [ ] Search works
- [ ] No duplicate questions in generated mocks
- [ ] Source fidelity preserved
- [ ] No runtime network dependencies
- [ ] No CDN
- [ ] No external fonts
- [ ] No server
- [ ] No Python/Node/npm requirement
- [ ] `file://` target works
- [ ] Mobile responsive design works
- [ ] Mathematical notation remains readable offline

---

## 43. Final Deliverable

Create:

```
index.html
questions.js
styles.css
README.txt
```

The final project must be immediately usable. `README.txt` should explain only what is necessary to open the application, use the main modes, export/import progress, and reset data. Do not require technical setup.

The final application must not be a toy prototype. It must contain the complete extracted dataset from the uploaded files.

---

## 44. Final Response After Build

When the complete build is finished, report:

- Files processed
- Questions extracted per year
- Total questions
- Validation results
- Any unresolved source issues
- Files created
- Confirmation of offline architecture
- Confirmation that no server/API/CDN is required
- Major features implemented

Do not ask me to provide another prompt to finish the project.

---

## 45. Core Architecture

Follow this pipeline exactly:

```
UPLOAD 9 PAPERS
  ↓
READ ALL PAPERS
  ↓
EXTRACT EVERY QUESTION
  ↓
VERIFY COUNTS
  ↓
PRESERVE SOURCE FIDELITY
  ↓
CLASSIFY USING OFFICIAL SYLLABUS
  ↓
VALIDATE DATA
  ↓
BUILD QUESTIONS DATABASE
  ↓
BUILD MOCK GENERATOR
  ↓
BUILD AUTHENTIC YEARLY PAPERS
  ↓
BUILD SECTIONAL/TOPIC/SUBTOPIC MOCKS
  ↓
BUILD CUSTOM MOCK ENGINE
  ↓
BUILD STRICT EXAM MODE
  ↓
BUILD LEARNING MODE
  ↓
BUILD SCORING ENGINE
  ↓
BUILD REVIEW ENGINE
  ↓
BUILD ANALYTICS
  ↓
BUILD WEAK-AREA ENGINE
  ↓
BUILD MISTAKE BANK
  ↓
BUILD BOOKMARKS + HISTORY
  ↓
BUILD EXPORT/IMPORT
  ↓
BUILD MOBILE UI
  ↓
TEST OFFLINE
  ↓
FINAL VALIDATION
  ↓
FIX IMPLEMENTATION ISSUES
  ↓
DELIVER COMPLETE APPLICATION
```

**DO NOT SKIP STAGES.**

### Final Principle

- SOURCE ACCURACY > VISUAL POLISH
- OFFLINE RELIABILITY > COMPLEXITY
- ACTUAL PYQs > FABRICATION
- EXAM REALISM > DECORATION

Build the complete UPSC ISS Statistics-I 2018–2026 offline mock platform from the uploaded source files.
