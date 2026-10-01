// Upper-era harness: node harness4.js [seeds=300] [filter]
const fs = require('fs'), vm = require('vm');
const unitArg = process.argv[3] || '', um = /^(IV|V)\.(\d+)/.exec(unitArg), only = um ? `u${um[1] === 'IV' ? 4 : 5}_${um[2].padStart(2, '0')}.js` : null;
for (const f of ['../lab/s2.js', 'core4.js', ...fs.readdirSync('units').filter(f => /^u[45]_\d\d\.js$/.test(f) && (!only || f === only)).sort().map(f => 'units/' + f)]) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
const N = +process.argv[2] || 300, filt = process.argv[3] || '';
const LIMIT = n => n === 2 ? 0.60 : n === 3 ? 0.50 : 0.45;
const out = { steps: {}, total: 0, problems: 0 };
const nearMiss = f => {
  const bump = s => { const v = E4.value(s); if (!v) return null; return String(+(v[0] + 1).toFixed(6)) + (Math.abs(v[1]) > 1e-9 ? (v[1] >= 0 ? '+' : '') + v[1] + 'i' : ''); };
  if (f.ans !== undefined) return String(f.dp !== undefined ? (f.ans + 3 * Math.pow(10, -f.dp)).toFixed(f.dp) : f.ans + 1);
  if (f.frac) return `${f.frac[0] + 1}/${f.frac[1]}`;
  if (f.exact !== undefined) return `(${f.exact})+1`;
  if (f.expr !== undefined) return `(${f.expr})+1`;
  if (f.eqn !== undefined) return f.eqn.replace('=', '=1+');
  if (f.set !== undefined) return f.set.length ? f.set.slice(1).concat([`(${f.set[0]})+1`]).join(', ') : '0';
  if (f.point !== undefined) return `(${f.point[1]}+1, ${f.point[0]})`;
  if (f.interval !== undefined) return /\d/.test(f.interval) ? f.interval.replace(/(-?\d+)/, m => String(+m + 1)) : (f.interval === '(-inf,inf)' ? '(0,1)' : '(-inf,inf)');
  if (f.complex !== undefined) return `(${f.complex})+i`;
};
for (const [ENG, era] of [[E4, 'IV'], [E5, 'V']]) for (const sk of ENG.skills) {
  if (filt && !sk.id.startsWith(filt)) continue;
  if (era === 'IV' && (!sk.steps.e || !sk.steps.f)) (out.noBrave = out.noBrave || []).push(sk.id);
  for (const k of 'abcdef') {
    if ('ef'.includes(k) && !sk.steps[k]) continue;
    const st = sk.steps[k], id = `${sk.id}.${k}`, r = { n: 0, issues: {}, samples: {}, prompts: new Set(), answers: new Set(), pos: {}, sets: {} };
    const flag = (code, msg, seed) => { r.issues[code] = (r.issues[code] || 0) + 1; out.problems++; (r.samples[code] = r.samples[code] || []).length < 3 && r.samples[code].push(seed + ': ' + String(msg).slice(0, 300)); };
    if (!st) { flag('MISSING_STEP', 'no step ' + k, 0); out.steps[id] = r; continue; }
    for (let seed = 1; seed <= N; seed++) {
      let q; r.n++; out.total++;
      const O = [{ coins: 'US', units: 'metric', clock: '12h' }, { coins: 'THB', units: 'imperial', clock: '24h' }][seed % 2];
      try { q = st.g(ENG.rng(seed), O); } catch (e) { flag('CRASH', e.message, seed); continue; }
      try { ENG.validate(q, id); } catch (e) { flag('INVALID', e.message, seed); continue; }
      if (seed <= 5) { const q2 = st.g(ENG.rng(seed), O); if (JSON.stringify(q) !== JSON.stringify(q2)) flag('NONDETERMINISTIC', '', seed); }
      r.prompts.add(q.prompt + (q.visual || '').length + (q.choices ? q.choices.slice().sort().join('|') : ''));
      if (q.kind === 'num') {
        r.answers.add(q.fields.map(f => E4.show(f)).join(';'));
        q.fields.forEach(f => { const w = nearMiss(f); if (w && E4.check(f, w) === true) flag('ACCEPTS_WRONG', `"${w}" accepted for ${E4.typed(f)} · ${q.prompt.replace(/<[^>]+>/g, '')}`, seed); });
      } else if (q.kind === 'order') {
        const strip = c => c.replace(/<[^>]+>/g, '').trim();
        r.prompts.add(q.items.slice().sort().join('|'));
        r.answers.add(q.ans.map(i => strip(q.items[i])).join(' > '));
        if (!ENG.checkOrder(q, q.ans)) flag('ACCEPTS_WRONG', 'correct order rejected', seed);
        const free = q.items.length - (q.fixed || 0);
        if (free >= 2) { let wrong = 0; for (let i = q.fixed || 0; i < q.items.length - 1; i++) { const sw = q.ans.slice(); [sw[i], sw[i + 1]] = [sw[i + 1], sw[i]]; if (!ENG.checkOrder(q, sw)) wrong++; } if (!wrong) flag('ACCEPTS_WRONG', 'every adjacent swap is accepted, so order does not matter', seed); }
        if (new Set(q.items.map(strip)).size !== q.items.length && !q.items.some(c => c.includes('<math'))) flag('DUP_CHOICE_TEXT', q.items.map(strip).join(' | '), seed);
      } else {
        const strip = c => c.replace(/<[^>]+>/g, '').trim(); r.answers.add(strip(q.choices[q.ans])); r.pos[q.ans] = (r.pos[q.ans] || 0) + 1;
        if (!q.choices.some(c => c.startsWith('<svg'))) { const key = q.choices.map(strip).sort().join(' | '); (r.sets[key] = r.sets[key] || {})[strip(q.choices[q.ans])] = ((r.sets[key] || {})[strip(q.choices[q.ans])] || 0) + 1; }
        if (!q.choices.some(c => c.startsWith('<svg') || c.includes('<math')) && new Set(q.choices.map(strip)).size !== q.choices.length) flag('DUP_CHOICE_TEXT', q.choices.map(strip).join(' | '), seed);
      }
    }
    // guessable: fixed option sets
    const JUDG = /^(yes|no|true|false|up|down|positive|negative|zero|rational|irrational|two|one|none|always|sometimes|never|linear|quadratic|exponential|increasing|decreasing|even|odd|neither|<|=|>)$/i;
    for (const [key, cnt] of Object.entries(r.sets)) { if (!key.split(' | ').every(o => JUDG.test(o))) continue; const tot = Object.values(cnt).reduce((a, b) => a + b, 0); if (tot < 60) continue; const n = key.split(' | ').length, top = Math.max(...Object.values(cnt)); if (top / tot > LIMIT(n)) flag('GUESSABLE', `${(100 * top / tot).toFixed(0)}% "${Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]}" of [${key}]`, 0); }
    // shuffled choices: position balance
    const posTot = Object.values(r.pos).reduce((a, b) => a + b, 0); if (posTot > 60 && Object.keys(r.sets).length === 0 && Math.max(...Object.values(r.pos)) / posTot > 0.6) flag('POSITION_BIAS', JSON.stringify(r.pos), 0);
    if (r.prompts.size < Math.min(20, N / 4)) flag('LOW_VARIETY', `${r.prompts.size} distinct prompts in ${N}`, 0);
    r.distinctPrompts = r.prompts.size; r.distinctAnswers = r.answers.size; delete r.prompts; delete r.answers;
    out.steps[id] = r;
  }
}
fs.writeFileSync('report4.json', JSON.stringify(out, null, 1));
const codes = {}; for (const [id, r] of Object.entries(out.steps)) for (const [c, n] of Object.entries(r.issues)) (codes[c] = codes[c] || []).push(id);
console.log(`generated ${out.total} questions in ${Object.keys(out.steps).length} steps`);
for (const [c, ids] of Object.entries(codes)) { console.log(`${c}: ${ids.length} steps`); ids.slice(0, 12).forEach(id => console.log('   ', id, (out.steps[id].samples[c] || [''])[0])); }
if (!Object.keys(codes).length) console.log('no problems');
if (out.noBrave && out.noBrave.length) console.log(`(info) ${out.noBrave.length} Era IV skills in this run have no brave steps (fine: about half keep them)`);
