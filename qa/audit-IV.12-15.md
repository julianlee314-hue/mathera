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
