#!/usr/bin/env node

import { createHash, randomUUID as createRandomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SITE_URL = 'https://inteliway.tech';
const DEFAULT_API_URL = 'https://api.inteliway.tech';
const MAX_JSON_BYTES = 5 * 1024 * 1024;
const MAX_PROMPT_BYTES = 2 * 1024 * 1024;
const MAX_SOURCE_BYTES = 100 * 1024 * 1024;
const MAX_INSTALLER_BYTES = 256 * 1024;
const ARTIFACT_ID_PATTERN = /^(?:blocks\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*|decks\/[a-z0-9]+(?:-[a-z0-9]+)*|recipes\/[a-z0-9]+(?:-[a-z0-9]+)*)$/u;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const TOKEN_PATTERN = /^[^\s\u0000-\u001f\u007f]{16,4096}$/u;
const ANONYMOUS_CONTEXT_COOKIE_NAME = 'sb_prompt_usage';
const ANONYMOUS_CONTEXT_COOKIE_PATH = '/api/v1/skill/artifacts/unlock';
const ANONYMOUS_CONTEXT_MAX_AGE_SECONDS = 31 * 24 * 60 * 60;
const ANONYMOUS_CONTEXT_PATTERN =
  /^v1\.(\d{10})\.(\d{10})\.([A-Za-z0-9_-]{43})\.([A-Za-z0-9_-]{43})$/u;

const deliveryManifest = JSON.parse(
  readFileSync(new URL('../delivery-manifest.json', import.meta.url), 'utf8')
);
if (
  !deliveryManifest ||
  typeof deliveryManifest !== 'object' ||
  Array.isArray(deliveryManifest) ||
  deliveryManifest.schemaVersion !== 1 ||
  !SEMVER_PATTERN.test(deliveryManifest.packageVersion) ||
  !SEMVER_PATTERN.test(deliveryManifest.clientVersion) ||
  !SEMVER_PATTERN.test(deliveryManifest.minimumClientVersion) ||
  deliveryManifest.protocolVersion !== 1 ||
  deliveryManifest.clientId !== 'slideblocks-skill' ||
  deliveryManifest.scope !== 'artifact:unlock artifact:download' ||
  deliveryManifest.installProtocol !== 'slideblocks-skill-zip-v1' ||
  deliveryManifest.updateCommand !== 'slideblocks skill update'
) {
  throw new Error('SlideBlocks delivery manifest is invalid.');
}

export const CLIENT_VERSION = deliveryManifest.clientVersion;
export const PROTOCOL_VERSION = deliveryManifest.protocolVersion;
export const DEVICE_CLIENT_ID = deliveryManifest.clientId;
export const DEVICE_SCOPE = deliveryManifest.scope;
export const PACKAGE_VERSION = deliveryManifest.packageVersion;
export const MINIMUM_CLIENT_VERSION = deliveryManifest.minimumClientVersion;
export const INSTALL_PROTOCOL = deliveryManifest.installProtocol;
export const UPDATE_COMMAND = deliveryManifest.updateCommand;

const messages = {
  en: {
    configured: 'SlideBlocks endpoints configured.',
    loginOpen: (url) => `Open this URL in a browser:\n${url}`,
    loginCode: (code) => `Enter this one-time code: ${code}`,
    loginWaiting: 'Waiting for approval…',
    loginDone: 'SlideBlocks Skill connected. The token is stored locally and was not printed.',
    loggedOut: 'SlideBlocks Skill disconnected and its local token removed.',
    localLogout: 'Local SlideBlocks token removed. The remote session was not contacted.',
    notLoggedIn: 'No account connected. Published Artifact delivery is ready without login.',
    statusActive: (label) => `Connected as ${label}.`,
    sourceSaved: (path) => `Verified source ZIP saved to ${path}`,
    promptSaved: (path) => `Unlocked Prompt saved to ${path}`,
    updateDone: 'SlideBlocks Skill update finished.',
    uninstallDone: 'SlideBlocks Skill uninstall finished.'
  },
  'zh-CN': {
    configured: 'SlideBlocks 服务地址已配置。',
    loginOpen: (url) => `请在浏览器中打开：\n${url}`,
    loginCode: (code) => `输入一次性验证码：${code}`,
    loginWaiting: '正在等待授权…',
    loginDone: 'SlideBlocks Skill 已连接。Token 只保存在本机，未输出到终端。',
    loggedOut: 'SlideBlocks Skill 已断开，并移除了本地 Token。',
    localLogout: '已移除本地 SlideBlocks Token，未连接远端 Session。',
    notLoggedIn: '未连接账户；无需登录即可获取已发布 Artifact。',
    statusActive: (label) => `已连接为 ${label}。`,
    sourceSaved: (path) => `已校验源码 ZIP 并保存到 ${path}`,
    promptSaved: (path) => `已解锁 Prompt 并保存到 ${path}`,
    updateDone: 'SlideBlocks Skill 更新完成。',
    uninstallDone: 'SlideBlocks Skill 卸载完成。'
  }
};

export class SlideBlocksClientError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'SlideBlocksClientError';
    this.code = code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.cause = options.cause;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return isRecord(value) && Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
}

function cleanText(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, maxLength);
}

function selectedLocale(env, requested) {
  if (requested === 'en' || requested === 'zh-CN') return requested;
  return /^(?:zh|Chinese)/iu.test(env.LC_ALL ?? env.LC_MESSAGES ?? env.LANG ?? '')
    ? 'zh-CN'
    : 'en';
}

function normalizeOrigin(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new SlideBlocksClientError('INVALID_ENDPOINT', `${label} is not a valid URL.`);
  }
  const loopback =
    url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  if (
    (url.protocol !== 'https:' && !loopback) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new SlideBlocksClientError(
      'INVALID_ENDPOINT',
      `${label} must be an HTTPS origin without credentials, path, query, or fragment.`
    );
  }
  return url.origin;
}

function deriveApiUrl(siteUrl) {
  const site = new URL(siteUrl);
  if (site.hostname === 'inteliway.tech') return `${site.protocol}//api.inteliway.tech`;
  if (site.hostname === 'staging.inteliway.tech') {
    return `${site.protocol}//api.staging.inteliway.tech`;
  }
  return site.origin;
}

function resolveConfigPath(env) {
  const directory = env.SLIDEBLOCKS_CONFIG_DIR
    ? resolve(env.SLIDEBLOCKS_CONFIG_DIR)
    : env.XDG_CONFIG_HOME
      ? resolve(env.XDG_CONFIG_HOME, 'slideblocks')
      : resolve(env.HOME || homedir(), '.config', 'slideblocks');
  return join(directory, 'config.json');
}

