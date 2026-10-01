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
# Era V proof pass and level-match audit: V.5–V.8

Scope: `units/u5_05.js` (Similarity), `u5_06.js` (Right-triangle trig), `u5_07.js` (General triangles), `u5_08.js` (Circles).
I read 3 samples of every step (`node dump4.js V.N 3`), 238 steps in all. For every new proof variant I also read extra samples in all three modes (order, reason, broken). I rendered every new or changed figure with Playwright and looked at it.

## Checks
```
V.5: generated 16200 questions in 54 steps — no problems
V.6: generated 19200 questions in 64 steps — no problems
V.7: generated 12600 questions in 42 steps — no problems
V.8: generated 23400 questions in 78 steps — no problems
test-core: order tests done: 139 passed, 0 failed
```

## Skills with proof steps (before → after)

| Branch | Skills | Before | After | Skills carrying proof steps now |
|---|---|---|---|---|
| V.5 Similarity | 12 | 5 | **6** (50%) | 04.d, 05.d, 06.d, **07.a**, 08.c, 09.d |
| V.6 Right-triangle trig | 14 | 0* | **5** (36%) | **02.a, 08.a, 09.a, 11.b, 12.a** |
| V.7 General triangles | 9 | 2 | **3** (33%) | 01.d, **03.a**, 06.b |
| V.8 Circles | 17 | 6 | **9** (53%) | 06.b, 07.d, 08.d, 09.d, **10.a**, 11.d, 13.d, **14.d**, **17.b** |

*Before this pass, V.6.11.b and V.6.12.a each had one "why" multiple-choice question, but no step used a proof format.

Each new variant is mixed into an existing step at 35–40%. It comes as one of three forms: put the steps in order (`K.orderQ`, Givens fixed first, every order that respects the dependencies accepted), pick the reason (two-column table), or find the broken step. Each proof is 5–6 lines and uses the fact the student just learned.

## Per-branch verdict

**V.5 Similarity: fits well.** Topics, labels and ladders match. Every step climbs, from setting up a proportion to proofs and indirect measurement. The proof steps in 04, 05, 06, 08 and 09 were already sound.
- New: 07.a now includes the classic proof of triangle proportionality: DE ∥ BC, corresponding angles, reflexive property, AA, proportional sides, then segment addition gives DB/AD = EC/AE.
- Brave steps are on 04, 09 and 10 (3/12). All three are real twists: the hidden similar pair, the crossing wires, the altitude identity, and areas in a trapezoid.

**V.6 Right-triangle trig: fits well. It had no proofs, and now has five.**
- 02.a (same angle, same ratio): AA → proportional sides → rearrange → the definition of sin/cos/tan, so the ratio depends only on θ.
- 08.a (1 : 1 : √2): equal base angles give equal legs (converse of the isosceles triangle theorem), then Pythagoras, then s√2.
- 09.a (1 : √3 : 2): an equilateral triangle of side 2s, the altitude bisecting the base, then Pythagoras, then s√3.
- 11.b (why it works): the triangle sum gives B = 90° − A, the same leg gives sin A and cos B, then cofunction.
- 12.a (sin² + cos² = 1 from the triangle): Pythagoras ÷ hyp², the definitions, then substitution.
- Other steps were fine. 03.a, 04.a and 05.a ("choose sine/cosine/tangent") deliberately ask "which ratio" questions where the answer is sometimes not the named one. That is discrimination practice and I kept it. 07.a "all sides and angles" includes a "what does solving mean" question, so the label is accurate.
- Brave steps are on 07, 09, 10 and 12 (4/14). All are real twists.

**V.7 General triangles: fits well.**
- New: 03.a (the formula) now includes the coordinate proof of the law of cosines. C is at the origin and A = (b cos C, b sin C). Then the distance formula, the expansion, and sin² + cos² = 1. Triangles lettered XYZ are excluded, because the side x would clash with the x-axis.
- 01.d and 06.b (the derivations) were already proof steps.
- 04.d "plan the full solution" is an ordering of a plan, not a proof. It is fine as is.
- The odd-looking nested fraction in the 03.c explanation is a quirk of the plain-text dump only. The MathML is correct.
- Brave steps are on 02, 03 and 06 (3/9). All are real twists.

