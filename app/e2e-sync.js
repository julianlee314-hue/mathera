// Account-sync check with a mock db: paths must be valid, and a second device (empty localStorage) must restore progress.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const MOCK = `
(() => {
  const store = JSON.parse(sessionStorage.getItem('mockdb') || '{}');
  const persist = () => sessionStorage.setItem('mockdb', JSON.stringify(store));
  const bad = [];
  const doc = path => { const segs = path.split('/'); if (segs.length % 2) { bad.push(path); throw { code: 'invalid_argument', message: 'odd path ' + path }; }
    return { get: async () => ({ exists: path in store, data: () => JSON.parse(JSON.stringify(store[path])) }), set: async d => { store[path] = JSON.parse(JSON.stringify(d)); persist(); } }; };
  const db = { doc, collection: p => ({ add: async d => { store[p + '/' + Math.random()] = d; persist(); } }) };
  const user = { id: async () => 'u_test' };
  window.claude = { use: async n => (await new Promise(r => setTimeout(r, 50)), n === 'db' ? db : n === 'user' ? user : null) };
  window.__mock = { store, bad };
})();`;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.addInitScript(MOCK);
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'warning') errs.push(m.text()); });
  await page.goto('file://' + __dirname + '/mathera.html'); await page.waitForTimeout(400);
  await page.click('#ulist button[data-u="II.3"]');
  await page.click('#contBtn');
  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => { const q = window.__mathera.q();
      if (q.kind === 'choice') document.querySelector(`.choice[data-i="${q.ans}"]`).click();
      else q.fields.forEach((f, i) => document.getElementById('f' + i).value = f.expr !== undefined ? f.expr : f.frac ? `${f.frac[0]}/${f.frac[1]}` : String(f.ans));
      document.getElementById('go').click(); });
    await page.click('#go');
  }
  await page.waitForTimeout(5000);
  const r1 = await page.evaluate(() => ({ keys: Object.keys(window.__mock.store), bad: window.__mock.bad, saved: document.getElementById('savedHome').textContent, steps: Object.keys(window.__mathera.P().steps).length }));
  console.log('device 1:', r1);
  // device 2: same account, empty localStorage
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(800);
  const r2 = await page.evaluate(() => ({ view: ['welcome', 'home'].find(v => !document.getElementById('v-' + v).hidden), steps: Object.keys(window.__mathera.P().steps).length, start: window.__mathera.P().settings.start, inferred: window.__mathera.MM.counts(window.__mathera.P(), Date.now()).inferred, saved: document.getElementById('savedHome').textContent }));
  console.log('device 2:', r2, 'errors:', errs);
  await browser.close();
})();