function defaultConfig() {
  return {
    schemaVersion: 1,
    siteUrl: DEFAULT_SITE_URL,
    apiUrl: DEFAULT_API_URL
  };
}

function anonymousContextExpiry(value) {
  if (typeof value !== 'string') return null;
  const match = ANONYMOUS_CONTEXT_PATTERN.exec(value);
  if (!match) return null;
  const issuedAt = Number(match[1]);
  const expiresAt = Number(match[2]);
  if (
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt - issuedAt !== ANONYMOUS_CONTEXT_MAX_AGE_SECONDS
  ) {
    return null;
  }
  return new Date(expiresAt * 1_000).toISOString();
}

function validateConfig(value) {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new SlideBlocksClientError('INVALID_CONFIG', 'SlideBlocks config schema is invalid.');
  }
  const allowed = new Set([
    'schemaVersion',
    'siteUrl',
    'apiUrl',
    'accessToken',
    'tokenExpiresAt',
    'scope',
    'anonymousContext',
    'anonymousContextExpiresAt',
    'installTarget',
    'binDir',
    'updatedAt'
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new SlideBlocksClientError('INVALID_CONFIG', 'SlideBlocks config has unknown fields.');
  }
  const config = {
    schemaVersion: 1,
    siteUrl: normalizeOrigin(value.siteUrl, 'Site URL'),
    apiUrl: normalizeOrigin(value.apiUrl, 'API URL')
  };
  if (value.accessToken !== undefined) {
    if (typeof value.accessToken !== 'string' || !TOKEN_PATTERN.test(value.accessToken)) {
      throw new SlideBlocksClientError('INVALID_CONFIG', 'Stored access token is invalid.');
    }
    config.accessToken = value.accessToken;
  }
  if (value.tokenExpiresAt !== undefined) {
    const timestamp = Date.parse(value.tokenExpiresAt);
    if (!Number.isFinite(timestamp)) {
      throw new SlideBlocksClientError('INVALID_CONFIG', 'Stored token expiry is invalid.');
    }
    config.tokenExpiresAt = new Date(timestamp).toISOString();
  }
  if (value.scope !== undefined) {
    if (value.scope !== DEVICE_SCOPE) {
      throw new SlideBlocksClientError('INVALID_CONFIG', 'Stored device scope is invalid.');
    }
    config.scope = value.scope;
  }
  if (
    (value.anonymousContext === undefined) !==
    (value.anonymousContextExpiresAt === undefined)
  ) {
    throw new SlideBlocksClientError(
      'INVALID_CONFIG',
      'Stored anonymous context and expiry must be present together.'
    );
  }
  if (value.anonymousContext !== undefined) {
    const expiresAt = anonymousContextExpiry(value.anonymousContext);
    if (
      !expiresAt ||
      typeof value.anonymousContextExpiresAt !== 'string' ||
      value.anonymousContextExpiresAt !== expiresAt
    ) {
      throw new SlideBlocksClientError(
        'INVALID_CONFIG',
        'Stored anonymous context is invalid.'
      );
    }
    config.anonymousContext = value.anonymousContext;
    config.anonymousContextExpiresAt = expiresAt;
  }
  for (const key of ['installTarget', 'binDir']) {
    if (value[key] !== undefined) {
      if (typeof value[key] !== 'string' || !value[key].startsWith('/') || value[key].length > 1024) {
        throw new SlideBlocksClientError('INVALID_CONFIG', `Stored ${key} is invalid.`);
      }
      config[key] = value[key];
    }
  }
  if (typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt))) {
    config.updatedAt = new Date(value.updatedAt).toISOString();
  }
  return config;
}

export function readClientConfig({ env = process.env } = {}) {
  const path = resolveConfigPath(env);
  if (!existsSync(path)) return { config: defaultConfig(), path };
  const stats = lstatSync(path);
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new SlideBlocksClientError('UNSAFE_CONFIG', 'SlideBlocks config must be a regular file.');
  }
  if ((stats.mode & 0o077) !== 0) {
    throw new SlideBlocksClientError(
      'UNSAFE_CONFIG_PERMISSIONS',
      `SlideBlocks config is readable by other users. Run: chmod 600 ${path}`
    );
  }
  if (stats.size > 64 * 1024) {
    throw new SlideBlocksClientError('INVALID_CONFIG', 'SlideBlocks config exceeds 64 KiB.');
  }
  try {
    return { config: validateConfig(JSON.parse(readFileSync(path, 'utf8'))), path };
  } catch (error) {
    if (error instanceof SlideBlocksClientError) throw error;
    throw new SlideBlocksClientError('INVALID_CONFIG', 'SlideBlocks config is not valid JSON.', {
      cause: error
    });
  }
}

export function writeClientConfig(config, { env = process.env, now = () => Date.now() } = {}) {
  const path = resolveConfigPath(env);
  const directory = dirname(path);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
    throw new SlideBlocksClientError('UNSAFE_CONFIG', 'Refusing to replace a symbolic-link config.');
  }
  const validated = validateConfig({
    ...config,
    schemaVersion: 1,
    updatedAt: new Date(now()).toISOString()
  });
  const temporary = join(directory, `.config.${process.pid}.${createRandomUUID()}.tmp`);
  let descriptor;
  try {
    descriptor = openSync(temporary, 'wx', 0o600);
    writeFileSync(descriptor, `${JSON.stringify(validated, null, 2)}\n`, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
    chmodSync(path, 0o600);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(temporary)) rmSync(temporary);
  }
  return { config: validated, path };
}

function withoutToken(config) {
  const { accessToken: _accessToken, tokenExpiresAt: _tokenExpiresAt, scope: _scope, ...rest } =
    config;
  return rest;
}

function withoutAnonymousContext(config) {
  const {
    anonymousContext: _anonymousContext,
    anonymousContextExpiresAt: _anonymousContextExpiresAt,
    ...rest
  } = config;
  return rest;
}

function withoutDeliveryContext(config) {
  return withoutAnonymousContext(withoutToken(config));
}

function activeDeliveryConfig(config, context) {
  let next = config;
  if (
    next.accessToken &&
    next.tokenExpiresAt &&
    Date.parse(next.tokenExpiresAt) <= context.now()
  ) {
    next = withoutToken(next);
  }
  if (
    next.anonymousContext &&
    next.anonymousContextExpiresAt &&
    Date.parse(next.anonymousContextExpiresAt) <= context.now()
  ) {
    next = withoutAnonymousContext(next);
  }
  return next === config
    ? config
    : writeClientConfig(next, { env: context.env, now: context.now }).config;
}

