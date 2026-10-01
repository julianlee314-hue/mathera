# Eras IV–VII scope and gap check
*2026-09-28. The list checked is `claude/specs/eras-4-7-skills.md` (722 skills). It was compared with:*
- *UK A level Mathematics, from the DfE subject content*
- *AP Precalculus, AP Calculus AB/BC and US Common Core high school*
- *Thailand's upper-secondary curriculum (M4–M6). This one is from memory; I couldn't find it online.*
- *A standard college Calculus I–III, a first linear algebra course (Lay/Strang-style) and a first differential equations course (Boyce-style)*

## Verdict
The list is strong. Algebra, precalculus, geometry and proof, trigonometry, AP Calculus AB/BC, Calculus III, linear algebra and ODEs are all covered, usually more thoroughly than the course outlines.

There are three kinds of fix:
1. **About 25 duplicates and dated topics to cut.** Most of the duplicates repeat Era III.
2. **About 12 small gaps**, mostly UK A level and Further Maths items.
3. **Two scope decisions** that are yours: high-school statistics and probability, and mechanics.

Nothing has questions yet, so now is the cheapest time to change the list.

## 1 · Cut or merge (25)
### Repeats of Era III (11): Era III already teaches these, and spaced review keeps them alive
| Cut | Already in | Note |
|---|---|---|
| IV.1.01 Multi-step linear equations | III.6.05 | same steps |
| IV.1.02 Variables on both sides | III.6.06 | same steps |
| IV.1.05 Solution types | III.6.06 c–d | no solution / infinitely many |
| IV.1.07 Linear inequalities | III.6.09–10 | the flip rule, graphing |
| IV.3.01 Slope from any source | III.7.04, III.7.03 | |
| IV.3.02 Slope-intercept form | III.7.06 | |
| IV.5.01 Product & quotient rules | III.4.04–05 | III already does variables |
| IV.5.02 Power rules | III.4.06 | |
| IV.5.03 Zero & negative exponents | III.4.05, III.4.07 | |
| IV.5.04 Scientific notation operations | III.4.09 | |
| IV.5.05 Square & cube roots | III.4.11–13 | |

### Repeats inside Eras IV–VII (11)
| Cut | Keep | Move into the kept skill |
|---|---|---|
| IV.3.11 Arithmetic sequences as linear | IV.13.02 | "common difference is slope" as a step |
| VI.9.03 Geometric series | IV.13.08 | "shifted starting index" |
| V.9.03 Radians ↔ degrees | V.8.05 Radians | "common angles by heart" → V.9.05 |
| V.12.04 Circles revisited | V.8.15–16 | tangent lines, circle through three points |
| V.14.07 Volume of spheres | III.8.14 + V.14.03 | "compare with a cylinder" |
| V.1.01 Undefined terms | V.1.02, merged as "Undefined terms & definitions" | |
| VII.15.02 Direction fields again | VI.7.03 | isoclines |
| VII.15.03 Separable equations | VI.7.05 | "lost solutions from dividing" |
| VII.15.08 Autonomous equations | VI.7.11 | bifurcations |
| VII.15.09 Population models | VI.7.06, VI.7.08 | harvesting |
| VII.12.08 Least squares as optimization | VII.8.10–11 | |

### Dated or beyond scope (3)
- **IV.10.11 Descartes' rule of signs** and **IV.10.12 Bounds on roots:** these are no longer in Common Core, AP Precalculus or A level. The change-of-sign idea already lives in VI.1.19 (intermediate value theorem).
- **VII.4.15 Sums & intersections of subspaces:** direct sums are past a first linear algebra course.

### Enrichment → field trips instead of skills (6, proposed)
These are wonderful stories, but they're hard to turn into endless, fair practice questions:
- V.9.17 Waves & sound
- VI.10.17 Series at work
- VII.9.09 SVD at work
- VII.14.19 One big theorem
- VII.14.20 Physics with vector calculus
- VII.19.09 Sound & spectra

They'd become field trips: a story, a video and a picture, with no leaf.

### Replace (1)
- **V.10.08 Product-to-sum → "Harmonic form":** a cos θ + b sin θ = R cos(θ − α). A level requires harmonic form (E6) but not product-to-sum.

## 2 · Add (12)
| Add | Where | Why |
|---|---|---|
| Hyperbolic functions (definitions from eˣ, graphs, identities, derivatives) | VI.2 | UK Further Maths; college Calculus II |
| Inverse hyperbolic functions and their integrals | VI.5 | same |
| Roots and coefficients (Vieta: sum and product of roots) | IV.10 | UK Further Maths; Thai additional maths |
| Modulus graphs y = \|f(x)\| and y = f(\|x\|) | IV.9 | A level B7/B9 |
| Fixed-point iteration xₙ₊₁ = g(xₙ), cobweb and staircase diagrams | VI.3 | A level I2 |
| Complex loci on the Argand diagram (\|z − a\| = r, arg z = θ) | IV.8 | UK Further Maths |
| Proof by induction, full (sums, divisibility, inequalities) | V.1 | Further Maths; IV.13.11 is only a preview |
| Polynomial identities (e.g. x² + y² and Pythagorean triples) | IV.6 | Common Core A-APR.4 |
| Sets, set notation and Venn diagrams | V.1 | Thai M4. It's also the language behind intervals and probability. |
| Quantifiers ("for all", "there exists") and negating them | V.1 | Thai M4; needed for proof |
| Series solutions of ODEs | VII.16 | a standard sophomore ODE topic |
| Cauchy–Euler equations | VII.16 | same |

**Steps to fold in (no new skills):**
- Small-angle approximations → VI.10.06, from A level E2.
- Trig inequalities → V.10.10, from AP Precalculus.

**Net result:** 722 − 25 cut − 6 field trips + 12 added = **703 skills**, before the decisions below.

## 3 · Decisions for Julius
1. **High-school statistics and probability.** This is the one real hole. Era III ends at mean, MAD, box plots, simple probability and two-way tables. A level, Thailand M4–M6 and AP all go further:
   - counting (permutations, combinations)
   - conditional probability, independence and tree diagrams
   - standard deviation
   - expected value
   - the binomial and normal distributions
   - sampling and bias
   - hypothesis tests and confidence intervals
   - correlation
   
   That's roughly **30 skills.** Branch A (Chance) was planned for this. Should it live there, or become new units in Eras IV–VI so it's on the main path?
2. **Mechanics.** A level Mathematics requires it (kinematics, forces, Newton's laws, friction, moments). It's really physics. Calculus already covers motion (VI.3.03, VI.6.01, VI.8.06), so my recommendation is to leave the rest out.
3. **Vectors arrive late.** Thai M5, A level and AP Precalculus teach 2D and 3D vectors in high school, but here they first appear in Era VII. Should the basics (VII.1.01–05, 1.08–09, 1.12) move to a new Era V unit?
4. **Era VII is three courses** (linear algebra, Calculus III, differential equations) on 19 branches, with about 200 skills. That's fine for coverage, but its tree will be crowded. Keep it as one era, or split the tree display into three groves?

## After the decisions
- Apply the changes to the Stone Library (cut, merge, add, move). Write stones for the new skills.
- Renumber once, before any Era IV–VII questions exist. Nothing refers to these IDs yet except the Stone Library.
- Refresh `claude/specs/eras-4-7-skills.md`.

## Sources
- [DfE GCE AS and A level subject content for mathematics](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/516949/GCE_AS_and_A_level_subject_content_for_mathematics_with_appendices.pdf)
- [AP Precalculus course overview](https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-overview.pdf)
