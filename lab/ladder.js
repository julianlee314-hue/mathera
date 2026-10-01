// 1.2 Difficulty ladder: measure how hard each step looks and flag skills whose a→d ladder dips or jumps.
const fs = require('fs'), vm = require('vm');
for (const f of ['s0.js', 's1.js', 's2.js', 'b1.js', 'b2.js', 'b3.js']) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
const N = +process.argv[2] || 400;
const strip = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<span class="fr"><sup>([^<]*)<\/sup>⁄<sub>([^<]*)<\/sub><\/span>/g, ' $1/$2 ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
function score(q) {
  const txt = strip(q.prompt) + ' ' + (q.kind === 'num' ? q.fields.map(f => f.frac ? `${f.frac[0]}/${f.frac[1]}` : f.expr || f.ans).join(' ') : strip(q.choices[q.ans] || ''));
  const nums = (txt.replace(/,(?=\d{3})/g, '').match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const mag = nums.length ? Math.log10(Math.max(...nums) + 1) : 0;
  const ops = (strip(q.prompt).match(/[+×÷=]|\s[−-]\s/g) || []).length;
  const frac = /\d\/\d|⁄/.test(txt) ? 1 : 0, neg = /[−-]\d/.test(txt) ? 1 : 0, dec = /\d\.\d/.test(txt) ? 1 : 0;
  const alg = /\b[a-z]\b/.test(strip(q.prompt).replace(/\b(a|I)\b/g, '')) && /[=+]/.test(strip(q.prompt)) ? 1 : 0;
  const fields = q.kind === 'num' ? q.fields.length : 0, words = strip(q.prompt).split(/\s+/).filter(Boolean).length;
  const S = mag + 0.4 * ops + 0.5 * frac + 0.5 * neg + 0.4 * dec + 0.5 * alg + 0.35 * Math.max(0, fields - 1) + words / 40 + (q.kind === 'num' ? 0.3 : 0);
  return { S, mag, ops, frac, neg, dec, alg, fields, words };
}
const out = [];
for (const E of [E1, E2, E3]) for (const sk of E.skills) {
  const row = { id: sk.id, name: sk.name, steps: {} };
  for (const k of 'abcd') { const ss = []; for (let s = 1; s <= N; s++) ss.push(score(sk.steps[k].g(E.rng(s), E1.OPTS))); row.steps[k] = { t: sk.steps[k].t, S: med(ss.map(x => x.S)), mean: ss.reduce((a, x) => a + x.S, 0) / ss.length, mag: med(ss.map(x => x.mag)) }; }
  const v = 'abcd'.split('').map(k => row.steps[k].mean);
  row.dips = []; row.jumps = [];
  for (let i = 1; i < 4; i++) { const d = v[i] - v[i - 1]; if (d < -0.35) row.dips.push(`${'abcd'[i - 1]}→${'abcd'[i]} ${d.toFixed(2)}`); if (d > 1.6) row.jumps.push(`${'abcd'[i - 1]}→${'abcd'[i]} +${d.toFixed(2)}`); }
  row.range = v[3] - v[0];
  out.push(row);
}
fs.writeFileSync('ladder.json', JSON.stringify(out, null, 1));
const dips = out.filter(r => r.dips.length), jumps = out.filter(r => r.jumps.length);
console.log(`skills ${out.length}; with a dip ${dips.length}; with a big jump ${jumps.length}; a harder than d overall ${out.filter(r => r.range < 0).length}`);
for (const r of dips.sort((x, y) => Math.min(...x.dips.map(s => parseFloat(s.split(' ')[1]))) - Math.min(...y.dips.map(s => parseFloat(s.split(' ')[1]))))) console.log('DIP ', r.id, r.name, '|', r.dips.join(', '), '|', 'abcd'.split('').map(k => `${k}:${r.steps[k].mean.toFixed(1)} ${r.steps[k].t}`).join(' · '));
for (const r of jumps) console.log('JUMP', r.id, r.name, '|', r.jumps.join(', '), '|', 'abcd'.split('').map(k => `${k}:${r.steps[k].mean.toFixed(1)} ${r.steps[k].t}`).join(' · '));