**V.8 Circles: fits well.**
- New: 10.a (⊥ from the center bisects a chord). This is the HL proof: right angles, equal radii, a shared leg, then HL, then CPCTC. The figure has dashed radii.
- New: 14.d (power of a point idea). This is the secant–secant proof: inscribed angles on arc AC, a shared angle at P, AA, a proportion, then cross-multiplying.
- New: 17.b (why π is constant). This is an ordering proof: all circles are similar, so a dilation by k scales both d and C, and k cancels.
- The existing proof steps in 06, 07, 08, 09, 11 and 13 are sound.
- Brave steps are on 04, 06, 09, 12 and 14 (5/17). All are real twists: lens areas, regular polygons, an incircle, a tangent cutting off a triangle, and power of a point.

## Fixes

| Step | Problem | Fix |
|---|---|---|
| V.5.07.a | Theorem step with no proof | Added a 6-line proof variant (35%, order/reason/broken) using the existing `proofQ` |
| V.6.02.a | "Same angle, same ratio" was only stated, never proved | Added an AA-similarity proof variant (35%) with a new two-triangle θ figure |
| V.6.08.a | The ratio was recall only | Added a derivation proof variant (35%) |
| V.6.09.a | The ratio was recall only | Added an equilateral-halving proof variant (35%) with a figure |
| V.6.11.b | The "why it works" label had no proof format | Added a 6-line cofunction proof (40%). The step "sin A = cos B" uses the transitive property, so no reason repeats in the table |
| V.6.12.a | One "why" multiple-choice question only | Added a 5-line identity proof (40%). The existing "why" question and the numeric check are kept |
| V.7.03.a | No derivation of the law of cosines | Added a coordinate proof variant (40%) with a new figure (C at the origin, x-axis dashed) |
| V.8.10.a | A circle theorem with no proof | Added an HL proof variant (40%) |
| V.8.14.d | The "power of a point idea" was never justified | Added a secant–secant similar-triangles proof (40%). The figure re-picks lengths so neither secant is cramped |
| V.8.17.b | "Why π is constant" was mostly T/F trivia | Added a dilation ordering proof (40%). The two "dilation multiplies every length" lines are not asked as the hidden reason, because each would give the other away |
| u5_06.js, u5_07.js | No proof helper | Added a local `twoCol` and `proof` helper, matching u5_08.js. Core untouched |

## Label changes
None. Every new variant fits its existing label.

## Left alone
- V.8.17.b still has T/F items such as "π = 3.14 exactly" and "π is irrational". They are about π rather than strictly about *why* it is constant. I kept them so the question pool doesn't shrink, and the new proof variant now carries the label.
- V.7.04.d (ordering a solution plan) and V.6.07.d (checking with Pythagoras) are justification-flavored but not proofs. I did not count them.
# Era V proof pass and level-match audit: V.9–V.11

Files changed: `units/u5_09.js`, `units/u5_10.js`, `units/u5_11.js` (core4.js untouched). Backups of the originals are in my scratchpad (`p911/u5_*.orig.js`).

Checks:
- `node harness4.js 300 V.9.` gives 20400 questions in 68 steps, no problems
- `node harness4.js 300 V.10.` gives 16200 questions in 54 steps, no problems
- `node harness4.js 300 V.11.` gives 12600 questions in 42 steps, no problems
- `node test-core.js` gives 139 passed, 0 failed

I read at least 3 samples of every step (`dump4.js V.N 3`), plus 8–14 extra seeds for every step I changed. I rendered the new and changed figures with Playwright and checked them: 9.03.c, 11.01.a, 11.04.a, 11.04.b and 11.08.b, plus the tables for 9.05.c and 10.11.b.

## Proof coverage (skills with at least one proof or justification step)

