const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
(async () => {
  const b = await chromium.launch(), errs = [];
  for (const [w, tag, dark] of [[390, 'phone', false], [1100, 'desk', false], [390, 'dark', true]]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: dark ? 'dark' : 'light' }); p.on('pageerror', e => errs.push(e.message));
    await p.route(/fonts\./, r => r.abort());
    await p.goto('file://' + __dirname + '/mathera.html'); await p.waitForTimeout(300);
    await p.click('#welTabs button[data-era="IV"]');
    await p.screenshot({ path: `shots/up-${tag}-1-welcome.png`, fullPage: true });
    await p.click('#ulist button[data-u="IV.7"]');
    await p.screenshot({ path: `shots/up-${tag}-2-home.png`, fullPage: true });
    // force a set question and type with the keypad
    await p.evaluate(() => { window.__mathera.show('practice'); window.__mathera.force('IV.7.10', 'c'); });
    const f = await p.evaluate(() => window.__mathera.q().fields[0].set); await p.click('#f0'); await p.keyboard.type(f[0].replace('sqrt(', '').replace(/\)(?=[^)]*$)/, '').split('+')[0] + '+');
    await p.click('.mkeys button[data-mk="√"]'); await p.keyboard.type(f[0].split('sqrt(')[1] + ', ' + f[1].replace('sqrt', '√'));
    await p.screenshot({ path: `shots/up-${tag}-3-typing.png`, fullPage: true });
    await p.click('#go'); await p.screenshot({ path: `shots/up-${tag}-4-feedback.png`, fullPage: true });
    await p.evaluate(() => { window.__mathera.force('IV.7.15', 'd'); });
    await p.click('#f0'); await p.keyboard.type('x <= 2 or x > 5');
    await p.click('#go'); await p.screenshot({ path: `shots/up-${tag}-5-interval.png`, fullPage: true });
    await p.evaluate(() => { window.__mathera.force('IV.7.02', 'd'); });
    await p.screenshot({ path: `shots/up-${tag}-6-graphs.png`, fullPage: true });
    const hs = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth); console.log(tag, 'hscroll', hs);
    await p.close();
  }
  console.log('errors', errs); await b.close();
})();
