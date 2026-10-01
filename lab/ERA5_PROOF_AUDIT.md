# Brief: Era V proof pass and level-match audit

Era V (*Prove*) is where Mathera introduces proof. Proofs are deliberately absent from Eras I–IV, so Era V must make up for it. The product owner wants **plenty of short, simple proving across all of Era V**, plus full curriculum coverage. You are doing two things for a group of Era V branches, in `/home/claude/up/units/u5_NN.js`.

## 1. Proof pass
Read `/home/claude/up/UNIT_BRIEF.md`, both Era V sections and the toolkit notes. The proof question forms are:
- **ordering**, with `K.orderQ` and deps
- **pick the reason**, using a two-column table with one reason missing
- **find the broken step**
- **which statement follows**
- **complete the proof**: a missing statement offered as choices

The examples are `u5_01.js` (logic and proof) and `u5_03.js` (triangle proofs).

**Goal:** in every branch, at least about a third of the skills have at least one step that is genuinely about proving or justifying. The proofs should be **short and simple**: 3–6 lines, using one or two facts the student just learned. Ways to get there:
- **Steps whose label already invites it** ("why", "theorem", "justify", "show", "prove", "explain"): make sure they use proof formats, not plain recall.
- **Where a skill naturally has a short proof:** give one of its steps a proof-format variant mixed into the step. About 30–50% of its questions should be the proof form, with the label still true. If the label must change to fit, change it and record the change. Natural fits include:
  - circle theorems
  - the parallelogram and quadrilateral properties
  - similarity
  - congruence
  - the trig identity basics
  - coordinate-geometry proofs ("show this quadrilateral is a rhombus" by slopes or distances)
  - transformation properties
  - a construction's justification
- **Keep it honest.** Every order that respects the dependencies must be accepted. Number lines neutrally, and put all the Givens first.
- **Don't break what works.** Keep the variety and the step ladder (a easiest, d hardest).

## 2. Level-match audit
Same bar as `/home/claude/lab/AUDIT_BRIEF.md` (read it). For every step:
- topic fit
- label fit
- the ladder climbs
- right for the era (high school, after algebra)
- correct and clear

Read at least 3 samples per step: `cd /home/claude/up && node dump4.js V.N 3`.

**Brave steps (e/f):** about a quarter of each branch's skills should have them. Check they're real twists, not just bigger numbers.

## Checks
- `cd /home/claude/up && node harness4.js 300 V.N.` must say "no problems" for every branch you touch.
- `node test-core.js` must report 0 failed.
- Render and view any figure you add or change: an HTML page rendered to PNG with Playwright from `/home/claude/app`, then the Read tool.
- Use your own scratchpad subfolder, because other agents share the scratchpad.
- **Edit only your own branches' unit files.** Never edit core4.js.

## Report
Write `/home/claude/qa/era5-proof-audit-<GROUP>.md` with:
- per branch: which skills now carry proof steps, and the audit verdict
- a table of fixes
- every label change

Reply with only:
- the harness lines
- how many skills per branch have proof steps (before → after)
- the label changes
- anything you're unsure about
