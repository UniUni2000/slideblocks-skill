// Render one Mermaid source file to the final inline SVG of the diagram:mermaid route.
// pele runs in a real browser so labels are measured with the deck's loaded fonts.
//
//   node .slideblocks/render-mermaid.mjs diagrams/A07.mmd --out components/A07.svg \
//     --width 1152 --font-family 'Arial, "PingFang SC", sans-serif' [--font-size 26] [--font-css style.css]
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const RENDERER = 'pele';
const FONT_TYPES = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };

const escapeAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export function finalizeSvg(svg, { type, version }) {
  const root = svg.match(/^<svg\b[^>]*>/u)?.[0];
  if (!root || !root.includes(' viewBox="')) throw new Error('Renderer output has no SVG root with a viewBox.');
  if (!type) throw new Error('Renderer output does not name its diagram type.');
  if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/u.test(version)) throw new Error(`Renderer version is not exact: ${version}`);
  const width = root.match(/\swidth="([\d.]+)"/u)?.[1];
  const height = root.match(/\sheight="([\d.]+)"/u)?.[1];
  if (!width || !height) throw new Error('Renderer output has no natural size.');
  const attributes = [
    'data-slideblocks-mermaid="final"',
    `data-mermaid-renderer="${RENDERER}"`,
    `data-mermaid-version="${version}"`,
    `aria-roledescription="${escapeAttribute(type)}"`,
    'preserveAspectRatio="xMidYMid meet"'
  ].join(' ');
  const sized = root
    .replace(/\s(?:width|height)="[^"]*"/gu, '')
    .replace(/style="(?:max-width:100%;)?(?:height:auto;)?/u, `style="display:block;width:100%;height:100%;max-width:${width}px;max-height:${height}px;`);
  return svg.replace(root, sized.replace(/^<svg\b/u, `<svg ${attributes}`));
}

export function inlineFontUrls(css, baseDirectory, read = readFileSync) {
  return css.replace(/url\(\s*(['"]?)(?!data:|https?:)([^'")]+)\1\s*\)/gu, (_, quote, path) => {
    const file = resolve(baseDirectory, path.split(/[?#]/u)[0]);
    const type = FONT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
    return `url(data:${type};base64,${read(file).toString('base64')})`;
  });
}

async function renderInBrowser(source, options, css) {
  const require = createRequire(import.meta.url);
  const { chromium } = await import('playwright-chromium');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}</style><body></body>`);
    await page.addScriptTag({ path: require.resolve('pele/global') });
    return await page.evaluate(async ({ source, options }) => {
      await document.fonts.load(`${options.fontSize}px ${options.fontFamily}`, source);
      await document.fonts.ready;
      const { svg, type, mermaidType } = window.pele.render(source, options);
      return { svg, type: mermaidType ?? type };
    }, { source, options });
  } finally {
    await browser.close();
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      width: { type: 'string' },
      'font-family': { type: 'string' },
      'font-size': { type: 'string', default: '26' },
      'font-css': { type: 'string' }
    }
  });
  const [sourcePath] = positionals;
  const maxWidth = Number(values.width);
  const fontSize = Number(values['font-size']);
  if (!sourcePath || !values.out || !(maxWidth > 0) || !(fontSize > 0) || !values['font-family']) {
    throw new Error('Usage: render-mermaid.mjs <source.mmd> --out <file.svg> --width <region px> --font-family <css font list> [--font-size 26] [--font-css <file>]');
  }
  const require = createRequire(import.meta.url);
  const { version } = JSON.parse(readFileSync(require.resolve('pele/package.json'), 'utf8'));
  const source = readFileSync(sourcePath, 'utf8');
  const fontCss = values['font-css'];
  const css = fontCss ? inlineFontUrls(readFileSync(fontCss, 'utf8'), dirname(resolve(fontCss))) : '';
  const options = { fontFamily: values['font-family'], fontSize, maxWidth };
  const { svg, type } = await renderInBrowser(source, options, css);
  const final = finalizeSvg(svg, { type, version });
  writeFileSync(values.out, final);
  writeFileSync(`${values.out}.receipt.json`, `${JSON.stringify({
    source: sourcePath,
    sourceSha256: sha256(source),
    renderer: RENDERER,
    version,
    type,
    options,
    fontCss: fontCss ?? null,
    svg: values.out,
    svgSha256: sha256(final)
  }, null, 2)}\n`);
  console.log(`${values.out}: ${type}, ${RENDERER} ${version}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
