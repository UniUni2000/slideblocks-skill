// Presenter-side, plain-text corrections. Sources are never written. A patch
// only applies when both its DOM text path and exact source text still match.
import { lockShortcuts, pathPrefix } from '@slidev/client'

export type TextEdits = Record<string, Record<string, { source: string; text: string }>>

const PREFIX = 'slideblocks-text-edit:v2:'
const TARGET = 'data-slideblocks-text-target'
const MODE = 'data-slideblocks-edit-mode'
const EXCLUDED = 'svg,math,script,style,noscript,pre,code,.katex,button,a,input,select,textarea,iframe,canvas,audio,video,[role="button"],[role="link"],[role="menuitem"],[contenteditable], [data-slideblocks-text-edit-ui]'
const MAX_BYTES = 256 * 1024
const MAX_TEXT = 20_000

interface Target {
  node: Text
  owner: HTMLElement
  path: string
  source: string
  rendered: string
  wrapper?: HTMLSpanElement
}
interface Session {
  page: number
  root: HTMLElement
  targets: Target[]
  dirty: boolean
  history: string[][]
  redo: string[][]
  unlock: () => void
  composing: boolean
}
interface Runtime {
  targets: WeakMap<Text, Target>
  wrappers: WeakMap<Element, Target>
  session: Session | null
  pending: TextEdits | null
  pendingSeed?: string
  retargetFrame?: number
  seedChecked: boolean
  leases: number
  dispose?: () => void
  ui?: HTMLElement
  style?: HTMLStyleElement
}
// Previews can compose an existing Deck global layer and the canonical layer.
// Both module copies share one session and a reference-counted listener lease.
const host = window as Window & { __slideblocksTextEditV2?: Runtime }
const runtime = host.__slideblocksTextEditV2 ??= {
  targets: new WeakMap(), wrappers: new WeakMap(), session: null,
  pending: null, seedChecked: false, leases: 0,
}

function storageKey() {
  const deck = location.protocol === 'file:' ? location.pathname : pathPrefix.replace(/#\/?$/u, '')
  return `${PREFIX}${deck || '/'}`
}

function validatedEdits(value: unknown): TextEdits | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const pages = Object.entries(value)
  if (pages.length > 500) return null
  const result: TextEdits = {}
  let count = 0
  for (const [page, records] of pages) {
    if (!/^[1-9]\d*$/u.test(page) || !records || typeof records !== 'object' || Array.isArray(records)) return null
    const clean: TextEdits[string] = {}
    for (const [path, record] of Object.entries(records)) {
      if (!/^\d+(?:\.\d+)*$/u.test(path) || ++count > 5000) return null
      if (!record || typeof record !== 'object' || Array.isArray(record)) return null
      const keys = Object.keys(record)
      if (keys.length !== 2 || !keys.includes('source') || !keys.includes('text')) return null
      const candidate = record as Record<string, unknown>
      if (typeof candidate.source !== 'string' || typeof candidate.text !== 'string') return null
      if (candidate.source.length > MAX_TEXT || candidate.text.length > MAX_TEXT) return null
      clean[path] = { source: candidate.source, text: candidate.text }
    }
    result[page] = clean
  }
  return new TextEncoder().encode(JSON.stringify(result)).length <= MAX_BYTES ? result : null
}

function initializeSeed() {
  if (runtime.seedChecked) return
  runtime.seedChecked = true
  const element = document.querySelector('script#slideblocks-text-edit-seed[type="application/json"]')
  if (!element?.textContent) return
  try {
    const seed = JSON.parse(element.textContent)
    const edits = seed.version === 2 ? validatedEdits(seed.edits) : null
    if (!edits) return
    // Exact seed comparison avoids collisions and distinguishes a newly saved
    // artifact at the same path from an ordinary reload of that artifact.
    const signature = JSON.stringify({ version: 2, edits })
    runtime.pending = edits
    runtime.pendingSeed = signature
    if (localStorage.getItem(`${storageKey()}:seed`) === signature) {
      runtime.pending = null
      runtime.pendingSeed = undefined
      return
    }
    localStorage.setItem(storageKey(), JSON.stringify(edits))
    localStorage.setItem(`${storageKey()}:seed`, signature)
    runtime.pending = null
    runtime.pendingSeed = undefined
  }
  catch { /* Keep a valid seed in memory if this browser denies localStorage. */ }
}

export function readEdits(): TextEdits {
  initializeSeed()
  if (runtime.pending) return structuredClone(runtime.pending)
  try { return validatedEdits(JSON.parse(localStorage.getItem(storageKey()) || '{}')) ?? {} }
  catch { return {} }
}

function visible(el: HTMLElement) {
  for (let current: HTMLElement | null = el; current; current = current.parentElement) {
    const style = getComputedStyle(current)
    if (style.display === 'none' || style.visibility === 'hidden') return false
  }
  return true
}

