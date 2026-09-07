// Save the editable runtime, never the currently mounted Vue DOM or a snapshot.
import { pathPrefix } from '@slidev/client'
import { readEdits, savePendingTextEdits } from './text-edit'

const SEED_ID = 'slideblocks-text-edit-seed'
const SOURCE_ID = 'slideblocks-offline-source'
const MAX_EDITS_BYTES = 256 * 1024

type OfflineWindow = Window & { __slideblocksOfflineSource?: string }
export interface OfflineExportOptions {
  offlineUrl?: string
  filename?: string
  bridgeDisabled?: boolean
}

function copy(zh: string, en: string) {
  const lang = new URLSearchParams(window.location.search).get('lang')
    || document.documentElement.lang || navigator.language
  return lang.toLowerCase().startsWith('zh') ? zh : en
}

export function serializeOfflineEdits(source: string, edits: unknown): string {
  const payload = JSON.stringify({ version: 2, edits })
  if (new TextEncoder().encode(payload).length > MAX_EDITS_BYTES) {
    throw new Error(copy('编辑内容超过离线保存上限。', 'Edits exceed the offline save limit.'))
  }
  // Parsing an immutable original shell is intentional. Serializing the live
  // document here would bake Vue state into the app root and lose its source.
  const doc = new DOMParser().parseFromString(source, 'text/html')
  if (doc.documentElement.getAttribute('data-slideblocks-offline-player') !== 'true'
    || !doc.querySelector(`script#${SOURCE_ID}[data-slideblocks-source-version="1"]`)) {
    throw new Error(copy('请先重新构建可编辑 offline.html。', 'Rebuild the editable offline.html first.'))
  }
  if (doc.querySelector('script[src], script[type="module"][async]')) {
    throw new Error(copy('离线文件仍依赖外部脚本或不安全的加载顺序。', 'Offline scripts are external or have an unsafe loading order.'))
  }
  for (const node of doc.querySelectorAll('link[href], img[src], source[src], video[src], audio[src], iframe[src], object[data], embed[src]')) {
    const value = node.getAttribute('href') || node.getAttribute('src') || node.getAttribute('data') || ''
    if (value && !/^(?:data:|#)/iu.test(value)) {
      throw new Error(copy('离线文件包含未内联资源，未生成下载。', 'Offline resources are not self-contained; no file was saved.'))
    }
  }
  for (const seed of doc.querySelectorAll(`[id="${SEED_ID}"]`)) seed.remove()
  const seed = doc.createElement('script')
  seed.id = SEED_ID
  seed.type = 'application/json'
  // Escaping < prevents a text edit such as </script> from ending the inert
  // element when the resulting file is parsed on its next opening.
  seed.textContent = payload.replaceAll('<', '\\u003c').replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')
  doc.head.prepend(seed)
  return `<!doctype html>\n${doc.documentElement.outerHTML}`
}

function offlineUrl(options: OfflineExportOptions) {
  if (options.offlineUrl) return new URL(options.offlineUrl, window.location.href)
  if (document.documentElement.hasAttribute('data-slideblocks-offline-player')) {
    const current = new URL(window.location.href)
    current.hash = ''
    current.search = ''
    return current
  }
  const base = pathPrefix.replace(/#\/?$/u, '').replace(/\/?$/u, '/')
  return new URL(`${base}offline.html`, window.location.href)
}

async function originalOfflineSource(options: OfflineExportOptions, edits: unknown): Promise<string> {
  const captured = (window as OfflineWindow).__slideblocksOfflineSource
  if (document.documentElement.hasAttribute('data-slideblocks-offline-player') && captured) return captured
  if (window.location.protocol === 'file:') {
    throw new Error(copy('此文件没有可编辑原始壳，请重新构建后再保存。', 'This file has no editable source shell. Rebuild it before saving.'))
  }
  if (import.meta.env.DEV && !options.bridgeDisabled) {
    const response = await fetch('/__slideblocks/offline-build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SlideBlocks-Offline-Export': '1' },
      body: JSON.stringify({ version: 2, edits }),
      signal: AbortSignal.timeout(310_000),
    })
    if (!response.ok) {
      throw new Error(copy(`本地离线构建失败（HTTP ${response.status}），请检查本地终端。`, `Local offline build failed (HTTP ${response.status}); check the local terminal.`))
    }
    return response.text()
  }
  const url = offlineUrl(options)
  if (url.origin !== window.location.origin) {
    throw new Error(copy('仅允许读取同源的离线文件。', 'Only a same-origin offline artifact can be saved.'))
  }
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) })
  if (!response.ok) {
    throw new Error(copy(`找不到已构建的 offline.html（HTTP ${response.status}）。`, `Built offline.html is unavailable (HTTP ${response.status}).`))
  }
  return response.text()
}

let active = false
export async function downloadOfflinePlayer(options: OfflineExportOptions = {}): Promise<void> {
  if (active) return
  active = true
  const status = document.createElement('aside')
  status.setAttribute('role', 'status')
  status.setAttribute('data-slideblocks-offline-status', 'preparing')
  status.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;max-width:min(440px,calc(100vw - 32px));padding:12px 16px;border:1px solid #64748b;border-radius:10px;background:#0f172a;color:#e2e8f0;font:14px/1.5 system-ui;'
  status.textContent = copy('正在保存可编辑离线文件…', 'Saving editable offline file…')
  document.body.append(status)
  try {
    if (!savePendingTextEdits()) {
      throw new Error(copy('编辑尚未保存成功，请检查浏览器存储后重试。', 'Edits were not saved. Check browser storage and retry.'))
    }
    const edits = readEdits()
    const source = await originalOfflineSource(options, edits)
    const html = serializeOfflineEdits(source, edits)
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = options.filename || 'offline.html'
    link.hidden = true
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    status.dataset.slideblocksOfflineStatus = 'download-started'
    status.textContent = copy('已开始下载可编辑 HTML；请保留浏览器下载的文件。', 'Editable HTML download started; keep the downloaded file.')
    window.setTimeout(() => status.remove(), 4_000)
  }
  catch (error) {
    status.dataset.slideblocksOfflineStatus = 'error'
    status.textContent = error instanceof Error ? error.message : copy('离线保存失败。', 'Offline save failed.')
    status.setAttribute('role', 'alert')
    const dismiss = document.createElement('button')
    dismiss.type = 'button'
    dismiss.textContent = copy('关闭', 'Dismiss')
    dismiss.style.cssText = 'display:block;margin-top:8px;color:inherit;text-decoration:underline'
    dismiss.onclick = () => status.remove()
    status.append(dismiss)
  }
  finally { active = false }
}