| Branch | Before | After | Skills that now carry proof steps |
|---|---|---|---|
| V.9 (15 skills) | 0 | 6 (40%) | 03, 05, 06, 08, 13, 15 |
| V.10 (12 skills) | 3 | 6 (50%) | 02, 04, 07 (already there), plus 05, 06, 11 |
| V.11 (9 skills) | 2 | 4 (44%) | 08, 09 (already there), plus 01, 04 |

Each new proof form is mixed into an existing step, about 35–40% of its questions. The rest of the step's old variety is kept and the step label is still true.

Every proof is 3–6 lines. Givens come first and are fixed. Orderings use `K.orderQ` with honest dependencies, and independent lines are worded neutrally. Each proof uses one or two facts from that skill.

### V.9 Trig functions
- **9.03.c** "why it extends right-triangle trig": a 5-line proof that sin θ (or cos θ) is the y- (or x-)coordinate for acute θ. It uses the right triangle OQP and OP = 1. It comes as an ordering (6 accepted orders) or a pick-the-reason question, with the unit-circle figure.
- **9.05.c** "use to evaluate": find the broken step in a student's reference-angle evaluation. The four possible errors are the quadrant, the reference angle measured to the y-axis, the sign rule, and dropping the sign in the last line.
- **9.06.d** "find all ratios from one": find the broken step in finding the other ratios. The possible errors are using the wrong coordinate for r, r² + x² instead of r² − x², the wrong sign for the quadrant, and tan written as x/y.
- **9.08.d** "how they relate": prove sin θ = cos(θ − π/2) by reflecting in y = x and using that cos is even, or prove sin(θ + π/2) = cos θ by a quarter turn. Each comes as an ordering or a pick-the-reason question.
- **9.13.d** "asymptotes and ranges": prove the range of csc or sec is (−∞, −1] ∪ [1, ∞) from |sin x| ≤ 1 and the reciprocal. It comes as an ordering or a pick-the-reason question.
- **9.15.b** "arcsin(sin x) traps": complete the proof that arc f(f(t)) = t′. The missing line is either the equal-value step or the "in the range" step. The distractors are checked numerically to be false.
- **9.15.d** "algebraic expressions": the triangle-method proof. The lines are: name θ, its range, the triangle, Pythagoras, then read off. The range line is independent, so 3 orders are accepted. It comes as an ordering or a pick-the-reason question.

### V.10 Identities and equations
- **10.05.c** "tan(A ± B)": derive tan(A ± B) from the sine and cosine formulas. It comes as an ordering, a pick-the-reason question, or a broken step (the wrong middle sign in cos, dividing the wrong pairs, or the wrong denominator sign). Letters vary: A/B, x/y, α/β.
- **10.06.b** "three forms of cos 2A": derive 2cos² − 1 or 1 − 2sin² from cos² − sin². It comes as a pick-the-reason question, a complete-the-proof question (the missing middle line), or a broken step.
- **10.11.b** "factor": find the broken step in a factor-and-solve solution. The possible errors are a wrong factor sign, the wrong value after the zero-product step, a lost root of f x = 0, and the quadrants for g x = v. All the solution lists come from the solver.

### V.11 Coordinate geometry
- **11.01.a** "derive from Pythagoras": either the general derivation of the distance formula with x₁, y₁, x₂, y₂, or the same proof with the question's numbers and a labeled corner. It comes as an ordering (the legs and the Pythagoras line are independent) or a pick-the-reason question.
- **11.04.a** "prove parallel sides": prove a quadrilateral is a trapezoid by slopes: one pair equal and the other pair different. It comes as an ordering or a pick-the-reason question. Sliver-thin trapezoids are excluded.
- **11.04.b** "prove perpendicular sides": prove a right angle by slopes: two slopes, their product is −1, so the sides are perpendicular and the angle is 90°. It comes as an ordering or a pick-the-reason question.
- **11.08.b** "parallelogram test": a "which conclusion follows" question from four slopes. There is a parallelogram case and a not-parallelogram case. Both use the same four options and are balanced 50/50. Rectangles are excluded so the "rectangle" distractor is cleanly wrong.

## Level-match audit verdicts

