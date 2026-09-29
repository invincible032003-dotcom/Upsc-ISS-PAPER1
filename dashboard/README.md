# UPSC ISS Statistics Paper-I — Study & Mock App

One offline HTML file (`dist/UPSC-ISS-Statistics-Study-App.html`, about 7 MB). Open it in Chrome on a
phone or a laptop; nothing is fetched from the network.

## What is inside

| Area | Content |
|---|---|
| **Learn** | 35 notes sections (P1–P13, S1–S14, blueprint, look-right-but-wrong list, P/S fact banks, revise vault, added results) and the 14-section Trap Compendium, all as collapsible groups. Recall mode blurs the bold answers; Traps-only shows just the warnings; every `[2019 Q32]` tag opens that question. |
| **Formulas** | Handbook of 26 laws (discrete, continuous, bivariate normal): PMF/PDF, CDF, quantile, mean, variance, median, mode, skewness, kurtosis, excess kurtosis, moments, MGF, CF, PGF and the results examiners ask. Cards view, cheat-sheet table, recall mode, per-law quiz. Laws in the ISS syllabus that were not in the notes are marked *added*. |
| **Cards** | 835 flashcards generated from every notes/traps table row (481) and every handbook value (354), feeding the same spaced-repetition queue as questions. |
| **Exam** | Blueprint mock (10/20/40 questions weighted by the 2027 forecast), full year papers (80 Q, 120 min) or Probability + Statistical Methods only, 11 mixed notes mocks, drill sets D1–D74, three true/false banks (167 items), 170-question distribution formula mock, weak-area mock. Marking +2.5 / −1/3, 1.5 min per question. |
| **Revise** | Third mode. Due queue (Again / Hard / Good / Easy, intervals 10 min → 60 days), wrong answers, skipped, marked for review, bookmarks, saved notes, and an error ledger by trap class. |
| **More** | Computer chapters, Gupta & Kapoor bank, forecast mocks, search, analytics, history, settings, data audit. |

Question banks: 720 authentic PYQs (2018–2026), 750 forecast items, 444 Gupta & Kapoor problems, 2,053 Computer
questions and 701 notes questions.

## Phone behaviour

* Bottom navigation Home · Learn · Exam · Revise · More (a left rail on wide screens).
* Bottom sheets for session set-up, submit, exit and display settings; the Android back button closes them.
* **Aa** in the app bar: text size, line spacing, density, daily goal, exam date, break reminders, keep-awake.
* Papers autosave; closing the tab or losing the app does not lose your place (resume from Home).
* Time management: daily-goal ring and streak, a daily plan that fits the goal, minutes shown on every session length,
  a pace chip during papers, 5-minute and 1-minute warnings, reading-time estimates.

## Rebuilding

```
python3 tools/build_content.py     # content/notes-*.txt, traps-*.txt  -> src/notes-data.js, traps-data.js
python3 tools/build_banks.py       # content/drills, mocks, T/F, handbook -> src/nb-data.js, dist-data.js
node tools/check_math.js src/notes-data.js src/traps-data.js src/nb-data.js src/dist-data.js
python3 tools/build.py             # patches + modules + data -> dist/UPSC-ISS-Statistics-Study-App.html
```

`src/app.base.js` is the original application, kept unchanged. `tools/patches.py` lists every anchored edit made to it
(the build fails if an anchor moves), and `src/js/m-*.js` are the new modules:

| Module | Role |
|---|---|
| `m-enrich.js` | taxonomy, topic codes, note ↔ PYQ reference index |
| `m-core.js` | icons, display preferences, sheets and history, toast, study clock, spaced repetition |
| `m-notes.js` | notes / traps reader, note search, distribution handbook |
| `m-banks.js` | start sheet, blueprint mock, reveal panes, pace, autosave, result insights |
| `m-cards.js` | flashcards |
| `m-revise.js` | Revise hub, lists, ledger and the revision runner |
| `m-screens.js` | Home, Learn, Topic, Exam hub, More, display sheet |
| `m-shell.js` | app bar, navigation, back button, session bar, click routing |

Answer keys for the notes drills and true/false banks are transcribed from the notes and compendium as printed.
The notes mocks and the formula mock are original questions written from those notes; the handbook formulas were
checked numerically against SciPy.
