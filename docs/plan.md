# Eras I–III: finish-and-prove plan
*Written 2026-09-28*

**Goal:** Eras I–III are complete, correct, connected and tested with real learners before any Era IV work begins.
**Unit:** a "run" is one working session with Claude.
**Estimate:** 50 planned runs plus 10 buffer, so about 60.

## How to resume in a fresh session
1. Read `claude/status.md` and this plan. The **next unchecked Beta track item** is the next job.
2. The engine lives inside the **Mathera Question Lab** artifact. Read it with the Artifact tool (`path: "index.html"`), then split its `<script>` blocks into files: 0 = Era I, 1 = Era II, 2 = Era III, 3 = stones, 4 = the page UI. The v0.1 app is the **Mathera** artifact.
3. **The beta app is the Mathera Beta artifact** (https://claude.ai/artifact/PfGMsA8aDmgW9yBSrWiG3J). Its source is in `claude/app/`: `mastery.js` for the rules, `app.js` and `template.html` for the page, and `build.js` to assemble it. See `claude/app/README.md` to build, test and republish.
4. The tools are in `claude/tools/`:
   - `harness.js` + `harness-lib.js`: the full correctness run
   - `guess.js`: the guessable-answer rule
   - `ladder.js` and `variety.js`
   - `dump.js`: text samples for eye review
5. Read beta data from the Mathera Beta artifact with `ArtifactData list`:
   - `telemetry`: per-step tried, right, seconds, fun and confusing counts
   - `bugs`: in-app reports with question codes
   
   Also read any flags left on the **Era II Review Sheet** (`flags`). Fix them, then mark each one fixed.
6. After any engine change: run the harness and `guess.js`, then republish both the Question Lab and the Beta. The Beta inlines the engine, so rebuild it. Add a row to the run log.

## Working decisions
*Your calls are marked **(you)**. Claude's defaults are marked **(default)**; overrule any time.*
- **Beta era (default):** Era II first.
- **Calculator (default):**
  - Sounds: a mix of woodsy rewards (marimba, chimes, leaves) and an adding-machine tape (burr, ka-ching).
  - Answers pass from the tape by click *and* drag.
  - Era I never has a calculator.
  - One shared calculator serves both the app and the Calculator add-on.
  - **Beta policy:** the calculator stays locked on fact skills (II.2.03–06, II.3.04–05, II.4.10, III.1.04–07 and III.4.04–06). It's always open in II.9, II.10, III.8 and III.9. Anywhere else, it unlocks once that skill is proven by hand.
- **Withering and Intervention (you, 2026-09-28):**
  - A withered leaf goes all the way back to **seed**.
  - Replanting takes **3 correct in a row**, right then and there.
  - When leaves wither, the app goes into **INTERVENTION**, a playful alarm mode ("YOUR GARDEN IS DYING, REGROUP!"). It focuses 100% on gently watering the wilted leaves, starting easy, then returns to normal. Replanted leaves go back into the review queue.
  - *Claude's refinements (default), as built in the beta:*
    - At most 5 leaves per Intervention.
    - Each leaf starts one step below where it was. A right answer climbs one step; a miss slides one step easier and keeps the drops. A leaf is saved at 3 right, with the last one at its original step.
    - After 8 tries without saving, a leaf "rests" and rejoins normal learning.
    - Withered leaves beyond the 5 wait for the next Intervention: at the next Continue, or after 12 normal questions.
- **Watering timing (default, placeholder until R1):**
  - Leaves are watered at 1 day, 3 days, 1 week, 2 weeks, 1 month, 3 months and 6 months, times 1.5^(5 − dial), capped at 1 year.
  - Only the leaf's top planted step carries the schedule, since planting a step plants the easier ones too.
  - **Wilting grace** is the leaf's own interval, but never less than 3 days (so a weekend can't kill a leaf) and never shorter than at dial 5 (so dial 10 means more watering, not faster dying).
  - A thirsty leaf more than halfway to wilting jumps ahead of new material, whatever the pace.
- **Pace presets (default):**
  - **Gentle** starts skills at step a, slides after 1 miss and gives 40% new material. Hints show the stone.
  - **Steady** starts at b, slides after 2 misses and gives 60% new.
  - **Intense** starts at c, slides after 2 misses and gives 80% new.
