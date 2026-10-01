// Rule tests + simulated learners for mastery-lite. node test-mastery.js
const MM = require('./mastery.js');
const fs = require('fs'), vm = require('vm');
vm.runInThisContext(fs.readFileSync('../lab/s1.js', 'utf8'));
const ORDER = E2.skills.map(s => s.id);
const D = MM.DAY, T0 = Date.UTC(2026, 9, 1, 8);
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('FAIL', msg); } };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

/* ---- 1. dial factors ---- */
ok(near(MM.interval(0, 5), 1 * D), 'dial 5 first interval 1 day');
ok(near(MM.interval(0, 1), 5.0625 * D), 'dial 1 first interval ≈5 days');
ok(MM.interval(0, 10) < 0.14 * D && MM.interval(0, 10) > 0.12 * D, 'dial 10 first interval ≈3 h');
ok(near(MM.interval(6, 1), 365 * D), 'dial 1 longest gap capped at 1 year');
ok(near(MM.interval(6, 5), 180 * D), 'dial 5 longest 6 months');

/* ---- 2. planting ---- */
{
  const P = MM.create(ORDER, { pace: 'steady' }), S = MM.session(); let now = T0;
  const q = MM.next(P, S, now);
  ok(q.id === 'II.1.01' && q.step === 'b' && q.mode === 'learn', 'steady starts II.1.01 at b: ' + JSON.stringify(q));
  MM.answer(P, S, { id: 'II.1.01', step: 'b', mode: 'learn' }, true, 5, now);
  MM.answer(P, S, { id: 'II.1.01', step: 'b', mode: 'learn' }, true, 5, now);
  ok(MM.state(P, 'II.1.01', now) === 'growing', 'two right = growing');
  const ev = MM.answer(P, S, { id: 'II.1.01', step: 'b', mode: 'learn' }, true, 5, now);
  ok(ev.some(e => e.type === 'planted' && e.step === 'b'), 'third right plants b');
  ok(P.steps['II.1.01.a'].st === 'p', 'planting b plants a');
  ok(MM.curStep(P, 'II.1.01') === 'c', 'next step c');
  ok(P.skills['II.1.01'].due === now + D, 'due in 1 day');
  // a miss in the middle resets the run
  MM.answer(P, S, { id: 'II.1.01', step: 'c', mode: 'learn' }, true, 5, now);
  MM.answer(P, S, { id: 'II.1.01', step: 'c', mode: 'learn' }, false, 5, now);
  ok(P.steps['II.1.01.c'].k === 0, 'miss resets streak');
  const e2 = MM.answer(P, S, { id: 'II.1.01', step: 'c', mode: 'learn' }, false, 5, now);
  ok(e2.some(e => e.type === 'slid' && e.step === 'b'), 'steady: 2 misses slide c→b');
  // d plants a–c and proves
  for (let i = 0; i < 3; i++) MM.answer(P, S, { id: 'II.1.01', step: 'd', mode: 'learn' }, true, 5, now);
  ok(MM.proven(P, 'II.1.01') && P.steps['II.1.01.c'].st === 'p', 'd plants a–c, proven');
  ok(MM.state(P, 'II.1.01', now) === 'proven', 'state proven');
  ok(MM.state(P, 'II.1.01', now + D) === 'thirsty', 'thirsty at due');
  ok(MM.tick(P, now + 3.9 * D).length === 0, 'not withered within grace (3-day floor)');
  ok(MM.tick(P, now + 4.1 * D)[0] === 'II.1.01', 'withered after due + grace');
  ok(MM.state(P, 'II.1.01', now + 4.1 * D) === 'withered' && P.steps['II.1.01.d'].st === 's', 'withered drops to seed');
  ok(near(MM.grace(0, 10), 3 * D) && near(MM.grace(3, 10), 14 * D) && near(MM.grace(3, 1), 14 * 5.0625 * D), 'grace: dial 10 never faster than dial 5; dial 1 stretches');
}

