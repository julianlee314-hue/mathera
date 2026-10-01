// Text dump of sample questions for eye review: node dump.js II.1 [seeds=2]
const fs = require('fs'), vm = require('vm');
for (const f of ['s0.js', 's1.js', 's2.js', 'b1.js', 'b2.js', 'b3.js']) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
const rep = fs.existsSync('report.json') ? require('./report.json') : { steps: {} };
const unit = process.argv[2], n = +process.argv[3] || 2;
const E = { I: E1, II: E2, III: E3 }[unit.split('.')[0]], show = E.show || E2.show;
const svgText = v => { const t = [...v.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]).filter(x => x.trim()); const lab = (/aria-label="([^"]*)"/.exec(v) || [])[1] || 'picture'; return `[${lab}${t.length ? ': ' + t.slice(0, 14).join(' ') + (t.length > 14 ? ' …' : '') : ''}]`; };
const P = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, m => svgText(m)).replace(/<span class="fr"><sup>([\s\S]*?)<\/sup>⁄<sub>([\s\S]*?)<\/sub><\/span>/g, '($1/$2)').replace(/<(var|span) style="[^"]*overline[^"]*">([^<]*)<\/(var|span)>/g, '‾$2').replace(/<sup>([^<]*)<\/sup>/g, '^$1').replace(/<br\s*\/?>/g, ' / ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
for (const sk of E.skills.filter(s => s.id.startsWith(unit + '.'))) {
  console.log(`## ${sk.id} ${sk.name}`);
  for (const k of 'abcdef') { if (!sk.steps[k]) continue; const BL = {e: '★ BRAVE ', f: '★★ LEGEND '}[k] || '';
    const auto = (rep.steps[`${sk.id}.${k}`] || {}).solved ? ' [auto-checked]' : '';
    console.log(` ${k}) ${BL}${sk.steps[k].t}${auto}`);
    for (let s = 1; s <= n; s++) {
      const seed = 7 + s * 131, q = sk.steps[k].g(E.rng(seed), E1.OPTS);
      const vis = q.visual ? ' ' + svgText(q.visual) : '';
      const a = q.kind === 'num' ? 'A: ' + q.fields.map(f => (f.label ? P(f.label) + ' ' : '') + show(f)).join(' ; ') : 'C: ' + q.choices.map((c, i) => (i === q.ans ? '✔' : '') + P(c)).join(' | ');
      console.log(`   • ${P(q.prompt)}${vis}\n     ${a}\n     E: ${P(q.explain)}`);
    }
  }
}
