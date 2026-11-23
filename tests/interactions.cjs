/* Run with Node and Playwright installed: node tests/interactions.cjs
 * PLAYWRIGHT_MODULE can point to an existing Playwright installation.
 * BASE_URL can target the deployed site instead of the local build.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
let server;

async function startServer() {
  server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    try {
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}/`;
}

async function checkSite(browser, url, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CU && !document.documentElement.classList.contains('cu-wait'));
  const chapters = await page.locator('section.ch').evaluateAll(nodes => nodes.map(node => node.id));
  let clicks = 0;
  const click = async locator => { await locator.click(); clicks++; };
  const hidden = () => page.waitForFunction(() => document.querySelector('.lb').hidden);
  const imageIs = src => page.waitForFunction(expected => document.querySelector('.lb-i').src === expected, src);

  for (const language of ['en', 'zh']) {
    await click(page.locator(`#l-${language}`));
    assert.equal(await page.locator('html').getAttribute('lang'), language === 'en' ? 'en' : 'zh-CN');
    for (const id of chapters) {
      await click(page.locator('#menu-open'));
      await click(page.locator(`#menu-list [data-go="${id}"]`));
      await page.waitForFunction(id => Math.abs(document.getElementById(id).getBoundingClientRect().top - 64) < 3, id);
      assert.equal(await page.locator('#menu').evaluate(el => el.classList.contains('open')), false);
    }
    await click(page.locator('#menu-open'));
    await click(page.locator('#menu-close'));
    assert.equal(await page.locator('#menu').evaluate(el => el.classList.contains('open')), false);
    await click(page.locator('#menu-open'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#menu').evaluate(el => el.classList.contains('open')), false);
    if (viewport.width >= 1280) {
      for (const id of chapters) {
        await click(page.locator(`#rail [data-go="${id}"]`));
        await page.waitForFunction(id => Math.abs(document.getElementById(id).getBoundingClientRect().top - 64) < 3, id);
      }
    }
    for (const summary of await page.locator('details:not([open]) > summary').all()) await click(summary);
    for (let theme = 0; theme <= 6; theme++) {
      await click(page.locator(`#iv-flt [data-n="${theme}"]`));
      assert.equal(await page.locator(`#iv-flt [data-n="${theme}"]`).getAttribute('aria-pressed'), 'true');
      assert.ok(await page.locator('#iv-cl .cr').count() > 0);
      if (!theme) assert.equal(await page.locator('#iv-cl .cr').count(), 26);
    }
    for (let mode = 0; mode <= 1; mode++) {
      await click(page.locator(`#in-seg [data-m="${mode}"]`));
      assert.equal(await page.locator('#ins').evaluate(el => el.classList.contains('task')), Boolean(mode));
    }
    for (let mode = 0; mode <= 2; mode++) {
      await click(page.locator(`#aw-seg [data-m="${mode}"]`));
      assert.equal(await page.locator('.awp:not([hidden])').getAttribute('data-m'), String(mode));
      for (const source of await page.locator(`.awp[data-m="${mode}"] img[data-lb]`).all()) {
        await click(source);
        await imageIs(await source.getAttribute('src').then(src => new URL(src, url).href));
        await click(page.locator('.lb-x'));
        await hidden();
      }
    }
    await click(page.locator('#copy'));
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'katherinelin0292@gmail.com');
  }

  // Every photo must open its own image, move in both directions, zoom and close.
  // Real pointer clicks detect CSS overlap between X and next (the original bug).
  await click(page.locator('#aw-seg [data-m="0"]'));
  const photos = page.locator('img[data-lb]:not(.awp[hidden] img)');
  for (const source of await photos.all()) {
    if (!await source.isVisible()) continue;
    const group = await source.getAttribute('data-lb');
    const sources = await page.locator(`img[data-lb="${group}"]`).evaluateAll(nodes => nodes.filter(node => !node.closest('[hidden]')).map(node => node.src));
    const src = await source.evaluate(node => node.src);
    const index = sources.indexOf(src);
    await click(source);
    await imageIs(src);
    await page.waitForFunction(() => document.querySelector('.lb-i').complete && document.querySelector('.lb-i').naturalWidth > 0);
    assert.equal(await page.locator('.lb button').evaluateAll(buttons => buttons.every(button => {
      if (getComputedStyle(button).visibility === 'hidden') return true;
      const rect = button.getBoundingClientRect();
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === button;
    })), true, 'Lightbox controls must have separate click targets');
    if (sources.length > 1) {
      await click(page.locator('.lb-n'));
      await imageIs(sources[(index + 1) % sources.length]);
      await click(page.locator('.lb-p'));
      await imageIs(src);
      await click(page.locator('.lb-p'));
      await imageIs(sources[(index + sources.length - 1) % sources.length]);
      await page.keyboard.press('ArrowRight');
      await imageIs(src);
    } else {
      assert.equal(await page.locator('.lb-p').isVisible(), false);
      assert.equal(await page.locator('.lb-n').isVisible(), false);
    }
    await click(page.locator('.lb-i'));
    assert.equal(await page.locator('.lb-i').evaluate(el => el.classList.contains('z')), true);
    await click(page.locator('.lb-x'));
    await hidden();
    assert.equal(await page.locator('html').evaluate(el => el.style.overflow), '');
  }
  const first = page.locator('img[data-lb="kit"]').first();
  await first.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.lb').isVisible(), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'lb-p');
  await page.keyboard.press('Escape');
  await hidden();
  assert.equal(await first.evaluate(el => el === document.activeElement), true);
  await click(first);
  await page.locator('.lb-box').click({ position: { x: 2, y: 2 } });
  await hidden();
  await click(page.locator('.top .word'));
  await page.waitForFunction(() => window.scrollY === 0);

  // Open each reference in a new tab; stub only the destination document so this
  // checks the site's click behavior independently of a publisher's network policy.
  for (const link of await page.locator('.refs a').all()) {
    const href = await link.getAttribute('href');
    const external = new URL(href);
    assert.equal(external.protocol, 'https:');
    await context.route(href, route => route.fulfill({ body: 'Reference destination', contentType: 'text/plain' }));
    const popupPromise = page.waitForEvent('popup');
    await click(link);
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(), href);
    await popup.close();
  }
  assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
  console.log(`PASS ${viewport.width}×${viewport.height}: ${clicks} pointer clicks, both languages, chapter navigation, controls, images and references`);
  await context.close();
}

(async () => {
  const url = process.env.BASE_URL || await startServer();
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  try {
    await checkSite(browser, url, { width: 1440, height: 900 });
    await checkSite(browser, url, { width: 390, height: 844 });
    const motion = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await motion.goto(url);
    await motion.locator('#menu-open').click();
    await motion.locator('#menu-list li:last-child button').click();
    await motion.waitForFunction(() => Math.abs(document.getElementById('c-rigour').getBoundingClientRect().top - 64) < 3);
    await motion.locator('#rail [data-go="c-probe"]').click();
    await motion.waitForFunction(() => Math.abs(document.getElementById('c-probe').getBoundingClientRect().top - 64) < 3);
    for (const summary of await motion.locator('details:not([open]) > summary').all()) await summary.click();
    await motion.locator('img[data-lb="kit"]').nth(1).click();
    await motion.locator('.lb-n').click();
    await motion.waitForFunction(() => document.querySelector('.lb-i').src.endsWith('/img/draft-stickers.jpg'));
    await motion.locator('.lb-p').click();
    await motion.waitForFunction(() => document.querySelector('.lb-i').src.endsWith('/img/photo05.jpg'));
    await motion.locator('.lb-x').click();
    await motion.waitForFunction(() => document.querySelector('.lb').hidden);
    console.log('PASS normal motion: first deep jump, animated rail and close/previous/next');
    await motion.close();
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    await page.goto(url);
    await page.locator('#menu-open').click();
    await page.locator('#menu-list li:last-child button').click();
    await page.waitForFunction(() => Math.abs(document.getElementById('c-rigour').getBoundingClientRect().top - 64) < 3);
    console.log('PASS 844×390: final menu item remains clickable in landscape');
    await page.close();
  } finally {
    await browser.close();
    if (server) server.close();
  }
})().catch(error => { console.error(error); if (server) server.close(); process.exitCode = 1; });