/* ---- 3. intervention ---- */
{
  const P = MM.create(ORDER, { pace: 'steady' }); let now = T0;
  // plant d on 7 skills, then wither them all
  for (const id of ORDER.slice(0, 7)) { const S = MM.session(); for (let i = 0; i < 3; i++) MM.answer(P, S, { id, step: 'd', mode: 'learn' }, true, 5, now); }
  now += 10 * D; const w = MM.tick(P, now);
  ok(w.length === 7, '7 withered');
  const S = MM.session();
  ok(MM.alarmDue(P, S, true), 'alarm at session start');
  const iv = MM.startIntervention(P, S, now);
  ok(iv.leaves.length === 5, 'intervention capped at 5');
  let q = MM.next(P, S, now);
  ok(q.mode === 'iv' && q.step === 'c', 'starts one step below: ' + JSON.stringify(q));
  // leaf 1: right at c → d, miss → c (streak kept), right c → d, right d → saved (k=3, at d)
  const id1 = q.id;
  MM.answer(P, S, q, true, 5, now);                       // k1 → d
  let L = S.iv.leaves.find(l => l.id === id1); ok(L.step === 'd' && L.k === 1, 'climb to d');
  MM.answer(P, S, { id: id1, step: 'd', mode: 'iv' }, false, 5, now); ok(L.step === 'c' && L.k === 1, 'miss slides easier, streak kept');
  MM.answer(P, S, { id: id1, step: 'c', mode: 'iv' }, true, 5, now); ok(L.k === 2 && L.step === 'd', 'k2 → d');
  const ev = MM.answer(P, S, { id: id1, step: 'd', mode: 'iv' }, true, 5, now);
  ok(ev.some(e => e.type === 'saved') && MM.proven(P, id1), 'saved: replanted at d');
  ok(P.skills[id1].due === now + D, 'replanted leaf back on 1-day watering');
  // finish the others
  let guard = 0;
  while (MM.ivActive(S) && guard++ < 100) { const q2 = MM.next(P, S, now); MM.answer(P, S, q2, true, 5, now); }
  ok(!MM.ivActive(S) && S.saved.length === 5, 'all 5 saved');
  ok(MM.withered(P).length === 2, '2 still queued for the next intervention');
  ok(!MM.alarmDue(P, S, false), 'no alarm right after one');
  S.sinceIv = 12; ok(MM.alarmDue(P, S, false), 'alarm again after 12 normal questions');
  // a leaf that keeps missing gives up after 8 tries and rests
  const S2 = MM.session(); MM.startIntervention(P, S2, now);
  const bad = S2.iv.leaves[0].id; let g2 = 0;
  while (S2.iv.leaves[0].done === null && g2++ < 20) MM.answer(P, S2, { id: bad, step: S2.iv.leaves[0].step, mode: 'iv' }, false, 5, now);
  ok(S2.iv.leaves[0].done === 'resting' && g2 === 8 && !P.skills[bad].wilt, 'gives up after 8 misses, back to normal learning');
  ok(S2.iv.leaves[0].step === 'a', 'eased all the way to a');
}

/* ---- 4. placement + confirm ---- */
{
  const P = MM.create(ORDER, { pace: 'steady' }), S = MM.session(); const now = T0;
  MM.place(P, 'II.5');
  const inf = ORDER.filter(id => MM.state(P, id, now) === 'inferred').length;
  ok(inf === 12 + 15 + 15 + 12, 'units II.1–II.4 inferred: ' + inf);
  const qs = []; for (let i = 0; i < 5; i++) { const q = MM.next(P, S, now); qs.push(q); MM.answer(P, S, q, true, 5, now); }
  ok(qs[0].id.startsWith('II.5.01') && qs[0].mode === 'learn', 'learning starts in II.5');
  ok(qs[4].mode === 'confirm' && qs[4].id === 'II.4.12', 'every 5th question confirms the nearest inferred leaf');
  ok(MM.proven(P, 'II.4.12'), 'confirmed = proven, on watering');
  const q = { id: 'II.4.11', step: 'd', mode: 'confirm' }; MM.answer(P, S, q, false, 5, now);
  ok(MM.state(P, 'II.4.11', now) !== 'inferred', 'missed confirm → no longer inferred');
  const nxt = []; for (let i = 0; i < 3; i++) { const q2 = MM.next(P, S, now); nxt.push(q2.id); MM.answer(P, S, q2, true, 5, now); }
  ok(nxt.includes('II.4.11'), 'missed confirm joins the learning path: ' + nxt);
}

/* ---- 4b. brave steps ---- */
{
  const P = MM.create(ORDER, { pace: 'steady' }), S = MM.session(), now = T0, id = ORDER[0]; P.braveIds = new Set([id]);
  ok(!MM.braveOpen(P, id), 'brave closed before proving');
  for (let i = 0; i < 3; i++) MM.answer(P, S, { id, step: 'd', mode: 'learn' }, true, 5, now);
  ok(MM.braveOpen(P, id), 'brave opens when proven');
  let q = MM.next(P, S, now, id); ok(q.mode === 'brave' && q.step === 'e', 'tapping a proven leaf offers step e');
  MM.answer(P, S, q, true, 5, now); const ev = MM.answer(P, S, q, true, 5, now);
  ok(ev.some(e => e.type === 'brave' && e.step === 'e') && MM.braveEarned(P, id).e, 'two right in a row earns ★');
  q = MM.next(P, S, now, id); ok(q.step === 'f', 'then ★★ Legend');
  MM.answer(P, S, q, true, 5, now); MM.answer(P, S, q, false, 5, now); MM.answer(P, S, q, true, 5, now); ok(!MM.braveEarned(P, id).f, 'a miss resets the brave run');
  MM.tick(P, now + 400 * D); ok(MM.braveEarned(P, id).e, 'brave badges survive withering');
  const P2 = MM.create(ORDER, { pace: 'steady', brave: true }), S2 = MM.session(); P2.braveIds = new Set(ORDER);
  for (let i = 0; i < 3; i++) MM.answer(P2, S2, { id: ORDER[0], step: 'd', mode: 'learn' }, true, 5, now);
  const modes = []; for (let i = 0; i < 12; i++) { const q2 = MM.next(P2, S2, now); modes.push(q2.mode); MM.answer(P2, S2, q2, true, 5, now); }
  ok(modes.filter(m => m === 'brave').length >= 2, 'Brave mode mixes master-quest steps into Continue: ' + modes.join(','));
}

