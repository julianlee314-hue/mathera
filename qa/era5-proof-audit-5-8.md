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
