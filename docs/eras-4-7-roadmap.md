# Eras IV–VII: what it takes to match Eras I–III
*Written 2026-09-28. The skill list is in `claude/specs/eras-4-7-skills.md`. This is a roadmap only: the plan still finishes Eras I–III first.*

## Where the upper half stands
- **The skills are done:** 722 skills, each with steps a–d.
  - Era IV: 187 skills in 13 units
  - Era V: 175 in 15
  - Era VI: 155 in 10
  - Era VII: 205 in 19
- **The stones are done:** four depths each. Each also has a "not" line (the classic wrong turn), and those are ready-made wrong answers for multiple-choice questions.
- **No questions exist yet** for these eras. The only exception is v0.1's five hand-written Completing the Square skills, which can seed IV.7.

## What's different up here
Eras I–III mostly have single-number answers. Up here the answers are expressions, exact values, sets, graphs and proofs. A keyword pass over the 722 skills gives these rough counts (a skill can fall in several groups):

| Answer type | ≈ skills | Needs |
|---|---|---|
| Exact values (√, π, trig values) | 205 | Math keys (√ π ^ fraction), a live pretty preview, and a checker for exact equality |
| Expressions and polynomials (simplify, factor, derivatives, integrals) | 170 | An equivalence checker: evaluate at many random points. It also needs form rules (factored / expanded / simplest, +C), like the fraction forms in Era II. |
| Graphs to read or choose | 129 | A plotting kit: functions, conics, the unit circle, slope fields, level curves, 3D solids |
| Proof and reasoning | 97 | New question types: put the steps in order, pick the reason, find the broken step |
| Vectors and matrices | 92 | A grid input for vectors and matrices |
| Limits and convergence | 51 | Answers like ∞, −∞ and "does not exist", plus "converges / diverges" choices |
| Intervals and domains | 47 | Interval input, e.g. (−∞, 3] ∪ (5, ∞) |
| Complex numbers | 24 | a + bi input |

## The work, in order (≈ 60–70 runs)
1. **Scope and gap check (2 runs).**
   - Compare the list against AP Calculus AB/BC, college Calculus I–III, a first linear algebra course, a first differential equations course, and the Thai and UK upper-secondary curricula.
   - Flag anything overcomplicated and cut it before any questions are written.
2. **Answer engine v2 (4–5 runs):** the biggest new piece.
   - A math keypad and input with a live, typeset preview.
   - The expression-equivalence checker and form rules.
   - Inputs for sets, intervals, complex numbers, vectors and matrices.
   - The ordering and "pick the reason" question types for proofs.
   - Upgrade all math display to one typeset style, so prompts look like the Stone Library.
3. **Visual kit v2 (2–3 runs):** a function plotter, the unit circle, conics, solids, vector arrows, slope fields and level curves. All would be generated as SVG, like the Era I–III visuals.
4. **Pilot unit (1–2 runs):** build IV.7 Quadratics end to end, from generators through checks and the app. Its job is to prove the new pipeline before scaling.
5. **Generators (≈ 40 runs):** 2,888 steps, about one to two units per run. Every question would be built fresh from a template, with the stones' "not" lines used as wrong answers from day one.
6. **The same audit as Eras I–III (≈ 8 runs, about 2 per era):**
   - The correctness harness, with a new symbolic re-solver
   - The guessable-answer rule
   - The difficulty ladder and variety checks
   - Every step rendered and answered through the page
   - A by-eye read of every step
7. **App (3–4 runs):**
   - Four more trees. Era VII's 19 branches need a taller or two-level tree.
   - Era peak tests.
   - A graphing mode for Calculator v2, and a calculator policy per era.
   - Prerequisites across all 1,111 skills (plan item 2.1).
