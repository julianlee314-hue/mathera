# Brief: write one Mathera Era IV/V unit of question generators

Mathera is a free math app. Every skill has 4 steps (a–d, easy → hard), and every step is a **generator**: a function `(R, O) => question` that builds a fresh question from a seeded random helper `R`, so practice never runs out. You are writing the generators for ONE unit. Quality bar: **no wrong answer ever**, varied questions, clean and short wording, and math that looks good.

## Files
- **Your spec:** `/home/claude/up/specs/<UNIT>.json`. For each skill it gives the id, name, the 4 steps (a–d), the classic **wrong turn** (use it for wrong answers) and the **rule** (the stone).
- **Your output:** `/home/claude/up/units/u4_NN.js` for Era IV unit IV.NN, or `u5_NN.js` for Era V unit V.NN. Use two-digit NN, e.g. `u4_03.js`, `u5_12.js`.
- **The pattern to copy:** `/home/claude/up/units/u4_07.js`, the Quadratics unit, which is finished and reviewed. **Read it fully first.** Match its structure, helpers and tone.
- **The core API:** `/home/claude/up/core4.js`. Read the header comment and skim the functions.

## Structure
```js
/* Era IV · Unit IV.3 Linear functions (IV.3.01–IV.3.09) */
(function (G) {
  const E = G.E4, V = E.V, C = E.C, M = s => E.mx(s);   // Era V units use G.E5
  const S = (id, name, steps) => E.skill({ id, name, steps });
  S('IV.3.01', 'Standard form', {
    a: { t: '<step text exactly as in the spec>', g: R => { …; return E.num(prompt, fields, explain, extra); } },
    b: …, c: …, d: …
  });
})(typeof window !== 'undefined' ? window : globalThis);
```
Use **exactly** the skill ids, names and step texts from your spec.

## Building a question
- **Answers you type:** `E.num(prompt, fields, explain, {visual})`. Each field is one of:
  - `{ans: 12}` for a whole or decimal number (up to 3 decimal places), or `{ans: 3.4641, dp: 2}` for a rounded answer
  - `{frac: [3, 4], form: 'any' | 'simplest' | 'improper'}`
  - `{exact: '2sqrt(3)', form: 'simplest'}` for an exact irrational: surds, pi, fractions of pi
  - `{expr: 'x^2-4x+1', form: 'any' | 'expanded' | 'factored' | 'complete' | 'gcf' | 'simplified' | 'vertex'}` for an expression in variables.
    - `complete` means factored completely over the integers. Use it whenever the step says "factor" or "factor completely".
    - `gcf` means only the greatest common factor is taken out.
    - `factored` means any product, for partial steps like grouping.
  - `{eqn: 'y=2x+3', form: 'any' | 'solved'}` for an equation (correct up to scaling both sides)
  - `{set: ['2', '-3']}` for a solution set in any order; `[]` means "no solution"
  - `{interval: '(-inf,3]U(5,inf)'}` for intervals; typed inequalities are accepted too
  - `{point: ['2', '-3']}` for an ordered pair
  - `{complex: '3-2i', form: 'standard'}`
  
  Add a `label` like `'x ='`, `'slope ='` or `'area ='` when there are several fields or the answer needs naming.
- **Multiple choice:**
  - `E.choice(R, prompt, correct, [distractors], explain, {visual})` shuffles the options. Give 3 real distractors built from the wrong turns and common mistakes.
  - `E.choiceFixed(prompt, options, correctIndex, explain)` keeps a fixed order (up/down, positive/zero/negative).
  - `E.tf(...)` gives True/False.
  - Choices may be MathML (`M('y=2x+1')`) or SVG pictures.
- **Values** are plain ASCII math strings: `sqrt(3)`, `2pi/3`, `x^2`, `(x-1)(x+2)`, `3/4`, `-inf`, `2+i`.
- **Math in prompts:** `M('x^2-5x+6=0')` gives nicely typeset MathML. Relations `= < > <= >=` are fine inside M. **Always use M() for formulas.** Plain numbers can stay as text.
- **Helpers:**
  - `E.poly([a, b, c])` gives `'x^2-5x+6'` and drops 1s and 0s
  - `E.lin(r)` gives `'(x-3)'`
  - `E.surd(a, b)` simplifies a√b
  - `E.surdStr(p, q, r, d)` gives the reduced exact string for (p + q√r)/d
  - `E.fracStr(n, d)` gives a reduced fraction
  - `E.pt(ascii)` gives pretty plain text (√, ², −) for explanations
  - `E.value('2sqrt(3)')` gives [re, im]
  - `E.sameExpr(a, b)`
  - `E.words`, `E.plural`