async function readBoundedBytes(response, maxBytes) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new SlideBlocksClientError('RESPONSE_TOO_LARGE', 'Server response exceeds its size limit.', {
      status: response.status
    });
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > maxBytes) {
    throw new SlideBlocksClientError('RESPONSE_TOO_LARGE', 'Server response exceeds its size limit.', {
      status: response.status
    });
  }
  return bytes;
}

async function readJsonResponse(response, maxBytes = MAX_JSON_BYTES) {
  const bytes = await readBoundedBytes(response, maxBytes);
  if (bytes.length === 0) return undefined;
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (cause) {
    throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Server returned invalid JSON.', {
      status: response.status,
      cause
    });
  }
}

function serverError(payload, response) {
  const envelope = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined;
  const oauthCode =
    isRecord(payload) && typeof payload.error === 'string' ? payload.error : undefined;
  const code =
    envelope && typeof envelope.code === 'string'
      ? envelope.code
      : oauthCode && /^[a-z_]{3,80}$/u.test(oauthCode)
        ? oauthCode
        : 'REQUEST_FAILED';
  return new SlideBlocksClientError(code, `SlideBlocks request failed (${code}).`, {
    status: response.status,
    requestId:
      envelope && typeof envelope.requestId === 'string' ? envelope.requestId : undefined,
    retryAfterSeconds:
      envelope && Number.isInteger(envelope.retryAfterSeconds)
        ? envelope.retryAfterSeconds
        : undefined
  });
}

async function fetchWithTimeout(fetchImpl, url, options = {}, timeoutMs = 20_000) {
  try {
    return await fetchImpl(url, {
      ...options,
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (cause) {
    if (cause instanceof SlideBlocksClientError) throw cause;
    throw new SlideBlocksClientError('NETWORK_UNAVAILABLE', 'Could not reach SlideBlocks.', {
      cause
    });
  }
}

async function requestJson(fetchImpl, url, options = {}, maxBytes = MAX_JSON_BYTES) {
  const response = await fetchWithTimeout(fetchImpl, url, options);
  const payload = await readJsonResponse(response, maxBytes);
  if (!response.ok) throw serverError(payload, response);
  if (payload === undefined) {
    throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Server returned an empty response.', {
      status: response.status
    });
  }
  return { payload, response };
}

function jsonHeaders(accessToken) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': `SlideBlocks-Skill/${CLIENT_VERSION}`,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
}

function parseDeviceCode(payload, siteUrl) {
  if (
    !isRecord(payload) ||
    typeof payload.device_code !== 'string' ||
    !TOKEN_PATTERN.test(payload.device_code) ||
    typeof payload.user_code !== 'string' ||
    !/^[A-Z0-9-]{4,32}$/u.test(payload.user_code) ||
    typeof payload.verification_uri !== 'string' ||
    !Number.isInteger(payload.expires_in) ||
    payload.expires_in < 60 ||
    payload.expires_in > 900 ||
    !Number.isInteger(payload.interval) ||
    payload.interval < 1 ||
    payload.interval > 30
  ) {
    throw new SlideBlocksClientError(
      'INVALID_SERVER_RESPONSE',
      'Device authorization response is invalid.'
    );
  }
  const verificationUrl = new URL(payload.verification_uri);
  if (
    verificationUrl.origin !== new URL(siteUrl).origin ||
    verificationUrl.username ||
    verificationUrl.password ||
    verificationUrl.hash
  ) {
    throw new SlideBlocksClientError(
      'INVALID_SERVER_RESPONSE',
      'Device verification URL is outside the configured SlideBlocks site.'
    );
  }
  let completeUrl;
  if (payload.verification_uri_complete !== undefined) {
    if (typeof payload.verification_uri_complete !== 'string') {
      throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Device verification URL is invalid.');
    }
    const parsed = new URL(payload.verification_uri_complete);
    if (
      parsed.origin !== verificationUrl.origin ||
      parsed.username ||
      parsed.password ||
      parsed.hash
    ) {
      throw new SlideBlocksClientError(
        'INVALID_SERVER_RESPONSE',
        'Complete device verification URL is outside the configured site.'
      );
    }
    completeUrl = parsed.toString();
  }
  return {
    deviceCode: payload.device_code,
    userCode: payload.user_code,
    verificationUrl: verificationUrl.toString(),
    completeUrl,
    expiresIn: payload.expires_in,
    interval: payload.interval
  };
}

function parseDeviceToken(payload) {
  if (
    !isRecord(payload) ||
    typeof payload.access_token !== 'string' ||
    !TOKEN_PATTERN.test(payload.access_token) ||
    typeof payload.token_type !== 'string' ||
    payload.token_type.toLowerCase() !== 'bearer' ||
    !Number.isInteger(payload.expires_in) ||
    payload.expires_in < 60 ||
    payload.expires_in > 31 * 24 * 60 * 60 ||
    payload.scope !== DEVICE_SCOPE
  ) {
    throw new SlideBlocksClientError(
      'INVALID_SERVER_RESPONSE',
      'Device token response is invalid.'
    );
  }
  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in,
    scope: payload.scope
  };
}

function requireAccessToken(config, now) {
  if (!config.accessToken) {
    throw new SlideBlocksClientError('AUTH_REQUIRED', 'Run `slideblocks login` first.');
  }
  if (config.tokenExpiresAt && Date.parse(config.tokenExpiresAt) <= now()) {
    throw new SlideBlocksClientError('SESSION_EXPIRED', 'The local SlideBlocks session has expired.');
  }
  return config.accessToken;
}

function parseOptions(args, definitions) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      positionals.push(argument);
      continue;
    }
    const definition = definitions[argument];
    if (!definition) {
      throw new SlideBlocksClientError('INVALID_ARGUMENT', `Unknown option: ${argument}`);
    }
    if (definition === 'boolean') {
      options[argument.slice(2)] = true;
      continue;
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new SlideBlocksClientError('INVALID_ARGUMENT', `${argument} requires a value.`);
    }
    options[argument.slice(2)] = value;
    index += 1;
  }
  return { positionals, options };
}

