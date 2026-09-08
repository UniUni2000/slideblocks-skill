// Exercise the deployed product menus and the files they actually export.
// node scripts/check-demo-ui.mjs <base-url/> <playwright-dependency-root> <artifacts-dir>
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [base, dependencies, artifactsArg] = process.argv.slice(2);
if (!base || !dependencies || !artifactsArg) throw new Error('Expected base URL, dependency root, artifacts directory');
const { chromium } = createRequire(join(resolve(dependencies), 'package.json'))('playwright-chromium');
const artifacts = resolve(artifactsArg);
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const failures = [];
const external = [];
const origin = new URL(base).origin;
async function context(options = {}) {
  const result = await browser.newContext({ viewport: { width: 1600, height: 900 }, locale: 'en-US', ...options });
  await result.addInitScript(() => {
    window.__demoPrintCalls = 0;
    window.print = () => { window.__demoPrintCalls++; };
    document.addEventListener('securitypolicyviolation', event => {
      console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  result.on('page', page => {
    page.on('pageerror', error => failures.push(String(error)));
    page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
    page.on('request', request => {
      const url = new URL(request.url());
      if (['http:', 'https:'].includes(url.protocol) && (options.offline || url.origin !== origin)) external.push(url.href);
    });
  });
  return result;
}
async function menu(page) {
  await page.locator('#slide-container').click({ button: 'right', position: { x: 1400, y: 100 } });
  await page.locator('.z-context-menu').waitFor();
  await page.waitForTimeout(250);
  return page.locator('.z-context-menu');
}
async function exportHtml(page, name) {
  const popup = await menu(page);
  const downloaded = page.waitForEvent('download', { timeout: 60_000 });
  await popup.locator('[data-slideblocks-offline-export-label]').click();
  const download = await downloaded;
  assert.equal(await download.failure(), null);
  const file = join(artifacts, name);
  await download.saveAs(file);
  assert.match(await readFile(file, 'utf8'), /data-slideblocks-offline-player="true"/);
  return file;
}
try {
  const online = await context();
  const page = await online.newPage();
  await page.goto(new URL('#/1', base).href);
  await page.locator('#slide-container h1:visible').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const nativeMenu = await menu(page);
  for (const label of ['Show drawing toolbar', 'Show slide overview', 'Enter Presenter Mode', 'Enter fullscreen', 'Export PDF']) {
    assert(await nativeMenu.getByText(label, { exact: true }).isVisible(), `Missing menu: ${label}`);
  }
  assert(await nativeMenu.locator('[data-slideblocks-offline-export-label]').isVisible());
  await page.screenshot({ path: join(artifacts, 'context-menu.png') });
  await nativeMenu.getByText('Show drawing toolbar', { exact: true }).click();
  assert(await (await menu(page)).getByText('Hide drawing toolbar', { exact: true }).isVisible());
  await page.locator('.z-context-menu').getByText('Hide drawing toolbar', { exact: true }).click();
  await (await menu(page)).getByText('Enter fullscreen', { exact: true }).click();
  await page.waitForFunction(() => !!document.fullscreenElement);
  await (await menu(page)).getByText('Close fullscreen', { exact: true }).click();
  await page.waitForFunction(() => !document.fullscreenElement);
  await (await menu(page)).getByText('Enter Presenter Mode', { exact: true }).click();
  await page.waitForURL(/#\/presenter\/1/);
  await page.getByText('Speaker Notes', { exact: false }).first().waitFor();
  await page.screenshot({ path: join(artifacts, 'presenter.png') });
  await page.goto(new URL('#/1', base).href);
  await page.locator('#slide-container h1:visible').waitFor();
  await (await menu(page)).getByText('Show slide overview', { exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(artifacts, 'overview.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Go to next slide', exact: true }).click();
  await page.waitForURL(/#\/2$/);
  await page.getByRole('button', { name: 'Go to previous slide', exact: true }).click();
  await page.waitForURL(/#\/1$/);

  // A local text edit must survive export and remain private to this browser.
  const editedTitle = 'BEFORE THE IMAGE — LOCAL EDIT';
  await page.getByRole('heading', { name: 'BEFORE THE IMAGE', exact: true }).dblclick();
  await page.getByRole('heading', { name: 'BEFORE THE IMAGE', exact: true }).locator('[contenteditable]').fill(editedTitle);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('heading', { name: editedTitle, exact: true }).waitFor();
  const file = await exportHtml(page, 'demo-offline.html');
  const printMenu = await menu(page);
  const popup = page.waitForEvent('popup');
  await printMenu.getByText('Export PDF', { exact: true }).click();
  const print = await popup;
  await print.waitForFunction(() => document.documentElement.dataset.slideblocksPdfReady === 'true', { timeout: 60_000 });
  assert.equal(await print.evaluate(() => window.__demoPrintCalls), 1);
  assert.equal(await print.locator('#print-content .print-slide-container').count(), 11);
  assert(await print.getByRole('heading', { name: editedTitle, exact: true }).isVisible());
  const pdf = await print.pdf({ printBackground: true, preferCSSPageSize: true });
  assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length, 11);
  await writeFile(join(artifacts, 'demo.pdf'), pdf);
  await print.screenshot({ path: join(artifacts, 'print.png') });
  await print.close();

  const offline = await context({ offline: true, reducedMotion: 'reduce' });
  const copy = await offline.newPage();
  await copy.goto(`${pathToFileURL(file).href}#/1`);
  await copy.getByRole('heading', { name: editedTitle, exact: true }).waitFor();
  await copy.evaluate(() => document.fonts.ready);
  assert(await (await menu(copy)).getByText('Export PDF', { exact: true }).isVisible());
  await copy.keyboard.press('Escape');
  await copy.getByRole('button', { name: '1932: RADIO SIGNAL; Jansky rotating directional array', exact: true }).click();
  await copy.getByRole('heading', { name: 'A repeating radio excess fixed the signal to the sidereal sky.', exact: true }).waitFor();
  await copy.screenshot({ path: join(artifacts, 'offline-reduced-motion.png') });
  await exportHtml(copy, 'demo-offline-roundtrip.html');
  const pristine = await (await context()).newPage();
  await pristine.goto(new URL('#/1', base).href);
  await pristine.getByRole('heading', { name: 'BEFORE THE IMAGE', exact: true }).waitFor();
  assert.deepEqual(external, [], 'Unexpected network requests');
  assert.deepEqual(failures, [], 'Browser errors');
  console.log('PASS full menu, drawings toggle, fullscreen, presenter notes, overview, navigation, local editing, 11-page PDF, offline download, offline interaction, reduced motion, re-export, and browser isolation');
} finally {
  await browser.close();
}