- **Random:** `R.int(lo, hi)`, `R.pick(arr)`, `R.bool(p)`, `R.shuffle(arr)`, `R.sample(arr, k)`, `R.distinct(lo, hi, k)`. **Never use Math.random.**
- **Visuals:**
  - `V.graph({x:[lo,hi], y:[lo,hi], w, h, fns:[{f: x => …, color, dash, from, to, label}], points:[[x, y, 'A', open]], vlines:[{x}], hlines:[{y}], param:[{x: t => …, y: t => …, t:[a, b]}], shade:{f, g, from, to}, ticks, labels, xpi})`
  - `V.geo({pts:{A:[0,0], B:[4,0], C:[1,3]}, segs:[['A','B',{label:'5', ticks:1, dash}]], polys:[['A','B','C',{fill}]], circles:[{c:'O', r:2}], angles:[['B','A','C','40°'], ['A','C','B','',{right:true}]], rays, lines, text:[[x,y,'s']], hide:['O'], w})`. Coordinates are math coordinates with y pointing up. Use it for triangles, circles and every Era V figure.
  - `V.unitCircle(theta)`
  - Era III helpers: `V.numline`, `V.plane`, `V.svg`, `V.text` and so on.
  - A small data table: `<table class="dt"><tr><th>x</th><td>…</td></tr><tr><th>y</th><td>…</td></tr></table>` inside the prompt.

## Rules (the harness enforces most of these)
1. **Correct.** Compute the answer from the same numbers you show. Choose parameters so answers are clean when the step is meant to be clean: integer roots, nice slopes, triangles that exist. Guard every degenerate case (division by 0, equal roots when you need two, collinear points). Loop with `do … while` to re-pick. Make sure every loop terminates.
2. **Show the exact answer as it would be typed.** Validation runs `E.check(field, E.typed(field))` and must pass. Examples: set `form: 'factored'` only if the answer string really is a product; `vertex` form must be `a(x-h)^2+k`.
3. **Varied.** Each step should give at least 20 distinct questions in 300 seeds, and pure concept steps at least 6. Vary numbers, contexts, which quantity is asked, and orientation.
4. **Not guessable.** For Yes/No, True/False and up/down steps, balance the answers to about 50% (2 options) or 33% (3 options). Shuffled `E.choice` handles position.
5. **Steps climb.** a is the gentlest version of the idea, d the hardest or most applied. Follow the step text.
6. **Short wording.**
   - Prompts in one or two plain sentences. No lore or story needed.
   - Explanations in one or two sentences that show the key working, with numbers.
   - US spelling. Degrees as `°`. Ask for "exact answers" whenever you use `exact`, `set` with surds, or `pi`.
7. **"Undefined".** It's fine as math vocabulary ("the slope is undefined", "undefined at x = 2"). The validator only rejects leaked JavaScript values.
8. **Minus signs.** The core converts `-3` in plain text to `−3` automatically, so don't do that yourself.
   - Never write `x-term` as `x−term`.
   - In plain text, write inequalities with `M('x<3')` rather than a bare `<` followed by a letter.
9. **Units and House Rules.**
   - Where money or length contexts appear, you may read `O.coins` (US/THB) and `O.units` (metric/imperial) like the Era III units do. It's optional.
   - Never put `Math.random`, `Date` or `undefined` text in output.
10. **No new core functions.** If you truly need a helper, define it inside your unit file.

## Workflow
1. Read `u4_07.js`, `core4.js` (header plus the function list) and your spec.
2. Write the unit file.
3. Run `cd /home/claude/up && node harness4.js 300 <UNIT>`, e.g. `node harness4.js 300 IV.3` (use `V.3` for Era V). The filter matches ids by prefix, so run `IV.1.` rather than `IV.1` so it doesn't also catch IV.10–IV.15. Fix every CRASH, INVALID, ACCEPTS_WRONG, NONDETERMINISTIC, DUP_CHOICE_TEXT, GUESSABLE and MISSING_STEP. LOW_VARIETY is fine only for pure concept steps with at least 6 prompts.
4. Run `node dump4.js <UNIT> 3` and **read every sample like a strict math teacher**:
   - Is each marked answer truly correct?
   - Do the distractors differ from it?
   - Is the wording clear and the explanation right?
   
   Fix and repeat until clean. This eyes-on check matters as much as the harness.