function outputJson(stdout, value) {
  stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function humanTitle(entry, locale) {
  return locale === 'zh-CN' && isRecord(entry.localizations?.['zh-CN'])
    ? cleanText(entry.localizations['zh-CN'].title || entry.title)
    : cleanText(entry.title || entry.id);
}

async function configureCommand(args, context) {
  const { positionals, options } = parseOptions(args, {
    '--site': 'value',
    '--api': 'value',
    '--install-target': 'value',
    '--bin-dir': 'value',
    '--json': 'boolean'
  });
  if (positionals.length > 0) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'configure does not accept positional arguments.');
  }
  const { config } = readClientConfig({ env: context.env });
  const siteUrl = options.site ? normalizeOrigin(options.site, 'Site URL') : config.siteUrl;
  const apiUrl = options.api
    ? normalizeOrigin(options.api, 'API URL')
    : options.site
      ? deriveApiUrl(siteUrl)
      : config.apiUrl;
  const endpointChanged = siteUrl !== config.siteUrl || apiUrl !== config.apiUrl;
  const next = endpointChanged ? withoutDeliveryContext(config) : { ...config };
  next.siteUrl = siteUrl;
  next.apiUrl = apiUrl;
  if (options['install-target']) {
    const installTarget = resolve(options['install-target']);
    if (!installTarget.endsWith('/slideblocks') || installTarget === '/slideblocks') {
      throw new SlideBlocksClientError(
        'INVALID_ARGUMENT',
        '--install-target must be an absolute path ending in /slideblocks.'
      );
    }
    next.installTarget = installTarget;
  }
  if (options['bin-dir']) {
    const binDir = resolve(options['bin-dir']);
    if (binDir === '/') {
      throw new SlideBlocksClientError('INVALID_ARGUMENT', '--bin-dir cannot be the filesystem root.');
    }
    next.binDir = binDir;
  }
  const written = writeClientConfig(next, { env: context.env, now: context.now });
  if (options.json) {
    outputJson(context.stdout, {
      configured: true,
      siteUrl: written.config.siteUrl,
      apiUrl: written.config.apiUrl,
      tokenCleared: endpointChanged
    });
  } else {
    context.stdout.write(`${context.text.configured}\n`);
  }
}

async function loginCommand(args, context) {
  const { positionals, options } = parseOptions(args, {
    '--site': 'value',
    '--api': 'value',
    '--json': 'boolean'
  });
  if (positionals.length > 0) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'login does not accept positional arguments.');
  }
  const current = readClientConfig({ env: context.env }).config;
  const siteUrl = options.site ? normalizeOrigin(options.site, 'Site URL') : current.siteUrl;
  const apiUrl = options.api
    ? normalizeOrigin(options.api, 'API URL')
    : options.site
      ? deriveApiUrl(siteUrl)
      : current.apiUrl;
  const base =
    siteUrl === current.siteUrl && apiUrl === current.apiUrl
      ? current
      : { ...withoutDeliveryContext(current), siteUrl, apiUrl };
  writeClientConfig(base, { env: context.env, now: context.now });

  const { payload } = await requestJson(
    context.fetch,
    `${apiUrl}/api/auth/device/code`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ client_id: DEVICE_CLIENT_ID, scope: DEVICE_SCOPE })
    },
    64 * 1024
  );
  const device = parseDeviceCode(payload, siteUrl);
  const verificationUrl = device.completeUrl ?? device.verificationUrl;
  if (options.json) {
    outputJson(context.stdout, {
      status: 'authorization_pending',
      verificationUrl,
      userCode: device.userCode,
      expiresIn: device.expiresIn
    });
  } else {
    context.stdout.write(`${context.text.loginOpen(verificationUrl)}\n`);
    if (!device.completeUrl) context.stdout.write(`${context.text.loginCode(device.userCode)}\n`);
    context.stdout.write(`${context.text.loginWaiting}\n`);
  }

  const expiresAt = context.now() + device.expiresIn * 1_000;
  let intervalSeconds = device.interval;
  while (context.now() < expiresAt) {
    await context.sleep(intervalSeconds * 1_000);
    let tokenPayload;
    try {
      tokenPayload = (
        await requestJson(
          context.fetch,
          `${apiUrl}/api/auth/device/token`,
          {
            method: 'POST',
            headers: jsonHeaders(),
            body: JSON.stringify({
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
              device_code: device.deviceCode,
              client_id: DEVICE_CLIENT_ID
            })
          },
          64 * 1024
        )
      ).payload;
    } catch (error) {
      if (!(error instanceof SlideBlocksClientError)) throw error;
      if (error.code === 'authorization_pending') continue;
      if (error.code === 'slow_down') {
        intervalSeconds = Math.min(intervalSeconds + 5, 30);
        continue;
      }
      if (
        error.code === 'NETWORK_UNAVAILABLE' ||
        (typeof error.status === 'number' && error.status >= 500)
      ) {
        continue;
      }
      throw error;
    }
    const token = parseDeviceToken(tokenPayload);
    const saved = writeClientConfig(
      {
        ...base,
        accessToken: token.accessToken,
        tokenExpiresAt: new Date(context.now() + token.expiresIn * 1_000).toISOString(),
        scope: token.scope
      },
      { env: context.env, now: context.now }
    );
    if (options.json) {
      outputJson(context.stdout, {
        status: 'connected',
        siteUrl: saved.config.siteUrl,
        apiUrl: saved.config.apiUrl,
        expiresAt: saved.config.tokenExpiresAt,
        scope: saved.config.scope
      });
    } else {
      context.stdout.write(`${context.text.loginDone}\n`);
    }
    return;
  }
  throw new SlideBlocksClientError('expired_token', 'Device authorization expired. Run login again.');
}

async function statusCommand(args, context) {
  const { positionals, options } = parseOptions(args, { '--json': 'boolean' });
  if (positionals.length > 0) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'status does not accept positional arguments.');
  }
  const { config } = readClientConfig({ env: context.env });
  if (!config.accessToken) {
    if (options.json) {
      outputJson(context.stdout, {
        connected: false,
        accountConnected: false,
        publishedArtifactDelivery: 'ready',
        siteUrl: config.siteUrl,
        apiUrl: config.apiUrl,
        anonymousContextExpiresAt: config.anonymousContextExpiresAt ?? null
      });
    }
    else context.stdout.write(`${context.text.notLoggedIn}\n`);
    return;
  }
  const token = requireAccessToken(config, context.now);
  const { payload } = await requestJson(
    context.fetch,
    `${config.apiUrl}/api/v1/me`,
    { method: 'GET', headers: jsonHeaders(token) },
    256 * 1024
  );
  const principal = isRecord(payload) ? payload.principal : undefined;
  if (
    !isRecord(principal) ||
    principal.status !== 'active' ||
    principal.emailVerified !== true ||
    !Array.isArray(principal.permissions) ||
    !principal.permissions.includes('artifact:unlock') ||
    !principal.permissions.includes('artifact:download')
  ) {
    throw new SlideBlocksClientError('FORBIDDEN', 'The connected account cannot unlock Artifacts.');
  }
  if (options.json) {
    outputJson(context.stdout, {
      connected: true,
      accountConnected: true,
      publishedArtifactDelivery: 'ready',
      principal: {
        name: cleanText(principal.name, 160),
        username: typeof principal.username === 'string' ? cleanText(principal.username, 80) : null,
        role: cleanText(principal.role, 40),
        status: principal.status,
        emailVerified: true
      },
      tokenExpiresAt: config.tokenExpiresAt ?? null,
      siteUrl: config.siteUrl,
      apiUrl: config.apiUrl
    });
  } else {
    const label = cleanText(principal.username || principal.name || 'SlideBlocks user', 160);
    context.stdout.write(`${context.text.statusActive(label)}\n`);
  }
}

