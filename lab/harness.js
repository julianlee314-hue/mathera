// Mathera · Eras I–III correctness harness (plan item 1.1)
// Usage: node harness.js [seedsPerCombo] [defaultSeeds]
const fs = require('fs');
const {ENG,eraOf,CHECK,SHOW,COMBOS,plain,typed,Q,add,eq,val,fieldQ,choiceValue,solve,substCheck,evalExpr} = require('./harness-lib.js');
const N_COMBO = +process.argv[2] || 60;
const N_DEF = +process.argv[3] || 600;
/* ---------- main loop ---------- */
const ONLY = process.env.ONLY || '';
const skills = [...E1.skills, ...E2.skills, ...E3.skills].filter(sk => !ONLY || (sk.id + '.').startsWith(ONLY.endsWith('.') ? ONLY : ONLY + '.'));
const report = { meta: { seedsPerCombo: N_COMBO, defaultSeeds: N_DEF, combos: COMBOS.length, started: new Date().toISOString() }, steps: {} };
let total = 0;
const t0 = Date.now();
for (const sk of skills) for (const k of ['a', 'b', 'c', 'd', 'e', 'f'].filter(k => sk.steps[k])) {
  const st = sk.steps[k]; const id = `${sk.id}.${k}`; const E = ENG[eraOf(sk.id)];
  const r = { name: sk.name, step: st.t, n: 0, issues: {}, samples: {}, prompts: new Set(), answers: new Set(), pos: {}, nChoice: 0, optsSensitive: false, solved: 0, solvedOK: 0, explainHasAns: 0, numQs: 0, kinds: {} };
  const flag = (code, msg, seed, opts) => { r.issues[code] = (r.issues[code] || 0) + 1; if (!r.samples[code]) r.samples[code] = []; if (r.samples[code].length < 4) r.samples[code].push({ seed, opts: opts && `${opts.coins}/${opts.units}/${opts.clock}`, msg: String(msg).slice(0, 600) }); };
  const runs = [];
  COMBOS.forEach(o => { for (let s = 1; s <= N_COMBO; s++) runs.push([s, o]); });
  for (let s = N_COMBO + 1; s <= N_COMBO + N_DEF; s++) runs.push([s, COMBOS[0]]);
  const byOpts = {};
  for (const [seed, opts] of runs) {
    let q; r.n++; total++;
    try { q = st.g(E.rng(seed), Object.assign({}, opts)); } catch (e) { flag('CRASH', e.stack.split('\n').slice(0, 2).join(' | '), seed, opts); continue; }
    try { E.validate(q, id); } catch (e) { flag('INVALID', e.message, seed, opts); continue; }
    // determinism
    if (seed <= 5) { let q2; try { q2 = st.g(E.rng(seed), Object.assign({}, opts)); } catch (e) {} if (JSON.stringify(q) !== JSON.stringify(q2)) flag('NONDETERMINISTIC', 'same seed gave a different question', seed, opts); }
    // house-rules sensitivity (seed-matched)
    if (seed <= N_COMBO) { const key = seed; const sig = q.prompt + '|' + (q.choices || []).join('|') + '|' + JSON.stringify(q.fields || q.ans); if (byOpts[key] && byOpts[key] !== sig) r.optsSensitive = true; byOpts[key] = byOpts[key] || sig; }
    const P = plain(q.prompt);
    r.prompts.add(P + ' ' + (q.visual ? q.visual.length : ''));
    r.kinds[q.kind] = (r.kinds[q.kind] || 0) + 1;
    const ex = plain(q.explain);
    if (q.kind === 'num') {
      r.numQs++;
      r.answers.add(q.fields.map(f => SHOW(sk.id)(f)).join(';'));
      let exHit = true;
      q.fields.forEach((f, fi) => {
        const shown = SHOW(sk.id)(f), t = typed(plain(shown));
        const ok = CHECK(sk.id)(f, t);
        if (ok !== true) flag('ROUNDTRIP', `typing the shown answer "${t}" is marked ${ok === null ? 'unreadable' : 'wrong'} · field ${JSON.stringify(f)} · prompt: ${P}`, seed, opts);
        // reject a nearby wrong answer
        const fq = fieldQ(f);
        if (fq && f.expr === undefined) {
          const wrong = add(fq, Q(1));
          const wt = wrong.d === 1 ? String(wrong.n) : (Number.isInteger(val(wrong) * 1000) ? String(val(wrong)) : `${wrong.n}/${wrong.d}`);
          if (CHECK(sk.id)(f, wt) === true) flag('ACCEPTS_WRONG', `"${wt}" accepted for ${t}`, seed, opts);
        }
        if (f.label && f.expr === undefined && fq) {
          const L = plain(f.label).replace(/\s*=\s*\??\s*$/, '');
          if (/=\s*\??\s*$/.test(plain(f.label)) && /[+×÷*/·^]|\d\s*[−-]\s*\d/.test(L)) { const v = evalExpr(L);
            if (v) { r.solved++; if (eq(v, fq)) r.solvedOK++; else flag('SOLVER_MISMATCH', `label: "${plain(f.label)}" → solver ${v.n}/${v.d}, app says ${t} · prompt: ${P}`, seed, opts); } }
        }
        if (f.expr !== undefined && CHECK(sk.id)(f, '0') === true) flag('ACCEPTS_WRONG', `"0" accepted for expr ${f.expr}`, seed, opts);
        const bare = t.replace(/,/g, ''), exn = ex.replace(/−/g, '-').replace(/,(?=\d{3}\b)/g, '');
        if (!exn.includes(bare) && !(fq && exn.includes(String(val(fq))))) exHit = false;
      });
      if (exHit) r.explainHasAns++;
    } else {
      r.nChoice++; r.pos[q.ans] = (r.pos[q.ans] || 0) + 1;
      r.answers.add(plain(q.choices[q.ans]));
      const cs = q.choices.map(plain);
      if (!q.choices.some(c => c.includes('<svg')) && new Set(cs).size !== cs.length) flag('DUP_CHOICE_TEXT', `choices look identical once formatting is removed: ${cs.join(' | ')}`, seed, opts);
      if (!q.choices[q.ans].trim().startsWith('<svg') && !plain(q.choices[q.ans])) flag('EMPTY_ANSWER', 'correct choice has no text', seed, opts);
      const vs = q.choices.map(choiceValue);
      const cv = vs[q.ans];
      if (cv && cv.v && !/simplest|lowest terms|reduced?\b|improper|mixed number|in the form/i.test(P)) vs.forEach((x, k) => { if (k !== q.ans && x && x.v && eq(x.v, cv.v)) flag(x.tag === cv.tag ? 'EQUAL_VALUE_CHOICES' : 'EQUAL_VALUE_CHOICES_MIXED', `"${cs[q.ans]}" (right) and "${cs[k]}" (wrong) are the same number · prompt: ${P}`, seed, opts); });
    }
    // substitution check for "Solve …" equations
    const sc = substCheck(q);
    if (sc) { r.solved++; if (sc.every(x => x.ok)) r.solvedOK++; else flag('SOLVER_MISMATCH', 'substitution: ' + sc.filter(x => !x.ok).map(x => x.how).join(' ; ') + ' · prompt: ' + P, seed, opts); }
    // independent solver
    const sol = sc ? null : solve(q);
    if (sol) {
      r.solved++;
      let good = null;
      if (sol.want) { const fq = fieldQ(q.fields[0]); good = eq(fq, sol.want); if (!good) flag('SOLVER_MISMATCH', `${sol.kind}: "${sol.how}" → solver ${sol.want.n}/${sol.want.d}, app says ${SHOW(sk.id)(q.fields[0])} · prompt: ${P}`, seed, opts); }
      else if (sol.wantChoice) { good = plain(q.choices[q.ans]) === sol.wantChoice; if (!good) flag('SOLVER_MISMATCH', `compare: "${sol.how}" → solver ${sol.wantChoice}, app says ${plain(q.choices[q.ans])}`, seed, opts); }
      else if (sol.wantIndex !== undefined) { good = sol.wantIndex === q.ans; if (!good) flag('SOLVER_MISMATCH', `${sol.kind}: choices ${q.choices.map(plain).join(' | ')} → solver ${plain(q.choices[sol.wantIndex])}, app says ${plain(q.choices[q.ans])} · prompt: ${P}`, seed, opts); }
      if (good) r.solvedOK++;
    }
  }
  r.distinctPrompts = r.prompts.size; r.distinctAnswers = r.answers.size; delete r.prompts; delete r.answers;
  report.steps[id] = r;
}
report.meta.generated = total; report.meta.seconds = (Date.now() - t0) / 1000;
fs.writeFileSync(ONLY ? `report-${ONLY}.json` : 'report.json', JSON.stringify(report, null, 1));
if (ONLY) for (const [id, r] of Object.entries(report.steps)) { for (const [c, n] of Object.entries(r.issues)) console.log(`${id} ${c} ×${n}: ${(r.samples[c] || [])[0] ? r.samples[c][0].msg.slice(0, 200) : ''}`); if (r.distinctPrompts < 20) console.log(`${id} (info) ${r.distinctPrompts} distinct prompts`); }
// summary
const codes = {}; let solved = 0, solvedOK = 0, stepsWithSolver = 0;
for (const [id, r] of Object.entries(report.steps)) { for (const [c, n] of Object.entries(r.issues)) { codes[c] = codes[c] || { steps: 0, hits: 0 }; codes[c].steps++; codes[c].hits += n; } solved += r.solved; solvedOK += r.solvedOK; if (r.solved) stepsWithSolver++; }
console.log(`generated ${total} questions in ${report.meta.seconds}s`);
console.log(codes);
console.log(`solver checked ${solved} questions (${stepsWithSolver} steps), agreed on ${solvedOK}`);
