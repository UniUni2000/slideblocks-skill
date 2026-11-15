#!/usr/bin/env node
// Node-only, fixed font preparation. No global installs or preference-file writes.
import { createHash } from 'node:crypto';
import { link, lstat, mkdir, mkdtemp, readFile, realpath, rm, rmdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CLASSROOM_FONT = Object.freeze({
  url: 'https://cdn.jsdelivr.net/npm/@fontsource/lxgw-wenkai@5.3.0/files/lxgw-wenkai-latin-500-normal.woff2',
  byteLength: 7231496,
  sha256: '013fa90e3e7c3b30aeb0a5311ef92d9aee0d3def5817bc27c357198796d34306',
  family: 'SlideBlocks Classroom WenKai',
  path: 'public/fonts/classroom-wenkai.woff2',
});
// Complete original LICENSE from the pinned npm release; only line endings/trailing spaces normalized.
const LICENSE_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/lxgw-wenkai@5.3.0/LICENSE';
const LICENSE_SHA256 = '1382003219ca5e354b5914df75445ea258d9d065fb6751ec8eac687ea45e8127';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function verifyClassroomFont(bytes) {
  if (bytes.length !== CLASSROOM_FONT.byteLength || digest(bytes) !== CLASSROOM_FONT.sha256) {
    throw new Error('WenKai font integrity check failed (expected pinned byte length and SHA-256).');
  }
}

export function classroomFontCss(license) {
  return `/*!\nSource: ${LICENSE_URL}\n${license.replace(/\r\n/g, '\n').trimEnd()}\n*/
@font-face {
  font-family: '${CLASSROOM_FONT.family}';
  src: url('/fonts/classroom-wenkai.woff2') format('woff2');
  /* The pinned file's internal face is LXGWWenKai-Regular, despite its 500 filename. */
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* Apply this family to the classroom slide root; descendants inherit synthesis control. */
.slidev-layout {
  font-synthesis: none;
}
`;
}

function classroomFontModule(license) {
  return `import './classroom-font.css';
// Keep the complete OFL notice in bundled/offline HTML even when CSS comments are removed.
if (typeof document !== 'undefined' && document.head
  && !document.getElementById('slideblocks-classroom-font-license')) {
  const notice = document.createElement('script');
  notice.id = 'slideblocks-classroom-font-license';
  notice.type = 'text/plain';
  notice.textContent = ${JSON.stringify(license)};
  document.head.appendChild(notice);
}
`;
}

async function existingFile(path) {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Refusing non-regular file: ${path}`);
    return await readFile(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function checkDirectory(path) {
  try {
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Refusing non-directory or symlink: ${path}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function checkOutput(path, bytes) {
  const current = await existingFile(path);
  if (current && !current.equals(bytes)) throw new Error(`Existing file differs; leaving it untouched: ${path}`);
  return current !== null;
}

// Dependencies are injectable only for small, offline tests; the CLI always uses the fixed manifest.
export async function prepareClassroomFonts(projectRoot, {
  fetchImpl = globalThis.fetch,
  verifyFont = verifyClassroomFont,
  linkImpl = link,
} = {}) {
  if (typeof projectRoot !== 'string' || !projectRoot.trim()) throw new Error('Provide an existing project directory.');
  const root = await realpath(resolve(projectRoot));
  if (!await checkDirectory(root)) throw new Error(`Project directory does not exist: ${root}`);
  const license = Buffer.from((await readFile(new URL('./LXGW-WenKai-OFL.md', import.meta.url), 'utf8'))
    .replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, ''));
  if (digest(license) !== LICENSE_SHA256) throw new Error('Bundled WenKai OFL license integrity check failed.');
  const css = Buffer.from(classroomFontCss(license.toString('utf8')));
  const directories = [join(root, 'public'), join(root, 'public/fonts')];
  for (const directory of directories) await checkDirectory(directory);
  const outputs = [
    { path: CLASSROOM_FONT.path, bytes: null },
    { path: 'classroom-font.css', bytes: css },
    { path: 'CLASSROOM-FONT-LICENSE.txt', bytes: license },
    { path: 'classroom-font.mjs', bytes: Buffer.from(classroomFontModule(license.toString('utf8'))) },
  ];
  // Check text conflicts before downloading. Every target is checked again before publication.
  for (const output of outputs.slice(1)) await checkOutput(join(root, output.path), output.bytes);
  let font = await existingFile(join(root, CLASSROOM_FONT.path));
  if (font === null) {
    const response = await fetchImpl(CLASSROOM_FONT.url, { signal: AbortSignal.timeout(30000), redirect: 'error' });
    if (!response.ok) throw new Error(`WenKai font download failed: HTTP ${response.status}`);
    font = Buffer.from(await response.arrayBuffer());
  }
  verifyFont(font);
  outputs[0].bytes = font;
  for (const output of outputs) {
    output.reused = await checkOutput(join(root, output.path), output.bytes);
  }
  if (outputs.every((output) => output.reused)) {
    return { projectRoot: root, created: [], reused: outputs.map((output) => output.path) };
  }

  // Stage complete files, then create exclusive hard links. Existing targets are never replaced.
  const staging = await mkdtemp(join(root, '.classroom-fonts-'));
  const published = [];
  const createdDirectories = [];
  try {
    for (const [index, output] of outputs.entries()) {
      if (!output.reused) await writeFile(join(staging, String(index)), output.bytes, { flag: 'wx' });
    }
    for (const directory of directories) {
      if (!await checkDirectory(directory)) {
        try {
          await mkdir(directory);
          createdDirectories.push(directory);
        } catch (error) {
          if (error.code !== 'EEXIST' || !await checkDirectory(directory)) throw error;
        }
      }
    }
    for (const [index, output] of outputs.entries()) {
      if (output.reused) continue;
      const target = join(root, output.path);
      const source = join(staging, String(index));
      try {
        await linkImpl(source, target);
        published.push({ source, target, bytes: output.bytes });
      } catch (error) {
        if (error.code !== 'EEXIST' || !await checkOutput(target, output.bytes)) throw error;
        output.reused = true;
      }
    }
  } catch (error) {
    // Roll back only files created by this run, checking inode identity to preserve concurrent edits.
    const failures = [];
    for (const { source, target, bytes } of published.reverse()) {
      try {
        const [stagedInfo, targetInfo] = await Promise.all([lstat(source), lstat(target)]);
        if (stagedInfo.ino === targetInfo.ino && stagedInfo.dev === targetInfo.dev
          && (await readFile(target)).equals(bytes)) await unlink(target);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') failures.push(cleanupError);
      }
    }
    for (const directory of createdDirectories.reverse()) {
      try { await rmdir(directory); } catch (cleanupError) {
        if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(cleanupError.code)) failures.push(cleanupError);
      }
    }
    if (failures.length) throw new AggregateError([error, ...failures], 'Font preparation failed; rollback was incomplete.');
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return {
    projectRoot: root,
    created: outputs.filter((output) => !output.reused).map((output) => output.path),
    reused: outputs.filter((output) => output.reused).map((output) => output.path),
  };
}

const invokedPath = process.argv[1] ? await realpath(resolve(process.argv[1])).catch(() => null) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0].startsWith('-')) {
    console.error('Usage: node prepare-classroom-fonts.mjs <existing-project-root>');
    process.exitCode = 1;
  } else {
    try {
      console.log(JSON.stringify(await prepareClassroomFonts(args[0]), null, 2));
    } catch (error) {
      console.error(`Classroom font preparation failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