function collectTargets(root: HTMLElement): Target[] {
  const targets: Target[] = []
  function visit(parent: HTMLElement, prefix: string) {
    Array.from(parent.childNodes).forEach((node, index) => {
      const path = prefix ? `${prefix}.${index}` : String(index)
      if (node instanceof HTMLElement) {
        const wrapped = runtime.wrappers.get(node)
        if (wrapped) { targets.push(wrapped); return }
        if (!node.matches(EXCLUDED)) visit(node, path)
      }
      else if (node instanceof Text) {
        let target = runtime.targets.get(node)
        // A framework update to a retained Text node is a new source, not an
        // invitation to replay the old correction over changed content.
        if (target && node.data !== target.rendered) target = undefined
        if (!target && node.data.trim() && node.data.length <= MAX_TEXT) {
          target = { node, owner: parent, path, source: node.data, rendered: node.data }
          runtime.targets.set(node, target)
        }
        if (target) { target.path = path; targets.push(target) }
      }
    })
  }
  if (!root.matches(EXCLUDED)) visit(root, '')
  return targets
}

function targetText(target: Target) { return target.wrapper?.textContent ?? target.node.data }
function setTargetText(target: Target, text: string) {
  if (target.wrapper) target.wrapper.textContent = text
  else target.node.data = text
  target.rendered = text
}

export function applyTextEditsToRoot(root: HTMLElement, page: number): number {
  const records = readEdits()[String(page)]
  if (!records) return 0
  const targets = new Map(collectTargets(root).map(target => [target.path, target]))
  let orphaned = 0
  for (const [path, record] of Object.entries(records)) {
    const target = targets.get(path)
    if (!target || target.source !== record.source) { orphaned++; continue }
    setTargetText(target, record.text)
  }
  return orphaned
}

function slidePage(page?: number) {
  const pages = [...document.querySelectorAll<HTMLElement>('#slide-container .slidev-page')]
  return page === undefined ? pages.find(visible) : pages.find(el => el.dataset.slidevNo === String(page))
}

export function applyTextEditsWhenReady(page: number, frames = 120): number {
  const root = slidePage(page)
  if (!root || collectTargets(root).length === 0) {
    if (frames > 0) requestAnimationFrame(() => applyTextEditsWhenReady(page, frames - 1))
    return 0
  }
  if (runtime.session?.page === page && runtime.session.dirty) return 0
  return applyTextEditsToRoot(root, page)
}

function ensureUi() {
  if (runtime.ui) return runtime.ui
  const style = document.createElement('style')
  style.textContent = `[${TARGET}]{white-space:inherit;outline:1px dashed #94a3b8;outline-offset:2px;cursor:text}[${TARGET}]:focus{outline-style:solid}[data-slideblocks-text-edit-ui]{position:fixed;left:16px;top:16px;z-index:10000;pointer-events:none}[data-sb-dirty-dot]{width:10px;height:10px;border-radius:50%;background:#22c55e;display:none}[data-sb-dirty="true"]{display:block}[data-sb-save-error]{display:block;width:min(420px,calc(100vw - 32px));height:auto;box-sizing:border-box;padding:8px 12px;border-radius:6px;color:white;background:#991b1b;font:14px/1.4 system-ui}@media print{[data-slideblocks-text-edit-ui]{display:none!important}[${TARGET}]{outline:none!important}}`
  const ui = document.createElement('div')
  ui.setAttribute('data-slideblocks-text-edit-ui', '')
  ui.setAttribute('data-sb-dirty-dot', '')
  ui.setAttribute('role', 'status')
  ui.setAttribute('aria-live', 'polite')
  ui.setAttribute('aria-label', 'Unsaved text edits')
  document.head.append(style)
  document.body.append(ui)
  runtime.style = style
  runtime.ui = ui
  return ui
}

function markDirty() {
  if (runtime.session) runtime.session.dirty = true
  ensureUi().setAttribute('data-sb-dirty', 'true')
}

function saveError() {
  const ui = ensureUi()
  ui.setAttribute('data-sb-save-error', '')
  const chinese = (document.documentElement.lang || navigator.language).toLowerCase().startsWith('zh')
  const message = chinese
    ? '文字修改未能保存。请保持本页打开，恢复浏览器存储后按 ⌘/Ctrl+S 重试。'
    : 'Text edits could not be saved. Keep this page open and retry ⌘/Ctrl+S.'
  ui.textContent = message
  ui.setAttribute('aria-label', message)
}

