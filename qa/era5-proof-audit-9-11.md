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
