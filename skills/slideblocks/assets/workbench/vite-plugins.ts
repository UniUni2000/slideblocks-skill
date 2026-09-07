// This bridge exists only on the local dev server. No arbitrary command,
// filename or source is accepted from the browser.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const MAX_BODY_BYTES = 256 * 1024
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

export function validOfflineEdits(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const data = value as Record<string, unknown>
  if (Object.keys(data).sort().join(',') !== 'edits,version' || data.version !== 2) return false
  const edits = data.edits
  if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return false
  const pages = Object.entries(edits)
  if (pages.length > 500) return false
  let records = 0
  for (const [page, entries] of pages) {
    if (!/^[1-9]\d*$/u.test(page) || !entries || typeof entries !== 'object' || Array.isArray(entries)) return false
    for (const [path, record] of Object.entries(entries)) {
      if (++records > 5000 || !/^\d+(?:\.\d+)*$/u.test(path) || path.length > 200
        || !record || typeof record !== 'object' || Array.isArray(record)
        || Object.keys(record).sort().join(',') !== 'source,text') return false
      const entry = record as Record<string, unknown>
      if (typeof entry.source !== 'string' || typeof entry.text !== 'string'
        || entry.source.length > 20_000 || entry.text.length > 20_000) return false
    }
  }
  return true
}

export function trustedOfflineRequest(req: IncomingMessage): boolean {
  if (!LOOPBACK.has(req.socket.remoteAddress || '')) return false
  if (req.headers['x-slideblocks-offline-export'] !== '1'
    || req.headers['content-type']?.toLowerCase() !== 'application/json') return false
  const origin = req.headers.origin
  const host = req.headers.host
  if (!origin || !host || !['same-origin', undefined].includes(req.headers['sec-fetch-site'] as string | undefined)) return false
  try {
    const url = new URL(origin)
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return false
    const protocol = (req.socket as { encrypted?: boolean }).encrypted ? 'https:' : 'http:'
    return url.protocol === protocol && origin === `${protocol}//${host}`
  }
  catch { return false }
}

function seedScript(payload: unknown): string {
  const json = JSON.stringify(payload).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')
  return `<script type="application/json" id="slideblocks-text-edit-seed">${json}</script>`
}

