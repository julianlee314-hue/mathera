// Guessable-answer check (rule agreed 2026-09-28)
// For "judgment" option sets (True/False, yes/no, <,=,>, even/odd, rational/irrational …) used across the engine:
//  - step level: no answer right more than LIMIT[n] of the time (2 options 55%, 3 options 45%, 4+ 40%), +5% sampling tolerance
//  - template level: a single prompt template (numbers stripped) must not always give the same answer (max 80%)
const fs = require('fs'), vm = require('vm');
for (const f of ['s0.js', 's1.js', 's2.js', 'b1.js', 'b2.js', 'b3.js']) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
const N = +process.argv[2] || 1500;
const strip = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '[pic]').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const LIMIT = n => n === 2 ? 0.55 : n === 3 ? 0.45 : 0.40, TOL = 0.05;
const all = [];
for (const E of [E1, E2, E3]) for (const sk of E.skills) for (const k of 'abcdef') if (sk.steps[k]) all.push([E, sk, k]);
// pass 1: which option sets are generic (appear in 3+ steps)
const setSteps = {}, data = {};
for (const [E, sk, k] of all) {
  const id = `${sk.id}.${k}`, qs = [];
  for (let s = 1; s <= N; s++) { const q = sk.steps[k].g(E.rng(s), E1.OPTS); if (q.kind !== 'choice') continue; const opts = q.choices.map(strip); if (opts.some(o => o.includes('[pic]'))) continue;
    const set = [...opts].sort().join(' | '); (setSteps[set] = setSteps[set] || new Set()).add(id);
    qs.push({ set, n: opts.length, ans: opts[q.ans], tmpl: strip(q.prompt).replace(/[−-]?\d[\d,./]*/g, '#').replace(/√#|#⁄#/g, '#').slice(0, 70) }); }
  data[id] = { qs, total: N, name: sk.name, t: sk.steps[k].t };
}
const JUDG = /^(true|false|yes|no|yes, it is|no, it is not|even|odd|<|=|>|≤|≥|rational|irrational|prime|composite|neither|proportional|not proportional|always|sometimes|never|more than #|less than #|equal to #|bigger than #|smaller than #|the same as #|a\.m\.|p\.m\.|morning|afternoon|evening|night|linear|nonlinear|not linear|increasing|decreasing|positive|negative|zero|a function|not a function|function|not a function|[a-d]|[fg]|same|different|bigger|smaller|greater|less|equal|more|fewer|it gets bigger|it gets smaller|it stays the same|it goes up|it goes down|mostly went up|mostly went down|stayed about the same|round up|round down|likely|unlikely|certain|impossible|even chance|fair|not fair|biased|not biased|possible|heavier|lighter|longer|shorter|taller|the same)$/i;
const generic = set => set.split(' | ').every(o => JUDG.test(o.replace(/[−-]?\d[\d,./]*/g, '#').trim()));
const out = [];
for (const [id, d] of Object.entries(data)) {
  const bySet = {};
  for (const q of d.qs) if (generic(q.set)) (bySet[q.set] = bySet[q.set] || []).push(q);
  for (const [set, qs] of Object.entries(bySet)) {
    if (qs.length < 60) continue;
    const cnt = {}; qs.forEach(q => cnt[q.ans] = (cnt[q.ans] || 0) + 1);
    const [top, c] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0], share = c / qs.length, n = qs[0].n;
    const missing = set.split(' | ').filter(o => !cnt[o]);
    if (share > LIMIT(n) + TOL) out.push({ id, kind: 'step', set, share, top, missing, n: qs.length, name: d.name, t: d.t });
    const byT = {}; qs.forEach(q => (byT[q.tmpl] = byT[q.tmpl] || []).push(q));
    for (const [tm, tq] of Object.entries(byT)) { if (tq.length < 40 || tq.length / d.total < 0.05) continue;
      const tc = {}; tq.forEach(q => tc[q.ans] = (tc[q.ans] || 0) + 1); const [tt, tn] = Object.entries(tc).sort((a, b) => b[1] - a[1])[0];
      if (tm.includes('#') && tn / tq.length > 0.8) out.push({ id, kind: 'template', set, share: tn / tq.length, top: tt, tmpl: tm, n: tq.length, name: d.name, t: d.t }); }
  }
}
fs.writeFileSync('guess.json', JSON.stringify(out, null, 1));
const ids = [...new Set(out.map(o => o.id))];
console.log(`${out.length} flags in ${ids.length} steps`);
for (const o of out) console.log(`${o.id.padEnd(12)} ${o.kind.padEnd(8)} ${(o.share * 100).toFixed(0).padStart(3)}% "${o.top}"  [${o.set}]${o.missing && o.missing.length ? ' never: ' + o.missing.join(', ') : ''}${o.tmpl ? '  · ' + o.tmpl : ''}`);