async function logoutCommand(args, context) {
  const { positionals, options } = parseOptions(args, {
    '--local': 'boolean',
    '--json': 'boolean'
  });
  if (positionals.length > 0) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'logout does not accept positional arguments.');
  }
  const { config } = readClientConfig({ env: context.env });
  if (!config.accessToken) {
    if (options.json) outputJson(context.stdout, { disconnected: true, alreadyDisconnected: true });
    else context.stdout.write(`${context.text.notLoggedIn}\n`);
    return;
  }
  if (!options.local) {
    const response = await fetchWithTimeout(context.fetch, `${config.apiUrl}/api/v1/skill/logout`, {
      method: 'POST',
      headers: jsonHeaders(config.accessToken),
      body: '{}'
    });
    if (!response.ok && response.status !== 401 && response.status !== 403) {
      throw serverError(await readJsonResponse(response, 64 * 1024), response);
    }
  }
  writeClientConfig(withoutToken(config), { env: context.env, now: context.now });
  if (options.json) {
    outputJson(context.stdout, { disconnected: true, remoteRevoked: !options.local });
  } else {
    context.stdout.write(`${options.local ? context.text.localLogout : context.text.loggedOut}\n`);
  }
}

function validateCatalog(payload) {
  if (
    !isRecord(payload) ||
    payload.catalogVersion !== 2 ||
    !Array.isArray(payload.entries) ||
    payload.entries.length > 5000
  ) {
    throw new SlideBlocksClientError('INVALID_CATALOG', 'Public Catalog v2 response is invalid.');
  }
  const forbidden = new Set(['prompt', 'objectKey', 'sourcePath', 'entryPath', 'targetPath']);
  for (const entry of payload.entries) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      entry.id.length > 240 ||
      typeof entry.kind !== 'string' ||
      typeof entry.title !== 'string' ||
      Object.keys(entry).some((key) => forbidden.has(key))
    ) {
      throw new SlideBlocksClientError('INVALID_CATALOG', 'Public Catalog contains an invalid entry.');
    }
    if (
      entry.artifactVersion !== undefined &&
      (!SEMVER_PATTERN.test(entry.artifactVersion) || !SHA256_PATTERN.test(entry.contentHash))
    ) {
      throw new SlideBlocksClientError('INVALID_CATALOG', 'Public Catalog Artifact coordinates are invalid.');
    }
  }
  return payload;
}

async function loadCatalog(config, context) {
  const { payload } = await requestJson(
    context.fetch,
    `${config.siteUrl}/catalog.json`,
    { method: 'GET', headers: { Accept: 'application/json', 'User-Agent': `SlideBlocks-Skill/${CLIENT_VERSION}` } },
    MAX_JSON_BYTES
  );
  return validateCatalog(payload);
}

function searchableText(entry) {
  return [
    entry.id,
    entry.title,
    entry.description,
    ...(Array.isArray(entry.tags) ? entry.tags : []),
    ...(Array.isArray(entry.useCases) ? entry.useCases : []),
    isRecord(entry.localizations?.['zh-CN']) ? entry.localizations['zh-CN'].title : '',
    isRecord(entry.localizations?.['zh-CN']) ? entry.localizations['zh-CN'].description : ''
  ]
    .join(' ')
    .toLocaleLowerCase();
}

async function catalogCommand(args, context) {
  const action = args[0];
  if (!['search', 'show'].includes(action)) {
    throw new SlideBlocksClientError(
      'INVALID_ARGUMENT',
      'Use `slideblocks catalog search <query>` or `slideblocks catalog show <artifact-id>`.'
    );
  }
  const { positionals, options } = parseOptions(args.slice(1), {
    '--json': 'boolean',
    '--limit': 'value'
  });
  const { config } = readClientConfig({ env: context.env });
  const catalog = await loadCatalog(config, context);
  if (action === 'search') {
    if (positionals.length !== 1 || positionals[0].trim().length === 0) {
      throw new SlideBlocksClientError('INVALID_ARGUMENT', 'catalog search requires one query.');
    }
    const limit = options.limit === undefined ? 20 : Number(options.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new SlideBlocksClientError('INVALID_ARGUMENT', '--limit must be an integer from 1 to 50.');
    }
    const query = positionals[0].toLocaleLowerCase();
    const matches = catalog.entries.filter((entry) => searchableText(entry).includes(query)).slice(0, limit);
    if (options.json) {
      outputJson(context.stdout, {
        catalogVersion: 2,
        query: positionals[0],
        entries: matches
      });
    } else if (matches.length === 0) {
      context.stdout.write('No matching public Catalog entries.\n');
    } else {
      for (const entry of matches) {
        const coordinate = entry.artifactVersion ? `@${entry.artifactVersion}` : '';
        context.stdout.write(`${entry.id}${coordinate}\t${humanTitle(entry, context.locale)}\n`);
      }
    }
    return;
  }

  if (positionals.length !== 1 || options.limit !== undefined) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'catalog show requires one Artifact ID.');
  }
  const entry = catalog.entries.find((candidate) => candidate.id === positionals[0]);
  if (!entry) throw new SlideBlocksClientError('ARTIFACT_NOT_FOUND', 'Catalog entry was not found.');
  if (options.json) outputJson(context.stdout, entry);
  else {
    context.stdout.write(`${humanTitle(entry, context.locale)}\n`);
    context.stdout.write(`${entry.id}\n`);
    if (entry.artifactVersion) context.stdout.write(`Version: ${entry.artifactVersion}\n`);
    if (entry.contentHash) context.stdout.write(`Hash: ${entry.contentHash}\n`);
    if (entry.description) context.stdout.write(`${cleanText(entry.description, 1000)}\n`);
  }
}

function validateArtifactCoordinates(entry, options) {
  if (
    !ARTIFACT_ID_PATTERN.test(entry.id) ||
    typeof entry.artifactVersion !== 'string' ||
    !SEMVER_PATTERN.test(entry.artifactVersion) ||
    typeof entry.contentHash !== 'string' ||
    !SHA256_PATTERN.test(entry.contentHash)
  ) {
    throw new SlideBlocksClientError('ARTIFACT_NOT_DELIVERABLE', 'Catalog entry is not a deliverable Artifact.');
  }
  const requestedVersion = options.version;
  const requestedHash = options.hash;
  if ((requestedVersion && !requestedHash) || (!requestedVersion && requestedHash)) {
    throw new SlideBlocksClientError(
      'INVALID_ARGUMENT',
      'Historical coordinates require both --version and --hash.'
    );
  }
  if (requestedVersion && (!SEMVER_PATTERN.test(requestedVersion) || !SHA256_PATTERN.test(requestedHash))) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'Artifact version or content hash is invalid.');
  }
  return {
    artifactVersion: requestedVersion ?? entry.artifactVersion,
    contentHash: requestedHash ?? entry.contentHash
  };
}