export function savePendingTextEdits(): boolean {
  initializeSeed()
  const session = runtime.session
  if (!session?.dirty && !runtime.pending) return true
  const edits = readEdits()
  if (session?.dirty) {
    const records = { ...edits[String(session.page)] }
    for (const target of session.targets) {
      const text = targetText(target)
      if (text === target.source) delete records[target.path]
      else records[target.path] = { source: target.source, text }
    }
    if (Object.keys(records).length) edits[String(session.page)] = records
    else delete edits[String(session.page)]
  }
  runtime.pending = edits
  try {
    if (!validatedEdits(edits)) throw new Error('Text edit size limit exceeded')
    localStorage.setItem(storageKey(), JSON.stringify(edits))
    if (runtime.pendingSeed) localStorage.setItem(`${storageKey()}:seed`, runtime.pendingSeed)
    runtime.pending = null
    runtime.pendingSeed = undefined
    if (session) session.dirty = false
    runtime.ui?.removeAttribute('data-sb-dirty')
    runtime.ui?.removeAttribute('data-sb-save-error')
    runtime.ui?.setAttribute('aria-label', 'Unsaved text edits')
    if (runtime.ui) runtime.ui.textContent = ''
    return true
  }
  catch { saveError(); return false }
}

function snapshot(session: Session) { return session.targets.map(targetText) }
function recordInput() {
  const session = runtime.session
  if (!session) return
  for (const target of session.targets) target.rendered = targetText(target)
  markDirty()
  if (session.composing) return
  const current = snapshot(session)
  if (JSON.stringify(current) === JSON.stringify(session.history.at(-1))) return
  session.history.push(current)
  if (session.history.length > 100) session.history.shift()
  session.redo.length = 0
}