export function createOfflineBuildMiddleware(root: string) {
  let building = false
  return (req: IncomingMessage, res: ServerResponse) => {
    const reject = (status: number, code: string) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify({ error: code }))
    }
    if (req.method !== 'POST') { reject(405, 'post-required'); return }
    if (!trustedOfflineRequest(req)) { reject(403, 'local-origin-required'); return }
    if (Number(req.headers['content-length']) > MAX_BODY_BYTES) { reject(413, 'request-too-large'); return }
    if (building) { reject(409, 'build-in-progress'); return }
    const builder = join(root, '.slideblocks', 'build-offline.mjs')
    if (!existsSync(builder)) { reject(503, 'offline-builder-unavailable'); return }
    // Lock before accepting a body: two slow uploads must not start builds
    // which both remove and populate the same .slideblocks/offline-build tree.
    building = true
    let done = false
    let started = false
    let bytes = 0
    const chunks: Buffer[] = []
    let child: ReturnType<typeof spawn> | undefined
    let buildTimer: ReturnType<typeof setTimeout> | undefined
    let killTimer: ReturnType<typeof setTimeout> | undefined
    let stopPoll: ReturnType<typeof setTimeout> | undefined
    let stopping = false
    let childClosed = false
    const bodyTimer = setTimeout(() => finish(408, 'request-timeout'), 10_000)
    function finish(status?: number, code?: string) {
      if (done) return
      done = true
      clearTimeout(bodyTimer)
      if (buildTimer) clearTimeout(buildTimer)
      if (killTimer) clearTimeout(killTimer)
      if (stopPoll) clearTimeout(stopPoll)
      building = false
      if (status && !res.destroyed) reject(status, code || 'offline-build-failed')
    }
    function groupAlive() {
      if (!child?.pid || process.platform === 'win32') return !childClosed
      try { process.kill(-child.pid, 0); return true }
      catch (error) { return (error as NodeJS.ErrnoException).code !== 'ESRCH' }
    }
    function settleStoppedBuild() {
      if (done) return
      if (childClosed && !groupAlive()) { finish(504, 'offline-build-cancelled'); return }
      // The leader can exit before a stubborn Slidev grandchild. Releasing
      // on its close alone would let a new build collide with that process.
      if (stopPoll) clearTimeout(stopPoll)
      stopPoll = setTimeout(settleStoppedBuild, 50)
    }
    function stopBuild() {
      if (!child) { finish(); return }
      if (stopping) return
      stopping = true
      if (process.platform !== 'win32' && child.pid) {
        try { process.kill(-child.pid, 'SIGTERM') } catch { child.kill() }
        // TERM is cooperative. Escalate for the whole isolated process group
        // even if its leader exits first, then confirm it no longer exists.
        killTimer = setTimeout(() => {
          try { process.kill(-child!.pid!, 'SIGKILL') } catch {}
          settleStoppedBuild()
        }, 2_000)
      }
      else if (child.pid) {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
        killer.once('error', () => { if (!res.destroyed) reject(504, 'offline-build-cancellation-failed') })
      }
      settleStoppedBuild()
    }
    req.on('aborted', () => { if (!started) finish(); else stopBuild() })
    res.on('close', () => { if (!res.writableEnded) stopBuild() })
    req.on('error', () => { if (!started) finish(400, 'invalid-request'); else stopBuild() })
    req.on('data', (chunk: Buffer) => {
      if (done) return
      bytes += chunk.length
      if (bytes > MAX_BODY_BYTES) { finish(413, 'request-too-large'); return }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (done) return
      clearTimeout(bodyTimer)
      let payload: unknown
      try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) }
      catch { finish(400, 'invalid-json'); return }
      if (!validOfflineEdits(payload)) { finish(400, 'invalid-edit-state'); return }
      started = true
      try {
        child = spawn(process.execPath, [builder], {
          // Keep diagnostics in the local developer terminal, not the HTTP
          // response. Otherwise the visible "check the terminal" instruction
          // is unusable when the builder fails its self-contained-file gate.
          cwd: root, stdio: ['ignore', 'inherit', 'inherit'], detached: process.platform !== 'win32',
        })
      }
      catch { finish(500, 'offline-build-failed'); return }
      buildTimer = setTimeout(stopBuild, 300_000)
      child.once('error', () => finish(500, 'offline-build-failed'))
      child.once('close', (code) => {
        if (done) return
        childClosed = true
        if (stopping) { settleStoppedBuild(); return }
        if (code !== 0) { finish(500, 'offline-build-failed'); return }
        try {
          let html = readFileSync(join(root, 'offline.html'), 'utf8')
          if (!html.includes('data-slideblocks-offline-player="true"')
            || !html.includes('id="slideblocks-offline-source"') || !html.includes('<head>')) {
            finish(500, 'invalid-offline-artifact'); return
          }
          html = html.replace('<head>', `<head>${seedScript(payload)}`)
          if (!res.destroyed) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Content-Disposition', 'attachment; filename="offline.html"')
            res.setHeader('Cache-Control', 'no-store')
            res.end(html)
          }
          finish()
        }
        catch { finish(500, 'offline-artifact-unavailable') }
      })
    })
  }
}

export default function slideblocksWorkbenchPlugins(): Plugin[] {
  return [{
    name: 'slideblocks:offline-build',
    configureServer(server) {
      const middleware = createOfflineBuildMiddleware(server.config.root)
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?', 1)[0] === '/__slideblocks/offline-build') middleware(req, res)
        else next()
      })
    },
  }]
}
