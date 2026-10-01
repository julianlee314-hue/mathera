# Level-match audit: Era II (II.1 to II.10)

File: `/home/claude/lab/s1.js`. I did not touch the b-files.
Method: I ran `node dump.js II.N 3` for every branch and read every question: 136 skills × 4 steps = 544 steps, and 1,632 questions in all. For the steps where I suspected a problem, I then checked 300 to 3,000 seeds. I also ran two scripts over all of Era II:
- a column-arithmetic check that the carrying and regrouping match each label, at 2,000 seeds per step;
- a grammar scan at 400 seeds per step.

## Verdict per branch

| Branch | Verdict |
|---|---|
| II.1 Place value, +/− | Fits well. The ladders climb, and the regrouping labels match on every one of 2,000 seeds per step. One slip: 1.08.d, which has no regrouping, had an explanation that said "carrying". Fixed. |
| II.2 Multiplication | Fits well. 2.06 c "mixed" overlaps the "mixed" steps in 2.04 and 2.05, but that suits a review of all facts, and d (6–9 × 6–9) is harder. There was a "1 tens" grammar slip in 2.12.c. Fixed. |
| II.3 Division | Fits well. In 3.14.c the division explanation was circular ("6 × 26 = 156, and 26 is about 156 ÷ 6") instead of an estimate. Fixed. |
| II.4 Factors and multiples | Fits well. 4.12.a sometimes gave redundant clues ("I am less than 40. I am between 30 and 40."), and 4.11.d said "1 even numbers". Both fixed. |
| II.5 Fractions | Fits well. Nothing to change. |
| II.6 Fraction operations | Two ladder problems. **6.11 a and b were the same question**: a ("× less than 1 shrinks") showed a fraction under 1 only 45% of the time, and b ("× more than 1 grows") showed a shrinking case about 40% of the time. **6.05 d "the smallest one" repeated 6.05 a** (the least common denominator of two fractions, as a choice). Both fixed. |
| II.7 Decimals | Fits well. Some explanations said "2 decimal places in total: 1.1", which only makes sense once you see the hidden trailing zero. There was also "1 tenths". Both fixed. |
| II.8 Expressions | Fits well. 8.07.b sometimes asked "Regroup to add: 50 + 48 + 0". Fixed. |
| II.9 Measurement and geometry | Fits well. Three explanations were unclear: 9.02.b gave the mile explanation only as "20-minute walk", even when the right answer was "4 laps of a track"; 9.13.a said "1 numbers"; 9.14.c had a muddled "trap" sentence. All fixed. |
| II.10 Data | One correctness problem: 10.09.a could ask "How many chose rabbits?" with the answer **62.5 people** (a half-step on a scale of 25). Fixed. |
| All of Era II | About 20 steps said "1 tenths", "1 thousands", "1 groups", "1 layers are left" and so on. Fixed in one central place (see the last row of the table). |

## Every change

