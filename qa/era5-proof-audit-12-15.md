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
