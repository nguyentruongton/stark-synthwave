import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.toString());
    console.error('STACK:', err.stack);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' }).catch(e => console.log('goto error', e));
  await browser.close();
})();
