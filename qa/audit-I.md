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