function focusTarget(target: Target) {
  const wrapper = target.wrapper
  if (!wrapper) return
  wrapper.focus()
  const range = document.createRange()
  range.selectNodeContents(wrapper)
  range.collapse(false)
  const selection = getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function removeSession() {
  const session = runtime.session
  if (!session) return
  for (const target of session.targets) {
    if (!target.wrapper) continue
    const wrapper = target.wrapper
    target.node.data = targetText(target)
    target.rendered = target.node.data
    wrapper.replaceWith(target.node)
    runtime.wrappers.delete(wrapper)
    delete target.wrapper
  }
  session.unlock()
  runtime.session = null
  document.documentElement.removeAttribute(MODE)
  runtime.ui?.remove()
  runtime.style?.remove()
  runtime.ui = undefined
  runtime.style = undefined
}

export function startTextEditSession(page: number, focus?: Element): boolean {
  if (runtime.retargetFrame !== undefined) cancelAnimationFrame(runtime.retargetFrame)
  runtime.retargetFrame = undefined
  if (document.documentElement.dataset.slideblocksPdfView === 'true') return false
  if (runtime.session) return false
  const root = slidePage(page)
  if (!root) return false
  applyTextEditsToRoot(root, page)
  const targets = collectTargets(root).filter(target => visible(target.owner))
  if (!targets.length) return false
  for (const target of targets) {
    const wrapper = document.createElement('span')
    wrapper.setAttribute(TARGET, target.path)
    wrapper.setAttribute('contenteditable', 'plaintext-only')
    wrapper.setAttribute('spellcheck', 'false')
    target.node.replaceWith(wrapper)
    wrapper.append(target.node)
    target.wrapper = wrapper
    runtime.wrappers.set(wrapper, target)
  }
  const session: Session = { page, root, targets, dirty: false, history: [], redo: [], unlock: lockShortcuts(), composing: false }
  runtime.session = session
  session.history.push(snapshot(session))
  document.documentElement.setAttribute(MODE, '')
  ensureUi()
  const first = targets.find(target => focus === target.owner || focus?.contains(target.owner)) ?? targets[0]
  if (first) focusTarget(first)
  return true
}

export function notifyPageChange(page: number) {
  if ((!runtime.session && runtime.retargetFrame === undefined) || runtime.session?.page === page) return
  if (!savePendingTextEdits()) return
  removeSession()
  if (runtime.retargetFrame !== undefined) cancelAnimationFrame(runtime.retargetFrame)
  runtime.retargetFrame = requestAnimationFrame(() => startTextEditSession(page))
}

function eventTarget(event: Event) {
  return event.target instanceof Element ? event.target.closest<HTMLElement>(`[${TARGET}]`) : null
}

function insertPlainText(wrapper: HTMLElement, text: string) {
  const selection = getSelection()
  if (!selection?.rangeCount) return
  const range = selection.getRangeAt(0)
  if (!wrapper.contains(range.commonAncestorContainer)) return
  range.deleteContents()
  const node = document.createTextNode(text)
  range.insertNode(node)
  range.setStartAfter(node)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  recordInput()
}

export function installTextEditInteractions() {
  if (++runtime.leases > 1) return
  const doubleClick = (event: MouseEvent) => {
    if (document.documentElement.dataset.slideblocksPdfView === 'true') return
    const root = slidePage()
    if (!root || !(event.target instanceof HTMLElement) || !root.contains(event.target)) return
    const wrapper = eventTarget(event)
    if (wrapper) {
      const target = runtime.wrappers.get(wrapper)
      if (target) focusTarget(target)
      return
    }
    if (event.target.closest(EXCLUDED)) return
    const targets = collectTargets(root).filter(target => target.owner === event.target)
    if (!targets.length) return
    startTextEditSession(Number(root.dataset.slidevNo), event.target)
  }
  const pointerDown = (event: PointerEvent) => {
    // Only an active edit session consumes a blank pointer gesture. Ordinary
    // presentation clicks retain the Deck's existing navigation semantics.
    const session = runtime.session
    if (!session || event.button !== 0 || !(event.target instanceof Element)) return
    if (!session.root.contains(event.target) || eventTarget(event) || event.target.closest(EXCLUDED)) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  const click = (event: MouseEvent) => {
    const session = runtime.session
    if (!session || !(event.target instanceof Element) || !session.root.contains(event.target)) return
    if (eventTarget(event) || event.target.closest(EXCLUDED)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (savePendingTextEdits()) removeSession()
  }
  const keydown = (event: KeyboardEvent) => {
    const session = runtime.session
    if (!session || session.composing || event.isComposing) return
    if (event.key === 'Escape' && document.querySelector('.z-context-menu')) return
    const mod = event.ctrlKey || event.metaKey
    const key = event.key.toLowerCase()
    if (mod && key === 's') {
      event.preventDefault(); event.stopImmediatePropagation()
      if (savePendingTextEdits()) {
        const currentPage = Number(slidePage()?.dataset.slidevNo)
        if (currentPage > 0) notifyPageChange(currentPage)
      }
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation()
      if (savePendingTextEdits()) removeSession()
      return
    }
    const undo = mod && key === 'z' && !event.shiftKey
    const redo = mod && (key === 'y' || (key === 'z' && event.shiftKey))
    if (!undo && !redo) return
    event.preventDefault(); event.stopImmediatePropagation()
    if (undo && session.history.length > 1) {
      session.redo.push(session.history.pop()!)
      session.targets.forEach((target, index) => setTargetText(target, session.history.at(-1)![index]))
      markDirty()
    }
    else if (redo && session.redo.length) {
      const next = session.redo.pop()!
      session.history.push(next)
      session.targets.forEach((target, index) => setTargetText(target, next[index]))
      markDirty()
    }
  }
  const input = (event: Event) => { if (eventTarget(event)) recordInput() }
  const compositionStart = (event: Event) => { if (eventTarget(event) && runtime.session) runtime.session.composing = true }
  const compositionEnd = (event: Event) => {
    if (!eventTarget(event) || !runtime.session) return
    runtime.session.composing = false; recordInput()
  }
  const paste = (event: ClipboardEvent) => {
    const wrapper = eventTarget(event)
    if (!wrapper) return
    event.preventDefault(); event.stopImmediatePropagation()
    insertPlainText(wrapper, event.clipboardData?.getData('text/plain') ?? '')
  }
  const beforeInput = (event: InputEvent) => {
    const wrapper = eventTarget(event)
    if (!wrapper) return
    if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
      event.preventDefault(); insertPlainText(wrapper, '\n')
    }
    else if (event.inputType.startsWith('format') || event.inputType === 'insertFromDrop') event.preventDefault()
  }
  const drop = (event: DragEvent) => {
    if (!eventTarget(event)) return
    event.preventDefault(); event.stopImmediatePropagation()
  }
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (savePendingTextEdits()) return
    event.preventDefault(); event.returnValue = ''
  }
  const listeners: [string, EventListener][] = [
    ['dblclick', doubleClick as EventListener], ['pointerdown', pointerDown as EventListener],
    ['click', click as EventListener], ['keydown', keydown as EventListener], ['input', input],
    ['compositionstart', compositionStart], ['compositionend', compositionEnd],
    ['paste', paste as EventListener], ['beforeinput', beforeInput as EventListener],
    ['drop', drop as EventListener], ['beforeunload', beforeUnload as EventListener],
  ]
  for (const [name, listener] of listeners) window.addEventListener(name, listener, true)
  runtime.dispose = () => { for (const [name, listener] of listeners) window.removeEventListener(name, listener, true) }
}

export function uninstallTextEditInteractions(): boolean {
  if (runtime.leases > 0 && --runtime.leases > 0) return true
  const saved = savePendingTextEdits()
  if (runtime.retargetFrame !== undefined) cancelAnimationFrame(runtime.retargetFrame)
  runtime.retargetFrame = undefined
  removeSession()
  runtime.dispose?.()
  runtime.dispose = undefined
  return saved
}
