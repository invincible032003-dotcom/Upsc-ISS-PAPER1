#!/bin/sh
# Rebuild and re-validate the whole project from the source files.
#
# This is BUILD-TIME tooling.  The delivered application (index.html,
# questions.js, styles.css, README.txt) needs none of it: it is opened by
# double-clicking index.html, with no Python, no Node, no npm and no server.
#
#   sh build/run_all.sh
set -e
cd "$(dirname "$0")/.."

echo "### 1/13  extract and cross-validate the PYQs"
python3 build/extract.py

echo "### 2/13  convert the explanation mathematics to LaTeX (idempotent)"
python3 build/mathify.py

echo "### 3/13  QC the answer bank, write merged.json and DATA-AUDIT.txt"
python3 build/qc.py > /dev/null
tail -n 6 DATA-AUDIT.txt

echo "### 4/13  mine per-topic examiner intelligence"
python3 build/topicintel.py > build/.topicintel.log
head -n 2 build/.topicintel.log

echo "### 5/13  derive syllabus-concept subtopics"
python3 build/subtopics.py > build/.subtopics.log
head -n 5 build/.subtopics.log

echo "### 6/13  build the AI-generated 2027 forecast bank and its named mocks"
python3 build/forecast_build.py

echo "### 7/13  generate questions.js (PYQ bank + separate forecast bank)"
python3 build/gen_questions.py

echo "### 8/13  inline the KaTeX bundle into index.html"
python3 build/vendor_katex.py

echo "### 9/13  static offline-purity check on the four delivered files"
python3 build/check_offline.py

echo "### 10/13  strict-LaTeX validation of every formula"
node build/test_katex.mjs

echo "### 11/13  render sweep + functional suite over file://"
node build/test_render.mjs
node build/test_dashboard.mjs

echo "### 12/13  build the four PYQ PDFs and verify them"
node build/gen_pdf.mjs
node build/dump_rendered.mjs
python3 build/verify_pdf.py

echo "### 13/13  build the two forecast PDFs, verify them, reconcile everything"
node build/gen_forecast_pdf.mjs
node build/dump_forecast_rendered.mjs
python3 build/verify_forecast_pdf.py
python3 build/reconcile.py

echo
echo "ALL STAGES COMPLETE."
