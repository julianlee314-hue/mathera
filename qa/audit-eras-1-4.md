# Level-match audit: Era I (I.1–I.7)

File: `/home/claude/lab/s0.js`. Backup of the pre-audit file: `/tmp/claude-0/-home-claude/7073f1e9-f305-5f65-a87d-dc7edfa7b828/scratchpad/s0.audit-start.js`.

**Scope and method.** 108 skills × 4 steps = **432 steps**. I read each skill's name and step labels, then 3 dumped samples of every step (`node dump.js I.N 3`, 1,296 samples in all). After that I ran extra checks:
- a 300-seed histogram on each step I suspected, for variety and answer balance;
- a 400-seed automated scan of every Era I step for grammar slips (singular/plural, "There are 1", lowercase sentence starts, undefined/NaN).

**Totals:** 34 problems found and 34 fixes made. 3 are fit, ladder or label problems. 31 are correctness or clarity problems: wrong explanations, ambiguous wording, and grammar slips that a 5–8-year-old would trip on.

## Verdict per branch

| Branch | Verdict |
|---|---|
| I.1 Counting | Fits well. The ladders climb cleanly (to 3 → 5 → 10 → scattered; decade → cross decade → two blanks). I.1.08.b partly repeated I.1.08.a (a "which plate has 0" variant); it now uses a ten-frame instead. There were also a few grammar slips ("1 tens", "1 fingers up", "1 ones") and the colour word "olive". |
| I.2 Comparing & ordering | Fits well. The fit and the ladders are good. Only plural slips needed fixing ("1 pair match", "1 steps along", "Both have 1 tens", "The first 1 cubes line up"). |
| I.3 Place value | Mostly good. **Ladder issue:** I.3.09.b ("write to 20 in words") drew 0–20, so it was mostly "Which word is 2?" and easier than step a (reading two-digit names). It now draws 11–20 75% of the time, and the full 0–20 pool is kept. There were also plural slips and a thin explanation in I.3.06.b. |
| I.4 Addition & subtraction | Fits well. The strategy ladders (count on → bigger first → within 20; make ten 9+n → 8+n → 7+n) are sound, and the answers are auto-checked. Only plural slips needed fixing. |
| I.5 Patterns, sorting & logic | Mostly good. **Label mismatch:** I.5.13.d "choose the reason" actually asked "Which must be true?". I rewrote the generator so it now gives the reason (details below). There were also lowercase sentence starts in I.5.02.d and "There are 1 stars" in I.5.10.a. |
| I.6 Geometry | Fits well. There were two wording fixes, in I.6.07.d and I.6.14.d. |
| I.7 Measurement, time, money & data | Fits well. **Wrong explanation:** in I.7.06.a, when the question asked "Which holds less?", the explanation ended "A holds more." There were also small wording fixes in I.7.03.c, I.7.07.b, I.7.09.a, I.7.11.b and I.7.14.b. |

## Every change