**V.9: fits well.** Topics, labels and ladders are right, the level suits high school after algebra, and the answers are correct. One label-fit problem was found and fixed: in 9.13.d one third of the questions asked for the period of csc/sec/cot(Bx), which is not "asymptotes and ranges". They now list the asymptotes on [0, π] or [0, 2π].
- Brave steps are on 04, 09, 10 and 15 (4 of 15). All are real twists: pairing cofunctions, counting solutions, the period of a sum, rewriting a sign as a phase shift, and mixed inverse compositions.

**V.10: fits well.** All steps match their labels and the ladders climb.
- 10.09.d "check" is a little loose: half of it is "find the other solution" rather than a check. I left it because it is the same quadrant-rule check in a different form, and it is not wrong.
- Brave steps are on 04, 05 and 11 (3 of 12). 10.04.e "longer proofs" is mostly the same task with more lines, but 6–7-line identity proofs are a genuine step up. The other e/f steps are real twists.

**V.11: fits well, with two label-fit gaps now closed.**
- 11.04.a "prove parallel sides" and 11.04.b "prove perpendicular sides" only computed slopes or asked yes/no. They now carry real proofs.
- 11.01.a "derive" only computed the legs and then the length. It now also has a real derivation.
- A small clarity fix in 11.04.d: the explanation "1 × −1" now reads "1 × (−1)".
- Brave steps are on 05, 06 and 07 (3 of 9). All are real twists: equidistant points, centers without the triangle, running it backwards, Pick's theorem, and squares between parallel lines.

## Table of fixes

| Step | Problem | Fix |
|---|---|---|
| V.9.03.c | A "why" label answered by recall-style choices only | Added a proof that the unit-circle definition agrees with the right triangle (ordering or pick the reason), 40% of the step |
| V.9.05.c | No justification | Added find-the-broken-step in a reference-angle evaluation, 40% |
| V.9.06.d | No justification | Added find-the-broken-step in finding all ratios from one, 35% |
| V.9.08.d | No proof of the graph relation | Added a cofunction/shift proof (2 templates; ordering or pick the reason), 40% |
| V.9.13.d | One third of the questions asked for a period, which is off-label | Changed that variant to listing the asymptotes of csc/sec/cot(Bx); added a range proof (ordering or pick the reason), 35% |
| V.9.15.b | No justification | Added complete-the-proof for arc f(f(t)), 40% |
| V.9.15.d | No justification | Added the triangle-method proof (ordering or pick the reason), 40% |
| V.10.05.c | No derivation | Added the tan(A ± B) derivation (ordering, reason or broken step), 35% |
| V.10.06.b | No derivation | Added the derivation of the cos 2A forms (reason, complete the proof or broken step), 35% |
| V.10.11.b | No justification | Added find-the-broken-step in a factor-and-solve solution, 35% |
| V.11.01.a | A "derive" label answered by computation only | Added the distance-formula derivation, general or with numbers (ordering or reason), 35% |
| V.11.04.a | A "prove" label answered by computation only | Added a trapezoid proof by slopes (ordering or reason), 40% |
| V.11.04.b | A "prove" label answered by yes/no only | Added a right-angle proof by slopes (ordering or reason), 40% |
| V.11.04.d | "1 × −1" in the explanation | Negative second factor now in parentheses |
| V.11.08.b | Midpoint test only | Added "which conclusion follows" from slopes, 35% |

The u5_09 wrapper now also escapes `<` and `>` inside ordering items, as u5_10 already did. I added small helpers inside each unit file (`proofQ`, `twoCol`, `stepTbl`, `brokenQ`, `negS`, `fatTrap`). There are no new core functions.

## Label changes

None.

## Left alone
- V.10.09.d "check": see above.
- The figure helper `plane` in u5_11 sometimes puts a point label next to an axis number, for example "M" by "−4". This is pre-existing shared helper behavior. It is still readable, so I did not restyle it.
- In 9.03.c the unit-circle figure labels P but not O or Q. The prompt defines both ("O is the origin", "Q is where the vertical dashed line meets the x-axis").
# Era V proof pass and level-match audit: V.12 to V.15

