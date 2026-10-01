# Brief: optional Brave and Legend steps for Eras I–III

Mathera is a free math app. Every skill has 4 steps (a–d, easy → hard). Each step is a **generator** `(R, O) => question` that builds a fresh question from a seeded random helper `R`. Era IV already gives every skill two optional steps after d:
- **e, ★ Brave:** the skill with a twist.
- **f, ★★ Legend:** a competition-style problem.

They open only after the skill is proven. They never block progress. They are for fast finishers who need something genuinely hard. You are adding them to **about a quarter of the skills in one era**, the ones where a challenge really helps.

## Files
- **Engine and existing skills (read only):**
  - Era I = `E1` in `/home/claude/lab/s0.js`
  - Era II = `E2` in `/home/claude/lab/s1.js`
  - Era III = `E3` in `/home/claude/lab/s2.js`
  
  Another agent may be fixing a–d steps in these files right now, so **never edit s0/s1/s2**.
- **Your output:** `/home/claude/lab/b1.js` (Era I), `b2.js` (Era II) or `b3.js` (Era III). Each file already holds a helper:
  ```js
  B('II.5.07', { t: 'find the missing part', g: (R, O) => … }, { t: 'a fraction puzzle', g: (R, O) => … });
  ```
  It attaches e and f to an existing skill. Use the era's own helpers, the same way the existing generators in that era do: `const { num, choice, choiceFixed, tf, V, C, … } = E2;`. Check the top of the era's file for what exists, for example `E2.num`, `E2.choice`, `E2.frac` and the visual helpers. Never use `Math.random`.
- **Examples of the finished style:** Era IV brave steps in `/home/claude/up/units/u4_07.js` (skills IV.7.07, IV.7.11 and IV.7.15) and `/home/claude/up/units/u4_13.js`. Read the brave-steps section at the end of `/home/claude/up/UNIT_BRIEF.md`. The API there is Era IV's, but the ideas carry over.

## Which skills
- **How many:** about 25% of the era's skills. In each branch (unit), pick roughly 1 skill in 4, rounding up, and at least 1 per branch.
- **Pick the skills where a twist has real mathematical depth.** Good fits:
  - skills with structure: operations, place value, patterns, fractions, equations, area, ratio, counting, number puzzles
  - skills that can run backwards ("the answer is 24, what was the missing number?")
  - skills that combine naturally with an earlier skill
- **Skip** pure vocabulary, recognition and reading-a-chart skills, unless there's a real puzzle in them.

## Pitch for each era
- **Era I (ages about 5–8).** The learner may be read to aloud, so keep the words very short.
  - Brave: a missing number, working backwards, "which one doesn't belong", or a two-step "and then…".
  - Legend: the flavor of Math Kangaroo (Pre-Ecolier/Ecolier) or of beginner Singapore/Australian math olympiads, such as tiny logic puzzles, balance puzzles, counting all the ways, or number patterns with a hidden rule.
  - Keep numbers small. The difficulty should come from thinking, not size.
- **Era II (ages about 8–11).**
  - Brave: reverse the operation, find the missing digit, or a multi-step word problem.
  - Legend: Math Kangaroo (Benjamin), MOEMS/Math Olympiad for Elementary, SASMO or Primary Maths Challenge style, such as digit puzzles, "how many numbers between…", clever regrouping, or fraction puzzles with a trick.
- **Era III (ages about 11–14).**
  - Brave: run it backwards, add a parameter, or combine with an earlier skill.
  - Legend: MATHCOUNTS, AMC 8 or UKMT Junior style. The problem needs insight, is solvable by hand in about a minute of real thought, and needs no calculator.

## Rules (same bar as a–d)
1. **Correct.** Compute the answer from the same numbers you show. Guard every degenerate case, and make sure every loop terminates. For "find all" answers, use the era's multi-answer field if one exists; otherwise ask for one well-defined number (the sum, the count, the largest, …).
2. **Varied.** At least 20 distinct prompts in 300 seeds, or at least 8 for a pure puzzle step with a fixed idea.
3. **Not guessable.** Yes/No and True/False balanced; shuffled choices.
4. **A harder idea, not bigger numbers.** e is one or two steps beyond d. f is a real puzzle.
5. **Short wording.** A 1–2 sentence prompt and a 1–2 sentence explanation that shows the key idea with numbers. US spelling.
6. **Honest step titles (`t`)** that name the twist, like "work backwards", "missing digit", "count every way" or "the hidden rule".
7. **House Rules.** If money or length appears, read `O.coins` and `O.units` the way that era's existing generators do.

## Workflow
1. Read the brave section of `/home/claude/up/UNIT_BRIEF.md`, then look at a few Era IV brave steps for style.
2. Read your era's engine helpers at the top of its s-file. Run `cd /home/claude/lab && node dump.js <BRANCH> 2` to see each branch's existing a–d questions, then pick your skills.
3. Write the B(...) calls into your b-file, branch by branch.
4. Check with the harness filtered to your era:
   ```
   cd /home/claude/lab && ONLY=I node harness.js 20 280
   ```
   Use `ONLY=II` or `ONLY=III` for the other eras. The issue summary `{…}` must be `{}` for your steps. Lines ending "(info) N distinct prompts" are shown for any step under 20; your e/f steps must meet rule 2.
5. Read your e and f samples by eye like a strict competition coach: `node dump.js <BRANCH> 3`. Is the answer truly right? Is it a real twist? Is it pitched right for the age? Fix and repeat.

Reply with only:
- how many skills got e/f, per branch, with their ids
- the harness summary line
- how many samples you read
- anything you're unsure about
