# Era V proof pass and level-match audit: V.1–V.4

Files edited: `units/u5_01.js`, `u5_02.js`, `u5_03.js`, `u5_04.js` (no core changes).
Method: read every step's code, read 3 dump samples per step (`dump4.js V.N 3`), plus 3+ samples of every new proof form; proof share measured over 200–400 seeds per step; every new or changed figure rendered with Playwright and viewed.

## Proof-step counts (skills with at least one genuine proving/justifying step)

| Branch | Before | After | Skills that now carry proof steps |
|---|---|---|---|
| V.1 Logic & proof | 7/16 strict-format (nearly every skill is logical justification) | 8/16 strict-format | 1.06 (new), 1.08, 1.09, 1.10, 1.11, 1.12, 1.13, 1.14 |
| V.2 Lines & angles | 4/6 | **6/6** | 2.01 (new), 2.02 (new), 2.03, 2.04, 2.05, 2.06 |
| V.3 Triangles | 9/14 | **12/14** | 3.02, 3.03, 3.04 (new), 3.05–3.11, 3.13 (new), 3.14 (new) |
| V.4 Polygons | 1/9 | **6/9** | 4.02 (new), 4.03, 4.04 (new), 4.05 (new), 4.06 (new), 4.09 (new) |

V.3.12.d ("put the sides in order") is an ordering question but not a proof, so it isn't counted.

## Per-branch: new proof steps and audit verdict

### V.1 Logic & proof: fits well
- **New:** V.1.06.c "deduction from facts". About 37% of its questions are now a 3-line deduction table (Given / Fact 1 / Fact 2) with one reason missing. The distractors are the other fact, "the converse of Fact 1" and "it seems obvious". There are 6 fact chains (quadrilaterals, triangles, numbers, angles).
- **Audit:** topics, labels and ladders fit. The language is right for high school. Answers were checked and all are correct. Minor issues, left alone:
  - 1.12.d "choose the clearest format" includes plain recall ("which format uses a table?"), which is easier than 1.12.c.
  - 1.16.f's generic explanation always says "∀x ∃y" even when the statement is written ∀y ∃x.

### V.2 Lines & angles: fits well, now proof in every skill
- **2.01.b midpoint definition:** about 35% proof questions (order / reason / broken step). Given M is the midpoint of AB, prove 2·AM = AB, or AM = ½·AB. Lines: definition of midpoint → segment addition → substitution → combining like terms → (division).
- **2.01.c solve for x:** about 30% justified-algebra questions (pick the reason / broken step). Lines: midpoint → AM = MB → substitute the expressions → subtraction or addition property → division.
- **2.02.b bisector definition:** about 35% proof questions. The angle version of 2.01.b, using the angle bisector and angle addition.
- **2.02.d linear pair postulate:** about 30% justified-algebra questions. Lines: linear pair postulate → substitution → combining like terms → subtraction or addition property → division.
- **Audit:** no mismatches. The existing proofs in 2.03–2.06 are honest: the Givens are fixed first and independent lines can swap.

### V.3 Triangles: fits well
- **3.04.d third angles theorem:** about 40% questions proving the theorem itself. The 7 lines are: two Givens, triangle sum ×2, substitution, subtraction, definition of congruent angles. The figure shows two similar triangles with two marked angle pairs. Using the "third angles theorem" as a reason is explained as circular.
- **3.13.d coordinate proof:** about 40% proof questions. One form orders a numeric coordinate proof, either MN ∥ YZ by slopes or MN = ½·YZ by distances; the M, N and YZ lines may come in any honest order. The other form is "which statement follows" (MN ∥ YZ and MN = ½·YZ).
- **3.14.a circumcenter:** about 30% proof that the perpendicular bisectors meet at one point. Lines: perpendicular bisector theorem ×2 → transitive property → converse.
- **3.14.b incenter:** about 30% of the same proof for the angle bisectors.
- **Shared proof builder (all V.3 proof steps):**
  - Ordering questions now keep the Givens fixed first, as the toolkit requires. Before, Givens could be shuffled and placed anywhere.
  - Each config can now carry its own wrong-reason list, so broken-step explanations fit the context.
  - "Transitive property" and "substitution" are now treated as synonyms, so neither is offered as a wrong reason when the other is correct.
- **Audit fixes:**
  - 3.09.b "hypotenuse and leg": half of its questions were "which side is the hypotenuse?", which is easier than step a. It is now 30%.
  - 3.14.f: the explanation listed all four centers whatever was asked. It now gives only the facts for the pair asked.
  - 3.10.a: a seed-dependent crash. When the random figure was symmetric, no wrong vertex ordering existed, so `R.pick([])` returned undefined. The step now draws a new figure in that case. This bug was already there before this pass; the harness's 300 seeds never hit it.