- **Placement-lite (default):** the tester picks a starting unit, and earlier skills become inferred. Every 5th question is a step-d check on the nearest inferred leaf. Right means proven, back on watering; wrong puts it on the learning path.
- **Brave levels (you, 2026-09-29):** Era IV (and V) get two extra steps, e and f, "only for the brave". They are an **optional bonus**: proven still means d is planted. e and f add a gold rim or star to the leaf and are worth 16 and 32 points. They stay off Continue unless a Brave mode is on. They'll be **built after Eras IV and V have a–d**, in one pass.
- **Two dials, both kept (you, 2026-09-28):**
  - **Pace** controls how fast new skills arrive.
  - **Watering** runs 1–10: 5 = Memrise (verified in R1), 1 = sparsest, 10 = most frequent.
  - Names and display get workshopped with real students.
- **Beta hosting: open decision.** See the spec's ⚠ section. Kids can't hold Claude accounts. The recommendation is an adult-account first beta, then our own hosting before any wider launch with kids.

## Beta track (the shortest path to students poking at it)
1. ~~**1.8** eyes-on review for the beta era~~ *(Era II done)*
2. **1.7** reading level *(only needed if Era I kids are in; skip for an Era II beta)*
3. ~~**3.1** engine in the app, with progress and first-try logging~~ *(runs 1–3 done 2026-09-28 in one session, see run log)*
   - Remaining (run 4): the tester walkthrough and polish from the user's first play. The ideas list: seed visibility on the tree, a leaf-tap zoom, Era II "In stone" review, and "confusing" follow-up questions.
4. ~~**2.2-lite** mastery~~ *(built inside 3.1: `claude/app/mastery.js`, 41 rule tests, simulated learners)*
5. ~~**2.3-lite** pick where to start~~ *(built inside 3.1)*
6. **3.4** in-app bug report plus a one-tap fun/confusing reaction: *built into the beta* (collections `bugs` and `telemetry`). Still needed: a small reader tool to summarise them. ← **next small item**
7. **3.5-lite** phone and tablet basics: *390 px, dark mode and no horizontal scroll were checked by script.* Still needed: a real-device check.
8. **3.6** Calculator v2 ← **next big item**
9. **4.2** the pilot kit, then invite testers *(needs the hosting decision)*

## Queued for after the Era I–III marathon
- [ ] **R1 Spaced-repetition deep dive → PDF.** Research how Memrise plants and waters memories: several correct answers in a row to "plant", then reviews at growing intervals. Verify the real schedule and algorithm from sources. Compare it with the wider research (spacing, retrieval practice, interleaving) and with math-specific systems (for example implicit review through prerequisites). Judge how well each piece fits math. Then:
  - Set the **watering dial's** ten settings, with 5 = Memrise.
  - Check the **Intervention** design against the evidence, including the vacation finding in the run log.
  - Recommend Mathera's planting and withering schedule for 1,111 skills and 4,444 steps.
  - Deliver as a PDF. *(2 runs.)* This feeds the full **2.2 mastery model**.

## Phase 0 · Housekeeping (1 run)
- [x] 0.1 Put a status doc in this Project and fix the stale numbers in the Mathera skills doc (1) — *done 2026-09-28*

## Phase 1 · Audit what exists (14 runs)
- [x] 1.1 **Correctness harness** (2) — *done 2026-09-28: 3.7M questions, 0 wrong answers, 2 bugs fixed. `claude/qa/1.1-correctness-report.md`*
- [x] 1.2 **Difficulty ladder** (2) — *static pass done: no true inversions. The real check is first-try success per step, now logged in the beta.*
- [x] 1.3 **Variety and guessable answers** (1) — *done: 45 steps rebalanced, 6 banks widened. `claude/qa/1.2-1.3-ladder-variety-report.md`*
- [ ] 1.4 **Curriculum gap check** against Common Core K–7, Thai and UK standards, before prerequisites lock the list. (2)
- [ ] 1.5 **Stones ↔ questions:** each stone matches its questions; each "wrong turn" becomes a real distractor. (2)
- [ ] 1.6 **House Rules:** money, length and clock obey the toggles; baht denominations are real. (1)
- [ ] 1.7 **Reading level** for Era I read-aloud, plus the typing notes from 1.1. (1)
- [ ] 1.8 **Eyes-on review** (3, one per era) — *also where the steps the re-solver can't read get their math checked*
  - [x] Era II — *done 2026-09-28: 1,080 questions read, 0 wrong answers, about 20 wording and display fixes, plus the Review Sheet with saved flags. `claude/qa/1.8-era2-review.md`*
  - [ ] Era III
  - [ ] Era I