function defaultVariant(entry) {
  if (entry.kind === 'block-variant') {
    const variants = Array.isArray(entry.promptVariants) ? entry.promptVariants : [];
    return variants.includes('deck') ? 'deck' : variants[0];
  }
  return 'default';
}

function validateUnlockResponse(payload, request, apiUrl, now) {
  const keys = [
    'protocolVersion',
    'unlockId',
    'artifactId',
    'artifactVersion',
    'contentHash',
    'variant',
    'prompt',
    'skill',
    'source'
  ];
  if (
    !exactKeys(payload, keys) ||
    payload.protocolVersion !== PROTOCOL_VERSION ||
    payload.unlockId !== request.unlockId ||
    payload.artifactId !== request.artifactId ||
    payload.artifactVersion !== request.artifactVersion ||
    payload.contentHash !== request.contentHash ||
    payload.variant !== request.variant ||
    typeof payload.prompt !== 'string' ||
    payload.prompt.length === 0 ||
    Buffer.byteLength(payload.prompt, 'utf8') > MAX_PROMPT_BYTES
  ) {
    throw new SlideBlocksClientError(
      'ARTIFACT_COORDINATE_MISMATCH',
      'Unlock response did not match the requested Artifact coordinates.'
    );
  }
  if (
    !exactKeys(payload.skill, ['installProtocol', 'packageVersion', 'updateCommand']) ||
    payload.skill.installProtocol !== INSTALL_PROTOCOL ||
    typeof payload.skill.packageVersion !== 'string' ||
    !SEMVER_PATTERN.test(payload.skill.packageVersion) ||
    payload.skill.updateCommand !== UPDATE_COMMAND
  ) {
    throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Skill delivery metadata is invalid.');
  }
  if (!isRecord(payload.source) || typeof payload.source.available !== 'boolean') {
    throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Source delivery state is invalid.');
  }
  if (payload.source.available === false) {
    if (!exactKeys(payload.source, ['available'])) {
      throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Unavailable source state leaked extra fields.');
    }
    return payload;
  }
  if (
    !exactKeys(payload.source, [
      'available',
      'downloadUrl',
      'expiresAt',
      'sha256',
      'byteSize'
    ]) ||
    typeof payload.source.downloadUrl !== 'string' ||
    typeof payload.source.expiresAt !== 'string' ||
    !SHA256_PATTERN.test(payload.source.sha256) ||
    !Number.isInteger(payload.source.byteSize) ||
    payload.source.byteSize < 0 ||
    payload.source.byteSize > MAX_SOURCE_BYTES
  ) {
    throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Available source state is invalid.');
  }
  let downloadUrl;
  try {
    downloadUrl = new URL(payload.source.downloadUrl);
  } catch {
    throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Source download URL is invalid.');
  }
  const expiresAt = Date.parse(payload.source.expiresAt);
  const currentTime = now();
  if (
    downloadUrl.origin !== new URL(apiUrl).origin ||
    downloadUrl.username ||
    downloadUrl.password ||
    downloadUrl.hash ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= currentTime ||
    expiresAt > currentTime + 15 * 60 * 1_000
  ) {
    throw new SlideBlocksClientError('INVALID_SERVER_RESPONSE', 'Source capability URL is unsafe or expired.');
  }
  return payload;
}

function writePrivateOutput(path, bytes, { force = false } = {}) {
  const absolute = resolve(path);
  const directory = dirname(absolute);
  mkdirSync(directory, { recursive: true });
  if (existsSync(absolute)) {
    const stats = lstatSync(absolute);
    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new SlideBlocksClientError('UNSAFE_OUTPUT', `Output must be a regular file: ${absolute}`);
    }
    if (!force) {
      throw new SlideBlocksClientError('OUTPUT_EXISTS', `Output already exists: ${absolute}`);
    }
  }
  const temporary = join(directory, `.${process.pid}.${createRandomUUID()}.tmp`);
  let descriptor;
  try {
    descriptor = openSync(temporary, 'wx', 0o600);
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, absolute);
    chmodSync(absolute, 0o600);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(temporary)) rmSync(temporary);
  }
  return absolute;
}

function parseAnonymousContextCookie(response, apiUrl, now) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie || setCookie.includes(',')) {
    throw new SlideBlocksClientError(
      'INVALID_SERVER_RESPONSE',
      'Anonymous delivery context was not returned safely.',
      { status: response.status }
    );
  }
  const parts = setCookie.split(';').map((part) => part.trim());
  const prefix = `${ANONYMOUS_CONTEXT_COOKIE_NAME}=`;
  const value = parts[0]?.startsWith(prefix) ? parts[0].slice(prefix.length) : '';
  const expiresAt = anonymousContextExpiry(value);
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const secureRequired = new URL(apiUrl).protocol === 'https:';
  if (
    !expiresAt ||
    expiresAtMs <= now() ||
    expiresAtMs > now() + (ANONYMOUS_CONTEXT_MAX_AGE_SECONDS + 300) * 1_000 ||
    !parts.includes(`Max-Age=${ANONYMOUS_CONTEXT_MAX_AGE_SECONDS}`) ||
    !parts.includes(`Path=${ANONYMOUS_CONTEXT_COOKIE_PATH}`) ||
    !parts.includes('HttpOnly') ||
    !parts.includes('SameSite=Lax') ||
    (secureRequired && !parts.includes('Secure')) ||
    parts.some((part) => /^Domain=/iu.test(part))
  ) {
    throw new SlideBlocksClientError(
      'INVALID_SERVER_RESPONSE',
      'Anonymous delivery context was invalid.',
      { status: response.status }
    );
  }
  return { anonymousContext: value, anonymousContextExpiresAt: expiresAt };
}

function artifactUnlockHeaders(config) {
  return {
    ...jsonHeaders(config.accessToken),
    ...(!config.accessToken && config.anonymousContext
      ? { Cookie: `${ANONYMOUS_CONTEXT_COOKIE_NAME}=${config.anonymousContext}` }
      : {})
  };
}

