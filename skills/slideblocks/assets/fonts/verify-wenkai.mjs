// Run from the deck directory, using the same Chromium installation as the workbench.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const [url, ...selectors] = process.argv.slice(2);
if (!url || !selectors.length) {
  throw new Error('Usage: node verify-wenkai.mjs <slide-url> <Chinese heading selector> [Chinese body selector ...]');
}
const requireFromDeck = createRequire(resolve('package.json'));
const { chromium } = requireFromDeck('playwright-chromium');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    // Query a Han-only run as well. A mixed heading could use WenKai solely for its digits.
    await element.evaluate(node => {
      document.querySelector('[data-sb-wenkai-probe]')?.remove();
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const run = walker.currentNode;
        const han = run.textContent.match(/\p{Script=Han}/gu);
        const range = document.createRange();
        range.selectNodeContents(run);
        if (!han || !range.getBoundingClientRect().width) continue;
        const probe = document.createElement('span');
        probe.dataset.sbWenkaiProbe = '';
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = 'position:fixed;left:-10000px;top:0;white-space:nowrap;opacity:0';
        const style = getComputedStyle(run.parentElement);
        for (const prop of ['font-family', 'font-size', 'font-style', 'font-weight', 'font-variation-settings']) {
          probe.style.setProperty(prop, style.getPropertyValue(prop));
        }
        probe.textContent = han.join('');
        document.body.appendChild(probe);
        return;
      }
      throw new Error('Expected a visible Chinese text run');
    });
    await page.evaluate(() => document.fonts.ready);
    const { root } = await cdp.send('DOM.getDocument');
    for (const target of [selector, '[data-sb-wenkai-probe]']) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: target });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      console.log(JSON.stringify({ selector, target, fonts }));
      if (!fonts.some(font => font.isCustomFont && font.postScriptName === 'LXGWWenKai-Regular' && font.glyphCount > 0)) {
        throw new Error('Expected bundled WenKai on ' + selector + ' (' + target + ')');
      }
    }
  }
} finally {
  await browser.close();
}