Scope: `units/u5_12.js` (conics), `u5_13.js` (transformations), `u5_14.js` (solids), `u5_15.js` (constructions). Only these four files were edited.

Method:
- Read every step's code.
- Read the 3-sample dump for every step (`node dump4.js V.N 3`), plus 8 to 12 extra samples of every step I changed.
- Rendered every new or changed figure with Playwright and viewed the PNG.

Proof forms used: ordering with `K.orderQ` (Givens fixed first, every dependency-respecting order accepted), pick the reason (a two-column table with one reason hidden), complete the proof / which statement follows, and find the broken step.

## Skills with proof steps (before → after)

| Branch | Before | After | Skills that now carry proof steps |
|---|---|---|---|
| V.12 Conics (11 skills) | 1 | 5 | 02.b (already there), **04.a, 06.a, 08.b, 11.b** |
| V.13 Transformations (12) | 2 | 6 | **01.c, 03.a, 04.d, 08.d**, 09.c/d and 10.c/d (already there) |
| V.14 Solids (8) | 0 | 3 | **03.d, 04.b, 06.a** |
| V.15 Constructions (9) | 8 | 9 | 01 to 08 "justify" steps (already there), **09.a**; 07.d strengthened |

### What each new proof variant is
In every new variant the step label still holds. Proof forms make up about 30 to 45% of each step's questions.

**V.12**
- **V.12.04.a** sum of distances to foci: proves that the constant PF₁ + PF₂ equals the major axis. It reads the sum off at a vertex, (a + c) + (a − c) = 2a. Ordering, or complete the proof (a missing statement offered as choices).
- **V.12.06.a** c² = a² − b²: B is the end of the minor axis, so BF₁ = BF₂ and BF₁ + BF₂ = 2a, which gives BF₂ = a. Pythagoras in △OBF₂ then gives c. Ordering, or pick the reason. It has a new figure: the ellipse with O, F₁, F₂, B and the focal triangle.
- **V.12.08.b** the central box: proves the box corners are as far from the center as the foci, since √(a² + b²) = c. Ordering.
- **V.12.11.b** two conics: find the broken step in a worked circle-and-parabola solution. The planted error is one of:
  - a sign error when substituting
  - a wrong factorization
  - y = ±y² instead of ±√
  - a miscount of the points

**V.13**
- **V.13.01.c** what is preserved: a rigid motion keeps distances, so SSS holds, so it keeps angles by CPCTC. Ordering, or pick the reason.
- **V.13.03.a** perpendicular bisector definition: a point Q on the mirror is as far from P as from P′, by SAS and then CPCTC. Ordering, or pick the reason. New figure.
- **V.13.04.d** find the center: CA = CA′ because a rotation keeps distances from its center. By the converse of the perpendicular bisector theorem, C is on both bisectors. Ordering, or pick the reason. Not used for 180° turns.
- **V.13.08.d** lines map to parallel lines: a slope proof with concrete points, where the factor k cancels. Ordering, or complete the proof. The choices for the missing image points use the common wrong rules (translation, stretching one coordinate only, and so on). The choices for the missing conclusion include "the slope is multiplied by k".

**V.14**
- **V.14.03.d** sphere from a cylinder minus a cone: the full Cavalieri argument. At height y both slices have area π(r² − y²), so the solids have equal volume, so the hemisphere is ⅔πr³. Ordering, or pick the reason.
- **V.14.04.b** lateral area: derives πrℓ from the net. The arc equals 2πr, so the sector is r/ℓ of the full circle, so its area is (r/ℓ)·πℓ². Ordering, or complete the proof.
- **V.14.06.a** one third of the prism: six pyramids from the center fill a cube, each with base s² and height s/2. Ordering, or "which conclusion follows". The distractor ⅙Bh tests the classic confusion: the pyramid is a sixth of the cube but a third of its own prism. New figure.

**V.15**
- **V.15.09.a** circumcenter construction: OA = OB and OB = OC from the perpendicular bisector theorem, then OA = OC by the transitive property. So O is on the third bisector, and the circle through A passes through B and C. Ordering, or pick the reason.
- **V.15.07.d** justify: added an ordering proof:
  1. Radii, so the diagonals bisect each other.
  2. Diameters, so the diagonals are equal.
  3. So it is a rectangle.
  4. Perpendicular diagonals, so it is a square.

