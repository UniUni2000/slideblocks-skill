// Build only the public Sagittarius A* viewer. Run with Node >=22:
// node scripts/build-demo.mjs /path/to/slideblocks /new/empty/output-directory
// Publish the resulting directory from the dedicated gh-pages branch, never main.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const [repoArg, outputArg] = process.argv.slice(2);
if (!repoArg || !outputArg) throw new Error('Usage: node scripts/build-demo.mjs <slideblocks-repo> <new-output-directory>');
const repo = resolve(repoArg);
const output = resolve(outputArg);
if (existsSync(output)) throw new Error('Output must not exist; existing files are never overwritten.');
const deck = 'decks/sgr-a-discovery';
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
git('diff', '--exit-code', 'HEAD', '--', deck, 'package-lock.json');
const sourceSha = git('rev-parse', 'HEAD');
const require = createRequire(join(repo, 'package.json'));
const { parse, stringify } = require('yaml');
const sharp = require('sharp');
const workParent = join(repo, '.generated');
mkdirSync(workParent, { recursive: true });
const work = mkdtempSync(join(workParent, 'public-sgr-a-'));
const tracked = git('ls-files', '-z', '--', deck).split('\0');
const publicAssets = [];
for (const path of tracked) {
  const name = relative(deck, path);
  const runtime = ['slides.md', 'global-top.vue', 'style.css', 'package.json'].includes(name)
    || /^(components|lib)\/.+\.(vue|ts)$/.test(name) && !name.endsWith('.test.ts')
    || /^public\/.+\.(jpg|jpeg|png|svg|webp|woff2?|ttf|otf)$/.test(name);
  if (!runtime) continue;
  const source = join(repo, path);
  if (!lstatSync(source).isFile()) throw new Error(`Not a regular file: ${path}`);
  const target = join(work, name);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target);
  if (name.startsWith('public/')) publicAssets.push(name.slice(7));
}

// Large archival JPEGs need not delay this 1600px browser presentation.
// Optimize only the copied display assets; source files and credits stay intact.
for (const asset of publicAssets.filter(path => /\.jpe?g$/i.test(path))) {
  const path = join(work, 'public', asset);
  const original = readFileSync(path);
  if (original.length <= 1024 * 1024) continue;
  const optimized = await sharp(original).rotate()
    .resize({ width: 3200, height: 3200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true })
    .toBuffer();
  if (optimized.length < original.length) writeFileSync(path, optimized);
}

function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in publish input: ${path}`);
    return entry.isDirectory() ? files(path) : [path];
  });
}
const slidesPath = join(work, 'slides.md');
const slides = readFileSync(slidesPath, 'utf8');
const match = slides.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!match) throw new Error('Missing headmatter');
const config = {
  ...parse(match[1]),
  titleTemplate: '%s · SlideBlocks',
  presenter: false,
  editor: false,
  browserExporter: false,
  download: false,
  record: false,
  contextMenu: false,
  wakeLock: false,
  pwa: false,
  drawings: { enabled: false, persist: false },
};
// Notes are removed before compilation as well as through the CLI flag.
writeFileSync(slidesPath, `---\n${stringify(config)}---${slides.slice(match[0].length)}`.replace(/<!--[\s\S]*?-->/g, ''));
writeFileSync(join(work, 'vite.config.ts'), 'export default { build: { sourcemap: false } }\n');
symlinkSync(join(repo, 'node_modules'), join(work, 'node_modules'), 'dir');
execFileSync(join(repo, 'node_modules/.bin/slidev'), [
  'build', 'slides.md', '--out', output, '--base', './', '--router-mode', 'hash', '--without-notes',
], { cwd: work, stdio: 'inherit' });
// Slidev generates a Netlify SPA fallback; this viewer must return real 404s.
rmSync(join(output, '_redirects'), { force: true });

// Vue must resolve public assets before relative deployment URLs are applied.
// Rewrite only known root-relative URLs in the compiled viewer.
for (const file of files(output).filter(path => ['.js', '.css', '.html'].includes(extname(path)))) {
  let text = readFileSync(file, 'utf8');
  for (const asset of publicAssets) {
    for (const quote of ['"', "'", '`', '(']) text = text.replaceAll(`${quote}/${asset}`, `${quote}./${asset}`);
  }
  writeFileSync(file, text);
}
const indexPath = join(output, 'index.html');
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
writeFileSync(indexPath, readFileSync(indexPath, 'utf8').replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">\n<meta name="referrer" content="no-referrer">\n<link rel="icon" href="./black-hole.svg" type="image/svg+xml">`));

// Preserve the original scientific credits and required font notices.
writeFileSync(join(output, 'ASSET-CREDITS.txt'), readFileSync(join(repo, deck, 'ASSET_SOURCES.md')));
const notices = ['LICENSE', 'node_modules/computer-modern/OFL.txt', 'node_modules/katex/LICENSE'];
writeFileSync(join(output, 'LICENSES.txt'), notices.map(path => `${path}\n\n${readFileSync(join(repo, path), 'utf8')}`).join('\n\n'));
writeFileSync(join(output, '.nojekyll'), '');
writeFileSync(join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Not found</title><p>Not found. This site only hosts the Sagittarius A* presentation.</p></html>\n');

const forbidden = /Speaker Notes|Suggested duration|data-slideblocks-deck-exit|\/Users\/|localhost:|127\.0\.0\.1:|staging\.inteliway\.tech|api\.inteliway\.tech|sourceMappingURL|BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|ghp_[A-Za-z0-9]{30,}/;
const inventory = {};
for (const file of files(output)) {
  const path = relative(output, file);
  if (!(publicAssets.includes(path) || /^assets\/(?:(?:modules|slidev)\/)?[\w.-]+\.(js|css|woff2?|ttf|otf|svg|png|jpg)$/.test(path) || ['index.html', '404.html', '.nojekyll', 'ASSET-CREDITS.txt', 'LICENSES.txt'].includes(path))) {
    throw new Error(`Unexpected published file: ${path}`);
  }
  if (['.html', '.txt'].includes(extname(file))) {
    writeFileSync(file, readFileSync(file, 'utf8').replace(/[\t ]+$/gm, ''));
  }
  const data = readFileSync(file);
  if (['.js', '.html', '.css'].includes(extname(file)) && forbidden.test(data.toString())) throw new Error(`Private/development content in ${path}`);
  inventory[path] = createHash('sha256').update(data).digest('hex');
}
const manifest = {
  deck: 'sgr-a-discovery', slideCount: 11, sourceSha,
  sourceLockSha256: createHash('sha256').update(readFileSync(join(repo, 'package-lock.json'))).digest('hex'),
  builderSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
  slidev: require('@slidev/cli/package.json').version,
  viewerOnly: true, files: inventory,
};
writeFileSync(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Verified ${Object.keys(inventory).length} public files. Viewer output: ${output}`);