| Step | Problem | Fix |
|---|---|---|
| II.1.08.d | The skill has no regrouping, but the long-number explanation said "carrying when a column makes 10 or more". | In `addExplain`, the carrying sentence now appears only when there really is a carry. Otherwise it says "no column makes 10 or more, so there is nothing to carry". |
| II.2.12.c | "(not 65: the 1 is 1 tens)" | It now says "1 ten" (plural only when the digit is not 1). |
| II.3.14.c | The division explanation was circular instead of an estimate. | "About 6 × 30 = 180, close to 156, so each pot gets about 30: 26 is reasonable." |
| II.4.11.d | "5 odd numbers and 1 even numbers" | The noun is now singular or plural to match the number. |
| II.4.12.a | Some mystery-number puzzles had a clue that the other clues already made unnecessary. | The generator now rejects a clue set unless every clue is needed. The pool of target numbers is unchanged (the same 45 answers). |
| II.6.05.d | It was the same question as 6.05.a. | Half the questions now ask for the smallest common denominator of **three** fractions (least common multiple ≤ 48 and smaller than the product), typed or as a choice. The old two-fraction version is kept for the other half. The pool grew from 315 to 1,234 distinct questions. |
| II.6.11.a | The label says "shrinks", but only 45% of questions used a fraction under 1. | Now 70% use a fraction under 1, 15% equal 1 and 15% are over 1 for contrast. The pool is the same, only reweighted. |
| II.6.11.b | The label says "grows", but only 45% of questions used a fraction over 1. | Now 70% are over 1 (shown as mixed numbers half the time), 15% under 1 and 15% equal 1. |
| II.7.10.b | "1230, then put back 2 decimal places: 12.3" | It now says "12.30 = 12.3" when the product ends in 0. |
| II.7.11.c | "110. There are 2 decimal places in total: 1.1" | It now says "1.10 = 1.1" when the product ends in 0. |
| II.7.12.a | "4 tenths ÷ 4 = 1 tenths" | "1 tenth" |
| II.8.07.b | The "friendly" addend could be 0 ("50 + 48 + 0"). | A 0 addend becomes 10. |
| II.9.02.b | Whichever correct answer was shown ("4 laps of a running track", "18 football fields"), the explanation said only "about a 20-minute walk". | The explanation now names all three benchmarks. |
| II.9.13.a | "1 numbers: 1 × 30" | The noun is now singular or plural to match the number. |
| II.9.14.c | "The dot at 140 on that scale is the outer-scale trap." | "The dot where the outer scale reads 40 is the trap: on the inner scale it is 140." |
| II.10.09.a | A half-step on a scale of 25 gave counts of people like 62.5 or 87.5. | Half-steps are used only when the step is even (20 or 50). A check of 3,000 seeds found 0 answers that aren't whole numbers. |
| All of Era II, steps a–d (about 20 steps) | "1 thousands", "1 tenths", "1 hundredths", "1 groups", "1 steps", "1 lines", "1 tenth are shaded", and so on. | `E2.skill` now passes each a–d generator's output through a small helper. It turns "1 &lt;unit&gt;s" into "1 &lt;unit&gt;" (and "are" into "is") in the prompt, the explanation, the text choices and the field labels. It skips SVG, decimals and fractions (so 21 and 0.1 are untouched), and gives the same result if run twice. A scan of 400 seeds × 544 steps found 0 cases left. Brave steps e and f (the b-files) are not wrapped. |

## Label changes

None. Every fix was made in a generator or an explanation.

## Things I left alone, and why

- **II.2.06 c "mixed"**: its questions look like 2.04.d and 2.05.d. This skill is the "all facts" review, so that is intended, and d (6–9 × 6–9) climbs above c.
- **II.3.03 a vs c**: c is a's question without the "Think: 3 × ? = 12" hint. Taking away the scaffold is a real step up.
- **II.3.01 d**: its numbers are about the size of b's and c's, but it is a representation step (choose the matching division), so that is fine.
- **II.1.04 a, b and c** show "(info) 2 distinct prompts". The prompt text is always "Which number is least/greatest", but the numbers are in the choices, so the variety is fine.
- **II.6.03 b** has unusual distractors like "(3/4) + (1/1)". They are really wrong and cannot be confused with a correct split, so I kept them.
- **II.5.09 b** includes improper fractions (4/3 vs 3/3). Comparing fractions with the same denominator still holds, and this is within Era II.
- **II.1.08 b and II.1.10 b** ("which layout is lined up correctly"): the text dump cannot tell the SVG choices apart, so I did not check the picture positions by eye. The prompt, answer and explanation are consistent.
- **Small drops in distinct-question counts (3,000 seeds)**: II.4.12.a went from 1,914 to 1,775, II.6.11.a from 2,580 to 2,448, and II.8.07.b from 1,553 to 1,547. These come only from removing faulty questions (redundant clues, "+ 0") or from reweighting. The set of possible answers and targets is unchanged. II.6.05.d grew from 315 to 1,234.

## Harness (after the changes)

`ONLY=II node harness.js 20 280`:
```
generated 237600 questions in 9.8s
{}
solver checked 67881 questions (167 steps), agreed on 67881
```
I also ran each branch II.1 to II.10 on its own, and every one gave `{}`. The remaining lines are "(info) N distinct prompts" only.
