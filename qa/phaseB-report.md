# Phase B report: no proofs in Eras I–IV, IV.13.11 replaced, Era IV brave steps trimmed

Date: 2026-10-01. Era V files (`up/units/u5_*.js`) and `core4.js` were not touched.

## 1. Proof content removed (label changes)

| Step | Old label | New label | What changed |
|---|---|---|---|
| II.4.11.c | prove with pairs | even or odd: sums and products of many numbers | New generator with 4 variants: 4–6 addends (count the odd ones), 4–5 factors, a×b + c×d, and (a + b)×c. |
| III.8.03.d | informal proof by tearing corners | multi-step missing angles | New generator with 5 variants, all 2-step: B given relative to A, then C; isosceles from a base exterior angle; isosceles exterior from the apex; quadrilateral with two equal angles; base extended both ways. |
| III.8.16.d | explain a visual proof | is it a right triangle? (coordinate or decimal sides) | Decimal sides (triples or near-triples scaled by 0.1/0.2/0.5/1.5), Yes/No; and grid triangles on the plane (count across/up, compare squared sides), as Yes/No or "which corner is the right angle?". |
| III.7.05.b | show they are similar | compare rise ÷ run of two slope triangles | The "why are they similar" choice was a proof argument. It is now: Yes/No "same rise ÷ run?" (computed both), find both ratios, or find the missing rise. |
| III.7.05.d | explain why slope is constant | rise ÷ run from different pairs of points | Both variants asked for a justification. Now: rise ÷ run from P→Q and Q→R; "are these 3 points on one line?" by comparing ratios; and the Ben/Ava error question reworded to "work out both, what is the slope?". |
| IV.3.05.d | prove sides parallel on a grid | check sides are parallel on a grid (compare slopes) | Was already a calculation. Added a 35% variant that asks for both slopes as typed answers. |
| IV.6.16.a | prove an identity by expanding | check an identity by expanding both sides | Label only; the generator was already a mechanical Yes/No check. |
| IV.8.14.d | derive double-angle identities | use De Moivre to find cos 2θ, sin 2θ, cos 3θ or sin 3θ | The "which step of the derivation" choices are gone. Now: cos 2θ / sin 2θ from cos θ, sin θ (triples, including negative cos θ); cos 3θ / sin 3θ from cos θ, sin θ; and exact cos nθ / sin nθ for a given θ. |
| IV.7.10.d | derive it from completing the square | rearrange first, then use the formula | Found by the scan. It asked which step comes next when deriving the formula. Now: rearrange ax² = …, ax² + bx = …, or x(ax + b) = … into standard form (find b and c), or rearrange and solve exactly. This also removes one of the old known LOW_VARIETY steps. |
| IV.13.06.b | derive it by subtracting | sum it by multiplying and subtracting | Found by the scan. Label only; the generator was already a numeric multiply-and-subtract sum. |

Other scan fixes (no label change):
- I.5.11.d "give a counterexample": "Which number/shape proves it wrong?" is now "…breaks the claim?" (4 prompts).
- III.5.15.d "explain with algebra": kept as a "choose the reason" step. Its explanation now says "Testing a few numbers can't show it always works; the algebra does." instead of "can't prove it".

Left alone: correlation/causation lines ("does not prove causation") in III.9, IV.3.09 and IV.15, and "one match doesn't prove they're equivalent" in III.5. These are reasoning or explanation text, not proof tasks. The names of the remainder, factor, rational root, Bayes' and De Moivre's theorems stay; they are applied mechanically.

Spec JSON updated: `IV.3.json`, `IV.6.json`, `IV.7.json`, `IV.8.json` and `IV.13.json`.

## 2. IV.13.11 replacement

IV.13.07 "Sigma notation" already covers all four requested steps: read Σ, expand/evaluate, write a sum in Σ, and properties with the Σk formula (e covers shifted starts). So "Sigma notation in practice" would duplicate it. IV.13.11 is now **"Sums of powers"**:
- a) sum of 1 to n: n(n + 1)/2 (1..n, m..n, and c·k)
- b) sum of squares: n(n + 1)(2n + 1)/6 (1..n in Σ, written out 1² + … + n², and m..n)
- c) sum of cubes: (n(n + 1)/2)² (1..n, Σk and Σk³ together, and m..n)
- d) mix them: Σ(ak² + bk + c) (k(k + 1), (2k − 1)², and general ak² + bk + c)

It has no e/f. The id is unchanged. The new spec has a wrong_turn (mixing up the squares and cubes formulas) and a rule. This uses the sum formulas that the induction skill relied on, mechanically, and gets them ready for V.1.14.

## 3. Era IV brave steps trimmed: **101 of 199 skills keep e/f**

