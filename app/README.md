# Mathera v0.3 beta: source (Eras I–III)

Published as the **Mathera Beta** artifact (https://claude.ai/artifact/PfGMsA8aDmgW9yBSrWiG3J), capabilities `db` + `user`.

## Build
1. Get the engine: read the **Mathera Question Lab** artifact, split its scripts, and put `s0.js`, `s1.js`, `s2.js` (Eras I–III) and `s3.js` (stones) in `../lab/`.
2. Put these files in `app/`, then run `node build.js`. That inlines the three engines + stones + `mastery.js` + `app.js` into `template.html` and writes `mathera.html`.
3. Check:
   - `node test-mastery.js`: 41 rule tests and simulated learners.
   - `node e2e.js`: Chromium walkthrough at desktop, phone and dark widths, with screenshots in `shots/`.
   - `node allsteps.js 2`: every one of the 1,556 steps, rendered and answered through the real page.
   - `node e2e-sync.js`: mock-db account sync, second device restore.
   - `node e2e-migrate.js`: v0.2 account and device saves carry over.
4. Republish `mathera.html` to the artifact URL.

## Storage (per tester, private)
- `data/users/<uid>/settings`: `{v:3, settings:{pace,dial}, rules, meta:{placed:{I,II,III}, start:{era:unit}, era, pseudo, at}}`. v0.2 used `placed: true` and `settings.start`; `upgradeMeta` converts them.
- `data/users/<uid>/unit-II-5` (also `unit-I-3`, `unit-III-9`, …): `{at, skills:{II_5_03:{top,sg,due,cur,miss,inf,wilt}}, steps:{II_5_03_c:{st,k,n,r,sec,last}}}`. Dots in keys become `_`.
- A user doc path must have an even number of segments; `data/users/<uid>/units/x` is invalid.

## Shared (Claude reads these)
- `telemetry/<pseudonym>`: `{pace, dial, start, steps:{II_5_03_c:{t,r,s,fun,conf}}}`, where t = tried, r = right, s = total seconds.
- `bugs/*`: in-app reports with the question code.