## Phase 2 · Structure (13 runs)
- [ ] 2.1 **Prerequisite graph** for all 389 skills: no loops, orphans or unreachable skills; drawn. (4) — *the beta uses skill order as the path*
- [ ] 2.2 **Mastery model:** "proven", inference, withering and Intervention, and both dials, as a spec plus a simulation. (3) — *2.2-lite is built and simulated; the full version waits for R1*
- [ ] 2.3 **Placement:** a short adaptive "where do I start" check. (2)
- [ ] 2.4 **Points balance.** (1)
- [ ] 2.5 **Era peak tests** for Eras I, II and III. (3)

## Phase 3 · Build it into the app (10 runs, plus the calculator)
- [x] 3.1 **Wire the engine into the app:** real leaves, a real ID card, progress that saves, first-try success logged per step. (4) — *all 389 skills are in the Mathera Beta v0.3, with an era switcher*
- [ ] 3.2 **Zoom toggle** in House Rules. (1)
- [ ] 3.3 **ID card PDF export.** (2)
- [ ] 3.4 **Bug log:** question-code reports land in one shared log. (1) — *writing is done; the reader is still to do*
- [ ] 3.5 **Accessibility and devices.** (2)
- [ ] 3.6 **Calculator v2:** Simple/Scientific toggle, printing tape with click-and-drag answer passing, sounds and rewards. (2–3)

## Phase 4 · Prove it (8 runs)
- [ ] 4.1 **Simulated learners:** includes a "back from a vacation" learner, to see how big Intervention gets. (2) — *first pass done in `test-mastery.js`, see the run log*
- [ ] 4.2 **Human pilot kit.** (1)
- [ ] 4.3 **Fix pass.** (3)
- [ ] 4.4 **Final check** with the tools in `claude/tools/`. (2)

## Strategy sessions (4 runs)
- [ ] After Phase 1
- [ ] After Phase 2
- [ ] After Phase 3
- [ ] After Phase 4 (the go/no-go on Era IV)

## Gate: ready for Era IV when…
- [ ] Zero wrong answers across all 1,556 steps *(automated part passes; eye check done for Era II, Eras I and III to come)*
- [ ] Every ladder climbs from a to d *(pilot success data)*, and no step's pool is small enough to memorize *(done)*
- [ ] Curriculum gap list is closed
- [ ] Every skill has prerequisites, and the graph has no loops or orphans
- [ ] Mastery, withering and pacing spec is agreed and simulated
- [ ] Placement check lands simulated learners within one unit of their true level
- [ ] Era I, II and III peak tests are built
- [ ] All 389 skills are playable in the app, progress saves, and the ID card exports to PDF
- [ ] Works on a phone, in dark mode and with read-aloud, and is color-blind safe
- [ ] At least 5 real people have used it, and their top issues are fixed
- [ ] Bug log is empty, or holds only low-priority items
- [ ] Lessons are written down as a template for building Era IV

## Run log
| Date | Items | Runs used | Notes |
|---|---|---|---|
| 2026-09-28 | 0.1, 1.1 | 1 | 1.1 came in under its 2-run estimate. Question Lab republished with 2 fixes. |
| 2026-09-28 | 1.2, 1.3 + guessable fix | 1 | 45 steps rebalanced, 6 banks widened, full harness re-run clean. Question Lab v5. |
| 2026-09-28 | 1.8 Era II | 1 | Every Era II step read by eye. About 20 wording and display fixes. Review Sheet with saved flags. Question Lab v6. |
| 2026-09-28 | 3.1 spec | — | Read the v0.1 app; wrote the build spec with mastery-lite rules, data model, telemetry and the hosting decision. |
| 2026-09-28 | 3.1 runs 1–3, 2.2-lite, 2.3-lite, most of 3.4 | 1 | **Mathera Beta v2 published.** Details below. |