5. Also run `node test-core.js` to be sure you didn't touch the core (it should print 0 failed).
6. Reply with only:
   - the harness summary line and any remaining flags with reasons
   - how many samples you read by eye
   - anything you were unsure about

## Era IV only: the brave steps e and f (the "master quest")
Every Era IV skill also gets two optional steps after d. A student only sees them once they have **proven** the skill (d planted). They choose "the brave path", or a teacher turns on Brave mode. Two right in a row earns each one. They never block progress. They are for fast finishers who need something genuinely hard.
- **e ★ Brave:** the skill with a twist. Pick one:
  - it needs a rearrangement first
  - it's combined with one earlier skill
  - it's run backwards (given the answer, find the setup)
  - there's a parameter ("for what k…")
  - it's a less familiar form
  
  One or two steps harder than d, but still clearly this skill.
- **f ★★ Legend:** competition flavor (AMC 10/12, UKMT, national olympiad first rounds), still auto-checkable. Examples:
  - "find all" or the full solution set
  - a parameter hiding in several places
  - a quadratic in disguise
  - an unusual setup that needs insight, not just longer arithmetic
  
  A strong student should need a minute of real thought. It must still be solvable by hand, with no calculator and no heavy computation.
- **Same rules as a–d.** Correct, varied (at least 20 distinct in 300 seeds), clean answers, the right answer kinds, short prompts, and explanations that show the key idea in one or two sentences.
- **Not just bigger numbers.** A harder idea, not more arithmetic.
- **Step names:** give each a short, honest title (`t`) that names the twist. Example from Quadratics:
  - IV.7.07 **e** "rearrange, then factor": (x+4)(x−3) = 8. **f** "a quadratic in disguise": x⁴ − 41x² + 400 = 0, including a version where one u-root is negative.
  - IV.7.11 **e** "find k for one root". **f** "a parameter everywhere": x² + (k−5)x − 3k + 7 = 0 has a repeated root → k = −3 or 1.
  - IV.7.15 **e** "rearrange first": x(x+7) > 3x + 5. **f** "true for every x": for which k is x² + kx + 25 ≥ 0 for every x?
- Read `IV.7.07`, `IV.7.11` and `IV.7.15` in `u4_07.js` for the code pattern: `e: { t: '…', g: R => … }, f: { t: '…', g: R => … }` after d.
- The harness checks e and f exactly like a–d, and prints "(info) N Era IV skills have no brave steps" until every skill has them. **An Era IV unit is finished only when that count is 0 for your unit.**

## Era V only: what's different
Era V is *Prove*: logic, geometry, trigonometry, conics, transformations, solids and constructions. Use `G.E5` (`const E = G.E5`). It inherits everything from E4. Units are `u5_NN.js` and specs are `specs/V.N.json`.

**Proof and reasoning questions.** Every question must stay auto-checkable, so never ask for free-typed prose. Use these forms:
- **Put the steps in order:** `E.order(R, prompt, steps, explain, {fixed, alts, visual})`.
  - `steps` are the lines in a correct order, for example `'∠1 = ∠3 (vertical angles)'`.
  - `fixed: 1` keeps the first line ("Given …") in place.
  - `alts` lists other accepted orders, as index arrays into `steps`, for when two lines could honestly swap. Think hard here: if two lines are independent, you must list the swapped order in `alts`, or a correct student is marked wrong.
  - Use 3–7 items. The student taps the lines in order.
- **Pick the reason:** show the proof so far, for example as a small two-column table (`<table class="dt">`), with one reason missing, then use `E.choice` with the reason as the answer. Build the distractors from real neighboring theorems, such as the converse, a similar-sounding postulate, or SSA.
- **Find the broken step:** number the lines and use `E.choiceFixed` with the line numbers. Exactly one step must be wrong, and the explanation must say why.
- **Which statement follows, is it valid, name the counterexample:** `E.choice` and `E.tf`, balanced as usual.
- **Numeric answers:** angle sizes, lengths, areas and trig values use the normal `E.num` fields.
  - Students may type units: "30°", "12 cm" and "4√3 units" are all accepted automatically.
  - Use `exact` for surds and π, and `ans` with `dp` for rounded answers.
  - Always say which you want: "exact", or "to 1 decimal place".

