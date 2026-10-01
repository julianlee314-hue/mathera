const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///home/claude/guide/guide.html'); await p.waitForTimeout(500);
  await p.pdf({ path: '/home/claude/guide/Mathera-Curriculum-Guide.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-family:Carlito,sans-serif;font-size:8px;color:#999;padding:0 17mm;display:flex;justify-content:space-between"><span>Mathera Curriculum Guide · Beta</span><span class="pageNumber"></span></div>' });
  await b.close();
})();
