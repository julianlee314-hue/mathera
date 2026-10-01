# Level-match audit: Era IV, branches IV.5–IV.8

Scope: `/home/claude/up/units/u4_05.js` to `u4_08.js` (checked against `specs/IV.5.json` to `IV.8.json`).
I read 3 samples of every step (a–f) with `dump4.js … 3`. Then I bulk-sampled 200 seeds per step and checked them for notation slips, answer balance and variety. After each edit I re-sampled the step I changed.

| | IV.5 | IV.6 | IV.7 | IV.8 | total |
|---|---|---|---|---|---|
| skills | 7 | 16 | 17 | 16 | 56 |
| a–d steps read | 28 | 64 | 68 | 64 | 224 |
| e/f steps read | 14 | 32 | 34 | 32 | 112 |

**Totals:** 14 problems found and 14 fixes made. 6 of them are fit or correctness problems. The other 8 are wording or explanation fixes. **No label changes.**

## Verdict per branch

- **IV.5 Exponents & radicals:** Fits well. Every step matches its label and the ladders climb (a pull out squares → b variables → c cube roots → d nth roots, and so on). Two explanations were tidied (5.03.b, 5.05.d).
- **IV.6 Polynomials:** Fits well. All 16 ladders climb cleanly, and the vocabulary, factoring and division steps match their labels. I fixed one wording slip in a brave step (6.15.e).
- **IV.7 Quadratics:** Mostly good, but **IV.7.12.a was off**:
  - Its label is "square roots when no b", but only half of its items were square-root items.
  - It picked from fixed coefficient lists that produced wrong answers:
    - x² + 7x − 6 and x² − 5x + 12 were marked "factoring", but one doesn't factor and the other has no real roots.
    - 2x² + 7x + 3 and 3x² + x − 4 were marked "formula", but both factor.
  - IV.7.12.d had the same flaw: 2x² + 5x − 3 was marked "won't factor nicely", but it factors as (2x − 1)(x + 3).
  - IV.7.07 had degenerate items: "Rewrite x² − 2x = 0 so the right side is 0" and "Solve (3x+0)(x+1) = 0".
  - The rest of IV.7 fits well.
- **IV.8 Complex numbers:** Fits well. One explanation was wrong as written: in 8.06.d, "−2² + −2² = 8" reads as −8, so I added brackets. The polar form, De Moivre, roots and loci steps (8.12–8.16) are precalculus level. They follow the spec, so I kept them.

## Changes

