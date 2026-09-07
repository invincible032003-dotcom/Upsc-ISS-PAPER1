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

echo "### 1/9  extract and cross-validate the PYQs"
python3 build/extract.py

echo "### 2/9  QC the answer bank and write merged.json + DATA-AUDIT.txt"
python3 build/qc.py > /dev/null
tail -n 8 DATA-AUDIT.txt

echo "### 3/9  mine per-topic examiner intelligence"
python3 build/topicintel.py | head -n 3

echo "### 4/9  derive syllabus-concept subtopics"
python3 build/subtopics.py | head -n 6

echo "### 5/9  generate questions.js"
python3 build/gen_questions.py

echo "### 6/9  static offline-purity check on the four delivered files"
python3 build/check_offline.py

echo "### 7/9  render sweep over all 720 questions"
node build/test_render.mjs

echo "### 8/9  functional test suite over file://"
node build/test_dashboard.mjs

echo "### 9/9  build the four PDFs and verify them"
node build/gen_pdf.mjs
node build/dump_rendered.mjs
python3 build/verify_pdf.py
python3 build/reconcile.py

echo
echo "ALL STAGES COMPLETE."
