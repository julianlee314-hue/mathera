// v0.2 → v0.3 migration: an account saved by v0.2 (Era II only) and a device with v0.2 localStorage.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const V2SETTINGS = { v: 2, settings: { dial: 5, pace: 'steady', start: 'II.6' }, rules: { hero: 'kai', nemesis: 'rex', coins: 'THB', units: 'metric', clock: '12h', stories: 'on', sfx: 'on', sound: 'off' }, meta: { at: { 'II.5': 1790591283913 }, placed: true, pseudo: 'tgp4ipn01' } };
const V2UNIT = { at: 1790591283913, skills: { II_5_14: { inf: 1 }, II_5_15: { cur: 'd', due: 1790850483913, last: 1790591283913, miss: 0, sg: 1, top: 'd' } }, steps: { II_5_15_d: { n: 1, r: 1, st: 'p' } } };
const MOCK = (seed) => `(() => {
  const store = JSON.parse(sessionStorage.getItem('mockdb') || ${JSON.stringify(JSON.stringify(seed))});
  const persist = () => sessionStorage.setItem('mockdb', JSON.stringify(store));
  const doc = path => { if (path.split('/').length % 2) throw { code: 'invalid_argument' };
    return { get: async () => ({ exists: path in store, data: () => JSON.parse(JSON.stringify(store[path])) }), set: async d => { store[path] = JSON.parse(JSON.stringify(d)); persist(); } }; };
  window.claude = { use: async n => (await new Promise(r => setTimeout(r, 50)), n === 'db' ? { doc, collection: () => ({ add: async () => {} }) } : n === 'user' ? { id: async () => 'u1' } : null) };
  window.__mock = store;
})();`;
(async () => {
  const browser = await chromium.launch();
  // A: account has v0.2 data, fresh device
  let ctx = await browser.newContext(); await ctx.addInitScript(MOCK({ 'data/users/u1/settings': V2SETTINGS, 'data/users/u1/unit-II-5': V2UNIT }));
  await ctx.route(/fonts\./, r => r.abort());
  let page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + __dirname + '/mathera.html'); await page.waitForTimeout(1200);
  await page.click('#landPanels button[data-era="II"]');
  const a = await page.evaluate(() => { const M = window.__mathera; return { era: M.era(), view: ['welcome', 'home', 'land'].find(v => !document.getElementById('v-' + v).hidden), provenII: M.MM.proven(M.PS.II, 'II.5.15'), inf: M.MM.counts(M.PS.II, Date.now()).inferred, hero: document.getElementById('whoLine').textContent }; });
  await page.waitForTimeout(1200);
  const saved = await page.evaluate(() => ({ v: window.__mock['data/users/u1/settings'].v, placed: window.__mock['data/users/u1/settings'].meta.placed, start: window.__mock['data/users/u1/settings'].meta.start }));
  await page.click('#eraTabs button[data-era="III"]');
  const b = await page.evaluate(() => ({ era: window.__mathera.era(), view: ['welcome', 'home', 'land'].find(v => !document.getElementById('v-' + v).hidden) }));
  console.log('A account v0.2 →', a, saved, 'switch to III →', b);
  await ctx.close();
  // B: device has v0.2 localStorage, no account
  ctx = await browser.newContext(); await ctx.route(/fonts\./, r => r.abort());
  page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + __dirname + '/mathera.html');
  await page.evaluate(() => localStorage.setItem('mathera-v02', JSON.stringify({ v: 2, skills: { 'II.1.01': { top: 'd', sg: 0, due: Date.now() + 864e5, cur: 'd' } }, steps: { 'II.1.01.d': { st: 'p', n: 3, r: 3 } }, settings: { pace: 'gentle', dial: 7, start: 'II.1' }, rules: { hero: 'mei' }, meta: { placed: true, pseudo: 'tx', at: {} }, tele: {} })));
  await page.reload(); await page.waitForTimeout(500);
  await page.click('#landPanels button[data-era="II"]');
  const c = await page.evaluate(() => { const M = window.__mathera; return { era: M.era(), view: ['welcome', 'home', 'land'].find(v => !document.getElementById('v-' + v).hidden), proven: M.MM.proven(M.PS.II, 'II.1.01'), hero: document.getElementById('whoLine').textContent, v: JSON.parse(localStorage.getItem('mathera-v02') || '{}').v }; });
  console.log('B local v0.2 →', c, 'errors', errs);
  await browser.close();
})();