/* ---- 5. simulated learners ---- */
function learner(opts) {
  // p(right) = skill × step difficulty × memory decay since last success (strength grows with each spaced success)
  const P = MM.create(ORDER, { pace: opts.pace, dial: opts.dial }); MM.place(P, 'II.1');
  const mem = {}; let now = T0; const log = { days: [], q: 0, iv: 0, ivQ: 0, reviews: 0, learn: 0, lastProven: 0 };
  const pr = (q) => {
    const m = mem[q.id] || (mem[q.id] = { str: 2, last: null });
    const base = [0.95, 0.9, 0.85, 0.8][MM.STEPS.indexOf(q.step)] * opts.skill;
    if (m.last === null) return base * 0.85;
    const t = (now - m.last) / D; return base * Math.exp(-t / (m.str * 6)) * 0.9 + 0.05;
  };
  const day = (nq) => {
    const S = MM.session(); MM.tick(P, now);
    let atStart = true, dayIv = 0;
    for (let i = 0; i < nq; i++) {
      if (MM.alarmDue(P, S, atStart)) { MM.startIntervention(P, S, now); log.iv++; dayIv++; }
      atStart = false;
      const q = MM.next(P, S, now); const right = Math.random() < pr(q);
      if (q.mode === 'iv') log.ivQ++; else if (q.mode === 'review') log.reviews++; else log.learn++;
      MM.answer(P, S, q, right, 20, now); log.q++;
      const m = mem[q.id]; if (right) { if (m.last !== null && now - m.last > 0.5 * D) m.str *= 1.8; m.last = now; }
      now += 30e3;
    }
    const c = MM.counts(P, now); log.days.push({ c, iv: dayIv });
  };
  return { P, log, day, advance: d => { now += d * D; }, get now() { return now; } };
}
function run(label, opts, plan) {
  let seed = 12345; Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const L = learner(opts); const rows = [];
  for (const [kind, n, qs] of plan) {
    if (kind === 'play') for (let d = 0; d < n; d++) { L.day(qs); L.advance(1); }
    else { L.advance(n); }
    const c = MM.counts(L.P, L.now); rows.push(`${kind} ${n}d → proven ${c.proven} planted ${c.planted} thirsty ${c.thirsty} withered ${c.withered} growing ${c.growing}`);
  }
  // day one after the break
  console.log(`\n## ${label}`); rows.forEach(r => console.log('  ' + r));
  console.log(`  questions ${L.log.q}: learn ${L.log.learn}, review ${L.log.reviews}, intervention ${L.log.ivQ} in ${L.log.iv} interventions`);
  return L;
}
console.log(`rule tests: ${pass} passed, ${fail} failed`);

const P30 = [['play', 30, 30]];
run('Steady, dial 5, strong learner, 30 q/day for 30 days', { pace: 'steady', dial: 5, skill: 1 }, P30);
run('Gentle, dial 5, average learner', { pace: 'gentle', dial: 5, skill: 0.85 }, P30);
run('Intense, dial 5, strong learner', { pace: 'intense', dial: 5, skill: 1 }, P30);
run('Steady, dial 1 (sparse)', { pace: 'steady', dial: 1, skill: 0.95 }, P30);
run('Steady, dial 10 (loves repetition)', { pace: 'steady', dial: 10, skill: 0.95 }, P30);
const vac = run('VACATION: steady dial 5, 30 days play → 60 days away → 7 days back', { pace: 'steady', dial: 5, skill: 0.95 }, [['play', 30, 30], ['away', 60], ['play', 1, 30], ['play', 6, 30]]);
console.log('  first day back:', JSON.stringify(vac.log.days[30]), ' second day:', JSON.stringify(vac.log.days[31]));
const vac1 = run('VACATION at dial 1: same plan', { pace: 'steady', dial: 1, skill: 0.95 }, [['play', 30, 30], ['away', 60], ['play', 1, 30], ['play', 6, 30]]);
console.log('  first day back:', JSON.stringify(vac1.log.days[30]));
process.exitCode = fail ? 1 : 0;
