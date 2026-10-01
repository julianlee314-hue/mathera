# Brief: write Stone Library cards for new Mathera skills

Mathera is a free, minimalist math app with 1,111 skills. Each skill has a **stone**: one card with four depths, so the same idea can be read by a child, a student, someone who wants the proof, or a professor. You are writing cards for NEW skills. They must match the existing library's voice and accuracy exactly.

## Output
Write a JSON array to the output path you're given. One object per skill, in the same order as the input:
```json
{"id":"IV.14.03",
 "not":"…",
 "apples":{"stone":"…","text":"…","example":"…"},
 "class":{"stone":"…","text":"…","example":"…","env":"Definition"},
 "proof":{"stone":"…","text":"…","example":"…"},
 "professor":{"stone":"…","text":"…","example":"…"}}
```
Only use `env` where it truly fits. Allowed values: Definition, Theorem, Law, Principle, Axiom, Fact, Rule. Most cards have none.

## The depths
- **not**: the classic wrong turn, as one or two sentences with a concrete wrong example. It gets used as a real wrong answer in questions, so make it the mistake students actually make. Examples: "Don't add for 'and'. Two coins both heads is 1/2 × 1/2 = 1/4, not 1/2 + 1/2 = 1." or "The MVT needs its hypotheses. |x| on [−1, 1] has secant slope 0, but no point has f′ = 0: the corner breaks it."
- **apples** (a curious 10-year-old or a complete beginner):
  - No jargon and no symbols beyond simple numbers.
  - stone: ONE short, memorable sentence.
  - text: 2–4 short sentences built on an everyday picture.
  - example: one concrete everyday example.
- **class** (a good textbook):
  - stone: the rule, definition or formula, often as display math.
  - text: 2–4 sentences explaining it precisely, with conditions.
  - example: a short worked example with real numbers that you have checked.
- **proof** (why it's true):
  - stone: the key idea in one line.
  - text: a compact but complete argument or derivation.
  - example: a numeric illustration of the argument.
- **professor** (for experts):
  - stone: a striking deeper fact.
  - text: history, generalization or connections to other mathematics, in 2–4 sentences. It must be accurate: no invented history, names or dates. If unsure, choose a mathematical connection instead of history.
  - example: a sharp illustration.

## Style (copy this voice)
- Short sentences, plain words, no filler, no exclamation marks, and no "Great question"-style chatter.
- US spelling.
- Use the Unicode minus (−) and the times sign (×) in plain text.
- Every number must be right. Compute each example twice. Wrong math is the worst possible failure.
- Samples from the existing library:
  - apples.stone: "For two things both to happen, multiply their chances."
  - apples.text: "A car drives 120 miles in 2 hours: 60 miles an hour on average. Sometimes it went faster, sometimes slower. So at least once, the speedometer said exactly 60."
  - class.stone: "An inscribed angle is half the central angle on the same arc."
  - proof.stone: "Tilt the graph until its ends are level, and Rolle's theorem gives the MVT."
  - professor.text: "The rule isn't a theorem but the definition, and a delicate one: three events can be independent in pairs without being independent together."
- Cover the skill's four steps (a–d) across the card where natural. The card is about the whole skill.

## Math notation
Write math in a TeX subset: inline math as `\\( … \\)` and display math as `\\[ … \\]`. These are JSON strings, so backslashes are doubled in the file. A converter turns them into MathML. Supported:
- numbers and letters
- `+ - = < > ( ) [ ] | , ! '`
- `\\frac{a}{b}`, `\\sqrt{x}`, `\\sqrt[3]{x}`, `^{…}`, `_{…}`, `\\binom{n}{r}`
- `\\text{…}`, `\\mathrm{…}`, `\\mathbb{R}`
- `\\bar{x}`, `\\hat{p}`, `\\vec{v}`, `\\overline{…}`
- Greek letters: `\\alpha … \\omega`, `\\Sigma` and so on
- `\\sum`, `\\int`, `\\prod`, `\\lim`
- `\\sin \\cos \\tan \\sinh \\cosh \\tanh \\ln \\log \\exp \\max \\min`
- `\\cdot \\times \\div \\pm \\le \\ge \\ne \\approx \\to \\infty \\in \\cup \\cap \\subseteq \\emptyset \\forall \\exists \\neg \\mid \\ldots \\circ \\perp \\sim \\partial \\nabla \\quad \\,`
- `\\left( … \\right)` is allowed; left and right are dropped.

Nothing else: no `\\begin{…}`, no `\\over`, no `\\mathcal`, no `\\operatorname`. For P(A | B), write `P(A \\mid B)`. Write nPr as `{}^{n}P_{r}` or in words. Keep math short. Plain numbers in apples need no math markup.

After writing, validate with:
`cd /home/claude/rev && python3 check.py <your-output.json>`
It converts every field and fails on unknown commands or bad XML. Fix everything until it prints OK.
