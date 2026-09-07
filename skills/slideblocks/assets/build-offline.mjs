import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stateRoot = join(projectRoot, '.slideblocks');
const workRoot = join(stateRoot, 'offline-build');
const mirrorRoot = join(workRoot, 'project');
const buildRoot = join(workRoot, 'output');
const outputFile = join(projectRoot, 'offline.html');
const buildRecordPath = join(stateRoot, 'build-result.json');
const entry = detectSlidevEntry();

const excludedDirectories = new Set([
  '.git',
  '.slideblocks',
  '.slidev',
  'coverage',
  'dist',
  'node_modules',
  'output',
  'portable'
]);
const assetContentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.json', 'application/json'],
  ['.mp3', 'audio/mpeg'],
  ['.mp4', 'video/mp4'],
  ['.ogg', 'audio/ogg'],
  ['.otf', 'font/otf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.wasm', 'application/wasm'],
  ['.wav', 'audio/wav'],
  ['.webm', 'video/webm'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function posixPath(path) {
  return path.split(sep).join('/');
}

function stableCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function detectSlidevEntry() {
  const packagePath = join(projectRoot, 'package.json');
  if (!existsSync(packagePath)) return 'slides.md';
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  if (typeof packageJson.slidev?.entry === 'string' && packageJson.slidev.entry.trim()) {
    return packageJson.slidev.entry.trim();
  }
  const buildCommand = packageJson.scripts?.build;
  if (typeof buildCommand !== 'string') return 'slides.md';
  const tokens = [...buildCommand.matchAll(/"([^"]*)"|'([^']*)'|([^\s;&|]+)/gu)].map(
    (match) => match[1] ?? match[2] ?? match[3]
  );
  const slidevIndex = tokens.findIndex((token) => /(?:^|\/)slidev$/u.test(token));
  const configuredEntry = slidevIndex === -1
    ? undefined
    : tokens.slice(slidevIndex + 1).find((token) => /\.md(?:$|[?#])/u.test(token));
  return configuredEntry?.replace(/[?#].*$/u, '') ?? 'slides.md';
}

function assertInside(parent, candidate, label) {
  const child = relative(parent, candidate);
  if (child === '' || (!child.startsWith(`..${sep}`) && child !== '..')) return candidate;
  throw new Error(`${label} escapes the project root`);
}

function installedNodeModules() {
  let current = projectRoot;
  while (true) {
    const candidate = join(current, 'node_modules');
    const binary = join(
      candidate,
      '.bin',
      process.platform === 'win32' ? 'slidev.cmd' : 'slidev'
    );
    if (existsSync(candidate) && statSync(candidate).isDirectory() && existsSync(binary)) {
      return { binary, directory: candidate };
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error('Slidev dependencies are missing; run npm install before npm run build:offline');
}

function writeBuildRecord(status) {
  mkdirSync(stateRoot, { recursive: true });
  writeFileSync(
    buildRecordPath,
    `${JSON.stringify(
      {
        command: 'npm run build:offline',
        status,
        outputFile: 'offline.html',
        playback: 'file://',
        portableOutputDir: 'portable'
      },
      null,
      2
    )}\n`
  );
}

function copyProjectSource() {
  mkdirSync(mirrorRoot, { recursive: true });
  for (const item of readdirSync(projectRoot, { withFileTypes: true })) {
    if (excludedDirectories.has(item.name) || item.name === 'offline.html') continue;
    const source = assertInside(projectRoot, join(projectRoot, item.name), 'Source path');
    const destination = assertInside(workRoot, join(mirrorRoot, item.name), 'Mirror path');
    if (item.isSymbolicLink() || lstatSync(source).isSymbolicLink()) {
      throw new Error(`Offline source contains an unsupported symbolic link: ${item.name}`);
    }
    cpSync(source, destination, {
      recursive: item.isDirectory(),
      filter(candidate) {
        const child = relative(projectRoot, candidate);
        if (!child) return true;
        const segments = child.split(sep);
        return !segments.some((segment) => excludedDirectories.has(segment));
      }
    });
  }

  const nodeModules = installedNodeModules().directory;
  symlinkSync(
    nodeModules,
    join(mirrorRoot, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir'
  );
}

function writeSingleFileSetup() {
  const setupRoot = join(mirrorRoot, 'setup');
  mkdirSync(setupRoot, { recursive: true });
  const candidates = ['.ts', '.js', '.mjs', '.cjs']
    .map((extension) => join(setupRoot, `vite-plugins${extension}`))
    .filter(existsSync);
  if (candidates.length > 1) {
    throw new Error('The project defines multiple setup/vite-plugins files; keep one before building offline');
  }

  let sourceImport = '';
  let sourcePlugins = '  const sourcePlugins = undefined\n';
  if (candidates.length === 1) {
    const existing = candidates[0];
    const sourceName = `vite-plugins.source${extname(existing)}`;
    renameSync(existing, join(setupRoot, sourceName));
    sourceImport = `import sourceSetup from ${JSON.stringify(`./${sourceName}`)}\n`;
    sourcePlugins = '  const sourcePlugins = await sourceSetup(options)\n';
  }

  writeFileSync(
    join(setupRoot, 'vite-plugins.ts'),
    `${sourceImport}import { viteSingleFile } from 'vite-plugin-singlefile'\n\nconst slidevSingleFileCompatibility = {\n  name: 'slideblocks:singlefile-output',\n  enforce: 'post',\n  configResolved(config) {\n    const output = config.build.rollupOptions.output\n    for (const item of Array.isArray(output) ? output : [output]) {\n      if (item) delete item.manualChunks\n    }\n  },\n}\n\nexport default async function slideblocksOfflineVitePlugins(options) {\n${sourcePlugins}  return [\n    sourcePlugins,\n    viteSingleFile({ removeViteModuleLoader: false }),\n    slidevSingleFileCompatibility,\n  ]\n}\n`
  );
}

function slidevBinary() {
  const path = installedNodeModules().binary;
  try {
    import.meta.resolve('vite-plugin-singlefile');
  } catch {
    throw new Error('vite-plugin-singlefile is missing; run npm install before npm run build:offline');
  }
  return path;
}

function buildSingleFile() {
  execFileSync(
    slidevBinary(),
    [
      'build',
      entry,
      '--out',
      buildRoot,
      '--base',
      './',
      '--router-mode',
      'hash'
    ],
    {
      cwd: mirrorRoot,
      env: { ...process.env, CI: '1' },
      stdio: 'inherit'
    }
  );
}

function walkFiles(directory, files = []) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) walkFiles(path, files);
    else if (item.isFile()) files.push(path);
  }
  return files;
}

function referenceVariants(relativePath) {
  const encoded = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return [...new Set([
    `./${relativePath}`,
    `/${relativePath}`,
    relativePath,
    `./${encoded}`,
    `/${encoded}`,
    encoded
  ])].sort((left, right) => right.length - left.length);
}

function offlineAssetRuntimeSource(runtimeAssets) {
  const serializedAssets = JSON.stringify(runtimeAssets)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
  return `<script data-slideblocks-offline-assets>(function(){const assets=Object.freeze(${serializedAssets}),keys=Object.keys(assets).sort(function(left,right){return right.length-left.length;});function resolveAsset(value){if(typeof value!=="string"||/^(?:data|blob|javascript|mailto|tel):/i.test(value)||value.startsWith("#"))return value;let path=value;try{path=decodeURIComponent(new URL(value,window.location.href).pathname);}catch{}path=path.replace(/\\\\/g,"/").replace(/^\\/+/,"");for(const key of keys){if(path===key||path.endsWith("/"+key))return assets[key];}return value;}function resolveSrcset(value){if(typeof value!=="string")return value;return value.split(",").map(function(candidate){const match=candidate.trim().match(/^(\\S+)(\\s+.*)?$/);return match?resolveAsset(match[1])+(match[2]||""):candidate;}).join(", ");}function resolveCss(value){if(typeof value!=="string")return value;return value.replace(/url\\(\\s*(["']?)([^"')]+)\\1\\s*\\)/gi,function(match,quote,url){const resolved=resolveAsset(url);return resolved===url?match:"url(\\\""+resolved+"\\\")";});}const setAttribute=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){const lower=String(name).toLowerCase();if(lower==="srcset")value=resolveSrcset(value);else if(lower==="style")value=resolveCss(value);else if(lower==="src"||lower==="href"||lower==="poster"||lower==="data")value=resolveAsset(value);return setAttribute.call(this,name,value);};const setAttributeNS=Element.prototype.setAttributeNS;Element.prototype.setAttributeNS=function(namespace,name,value){const lower=String(name).toLowerCase();if(lower==="href"||lower.endsWith(":href"))value=resolveAsset(value);return setAttributeNS.call(this,namespace,name,value);};function patchProperty(prototype,name,resolver){if(!prototype)return;const descriptor=Object.getOwnPropertyDescriptor(prototype,name);if(!descriptor||!descriptor.configurable||typeof descriptor.set!=="function")return;Object.defineProperty(prototype,name,Object.assign({},descriptor,{set:function(value){return descriptor.set.call(this,resolver(value));}}));}patchProperty(window.HTMLImageElement&&HTMLImageElement.prototype,"src",resolveAsset);patchProperty(window.HTMLImageElement&&HTMLImageElement.prototype,"srcset",resolveSrcset);patchProperty(window.HTMLSourceElement&&HTMLSourceElement.prototype,"src",resolveAsset);patchProperty(window.HTMLSourceElement&&HTMLSourceElement.prototype,"srcset",resolveSrcset);patchProperty(window.HTMLMediaElement&&HTMLMediaElement.prototype,"src",resolveAsset);patchProperty(window.HTMLTrackElement&&HTMLTrackElement.prototype,"src",resolveAsset);patchProperty(window.HTMLInputElement&&HTMLInputElement.prototype,"src",resolveAsset);patchProperty(window.HTMLEmbedElement&&HTMLEmbedElement.prototype,"src",resolveAsset);patchProperty(window.HTMLObjectElement&&HTMLObjectElement.prototype,"data",resolveAsset);const setProperty=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(name,value,priority){return setProperty.call(this,name,resolveCss(value),priority);};for(const name of ["background","backgroundImage","borderImage","content","cursor","listStyle","listStyleImage","mask","maskImage"]){patchProperty(CSSStyleDeclaration.prototype,name,resolveCss);}const nativeFetch=window.fetch&&window.fetch.bind(window);if(nativeFetch){window.fetch=function(input,init){if(typeof input==="string"||input instanceof URL)return nativeFetch(resolveAsset(String(input)),init);if(input instanceof Request){const resolved=resolveAsset(input.url);if(resolved!==input.url)return nativeFetch(resolved,init);}return nativeFetch(input,init);};}const xhrOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url){const args=Array.prototype.slice.call(arguments);args[1]=resolveAsset(String(url));return xhrOpen.apply(this,args);};try{localStorage.setItem("slidev-wake-lock","false");}catch{}window.__slideblocksResolveOfflineAsset=resolveAsset;})();</script>`;
}

function replaceOfflineNonScriptReferences(html, variants, dataUrl) {
  const scriptPattern = /<script\b[^>]*>[\s\S]*?<\/script\s*>/giu;
  let cursor = 0;
  let replaced = '';
  for (const match of html.matchAll(scriptPattern)) {
    const index = match.index ?? 0;
    let staticMarkup = html.slice(cursor, index);
    for (const variant of variants) staticMarkup = staticMarkup.replaceAll(variant, dataUrl);
    replaced += staticMarkup;
    replaced += match[0];
    cursor = index + match[0].length;
  }
  let staticMarkup = html.slice(cursor);
  for (const variant of variants) staticMarkup = staticMarkup.replaceAll(variant, dataUrl);
  return replaced + staticMarkup;
}

function replaceOfflineModuleAssetUrls(html, assetPaths) {
  const keys = [...assetPaths].sort((left, right) => right.length - left.length);
  return html.replace(
    /<script\b[^>]*>[\s\S]*?<\/script\s*>/giu,
    (script) => script.replace(
      /new URL\((['"`])([^'"`]+)\1\s*,\s*import\.meta\.url\)\.href/gu,
      (expression, _quote, reference) => {
        let normalized = reference;
        try {
          normalized = decodeURIComponent(reference);
        } catch {}
        normalized = normalized.replaceAll('\\', '/').replace(/^\.\//u, '').replace(/^\/+/, '');
        const matched = keys.some(
          (key) => normalized === key || normalized.endsWith(`/${key}`)
        );
        return matched
          ? `window.__slideblocksResolveOfflineAsset(${JSON.stringify(reference)})`
          : expression;
      }
    )
  );
}

function inlineOfflineAssets(html) {
  let inlined = html;
  const assetDataUrls = new Map();
  for (const absolute of walkFiles(buildRoot)) {
    const relativePath = posixPath(relative(buildRoot, absolute));
    if (relativePath === 'index.html' || relativePath === '404.html' || relativePath === '_redirects') {
      continue;
    }
    const extension = extname(relativePath).toLowerCase();
    if (['.css', '.html', '.js', '.map', '.mjs'].includes(extension)) {
      throw new Error(`Offline build left a non-inlined executable asset: ${relativePath}`);
    }
    const contentType = assetContentTypes.get(extension);
    if (!contentType) {
      throw new Error(`Offline build cannot inline asset type: ${relativePath}`);
    }
    const dataUrl = `data:${contentType};base64,${readFileSync(absolute).toString('base64')}`;
    assetDataUrls.set(relativePath, dataUrl);
    inlined = replaceOfflineNonScriptReferences(inlined, referenceVariants(relativePath), dataUrl);
  }
  inlined = replaceOfflineModuleAssetUrls(inlined, assetDataUrls.keys());
  const runtimeAssets = Object.fromEntries(
    [...assetDataUrls].sort(([left], [right]) => stableCompare(left, right))
  );
  const runtime = offlineAssetRuntimeSource(runtimeAssets);
  if (!inlined.includes('<head>')) throw new Error('Offline build has no head element');
  const bundled = inlined.replace('<head>', `<head>${runtime}`);
  for (const [relativePath, dataUrl] of assetDataUrls) {
    if (!bundled.includes(dataUrl)) {
      throw new Error(`Offline build did not bundle asset: ${relativePath}`);
    }
  }
  return bundled;
}

function stripScriptBodies(html) {
  // HTML tag names are ASCII. Unicode case-folding can change string length
  // (for example İ -> i + combining dot), invalidating indices into html.
  const lower = html.replace(/[A-Z]/gu, (character) => character.toLowerCase());
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

function assertOfflineHtml(html) {
  if (!/<html\b/iu.test(html)) throw new Error('Offline build has no html root');
  const structuralHtml = stripScriptBodies(html);
  if (/<script\b[^>]*\bsrc\s*=/iu.test(structuralHtml)) {
    throw new Error('offline.html still references an external script');
  }
  for (const match of structuralHtml.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/giu)) {
    if (!match[1].startsWith('data:') && !match[1].startsWith('#')) {
      throw new Error(`offline.html still references an external link: ${match[1]}`);
    }
  }
  for (const match of structuralHtml.matchAll(/<(?:audio|embed|iframe|img|object|source|track|video)\b[^>]*\b(?:data|poster|src)\s*=\s*["']([^"']+)["'][^>]*>/giu)) {
    if (!/^(?:data:|blob:|#|$)/iu.test(match[1])) {
      throw new Error(`offline.html still references an external media asset: ${match[1]}`);
    }
  }
  for (const match of structuralHtml.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/giu)) {
    if (!/^(?:data:|blob:|#|%23)/iu.test(match[1])) {
      throw new Error(`offline.html still references an external CSS asset: ${match[1]}`);
    }
  }
  const automaticExternalRequests = [
    /(?:src|poster)\s*=\s*["']https?:\/\//iu,
    /<image\b[^>]*\bhref\s*=\s*["']https?:\/\//isu,
    /url\(\s*["']?https?:\/\//iu,
    /@import\s+(?:url\()?\s*["']?https?:\/\//iu,
    /\bfetch\(\s*["']https?:\/\//iu
  ];
  if (automaticExternalRequests.some((pattern) => pattern.test(html))) {
    throw new Error('offline.html contains an automatic external runtime request');
  }
}

// Capture at parser time, before deferred module scripts mount Vue. This is
// the original, complete shell, not a later snapshot of live slide DOM. The
// saved shell includes this same capture script, so repeated Save As remains
// editable without nesting a second copy of the application in every file.
function retainOfflineSource(html) {
  const structural = stripScriptBodies(html);
  if (/<script\b(?=[^>]*\btype\s*=\s*["']module["'])(?=[^>]*\basync\b)/iu.test(structural)) {
    throw new Error('Offline source capture requires deferred module scripts');
  }
  const index = html.replace(/[A-Z]/gu, (character) => character.toLowerCase()).lastIndexOf('</body>');
  if (index === -1) throw new Error('Offline source capture requires a closing body');
  const capture = '<script id="slideblocks-offline-source" data-slideblocks-source-version="1">Object.defineProperty(window,"__slideblocksOfflineSource",{value:"<!doctype html>\\n"+document.documentElement.outerHTML,writable:false,configurable:false});</script>';
  return html.slice(0, index) + capture + html.slice(index);
}

function buildOfflineHtml() {
  if (!existsSync(join(projectRoot, entry))) throw new Error(`${entry} is missing`);
  rmSync(workRoot, { recursive: true, force: true });
  mkdirSync(workRoot, { recursive: true });
  copyProjectSource();
  writeSingleFileSetup();
  buildSingleFile();

  const indexPath = join(buildRoot, 'index.html');
  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    throw new Error('Slidev did not produce an offline index.html');
  }
  let html = inlineOfflineAssets(readFileSync(indexPath, 'utf8'));
  html = html.replace(/<html\b/iu, '<html data-slideblocks-offline-player="true"');
  assertOfflineHtml(html);
  html = retainOfflineSource(html);
  writeFileSync(outputFile, html);
  writeBuildRecord('passed');
  rmSync(workRoot, { recursive: true, force: true });
  console.log(`Offline presentation: ${outputFile}`);
}

try {
  buildOfflineHtml();
} catch (error) {
  writeBuildRecord('failed');
  throw error;
}