| Step | Problem | Fix |
|---|---|---|
| I.1.03.c | "the 1 means 1 ones" (for 11) | Singular "one" when the ones digit is 1 |
| I.1.04.c | "After 1 tens and 9 ones…" (for 19) | "1 ten" |
| I.1.06.b | "1 ten and 1 ones" in two explanations (for 11) | Singular "one" |
| I.1.07.d | "Is he right?" was answered with True/False | Choices are now Yes / No (the explanation already said "Yes."/"No.") |
| I.1.08.b | Its plate variant was the same question as I.1.08.a ("Which plate has 0?") | The third model is now an empty ten-frame, next to the five-frame and fingers. The pool is the same size. |
| I.1.08.c | "All the stars are olive." ("olive" is a hard colour word for ages 5–8) | The two colours are now drawn from the palette without olive |
| I.1.09.d | "1 fingers up" | "1 finger up" |
| I.2.01.a | "1 pair match." | "1 pair matches." |
| I.2.01.d | "1 match up." | "1 matches up." |
| I.2.03.b | "1 is 1 steps along" | "1 step" |
| I.2.05.a | "count 1 marks" | "count 1 mark" |
| I.2.08.a | "11 is only 1 ten and 1 ones" | "1 one" |
| I.2.09.b | "Both have 1 tens." | "1 ten" |
| I.2.12.a | "The first 1 cubes line up." | "The first cube lines up." |
| I.3.01.a | "10 go in the bundle and 1 are left." | "1 is left" |
| I.3.03.b | "There are 1 rod (tens)…" | "There is 1 rod…" |
| I.3.06.b | The explanation "200 is two hundred." did not show the working | "200 is two hundred: 2 hundreds." |
| I.3.06.c | "…1 hundreds / 1 tens / 1 ones" | Each place name is singular when its digit is 1 |
| I.3.09.a | The explanation started in lowercase ("twenty-three is 23.") | Capitalised |
| I.3.09.b | **Ladder:** b drew 0–20 evenly, so it was mostly "Which word is 4?", easier than a (reading "twenty-three") and a repeat of I.1.06 | Draws 11–20 75% of the time and 0–10 25%. No values removed. |
| I.4.01.d | "There are 1 red and 7 blue" | "There is 1 red…" |
| I.4.02.d | "1 are crossed out" | "1 is crossed out" |
| I.4.14.b | "That is 1 steps." | "1 step" |
| I.5.02.d | The explanation started in lowercase ("red square, blue hexagon comes again…") | Capitalised |
| I.5.10.a | The prompt said "There are 1 stars." | "There is 1 star." |
| I.5.13.d | **Label mismatch:** the label is "choose the reason", but the question asked "Which must be true?" | The generator now states who has what and asks "Why?". The choices are the correct reason and two false reasons in the same form, so the longest option is no longer the tell. There are 4 targets over both puzzle styles (b: why P2 or P3 has it; c: why P1 or P3 has it). 399 distinct questions in 400 draws. |
| I.6.07.d | "Slide the 1 rectangle, 2 triangles back together" | "Slide the pieces (1 rectangle, 2 triangles) back together" |
| I.6.14.d | "1 of them fit." | "1 of them fits." |
| I.7.03.c | "about 1 centimeters" | Singular unit when the answer is 1 |
| I.7.06.a | **Wrong conclusion:** for "Which holds less?", the explanation ended "A holds more." | Adds "So B holds less." (or A) when the question asks for less |
| I.7.07.b | "The long hand is on 12, so it is o'clock." | "…so it is an o'clock time." |
| I.7.09.a | "That is 1 jumps" | "1 jump" |
| I.7.11.b | "Look at the value, not the size. penny 1¢…" (lowercase sentence start) | A colon now leads into the list |
| I.7.14.b | "That is 1 pictures." and "draw 1 pictures" | Singular in both explanations |

No skill ids or names changed. No pool was made smaller.

## Label changes

**None.** For I.5.13.d I fixed the generator so it matches its label, so the curriculum guide needs no changes.

## Left alone, and why

