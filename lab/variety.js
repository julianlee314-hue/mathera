const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
for (const f of ['s0.js','s1.js','s2.js','b1.js','b2.js','b3.js']) vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const N=+process.argv[2]||2400; const h=s=>crypto.createHash('md5').update(s).digest('hex').slice(0,10);
const out=[];
for(const E of [E1,E2,E3]) for(const sk of E.skills) for(const k of 'abcd'){ const full=new Set(), text=new Set(), noVis=new Set(); let vis=0;
  for(let s=1;s<=N;s++){ const q=sk.steps[k].g(E.rng(s),E1.OPTS); const ans=q.kind==='num'?JSON.stringify(q.fields):String(q.ans)+'|'+[...q.choices].sort().join('|');
    full.add(h(q.prompt+'#'+(q.visual||'')+'#'+ans)); if(q.visual||(q.choices||[]).some(c=>c.includes('<svg'))) vis++; else noVis.add(h(q.prompt+'#'+ans)); }
  out.push({id:`${sk.id}.${k}`,name:sk.name,t:sk.steps[k].t,distinct:full.size,visShare:vis/N,textOnlyDistinct:noVis.size});
}
fs.writeFileSync('variety.json',JSON.stringify(out,null,1));
const bands=[[0,10],[10,25],[25,50],[50,100],[100,500],[500,1e9]];
console.log('distinct questions per step (out of '+N+' draws):'); bands.forEach(([a,b])=>console.log(`  ${a}–${b===1e9?'∞':b}: ${out.filter(o=>o.distinct>=a&&o.distinct<b).length} steps`));
console.log('\nsteps with < 25 distinct questions:');
out.filter(o=>o.distinct<25).forEach(o=>console.log(`  ${o.id.padEnd(12)} ${String(o.distinct).padStart(3)} distinct · ${(o.visShare*100).toFixed(0)}% with pictures · ${o.name} › ${o.t}`));
