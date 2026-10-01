# Level-match audit: Era IV, IV.9–IV.11

Files: `/home/claude/up/units/u4_09.js`, `u4_10.js`, `u4_11.js`. Specs: `/home/claude/up/specs/IV.9.json`, `IV.10.json`, `IV.11.json`.
Method: `node dump4.js IV.N 3` for every branch, giving 3 samples of every step a–f. I read all of them against the skill name, the step label and the spec. For every suspect step I also read the generator source and took targeted samples over thousands of seeds.

Scope: 46 skills, 276 steps read (184 a–d steps with 3 samples each, 92 e/f steps with 3 samples each).

Note: dump4's text flattener garbles nested MathML, such as `(x)/(24)` for x²/4, `2^x+3` for 2^(x+3) and `(x)/(2−16x−4)` for (x²−16)/(x−4). It also strips a `<` … `>` pair inside explanations, for example IV.9.17.c. I checked the source for each of these. They are display artifacts of the dump only, not defects in the app.

## Verdicts per branch

**IV.9 Function toolkit: fits well, two fixes.** The 18 skills stay on topic and each ladder climbs: parent → shift → graph → write-from-graph, then symmetry, end behavior, continuity, asymptotes, inverses, composition, models, growth, modulus. The only topic drift was in IV.9.05 (vertical stretch). There the multiplier a = −1 appeared in c and d, which is a pure reflection with no stretch at all. The d prompt even claimed the graph was "stretched or compressed (and flipped)". Fixed.

**IV.10 Polynomial functions: fits well, three fixes.** Degree, end behavior, multiplicity, remainder, factor and rational-root theorems, zeros, inequalities, models and Vieta all match their labels and climb. Fixes:
- IV.10.04.c "flatten at triple" asked about the triple zero only about 1/3 of the time.
- Two explanations needed work: IV.10.14.b had unclear working, and IV.10.02.f had no conclusion.

**IV.11 Rational & radical functions: fits well, three fixes.** Simplifying, operations, complex fractions, equations, extraneous roots, asymptotes, holes, graphing, variation, roots and work problems are all on label and at level. Fixes:
- IV.11.12.c "joint and combined variation" had a third kind that was plain inverse-square variation, which is neither joint nor combined.
- Two explanations were unclear: IV.11.08.d and IV.11.14.d.

## Changes

| Step | Problem | Fix |
|---|---|---|
| IV.9.05.c | For odd n, a could be −1. "−f(x)" is a reflection (IV.9.04), not a stretch or compression. | Replaced −1 with −3 in that pick list (pool size unchanged): `[2, 3, -2, -3]`. |
| IV.9.05.d | Options root a = −1 (y = −√x) and exp a = −1 (y = −2ˣ) are reflections with factor 1, yet the prompt says "stretched or compressed vertically (and flipped)". | root `[-1, 4]` → `[-3, 1]` (y = −3√x, point (1, −3) on screen). exp `[-1, 0]` → `[-2, 0]` (y = −2·2ˣ). Option counts unchanged. |
| IV.10.04.c | Label "flatten at triple", but the zero asked about was uniform over multiplicities 1/2/3. In 2 of 3 samples the answer was "crosses like a straight line". | Asks about the triple zero half the time, otherwise uniform as before. The triple share is now about 2/3, and all cases stay possible. |
| IV.10.14.b | Explanation for the ±√n root pair printed "product = 0 − 2 = −2" (h² shown as a bare number). | Now prints "product = 0² − 2 = −2" and "(−1)² − 10 = −9". |
| IV.10.02.f (★★) | For the "single value / none" asks, the explanation never stated the answer. When the answer was "none" it just stopped. | Adds "So k = p." or "No k makes it go …: none." |
| IV.11.08.d | When the x-coefficient was 1, the explanation read "so x=3 and x = 3". | The intermediate equation is skipped when b = 1. |
| IV.11.12.c | Kind 2 was "y varies inversely with the square of x", which is neither joint nor combined. IV.11.12.d already covers inverse-square word problems. | Kind 2 is now combined: "y varies directly with x and inversely with the square of z". It uses the same k list and adds a second input, so the pool grows. |
| IV.11.14.d | "1/4 + 1/12 = 1/3 of the job per hour, so t = 48/16 = 3": the 48/16 appeared from nowhere, because the fraction is shown reduced. | "…so t = 1 ÷ 1/3 = 3 hours." |

Totals: 8 mismatches found, 8 fixes. Edits touched 2 lines in u4_09, 3 in u4_10 and 5 in u4_11. Backups of the pre-audit files are in the session scratchpad.

## Label changes

None.

## Left alone, and why

- **IV.9.02/03/04, a vs b.** Step a (map a point or intercept, typed) is not obviously easier than b (pick the direction from 4 choices). Both sit at entry level and test different facets that the spec defines (label "f(x)+k" vs "up vs down"). This is not a mismatch, so I didn't reorder.
- **IV.9.11.d "breaks at asymptotes".** It also counts holes, but the prompt says so ("a hole or a vertical asymptote"), and the explanation separates the two. It builds on c (holes).
- **IV.10.04.a "cross at odd multiplicity".** It asks about even zeros half the time. It is a binary cross/touch question, so both cases are needed.
- **IV.10.06.b/c.** They share the same polynomial per seed. c (label the max and min) builds on b (find the turning x-values), so this is a real climb, not a duplicate.
- **Spec-driven overlaps.** IV.11.13.d duplicates IV.9.14.c (inverse of a quadratic piece), and IV.9.10.b/d overlap IV.10.02 (polynomial end behavior). Both follow the spec and are consistent with each other.
- **"2×2^(x+3)".** The exponential coefficient is shown with ×. This is cosmetic and comes from the shared T() helper, used across many steps.
- **Low base rates in the samples.** IV.10.08.b showed 3 "No"s, IV.11.05.d showed 3 "Yes"s and IV.11.06.c showed 2 "neither"s. In the code these are 50%, 50% and 30%, so the samples were coincidence.
- **e/f light pass.** Apart from IV.10.02.f above, the ★/★★ steps read as correct, on topic and harder than d.

## Final checks

```
node harness4.js 300 IV.9.   → generated 32400 questions in 108 steps / no problems
node harness4.js 300 IV.10.  → generated 25200 questions in 84 steps / no problems
node harness4.js 300 IV.11.  → generated 25200 questions in 84 steps / no problems
node test-core.js            → core tests: 124 passed, 0 failed
```
