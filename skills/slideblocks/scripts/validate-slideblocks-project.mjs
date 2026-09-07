import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export const VALIDATION_SCOPE =
  'Static structural and project-contract checks only. This script does not evaluate overlap, aesthetics, motion quality, visual QA, or live Registry coordinate authenticity.';

const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.slideblocks',
  '.slidev',
  '.output',
  'portable',
  'coverage',
  'dist',
  'docs',
  'node_modules',
  'test',
  'tests',
  '__tests__',
  'validation'
]);
const SOURCE_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.js',
  '.jsx',
  '.less',
  '.md',
  '.mjs',
  '.sass',
  '.scss',
  '.styl',
  '.ts',
  '.tsx',
  '.vue'
]);
const NON_RUNTIME_MARKDOWN = new Set([
  'asset_sources.md',
  'changelog.md',
  'contributing.md',
  'license.md',
  'readme.md',
  'validation.md'
]);
const ASSET_EXTENSIONS = new Set([
  '.avif',
  '.eot',
  '.gif',
  '.jpeg',
  '.jpg',
  '.json',
  '.md',
  '.mp3',
  '.mp4',
  '.ogg',
  '.otf',
  '.pdf',
  '.png',
  '.svg',
  '.ttf',
  '.wav',
  '.webm',
  '.webp',
  '.woff',
  '.woff2'
]);
const IMPORT_EXTENSIONS = [
  '',
  '.vue',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.scss'
];
const PLACEHOLDER_PATTERNS = [
  { label: 'TODO marker', pattern: /\b(?:TODO|TBD|FIXME)\b/gi },
  { label: 'Lorem ipsum text', pattern: /\blorem\s+ipsum\b/gi },
  {
    label: 'bracketed placeholder',
    pattern: /(?<!!)\[(?:placeholder|insert|replace|add|your|project name|deck outcome|source material|primary audience|value needed|metric name|citation needed|image needed|data needed|待补|待定|补充|占位)[^\]\n]*\](?!\s*\()/gi
  },
  {
    label: 'template placeholder',
    pattern: /\{\{\s*(?:placeholder|todo|tbd|insert|replace)\b[^}\n]*\}\}/gi
  }
];
const BUILD_RECORD_MARKDOWN_PATHS = [
  '.slideblocks/build-result.md',
  'BUILD_RESULT.md',
  'VALIDATION.md',
  'validation.md',
  'validation/build-result.md'
];
const REQUIRED_CONTRACT_MARKDOWN = {
  '.slideblocks/source-map.md': [
    'Request and source boundary',
    'Source inventory',
    'Facts and locked content',
    'Reusable assets',
    'Uncertainty and gaps'
  ],
  '.slideblocks/page-plan.md': [
    'Communication contract',
    'Source and fact boundary',
    'Narrative spine',
    'Visual direction',
    'Exact slide roster',
    'Assumptions, placeholders, rights, and deferred items'
  ],
  '.slideblocks/qa-report.md': [
    'Inspection boundary',
    'Rendered states',
    'Aesthetic review and repairs',
    'Reduced motion',
    'Print and export',
    'Offline playback',
    'Limitations and deferred items'
  ]
};
const PROJECT_ROUTES = new Set(['new-deck', 'existing-slidev', 'powerpoint-migration']);
const WORKFLOW_STAGES = new Set([
  'intake',
  'strategy',
  'registry',
  'assets',
  'execution',
  'qa',
  'delivery'
]);
const WORKFLOW_STATUSES = new Set(['in-progress', 'blocked', 'complete']);
const ASSET_STATUSES = new Set(['ready', 'placeholder', 'rights-review']);
const RENDER_ROUTES = new Set([
  'diagram:mermaid',
  'figure:comparison',
  'figure:annotated',
  'figure:graph',
  'diagram:elk',
  'direct-svg'
]);
const GENERATED_RENDER_ROUTES = new Set([
  'diagram:mermaid',
  'figure:comparison',
  'figure:annotated',
  'figure:graph',
  'diagram:elk'
]);
const PROGRAMMATIC_VISUAL_KINDS = new Set(['chart', 'diagram']);
const PROGRAMMATIC_VISUAL_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
  '.vue'
]);
const COMPOSITION_TOPOLOGIES = new Set([
  'field',
  'split',
  'stack',
  'sequence',
  'matrix',
  'single-focus',
  'custom'
]);
const COMPOSITION_AXES = new Set(['horizontal', 'vertical', 'radial', 'none']);
const COMPOSITION_PRIMARY_ZONES = new Set([
  'left',
  'right',
  'top',
  'bottom',
  'center',
  'full'
]);
const COMPOSITION_DENSITIES = new Set(['anchor', 'balanced', 'dense']);
const COMPOSITION_CANVAS_ROLES = new Set([
  'primary',
  'support',
  'continuity',
  'negative-space'
]);
const COMPOSITION_CANVAS_ZONES = new Set([
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
  'full'
]);
const REGISTRY_ARTIFACT_ID_PATTERN = /^(?:blocks|decks|recipes)\/[a-z0-9/-]+$/u;
const REGISTRY_BLOCK_ID_PATTERN = /^blocks\/[a-z0-9/-]+$/u;
const REGISTRY_CANDIDATE_SOURCES = new Set([
  'live-catalog',
  'bundled-snapshot',
  'custom'
]);
const REGISTRY_CANDIDATE_DECISIONS = new Set(['selected', 'survivor', 'rejected']);
const REGISTRY_CANDIDATE_GRAMMAR_FITS = new Set([
  'native',
  'adaptable',
  'disruptive',
  'not-assessed'
]);
const REGISTRY_CANDIDATE_GATE_VALUES = {
  semantic: new Set(['exact', 'adaptable', 'reject']),
  evidence: new Set(['complete', 'bounded-adaptation', 'reject']),
  assets: new Set(['ready', 'resolvable', 'reject']),
  delivery: new Set(['pass', 'reject'])
};
const VISUAL_EVIDENCE_DEMANDS = new Set(['required', 'supporting', 'none']);
const VISUAL_EVIDENCE_OBJECTIVES = new Set([
  'prove',
  'explain',
  'qualify',
  'anchor',
  'text'
]);
const VISUAL_EVIDENCE_ROLES = new Set(['primary', 'support']);
const VISUAL_EVIDENCE_DECISIONS = new Set([
  'selected',
  'alternate',
  'fallback',
  'rejected'
]);
const VISUAL_EVIDENCE_KINDS = new Set([
  'photo',
  'chart',
  'diagram',
  'document',
  'quote',
  'illustration',
  'generated',
  'placeholder'
]);
const VISUAL_EVIDENCE_TRUTH_VALUES = new Set([
  'documentary',
  'source-derived',
  'contextual',
  'generated-nonfactual',
  'placeholder'
]);
const VISUAL_EVIDENCE_CLAIM_SUPPORT = new Set([
  'proof',
  'explanation',
  'qualification',
  'context',
  'restatement',
  'decoration'
]);
const VISUAL_EVIDENCE_INDEPENDENCE_RESULTS = new Set(['pass', 'fail']);
const VISUAL_EVIDENCE_FACTUAL_TRUTH_VALUES = new Set([
  'documentary',
  'source-derived',
  'contextual'
]);
const VISUAL_EVIDENCE_RIGHTS_VALUES = new Set([
  'cleared',
  'rights-review',
  'blocked'
]);
const VISUAL_EVIDENCE_TECHNICAL_VALUES = new Set(['ready', 'resolvable', 'blocked']);
const VISUAL_EVIDENCE_REF_PATTERN = /^A\d{2,}$/u;
const VISUAL_EVIDENCE_ASSET_PATTERN = /^A\d{2,}$/u;

function makeIssue(severity, code, message, file, line) {
  return {
    severity,
    code,
    message,
    ...(file ? { file } : {}),
    ...(line ? { line } : {})
  };
}

function relativePath(root, path) {
  return relative(root, path).split('\\').join('/') || '.';
}

function pathStaysInside(root, path) {
  const candidate = relative(root, path);
  return (
    candidate === '' ||
    (candidate !== '..' && !candidate.startsWith(`..${sep}`) && !isAbsolute(candidate))
  );
}

function projectLocalRealFile(root, path) {
  if (!pathStaysInside(root, path) || !existsSync(path)) return null;
  try {
    const realRoot = realpathSync(root);
    const realPath = realpathSync(path);
    return pathStaysInside(realRoot, realPath) && statSync(realPath).isFile()
      ? realPath
      : null;
  } catch {
    return null;
  }
}

function lineAt(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function tokenizeCommand(command) {
  return [...String(command).matchAll(/"([^"]*)"|'([^']*)'|([^\s;&|]+)/g)].map(
    (match) => match[1] ?? match[2] ?? match[3]
  );
}