**2026-09-28 · 3.1 runs 1–3 · what shipped:**
- All 135 Era II skills are on a generated tree: 10 unit branches, and a unit panel you open by tapping a branch.
- Plant, water and wither, with both dials, INTERVENTION (alarm screen, drops and "Garden saved") and placement-lite.
- An ID card with unit bars, 10 Era II inventions, and the v0.1 tape calculator (with its lock policy).
- Sound effects, bug reports, fun/confusing reactions and telemetry.
- Private saves per unit, with a second-device restore tested against a mock db.
- **Checks:** 41 rule tests pass. A 40-question Chromium walkthrough at desktop, phone and dark widths showed no answer mismatches and no page errors.
- **Found and fixed:**
  - Per-unit doc paths had an odd segment count, so they were invalid. They're now `data/users/<uid>/unit-II-5`.
  - The `hidden` attribute CSS was missing.
  - Plural wording.
- **Simulation findings** (`claude/qa/3.1-sim-output.txt`):
  1. At first, dial 10 withered leaves every day, and so did Intense pace, which starved reviews. Two fixes cured both: the grace floor, and the urgent-review jump. After them, 30 days of daily play gave no Interventions at any dial or pace.
  2. **Vacation:** after 30 days of play and 60 days away, about 32 of 37 proven leaves wither. Recovery takes about a week, with an Intervention at the start of each session. This is the design working as specified. It's a lot of alarm, so flag it for R1 and the pilot.
| 2026-09-28 | Eras I and III in the Beta | 1 | **Mathera Beta v0.3 published** (you asked to switch eras). Details below. |

**2026-09-28 · Eras I and III in the Beta · what shipped:**
- An era switcher (I · II · III) above the tree. Each era has its own tree, starting unit, saved progress and inventions (7 + 10 + 9). Pace and watering are shared across eras.
- A **Read aloud** button on every question.
- v0.2 saves carry over: Era II progress stays, and the other eras start at "where should your tree start growing?".
- **Checks:**
  - Every one of the 1,556 steps was rendered and answered through the real page, twice each: 3,112 questions, all marked right, 0 crashes.
  - A walkthrough across all three eras at desktop, phone and dark widths.
  - Account restore on a new device (now loaded in parallel, with an "Opening your garden…" screen) and v0.2 migration.
- **Still open for these eras:** 1.8 eyes-on reading for Eras III and I, and 1.7 reading level for Era I. Era I is "try it yourself" quality until those are done.
| 2026-09-28 | Eras IV–VII scope check + revision | 1 | **Stone Library v5 published: 1,132 skills.** Details below. |

**2026-09-28 · Eras IV–VII scope check and revision · what changed:**
- **Scope check:** the report is `claude/qa/scope-check-4-7.md`.
- **Julius's decisions:**
  - High-school statistics and probability go on the main path. That's three new units: IV.14 Counting & probability, IV.15 Data & distributions and VI.11 Statistical inference, 31 skills in all.
  - Mechanics gets a small unit: VI.12, with 9 skills.
  - Vectors stay in Era VII.
  - The six enrichment skills become field trips.
- **The revised list** (`claude/specs/eras-4-7-skills.md`, v2) has 743 skills:
  - 25 cut, mostly repeats of Era III
  - 6 moved to field trips (their stones are kept in `claude/stones/field-trip-stones.json`)
  - 12 small gaps added: hyperbolic functions, full induction, sets, quantifiers, Vieta, modulus graphs, complex loci, iteration, polynomial identities, series solutions, Cauchy–Euler, inverse hyperbolic
  - 31 statistics and probability skills, plus 9 mechanics
  - Renumbered once; the old-to-new map is in `claude/specs/eras-4-7-v1-v2-map.md`.
- **Stones:**
  - All 52 new skills have cards at every depth, plus the classic wrong turn. Every number was checked in Python.
  - The sources are in TeX (`claude/stones/new-stones-4-7-tex.json`) and are converted to the library's MathML by `claude/tools/texml.py`. The writing brief is `claude/tools/stone-brief.md`.
  - The Stone Library now holds **1,132 skills**: 389 in Eras I–III plus 743 in Eras IV–VII.
- **Still to do:**
  - Add the six field trips to the Field Trips artifact.
  - The "Mathera skills" doc still says 1,111.
  - Next on the roadmap is **answer engine v2** (`claude/specs/eras-4-7-roadmap.md` step 2).
