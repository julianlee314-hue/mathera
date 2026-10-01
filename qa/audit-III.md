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