- **I.1.01.b** ("to 5") draws 2–5 and overlaps a (1–3) at 2 and 3. It still climbs on average, and narrowing it would shrink the pool.
- **I.1.05.b** ("cross 100") has only 8 distinct questions, and 37% of them are "What comes after 99?". This is narrow but accurate. I did not invent content out of range.
- **I.1.13.d** ("to 100") sometimes draws 11–20, which overlaps c. It happens rarely and is not wrong.
- **I.4.02.c vs I.4.04.a**: both use the same take-away story bank and dot picture, so the same seed gives the same question in both skills. The explanations differ (count what's left vs count back). I noted it but kept both pools intact.
- **I.4.09.a vs b** (double plus one / double minus one) often ask the same sum in the other order (3 + 4 and 4 + 3). The skill is the strategy, and each explanation follows its label.
- **I.5.01.c / I.5.02.b** ("ABB" / "AAB") also produce the other rotation, and **I.5.02.c** ("ABC") also produces AABC and ABCC. I read the labels as naming the core family. The explanations always name the actual repeating part.
- **I.4.01.c** ("count all") covers 5–10 and overlaps b (6–10). It is harder in a different way: the dots are scattered with mixed colours, not in two groups.
- **I.7.01.b** ("line up the ends") shows bars whose ends are not lined up, so the child counts grid spaces. This fits a lesson on why ends must be lined up.
- **I.7.12.d** ("change from a note") uses $1, which is a bill in the US. "Note" is kept because it is the House-Rules-neutral term (THB also has notes).
- **I.6.04 "like a dice"**: I kept the child-friendly wording.

## Final harness (per branch, `ONLY=I.N node harness.js 20 280`)

```
I.1  generated 28160 questions  {}  solver checked 0 questions (0 steps), agreed on 0
I.2  generated 21120 questions  {}  solver checked 1558 questions (5 steps), agreed on 1558
I.3  generated 21120 questions  {}  solver checked 1467 questions (6 steps), agreed on 1467
I.4  generated 40480 questions  {}  solver checked 21862 questions (60 steps), agreed on 21862
I.5  generated 26400 questions  {}  solver checked 266 questions (2 steps), agreed on 266
I.6  generated 24640 questions  {}  solver checked 0 questions (0 steps), agreed on 0
I.7  generated 28160 questions  {}  solver checked 0 questions (0 steps), agreed on 0
```
All issue summaries are `{}`. The remaining lines are only "(info) N distinct prompts".
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
# Level-match audit: Era III (III.1 – III.9)

File: `/home/claude/lab/s2.js` (backup before this audit: scratchpad `auditIII/s2.pre-audit.js`). b-files untouched.

**Scope read:** 146 skills, 584 steps (a–d). At least 3 samples of every step (`node dump.js III.N 3`), plus 8–40 extra samples for every step I changed or suspected.

**Counts:** 584 steps read · 51 steps with a mismatch found · 51 fixed (38 table rows below) · 1 label change. 7 of these are ladder or label-fit problems (III.1.11.d, III.2.12.b, III.2.12.d, III.6.01.d, III.6.04.d, III.6.05.d, III.7.01.a). 4 are wrong or unrealistic content (III.2.04.a, III.3.16.b, III.5.12.b, III.9.10.d). The rest are wording and explanation slips.

**Final harness** (`ONLY=III.N node harness.js 20 280`), all nine branches:

| Branch | Issues | Solver |
|---|---|---|
| III.1 | `{}` | 8512/8512 agreed (23 steps) |
| III.2 | `{}` | 880/880 (2 steps) |
| III.3 | `{}` | 4037/4037 (14 steps) |
| III.4 | `{}` | 4785/4785 (17 steps) |
| III.5 | `{}` | 0 (0 steps) |
| III.6 | `{}` | 6948/6948 (17 steps) |
| III.7 | `{}` | 0 (0 steps) |
| III.8 | `{}` | 0 (0 steps) |
| III.9 | `{}` | 0 (0 steps) |

The "(info) N distinct prompts" lines are the same 51 lines as before the audit. I diffed them against a run on the pre-audit file.

## Verdict per branch

- **III.1 Integers & rationals:** fits well. One ladder problem: in III.1.11 (multiply and divide rationals), step d was really step a with the word "of". There were also two plural slips ("1 steps") and "a diver … its height".
- **III.2 Ratios & rates:** mostly good. Four problems:
  - Two label-fit problems: III.2.12.b (total from one part) and III.2.12.d (mixtures).
  - One unrealistic question: III.2.04.a asked for 40.5 pencils per pack.
  - Small wording slips.
- **III.3 Percent:** good fit and ladders. Two real problems:
  - III.3.16.b estimated "51% of 20 ≈ ½ of 22 = 11". It also sometimes used a distractor (24 for 24% of 102) that is closer to the truth than the marked answer.
  - Seven "a 8% / a 80 m" article slips.
- **III.4 Exponents & roots:** fits well. Only explanation polish:
  - an unsimplified fraction
  - "2 × 10³ = 2 × 10³"
  - "0.57 = 0.57"
- **III.5 Expressions:** fits well. Problems:
  - One wrong explanation: III.5.12.b said "a negative squared is positive" for 2x³.
  - "1x", "1p" and "1 units" slips.
  - An irrelevant "minus sign" note in III.5.04.a.
- **III.6 Equations & inequalities:** topic fit good. Ladder problems:
  - In III.6.04 and III.6.05, the "check" step d (substitute one value) was easier than step c.
  - III.6.01.d was mostly single-line arithmetic true/false, easier than c.
- **III.7 Linear relationships:** fits well. Problems:
  - III.7.01.a label didn't cover its "undo the rule" questions (label changed).
  - Repeated "(13/3) = (13/3)" in explanations.
  - "Each step right of 1" wording.
- **III.8 Geometry:** fits well. Three wording slips: "A 18 m ladder", "= 5² = 25", "1 ÷ 3 as big".
- **III.9 Statistics & probability:** fits well. Problems:
  - III.9.10.d gave impossible sample percents (29% of 15 people, 57% of 10).
  - Redundant "(3/13) = (3/13)".
  - "people who ride its buses" had no referent.

## Table of changes

| Step id | Problem | Fix |
|---|---|---|
| III.1.01.b | "A diver is 19 m below sea level. Write **its** height" | "Write **the** height" |
| III.1.04.b, III.1.05.b | "moves right 1 steps" | pluralize only when > 1 |
| III.1.11.d | Ladder: "(4/5) of −(3/5)" is the same as step a (fraction × fraction) with "of" | Kept both old variants. Added two harder ones: chained "(a/b) of (p/q) of −k" (work from the right), and "cancel first" products like (9/20) of −(5/18). |
| III.2.04.a | "324 pencils in 8 packs → 40.5 pencils per pack" (also half seeds, words, pages) | Half answers only for laps and a new "liters per minute" context. Countable items always come out whole. |
| III.2.08.d | Choice "The number of wheels on some cars" is vague | "A number of cars and their wheels (4 each)" |
| III.2.11.d | "use 100 3 times" | "use 100 three times" |
| III.2.12.b | Label "total from one part", but the one-part variant asked only for the other share | That variant now asks for the other share **and** the total (2 fields) |
| III.2.12.d | Label "mixtures", but one variant was "share $56 among 3 people" | Same 3-part math, now a trail-mix context with 3 name sets, answers in grams |
| III.2.13.b, III.2.13.d | "= 1 hours" | singular when 1 |
| III.2.15.a | "Write a fraction or mixed number" when the answer is 10 | Instruction shown only when the answer isn't whole |
| III.3.08.b, III.3.10.b/c/d, III.3.11.a, III.3.13.d, III.3.17.b | "a 18% tip", "a 80% markup", "a 80 m track", "a 85% drop", "a 8% rise" | a/an chosen by number (8…, 11, 18) |
| III.3.13.d | "4 ÷ 80 ≈ 5%" when exact | "=" when exact, "≈" otherwise |
| III.3.16.b | "51% of 20 is about 11 (½ of 22)": the base was rounded away from a nicer exact value. Also a distractor (p itself) could be closer than the key. | x is never itself a multiple of d, and base is always x's nearest multiple. The p distractor is replaced by est/2 when it is within 3 of the answer. |
| III.4.07.b | "5 × 10⁻⁴ = 5/10,000", key 1/2000, not simplified in the explanation | Adds "= 1/2000" when reducible |
| III.4.09.d | "= 2 × 10³ = 2 × 10³" | Drops the repeat |
| III.4.16.b | "0.57 = 0.57. The others: …" | "From left to right: 0.57 < √10 ≈ 3.16 < √48 ≈ 6.93. So √48 is at A." |
| III.5.04.a | "A minus sign belongs to the term after it" on "7 + 9a" | Said only when a minus is present, otherwise "Terms are the parts joined by + or −" |
| III.5.08.d | "1x + 10" | "x + 10" |
| III.5.09.a | "5(p + 4) + 1p" | "+ p" |
| III.5.11.a, III.6.07 (story) | "a $8 booking fee" | a/an by number |
| III.5.12.b | Wrong working: "Find 2x³ at x = −4 … A negative squared is positive" | Square note only for x² terms; cube terms get "A negative cubed stays negative: (−4)³ = −64" |
| III.5.14.c, III.5.14.d | "1 strip and 1 units" | pluralize only when > 1 |
| III.6.01.d | Ladder: 2 of 3 variants were plain arithmetic true/false, easier than c (testing values) | Harder variant (identities, no-solution statements with x) now half of the questions. No variant removed. |
| III.6.04.d | Ladder: "what is 2x + 13 at x = 19?" is easier than c | Numeric variant now also asks "Then solve the equation yourself" (value + correct x). The explanation shows both. The Yes/No variant is unchanged. |
| III.6.05.d | Same ladder problem vs c (fractions) | Same fix: left side + correct x, with the solving line in the explanation |
| III.6.10.d | "a $8 fee", "a $11 bonus" | a/an by number |
| III.7.01.a | Label "apply a rule to an input", but one variant asks for the input from the output | **Label changed** (generator is good) |
| III.7.02.c, III.7.02.d | "Each step right of 1 changes y…" | "Each step of 1 to the right…" |
| III.7.03.a, III.7.03.c, III.7.04.a, III.7.05.a, III.7.05.c | "(13/3) = (13/3)", "(1/2) = (1/2)" | Final "= …" only when it simplifies |
| III.7.03.d | "units are cm per week: cm per week" | Second phrase only when it differs |
| III.8.15.d | "A 18 m ladder" | "An 18 m ladder" |
| III.8.16.c | "3² + 4² = 25 = 5² = 25" | "= 25 = 5²"; unequal cases read "269 > 196 = 14²" |
| III.8.22.b | "Scale factor (1/3) means 1 ÷ 3 as big" | "a third / a quarter / (1/d) as big" |
| III.9.07.d, III.9.11.a | "(3/13) = (3/13)" | "= …" only when reducible |
| III.9.10.c/d | "people who ride its buses" (no referent in "Two random samples of …") | "people who ride the buses" |
| III.9.10.d | "29% of 15 want pizza", "57% of 10": impossible counts | Both percents are now whole-person counts of their samples (10% steps for 10, 20% steps for 15, 5% for 20); the gap stays 8–25 points |

## Label changes (for the curriculum guide)

| Step id | Old label | New label |
|---|---|---|
| III.7.01.a | apply a rule to an input | apply a rule, or undo it |

No other labels changed.

## Left alone, and why

- **"Check" steps elsewhere** (III.6.12.c, III.8/III.9 "interpret" steps): they sit in c or are genuinely applied, so the ladder holds. I made the III.6.04/05 check steps harder only because they were d and plainly easier than c.
- **III.2.05 (rates with fractions) a/b/c** all divide a fraction by a fraction. Each has a different frame: walking speed; a fraction of a job or batch; inverse rate (minutes per m). c also includes the inverse. They are distinct enough, so I kept them.
- **III.8.11.d "pyramids by net"** sits in "Surface area of prisms". It is a deliberate stretch step (net method carried over), not a neighbour's topic. Kept.
- **III.1.09.d** shows the distractor "−(3/4)" with brackets around a stacked fraction. It renders correctly in the app; the dump just shows "−((3/4))".
- **III.5.02.d / III.6.11.c** explanations look like "(n + 10/8)" in the dump. The HTML is a proper stacked fraction with n + 10 on top.
- **Small pools that repeat across seeds** (III.1.13.a, III.6.11.a/b/d, III.8.13.a, III.9.16.a): the harness reports no low-variety issue and the other variants are wide enough.
- **III.3.16.b pool:** the ±2 offsets for d = 2, 3, 4 were removed. Every question they produced was wrong or ambiguous: x was an exact multiple, equidistant, or nearer a different multiple. The base range is unchanged.
- **III.2.12.d:** the "share money among 3 people" context was replaced by trail mix to fit the "mixtures" label. The numeric pool is identical; the contexts went from 1 to 3.
# Level-match audit: Era IV, branches IV.1–IV.4

Scope: `u4_01.js`–`u4_04.js`, which hold 44 skills and 264 steps. I read 3 samples of every step (a–f) using `node dump4.js IV.N 3`, with extra seeds for every step I changed. I checked each step against the spec in `/home/claude/up/specs/IV.N.json`.

## Verdict per branch

- **IV.1 Equations & inequalities.** Fits well. The only problem was IV.1.02.c: many of its science formulas were one-step (W=Fd, V=IR, p=mv). That made c no harder than a and easier than b. Fixed.
- **IV.2 Functions.** Mostly fits well and climbs. There were two problems:
  - IV.2.09.c "read them from a graph" was a single parabola vertex, which is easier than b (absolute max and min across a whole zig-zag graph). Fixed.
  - The IV.2.15.f explanation printed "Solve (x)² + 0 = x". Fixed.
- **IV.3 Linear functions.** Fits well. Every step matches its label and the ladders climb. No changes.
- **IV.4 Systems.** Mostly fits well. There were three problems:
  - IV.4.02.d asked students to solve exactly by elimination (with multiplying) two skills before elimination is taught. Also, the graph estimate was sometimes already exact, for example "near (−2.5, −5)".
  - Half of IV.4.05.d ("multiply by −k, which result is right?") was the same task as IV.4.05.a's "multiply by k, fill in the boxes".
  - IV.4.11.e said "dividing by a negative slope". It should say "a negative number".

  All three are fixed.

## Changes

| Step | Problem | Fix |
|---|---|---|
| IV.1.02.c | The ladder didn't climb. Most picks were one-step formulas, as easy as a and easier than b. | Added 4 two-step formulas: P=I²R for R, E=½kx² for k, d=vt+½at² for a, v²=u²+2ad for d. Step c now draws 75% from the two-step formulas ("…, then …") and 25% from the full list. No entry removed. |
| IV.2.09.c | c was easier than b. A single parabola vertex was too gentle next to b's whole-graph absolute max and min. | New main variant (60%): on a zig-zag graph over a closed domain, give the absolute max (or min) **value and the x where it occurs**. The extreme is unique, and the explanation warns not to swap value and location. The parabola variant is kept (40%). |
| IV.2.15.f | Explanation read "Solve (x)² + 0 = x". | It now prints "x²" when h = 0 and leaves out "+ 0" when k = 0. |
| IV.4.02.d | Needed elimination with multiplying (IV.4.05) inside "Solve by graphing". The estimate could also equal the exact answer. | New main variant (65%): "Which point is the exact solution?" The 3 distractors are the rounded graph estimate, a nearby point on line 1 only, and a nearby point on line 2 only. Each is verified to fail at least one equation, and they are deduplicated by value. Solving it only needs substitution, which IV.4.02.c already practices. The typed exact-solve is kept (35%). The generator now rejects systems whose 1-decimal estimate is exact. |
| IV.4.05.d | Duplicated IV.4.05.a: multiplying one equation by a number. | New variant (⅓): "multiply the second equation by −k and add it to the first. Which equation do you get?" The distractors are: the constant not multiplied, a sign slip on the x-term, and a sign slip on the constant. The two old variants are kept (⅓ each). |
| IV.4.11.e | The explanation said "Dividing by a negative slope flips the sign." | Now reads "Dividing by a negative number flips the sign." |

## Label changes

None.

## Left alone, and why

- **IV.4.07.d "spot them from slopes".** It asks for k so the coefficients are proportional, and the explanation frames this as "same slope". It is close to e ("find both parameters"), but e asks for two unknowns and the no-solution exclusion, so the ladder still climbs. Acceptable.
- **IV.2.12.e/f (brave).** "Isolate, then split" and "sums of distances" repeat IV.1.03.c/d/f almost exactly. They are e/f steps that were reviewed recently, and they work as spaced review, so I left them. Flagging it for whoever owns the brave steps.
- **IV.4.03.d and IV.4.04.d "check".** Checking a pair is arguably easier than c's full solve. The spec puts "check" at d, so this is by design.
- **IV.2.05.d "units of input and output".** One variant asks for the units of the average rate of change, which is built from the input and output units. Keeping it is what makes d harder than c. Some variants ("units of t") are very easy.
- **IV.2.03.d.** The item "domain of √x − 6" is about as easy as c. The rest of d (the range of −(x−h)²+k in interval notation) climbs. It is a mild wobble, not a mismatch.
- **Cross-skill overlaps.**
  - IV.2.01.c and IV.2.05.b use the same contexts in opposite directions: words to notation, and notation to words.
  - IV.2.02.d and IV.2.04.a both read f(a) off a graph.

  In both cases the spec gives each skill that step.
- **IV.4.15.b.** R₁ → R₁ + 4R₂ is a valid row-operation drill, even though it moves away from echelon form.
- **IV.4.12.c.** My 3 samples happened to show only axis vertices. The code asks for the interior vertex 70% of the time, so it is fine.

## Final checks

- `node harness4.js 300 IV.1.` generated 9000 questions in 30 steps: no problems.
- `node harness4.js 300 IV.2.` generated 27000 questions in 90 steps: no problems.
- `node harness4.js 300 IV.3.` generated 16200 questions in 54 steps: no problems.
- `node harness4.js 300 IV.4.` generated 27000 questions in 90 steps: no problems.
- `node test-core.js`: 124 passed, 0 failed.
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
# Level-match audit: Era IV, IV.12 to IV.15

Scope: `u4_12.js` (Exponential & logarithmic), `u4_13.js` (Sequences & series), `u4_14.js` (Counting & probability), `u4_15.js` (Data & distributions).
Method: I read `node dump4.js IV.N 3` for every step: 3 samples of each a–d step and 3 of each e/f step. I read the generator code for every step that looked doubtful. After the fixes I read 6 to 12 extra samples of each changed step.

Steps read: 318 (216 a–d, 102 e/f), about 950 questions.

## Verdict per branch

**IV.12 Exponential & logarithmic (17 skills).** Fits well overall, and the ladders climb.
- Off: 12.05.d ("convert period rates"). One third of its questions were successive percent changes ("falls 5%, then rises 25%"), which is not a period-rate conversion. Fixed.
- Off: 12.08.d ("log of 1 and of b"). Half its questions were log_b(b^k) = k and b^(log_b k) = k, so the generator did more than the label said. Those items are the right d-level stretch, and 12.08.f builds on the inverse rule, so I changed the label instead of cutting the pool.
- Everything else, including e/f, matches its labels. Answers and explanations are correct.

**IV.13 Sequences & series (14 skills).** Fits well.
- One wording fix: 13.01.a. When it asked for a₁, the explanation was circular ("counting from a₁ = 2: a₁ = 2").
- Every other step matches its label, and the ladders climb (for example 13.02 goes common difference → formula → term → which term).

**IV.14 Counting & probability (12 skills).** Fits well.
- Off: 14.10.e ("find a missing branch"). Half its questions were a 3-draw marble problem ("exactly two red"), which has no missing branch. I replaced that half with a real missing-branch problem.
- Everything else matches. Note that 14.05.b "cards and dice" showed only dice in the 3 samples, but the code does have a card branch, so there is no issue.

**IV.15 Data & distributions (10 skills).** Fits well.
- Off: 15.03.d ("back to raw scores"). Only half its questions asked for a raw score; the rest asked for μ or σ, which overlaps 15.03.e. The generator could also produce negative raw scores (μ = 20, σ = 20, z = −3). Fixed.
- Everything else matches.

## Changes

| Step | Problem | Fix |
|---|---|---|
| IV.12.05.d | 1/3 of questions were successive % changes, not period-rate conversion | Replaced that branch with period-to-year conversion for **decay** ("falls 2% per month → yearly decrease 21.53%, not 24%"). Weekly, monthly and quarterly rates are each capped so the naive answer stays under 100%. The pool is about the same size. Growth conversion and the yearly-to-monthly factor branches are unchanged. |
| IV.12.08.d | Label covered only log_b 1 and log_b b; the generator also asks log_b(b^k) and b^(log_b k) | **Label changed** (see below). The generator is unchanged. The spec `specs/IV.12.json` was updated to match. |
| IV.13.01.a | When k = 1 the explanation was circular | For k = 1 the explanation now reads "a₁ is the first term, the one with n = 1: a₁ = 2." |
| IV.14.10.e | Half of the questions (3-draw marbles, exactly two red) did not fit "find a missing branch" | Replaced with the other missing branch: given P(B\|A), P(B\|A′) and P(B), find P(A). The explanation shows the working (0.1x + 0.5(1 − x) = 0.3). This pool is larger than the one it replaced. |
| IV.15.03.d | Only 50% of questions asked for a raw score; raw scores could be negative | Added a raw-score word form ("Package weights (g) have mean 65 and SD 2. A weight is 2 SDs above the mean. What is it?"), with 4 contexts. Raw-score questions are now 2/3 of the step. The μ/σ back-solve branches are kept, so the pool only grows. Parameters are re-drawn until the raw score is positive. |

## Label changes (the curriculum guide needs updating)

- **IV.12.08.d**: "log of 1 and of b" → **"log of 1, of b, and inverses"**
  - Changed in `/home/claude/up/units/u4_12.js` and `/home/claude/up/specs/IV.12.json` only.
  - The old text is still in `app/mathera.html`, `app/docs/eras-4-7-skills.md`, `guide/source.json` and `rev/*` (`eras-4-7-skills.md`, `upper.json`, `revised.json`, `stone*.html`). I did not edit those files.

## Left alone, and why

- **12.03.c** (domain and range) already uses vertical shifts (range (4, ∞)) before 12.04 teaches transformations. The shift is explained in words, it is within the skill's topic, and it is a fair c-step, so I left it.
- **Overlaps between skills**:
  - 12.08.a and 12.10.a ask the same kind of question (log₃ 243).
  - 13.01.d and 13.02.b both write an arithmetic formula; 13.01.d also has quadratic terms.
  - 14.03.d repeats 13.12.a/c on Pascal's triangle.

  These overlaps come from the spec design, not from generator drift. Within each skill the ladder is fine.
- **13.07.b** "expand a sum": 30% of questions are constant sums (Σ6). Those come from the skill's wrong turn, and the explanation expands them ("6 is added once for each k"). Fits.
- **12.14.b vs 12.14.d**: both take logs of both sides. d adds a coefficient in the exponent or a shift ("7^(4x) = 36", "e^(3x−4) = 22") and asks for exact and decimal answers. It is a small step up, but not the same question.
- **13.04.d** "when each is useful": a small concept pool with repeats (Fibonacci twice in 3 samples). The harness accepts it as a concept step.
- **14.12.b** "fair games": some items have a positive expected gain rather than being fair. The step still teaches the expected-value-versus-cost reasoning, and one branch solves for the fair prize.

## Final checks

```
node harness4.js 300 IV.12.   generated 30600 questions in 102 steps / no problems
node harness4.js 300 IV.13.   generated 25200 questions in 84 steps / no problems
node harness4.js 300 IV.14.   generated 21600 questions in 72 steps / no problems
node harness4.js 300 IV.15.   generated 18000 questions in 60 steps / no problems
node test-core.js             core tests: 124 passed, 0 failed
```
Backups of the pre-edit files are in the session scratchpad at `a1215/`.