**Figures.** Use `V.geo` for triangles, polygons, circles, arcs, tangents and angle marks. Its segs take `{label, ticks, dash}`, and its angles take `[A, B, C, label, {right:true}]`. Use `V.graph` for coordinate geometry and conics (use `param` for circles and ellipses), and `V.unitCircle` for trig.
- **Draw to the numbers.** A figure must honestly match its numbers, so a 30° angle looks like 30°. If you can't draw it to scale, add the text "Not drawn to scale." to the prompt.
- **Mark what's given.** Equal sides get ticks, right angles get the square mark, and parallel lines are said in the prompt.
- **Vary the figure's orientation:** rotate or reflect the whole picture, and don't always put the base at the bottom.
- **No new core functions.** Define figure helpers inside your unit file, like a parallel-arrow mark or a 3-D box drawn in oblique projection.

**Brave and Legend in Era V: about a quarter of the skills.** Unlike Era IV, Era V does *not* give every skill e and f. In each branch, pick roughly 1 skill in 4, rounding up and at least 1 per branch, where a twist has real depth. Examples: angle chasing, similar triangles, circle theorems, trig identities, loci and area puzzles.
- **Legend:** classic competition geometry in the style of AMC 10/12 and UKMT Intermediate. A clever auxiliary line, a hidden similar triangle, "find the shaded area" or power of a point. Still solvable by hand, and still auto-checkable.
- Skills without e/f are fine. The harness only prints brave info for Era IV.

### Era V toolkit (use it, don't rebuild it)
`const K = E.K;` holds helpers promoted from the finished pilot units:
- **`K.fig(o)`:** V.geo with labels placed so they stay readable. `o` takes:
  - `pts`: points whose names start with `_` are hidden helpers.
  - `segs`: `[a, b, {ticks, dash, lab, side, at, ref}]`
  - `angles`: `[p, v, q, label, {right, n, r, tick, out, color}]`
  - `arrows`: parallel marks `[a, b, n, t]`
  - `text`: `[[x, y], s]`
  - `polys` and `w`
- **Triangles:** `K.triMarks`, `K.pairPts`, `K.pairFig` and `K.randTri`.
- **Geometry math:** `K.bySides(a, b, c)`, `K.byAngles(B, C, a)`, `K.circum`, `K.incen`, `K.cen3`, `K.foot`, `K.ang3`, `K.dist`, `K.mid`, `K.lerp`, `K.polar`, `K.add`, `K.sub`, `K.mul`, `K.unit`, `K.rad` and `K.dg`.
- **`K.spin(R, pts)`:** rotates or reflects a whole figure.
- **Letters:** `K.trio(R)` and `K.lets(R, k)` give point letters. `K.rnF(map)` and `K.renamePts` rename them.
- **`K.orderQ(R, prompt, lines, deps, explain, {fixed, visual})`:** a proof-ordering question. `deps[i]` lists the lines that line i needs, and every order that respects them is accepted. **Prefer this over raw `E.order` for proofs.**
  - Watch wording: a line that starts "Then…" reads as sequential even if it's independent. Word independent lines neutrally.
  - Put *all* the Givens first, using `fixed` = the number of Given lines.

**Finished examples:** `units/u5_01.js` (Logic & proof: ordering, pick-the-reason, broken step, truth tables) and `units/u5_03.js` (Triangles: figures, congruence proofs). Read the one closer to your unit.

**Look at your figures.** Put the SVG in a small HTML page, render it to PNG with Playwright (run from `/home/claude/app`, where `require('playwright')` works; Chromium is installed), and view the PNG with the Read tool. Check at least one figure per skill and every e/f figure. Does it match the numbers? Are the labels clear of each other, and does it fit the box?
- **`K.cfig(o)`:** circle figures (circles, highlighted arcs, shaded sectors, segments and rings, plus everything K.fig takes). See its comment in core4.js, and `units/u5_08.js` for many uses. Related helpers: `K.ang(c, p)`, `K.md`, `K.inter(A, B, C, D)` (line intersection).
- **`M()` / `E.mx` understands Greek letters and degrees:** `M('sin(θ)=1/2')`, `M('2α')`, `M('∠A=30°')`.
- **Intervals with surd endpoints** parse, for example `(15, 10sqrt(3))`.
