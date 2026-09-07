# Question-Archetype Taxonomy — ISS Statistics Paper I (Computer Application & Data Processing)
Cuts across subtopic: classifies *how* a question is built, not *which* fact it tests. This topic is fundamentally different in kind from the other three — almost every archetype below is recall or classification, not derivation, so the categories reflect *what kind of memory retrieval* is being tested rather than *what mathematical step* is required.

## A. Direct-Recall Archetypes
1. **Single-fact lookup** — "What is X?" with one correct term/definition, no reasoning chain (e.g. which register holds the address of the *next* instruction).
2. **Reverse lookup** — a description is given, name the matching term (e.g. "which technology hides data inside an image?").

## B. Statement-Verification Archetypes
3. **T/F statement-set, "which are correct"** — 2–4 numbered statements about one concept; the answer selects a specific named subset.
4. **"How many of the following" count-style** — same shape as B3, but the answer is a bare count ("only two," "all five") rather than a named subset — no partial-credit shortcut, every statement must be individually checked.

## C. Classification / Matching Archetypes
5. **Category-membership test** — decide whether an item belongs to a named category (input vs. output device; which OSI/TCP-IP layer a protocol sits at).
6. **Odd-one-out** — four items share a property except one; identify the exception (e.g. the one non-raster format among four image types).
7. **Term-to-partner pairing** — match a device/protocol/algorithm to its correct paired concept or canonical use-case.

## D. Computation Archetypes (the numeric minority of this topic)
8. **Base-conversion computation** — binary/octal/decimal/hexadecimal conversion, sometimes with a fractional part.
9. **Signed-representation computation** — 1's/2's complement of a given decimal number in an $n$-bit word.
10. **Capacity/count arithmetic** — multiply out address-line count, storage capacity, or dot-density from stated specifications.

## E. Scenario / Application Archetypes
11. **Real-world vignette recognition** — a short narrative (an email, a purchase, a clinical trial of tech) that *is* a textbook instance of a named concept (a specific malware type, a specific topology) — the "derivation," such as it is, is pattern-matching the story to the term.
12. **Best-choice-for-context** — "which tool/OS/protocol suits this constraint" — a light comparative judgement rather than pure recall, but still resolved by a single distinguishing fact.

## F. Code / Logic-Trace Archetypes
13. **Trace-the-snippet** — a short pseudocode block is given; identify what it computes (e.g. a subtraction loop that computes the GCD) — meant to be recognised instantly, not traced line-by-line.
14. **Well-formedness / validity check** — rules for a valid expression, valid CDF-style construct, or valid instruction sequence — closer to NA's validity-check flavour than to CS's usual recall, the one place the two topics' archetypes brush against each other.

## G. Structural Archetypes
15. **Definitional-boundary / edge-case test** — does a term technically apply at a boundary (is "Deadlock" a formal process state? is ARP really Application-layer despite resolving a link-layer address?).
16. **Reversed / negated framing** — "which of these is NOT…" rather than "which of these IS…" — the identical underlying fact, tested from the opposite direction, which is often enough to catch someone who only memorised the positive form.

---
**Quick tag key:** Rec=A1–A2 · Ver=B3–B4 · Cls=C5–C7 · Comp=D8–D10 · Scn=E11–E12 · Code=F13–F14 · Struct=G15–G16