## Audit verdicts (level match)

- **V.12 Conics: fits well.** The topics, labels and the high-school level are right, and the answers and explanations are correct. One ladder problem: V.12.02.d (the value of p) was easier than V.12.02.c, because it read p straight off standard form. Fixed, see below. Brave steps are on 02, 06 and 11 (3 of 11), and all are real twists:
  - the focal-distance shortcut and focal chords
  - running it backwards and the focal triangle
  - a tangency parameter and a parameter that decides the count
- **V.13 Transformations: fits well.** One correctness bug in V.13.04.d, fixed. V.13.02 (vectors) and V.13.07 (symmetry counts) sit at the easy end for high school, but they follow the spec, so I left them. Brave steps are on 04, 05 and 08 (3 of 12), all real twists: composing to one turn or one dilation, running backwards, and many reflections.
- **V.14 Solids: fits well.** Fixed the article grammar ("a 8 cm"). Brave steps are on 06 and 07 (2 of 8): similar-solid scaling, pyramids inside a cube, melt and recast, and counting faces.
- **V.15 Constructions: fits well.** The justify steps were already proof-based. Fixed a giveaway in the pick-the-reason tables for 02.d and 04.d. Brave steps are on 06, 08 and 09 (3 of 9).

## Table of fixes

| Step | Problem | Fix |
|---|---|---|
| V.12.02.d | The ladder dipped: kind 0 asked for p from standard form, which is easier than step c. | Kind 0 now gives the parabola solved for y (or x), e.g. y = −(x − 5)²/12 + 2. The student rearranges to (x − h)² = 4p(y − k) first. |
| V.12.11.b | The explanation showed "±√9"-style surds. | Shows the simplified ±value. |
| V.13.04.d | The generator could put A, B and the center on one line. The two perpendicular bisectors then coincide, so the center is not determined, yet the explanation said they "meet at (h, k)". | Added a non-collinear guard to the loop. |
| V.14.03.b, 06.b, 06.d, 07.a, 08.d | "a 8 cm …", "a 11 cm …" | Added an `an()` helper: "an 8 cm …". |
| V.15.02.d (and the shared `pbPick` used by 04.d) | Pick the reason could hide a reason that another visible row repeats ("same compass width" ×2, or CPCTC also shown in row 7), which gave the answer away. | The hidden row is now always one whose reason no other row shows. |
| All new proofs | — | Proofs are 3 to 6 lines plus the Given. Ordering uses `K.orderQ`, so every order that respects the dependencies is accepted. Lines are worded neutrally, and the Givens are fixed first. In the pick-the-reason tables, repeated reasons are merged into one row so a shown reason never reveals the hidden one. |
| V.12.06.a, 12.04.a, 13.01.c, 13.03.a, 13.04.d, 13.08.d, 14.03.d, 14.04.b, 14.06.a, 15.07.d, 15.09.a | Too few proof steps. | Added proof variants (see above). |

## Label changes
None.

## Left alone
- V.12.03.a/b overlap with V.12.02.c (finding the focus and directrix). The ladder still climbs, and the spec puts it there.
- V.12.01.c (parabola) gives a non-parabola answer 45% of the time. That is deliberate discrimination near the parabola angle, and the label still fits.
- V.13.07.a/b: symmetry counts are easy for high school. Left as the spec intends.
- In find-the-broken-step questions, the lines after the planted error stay true facts but may no longer follow from the broken line. This is the same convention as u5_03.

## Checks
- `node harness4.js 300 V.12.` / `V.13.` / `V.14.` / `V.15.`: "no problems" for all four.
- `node test-core.js`: 139 passed, 0 failed.
- Figures viewed:
  - V.12: 06.a ellipse proof, 02.d MathML, 11.b table
  - V.13: 03.a mirror proof, 04.d
  - V.14: 03.d, 04.b, 06.a cube
  - V.15: 09.a circumcircle, 07.d square
