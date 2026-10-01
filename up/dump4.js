// node dump4.js IV.7 [n=2] — plain-text samples for eye review
const fs = require('fs'), vm = require('vm');
const unitArg = process.argv[2] || '', um = /^(IV|V)\.(\d+)/.exec(unitArg), only = um ? `u${um[1] === 'IV' ? 4 : 5}_${um[2].padStart(2, '0')}.js` : null;
for (const f of ['../lab/s2.js', 'core4.js', ...fs.readdirSync('units').filter(f => /^u[45]_\d\d\.js$/.test(f) && (!only || f === only)).sort().map(f => 'units/' + f)]) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
const unit = process.argv[2], n = +process.argv[3] || 2, ENG = unit.startsWith('V.') ? E5 : E4;
const mathText = h => h.replace(/<mfrac><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><\/mfrac>/g, '($1)/($2)').replace(/<msqrt>/g, '√(').replace(/<\/msqrt>/g, ')').replace(/<msup><mrow>(.*?)<\/mrow><mrow>(.*?)<\/mrow><\/msup>/g, '$1^$2');
const P = h => { let s = String(h); for (let k = 0; k < 4; k++) s = mathText(s); return s.replace(/<svg[\s\S]*?<\/svg>/g, m => '[' + ((/aria-label="([^"]*)"/.exec(m) || [])[1] || 'pic') + ']').replace(/<tr><th>(.)<\/th>/g, ' $1: ').replace(/<td>/g, ' ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2061;/g, '').replace(/\s+/g, ' ').trim(); };
for (const sk of ENG.skills.filter(s => s.id.startsWith(unit + '.'))) {
  console.log(`## ${sk.id} ${sk.name}`);
  for (const k of 'abcdef') { if (!sk.steps[k]) continue; console.log(` ${k}) ${'ef'.includes(k) ? (k === 'e' ? '★ BRAVE: ' : '★★ LEGEND: ') : ''}${sk.steps[k].t}`);
    for (let s = 1; s <= n; s++) { const q = sk.steps[k].g(ENG.rng(7 + s * 131), E4.OPTS);
      const a = q.kind === 'num' ? 'A: ' + q.fields.map(f => (f.label ? f.label + ' ' : '') + E4.show(f)).join(' ; ') : q.kind === 'order' ? 'ORDER: ' + q.ans.map((i, j) => (j + 1) + '. ' + P(q.items[i])).join('  ') + (q.alts ? `  (+${q.alts.length} other accepted order${q.alts.length > 1 ? 's' : ''})` : '') : 'C: ' + q.choices.map((c, i) => (i === q.ans ? '✔' : '') + P(c)).join(' | ');
      console.log(`   • ${P(q.prompt)}${q.visual ? ' ' + P(q.visual) : ''}\n     ${a}\n     E: ${P(q.explain)}`); } }
}
