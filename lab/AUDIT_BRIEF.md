# Brief: level-match audit for Mathera Eras I–IV

Mathera is a free math app. Every skill has:
- a **name**,
- 4 steps (a–d, easy → hard), each with a short **label** (`t`),
- a **generator** that builds fresh questions.

Era IV skills also have steps e (★ Brave) and f (★★ Legend).

Your job is an in-depth check that **the questions really match their topic and their level**, and that the levels climb. Earlier audits already proved there are no wrong answers in the machine-checkable steps. This one is about fit, done by reading.

## What to check, skill by skill
Read the skill name and the step labels, then the samples.
1. **Topic fit.** Every question belongs to this skill, not a neighboring one.
2. **Label fit.** Each step's questions do what its label says. Example: label "23 + 10" but the question is "20 + 30" is a mismatch.
3. **The ladder climbs.**
   - a is the gentlest version and d the hardest or most applied.
   - No step is easier than the one before it.
   - No two steps are really the same question.
   - No step jumps far ahead of the era.
4. **Right for the era.**
   - Era I is ages about 5–8, so words must be very short.
   - Era II is ages 8–11, Era III 11–14, and Era IV high school.
5. **Correct and clear.**
   - The marked answer is truly right.
   - The distractors are really wrong.
   - The explanation shows the right working.
   - The wording is short and unambiguous.

## How to fix
- **Prefer fixing the generator** so it matches its label. Keep skill ids and names.
- **Change a label only** when the generator is good and the label is simply inaccurate. List every label change in your report, because the curriculum guide quotes them.
- **Keep or widen variety.** Never shrink a question pool.
- **Keep edits surgical.** Don't restyle working code.

## Files and tools
**Eras I–III**
- Generators:
  - Era I (`E1`): `/home/claude/lab/s0.js`
  - Era II (`E2`): `s1.js`
  - Era III (`E3`): `s2.js`
- Another agent is adding brave steps in `b1.js`, `b2.js` and `b3.js` at the same time. **Don't touch the b-files.**
- Samples: `cd /home/claude/lab && node dump.js I.4 4` (use a branch id).
- Harness for one branch: `ONLY=I.4 node harness.js 20 280`.
  - The `{…}` issue summary must stay `{}`.
  - Lines ending "(info) N distinct prompts" are informational.
- Era II had a wording review before (`/home/claude/qa/1.8-era2-review.md`, if present). Focus on fit and ladder.

**Era IV**
- Generators: `/home/claude/up/units/u4_NN.js`.
- Specs with the intended steps and rules: `/home/claude/up/specs/IV.N.json`.
- Samples: `cd /home/claude/up && node dump4.js IV.7 3` (no trailing dot).
- Harness: `node harness4.js 300 IV.7.` (trailing dot). It must say "no problems". The only allowed flags are LOW_VARIETY on IV.7.10.d, IV.7.13.c and IV.7.14.d.
- Also run `node test-core.js`, which should report 0 failed.
- Check e/f too, but they were just reviewed, so a light pass is enough.

## Output
- Write your report to `/home/claude/qa/audit-<SCOPE>.md`, e.g. `audit-I.md` or `audit-IV.1-4.md`. Create `/home/claude/qa` if needed. Include:
  - a short verdict per branch (fits well, or what was off)
  - a table of every change: step id, the problem, and the fix
  - every label change, listed separately
  - anything you left alone and why
- Reply with only:
  - the counts of steps read, mismatches found and fixes made
  - the list of label changes
  - the final harness lines
  - anything you're unsure about