### V.4 Polygons: was proof-poor, now 6/9
- **4.02.a always 360°:** about 35% short proof. Lines: linear pair (180° each) → n·180° total → (n−2)·180° interior → subtract to get 360°. Forms: order / reason / broken step.
- **4.02.b walking-around explanation:** about 30% ordering of the walking argument. The "each turn is an exterior angle" line may go anywhere before the conclusion.
- **4.04.b one pair parallel and congruent:** about 35% proof that AD ∥ BC. Lines: alternate interior angles, reflexive property, SAS, CPCTC, converse of alternate interior angles.
- **4.04.c diagonals bisect:** about 35% proof (SAS through vertical angles). It concludes either AB ∥ DC or AB ≅ CD, using either pair of triangles.
- **4.05.a rectangle diagonals congruent:** about 35% SAS proof (all right angles congruent, opposite sides, reflexive property, CPCTC).
- **4.05.b rhombus diagonals perpendicular:** about 35% SSS proof ending with "congruent angles in a linear pair are right angles". The right angle is deliberately left unmarked.
- **4.06.c kite diagonals:** about 35% SSS proof that ∠B ≅ ∠D, or that AC bisects ∠BAD.
- **4.09.c distance for congruent sides:** about 35% numeric "show ABCD is a rhombus" questions. One form completes the proof, choosing the missing side length; distractors are the length without the square root, |dx|+|dy| and |dx−dy|. The other form asks what the steps prove (rhombus, not square or rectangle).
- **4.09.d midpoint for bisecting:** about 35% ordering of a letter-coordinate proof that the diagonals bisect each other (parallelogram, rectangle or rhombus), or that a kite's diagonal bisects the other.
- **Audit fixes:**
  - 4.03.b "opposite angles": about 2/3 of its find-the-angle questions asked for a consecutive angle. The weighting now favors the opposite angle.
- **Audit notes, left alone:**
  - 4.01.c sample 3 (sum → angle) and 4.01.d sample 3 (sum → n) overlap a little, but each matches its label.
  - 4.07 and 4.08 have no natural short proof, so they get no proof variant.

## Table of fixes

| Step | Problem | Fix |
|---|---|---|
| V.1.06.c | no proof format | added deduction pick-the-reason (37%) |
| V.2.01.b, V.2.02.b | no proof format | added midpoint / bisector "whole = 2·half" proof (35%) |
| V.2.01.c, V.2.02.d | no proof format | added justified-algebra reason / broken step (30%) |
| V.3 proofQ (all proof steps) | Givens not fixed in ordering questions | Givens fixed first; accepted orders filtered to match |
| V.3.04.d | no proof format | third angles theorem proof (40%) |
| V.3.09.b | "which side is the hypotenuse" in half the questions, easier than step a | reduced to 30% |
| V.3.10.a | crash on symmetric figures (`R.pick([])`) | draws a new figure until a wrong ordering exists |
| V.3.13.d | "coordinate proof" questions were only computations | ordering + "which statement follows" (40%) |
| V.3.14.a, V.3.14.b | no proof format | concurrency proofs (30% each) |
| V.3.14.f | explanation listed facts unrelated to the pair asked | explanation per pair |
| V.4.02.a, V.4.02.b | no proof format; b's label invites one | linear-pair proof (35%); walking-around ordering (30%) |
| V.4.03.b | label "opposite angles", but mostly consecutive angles asked | weighting now favors opposite angles |
| V.4.04.b, V.4.04.c | no proofs in the "proving parallelograms" skill | SAS/CPCTC proofs (35% each) |
| V.4.05.a, V.4.05.b | no proof format | rectangle SAS proof, rhombus SSS proof (35% each) |
| V.4.06.c | no proof format | kite SSS proof (35%) |
| V.4.09.c, V.4.09.d | conclusions appeared only in explanations | numeric rhombus complete-the-proof / conclusion (35%); ordered midpoint proof (35%) |

## Label changes
None. Every proof variant fits its existing label.

## Brave steps (e/f)
The share is unchanged and on target:

| Branch | Skills with e/f |
|---|---|
| V.1 | 4/16 |
| V.2 | 2/6 |
| V.3 | 4/14 |
| V.4 | 3/9 |

A light read found real twists, not bigger numbers: an auxiliary parallel, a star angle sum, isosceles chains, counting integer triangles, centroid areas, shared polygon sides, an arithmetic sequence of angles, and shaded regions in hexagons.

## Checks
- `node harness4.js 300 V.1.` / `V.2.` / `V.3.` / `V.4.`: no problems (each)
- `node test-core.js`: 139 passed, 0 failed