async function unlockArtifact(config, request, context) {
  let activeConfig = activeDeliveryConfig(config, context);
  let networkRetries = 0;
  let contextRetries = 0;
  while (true) {
    let response;
    try {
      response = await fetchWithTimeout(
        context.fetch,
        `${activeConfig.apiUrl}/api/v1/skill/artifacts/unlock`,
        {
          method: 'POST',
          headers: artifactUnlockHeaders(activeConfig),
          body: JSON.stringify(request)
        }
      );
    } catch (error) {
      const retryable =
        error instanceof SlideBlocksClientError &&
        error.code === 'NETWORK_UNAVAILABLE';
      if (!retryable || networkRetries >= 1) throw error;
      networkRetries += 1;
      await context.sleep(250);
      continue;
    }

    const payload = await readJsonResponse(response, MAX_PROMPT_BYTES + 256 * 1024);
    if (response.ok) {
      if (payload === undefined) {
        throw new SlideBlocksClientError(
          'INVALID_SERVER_RESPONSE',
          'Server returned an empty response.',
          { status: response.status }
        );
      }
      return payload;
    }

    const error = serverError(payload, response);
    if (
      response.status === 428 &&
      error.code === 'ANONYMOUS_CONTEXT_REQUIRED' &&
      !activeConfig.accessToken &&
      contextRetries < 1
    ) {
      const issued = parseAnonymousContextCookie(
        response,
        activeConfig.apiUrl,
        context.now
      );
      activeConfig = writeClientConfig(
        { ...activeConfig, ...issued },
        { env: context.env, now: context.now }
      ).config;
      contextRetries += 1;
      continue;
    }
    if (response.status >= 500 && networkRetries < 1) {
      networkRetries += 1;
      await context.sleep(250);
      continue;
    }
    throw error;
  }
}

async function downloadSource(source, config, path, options, context) {
  const response = await fetchWithTimeout(
    context.fetch,
    source.downloadUrl,
    {
      method: 'GET',
      headers: {
        Accept: 'application/zip',
        'User-Agent': `SlideBlocks-Skill/${CLIENT_VERSION}`
      }
    },
    60_000
  );
  if (!response.ok) {
    if ([401, 403, 404, 410].includes(response.status)) {
      throw new SlideBlocksClientError(
        'SOURCE_CAPABILITY_EXPIRED',
        'Source link expired or Artifact access was revoked.',
        { status: response.status }
      );
    }
    throw serverError(await readJsonResponse(response, 64 * 1024), response);
  }
  const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/zip') {
    throw new SlideBlocksClientError(
      'INVALID_SOURCE_RESPONSE',
      'Source download did not return an application/zip payload.'
    );
  }
  const bytes = await readBoundedBytes(response, MAX_SOURCE_BYTES);
  const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  if (bytes.length !== source.byteSize || digest !== source.sha256) {
    throw new SlideBlocksClientError(
      'SOURCE_INTEGRITY_MISMATCH',
      'Downloaded source bytes did not match the signed Artifact metadata.'
    );
  }
  return writePrivateOutput(path, bytes, { force: options.force });
}

async function artifactCommand(args, context) {
  if (args[0] !== 'get') {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'Use `slideblocks artifact get <artifact-id>`.');
  }
  const { positionals, options } = parseOptions(args.slice(1), {
    '--version': 'value',
    '--hash': 'value',
    '--variant': 'value',
    '--prompt': 'value',
    '--source': 'value',
    '--force': 'boolean',
    '--json': 'boolean'
  });
  if (positionals.length !== 1 || !ARTIFACT_ID_PATTERN.test(positionals[0])) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'artifact get requires one canonical Artifact ID.');
  }
  if (options.json && options.prompt) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', '--json and --prompt cannot be combined.');
  }
  const { config } = readClientConfig({ env: context.env });
  const catalog = await loadCatalog(config, context);
  const entry = catalog.entries.find((candidate) => candidate.id === positionals[0]);
  if (!entry) throw new SlideBlocksClientError('ARTIFACT_NOT_FOUND', 'Artifact is not in the public Catalog.');
  const coordinates = validateArtifactCoordinates(entry, options);
  const variant = options.variant ?? defaultVariant(entry);
  const allowedVariants = entry.kind === 'block-variant' ? entry.promptVariants : ['default'];
  if (!['default', 'deck', 'integration'].includes(variant) || !allowedVariants?.includes(variant)) {
    throw new SlideBlocksClientError('INVALID_ARGUMENT', 'Prompt variant is unavailable for this Artifact.');
  }
  const request = {
    protocolVersion: PROTOCOL_VERSION,
    clientVersion: CLIENT_VERSION,
    unlockId: context.randomUUID(),
    artifactId: entry.id,
    artifactVersion: coordinates.artifactVersion,
    contentHash: coordinates.contentHash,
    variant
  };
  const payload = validateUnlockResponse(
    await unlockArtifact(config, request, context),
    request,
    config.apiUrl,
    context.now
  );
  if (payload.skill.packageVersion !== PACKAGE_VERSION) {
    context.stderr.write(
      `SlideBlocks Skill ${payload.skill.packageVersion} is available. Run: ${payload.skill.updateCommand}\n`
    );
  }

  let sourcePath;
  if (options.source) {
    if (!payload.source.available) {
      throw new SlideBlocksClientError('SOURCE_UNAVAILABLE', 'This Artifact has no source bundle.');
    }
    sourcePath = await downloadSource(payload.source, config, options.source, options, context);
  }
  if (options.json) {
    outputJson(context.stdout, {
      protocolVersion: payload.protocolVersion,
      unlockId: payload.unlockId,
      artifactId: payload.artifactId,
      artifactVersion: payload.artifactVersion,
      contentHash: payload.contentHash,
      variant: payload.variant,
      prompt: payload.prompt,
      skill: payload.skill,
      source: payload.source.available
        ? {
            available: true,
            expiresAt: payload.source.expiresAt,
            sha256: payload.source.sha256,
            byteSize: payload.source.byteSize,
            savedPath: sourcePath ?? null
          }
        : { available: false }
    });
    return;
  }
  if (options.prompt) {
    const promptPath = writePrivateOutput(options.prompt, Buffer.from(payload.prompt), {
      force: options.force
    });
    context.stdout.write(`${context.text.promptSaved(promptPath)}\n`);
  } else {
    context.stdout.write(payload.prompt.endsWith('\n') ? payload.prompt : `${payload.prompt}\n`);
  }
  if (sourcePath) context.stderr.write(`${context.text.sourceSaved(sourcePath)}\n`);
}

