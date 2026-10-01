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