98 skills no longer have e/f, including IV.13.11. Removed with priority on:
- near-repeats: IV.2.12 (repeats IV.1.03), IV.1.05, IV.2.07 (sums of distances again), IV.3.08 (lattice points, same as IV.4.11), IV.9.14 (same as IV.2.15), IV.10.07 (same as IV.6.15), IV.13.10 (Fibonacci strings), IV.13.06 (same as IV.13.08) and IV.6.12 (same as IV.7.08);
- mild Legends;
- vocabulary/reading cores: IV.6.01, IV.8.02/8.03/8.08/8.12, IV.12.08, IV.15.05, IV.2.05, IV.9.16 and IV.13.03.

| Branch | Kept | Skills that keep e/f |
|---|---|---|
| IV.1 | 3 of 5 | 01 Fractions & decimals in equations; 02 Literal equations; 03 Absolute value equations |
| IV.2 | 7 of 15 | 01 Function notation; 02 Evaluate functions; 03 Domain & range; 04 Reading function graphs; 11 Step functions; 13 Combining functions; 14 Composition |
| IV.3 | 5 of 9 | 01 Point-slope form; 02 Standard form; 05 Parallel lines; 06 Perpendicular lines; 07 Intercepts of lines |
| IV.4 | 8 of 15 | 03 Substitution; 04 Elimination; 06 Choosing a method; 07 No or infinite solutions; 11 Systems of inequalities; 12 Linear programming basics; 13 Three-variable systems; 14 Linear–quadratic systems |
| IV.5 | 4 of 7 | 01 Simplify radicals; 04 Rationalize denominators; 05 Rational exponents; 06 Radical equations |
| IV.6 | 8 of 16 | 03 Monomial × polynomial; 05 Special products; 06 Multiply polynomials; 08 Factor by grouping; 11 Difference of squares; 14 Factor completely; 15 Polynomial division; 16 Polynomial identities |
| IV.7 | 8 of 17 | 02 Graph vertex form; 07 Solve by factoring; 08 Completing the square; 09 Vertex form by completing; 10 Quadratic formula; 11 Discriminant; 15 Quadratic inequalities; 16 Write a quadratic from features |
| IV.8 | 8 of 16 | 01 The number i; 04 Add & subtract complex; 05 Multiply complex; 09 Modulus; 13 Multiply & divide in polar; 14 De Moivre's theorem; 15 Roots of complex numbers; 16 Complex loci |
| IV.9 | 9 of 18 | 01 Parent functions; 03 Horizontal shifts; 05 Vertical stretch & compress; 08 Even & odd functions; 09 Symmetry of graphs; 13 One-to-one & inverses on graphs; 15 Composition on graphs & tables; 17 Growth races; 18 Modulus graphs |
| IV.10 | 7 of 14 | 01 Degree & leading coefficient; 04 Behavior at zeros; 06 Turning points; 09 Rational root theorem; 10 Find all zeros; 11 Write a polynomial from zeros; 14 Roots & coefficients |
| IV.11 | 7 of 14 | 02 Multiply & divide rational expressions; 03 Add & subtract rational expressions; 04 Complex fractions; 06 Extraneous solutions; 10 Graph rational functions; 11 Slant asymptotes; 14 Work & rate problems |
| IV.12 | 8 of 17 | 01 Exponential growth; 03 Graph exponentials; 04 Transform exponentials; 07 The number e; 10 Evaluate logs; 13 Graph logs; 14 Solve exponential equations; 15 Solve log equations |
| IV.13 | 7 of 14 | 01 Sequence notation; 04 Recursive vs explicit; 05 Arithmetic series; 07 Sigma notation; 08 Infinite geometric series; 12 Pascal's triangle; 13 Binomial theorem |
| IV.14 | 7 of 12 | 01 Factorials & counting; 02 Permutations; 03 Combinations; 05 Probability by counting; 07 Complements & "at least one"; 08 Independent events; 12 Expected value |
| IV.15 | 5 of 10 | 02 Summary statistics; 03 z-scores; 06 Binomial probabilities; 07 Binomial mean & spread; 08 The normal distribution |

## Checks
- Eras I–III: `node harness.js 20 280` → 776,160 questions, issue summary `{}`, solver agreed on 119,385 of 119,385.
- Era IV: `node harness4.js 300 IV.N.` for N = 1…15 → "no problems" for every branch, except IV.7 with LOW_VARIETY on IV.7.13.c and IV.7.14.d only (IV.7.10.d no longer flags). The info lines add up to 98 skills without brave steps.
- `node test-core.js` → 139 passed, 0 failed.
- I read new steps by eye with dump.js / dump4.js: II.4.11.c, III.7.05.b/d, III.8.03.d, III.8.16.d, IV.3.05.d, IV.7.10.d, IV.8.14.d, IV.13.11.a–d and IV.6.16.e/f.

## Not done here
- `app/mathera.html`, `guide/source.json`, `app/docs/eras-4-7-skills.md` and `rev/*` still quote the old labels, the old IV.13.11 name and "e/f on every Era IV skill". They need a rebuild or edit once the Era V work settles.