async function runRemoteInstaller(mode, config, context) {
  const response = await fetchWithTimeout(
    context.fetch,
    `${config.siteUrl}/skill/install.sh`,
    { method: 'GET', headers: { Accept: 'text/x-shellscript', 'User-Agent': `SlideBlocks-Skill/${CLIENT_VERSION}` } },
    30_000
  );
  if (!response.ok) throw serverError(await readJsonResponse(response, 64 * 1024), response);
  const installer = await readBoundedBytes(response, MAX_INSTALLER_BYTES);
  const text = installer.toString('utf8');
  if (!text.startsWith('#!/bin/sh\n') || !text.includes('SlideBlocks install failed:')) {
    throw new SlideBlocksClientError('INVALID_INSTALLER', 'Downloaded installer contract is invalid.');
  }
  const installerArgs = [
    '-s',
    '--',
    '--site',
    config.siteUrl,
    '--api',
    config.apiUrl,
    ...(config.installTarget ? ['--target', config.installTarget] : []),
    ...(config.binDir ? ['--bin-dir', config.binDir] : []),
    ...(mode === 'uninstall' ? ['--uninstall'] : [])
  ];
  const result = context.spawn('sh', installerArgs, {
    input: installer,
    stdio: ['pipe', 'inherit', 'inherit'],
    encoding: 'utf8'
  });
  if (result.error || result.status !== 0) {
    throw new SlideBlocksClientError(
      mode === 'uninstall' ? 'UNINSTALL_FAILED' : 'UPDATE_FAILED',
      `SlideBlocks Skill ${mode} failed.`,
      { cause: result.error }
    );
  }
}

async function skillCommand(args, context) {
  const action = args[0];
  const { positionals, options } = parseOptions(args.slice(1), { '--json': 'boolean' });
  if (!['update', 'uninstall'].includes(action) || positionals.length > 0) {
    throw new SlideBlocksClientError(
      'INVALID_ARGUMENT',
      'Use `slideblocks skill update` or `slideblocks skill uninstall`.'
    );
  }
  const loaded = readClientConfig({ env: context.env });
  let { config } = loaded;
  if (action === 'uninstall' && config.accessToken) {
    const response = await fetchWithTimeout(context.fetch, `${config.apiUrl}/api/v1/skill/logout`, {
      method: 'POST',
      headers: jsonHeaders(config.accessToken),
      body: '{}'
    });
    if (!response.ok && response.status !== 401 && response.status !== 403) {
      throw serverError(await readJsonResponse(response, 64 * 1024), response);
    }
    config = writeClientConfig(withoutToken(config), {
      env: context.env,
      now: context.now
    }).config;
  }
  await runRemoteInstaller(action, config, context);
  if (action === 'uninstall' && existsSync(loaded.path)) {
    const stats = lstatSync(loaded.path);
    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new SlideBlocksClientError('UNSAFE_CONFIG', 'Refusing to remove an unsafe config path.');
    }
    rmSync(loaded.path);
  }
  if (options.json) outputJson(context.stdout, { action, succeeded: true });
  else context.stdout.write(`${action === 'update' ? context.text.updateDone : context.text.uninstallDone}\n`);
}

function help(locale) {
  if (locale === 'zh-CN') {
    return `SlideBlocks Skill 客户端 ${CLIENT_VERSION}

用法：
  slideblocks configure [--site URL] [--api URL]
  slideblocks login [--site URL] [--api URL]
  slideblocks status
  slideblocks logout [--local]
  slideblocks catalog search <关键词> [--limit 20]
  slideblocks catalog show <artifact-id>
  slideblocks artifact get <artifact-id> [--variant 名称] [--prompt 文件] [--source 文件]
  slideblocks skill update
  slideblocks skill uninstall

公开 Catalog、Prompt 与可用源码无需登录；login 仅用于可选的账户连接。
通用选项：--json、--locale en|zh-CN、--help、--version
`;
  }
  return `SlideBlocks Skill client ${CLIENT_VERSION}

Usage:
  slideblocks configure [--site URL] [--api URL]
  slideblocks login [--site URL] [--api URL]
  slideblocks status
  slideblocks logout [--local]
  slideblocks catalog search <query> [--limit 20]
  slideblocks catalog show <artifact-id>
  slideblocks artifact get <artifact-id> [--variant NAME] [--prompt FILE] [--source FILE]
  slideblocks skill update
  slideblocks skill uninstall

Published Catalog, Prompt, and available source retrieval require no login; login is optional account connection.
Global options: --json, --locale en|zh-CN, --help, --version
`;
}

export async function runCli(argv, dependencies = {}) {
  const env = dependencies.env ?? process.env;
  const args = [...argv];
  let requestedLocale;
  const localeIndex = args.indexOf('--locale');
  if (localeIndex !== -1) {
    requestedLocale = args[localeIndex + 1];
    if (!['en', 'zh-CN'].includes(requestedLocale)) {
      throw new SlideBlocksClientError('INVALID_ARGUMENT', '--locale must be en or zh-CN.');
    }
    args.splice(localeIndex, 2);
  }
  const locale = selectedLocale(env, requestedLocale);
  const context = {
    env,
    locale,
    text: messages[locale],
    fetch: dependencies.fetch ?? globalThis.fetch,
    sleep: dependencies.sleep ?? ((milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds))),
    now: dependencies.now ?? (() => Date.now()),
    randomUUID: dependencies.randomUUID ?? createRandomUUID,
    spawn: dependencies.spawn ?? spawnSync,
    stdout: dependencies.stdout ?? process.stdout,
    stderr: dependencies.stderr ?? process.stderr
  };
  if (!context.fetch) throw new SlideBlocksClientError('UNSUPPORTED_RUNTIME', 'Node.js fetch is unavailable.');
  const command = args.shift();
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    context.stdout.write(help(locale));
    return;
  }
  if (command === '--version' || command === '-v') {
    context.stdout.write(`${CLIENT_VERSION}\n`);
    return;
  }
  const commands = {
    configure: configureCommand,
    login: loginCommand,
    status: statusCommand,
    logout: logoutCommand,
    catalog: catalogCommand,
    artifact: artifactCommand,
    skill: skillCommand
  };
  const handler = commands[command];
  if (!handler) throw new SlideBlocksClientError('INVALID_ARGUMENT', `Unknown command: ${command}`);
  await handler(args, context);
}

const isDirectExecution =
  process.argv[1] &&
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));
if (isDirectExecution) {
  runCli(process.argv.slice(2)).catch((error) => {
    const safe =
      error instanceof SlideBlocksClientError
        ? error
        : new SlideBlocksClientError('UNEXPECTED_ERROR', 'Unexpected SlideBlocks client failure.');
    const details = [
      `SlideBlocks error [${safe.code}]: ${safe.message}`,
      safe.requestId ? `Request ID: ${safe.requestId}` : undefined,
      safe.retryAfterSeconds ? `Retry after: ${safe.retryAfterSeconds}s` : undefined
    ].filter(Boolean);
    process.stderr.write(`${details.join('\n')}\n`);
    process.exitCode = 1;
  });
}
