// Compare a hosted viewer to the reviewed build and probe excluded resources.
// node scripts/check-demo.mjs <http(s)-base-url/> <local-build-directory> [--curl]
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const [baseArg, local] = process.argv.slice(2);
if (!baseArg || !local) throw new Error('Usage: node scripts/check-demo.mjs <http(s)-base-url/> <local-build-directory>');
const base = new URL(baseArg);
assert(['http:', 'https:'].includes(base.protocol));
assert(base.pathname.endsWith('/'), 'Base URL must end in /');
const localManifest = readFileSync(join(local, 'manifest.json'));
const manifest = JSON.parse(localManifest);
assert.equal(manifest.deck, 'sgr-a-discovery');
assert.equal(manifest.isolatedStatic, true);
assert.equal(manifest.fullWorkbench, true);
assert(manifest.files['offline.html'], 'Missing downloadable offline player');
const run = promisify(execFile);
const request = async (path, options = {}) => {
  const url = new URL(path, base);
  // Optional curl transport for networks that close Node's TLS connections.
  // The same status and byte-integrity assertions apply to either transport.
  if (process.argv.includes('--curl')) {
    const args = ['--silent', '--show-error', '--max-time', '30', '--write-out', '\n%{http_code}', '--request', options.method || 'GET'];
    if (options.body) args.push('--data', options.body);
    const { stdout } = await run('curl', [...args, url.href], { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 });
    const status = Number(stdout.subarray(-3).toString());
    assert(status >= 100, `No HTTP response: ${url}`);
    return new Response(stdout.subarray(0, -4), { status });
  }
  return fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000), ...options });
};
const response = await request('manifest.json');
assert.equal(response.status, 200);
assert.deepEqual(Buffer.from(await response.arrayBuffer()), localManifest, 'Release manifest differs');
const queue = Object.entries(manifest.files);
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const [path, hash] = queue.shift();
    // .nojekyll is a publishing directive; GitHub need not serve dotfiles.
    if (path === '.nojekyll') continue;
    const result = await request(path);
    assert.equal(result.status, 200, `${path}: HTTP ${result.status}`);
    const actual = createHash('sha256').update(Buffer.from(await result.arrayBuffer())).digest('hex');
    assert.equal(actual, hash, `Published bytes differ: ${path}`);
  }
}));
const excluded = [
  '.env', '.git/config', 'slides.md', 'package.json', 'package-lock.json',
  'SKILL.md', 'README.md', 'skills/slideblocks/SKILL.md', 'scripts/build-demo.mjs',
  'components/BeforeTheImage.vue', 'assets/index.js.map', 'api', 'admin',
  'presenter', 'notes', 'decks/', 'downloads/',
  'previews/decks/macbook-pro-m5-launch/index.html',
  'decks/agent-harness-frontiers-20260906/offline.html',
  'decks/slideblocks-investor-20260906/offline.html',
];
for (const path of excluded) {
  const result = await request(path);
  assert([403, 404].includes(result.status), `Excluded path accessible or redirected: ${path} (${result.status})`);
}
// No write request is sent to the presentation itself.
const writeProbe = await request('__readonly_probe__', { method: 'POST', body: 'viewer-boundary-test' });
assert([403, 404, 405, 501].includes(writeProbe.status), `Unexpected write route: ${writeProbe.status}`);
console.log(JSON.stringify({
  base: base.href, sourceSha: manifest.sourceSha,
  verifiedFiles: Object.keys(manifest.files).length - 1,
  excludedPaths: excluded.length, writeProbe: writeProbe.status,
}, null, 2));
