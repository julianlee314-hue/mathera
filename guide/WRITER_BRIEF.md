# Brief: plain-English curriculum guide text for Mathera

Mathera is a free math app. The math is organised like this:
- **Era:** seven of them, I Count · II Operate · III Relate · IV Solve · V Prove · VI Change · VII Space.
- **Branch:** each era is split into branches (called "units" in the data).
- **Skill:** each branch holds skills.
- **Levels:** each skill has 4 levels (steps a–d, easy → hard). Era IV skills also have two optional challenge levels: e "★ Brave" and f "★★ Legend", for fast finishers.

We're making a printed **curriculum guide** that a **parent with no math background** can read. It should tell them what their learner is working on and what each level asks. You are writing the text for one era.

## Input
`/home/claude/guide/source.json`: `eras[] → units[] → skills[] {id, name, steps{a..f}}`. The step labels are terse teacher shorthand ("to 5", "scattered objects to 10", "split into two cases"), so turn them into plain sentences.

To see what a level really asks, look at actual sample questions:
- Eras I–III: `cd /home/claude/lab && node dump.js I.3 1` (use a branch id like `II.5`)
- Era IV: `cd /home/claude/up && node dump4.js IV.7 1` (no trailing dot)
- Eras V–VII have no questions yet, so go by the name and the step labels.

## Output
Write **one file per branch** as soon as that branch is done, so progress survives an interruption: `/home/claude/guide/out/<BRANCH>.json`, e.g. `out/II.5.json`. If a file for a branch already exists and parses, skip that branch.
```json
{
  "branch": "II.5",
  "intro": "One or two sentences on what this branch is about and why it matters.",
  "skills": {
    "II.5.01": {
      "what": "One plain sentence saying what this skill is.",
      "levels": { "a": "…", "b": "…", "c": "…", "d": "…" }
    }
  }
}
```
Era IV skills also need `"e"` and `"f"` in `levels`. Every skill in the branch must be present, and every level it has must be filled.

## Style
- **Reader.** A caring parent or grandparent who left math behind at school. They should finish each line knowing what their learner is doing. Don't write for a math teacher.
- **`what`:** one sentence, ideally under 25 words, saying what the skill is in everyday words. For advanced topics (Eras V–VII), you may use up to 3 short sentences: name the idea, then give a plain-picture meaning or an everyday example ("A derivative measures how fast something is changing at one instant, like a speedometer reading."). Don't write a textbook definition.
- **`levels`:** one short sentence each (about 6–18 words), phrased as what the learner does at that level, starting with a verb: "Counts up to 5 objects." "Solves equations where the unknown appears on both sides." "Explains why…"
  - Each level should read as a clear step up from the one before.
  - If a level is just the same with bigger numbers, say so briefly ("The same with numbers up to 100.").
  - Brave (e) and Legend (f) should say what the twist is in plain words ("Works backwards: given the answer, finds the missing number in the question." / "Puzzle-style problems like those in math competitions: finds every value that works.").
- **Jargon.** Avoid it. If a math word is unavoidable (fraction, equation, slope, derivative, matrix), keep it but make its meaning clear from the sentence, or add a few words of meaning in parentheses the first time it appears in a branch. Never use unexplained symbols; write "x squared", not "x²", and use as little notation as possible.
- **Tone.** Warm, concrete, and brief. US spelling. No "students will be able to", no "Your child", no exclamation marks, no hype.
- **Accuracy.** Be honest about the math. Plain doesn't mean wrong.

**Examples** (tone to copy):
- I.1.01 Count objects one by one → what: "Counting a group of things by pointing to each one once and saying one number for each." · a: "Counts up to 3 things, touching each one." · b: "Counts up to 5 things." · c: "Counts up to 10 things in a line." · d: "Counts up to 10 things scattered around, without skipping or counting any twice."
- IV.7.07 Solve by factoring → what: "Solving a squared equation (a quadratic) by splitting it into two simpler pieces that multiply to zero." · a: "Solves equations already split into two brackets, like (x − 2)(x + 5) = 0." · b: "Factors a simple quadratic first, then solves it." · c: "Handles quadratics with a number in front of the x squared." · d: "Rearranges the equation so one side is zero before factoring." · e: "Expands and tidies a messier equation before it can be factored." · f: "Spots a quadratic in disguise, such as an equation in x to the fourth power, and finds all solutions."
- VI.2 derivative skill → what: "A derivative measures how fast something is changing at a single moment, like a car's speedometer reading."

## Workflow
Branch by branch:
1. Look at the skills, and for Eras I–IV the sample questions.
2. Write the JSON file.
3. Check it parses: `python3 -c "import json;json.load(open('<file>'))"`.

At the end, run `python3 /home/claude/guide/check.py <ERA>`. It reports missing skills or levels and very long lines. Fix what it reports.

Reply with only: the branches written, the check.py summary line, and any skill where you weren't sure what a level means.