| Step | Problem | Fix |
|---|---|---|
| IV.7.12.a | Label is "square roots when no b", but the generator mixed three methods. It also produced wrong answers: non-factoring or non-real quadratics marked "factoring", and factorable ones marked "formula". | Rewrote the generator to match the label. It now asks: "Can you solve … just by isolating the square and taking ± square roots?" (Yes/No, balanced 50/50). Yes items: ax² + c = d, (x − h)² = k and a(x − h)² + c = d. No items: random x² + bx + c = 0 or x² + bx = k, with b ≠ 0 and never a perfect square. Explanations name the bx term. The pool is larger than before, since the old version drew from fixed lists. |
| IV.7.12.d | The "quadratic formula" item could have a perfect-square discriminant. Example: 2x² + 5x − 3 was marked "won't factor nicely", and "it factors" was arguably the right answer. | Re-pick A, B, C until b² − 4ac is not a perfect square. The explanation now always says "not a perfect square, so it won't factor". |
| IV.7.07.a | When c = 0 the prompt was "Rewrite x² − 2x = 0 so the right side is 0", which is already true. | When c = 0 it now asks about x² = 2x (move the x-term). The pool is unchanged. |
| IV.7.07.c | Prompts like "(3x+0)(x+1) = 0", and equal roots were possible, e.g. (x+2)(2x+4). | A factor with no constant is written bare and placed first (2x(x+1) = 0). Pairs with equal roots are re-picked. |
| IV.7.07.d | The explanation wrote "−6² − 2·(−6) + 0". −6² reads as −36. There were also clutter terms like "1·(1)" and "+ 0". | Negatives get brackets, (−6)². Zero terms are dropped, and "1·" is dropped. |
| IV.7.09.d | h = 0 gave "Find the vertex of y = −x² − 8 by completing the square", with no x-term to complete. | h is now nonzero. This removes only the trivial b = 0 items (about 1 in 11); every item left has a square to complete. |
| IV.7.05.b | The explanation read "Multiply the brackets, then out:" when a = 1. | Now reads "Multiply out the brackets", with ", then multiply by a" when a ≠ 1. |
| IV.7.05.c | When one root is 0 (e.g. x² − 2x), the explanation said "Two numbers with product 0 and sum −2". | Now says "Every term has a factor of x (or 2x), so take it out: …". |
| IV.7.11.b | "The discriminant is 0, zero, so there is one repeated solution." | Now reads "The discriminant is 0, so there is one repeated solution." |
| IV.7.03.b | The explanation showed "1(0)² + 0(0) − 7". | Zero terms are dropped and a = ±1 is shown cleanly, e.g. "−2(0)² − 4 = −4". |
| IV.5.03.b | The explanation read "3√15 − 15√3 = 3√15 − 15√3". | Now reads "…, which is already simplest" when nothing changes. |
| IV.5.05.d | "3/5 × −2/5" | Now "3/5 × (−2/5)". |
| IV.8.06.d | "Product: −2² + −2² = 8". As written this equals −8. | Negatives get brackets: "(−2)² + (−2)² = 8". |
| IV.6.15.e (★) | "… + 0 − 6. It must be 0, so 1k = 5 and k = 5." | The zero term is dropped, and it reads "so k = 5" when r² = 1. |

## Label changes

None. Every step label still matches its spec text, and every fix was made in the generator.

## Left alone, and why

- **IV.7.08.c and IV.7.09 overlap:** both are vertex form by completing the square with a ≠ 1. The spec defines them as separate skills, and the IV.7.09 steps break the process into parts (group, balance, read), so the overlap is intended.
- **IV.7.04.c ("direction from a"):** it sometimes shows a repeated-root form such as −3(x − 3)². That is still factored form, and the direction question is answered correctly.
- **Small pools:**
  - IV.6.11.d (x⁴ − a⁴ complete factorizations) has 7 distinct prompts in 200 seeds.
  - IV.7.10.d (derivation steps) has 6, IV.7.13.c has 15 and IV.7.14.d has 8. These three are the allowed LOW_VARIETY flags.
  - They are concept steps, and the harness passes. I did not widen them.
- **IV.8.10.a ("negative discriminant"):** it covers all three discriminant cases (two real, one repeated, non-real conjugate pair), balanced. It is a classification step, which is fine for "negative discriminant".
- **IV.6.05.d and IV.6.16.d:** both are mental-math squares or differences. They sit in different skills, as the spec requires.
- **IV.8.12–8.16 (polar, De Moivre, roots, loci):** these are high-end for high school. They are in the spec, so I kept them.
- **IV.7.03.a with b = 0 (vertex x = 0):** still a valid use of −b/(2a), so I kept it.
- **Wording already reviewed:** the e/f steps got a light pass. Apart from 6.15.e, they read correctly and sit clearly above d.

## Final checks

```
node harness4.js 300 IV.5.   → generated 12600 questions in 42 steps / no problems
node harness4.js 300 IV.6.   → generated 28800 questions in 96 steps / no problems
node harness4.js 300 IV.7.   → generated 30600 questions in 102 steps
                                LOW_VARIETY: 3 steps (IV.7.10.d 6, IV.7.13.c 15, IV.7.14.d 8): the allowed three only
node harness4.js 300 IV.8.   → generated 28800 questions in 96 steps / no problems
node test-core.js            → core tests: 124 passed, 0 failed
```
