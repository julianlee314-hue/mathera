// Every step of Eras I–III through the real page: render, type the shown answer (or pick the right choice), Check → must be correct.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await page.goto('file://' + __dirname + '/mathera.html'); await page.waitForTimeout(300);
  const N = +process.argv[2] || 3;
  const res = await page.evaluate(async (N) => {
    const M = window.__mathera, out = { n: 0, bad: [], built: 0, crash: [] };
    M.setEra('I'); document.querySelector('#ulist button').click(); // place so practice view works
    for (const E of [E1, E2, E3, ...(typeof E4 !== 'undefined' ? [E4, E5] : [])]) for (const sk of E.skills) for (const k of 'abcdef') if (sk.steps[k]) for (let r = 0; r < N; r++) {
      M.show('practice'); M.force(sk.id, k); const q = M.q(); out.n++;
      if (/failed to build/.test(q.prompt)) { out.crash.push(sk.id + '.' + k + ' ' + q.explain); continue; }
      if (q.kind === 'order') { for (const i of q.ans.slice(q.fixed || 0)) document.querySelector(`.opick[data-p="${i}"]`).click(); }
      else if (q.kind === 'choice') document.querySelector(`.choice[data-i="${q.ans}"]`).click();
      else {
        q.fields.forEach((f, i) => { const t = E.typed ? E.typed(f) : String((E.show || E2.show)(f)).split(' = ').pop().replace(/,/g, ''); document.getElementById('f' + i).value = t; });
      }
      document.getElementById('go').click();
      const ok = !!document.querySelector('#fb .res.ok');
      if (!ok) out.bad.push({ code: document.getElementById('qCode').textContent, msg: document.getElementById('msg').textContent, prompt: q.prompt.replace(/<[^>]+>/g, '').slice(0, 90) });
    }
    return out;
  }, N);
  console.log('questions', res.n, 'not marked right', res.bad.length, 'crashes', res.crash.length);
  console.log(res.bad.slice(0, 12), res.crash.slice(0, 5));
  console.log('page errors', errs.slice(0, 5));
  await browser.close();
})();