function slidevEntriesFromScripts(scripts) {
  const priority = ['dev', 'present', 'build', 'export'];
  const entries = Object.entries(scripts ?? {}).sort(([left], [right]) => {
    const leftIndex = priority.indexOf(left);
    const rightIndex = priority.indexOf(right);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? priority.length : leftIndex) -
        (rightIndex === -1 ? priority.length : rightIndex);
    }
    return left.localeCompare(right);
  });
  const candidates = [];
  for (const [, command] of entries) {
    const tokens = tokenizeCommand(command);
    const slidevIndex = tokens.findIndex((token) => /(?:^|\/)slidev$/.test(token));
    if (slidevIndex === -1) continue;
    const entry = tokens.slice(slidevIndex + 1).find((token) => /\.md(?:$|[?#])/.test(token));
    if (entry) candidates.push(entry.replace(/[?#].*$/, ''));
  }
  return [...new Set(candidates)];
}

function discoverEntry(packageJson, explicitEntry, issues) {
  if (explicitEntry) return explicitEntry;
  if (packageJson.slidev && typeof packageJson.slidev === 'object') {
    if (typeof packageJson.slidev.entry === 'string' && packageJson.slidev.entry.trim()) {
      return packageJson.slidev.entry.trim();
    }
  }
  const scriptEntries = slidevEntriesFromScripts(packageJson.scripts);
  if (scriptEntries.length > 1) {
    issues.push(
      makeIssue(
        'warning',
        'MULTIPLE_SLIDEV_ENTRIES',
        `Multiple Slidev Markdown entries were found in package scripts; validating ${scriptEntries[0]}.`
      )
    );
  }
  return scriptEntries[0] ?? 'slides.md';
}

function isSlidevProject(packageJson) {
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
    ...(packageJson.peerDependencies ?? {})
  };
  if ('@slidev/cli' in dependencies || 'slidev' in dependencies) return true;
  return Object.values(packageJson.scripts ?? {}).some((command) => /\bslidev\b/.test(command));
}

function findScript(scripts, kind) {
  const entries = Object.entries(scripts ?? {});
  const exact = entries.find(([name]) => name === kind);
  if (exact) return exact[0];
  const slidevCommand = new RegExp(`\\bslidev\\s+${kind}\\b`);
  return entries.find(([, command]) => slidevCommand.test(command))?.[0];
}

function optionValue(tokens, names) {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    for (const name of names) {
      if (token === name) return tokens[index + 1];
      if (token.startsWith(`${name}=`)) return token.slice(name.length + 1);
    }
  }
  return undefined;
}

function validateOfflineScript(root, scripts, issues) {
  const command = scripts?.['build:offline'];
  if (command !== 'node .slideblocks/build-offline.mjs') {
    issues.push(
      makeIssue(
        'error',
        'OFFLINE_BUILD_SCRIPT_INVALID',
        'package.json must define build:offline exactly as node .slideblocks/build-offline.mjs.'
      )
    );
    return undefined;
  }
  const helperPath = join(root, '.slideblocks', 'build-offline.mjs');
  if (!existsSync(helperPath) || !statSync(helperPath).isFile()) {
    issues.push(
      makeIssue(
        'error',
        'OFFLINE_BUILD_HELPER_MISSING',
        'The offline build helper is missing.',
        '.slideblocks/build-offline.mjs'
      )
    );
  }
  return 'build:offline';
}

function validatePortableScript(scripts, issues) {
  const command = scripts?.['build:portable'];
  if (typeof command !== 'string' || !command.trim()) return undefined;
  const tokens = tokenizeCommand(command);
  const slidevIndex = tokens.findIndex((token) => /(?:^|\/)slidev$/u.test(token));
  const output = optionValue(tokens, ['--out', '-o'])?.replace(/\/$/u, '');
  const base = optionValue(tokens, ['--base']);
  const routerMode = optionValue(tokens, ['--router-mode']);
  if (
    slidevIndex === -1 ||
    tokens[slidevIndex + 1] !== 'build' ||
    output !== 'portable' ||
    !['.', './'].includes(base) ||
    routerMode !== 'hash'
  ) {
    issues.push(
      makeIssue(
        'error',
        'PORTABLE_BUILD_SCRIPT_INVALID',
        'When present, build:portable must run Slidev build with --out portable, --base ./, and --router-mode hash.'
      )
    );
  }
  return 'build:portable';
}

function readUsageSection(content, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = new RegExp(`^(#{1,6})\\s+${escapedLabel}\\s*$`, 'imu').exec(content);
  if (!match) return undefined;
  const remainder = content.slice(match.index + match[0].length);
  const next = remainder.search(new RegExp(`^#{1,${match[1].length}}\\s+`, 'mu'));
  return next === -1 ? remainder : remainder.slice(0, next);
}

function validateBilingualReadme(root, issues) {
  const path = join(root, 'README.md');
  if (!existsSync(path) || !statSync(path).isFile()) {
    issues.push(
      makeIssue(
        'error',
        'README_MISSING',
        'README.md must document development and offline playback in English and Chinese.',
        'README.md'
      )
    );
    return false;
  }
  const content = readFileSync(path, 'utf8');
  const english = readUsageSection(content, 'English');
  const chinese = readUsageSection(content, '中文');
  const required = [
    /(?:npm|pnpm|bun)\s+run\s+dev|yarn\s+dev/iu,
    /(?:npm|pnpm|bun)\s+run\s+build:offline|yarn\s+build:offline/iu,
    /offline\.html/iu,
    /(?:Chromium|Chrome)/iu
  ];
  const englishOfflinePlayback = /copy[^.\n]{0,180}(?:single file|offline\.html|that file)[^.\n]{0,180}double-click/iu;
  const chineseOfflinePlayback = /复制[^。\n]{0,180}(?:一个文件|这个文件|offline\.html)[^。\n]{0,180}双击/iu;
  const englishOrdinaryBuildDisclaimer = /(?:ordinary|normal|npm run build|dist\/)[^.\n]{0,300}(?:not|cannot|must not|isn't)[^.\n]{0,160}(?:double-click|file:\/\/)/iu;
  const chineseOrdinaryBuildDisclaimer = /(?:普通|npm run build|dist\/)[^。\n]{0,300}(?:不能|不支持|不可|不要声称)[^。\n]{0,160}(?:双击|file:\/\/)/u;
  if (
    !english ||
    !chinese ||
    required.some((pattern) => !pattern.test(english) || !pattern.test(chinese)) ||
    !englishOfflinePlayback.test(english) ||
    !chineseOfflinePlayback.test(chinese) ||
    !englishOrdinaryBuildDisclaimer.test(english) ||
    !chineseOrdinaryBuildDisclaimer.test(chinese)
  ) {
    issues.push(
      makeIssue(
        'error',
        'README_OFFLINE_GUIDANCE_INCOMPLETE',
        'README.md needs parallel English and 中文 sections covering the dev command, build:offline, single-file offline.html copy and Chromium double-click playback, plus the fact that ordinary build/dist output is not direct-file playback.',
        'README.md'
      )
    );
    return false;
  }
  return true;
}

function stripScriptBodies(html) {
  const lower = html.toLowerCase();
  let cursor = 0;
  let structural = '';
  while (cursor < html.length) {
    const opening = lower.indexOf('<script', cursor);
    if (opening === -1) return structural + html.slice(cursor);
    const openingEnd = lower.indexOf('>', opening);
    if (openingEnd === -1) return structural + html.slice(cursor);
    const closing = lower.indexOf('</script>', openingEnd + 1);
    if (closing === -1) return structural + html.slice(cursor, openingEnd + 1);
    structural += `${html.slice(cursor, openingEnd + 1)}</script>`;
    cursor = closing + '</script>'.length;
  }
  return structural;
}

function scanTags(html, visit) {
  let cursor = 0;
  while (cursor < html.length) {
    const opening = html.indexOf('<', cursor);
    if (opening === -1) return;
    let nameStart = opening + 1;
    if (html[nameStart] === '/') nameStart += 1;
    let nameEnd = nameStart;
    while (nameEnd < html.length && /[A-Za-z0-9:-]/u.test(html[nameEnd])) nameEnd += 1;
    if (nameEnd === nameStart) {
      cursor = opening + 1;
      continue;
    }
    const closing = html.indexOf('>', nameEnd);
    if (closing === -1) return;
    visit(
      html.slice(nameStart, nameEnd).toLowerCase(),
      html.slice(opening, closing + 1),
      opening
    );
    cursor = closing + 1;
  }
}

function scanAttributes(tag, visit) {
  let cursor = 1;
  if (tag[cursor] === '/') cursor += 1;
  while (cursor < tag.length && /[A-Za-z0-9:-]/u.test(tag[cursor])) cursor += 1;
  while (cursor < tag.length) {
    while (cursor < tag.length && /[\s/]/u.test(tag[cursor])) cursor += 1;
    const nameStart = cursor;
    while (cursor < tag.length && !/[\s=>/]/u.test(tag[cursor])) cursor += 1;
    if (cursor === nameStart) {
      cursor += 1;
      continue;
    }
    const name = tag.slice(nameStart, cursor).toLowerCase();
    while (cursor < tag.length && /\s/u.test(tag[cursor])) cursor += 1;
    if (tag[cursor] !== '=') continue;
    cursor += 1;
    while (cursor < tag.length && /\s/u.test(tag[cursor])) cursor += 1;
    const quote = tag[cursor] === '"' || tag[cursor] === "'" ? tag[cursor] : undefined;
    if (quote) cursor += 1;
    const valueStart = cursor;
    if (quote) {
      const valueEnd = tag.indexOf(quote, cursor);
      if (valueEnd === -1) return;
      visit(name, tag.slice(valueStart, valueEnd), valueStart);
      cursor = valueEnd + 1;
    } else {
      while (cursor < tag.length && !/[\s>]/u.test(tag[cursor])) cursor += 1;
      visit(name, tag.slice(valueStart, cursor), valueStart);
    }
  }
}

function scanCssUrls(css, visit) {
  const lower = css.toLowerCase();
  let cursor = 0;
  while (cursor < css.length) {
    const opening = lower.indexOf('url(', cursor);
    if (opening === -1) return;
    cursor = opening + 4;
    while (cursor < css.length && /\s/u.test(css[cursor])) cursor += 1;
    const quote = css[cursor] === '"' || css[cursor] === "'" ? css[cursor] : undefined;
    if (quote) cursor += 1;
    const valueStart = cursor;
    const closing = quote ? css.indexOf(quote, cursor) : css.indexOf(')', cursor);
    if (closing === -1) return;
    visit(css.slice(valueStart, closing).trim(), opening);
    cursor = closing + 1;
  }
}

function validateOfflineOutput(root, issues) {
  const outputPath = join(root, 'offline.html');
  if (!existsSync(outputPath) || !statSync(outputPath).isFile()) {
    issues.push(
      makeIssue(
        'error',
        'OFFLINE_OUTPUT_MISSING',
        'Run build:offline after the final change so offline.html exists.',
        'offline.html'
      )
    );
    return false;
  }
  const html = readFileSync(outputPath, 'utf8');
  const addReferenceIssue = (code, message, match) => {
    issues.push(
      makeIssue('error', code, message, 'offline.html', lineAt(html, match.index))
    );
  };
  if (!/<html\b[^>]*\bdata-slideblocks-offline-player=["']true["']/iu.test(html)) {
    issues.push(
      makeIssue(
        'error',
        'OFFLINE_MARKER_MISSING',
        'offline.html is missing its verified offline-player marker.',
        'offline.html'
      )
    );
  }
  if (!/<script\b[^>]*\bdata-slideblocks-offline-assets(?:\s|>|=)/iu.test(html)) {
    issues.push(
      makeIssue(
        'error',
        'OFFLINE_ASSET_RUNTIME_MISSING',
        'offline.html is missing the bundled asset runtime required for dynamic public resources.',
        'offline.html'
      )
    );
  }
  const structuralHtml = stripScriptBodies(html);
  const mediaTags = new Set(['audio', 'embed', 'iframe', 'img', 'object', 'source', 'track', 'video']);
  const mediaAttributes = new Set(['data', 'poster', 'src']);
  scanTags(structuralHtml, (name, tag, tagIndex) => {
    scanAttributes(tag, (attribute, value, attributeIndex) => {
      const match = { index: tagIndex + attributeIndex };
      if (name === 'script' && attribute === 'src') {
        addReferenceIssue(
          'OFFLINE_EXTERNAL_SCRIPT',
          `Offline output references a script instead of inlining it: ${value}`,
          match
        );
      }
      if (name === 'link' && attribute === 'href' && !/^(?:data:|#)/iu.test(value)) {
        addReferenceIssue(
          'OFFLINE_EXTERNAL_LINK',
          `Offline output references a linked resource instead of inlining it: ${value}`,
          match
        );
      }
      if (
        mediaTags.has(name) &&
        mediaAttributes.has(attribute) &&
        !/^(?:data:|blob:|#|$)/iu.test(value)
      ) {
        addReferenceIssue(
          'OFFLINE_EXTERNAL_MEDIA',
          `Offline output references media instead of inlining it: ${value}`,
          match
        );
      }
    });
  });
  scanCssUrls(structuralHtml, (value, index) => {
    if (!/^(?:data:|blob:|#|%23)/iu.test(value)) {
      addReferenceIssue(
        'OFFLINE_EXTERNAL_CSS_ASSET',
        `Offline output references a CSS asset instead of inlining it: ${value}`,
        { index }
      );
    }
  });
  const runtimeRequestPatterns = [
    /(?:src|poster)\s*=\s*["']https?:\/\//giu,
    /<image\b[^>]*\bhref\s*=\s*["']https?:\/\//gisu,
    /@import\s+(?:url\()?\s*["']?https?:\/\//giu,
    /\bfetch\(\s*["']https?:\/\//giu
  ];
  for (const pattern of runtimeRequestPatterns) {
    const match = pattern.exec(html);
    if (match) {
      issues.push(
        makeIssue(
          'error',
          'OFFLINE_EXTERNAL_RUNTIME_REQUEST',
          `Offline output contains an automatic external request: ${match[0]}`,
          'offline.html',
          lineAt(html, match.index)
        )
      );
    }
  }
  return !issues.some((issue) => issue.code.startsWith('OFFLINE_'));
}

function collectSourceFiles(root, entryPath) {
  const files = [];
  const visit = (directory) => {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      if (item.isSymbolicLink()) continue;
      const path = join(directory, item.name);
      if (item.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(item.name)) visit(path);
        continue;
      }
      if (!item.isFile() || !SOURCE_EXTENSIONS.has(extname(item.name).toLowerCase())) continue;
      if (/\.(?:test|spec)\.[^.]+$/i.test(item.name)) continue;
      if (
        extname(item.name).toLowerCase() === '.md' &&
        NON_RUNTIME_MARKDOWN.has(item.name.toLowerCase()) &&
        resolve(path) !== resolve(entryPath)
      ) {
        continue;
      }
      files.push(path);
    }
  };
  visit(root);
  return files.sort();
}

function cleanReference(raw) {
  let value = String(raw).trim().replace(/^['"]|['"]$/g, '');
  if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1).trim();
  const titled = value.match(/^(\S+)(?:\s+["'][^"']*["'])$/);
  if (titled) value = titled[1];
  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep the original path when percent encoding is malformed; existence will fail deterministically.
  }
  return value.replace(/[?#].*$/, '');
}

function isIgnoredReference(value) {
  return (
    !value ||
    value.startsWith('#') ||
    value.startsWith('//') ||
    /^(?:data|https?|mailto|tel|blob):/i.test(value) ||
    /[{}$]/.test(value) ||
    value.startsWith('var(')
  );
}

function looksLikeAssetPath(value) {
  return (
    value.startsWith('.') ||
    value.startsWith('/') ||
    value.startsWith('@/') ||
    value.startsWith('~/') ||
    value.includes('/') ||
    ASSET_EXTENSIONS.has(extname(value).toLowerCase())
  );
}

function referenceCandidates(root, sourceFile, reference) {
  if (reference.startsWith('/')) {
    return [join(root, 'public', reference.slice(1)), join(root, reference.slice(1))];
  }
  if (reference.startsWith('@/') || reference.startsWith('~/')) {
    return [join(root, reference.slice(2))];
  }
  return [resolve(dirname(sourceFile), reference)];
}

function extractResourceReferences(file, content) {
  const references = [];
  const addMatches = (pattern, group, kind, pathRequired = false) => {
    for (const match of content.matchAll(pattern)) {
      const value = cleanReference(match[group]);
      if (isIgnoredReference(value) || (pathRequired && !looksLikeAssetPath(value))) continue;
      references.push({ kind, line: lineAt(content, match.index), value });
    }
  };
  addMatches(/!\[[^\]]*\]\(([^)\n]+)\)/g, 1, 'Markdown image');
  addMatches(/(?<![:\w-])(?:src|poster)\s*=\s*["']([^"']+)["']/g, 1, 'media attribute');
  addMatches(/url\(\s*(["']?)([^)]+?)\1\s*\)/g, 2, 'CSS URL');
  if (extname(file).toLowerCase() === '.md') {
    addMatches(
      /^\s*(?:background|favicon|image|logo|src)\s*:\s*["']?([^"'\s]+)["']?\s*$/gm,
      1,
      'Slidev frontmatter resource',
      true
    );
  }
  return references;
}

function resolveImport(root, sourceFile, reference) {
  if (!(reference.startsWith('.') || reference.startsWith('/') || reference.startsWith('@/') || reference.startsWith('~/'))) {
    return undefined;
  }
  const cleaned = cleanReference(reference);
  const base = cleaned.startsWith('/')
    ? join(root, cleaned.slice(1))
    : cleaned.startsWith('@/') || cleaned.startsWith('~/')
      ? join(root, cleaned.slice(2))
      : resolve(dirname(sourceFile), cleaned);
  const candidates = IMPORT_EXTENSIONS.flatMap((extension) => [
    `${base}${extension}`,
    join(base, `index${extension}`)
  ]);
  return candidates.find((candidate) => existsSync(candidate));
}

function validateSourceFiles(root, sourceFiles, issues) {
  let resourceCount = 0;
  let placeholderCount = 0;
  const seenIssues = new Set();
  const addUnique = (issue) => {
    const key = `${issue.code}:${issue.file ?? ''}:${issue.line ?? ''}:${issue.message}`;
    if (!seenIssues.has(key)) {
      seenIssues.add(key);
      issues.push(issue);
    }
  };

  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf8');
    const displayedFile = relativePath(root, file);
    for (const reference of extractResourceReferences(file, content)) {
      resourceCount += 1;
      const candidates = referenceCandidates(root, file, reference.value);
      if (!candidates.some((candidate) => existsSync(candidate))) {
        addUnique(
          makeIssue(
            'error',
            'MISSING_LOCAL_RESOURCE',
            `${reference.kind} does not resolve: ${reference.value}`,
            displayedFile,
            reference.line
          )
        );
      }
    }

    const importPattern = /(?:import\s+(?:[^'";]+?\s+from\s+)?|export\s+[^'";]+?\s+from\s+)["']([^"']+)["']/g;
    for (const match of content.matchAll(importPattern)) {
      const reference = match[1];
      if (resolveImport(root, file, reference) !== undefined) continue;
      if (!(reference.startsWith('.') || reference.startsWith('/') || reference.startsWith('@/') || reference.startsWith('~/'))) {
        continue;
      }
      addUnique(
        makeIssue(
          'error',
          'MISSING_LOCAL_IMPORT',
          `Local import does not resolve: ${reference}`,
          displayedFile,
          lineAt(content, match.index)
        )
      );
    }

    for (const { label, pattern } of PLACEHOLDER_PATTERNS) {
      const matcher = new RegExp(pattern.source, pattern.flags);
      for (const match of content.matchAll(matcher)) {
        placeholderCount += 1;
        addUnique(
          makeIssue(
            'error',
            'PLACEHOLDER_FOUND',
            `${label}: ${match[0]}`,
            displayedFile,
            lineAt(content, match.index)
          )
        );
      }
    }
  }
  return { placeholderCount, resourceCount };
}

function stripInitialFrontmatter(content) {
  const lines = content.replace(/^\uFEFF/, '').split('\n');
  if (lines[0]?.trim() !== '---') return content;
  const closing = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  return closing === -1 ? content : lines.slice(closing + 1).join('\n');
}

function validateWakeLockHeadmatter(content, entry, issues) {
  const normalized = content.replace(/^\uFEFF/u, '');
  const frontmatter = normalized.match(
    /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/u
  )?.[1];
  const declarations = frontmatter
    ? frontmatter.split(/\r?\n/u).filter((line) => /^wakeLock\s*:/u.test(line))
    : [];
  const valid =
    declarations.length === 1 &&
    /^wakeLock\s*:\s*false(?:\s+#.*)?\s*$/u.test(declarations[0]);

  if (!valid) {
    issues.push(
      makeIssue(
        'error',
        'WAKE_LOCK_CONFIG_INVALID',
        'The Slidev entry must set top-level wakeLock: false as a YAML boolean.',
        entry
      )
    );
  }
  return valid;
}

function isFrontmatterOnly(content) {
  const text = content.trim();
  if (!text || /(?:^|\n)\s*(?:#|<|```|!\[)/.test(text)) return false;
  const lines = text.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
  return lines.some((line) => /^[\w.-]+\s*:/.test(line.trim())) &&
    lines.every((line) => /^[\w.-]+\s*:|^\s+|^-\s+/.test(line));
}

function visibleSlideContent(content) {
  return content
    .replace(/<!--[^]*?-->/g, '')
    .replace(/<script\b[^>]*>[^]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[^]*?<\/style>/gi, '')
    .trim();
}

function splitSlides(entryContent) {
  const parts = stripInitialFrontmatter(entryContent).split(/^---\s*$/gm);
  const slides = [];
  for (let index = 0; index < parts.length; index += 1) {
    if (isFrontmatterOnly(parts[index]) && index + 1 < parts.length) index += 1;
    slides.push(parts[index]);
  }
  return slides;
}

function findEmptySlides(slides) {
  return slides
    .map((content, index) => ({ content, slide: index + 1 }))
    .filter(({ content }) => !visibleSlideContent(content))
    .map(({ slide }) => slide);
}

function markdownSectionMap(content) {
  const sections = new Map();
  let current;
  for (const line of content.split(/\r?\n/u)) {
    const heading = line.match(/^#{2,6}\s+(.+?)\s*#*\s*$/u)?.[1].trim().toLowerCase();
    if (heading) {
      current = heading;
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  return new Map([...sections].map(([heading, lines]) => [heading, lines.join('\n').trim()]));
}

function hasSubstantiveMarkdown(content) {
  return (
    content
      .replace(/<!--[^]*?-->/gu, '')
      .replace(/^\s*\|?(?:\s*:?-+:?\s*\|)+\s*$/gmu, '')
      .replace(/[\s|`*_>#-]/gu, '').length >= 12
  );
}

function sourceInventoryRows(content) {
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
    .filter((cells) => /^(?:I\d{2,}|NONE)$/u.test(cells[0] ?? ''))
    .map((cells) => {
      const [id, kind, rawLocation, role, status, provenance] = cells;
      return {
        id,
        kind,
        location: rawLocation?.replace(/^`([^`]+)`$/u, '$1'),
        role,
        status,
        provenance,
        cellCount: cells.length
      };
    });
}

function workflowInputKey(input) {
  if (input.kind === 'file') return `file:${input.path}`;
  if (input.kind === 'url') return `url:${input.url}`;
  if (input.kind === 'text') return `text:${input.label}`;
  return undefined;
}

function slidePageIds(slides) {
  return slides.map((slide) => {
    const matches = [
      ...slide.matchAll(/<!--\s*slideblocks-page:\s*(P\d{2,})\s*-->/gu)
    ];
    return matches.length === 1 ? matches[0][1] : undefined;
  });
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function markupTagEnd(source, start) {
  let quote = null;
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '>') return index;
  }
  return -1;
}

function parseMarkupStartTag(source, start, end) {
  let cursor = start + 1;
  while (/\s/u.test(source[cursor] ?? '')) cursor += 1;
  if (!/[A-Za-z]/u.test(source[cursor] ?? '')) return null;
  const nameStart = cursor;
  while (/[A-Za-z0-9_.:-]/u.test(source[cursor] ?? '')) cursor += 1;
  const name = source.slice(nameStart, cursor).toLowerCase();
  const attributes = new Map();

  while (cursor < end) {
    while (/\s/u.test(source[cursor] ?? '')) cursor += 1;
    if (cursor >= end || source[cursor] === '/') break;
    const attributeStart = cursor;
    while (cursor < end && !/[\s=/>]/u.test(source[cursor])) cursor += 1;
    if (cursor === attributeStart) {
      cursor += 1;
      continue;
    }
    const attributeName = source.slice(attributeStart, cursor).toLowerCase();
    while (/\s/u.test(source[cursor] ?? '')) cursor += 1;
    let literal = false;
    let value = null;
    if (source[cursor] === '=') {
      cursor += 1;
      while (/\s/u.test(source[cursor] ?? '')) cursor += 1;
      const quote = source[cursor];
      if (quote === '"' || quote === "'") {
        literal = true;
        cursor += 1;
        const valueStart = cursor;
        while (cursor < end && source[cursor] !== quote) {
          if (source[cursor] === '\\') cursor += 1;
          cursor += 1;
        }
        value = source.slice(valueStart, cursor);
        if (source[cursor] === quote) cursor += 1;
      } else {
        const valueStart = cursor;
        while (cursor < end && !/[\s>]/u.test(source[cursor])) cursor += 1;
        value = source.slice(valueStart, cursor);
      }
    }
    const values = attributes.get(attributeName) ?? [];
    values.push({ literal, value });
    attributes.set(attributeName, values);
  }
  return {
    attributes,
    name,
    selfClosing: /\/\s*>$/u.test(source.slice(start, end + 1))
  };
}

function skipRawTextElement(source, start, name) {
  const lowerSource = source.toLowerCase();
  const closing = `</${name}`;
  let closeStart = lowerSource.indexOf(closing, start);
  while (closeStart !== -1) {
    const boundary = lowerSource[closeStart + closing.length] ?? '';
    if (boundary === '>' || /\s/u.test(boundary)) {
      const closeEnd = markupTagEnd(source, closeStart);
      return closeEnd === -1 ? source.length : closeEnd + 1;
    }
    closeStart = lowerSource.indexOf(closing, closeStart + closing.length);
  }
  return source.length;
}

function markupStartTags(source) {
  const tags = [];
  let cursor = 0;
  while (cursor < source.length) {
    const tagStart = source.indexOf('<', cursor);
    if (tagStart === -1) break;
    const interpolationStart = source.indexOf('{{', cursor);
    if (interpolationStart !== -1 && interpolationStart < tagStart) {
      const interpolationEnd = source.indexOf('}}', interpolationStart + 2);
      if (interpolationEnd === -1) break;
      cursor = interpolationEnd + 2;
      continue;
    }
    if (source.startsWith('<!--', tagStart)) {
      const commentEnd = source.indexOf('-->', tagStart + 4);
      if (commentEnd === -1) break;
      cursor = commentEnd + 3;
      continue;
    }
    const tagEnd = markupTagEnd(source, tagStart);
    if (tagEnd === -1) break;
    const tag = parseMarkupStartTag(source, tagStart, tagEnd);
    cursor = tagEnd + 1;
    if (!tag) continue;
    if (tag.name === 'script' || tag.name === 'style') {
      if (!tag.selfClosing) cursor = skipRawTextElement(source, cursor, tag.name);
      continue;
    }
    if (tag.name !== 'template') tags.push(tag);
  }
  return tags;
}

function skipJavaScriptQuotedValue(source, start) {
  const quote = source[start];
  let cursor = start + 1;
  while (cursor < source.length) {
    if (source[cursor] === '\\') cursor += 2;
    else if (source[cursor] === quote) return cursor + 1;
    else cursor += 1;
  }
  return source.length;
}

function javascriptRegexCanStart(source, start) {
  let cursor = start - 1;
  while (cursor >= 0 && /\s/u.test(source[cursor])) cursor -= 1;
  if (cursor < 0 || /[=(:,\[!&|?{};]/u.test(source[cursor])) return true;
  if (source[cursor] === '>' && source[cursor - 1] === '=') return true;
  if (!/[A-Za-z0-9_$]/u.test(source[cursor])) return false;
  const end = cursor + 1;
  while (cursor >= 0 && /[A-Za-z0-9_$]/u.test(source[cursor])) cursor -= 1;
  return new Set([
    'await',
    'case',
    'delete',
    'do',
    'else',
    'in',
    'instanceof',
    'new',
    'return',
    'throw',
    'typeof',
    'void',
    'yield'
  ]).has(source.slice(cursor + 1, end));
}

function skipJavaScriptRegex(source, start) {
  let cursor = start + 1;
  let characterClass = false;
  while (cursor < source.length) {
    const character = source[cursor];
    if (character === '\\') cursor += 2;
    else if (character === '[') {
      characterClass = true;
      cursor += 1;
    } else if (character === ']') {
      characterClass = false;
      cursor += 1;
    } else if (character === '/' && !characterClass) {
      cursor += 1;
      while (/[A-Za-z]/u.test(source[cursor] ?? '')) cursor += 1;
      return cursor;
    } else if (character === '\n' || character === '\r') {
      return cursor;
    } else cursor += 1;
  }
  return source.length;
}

function javascriptMarkupStartTags(source) {
  const tags = [];
  let cursor = 0;
  while (cursor < source.length) {
    const character = source[cursor];
    const next = source[cursor + 1];
    if (character === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', cursor + 2);
      cursor = lineEnd === -1 ? source.length : lineEnd + 1;
      continue;
    }
    if (character === '/' && next === '*') {
      const commentEnd = source.indexOf('*/', cursor + 2);
      cursor = commentEnd === -1 ? source.length : commentEnd + 2;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      cursor = skipJavaScriptQuotedValue(source, cursor);
      continue;
    }
    if (character === '/' && javascriptRegexCanStart(source, cursor)) {
      cursor = skipJavaScriptRegex(source, cursor);
      continue;
    }
    if (character !== '<') {
      cursor += 1;
      continue;
    }
    const tagEnd = markupTagEnd(source, cursor);
    if (tagEnd === -1) break;
    const tag = parseMarkupStartTag(source, cursor, tagEnd);
    if (tag && tag.name !== 'template' && tag.name !== 'script' && tag.name !== 'style') {
      tags.push(tag);
    }
    cursor = tagEnd + 1;
  }
  return tags;
}

function declaresLiteralRenderCarrier(source, assetId, renderRoute, extension = '') {
  const tags = ['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx'].includes(extension)
    ? javascriptMarkupStartTags(source)
    : markupStartTags(source);
  return tags.some(({ attributes }) => {
    const assetMarkers = attributes.get('data-slideblocks-asset-id') ?? [];
    const routeMarkers = attributes.get('data-slideblocks-render-route') ?? [];
    return (
      assetMarkers.length === 1 &&
      assetMarkers[0].literal &&
      assetMarkers[0].value === assetId &&
      routeMarkers.length === 1 &&
      routeMarkers[0].literal &&
      routeMarkers[0].value === renderRoute
    );
  });
}

function hasExactObjectKeys(value, expectedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
}

function normalizedCompositionSignature(family) {
  return `${family.topology}/${family.axis}/${family.primaryZone}`;
}

function hasCustomPlanEvidence(value, pageId) {
  return (
    nonEmptyString(value) &&
    value.split(/[^A-Za-z0-9:_-]+/u).includes(`custom-plan:${pageId}`)
  );
}

function sectionPageIds(section) {
  return new Set(section?.match(/\bP\d{2,}\b/gu) ?? []);
}

function repetitionIntentScope(value, roster) {
  if (!nonEmptyString(value)) return undefined;
  const text = value.trim();
  if (
    text.length < 32 ||
    /\bfor consistency\b/iu.test(text) ||
    /(?:为(?:了)?保持一致|保持一致性)/u.test(text)
  ) {
    return undefined;
  }
  const rosterIndex = new Map(roster.map((page, index) => [page, index]));
  const namedPages = text.match(/\bP\d{2,}\b/gu) ?? [];
  if (namedPages.length < 2 || namedPages.some((page) => !rosterIndex.has(page))) {
    return undefined;
  }
  const scope = new Set(namedPages);
  for (const match of text.matchAll(/\b(P\d{2,})\s*(?:-|–|—|to)\s*(P\d{2,})\b/giu)) {
    const start = rosterIndex.get(match[1]);
    const end = rosterIndex.get(match[2]);
    if (start === undefined || end === undefined || start >= end) return undefined;
    for (const page of roster.slice(start, end + 1)) scope.add(page);
  }
  return scope.size >= 2 ? scope : undefined;
}

function repetitionIntentCovers(value, pageId, roster, affectedPages) {
  const scope = repetitionIntentScope(value, roster);
  return (
    scope?.has(pageId) === true && affectedPages.every((affectedPage) => scope.has(affectedPage))
  );
}

function parseSingleJsonProjection(section) {
  const blocks = [...(section ?? '').matchAll(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/gu)];
  if (blocks.length !== 1) return { ok: false };
  try {
    const value = JSON.parse(blocks[0][1]);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { ok: true, value }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function reusableAssetRows(content) {
  const lines = (content ?? '')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'));
  const hasCanonicalHeader = lines.some(
    (line) =>
      line ===
      '| Asset ID | Local destination | Source | Kind | Truth and provenance | Rights | Technical status | Intended page/slot | Notes |'
  );
  const rows = lines
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
    .filter((cells) => /^A\d{2,}$/u.test(cells[0] ?? ''))
    .map((cells) => {
      const [
        id,
        rawLocalDestination,
        source,
        kind,
        truthAndProvenance,
        rights,
        technical,
        intendedPageSlot,
        notes
      ] = cells;
      const truthMatch = truthAndProvenance?.match(/^(\S+) — (.+)$/u);
      return {
        id,
        localDestination: rawLocalDestination?.replace(/^`([^`]+)`$/u, '$1'),
        source,
        kind,
        truth: truthMatch?.[1],
        provenance: truthMatch?.[2],
        rights,
        technical,
        intendedPageSlot,
        notes,
        cellCount: cells.length
      };
    });
  return { hasCanonicalHeader, rows };
}

function equalStringSets(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.every((value) => right.includes(value))
  );
}

function claimSupportMatchesObjective(objective, claimSupport) {
  if (objective === 'prove') return claimSupport === 'proof';
  if (objective === 'explain') return ['proof', 'explanation'].includes(claimSupport);
  if (objective === 'qualify') return ['proof', 'qualification'].includes(claimSupport);
  if (objective === 'anchor') {
    return ['proof', 'explanation', 'qualification', 'context'].includes(claimSupport);
  }
  return false;
}

function validateVisualEvidenceContract(
  lock,
  roster,
  contractSections,
  inventoryIds,
  checks,
  issues
) {
  const pagePlanPath = '.slideblocks/page-plan.md';
  const sourceMapPath = '.slideblocks/source-map.md';
  const qaReportPath = '.slideblocks/qa-report.md';
  const lockPath = '.slideblocks/execution-lock.json';
  const section = contractSections[pagePlanPath]?.get('visual evidence plan');
  if (section === undefined) {
    if (lock.schemaVersion === 2) {
      issues.push(
        makeIssue(
          'error',
          'VISUAL_EVIDENCE_PLAN_MISSING',
          'SchemaVersion 2 requires a canonical Visual Evidence Plan with page objectives, carrier-only acceptance tests, gated options, and canvas bindings. Repair the page plan before continuing.',
          pagePlanPath
        )
      );
      checks.markdown[pagePlanPath] = false;
      return false;
    }
    return true;
  }

  if (lock.schemaVersion !== 2) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_SCHEMA_UNSUPPORTED',
        'Visual Evidence Plan is a schemaVersion 2 full-Deck contract. Preserve schemaVersion 1 for isolated edits without adding this plan, or regenerate the complete Deck plan and lock as schemaVersion 2.',
        pagePlanPath
      )
    );
    checks.markdown[pagePlanPath] = false;
    return false;
  }

  const projection = parseSingleJsonProjection(section);
  if (!hasSubstantiveMarkdown(section) || !projection.ok) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_PLAN_INVALID',
        'Visual Evidence Plan must contain exactly one parseable fenced json object with the canonical pages projection.',
        pagePlanPath
      )
    );
    checks.markdown[pagePlanPath] = false;
    return false;
  }

  const planPages = projection.value.pages;
  const planPageKeys =
    planPages && typeof planPages === 'object' && !Array.isArray(planPages)
      ? Object.keys(planPages)
      : [];
  const planPageSet = new Set(planPageKeys);
  let valid = true;
  if (
    !hasExactObjectKeys(projection.value, ['pages']) ||
    planPageKeys.length !== roster.length ||
    !roster.every((pageId) => planPageSet.has(pageId))
  ) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_ROSTER_MISMATCH',
        `Visual Evidence Plan pages [${planPageKeys.join(', ')}] must exactly match slideOrder [${roster.join(', ')}].`,
        pagePlanPath
      )
    );
    checks.markdown[pagePlanPath] = false;
    return false;
  }

  const assetInventory = reusableAssetRows(
    contractSections[sourceMapPath]?.get('reusable assets') ?? ''
  );
  const assetIds = assetInventory.rows.map((row) => row.id);
  const assetIdSet = new Set(assetIds);
  const assetRowsById = new Map(assetInventory.rows.map((row) => [row.id, row]));
  const assetRowsValid =
    assetInventory.hasCanonicalHeader &&
    assetIds.length === assetIdSet.size &&
    assetInventory.rows.every(
      (row) =>
        row.cellCount === 9 &&
        nonEmptyString(row.localDestination) &&
        nonEmptyString(row.source) &&
        VISUAL_EVIDENCE_KINDS.has(row.kind) &&
        VISUAL_EVIDENCE_TRUTH_VALUES.has(row.truth) &&
        nonEmptyString(row.provenance) &&
        VISUAL_EVIDENCE_RIGHTS_VALUES.has(row.rights) &&
        VISUAL_EVIDENCE_TECHNICAL_VALUES.has(row.technical) &&
        nonEmptyString(row.intendedPageSlot) &&
        nonEmptyString(row.notes)
    );
  const factualRowsWithoutKnownSource = assetInventory.rows.filter((row) => {
    if (!VISUAL_EVIDENCE_FACTUAL_TRUTH_VALUES.has(row.truth)) return false;
    const sourceRefs = `${row.source ?? ''} ${row.provenance ?? ''}`.match(/\bI\d{2,}\b/gu) ?? [];
    return sourceRefs.length === 0 || sourceRefs.some((ref) => !inventoryIds.has(ref));
  });
  const referencedAssetIds = new Set();
  const selectedSlots = new Map();
  let assetInventoryIssueReported = false;

  if (factualRowsWithoutKnownSource.length > 0) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_PROVENANCE_INVALID',
        `Factual reusable assets must reference only known source-inventory I<NN> IDs in Source or provenance: ${factualRowsWithoutKnownSource.map((row) => row.id).join(', ')}.`,
        sourceMapPath
      )
    );
    checks.markdown[sourceMapPath] = false;
    valid = false;
  }

  for (const pageId of roster) {
    const page = planPages[pageId];
    const pageShapeValid = hasExactObjectKeys(page, [
      'evidenceDemand',
      'evidenceObjective',
      'textLedReason',
      'slots'
    ]);
    const demandValid = pageShapeValid && VISUAL_EVIDENCE_DEMANDS.has(page.evidenceDemand);
    const objectiveValid =
      pageShapeValid && VISUAL_EVIDENCE_OBJECTIVES.has(page.evidenceObjective);
    const reasonTypeValid =
      pageShapeValid && (page.textLedReason === null || nonEmptyString(page.textLedReason));
    const slots = pageShapeValid && Array.isArray(page.slots) ? page.slots : [];
    const demandSemanticsValid =
      demandValid &&
      objectiveValid &&
      reasonTypeValid &&
      ((page.evidenceDemand === 'required' &&
        ['prove', 'explain', 'qualify'].includes(page.evidenceObjective) &&
        slots.length > 0 &&
        slots.some((slot) => slot?.role === 'primary')) ||
        (page.evidenceDemand === 'supporting' &&
          ['prove', 'explain', 'qualify', 'anchor'].includes(page.evidenceObjective) &&
          (slots.length > 0 || nonEmptyString(page.textLedReason))) ||
        (page.evidenceDemand === 'none' &&
          page.evidenceObjective === 'text' &&
          slots.length === 0 &&
          nonEmptyString(page.textLedReason)));

    if (!demandSemanticsValid) {
      issues.push(
        makeIssue(
          'error',
          'VISUAL_EVIDENCE_DEMAND_INVALID',
          `${pageId} must use evidenceDemand and evidenceObjective coherently: required uses prove/explain/qualify with a primary slot; supporting uses prove/explain/qualify/anchor with slots or an explanation; none uses text with no slots and a non-empty textLedReason.`,
          pagePlanPath
        )
      );
      valid = false;
    }

    const slotIds = new Set();
    for (const slot of slots) {
      const slotShapeValid = hasExactObjectKeys(slot, [
        'id',
        'role',
        'need',
        'acceptance',
        'options'
      ]);
      const options = slotShapeValid && Array.isArray(slot.options) ? slot.options : [];
      const slotValid =
        slotShapeValid &&
        typeof slot.id === 'string' &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slot.id) &&
        !slotIds.has(slot.id) &&
        VISUAL_EVIDENCE_ROLES.has(slot.role) &&
        nonEmptyString(slot.need) &&
        nonEmptyString(slot.acceptance) &&
        options.length > 0;
      if (!slotValid) {
        issues.push(
          makeIssue(
            'error',
            'VISUAL_EVIDENCE_SLOT_INVALID',
            `${pageId} contains an invalid or duplicate evidence slot; each slot needs a page-local unique lowercase kebab-case id, primary/support role, substantive need, carrier-only acceptance test, and non-empty options.`,
            pagePlanPath
          )
        );
        valid = false;
        continue;
      }
      slotIds.add(slot.id);

      let selectedCount = 0;
      let selectedOption;
      for (const option of options) {
        const optionShapeValid = hasExactObjectKeys(option, [
          'refs',
          'kind',
          'truth',
          'claimSupport',
          'independenceTest',
          'rights',
          'technical',
          'decision',
          'reason'
        ]);
        const refs = optionShapeValid && Array.isArray(option.refs) ? option.refs : [];
        const optionValid =
          optionShapeValid &&
          refs.length > 0 &&
          new Set(refs).size === refs.length &&
          refs.every((ref) => typeof ref === 'string' && VISUAL_EVIDENCE_REF_PATTERN.test(ref)) &&
          VISUAL_EVIDENCE_KINDS.has(option.kind) &&
          VISUAL_EVIDENCE_TRUTH_VALUES.has(option.truth) &&
          VISUAL_EVIDENCE_CLAIM_SUPPORT.has(option.claimSupport) &&
          VISUAL_EVIDENCE_INDEPENDENCE_RESULTS.has(option.independenceTest) &&
          VISUAL_EVIDENCE_RIGHTS_VALUES.has(option.rights) &&
          VISUAL_EVIDENCE_TECHNICAL_VALUES.has(option.technical) &&
          VISUAL_EVIDENCE_DECISIONS.has(option.decision) &&
          nonEmptyString(option.reason);
        if (!optionValid) {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_EVIDENCE_OPTION_INVALID',
              `${pageId}.${slot.id} contains an option without canonical refs, kind, truth, claimSupport, independenceTest, rights, technical, decision, and reason fields.`,
              pagePlanPath
            )
          );
          valid = false;
          continue;
        }

        const unknownRefs = refs.filter((ref) => !assetIdSet.has(ref));
        if (unknownRefs.length > 0) {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_EVIDENCE_REF_UNKNOWN',
              `${pageId}.${slot.id} references IDs absent from source-map.md: ${unknownRefs.join(', ')}.`,
              pagePlanPath
            )
          );
          valid = false;
        }
        for (const ref of refs.filter((ref) => VISUAL_EVIDENCE_ASSET_PATTERN.test(ref))) {
          referencedAssetIds.add(ref);
          const assetRow = assetRowsById.get(ref);
          if (
            assetRow &&
            (assetRow.kind !== option.kind ||
              assetRow.truth !== option.truth ||
              assetRow.rights !== option.rights ||
              assetRow.technical !== option.technical)
          ) {
            issues.push(
              makeIssue(
                'error',
                'VISUAL_EVIDENCE_SOURCE_GATE_MISMATCH',
                `${pageId}.${slot.id} option gates for ${ref} do not match the canonical Reusable assets row.`,
                pagePlanPath
              )
            );
            valid = false;
          }
        }

        const hardGateRejected =
          option.independenceTest !== 'pass' ||
          ['restatement', 'decoration'].includes(option.claimSupport) ||
          option.rights === 'blocked' ||
          option.technical !== 'ready' ||
          option.truth === 'placeholder' ||
          option.kind === 'placeholder';
        if (hardGateRejected && option.decision !== 'rejected') {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_EVIDENCE_HARD_GATE_FAILED',
              `${pageId}.${slot.id} keeps an independence-, claim-support-, usage-, technical-, or truth-gated option as ${option.decision}; it must be rejected.`,
              pagePlanPath
            )
          );
          valid = false;
        }
        if (option.decision === 'selected') {
          selectedCount += 1;
          selectedOption = option;
        }
        if (
          option.decision !== 'rejected' &&
          page.evidenceDemand === 'required' &&
          slot.role === 'primary' &&
          (['illustration', 'generated', 'placeholder'].includes(option.kind) ||
            ['generated-nonfactual', 'placeholder'].includes(option.truth))
        ) {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_EVIDENCE_REQUIRED_FACTUAL_INVALID',
              `${pageId}.${slot.id} keeps generated, illustrative, or placeholder material as ${option.decision} for required primary evidence; it must be rejected.`,
              pagePlanPath
            )
          );
          valid = false;
        }
        if (
          option.decision !== 'rejected' &&
          slot.role === 'primary' &&
          !claimSupportMatchesObjective(page.evidenceObjective, option.claimSupport)
        ) {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_EVIDENCE_CAPABILITY_INVALID',
              `${pageId}.${slot.id} keeps ${option.claimSupport} as ${option.decision}, but a primary slot on a ${page.evidenceObjective} page requires compatible claim support.`,
              pagePlanPath
            )
          );
          valid = false;
        }
      }

      if (selectedCount !== 1) {
        issues.push(
          makeIssue(
            'error',
            'VISUAL_EVIDENCE_SELECTION_INVALID',
            `${pageId}.${slot.id} must contain exactly one selected option; found ${selectedCount}.`,
            pagePlanPath
          )
        );
        valid = false;
      } else {
        selectedSlots.set(`${pageId}.${slot.id}`, {
          pageId,
          slotId: slot.id,
          role: slot.role,
          objective: page.evidenceObjective,
          acceptance: slot.acceptance,
          refs: selectedOption.refs,
          option: selectedOption,
          staticFallbackRefs: new Set(
            options
              .filter(
                (option) =>
                  option?.decision === 'fallback' &&
                  Array.isArray(option.refs) &&
                  option.refs.length === 1 &&
                  VISUAL_EVIDENCE_REF_PATTERN.test(option.refs[0] ?? '')
              )
              .map((option) => option.refs[0])
          )
        });
      }
    }
  }

  if (referencedAssetIds.size > 0 && !assetRowsValid) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_ASSET_INVENTORY_INVALID',
        'Visual Evidence Plan A<NN> refs require the canonical nine-column Reusable assets table with unique IDs, exact enums, and truth values followed by ` — ` provenance.',
        sourceMapPath
      )
    );
    checks.markdown[sourceMapPath] = false;
    valid = false;
    assetInventoryIssueReported = true;
  }

  const realizedBindings = new Map();
  const staticAssetIds = new Set();
  for (const pageId of roster) {
    const canvas = lock.composition?.pages?.[pageId]?.canvas;
    if (!Array.isArray(canvas)) continue;
    for (const canvasEntry of canvas) {
      if (canvasEntry.evidence === undefined) continue;
      if (!Array.isArray(canvasEntry.evidence) || canvasEntry.evidence.length === 0) {
        issues.push(
          makeIssue(
            'error',
            'VISUAL_EVIDENCE_COMPOSITION_INVALID',
            `${pageId} canvas evidence must be a non-empty array when present.`,
            lockPath
          )
        );
        valid = false;
        continue;
      }
      for (const binding of canvasEntry.evidence) {
        const bindingShapeValid = hasExactObjectKeys(binding, [
          'slot',
          'refs',
          'treatment',
          'static'
        ]);
        const bindingValid =
          bindingShapeValid &&
          nonEmptyString(binding.slot) &&
          Array.isArray(binding.refs) &&
          binding.refs.length > 0 &&
          new Set(binding.refs).size === binding.refs.length &&
          binding.refs.every(
            (ref) => typeof ref === 'string' && VISUAL_EVIDENCE_REF_PATTERN.test(ref)
          ) &&
          nonEmptyString(binding.treatment) &&
          (binding.static === 'same' ||
            binding.static === 'state:complete' ||
            /^asset:A\d{2,}$/u.test(binding.static ?? ''));
        const selectedSlot = bindingShapeValid ? selectedSlots.get(binding.slot) : undefined;
        const roleValid =
          selectedSlot &&
          ((selectedSlot.role === 'primary' && canvasEntry.role === 'primary') ||
            (selectedSlot.role === 'support' &&
              ['primary', 'support'].includes(canvasEntry.role)));
        if (
          !bindingValid ||
          !selectedSlot ||
          selectedSlot.pageId !== pageId ||
          !equalStringSets(binding.refs, selectedSlot.refs) ||
          !roleValid
        ) {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_EVIDENCE_COMPOSITION_INVALID',
              `${pageId} canvas evidence must bind one selected page slot, the exact selected refs, a compatible primary/support role, treatment, and a deterministic static state.`,
              lockPath
            )
          );
          valid = false;
          continue;
        }
        const staticAsset = binding.static.match(/^asset:(A\d{2,})$/u)?.[1];
        if (staticAsset) {
          staticAssetIds.add(staticAsset);
          const assetRow = assetRowsById.get(staticAsset);
          const plannedStaticAsset =
            selectedSlot.refs.includes(staticAsset) ||
            selectedSlot.staticFallbackRefs.has(staticAsset);
          const staticHardGatesPass =
            assetRow?.rights !== 'blocked' &&
            assetRow?.technical === 'ready' &&
            assetRow?.kind !== 'placeholder' &&
            assetRow?.truth !== 'placeholder' &&
            !(
              planPages[pageId].evidenceDemand === 'required' &&
              selectedSlot.role === 'primary' &&
              (['illustration', 'generated', 'placeholder'].includes(assetRow?.kind) ||
                ['generated-nonfactual', 'placeholder'].includes(assetRow?.truth))
            );
          if (!plannedStaticAsset || !staticHardGatesPass) {
            issues.push(
              makeIssue(
                'error',
                'VISUAL_EVIDENCE_STATIC_FALLBACK_INVALID',
                `${binding.slot} static asset ${staticAsset} must be a selected ref or the sole ref of an explicit fallback option and must pass source-map truth, non-blocked usage, and technical hard gates.`,
                lockPath
              )
            );
            valid = false;
          }
        }
        if (!realizedBindings.has(binding.slot)) realizedBindings.set(binding.slot, []);
        realizedBindings.get(binding.slot).push(binding);
      }
    }
  }

  const missingBindings = [...selectedSlots.keys()].filter(
    (slotId) => !realizedBindings.has(slotId)
  );
  if (missingBindings.length > 0) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_COMPOSITION_MISMATCH',
        `Selected evidence slots are not bound into the locked composition: ${missingBindings.join(', ')}.`,
        lockPath
      )
    );
    valid = false;
  }

  const reviewSection = contractSections[qaReportPath]?.get('visual evidence review');
  const selectedEvidencePages = new Set(
    [...selectedSlots.values()].map((selectedSlot) => selectedSlot.pageId)
  );
  const reviewPageIds = sectionPageIds(reviewSection);
  const reviewMissingPages = [...selectedEvidencePages].filter(
    (pageId) => !reviewPageIds.has(pageId)
  );
  if (!hasSubstantiveMarkdown(reviewSection ?? '') || reviewMissingPages.length > 0) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_REVIEW_INVALID',
        `Visual Evidence Plan requires a substantive Visual evidence review section covering every page with selected evidence${reviewMissingPages.length > 0 ? `; missing: ${reviewMissingPages.join(', ')}` : ''}.`,
        qaReportPath
      )
    );
    checks.markdown[qaReportPath] = false;
    valid = false;
  }

  const reviewLines = (reviewSection ?? '').split(/\r?\n/u).map((line) => line.trim());
  const requiredPrimarySlots = [...selectedSlots.entries()].filter(
    ([, selectedSlot]) =>
      selectedSlot.role === 'primary' &&
      ['prove', 'explain', 'qualify'].includes(selectedSlot.objective)
  );
  const missingCarrierOnlyPass = requiredPrimarySlots
    .map(([slotKey]) => slotKey)
    .filter((slotKey) => {
      const marker = `${slotKey} — carrier-only: PASS — `;
      return !reviewLines.some(
        (line) => line.startsWith(marker) && nonEmptyString(line.slice(marker.length))
      );
    });
  if (missingCarrierOnlyPass.length > 0) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_CARRIER_REVIEW_INVALID',
        `Every required primary slot needs a final carrier-only PASS observation using the canonical line format; missing: ${missingCarrierOnlyPass.join(', ')}.`,
        qaReportPath
      )
    );
    checks.markdown[qaReportPath] = false;
    valid = false;
  }

  if (staticAssetIds.size > 0 && !assetRowsValid && !assetInventoryIssueReported) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_ASSET_INVENTORY_INVALID',
        'Active static A<NN> refs require the canonical nine-column Reusable assets table with unique IDs, exact enums, and truth values followed by ` — ` provenance.',
        sourceMapPath
      )
    );
    checks.markdown[sourceMapPath] = false;
    valid = false;
  }

  const selectedAssetIds = new Set(
    [...selectedSlots.values()].flatMap((slot) =>
      slot.refs.filter((ref) => VISUAL_EVIDENCE_ASSET_PATTERN.test(ref))
    )
  );
  const lockedEvidenceAssetIds = new Set([...selectedAssetIds, ...staticAssetIds]);
  const requiredAssetEntries = (lock.requiredAssets ?? []).filter((asset) => asset?.id !== undefined);
  const requiredAssetIds = requiredAssetEntries.map((asset) => asset.id);
  const duplicateRequiredAssetIds = requiredAssetIds.filter(
    (id, index) => requiredAssetIds.indexOf(id) !== index
  );
  let assetLockValid =
    duplicateRequiredAssetIds.length === 0 &&
    requiredAssetEntries.every((asset) => VISUAL_EVIDENCE_ASSET_PATTERN.test(asset.id));
  for (const assetId of lockedEvidenceAssetIds) {
    const assetRow = assetRowsById.get(assetId);
    const matches = requiredAssetEntries.filter((asset) => asset.id === assetId);
    const lockedAsset = matches[0];
    const codeBackedVisual =
      PROGRAMMATIC_VISUAL_KINDS.has(assetRow?.kind) &&
      PROGRAMMATIC_VISUAL_EXTENSIONS.has(
        extname(assetRow?.localDestination ?? '').toLowerCase()
      );
    const renderContractValid =
      !codeBackedVisual ||
      (matches.length === 1 &&
        RENDER_ROUTES.has(lockedAsset?.renderRoute) &&
        (!GENERATED_RENDER_ROUTES.has(lockedAsset?.renderRoute) ||
          nonEmptyString(lockedAsset?.generator)));
    if (
      !assetRow ||
      matches.length !== 1 ||
      matches[0].path !== assetRow.localDestination ||
      matches[0].status !== 'ready' ||
      matches[0].provenance !== `source-map:${assetId}` ||
      !renderContractValid
    ) {
      assetLockValid = false;
    }
    if (!renderContractValid) {
      issues.push(
        makeIssue(
          'error',
          'VISUAL_RENDER_ROUTE_INVALID',
          `${assetId} is a selected code-backed ${assetRow?.kind ?? 'visual'} and must lock one supported renderRoute; generated routes also require a project-local generator.`,
          lockPath
        )
      );
    }
  }
  if (
    requiredAssetEntries.some(
      (asset) =>
        VISUAL_EVIDENCE_ASSET_PATTERN.test(asset.id) &&
        !lockedEvidenceAssetIds.has(asset.id)
    )
  ) {
    assetLockValid = false;
  }
  if (!assetLockValid) {
    issues.push(
      makeIssue(
        'error',
        'VISUAL_EVIDENCE_ASSET_LOCK_MISMATCH',
        'Every selected or active static A<NN> asset must have exactly one requiredAssets entry whose id, path, ready status, and source-map:A<NN> provenance match source-map.md; unused evidence assets must not be locked.',
        lockPath
      )
    );
    valid = false;
  }

  if (!valid) checks.markdown[pagePlanPath] = false;
  return valid;
}

function validateRegistryCandidateDecisions(lock, roster, contractSections, checks, issues) {
  const pagePlanPath = '.slideblocks/page-plan.md';
  const section = contractSections[pagePlanPath]?.get('registry candidate decisions');
  if (section === undefined) {
    issues.push(
      makeIssue(
        'warning',
        'REGISTRY_CANDIDATE_DECISIONS_MISSING',
        'This schemaVersion 2 project predates the Registry Candidate Decisions page-plan contract. Regenerate the page plan to record candidate gates and signature evidence; compatibility validation continues with final composition signatures.',
        pagePlanPath
      )
    );
    return { valid: true };
  }

  const projection = parseSingleJsonProjection(section);
  if (!hasSubstantiveMarkdown(section) || !projection.ok) {
    issues.push(
      makeIssue(
        'error',
        'REGISTRY_CANDIDATE_DECISIONS_INVALID',
        'Registry Candidate Decisions must contain exactly one parseable fenced json object with the canonical per-page candidate projection.',
        pagePlanPath
      )
    );
    checks.markdown[pagePlanPath] = false;
    return { valid: false };
  }

  const candidatePages = projection.value.pages;
  const pageKeys =
    candidatePages && typeof candidatePages === 'object' && !Array.isArray(candidatePages)
      ? Object.keys(candidatePages)
      : [];
  const pageKeySet = new Set(pageKeys);
  let structurallyValid =
    hasExactObjectKeys(projection.value, ['pages']) &&
    pageKeys.length === roster.length &&
    roster.every((pageId) => pageKeySet.has(pageId));
  let valid = structurallyValid;
  if (structurallyValid) {
    for (const pageId of roster) {
      const page = candidatePages[pageId];
      const candidates = page?.candidates;
      if (
        !hasExactObjectKeys(page, ['candidates']) ||
        !Array.isArray(candidates) ||
        candidates.length === 0
      ) {
        structurallyValid = false;
        continue;
      }

      let selectedCount = 0;
      let selectedCandidate;
      for (const candidate of candidates) {
        const candidateShapeValid = hasExactObjectKeys(candidate, [
          'id',
          'source',
          'gates',
          'grammarFit',
          'signature',
          'signatureEvidence',
          'decision',
          'reason'
        ]);
        const gatesValid =
          candidateShapeValid &&
          hasExactObjectKeys(candidate.gates, Object.keys(REGISTRY_CANDIDATE_GATE_VALUES)) &&
          Object.entries(REGISTRY_CANDIDATE_GATE_VALUES).every(([gate, allowed]) =>
            allowed.has(candidate.gates[gate])
          );
        const knownSignature = candidateShapeValid && candidate.signature?.status === 'known';
        const unknownSignature = candidateShapeValid && candidate.signature?.status === 'unknown';
        const signatureValid =
          (knownSignature &&
            hasExactObjectKeys(candidate.signature, [
              'status',
              'topology',
              'axis',
              'primaryZone'
            ]) &&
            COMPOSITION_TOPOLOGIES.has(candidate.signature.topology) &&
            COMPOSITION_AXES.has(candidate.signature.axis) &&
            COMPOSITION_PRIMARY_ZONES.has(candidate.signature.primaryZone) &&
            nonEmptyString(candidate.signatureEvidence)) ||
          (unknownSignature &&
            hasExactObjectKeys(candidate.signature, ['status']) &&
            candidate.signatureEvidence === null);
        const sourceAndIdValid =
          candidateShapeValid &&
          REGISTRY_CANDIDATE_SOURCES.has(candidate.source) &&
          ((candidate.source === 'custom' && candidate.id === 'custom') ||
            (candidate.source !== 'custom' &&
              typeof candidate.id === 'string' &&
              REGISTRY_BLOCK_ID_PATTERN.test(candidate.id)));
        const candidateValid =
          candidateShapeValid &&
          gatesValid &&
          signatureValid &&
          sourceAndIdValid &&
          REGISTRY_CANDIDATE_GRAMMAR_FITS.has(candidate.grammarFit) &&
          REGISTRY_CANDIDATE_DECISIONS.has(candidate.decision) &&
          nonEmptyString(candidate.reason);

        if (!candidateValid) {
          structurallyValid = false;
          continue;
        }

        if (candidate.decision === 'selected') {
          selectedCount += 1;
          selectedCandidate = candidate;
        }

        const hasRejectGate = Object.values(candidate.gates).includes('reject');
        if (
          hasRejectGate &&
          (candidate.decision !== 'rejected' ||
            candidate.signature.status !== 'unknown' ||
            candidate.signatureEvidence !== null)
        ) {
          issues.push(
            makeIssue(
              'error',
              'REGISTRY_CANDIDATE_REJECT_GATE',
              `${pageId} candidate ${candidate.id} retains a reject gate after the hard-gate stage. A reject-gated candidate must be decision=rejected with signature status=unknown and null signatureEvidence; only non-reject soft-ranking losses may retain a known signature.`,
              pagePlanPath
            )
          );
          valid = false;
        }
      }

      if (selectedCount !== 1) {
        structurallyValid = false;
        continue;
      }

      if (selectedCandidate.signature.status === 'known') {
        const selectedSignature = normalizedCompositionSignature(selectedCandidate.signature);
        const finalPage = lock.composition?.pages?.[pageId];
        const finalFamily = lock.composition?.families?.[finalPage?.family];
        if (
          finalFamily &&
          normalizedCompositionSignature(finalFamily) !== selectedSignature
        ) {
          issues.push(
            makeIssue(
              'error',
              'REGISTRY_CANDIDATE_SIGNATURE_MISMATCH',
              `${pageId} selected candidate signature ${selectedSignature} does not match final composition family ${normalizedCompositionSignature(finalFamily)}.`,
              pagePlanPath
            )
          );
          valid = false;
        }
      }

      if (
        selectedCandidate.source === 'custom' &&
        (selectedCandidate.signature.status !== 'known' ||
          !hasCustomPlanEvidence(selectedCandidate.signatureEvidence, pageId))
      ) {
        issues.push(
          makeIssue(
            'error',
            'REGISTRY_CUSTOM_SIGNATURE_INVALID',
            `${pageId} selected custom candidate must have a known signature with signatureEvidence containing the exact token custom-plan:${pageId}.`,
            pagePlanPath
          )
        );
        valid = false;
      }

      if (
        selectedCandidate.source === 'live-catalog' &&
        (!Array.isArray(lock.registryArtifacts) ||
          !lock.registryArtifacts.some(
            (artifact) =>
              artifact?.id === selectedCandidate.id &&
              Array.isArray(artifact.assignedPages) &&
              artifact.assignedPages.includes(pageId)
          ))
      ) {
        issues.push(
          makeIssue(
            'error',
            'REGISTRY_CANDIDATE_ARTIFACT_MISMATCH',
            `${pageId} selects live-catalog candidate ${selectedCandidate.id}, but execution-lock.json has no matching Registry Artifact assigned to that page.`,
            pagePlanPath
          )
        );
        valid = false;
      }
    }
  }

  if (!structurallyValid) {
    issues.push(
      makeIssue(
        'error',
        'REGISTRY_CANDIDATE_DECISIONS_INVALID',
        'Registry Candidate Decisions must map exactly to slideOrder; each page needs a non-empty candidates array with exactly one selected candidate, canonical fields and enums, coherent source/ID, all four gates, a non-empty reason, and known signature evidence or null evidence for unknown signatures. Preview completeness and semantic fitness remain QA judgments.',
        pagePlanPath
      )
    );
    valid = false;
  }

  if (!valid) checks.markdown[pagePlanPath] = false;
  return { valid };
}

function validateCompositionContract(lock, roster, contractSections, checks, issues) {
  const pagePlanPath = '.slideblocks/page-plan.md';
  const qaReportPath = '.slideblocks/qa-report.md';
  const lockPath = '.slideblocks/execution-lock.json';
  const planSection = contractSections[pagePlanPath]?.get('deck composition plan');
  const reviewSection = contractSections[qaReportPath]?.get('deck composition review');
  const reviewMissingPages = roster.filter((page) => !sectionPageIds(reviewSection).has(page));
  const planProjection = parseSingleJsonProjection(planSection);
  let valid = true;

  if (!hasSubstantiveMarkdown(planSection ?? '') || !planProjection.ok) {
    issues.push(
      makeIssue(
        'error',
        'DECK_COMPOSITION_PLAN_INVALID',
        'schemaVersion 2 requires Deck composition plan to contain exactly one parseable fenced json object with the canonical composition families/pages projection.',
        pagePlanPath
      )
    );
    checks.markdown[pagePlanPath] = false;
    valid = false;
  } else if (!isDeepStrictEqual(planProjection.value, lock.composition)) {
    issues.push(
      makeIssue(
        'error',
        'DECK_COMPOSITION_PLAN_MISMATCH',
        'The canonical composition projection in page-plan.md does not equal execution-lock.json.composition; update the page plan authority first and regenerate the lock.',
        pagePlanPath
      )
    );
    checks.markdown[pagePlanPath] = false;
    valid = false;
  }

  if (!hasSubstantiveMarkdown(reviewSection ?? '') || reviewMissingPages.length > 0) {
    issues.push(
      makeIssue(
        'error',
        'DECK_COMPOSITION_REVIEW_INVALID',
        `schemaVersion 2 requires a substantive Deck composition review section covering every locked page${reviewMissingPages.length > 0 ? `; missing: ${reviewMissingPages.join(', ')}` : ''}.`,
        qaReportPath
      )
    );
    checks.markdown[qaReportPath] = false;
    valid = false;
  }

  const composition = lock.composition;
  const families = composition?.families;
  const pages = composition?.pages;
  const compositionKeys =
    composition && typeof composition === 'object' && !Array.isArray(composition)
      ? Object.keys(composition)
      : [];
  const canonicalCompositionProjection =
    compositionKeys.length === 2 &&
    compositionKeys.includes('families') &&
    compositionKeys.includes('pages');
  const familyEntries =
    families && typeof families === 'object' && !Array.isArray(families)
      ? Object.entries(families)
      : [];
  const pageKeys =
    pages && typeof pages === 'object' && !Array.isArray(pages) ? Object.keys(pages) : [];
  const pageKeySet = new Set(pageKeys);
  const exactPageMapping =
    pageKeys.length === roster.length && roster.every((page) => pageKeySet.has(page));
  const validFamilies =
    familyEntries.length > 0 &&
    familyEntries.every(
      ([id, family]) =>
        nonEmptyString(id) &&
        family &&
        typeof family === 'object' &&
        !Array.isArray(family) &&
        COMPOSITION_TOPOLOGIES.has(family.topology) &&
        COMPOSITION_AXES.has(family.axis) &&
        COMPOSITION_PRIMARY_ZONES.has(family.primaryZone)
    );
  const validPages =
    exactPageMapping &&
    roster.every((pageId) => {
      const page = pages[pageId];
      const pageCanvas = page?.canvas;
      return (
        page &&
        typeof page === 'object' &&
        !Array.isArray(page) &&
        nonEmptyString(page.family) &&
        Object.hasOwn(families ?? {}, page.family) &&
        COMPOSITION_DENSITIES.has(page.density) &&
        Array.isArray(pageCanvas) &&
        pageCanvas.length > 0 &&
        pageCanvas.every(
          (entry) =>
            entry &&
            typeof entry === 'object' &&
            !Array.isArray(entry) &&
            COMPOSITION_CANVAS_ROLES.has(entry.role) &&
            COMPOSITION_CANVAS_ZONES.has(entry.zone) &&
            nonEmptyString(entry.purpose)
        ) &&
        pageCanvas.some((entry) => entry.role === 'primary') &&
        (page.repetitionIntent === undefined ||
          repetitionIntentCovers(page.repetitionIntent, pageId, roster, [pageId]))
      );
    });

  if (!canonicalCompositionProjection || !validFamilies || !validPages) {
    issues.push(
      makeIssue(
        'error',
        'COMPOSITION_CONTRACT_INVALID',
        'schemaVersion 2 requires non-empty normalized composition families and an exact per-page mapping with valid family references, density, allowed canvas zones and roles, a purpose for every canvas entry, at least one primary role, and a substantive finite non-generic repetition intent when present. Structural validation cannot establish semantic validity; QA must judge whether the stated repetition is real.',
        lockPath
      )
    );
    return false;
  }

  return valid;
}

function validWorkflowInput(input, root) {
  if (!input || typeof input !== 'object') return false;
  const validHash = /^sha256:[a-f0-9]{64}$/u.test(input.sha256 ?? '');
  if (!validHash) return false;
  if (input.kind === 'file') {
    if (typeof input.path !== 'string' || input.path.trim().length === 0) return false;
    const inputPath = resolve(root, input.path);
    if (!pathStaysInside(root, inputPath)) return true;
    if (!existsSync(inputPath) || !statSync(inputPath).isFile()) return false;
    const realRoot = realpathSync(root);
    const realInput = realpathSync(inputPath);
    if (!pathStaysInside(realRoot, realInput)) return false;
    const actual = createHash('sha256').update(readFileSync(realInput)).digest('hex');
    return input.sha256 === `sha256:${actual}`;
  }
  if (input.kind === 'text') {
    return typeof input.label === 'string' && input.label.trim().length > 0;
  }
  if (input.kind !== 'url' || typeof input.url !== 'string') return false;
  try {
    const url = new URL(input.url);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      typeof input.retrievedAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u.test(
        input.retrievedAt
      ) &&
      Number.isFinite(Date.parse(input.retrievedAt))
    );
  } catch {
    return false;
  }
}

function validateProjectContract(root, entryPath, slides, issues) {
  const checks = {
    markdown: {},
    executionLock: undefined,
    workflowState: undefined
  };
  const contractContents = {};
  const contractSections = {};

  for (const [relativeContractPath, requiredSections] of Object.entries(
    REQUIRED_CONTRACT_MARKDOWN
  )) {
    const contractPath = join(root, relativeContractPath);
    if (!existsSync(contractPath) || !statSync(contractPath).isFile()) {
      issues.push(
        makeIssue(
          'error',
          'PROJECT_CONTRACT_MISSING',
          `Required SlideBlocks project artifact is missing: ${relativeContractPath}`,
          relativeContractPath
        )
      );
      checks.markdown[relativeContractPath] = false;
      continue;
    }
    const content = readFileSync(contractPath, 'utf8').trim();
    const sections = markdownSectionMap(content);
    contractContents[relativeContractPath] = content;
    contractSections[relativeContractPath] = sections;
    const missingSections = requiredSections.filter(
      (heading) => !sections.has(heading.toLowerCase())
    );
    const emptySections = requiredSections.filter(
      (heading) =>
        sections.has(heading.toLowerCase()) &&
        !hasSubstantiveMarkdown(sections.get(heading.toLowerCase()))
    );
    const missingRoster =
      relativeContractPath === '.slideblocks/page-plan.md' &&
      !/^\|\s*P\d{2,}\s*\|/mu.test(content);
    const missingQaPage =
      relativeContractPath === '.slideblocks/qa-report.md' && !/\bP\d{2,}\b/u.test(content);
    if (
      content.length < 40 ||
      missingSections.length > 0 ||
      emptySections.length > 0 ||
      missingRoster ||
      missingQaPage
    ) {
      const details = [
        missingSections.length > 0 ? `missing sections: ${missingSections.join(', ')}` : undefined,
        emptySections.length > 0 ? `empty sections: ${emptySections.join(', ')}` : undefined,
        missingRoster ? 'missing an exact P<NN> roster row' : undefined,
        missingQaPage ? 'missing an inspected P<NN> page ID' : undefined
      ].filter(Boolean);
      issues.push(
        makeIssue(
          'error',
          'PROJECT_CONTRACT_EMPTY',
          `Required SlideBlocks project artifact is empty or incomplete: ${relativeContractPath}${details.length > 0 ? ` (${details.join('; ')})` : ''}`,
          relativeContractPath
        )
      );
      checks.markdown[relativeContractPath] = false;
      continue;
    }
    checks.markdown[relativeContractPath] = true;
  }

  const inventoryRows = sourceInventoryRows(
    contractSections['.slideblocks/source-map.md']?.get('source inventory') ?? ''
  );
  const sourceInventorySection =
    contractSections['.slideblocks/source-map.md']?.get('source inventory') ?? '';
  const hasCanonicalInventoryHeader = sourceInventorySection
    .split(/\r?\n/u)
    .some(
      (line) =>
        line.trim() ===
        '| Input ID | Kind | Location | Role | Status | Provenance and notes |'
    );
  const inventoryIds = new Set(inventoryRows.map((entry) => entry.id));
  const inventoryKeys = inventoryRows
    .filter((entry) => entry.id !== 'NONE')
    .map((entry) => `${entry.kind}:${entry.location}`);
  const validNoInputInventory =
    inventoryRows.length === 1 &&
    inventoryRows[0].id === 'NONE' &&
    inventoryRows[0].kind === 'none' &&
    inventoryRows[0].location === 'none' &&
    inventoryRows[0].cellCount === 6 &&
    [inventoryRows[0].role, inventoryRows[0].status, inventoryRows[0].provenance].every(
      (value) => typeof value === 'string' && value.trim().length > 0
    );
  const validInputInventory =
    inventoryRows.length > 0 &&
    inventoryRows.every(
      (entry) =>
        /^I\d{2,}$/u.test(entry.id) &&
        ['file', 'url', 'text'].includes(entry.kind) &&
        typeof entry.location === 'string' &&
        entry.location.length > 0 &&
        entry.cellCount === 6 &&
        [entry.role, entry.status, entry.provenance].every(
          (value) => typeof value === 'string' && value.trim().length > 0
        )
    ) &&
    inventoryIds.size === inventoryRows.length &&
    new Set(inventoryKeys).size === inventoryKeys.length;
  if (!hasCanonicalInventoryHeader || (!validNoInputInventory && !validInputInventory)) {
    issues.push(
      makeIssue(
        'error',
        'SOURCE_INVENTORY_INVALID',
        'source-map.md must contain the canonical six-column header plus complete unique I<NN> file/url/text rows or one complete NONE row.',
        '.slideblocks/source-map.md'
      )
    );
    checks.markdown['.slideblocks/source-map.md'] = false;
  }

  const lockPath = join(root, '.slideblocks', 'execution-lock.json');
  let lock;
  if (!existsSync(lockPath) || !statSync(lockPath).isFile()) {
    issues.push(
      makeIssue(
        'error',
        'PROJECT_CONTRACT_MISSING',
        'Required SlideBlocks project artifact is missing: .slideblocks/execution-lock.json',
        '.slideblocks/execution-lock.json'
      )
    );
  } else {
    try {
      lock = readJson(lockPath);
    } catch (error) {
      issues.push(
        makeIssue(
          'error',
          'EXECUTION_LOCK_INVALID',
          `Execution lock cannot be parsed: ${error instanceof Error ? error.message : String(error)}`,
          '.slideblocks/execution-lock.json'
        )
      );
    }
  }

  if (lock) {
    const roster = Array.isArray(lock.slideOrder) ? lock.slideOrder : [];
    const rosterSet = new Set(roster);
    const realizedPageIds = slidePageIds(slides);
    const slideCount = slides.length;
    const outputs = lock.outputs;
    const canvas = lock.canvas;
    const style = lock.style;
    const pagePlanRoster = [
      ...(contractSections['.slideblocks/page-plan.md']
        ?.get('exact slide roster')
        ?.matchAll(/^\|\s*(P\d{2,})\s*\|/gmu) ?? [])
    ].map((match) => match[1]);
    const qaPageIds = new Set(
      contractSections['.slideblocks/qa-report.md']
        ?.get('rendered states')
        ?.match(/\bP\d{2,}\b/gu) ?? []
    );
    let valid =
      [1, 2].includes(lock.schemaVersion) &&
      PROJECT_ROUTES.has(lock.route) &&
      canvas &&
      Number.isFinite(canvas.width) &&
      canvas.width > 0 &&
      Number.isFinite(canvas.height) &&
      canvas.height > 0 &&
      roster.length > 0 &&
      roster.every((page) => typeof page === 'string' && /^P\d{2,}$/u.test(page)) &&
      rosterSet.size === roster.length &&
      Array.isArray(lock.registryArtifacts) &&
      Array.isArray(lock.requiredAssets) &&
      style &&
      typeof style.direction === 'string' &&
      style.direction.trim().length > 0 &&
      style.palette &&
      typeof style.palette === 'object' &&
      style.typography &&
      typeof style.typography === 'object' &&
      outputs &&
      outputs.editableSource === relativePath(root, entryPath) &&
      outputs.offlineFile === 'offline.html' &&
      Array.isArray(outputs.staticExports);

    if (lock.schemaVersion === 2) {
      const candidateDecisions = validateRegistryCandidateDecisions(
        lock,
        roster,
        contractSections,
        checks,
        issues
      );
      if (!candidateDecisions.valid) valid = false;
      if (
        !validateCompositionContract(lock, roster, contractSections, checks, issues)
      ) {
        valid = false;
      }
    }
    if (
      !validateVisualEvidenceContract(
        lock,
        roster,
        contractSections,
        inventoryIds,
        checks,
        issues
      )
    ) {
      valid = false;
    }

    const realizedOrderMatches =
      roster.length === realizedPageIds.length &&
      roster.every((page, index) => page === realizedPageIds[index]);
    if (roster.length !== slideCount || !realizedOrderMatches) {
      issues.push(
        makeIssue(
          'error',
          'PAGE_ROSTER_MISMATCH',
          `execution-lock.json declares [${roster.join(', ')}] but the Slidev source markers resolve to [${realizedPageIds.map((page) => page ?? 'missing-or-duplicate').join(', ')}].`,
          '.slideblocks/execution-lock.json'
        )
      );
      valid = false;
    }

    const pagePlanOrderMatches =
      pagePlanRoster.length === roster.length &&
      roster.every((page, index) => page === pagePlanRoster[index]);
    if (!pagePlanOrderMatches) {
      issues.push(
        makeIssue(
          'error',
          'PAGE_PLAN_ROSTER_MISMATCH',
          `page-plan.md declares [${pagePlanRoster.join(', ')}] but execution-lock.json declares [${roster.join(', ')}].`,
          '.slideblocks/page-plan.md'
        )
      );
      checks.markdown['.slideblocks/page-plan.md'] = false;
      valid = false;
    }

    const qaMissingPages = roster.filter((page) => !qaPageIds.has(page));
    if (qaMissingPages.length > 0) {
      issues.push(
        makeIssue(
          'error',
          'QA_PAGE_COVERAGE_MISMATCH',
          `qa-report.md does not identify rendered inspection for: ${qaMissingPages.join(', ')}.`,
          '.slideblocks/qa-report.md'
        )
      );
      checks.markdown['.slideblocks/qa-report.md'] = false;
      valid = false;
    }

    if (lock.route === 'powerpoint-migration') {
      const sourceMap = contractContents['.slideblocks/source-map.md'] ?? '';
      const migrationSection = contractSections['.slideblocks/source-map.md']?.get(
        'migration accounting'
      );
      const migrationPath = join(root, 'migration', 'source-map.md');
      const migrationContent =
        existsSync(migrationPath) && statSync(migrationPath).isFile()
          ? readFileSync(migrationPath, 'utf8').trim()
          : '';
      const declaredSourceCount = Number(
        migrationSection?.match(/^Source slide count:\s*(\d+)\s*$/imu)?.[1]
      );
      const migrationRows = migrationContent
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('|') && line.endsWith('|'))
        .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
        .filter((cells) => /^\d+$/u.test(cells[0] ?? '') && cells.length === 7)
        .map((cells) => ({
          sourceSlide: Number(cells[0]),
          destinationPages: cells[1].match(/\bP\d{2,}\b/gu) ?? [],
          accountingComplete: cells.slice(2, 7).every((cell) => cell.trim().length > 0)
        }));
      const sourceSlides = new Set(migrationRows.map((row) => row.sourceSlide));
      const hasPowerPointInput = inventoryRows.some(
        (entry) => entry.kind === 'file' && /\.pptx?$/iu.test(entry.location)
      );
      const migrationRowsComplete =
        Number.isInteger(declaredSourceCount) &&
        declaredSourceCount > 0 &&
        migrationRows.length === declaredSourceCount &&
        sourceSlides.size === declaredSourceCount &&
        Array.from({ length: declaredSourceCount }, (_, index) => index + 1).every((slide) =>
          sourceSlides.has(slide)
        ) &&
        migrationRows.every(
          (row) =>
            row.destinationPages.length > 0 &&
            row.destinationPages.every((page) => rosterSet.has(page)) &&
            row.accountingComplete
        );
      if (
        !migrationSection ||
        !hasPowerPointInput ||
        !hasSubstantiveMarkdown(migrationSection) ||
        !sourceMap.includes('migration/source-map.md') ||
        !hasSubstantiveMarkdown(migrationContent) ||
        !migrationRowsComplete
      ) {
        issues.push(
          makeIssue(
            'error',
            'MIGRATION_ACCOUNTING_MISSING',
            'PowerPoint migration requires a PPT/PPTX source input, Source slide count, a linked migration/source-map.md, one unique row for every 1-based source slide, and only locked destination page IDs.',
            '.slideblocks/source-map.md'
          )
        );
        checks.markdown['.slideblocks/source-map.md'] = false;
        valid = false;
      }
    }

    for (const artifact of lock.registryArtifacts ?? []) {
      const artifactValid =
        artifact &&
        typeof artifact.id === 'string' &&
        REGISTRY_ARTIFACT_ID_PATTERN.test(artifact.id) &&
        typeof artifact.version === 'string' &&
        artifact.version.trim().length > 0 &&
        typeof artifact.contentHash === 'string' &&
        /^sha256:[a-f0-9]{64}$/u.test(artifact.contentHash) &&
        typeof artifact.promptVariant === 'string' &&
        artifact.promptVariant.trim().length > 0 &&
        Array.isArray(artifact.assignedPages) &&
        artifact.assignedPages.length > 0 &&
        artifact.assignedPages.every((page) => rosterSet.has(page));
      if (!artifactValid) {
        issues.push(
          makeIssue(
            'error',
            'EXECUTION_LOCK_INVALID',
            'Every selected Registry Artifact must include a valid ID, version, sha256 content hash, Prompt variant, and assigned pages from slideOrder.',
            '.slideblocks/execution-lock.json'
          )
        );
        valid = false;
      }
    }

    for (const asset of lock.requiredAssets ?? []) {
      const renderRouteDeclared = asset?.renderRoute !== undefined;
      const renderRouteValid =
        !renderRouteDeclared ||
        (asset.id !== undefined && RENDER_ROUTES.has(asset.renderRoute));
      const generatedRoute = GENERATED_RENDER_ROUTES.has(asset?.renderRoute);
      const generatorShapeValid =
        !generatedRoute || nonEmptyString(asset?.generator);
      const assetValid =
        asset &&
        (asset.id === undefined ||
          (typeof asset.id === 'string' && VISUAL_EVIDENCE_ASSET_PATTERN.test(asset.id))) &&
        typeof asset.path === 'string' &&
        asset.path.trim().length > 0 &&
        ASSET_STATUSES.has(asset.status) &&
        typeof asset.provenance === 'string' &&
        asset.provenance.trim().length > 0 &&
        renderRouteValid &&
        generatorShapeValid;
      if (!assetValid) {
        issues.push(
          makeIssue(
            'error',
            'EXECUTION_LOCK_INVALID',
            'Every required asset must include path, ready/placeholder/rights-review status, and provenance; an optional id must use A<NN>, a declared renderRoute must be supported, and generated routes require a generator.',
            '.slideblocks/execution-lock.json'
          )
        );
        valid = false;
        continue;
      }
      if (asset.status !== 'ready') continue;
      const assetPath = resolve(root, asset.path);
      const realAssetPath = projectLocalRealFile(root, assetPath);
      if (!realAssetPath) {
        issues.push(
          makeIssue(
            'error',
            'REQUIRED_ASSET_MISSING',
            `Ready asset does not resolve inside the project: ${asset.path}`,
            '.slideblocks/execution-lock.json'
          )
        );
        valid = false;
        continue;
      }
      if (
        renderRouteDeclared &&
        PROGRAMMATIC_VISUAL_EXTENSIONS.has(extname(asset.path).toLowerCase())
      ) {
        const source = readFileSync(realAssetPath, 'utf8');
        if (!declaresLiteralRenderCarrier(
          source,
          asset.id,
          asset.renderRoute,
          extname(asset.path).toLowerCase()
        )) {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_RENDER_ROUTE_MARKER_MISSING',
              `${asset.path} must mount literal data-slideblocks-asset-id="${asset.id}" and data-slideblocks-render-route="${asset.renderRoute}" attributes so the rendered carrier can be matched to its lock.`,
              asset.path
            )
          );
          valid = false;
        }
      }
      if (nonEmptyString(asset.generator)) {
        const generatorPath = resolve(root, asset.generator);
        if (!projectLocalRealFile(root, generatorPath)) {
          issues.push(
            makeIssue(
              'error',
              'VISUAL_RENDER_GENERATOR_MISSING',
              `Locked render generator does not resolve to a project-local file: ${asset.generator}`,
              '.slideblocks/execution-lock.json'
            )
          );
          valid = false;
        }
      }
    }

    if (!valid) {
      issues.push(
        makeIssue(
          'error',
          'EXECUTION_LOCK_INVALID',
          'execution-lock.json does not satisfy the SlideBlocks project contract.',
          '.slideblocks/execution-lock.json'
        )
      );
    }
    checks.executionLock = valid;
  } else {
    checks.executionLock = false;
  }

  const statePath = join(root, '.slideblocks', 'workflow-state.json');
  let state;
  if (!existsSync(statePath) || !statSync(statePath).isFile()) {
    issues.push(
      makeIssue(
        'error',
        'PROJECT_CONTRACT_MISSING',
        'Required SlideBlocks project artifact is missing: .slideblocks/workflow-state.json',
        '.slideblocks/workflow-state.json'
      )
    );
  } else {
    try {
      state = readJson(statePath);
    } catch (error) {
      issues.push(
        makeIssue(
          'error',
          'WORKFLOW_STATE_INVALID',
          `Workflow state cannot be parsed: ${error instanceof Error ? error.message : String(error)}`,
          '.slideblocks/workflow-state.json'
        )
      );
    }
  }

  if (state) {
    const stateInputShapesValid =
      Array.isArray(state.inputs) &&
      state.inputs.every((input) => validWorkflowInput(input, root));
    const stateInputKeys = stateInputShapesValid
      ? state.inputs.map(workflowInputKey).filter(Boolean)
      : [];
    const expectedInputKeys = validNoInputInventory ? [] : inventoryKeys;
    const inventoryMatchesState =
      (validNoInputInventory || validInputInventory) &&
      stateInputKeys.length === expectedInputKeys.length &&
      new Set(stateInputKeys).size === stateInputKeys.length &&
      expectedInputKeys.every((key) => stateInputKeys.includes(key));
    const valid =
      state.schemaVersion === 1 &&
      PROJECT_ROUTES.has(state.route) &&
      WORKFLOW_STAGES.has(state.stage) &&
      WORKFLOW_STATUSES.has(state.status) &&
      stateInputShapesValid &&
      Array.isArray(state.blockers) &&
      (!lock || state.route === lock.route) &&
      state.stage === 'delivery' &&
      state.status === 'complete' &&
      state.resumeFrom === null &&
      inventoryMatchesState &&
      state.blockers.length === 0 &&
      state.blockers.every((blocker) => typeof blocker === 'string');
    if (!inventoryMatchesState) {
      issues.push(
        makeIssue(
          'error',
          'WORKFLOW_INPUT_MISMATCH',
          'workflow-state.json inputs must match every canonical source-inventory row by kind and exact location.',
          '.slideblocks/workflow-state.json'
        )
      );
    }
    if (!valid) {
      issues.push(
        makeIssue(
          'error',
          'WORKFLOW_STATE_INVALID',
          'At handoff workflow-state.json must match the locked route, contain only valid input fingerprints, and use stage "delivery", status "complete", resumeFrom null, and no blockers.',
          '.slideblocks/workflow-state.json'
        )
      );
    }
    checks.workflowState = valid;
  } else {
    checks.workflowState = false;
  }

  return checks;
}

function readBuildRecord(root, issues) {
  const jsonPath = join(root, '.slideblocks', 'build-result.json');
  if (existsSync(jsonPath)) {
    let record;
    try {
      record = readJson(jsonPath);
    } catch (error) {
      issues.push(
        makeIssue(
          'error',
          'BUILD_RESULT_INVALID',
          `Build result JSON cannot be parsed: ${error instanceof Error ? error.message : String(error)}`,
          relativePath(root, jsonPath)
        )
      );
      return { path: relativePath(root, jsonPath), status: 'invalid' };
    }
    if (
      !['passed', 'failed'].includes(record.status) ||
      record.command !== 'npm run build:offline' ||
      record.outputFile !== 'offline.html' ||
      record.playback !== 'file://'
    ) {
      issues.push(
        makeIssue(
          'error',
          'BUILD_RESULT_INVALID',
          'Build result JSON must contain command "npm run build:offline", status "passed" or "failed", outputFile "offline.html", and playback "file://".',
          relativePath(root, jsonPath)
        )
      );
      return { path: relativePath(root, jsonPath), status: 'invalid' };
    }
    if (record.status === 'failed') {
      issues.push(
        makeIssue(
          'error',
          'FINAL_BUILD_FAILED',
          `The recorded final build failed: ${record.command}`,
          relativePath(root, jsonPath)
        )
      );
    }
    return {
      command: record.command,
      outputFile: record.outputFile,
      playback: record.playback,
      ...(record.portableOutputDir === 'portable'
        ? { portableOutputDir: record.portableOutputDir }
        : {}),
      path: relativePath(root, jsonPath),
      status: record.status
    };
  }

  for (const candidate of BUILD_RECORD_MARKDOWN_PATHS) {
    const path = join(root, candidate);
    if (!existsSync(path)) continue;
    const match = readFileSync(path, 'utf8').match(/^\s*Build result:\s*(passed|failed)\b/im);
    if (!match) continue;
    const status = match[1].toLowerCase();
    if (status === 'failed') {
      issues.push(
        makeIssue(
          'error',
          'FINAL_BUILD_FAILED',
          'The dedicated validation record says the final build failed.',
          relativePath(root, path)
        )
      );
    }
    return { path: relativePath(root, path), status };
  }

  issues.push(
    makeIssue(
      'error',
      'BUILD_RESULT_NOT_RECORDED',
      'Record the final build in .slideblocks/build-result.json or a dedicated validation Markdown file.'
    )
  );
  return { status: 'missing' };
}

export function validateSlideblocksProject({ entry, projectRoot = process.cwd() } = {}) {
  const root = resolve(projectRoot);
  const issues = [];
  const packagePath = join(root, 'package.json');
  const result = {
    scope: VALIDATION_SCOPE,
    projectRoot: root,
    entry: undefined,
    checks: {},
    issues
  };

  if (!existsSync(packagePath)) {
    issues.push(makeIssue('error', 'PACKAGE_JSON_MISSING', 'package.json does not exist.'));
    return { ...result, ok: false };
  }
  let packageJson;
  try {
    packageJson = readJson(packagePath);
    result.checks.packageJson = true;
  } catch (error) {
    issues.push(
      makeIssue(
        'error',
        'PACKAGE_JSON_INVALID',
        `package.json cannot be parsed: ${error instanceof Error ? error.message : String(error)}`,
        'package.json'
      )
    );
    return { ...result, ok: false };
  }

  const recognized = isSlidevProject(packageJson);
  result.checks.slidevProject = recognized;
  if (!recognized) {
    issues.push(
      makeIssue(
        'error',
        'NOT_SLIDEV_PROJECT',
        'No @slidev/cli dependency or Slidev package script was found.'
      )
    );
  }

  const entryReference = discoverEntry(packageJson, entry, issues);
  const entryPath = resolve(root, entryReference);
  result.entry = relativePath(root, entryPath);
  if (!entryPath.startsWith(`${root}/`) && entryPath !== root) {
    issues.push(
      makeIssue('error', 'ENTRY_OUTSIDE_PROJECT', `Configured entry leaves the project: ${entryReference}`)
    );
  } else if (!existsSync(entryPath) || !statSync(entryPath).isFile()) {
    issues.push(
      makeIssue('error', 'ENTRY_MISSING', `Slidev entry does not exist: ${result.entry}`, result.entry)
    );
  } else {
    result.checks.entry = true;
  }

  const buildScript = findScript(packageJson.scripts, 'build');
  const exportScript = findScript(packageJson.scripts, 'export');
  const offlineBuildScript = validateOfflineScript(root, packageJson.scripts, issues);
  const portableBuildScript = validatePortableScript(packageJson.scripts, issues);
  result.checks.buildScript = buildScript;
  result.checks.exportScript = exportScript;
  result.checks.offlineBuildScript = offlineBuildScript;
  result.checks.portableBuildScript = portableBuildScript;
  if (!buildScript) {
    issues.push(makeIssue('error', 'BUILD_SCRIPT_MISSING', 'No build script was found in package.json.'));
  }
  if (!exportScript) {
    issues.push(makeIssue('error', 'EXPORT_SCRIPT_MISSING', 'No export script was found in package.json.'));
  }

  if (result.checks.entry) {
    const entryContent = readFileSync(entryPath, 'utf8');
    result.checks.wakeLockDisabled = validateWakeLockHeadmatter(
      entryContent,
      result.entry,
      issues
    );
    const sourceFiles = collectSourceFiles(root, entryPath);
    const sourceChecks = validateSourceFiles(root, sourceFiles, issues);
    const slides = splitSlides(entryContent);
    const emptySlides = findEmptySlides(slides);
    for (const slide of emptySlides) {
      issues.push(
        makeIssue(
          'error',
          'EMPTY_SLIDE',
          `Slide ${slide} has no obvious visible content.`,
          result.entry
        )
      );
    }
    result.checks.sourceFiles = sourceFiles.length;
    result.checks.localResources = sourceChecks.resourceCount;
    result.checks.placeholders = sourceChecks.placeholderCount;
    result.checks.emptySlides = emptySlides.length;
    result.checks.projectContract = validateProjectContract(root, entryPath, slides, issues);
  }

  result.checks.bilingualReadme = validateBilingualReadme(root, issues);
  result.checks.offlineOutput = validateOfflineOutput(root, issues);

  result.checks.buildResult = readBuildRecord(root, issues);
  return { ...result, ok: !issues.some((issue) => issue.severity === 'error') };
}

function parseArguments(argv) {
  const options = { json: false, projectRoot: undefined, entry: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') options.json = true;
    else if (argument === '--entry') options.entry = argv[++index];
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('-')) throw new Error(`Unknown argument: ${argument}`);
    else if (!options.projectRoot) options.projectRoot = argument;
    else throw new Error(`Unexpected argument: ${argument}`);
  }
  if (argv.includes('--entry') && !options.entry) throw new Error('--entry requires a path.');
  return options;
}

function printHelp() {
  console.log(`Usage: node validate-slideblocks-project.mjs [project-path] [--entry slides.md] [--json]

Checks deterministic Slidev project structure, durable SlideBlocks planning/state artifacts, page-roster and
asset locks, page markers/order, local references, placeholders, scripts, bilingual usage, offline output,
empty pages, and the
final build record. Use .slideblocks/build-result.json with:
  { "command": "npm run build:offline", "status": "passed", "outputFile": "offline.html", "playback": "file://" }

${VALIDATION_SCOPE}`);
}

function printResult(result) {
  console.log(`SlideBlocks project validation: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Project: ${result.projectRoot}`);
  console.log(`Entry: ${result.entry ?? 'not found'}`);
  console.log(`Scope: ${result.scope}`);
  for (const issue of result.issues) {
    const location = issue.file ? ` ${issue.file}${issue.line ? `:${issue.line}` : ''}` : '';
    console.log(`[${issue.severity.toUpperCase()}] ${issue.code}${location} — ${issue.message}`);
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) printHelp();
    else {
      const result = validateSlideblocksProject({
        entry: options.entry,
        projectRoot: options.projectRoot ?? process.cwd()
      });
      if (options.json) console.log(JSON.stringify(result, null, 2));
      else printResult(result);
      if (!result.ok) process.exitCode = 1;
    }
  } catch (error) {
    console.error(`[slideblocks:validate] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
