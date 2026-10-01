// Scripted walkthrough in Chromium: node e2e.js  (screenshots → shots/)
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'); fs.mkdirSync('shots', { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' in {} ? undefined : undefined });
  const errors = [];
  const run = async (width, tag, dark) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
    page.on('pageerror', e => errors.push(tag + ' pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(tag + ' console: ' + m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    await page.goto('file://' + __dirname + '/mathera.html');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `shots/${tag}-1-welcome.png`, fullPage: true });
    await page.click('#ulist button[data-u="II.1"]');
    await page.screenshot({ path: `shots/${tag}-2-home.png`, fullPage: true });
    await page.click('#contBtn');
    // answer helper: right or wrong
    const answer = async (right) => page.evaluate((right) => {
      const q = window.__mathera.q();
      if (q.kind === 'choice') { const i = right ? q.ans : (q.ans + 1) % q.choices.length; document.querySelector(`.choice[data-i="${i}"]`).click(); }
      else q.fields.forEach((f, i) => { let v = f.expr !== undefined ? f.expr : f.frac ? `${f.frac[0]}/${f.frac[1]}` : String(f.ans); if (!right && i === 0) v = f.frac ? `${f.frac[0] + 1}/${f.frac[1]}` : f.expr !== undefined ? '0' : String(f.ans + 1); document.getElementById('f' + i).value = v; });
      document.getElementById('go').click();
      const fb = document.getElementById('fb');
      return { ok: !!fb.querySelector('.res.ok'), mode: window.__mathera.cur().mode, id: window.__mathera.cur().id, step: window.__mathera.cur().step, ev: [...fb.querySelectorAll('.ev')].map(x => x.textContent), msg: document.getElementById('msg').textContent };
    }, right);
    const log = [];
    for (let i = 0; i < 40; i++) {
      const r = await answer(i % 9 !== 4);
      log.push(r);
      if (i === 2) await page.screenshot({ path: `shots/${tag}-3-feedback.png`, fullPage: true });
      await page.click('#go');
    }
    await page.screenshot({ path: `shots/${tag}-4-question.png`, fullPage: true });
    const bad = log.filter((r, i) => r.ok !== (i % 9 !== 4) || r.msg);
    // open the calculator on a calc-allowed skill: focus a II.9 skill
    await page.click('#backBtn');
    await page.click('#upick button[data-u="II.9"]');
    await page.click('#upList .r[data-sk="II.9.06"]');
    await page.evaluate(() => { const b = document.getElementById('calcBtn'); if (b) b.click(); });
    for (const k of ['1', '2', '×', '4', 'enter']) await page.click(`#cpad button[data-c="${k}"]`);
    await page.screenshot({ path: `shots/${tag}-5-calc.png`, fullPage: true });
    await page.click('#backBtn');
    await page.screenshot({ path: `shots/${tag}-6-home-after.png`, fullPage: true });
    // time travel 10 days: planted leaves wither
    await page.evaluate(() => { const c = window.__mathera.clock; const base = Date.now(); c.now = () => base + 10 * 864e5; window.__mathera.renderHome(); });
    await page.screenshot({ path: `shots/${tag}-7-withered.png`, fullPage: true });
    const w = await page.evaluate(() => window.__mathera.MM.withered(window.__mathera.P()).length);
    await page.click('#contBtn');
    await page.screenshot({ path: `shots/${tag}-8-alarm.png`, fullPage: true });
    let ivOk = true;
    if (w) {
      await page.click('#alarmGo');
      for (let i = 0; i < 30; i++) {
        const r = await answer(i !== 1);
        if (i === 1) await page.screenshot({ path: `shots/${tag}-9-intervention.png`, fullPage: true });
        const done = await page.evaluate(() => !document.getElementById('savedCard').hidden);
        if (done) { await page.screenshot({ path: `shots/${tag}-10-saved.png`, fullPage: true }); break; }
        if (r.mode !== 'iv') { ivOk = false; break; }
        await page.click('#go');
      }
    }
    await page.click('#tabs button[data-v="id"]');
    await page.screenshot({ path: `shots/${tag}-11-id.png`, fullPage: true });
    await page.click('#tabs button[data-v="rules"]');
    await page.screenshot({ path: `shots/${tag}-12-rules.png`, fullPage: true });
    // the other eras
    const eraRuns = {};
    for (const [k, u] of [['I', 'I.1'], ['III', 'III.1']]) {
      await page.click('#tabs button[data-v="home"]');
      await page.click(`#eraTabs button[data-era="${k}"]`);
      await page.screenshot({ path: `shots/${tag}-13-${k}-welcome.png`, fullPage: true });
      await page.click(`#ulist button[data-u="${u}"]`);
      await page.click('#contBtn');
      const l2 = [];
      for (let i = 0; i < 14; i++) { const r = await answer(true); l2.push(r); if (i === 1) await page.screenshot({ path: `shots/${tag}-14-${k}-question.png`, fullPage: true }); await page.click('#go'); }
      await page.click('#backBtn');
      await page.screenshot({ path: `shots/${tag}-15-${k}-home.png`, fullPage: true });
      eraRuns[k] = { wrong: l2.filter(r => !r.ok).length, ids: [...new Set(l2.map(r => r.id))].join(' '), era: await page.evaluate(() => window.__mathera.era()) };
    }
    await page.click('#eraTabs button[data-era="II"]');
    const backII = await page.evaluate(() => ({ era: window.__mathera.era(), proven: window.__mathera.MM.counts(window.__mathera.P(), window.__mathera.clock.now()).proven }));
    console.log(tag, 'eras', eraRuns, 'back to II', backII);
    const hs = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(tag, { answered: log.length, mismatches: bad.length, sample: bad.slice(0, 3), withered: w, ivOk, horizontalScroll: hs, events: log.flatMap(r => r.ev).slice(0, 12) });
    await page.close();
  };
  await run(1100, 'desk');
  await run(390, 'phone');
  await run(390, 'dark', true);
  console.log('errors', errors);
  await browser.close();
})();
