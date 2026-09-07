import { createRequire } from 'node:module'
import { basename, delimiter, dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const FIGURE_KINDS = new Set(['comparison', 'annotated', 'graph'])
const COMPARISON_LAYOUTS = new Set(['grid', 'lanes'])
const CALLOUT_SIDES = new Set(['auto', 'north', 'east', 'south', 'west'])
const TONES = new Set(['neutral', 'primary', 'accent', 'risk'])
const MARK_TYPES = new Set(['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect'])
const GEOMETRY_SOURCE_TYPES = new Set(['source-data', 'source-figure', 'semantic-model', 'illustrative'])
const GENERIC_VISUAL_RENDERERS = new Set(['bars', 'curve', 'dots', 'layers'])
const FILL_ROLES = new Set(['none', 'paper', 'surface', 'neutral', 'muted', 'primary', 'accent', 'risk'])
const THEME_KEYS = Object.freeze([
  'paper', 'surface', 'ink', 'muted', 'primary', 'primarySoft', 'accent', 'accentSoft', 'risk', 'riskSoft', 'rule', 'leader',
])
const NUMERIC_OPTION_KEYS = Object.freeze([
  'canvasWidth', 'canvasHeight', 'titleFontSize', 'titleFontWeight', 'titleLineHeight',
  'noteFontSize', 'noteFontWeight', 'noteLineHeight', 'calloutFontSize', 'calloutFontWeight',
  'calloutLineHeight', 'outerPadding', 'itemGap', 'itemPadding', 'slotGap', 'textPaddingX',
  'textPaddingY', 'minVisualHeight', 'minVisualWidth', 'laneTitleRatio', 'laneNoteRatio',
  'annotationSideRatio', 'annotationRailRatio', 'calloutGap', 'calloutPaddingX',
  'calloutPaddingY', 'minCalloutHeight', 'geometryTolerance',
])
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/iu
const SAFE_FONT_FAMILY = /^[\p{L}\p{N}\s,"'._-]+$/u

export const DEFAULT_FIGURE_OPTIONS = Object.freeze({
  canvasWidth: 1200,
  canvasHeight: 620,
  fontFamily: 'Inter, "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  titleFontSize: 22,
  titleFontWeight: 720,
  titleLineHeight: 28,
  noteFontSize: 16,
  noteFontWeight: 500,
  noteLineHeight: 22,
  calloutFontSize: 18,
  calloutFontWeight: 620,
  calloutLineHeight: 24,
  outerPadding: 28,
  itemGap: 24,
  itemPadding: 18,
  slotGap: 14,
  textPaddingX: 8,
  textPaddingY: 9,
  minVisualHeight: 100,
  minVisualWidth: 140,
  laneTitleRatio: 0.23,
  laneNoteRatio: 0.24,
  annotationSideRatio: 0.2,
  annotationRailRatio: 0.18,
  calloutGap: 14,
  calloutPaddingX: 14,
  calloutPaddingY: 10,
  minCalloutHeight: 48,
  geometryTolerance: 0.75,
  throwOnLintError: true,
})

export const DEFAULT_FIGURE_THEME = Object.freeze({
  paper: '#F7F4EC',
  surface: '#FFFEFA',
  ink: '#151A19',
  muted: '#68716C',
  primary: '#2F6DA3',
  primarySoft: '#E9F0F6',
  accent: '#169B85',
  accentSoft: '#E2F2ED',
  risk: '#D75B32',
  riskSoft: '#F9E8E1',
  rule: '#CFC9BC',
  leader: '#68716C',
})

export class FigureSpecError extends Error {
  constructor(code, message, path) {
    super(path ? `${message} (${path})` : message)
    this.name = 'FigureSpecError'
    this.code = code
    this.path = path
  }
}

export class FigureLayoutError extends Error {
  constructor(report, scene) {
    super(`Figure layout failed lint:\n${report.errors.map((item) => `- ${item.message}`).join('\n')}`)
    this.name = 'FigureLayoutError'
    this.code = 'figure-layout-failed'
    this.report = report
    this.scene = scene
  }
}

function optionsWithDefaults(options = {}) {
  const merged = { ...DEFAULT_FIGURE_OPTIONS, ...options }
  for (const key of NUMERIC_OPTION_KEYS) {
    if (!finiteNumber(merged[key]) || merged[key] < 0) {
      throw new FigureSpecError('invalid-layout-option', `${key} must be a finite non-negative number`, key)
    }
  }
  if (merged.canvasWidth <= 0 || merged.canvasHeight <= 0
    || merged.titleFontSize <= 0 || merged.noteFontSize <= 0 || merged.calloutFontSize <= 0
    || merged.titleLineHeight <= 0 || merged.noteLineHeight <= 0 || merged.calloutLineHeight <= 0) {
    throw new FigureSpecError('invalid-layout-option', 'canvas and type dimensions must be positive')
  }
  if (typeof merged.fontFamily !== 'string' || !SAFE_FONT_FAMILY.test(merged.fontFamily)) {
    throw new FigureSpecError('invalid-layout-option', 'fontFamily contains unsupported CSS characters', 'fontFamily')
  }
  return merged
}

function themeWithDefaults(theme = {}) {
  const merged = { ...DEFAULT_FIGURE_THEME, ...theme }
  for (const key of THEME_KEYS) {
    if (typeof merged[key] !== 'string' || !HEX_COLOR.test(merged[key])) {
      throw new FigureSpecError('invalid-layout-option', `theme.${key} must be a hex color`, `theme.${key}`)
    }
  }
  return merged
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function positiveNumber(value, fallback) {
  return finiteNumber(value) && value > 0 ? value : fallback
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function requiredId(value, path) {
  const id = typeof value === 'string' ? value.trim() : ''
  if (!id) throw new FigureSpecError('empty-content', 'id must be a non-empty string', path)
  return id
}

function assertNoManualGeometry(value, path) {
  for (const key of ['x', 'y', 'width', 'height', 'position', 'offset', 'padding', 'gap']) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      throw new FigureSpecError(
        'manual-geometry-forbidden',
        `FigureSpec cannot set ${key}; the selected recipe owns geometry`,
        `${path}.${key}`,
      )
    }
  }
}

function normalizeContent(value, path) {
  if (typeof value === 'string') {
    if (!value.trim()) throw new FigureSpecError('empty-content', 'text must not be empty', path)
    return { type: 'text', text: value }
  }
  if (plainObject(value) && value.type === 'text') {
    const text = typeof value.text === 'string' ? value.text : ''
    if (!text.trim()) throw new FigureSpecError('empty-content', 'text must not be empty', `${path}.text`)
    return { type: 'text', text }
  }
  if (plainObject(value) && value.type === 'formula') {
    const tex = typeof value.tex === 'string' ? value.tex.trim() : ''
    if (!tex) throw new FigureSpecError('empty-content', 'formula tex must not be empty', `${path}.tex`)
    return { type: 'formula', tex }
  }
  throw new FigureSpecError('empty-content', 'content must be text or { type: "formula", tex }', path)
}

function normalizeVisual(value, path) {
  if (!plainObject(value)) {
    throw new FigureSpecError('unknown-visual-renderer', 'visual must be an object', path)
  }
  assertNoManualGeometry(value, path)
  const renderer = typeof value.renderer === 'string' ? value.renderer.trim() : ''
  if (!renderer) {
    throw new FigureSpecError('unknown-visual-renderer', 'visual.renderer is required', `${path}.renderer`)
  }
  if (GENERIC_VISUAL_RENDERERS.has(renderer)) {
    throw new FigureSpecError(
      'generic-visual-renderer-forbidden',
      `${renderer} is a stock glyph, not a semantic visual renderer; name and implement the subject-specific visual instead`,
      `${path}.renderer`,
    )
  }
  const purpose = typeof value.purpose === 'string' ? value.purpose.trim() : ''
  if (!purpose) {
    throw new FigureSpecError(
      'missing-visual-purpose',
      'visual.purpose must state what the carrier itself helps the audience understand',
      `${path}.purpose`,
    )
  }
  if (!plainObject(value.geometrySource)) {
    throw new FigureSpecError(
      'missing-geometry-source',
      'visual.geometrySource must identify where the rendered geometry comes from',
      `${path}.geometrySource`,
    )
  }
  const geometrySourceType = String(value.geometrySource.type || '')
  if (!GEOMETRY_SOURCE_TYPES.has(geometrySourceType)) {
    throw new FigureSpecError(
      'missing-geometry-source',
      `visual.geometrySource.type must be one of ${[...GEOMETRY_SOURCE_TYPES].join(', ')}`,
      `${path}.geometrySource.type`,
    )
  }
  const geometrySourceRef = typeof value.geometrySource.ref === 'string'
    ? value.geometrySource.ref.trim()
    : ''
  if (!geometrySourceRef) {
    throw new FigureSpecError(
      'missing-geometry-source',
      'visual.geometrySource.ref must identify the dataset, source figure, semantic model, or illustration decision',
      `${path}.geometrySource.ref`,
    )
  }
  let data = value.data ?? {}
  try {
    data = structuredClone(data)
    JSON.stringify(data)
  }
  catch {
    throw new FigureSpecError('invalid-layout-option', 'visual.data must be JSON-safe', `${path}.data`)
  }
  return {
    renderer,
    purpose,
    geometrySource: { type: geometrySourceType, ref: geometrySourceRef },
    data,
  }
}

function rejectDuplicateIds(items, path) {
  const ids = new Set()
  for (const [index, item] of items.entries()) {
    if (ids.has(item.id)) {
      throw new FigureSpecError('duplicate-id', `duplicate id ${item.id}`, `${path}[${index}].id`)
    }
    ids.add(item.id)
  }
}

/** Normalize the deliberately small Agent-facing FigureSpec. */
export function normalizeFigureSpec(input) {
  if (!plainObject(input)) {
    throw new FigureSpecError('invalid-kind', 'FigureSpec must be an object')
  }
  assertNoManualGeometry(input, 'figure')
  if (input.schemaVersion != null && input.schemaVersion !== 1) {
    throw new FigureSpecError('invalid-layout-option', 'schemaVersion must be 1', 'schemaVersion')
  }
  const id = requiredId(input.id ?? 'figure', 'id')
  const kind = String(input.kind || '')
  if (!FIGURE_KINDS.has(kind)) {
    throw new FigureSpecError('invalid-kind', `kind must be one of ${[...FIGURE_KINDS].join(', ')}`, 'kind')
  }

  if (kind === 'graph') {
    if (!plainObject(input.diagram)) {
      throw new FigureSpecError('invalid-layout-option', 'graph.diagram must be a DiagramSpec object', 'diagram')
    }
    return { schemaVersion: 1, id, kind, diagram: structuredClone(input.diagram) }
  }

  if (!plainObject(input.layout)) {
    throw new FigureSpecError('invalid-layout-option', 'layout must be an object', 'layout')
  }
  assertNoManualGeometry(input.layout, 'layout')

  if (kind === 'comparison') {
    const type = String(input.layout.type || '')
    if (!COMPARISON_LAYOUTS.has(type)) {
      throw new FigureSpecError('invalid-layout-option', 'comparison layout must be grid or lanes', 'layout.type')
    }
    const layout = type === 'grid'
      ? { type, columns: Number(input.layout.columns) }
      : { type }
    if (type === 'grid' && (!Number.isInteger(layout.columns) || layout.columns < 1 || layout.columns > 4)) {
      throw new FigureSpecError('invalid-layout-option', 'grid columns must be an integer from 1 to 4', 'layout.columns')
    }
    if (!Array.isArray(input.items) || input.items.length < 2 || input.items.length > 8) {
      throw new FigureSpecError('invalid-layout-option', 'comparison items must contain 2 to 8 entries', 'items')
    }
    const items = input.items.map((item, index) => {
      const path = `items[${index}]`
      if (!plainObject(item)) throw new FigureSpecError('invalid-layout-option', 'item must be an object', path)
      assertNoManualGeometry(item, path)
      const tone = String(item.tone || 'neutral')
      if (!TONES.has(tone)) {
        throw new FigureSpecError('invalid-layout-option', `unknown tone ${tone}`, `${path}.tone`)
      }
      return {
        id: requiredId(item.id, `${path}.id`),
        title: normalizeContent(item.title, `${path}.title`),
        ...(item.note == null ? {} : { note: normalizeContent(item.note, `${path}.note`) }),
        visual: normalizeVisual(item.visual, `${path}.visual`),
        tone,
      }
    })
    rejectDuplicateIds(items, 'items')
    return { schemaVersion: 1, id, kind, layout, items }
  }

  if (input.layout.type !== 'callout-frame') {
    throw new FigureSpecError('invalid-layout-option', 'annotated layout must be callout-frame', 'layout.type')
  }
  if (!Array.isArray(input.callouts) || input.callouts.length < 1 || input.callouts.length > 8) {
    throw new FigureSpecError('invalid-layout-option', 'annotated callouts must contain 1 to 8 entries', 'callouts')
  }
  const callouts = input.callouts.map((callout, index) => {
    const path = `callouts[${index}]`
    if (!plainObject(callout)) throw new FigureSpecError('invalid-layout-option', 'callout must be an object', path)
    assertNoManualGeometry(callout, path)
    const side = String(callout.side || 'auto').toLowerCase()
    if (!CALLOUT_SIDES.has(side)) {
      throw new FigureSpecError('invalid-layout-option', `unknown callout side ${side}`, `${path}.side`)
    }
    return {
      id: requiredId(callout.id, `${path}.id`),
      target: requiredId(callout.target, `${path}.target`),
      label: normalizeContent(callout.label, `${path}.label`),
      side,
    }
  })
  rejectDuplicateIds(callouts, 'callouts')
  return {
    schemaVersion: 1,
    id,
    kind,
    layout: { type: 'callout-frame' },
    visual: normalizeVisual(input.visual, 'visual'),
    callouts,
  }
}

function comparisonMetrics(spec, options) {
  const width = positiveNumber(options.canvasWidth, DEFAULT_FIGURE_OPTIONS.canvasWidth)
  const height = positiveNumber(options.canvasHeight, DEFAULT_FIGURE_OPTIONS.canvasHeight)
  const innerWidth = width - options.outerPadding * 2
  if (spec.layout.type === 'grid') {
    const columns = Math.min(spec.layout.columns, spec.items.length)
    const rows = Math.ceil(spec.items.length / columns)
    const itemWidth = (innerWidth - options.itemGap * (columns - 1)) / columns
    const itemHeight = (height - options.outerPadding * 2 - options.itemGap * (rows - 1)) / rows
    return { columns, rows, itemWidth, itemHeight, textWidth: itemWidth - options.itemPadding * 2 }
  }
  const itemHeight = (height - options.outerPadding * 2 - options.itemGap * (spec.items.length - 1))
    / spec.items.length
  const itemWidth = innerWidth
  const usable = itemWidth - options.itemPadding * 2 - options.slotGap * 2
  return {
    columns: 1,
    rows: spec.items.length,
    itemWidth,
    itemHeight,
    titleWidth: usable * options.laneTitleRatio,
    noteWidth: usable * options.laneNoteRatio,
  }
}

function annotatedVisualBox(options) {
  const sideWidth = options.canvasWidth * options.annotationSideRatio
  const railHeight = options.canvasHeight * options.annotationRailRatio
  return {
    x: sideWidth + options.slotGap,
    y: railHeight + options.slotGap,
    width: options.canvasWidth - (sideWidth + options.slotGap) * 2,
    height: options.canvasHeight - (railHeight + options.slotGap) * 2,
  }
}

function calloutSideLookup(spec, resolved, visualBox) {
  const anchorById = new Map(resolved.anchors.map((anchor) => [anchor.id, anchor]))
  return Object.fromEntries(spec.callouts.map((callout) => {
    const anchor = anchorById.get(callout.target)
    if (!anchor) {
      throw new FigureSpecError('unresolved-anchor', `callout ${callout.id} targets missing anchor ${callout.target}`)
    }
    assertCalloutSideMatchesAnchor(callout, anchor, visualBox)
    return [callout.id, callout.side === 'auto' ? sideFromAnchor(anchor, visualBox) : callout.side]
  }))
}

/** Collect text measurement requests after the recipe has established available widths. */
export function collectFigureText(input, userOptions = {}) {
  const spec = normalizeFigureSpec(input)
  const options = optionsWithDefaults(userOptions)
  if (spec.kind === 'graph') return []
  if (spec.kind === 'comparison') {
    const metrics = comparisonMetrics(spec, options)
    return spec.items.flatMap((item) => [
      {
        key: `item:${item.id}:title`,
        content: item.title,
        maxWidth: Math.max(1, (spec.layout.type === 'grid' ? metrics.textWidth : metrics.titleWidth) - options.textPaddingX * 2),
        fontSize: options.titleFontSize,
        fontWeight: options.titleFontWeight,
        lineHeight: options.titleLineHeight,
      },
      ...(item.note ? [{
        key: `item:${item.id}:note`,
        content: item.note,
        maxWidth: Math.max(1, (spec.layout.type === 'grid' ? metrics.textWidth : metrics.noteWidth) - options.textPaddingX * 2),
        fontSize: options.noteFontSize,
        fontWeight: options.noteFontWeight,
        lineHeight: options.noteLineHeight,
      }] : []),
    ])
  }
  const visualBox = annotatedVisualBox(options)
  const sideById = Object.fromEntries(spec.callouts.map((callout) => [
    callout.id,
    userOptions.calloutSides?.[callout.id] ?? (callout.side === 'auto' ? 'east' : callout.side),
  ]))
  const counts = { north: 0, east: 0, south: 0, west: 0 }
  for (const side of Object.values(sideById)) counts[side] += 1
  const sideWidth = options.canvasWidth * options.annotationSideRatio - options.outerPadding - options.slotGap
  return spec.callouts.map((callout) => ({
    key: `callout:${callout.id}:label`,
    content: callout.label,
    maxWidth: Math.max(1, (() => {
      const side = sideById[callout.id]
      if (side === 'north' || side === 'south') {
        const count = counts[side]
        return (visualBox.width - options.calloutGap * (count - 1)) / count - options.calloutPaddingX * 2
      }
      return sideWidth - options.calloutPaddingX * 2
    })()),
    fontSize: options.calloutFontSize,
    fontWeight: options.calloutFontWeight,
    lineHeight: options.calloutLineHeight,
  }))
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeXml(value = '') {
  return escapeHtml(value).replaceAll('&#39;', '&apos;')
}

function dependencyRoots(options) {
  const roots = [
    options.dependencyRoot,
    ...(process.env.NODE_PATH ? process.env.NODE_PATH.split(delimiter) : []),
    process.cwd(),
  ].filter(Boolean)
  return [...new Set(roots.map((root) => resolve(root)))]
}

async function importDependency(specifier, options) {
  const failures = []
  try {
    return await import(specifier)
  }
  catch (error) {
    failures.push(error)
  }
  for (const root of dependencyRoots(options)) {
    const projectRoot = basename(root) === 'node_modules' ? dirname(root) : root
    try {
      const localRequire = createRequire(resolve(projectRoot, 'package.json'))
      return await import(pathToFileURL(localRequire.resolve(specifier)).href)
    }
    catch (error) {
      failures.push(error)
    }
  }
  const error = new Error(`Unable to load ${specifier}. Install it in the deck or pass dependencyRoot.`)
  error.code = 'missing-figure-dependency'
  error.cause = failures.at(-1)
  throw error
}

async function renderContent(content, options) {
  if (content.type === 'text') return escapeHtml(content.text).replaceAll('\n', '<br>')
  if (options.renderFormula) return options.renderFormula(content.tex)
  const katexModule = await importDependency('katex', options)
  const katex = katexModule.default ?? katexModule
  if (typeof katex.renderToString !== 'function') throw new Error('katex did not expose renderToString')
  return katex.renderToString(content.tex, {
    displayMode: false,
    output: 'htmlAndMathml',
    strict: 'error',
    throwOnError: true,
    trust: false,
  })
}

async function renderContentMap(requests, options) {
  return Object.fromEntries(await Promise.all(requests.map(async (request) => [
    request.key,
    await renderContent(request.content, options),
  ])))
}

async function measureRequestsInChromium(requests, htmlByKey, options) {
  const playwright = await importDependency('playwright-chromium', options)
  if (!playwright.chromium) throw new Error('playwright-chromium did not expose chromium')
  const browser = await playwright.chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: options.canvasWidth, height: options.canvasHeight } })
  try {
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>')
    if (typeof options.measurementCss === 'string' && options.measurementCss.trim()) {
      await page.addStyleTag({ content: options.measurementCss })
    }
    return await page.evaluate(async ({ source, html, fontFamily }) => {
      const output = {}
      const elements = []
      for (const item of source) {
        const element = document.createElement('div')
        Object.assign(element.style, {
          position: 'absolute',
          left: '-100000px',
          top: '0',
          boxSizing: 'border-box',
          width: `${item.maxWidth}px`,
          overflowWrap: 'anywhere',
          textWrap: 'balance',
          whiteSpace: 'normal',
          fontFamily,
          fontSize: `${item.fontSize}px`,
          fontWeight: String(item.fontWeight),
          lineHeight: `${item.lineHeight}px`,
        })
        element.innerHTML = html[item.key]
        document.body.append(element)
        elements.push([item, element])
      }
      await document.fonts.ready
      for (const [item, element] of elements) {
        const rect = element.getBoundingClientRect()
        output[item.key] = {
          width: Math.ceil(rect.width * 100) / 100,
          height: Math.ceil(Math.max(rect.height, element.scrollHeight) * 100) / 100,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
          fontsStatus: document.fonts.status,
          html: html[item.key],
        }
        element.remove()
      }
      return output
    }, { source: requests, html: htmlByKey, fontFamily: options.fontFamily })
  }
  finally {
    await page.close()
    await browser.close()
  }
}

export async function measureFigureText(input, userOptions = {}) {
  const spec = normalizeFigureSpec(input)
  const options = optionsWithDefaults(userOptions)
  let measurementOptions = options
  if (spec.kind === 'annotated' && !userOptions.calloutSides) {
    const visualBox = annotatedVisualBox(options)
    const visualRenderers = { ...BUILTIN_VISUAL_RENDERERS, ...(userOptions.visualRenderers ?? {}) }
    const resolved = await resolveVisual(spec.visual, visualBox, visualRenderers, options, themeWithDefaults(userOptions.theme))
    measurementOptions = { ...options, calloutSides: calloutSideLookup(spec, resolved, visualBox) }
  }
  const requests = collectFigureText(spec, measurementOptions)
  const htmlByKey = await renderContentMap(requests, options)
  if (options.measureText) {
    const measured = await options.measureText(requests, spec, options)
    return Object.fromEntries(requests.map((request) => [
      request.key,
      { ...measured[request.key], html: htmlByKey[request.key] },
    ]))
  }
  return measureRequestsInChromium(requests, htmlByKey, options)
}

function rectWithin(inner, outer, tolerance = 0.01) {
  return inner.x >= outer.x - tolerance
    && inner.y >= outer.y - tolerance
    && inner.x + inner.width <= outer.x + outer.width + tolerance
    && inner.y + inner.height <= outer.y + outer.height + tolerance
}

function rectsOverlap(left, right, tolerance = 0.01) {
  return Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x) > tolerance
    && Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y) > tolerance
}

function pointInsideRect(point, rect, tolerance = 0.01) {
  return point.x >= rect.x - tolerance
    && point.x <= rect.x + rect.width + tolerance
    && point.y >= rect.y - tolerance
    && point.y <= rect.y + rect.height + tolerance
}

function segmentIntersectsRect(start, end, rect) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  let minimum = 0
  let maximum = 1
  for (const [direction, distance] of [
    [-dx, start.x - rect.x],
    [dx, rect.x + rect.width - start.x],
    [-dy, start.y - rect.y],
    [dy, rect.y + rect.height - start.y],
  ]) {
    if (Math.abs(direction) < 1e-9) {
      if (distance < 0) return false
      continue
    }
    const ratio = distance / direction
    if (direction < 0) minimum = Math.max(minimum, ratio)
    else maximum = Math.min(maximum, ratio)
    if (minimum > maximum) return false
  }
  return true
}

function markStrokeInset(mark) {
  if (!mark.stroke || mark.stroke === 'none') return 0
  if (mark.strokeWidth == null) return 0.5
  if (!finiteNumber(mark.strokeWidth) || mark.strokeWidth < 0) {
    throw new FigureSpecError('visual-resolve-failed', 'visual mark strokeWidth must be a finite non-negative number')
  }
  return mark.strokeWidth / 2
}

function numericMarkValues(mark, names, index) {
  for (const name of names) {
    if (!finiteNumber(mark[name])) {
      throw new FigureSpecError('visual-resolve-failed', `visual mark ${index}.${name} must be finite`)
    }
  }
}

function expandedBounds(bounds, inset) {
  return {
    x: bounds.x - inset,
    y: bounds.y - inset,
    width: bounds.width + inset * 2,
    height: bounds.height + inset * 2,
  }
}

function normalizeMark(mark, index) {
  if (!plainObject(mark) || !MARK_TYPES.has(mark.type)) {
    throw new FigureSpecError('visual-resolve-failed', `visual mark ${index} has an unsupported type`)
  }
  if (mark.type === 'text' || Object.prototype.hasOwnProperty.call(mark, 'text')) {
    throw new FigureSpecError('svg-text-forbidden', 'Figure visual recipes cannot emit SVG text')
  }
  for (const role of ['fill', 'stroke']) {
    if (mark[role] != null && !FILL_ROLES.has(mark[role])) {
      throw new FigureSpecError('visual-resolve-failed', `visual mark ${index} has unknown ${role} role`)
    }
  }
  const normalized = structuredClone(mark)
  if (normalized.id != null) normalized.id = requiredId(normalized.id, `visual.marks[${index}].id`)
  const strokeInset = markStrokeInset(normalized)
  let geometryBounds
  let paintBounds
  if (normalized.type === 'rect') {
    numericMarkValues(normalized, ['x', 'y', 'width', 'height'], index)
    if (normalized.width < 0 || normalized.height < 0) {
      throw new FigureSpecError('visual-resolve-failed', `visual mark ${index} has negative rect dimensions`)
    }
    geometryBounds = { x: normalized.x, y: normalized.y, width: normalized.width, height: normalized.height }
    paintBounds = expandedBounds(geometryBounds, strokeInset)
  }
  else if (normalized.type === 'circle') {
    numericMarkValues(normalized, ['cx', 'cy', 'r'], index)
    if (normalized.r < 0) throw new FigureSpecError('visual-resolve-failed', `visual mark ${index} has a negative radius`)
    geometryBounds = { x: normalized.cx - normalized.r, y: normalized.cy - normalized.r, width: normalized.r * 2, height: normalized.r * 2 }
    paintBounds = expandedBounds(geometryBounds, strokeInset)
  }
  else if (normalized.type === 'ellipse') {
    numericMarkValues(normalized, ['cx', 'cy', 'rx', 'ry'], index)
    if (normalized.rx < 0 || normalized.ry < 0) throw new FigureSpecError('visual-resolve-failed', `visual mark ${index} has a negative radius`)
    geometryBounds = { x: normalized.cx - normalized.rx, y: normalized.cy - normalized.ry, width: normalized.rx * 2, height: normalized.ry * 2 }
    paintBounds = expandedBounds(geometryBounds, strokeInset)
  }
  else if (normalized.type === 'line') {
    numericMarkValues(normalized, ['x1', 'y1', 'x2', 'y2'], index)
    geometryBounds = {
      x: Math.min(normalized.x1, normalized.x2),
      y: Math.min(normalized.y1, normalized.y2),
      width: Math.abs(normalized.x2 - normalized.x1),
      height: Math.abs(normalized.y2 - normalized.y1),
    }
    paintBounds = expandedBounds(geometryBounds, strokeInset)
  }
  else if (normalized.type === 'path') {
    if (typeof normalized.d !== 'string' || !normalized.d.trim()) {
      throw new FigureSpecError('visual-resolve-failed', `visual mark ${index}.d must be a non-empty path`)
    }
    const bounds = normalized.bounds
    if (!plainObject(bounds) || ![bounds.x, bounds.y, bounds.width, bounds.height].every(finiteNumber)
      || bounds.width < 0 || bounds.height < 0) {
      throw new FigureSpecError('visual-resolve-failed', `visual path mark ${index} must declare finite painted bounds`)
    }
    geometryBounds = { ...bounds }
    paintBounds = { ...bounds }
  }
  else {
    if (!Array.isArray(normalized.points) || normalized.points.length < (normalized.type === 'polygon' ? 3 : 2)) {
      throw new FigureSpecError('visual-resolve-failed', `visual mark ${index}.points must be a coordinate array`)
    }
    const points = normalized.points.map((point, pointIndex) => {
      const x = Array.isArray(point) ? point[0] : point?.x
      const y = Array.isArray(point) ? point[1] : point?.y
      if (!finiteNumber(x) || !finiteNumber(y)) {
        throw new FigureSpecError('visual-resolve-failed', `visual mark ${index}.points[${pointIndex}] is invalid`)
      }
      return { x, y }
    })
    normalized.points = points
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    geometryBounds = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
    paintBounds = expandedBounds(geometryBounds, strokeInset)
  }
  normalized.geometryBounds = geometryBounds
  normalized.paintBounds = paintBounds
  return normalized
}

function resolvedVisual(result, box, rendererName) {
  if (!plainObject(result) || !Array.isArray(result.marks) || !Array.isArray(result.anchors)) {
    throw new FigureSpecError(
      'visual-resolve-failed',
      `visual renderer ${rendererName} must return marks and anchors arrays`,
    )
  }
  const marks = result.marks.map(normalizeMark)
  const markById = new Map()
  for (const mark of marks.filter((candidate) => candidate.id)) {
    if (markById.has(mark.id)) {
      throw new FigureSpecError('visual-resolve-failed', `visual renderer ${rendererName} returned duplicate mark id ${mark.id}`)
    }
    markById.set(mark.id, mark)
  }
  const anchors = result.anchors.map((anchor, index) => {
    if (!plainObject(anchor) || !anchor.id || !finiteNumber(anchor.x) || !finiteNumber(anchor.y)) {
      throw new FigureSpecError('visual-resolve-failed', `visual anchor ${index} is invalid`)
    }
    return {
      id: String(anchor.id),
      x: anchor.x,
      y: anchor.y,
      ...(anchor.markId != null ? { markId: requiredId(anchor.markId, `visual.anchors[${index}].markId`) } : {}),
      ...(plainObject(anchor.normal) && finiteNumber(anchor.normal.x) && finiteNumber(anchor.normal.y)
        ? { normal: { x: anchor.normal.x, y: anchor.normal.y } }
        : {}),
    }
  })
  rejectDuplicateIds(anchors, 'visual.anchors')
  for (const anchor of anchors) {
    if (!pointInsideRect(anchor, box, 0.01)) {
      throw new FigureSpecError('visual-resolve-failed', `visual renderer ${rendererName} placed anchor ${anchor.id} outside its slot`)
    }
    if (anchor.markId) {
      const mark = markById.get(anchor.markId)
      if (!mark) {
        throw new FigureSpecError('visual-resolve-failed', `visual anchor ${anchor.id} references missing mark ${anchor.markId}`)
      }
      if (!pointInsideRect(anchor, mark.paintBounds, 0.01)) {
        throw new FigureSpecError('visual-resolve-failed', `visual anchor ${anchor.id} does not land on mark ${anchor.markId}`)
      }
      if (anchor.normal) {
        const horizontal = Math.abs(anchor.normal.x) >= Math.abs(anchor.normal.y)
        const edge = horizontal
          ? anchor.normal.x >= 0 ? mark.geometryBounds.x + mark.geometryBounds.width : mark.geometryBounds.x
          : anchor.normal.y >= 0 ? mark.geometryBounds.y + mark.geometryBounds.height : mark.geometryBounds.y
        const coordinate = horizontal ? anchor.x : anchor.y
        if (Math.abs(coordinate - edge) > 0.01) {
          throw new FigureSpecError('visual-resolve-failed', `visual anchor ${anchor.id} does not match the ${horizontal ? 'horizontal' : 'vertical'} edge of mark ${anchor.markId}`)
        }
      }
    }
  }
  for (const [index, mark] of marks.entries()) {
    if (!rectWithin(mark.paintBounds, box, 0.01)) {
      throw new FigureSpecError('visual-resolve-failed', `visual renderer ${rendererName} painted mark ${index} outside its slot`)
    }
  }
  const bounds = marks.length > 0
    ? {
        x: Math.min(...marks.map((mark) => mark.paintBounds.x)),
        y: Math.min(...marks.map((mark) => mark.paintBounds.y)),
        width: Math.max(...marks.map((mark) => mark.paintBounds.x + mark.paintBounds.width)) - Math.min(...marks.map((mark) => mark.paintBounds.x)),
        height: Math.max(...marks.map((mark) => mark.paintBounds.y + mark.paintBounds.height)) - Math.min(...marks.map((mark) => mark.paintBounds.y)),
      }
    : { x: box.x, y: box.y, width: 0, height: 0 }
  return { marks, anchors, bounds }
}

// FigureSpec intentionally ships no Agent-facing stock glyph library. The
// recipe owns outer layout; the author supplies a subject-specific renderer.
// Keeping bars/curve/dots/layers out of this registry prevents unrelated
// claims from becoming interchangeable silhouettes merely because they share
// the same comparison slots.
export const BUILTIN_VISUAL_RENDERERS = Object.freeze({})

async function resolveVisual(reference, box, visualRenderers, options, theme) {
  const renderer = visualRenderers[reference.renderer]
  if (!renderer) {
    throw new FigureSpecError('unknown-visual-renderer', `unknown visual renderer ${reference.renderer}`)
  }
  try {
    const data = renderer.validate ? await renderer.validate(structuredClone(reference.data)) : reference.data
    const result = await renderer.resolve({
      data,
      box: { ...box },
      semantic: {
        purpose: reference.purpose,
        geometrySource: { ...reference.geometrySource },
      },
      theme,
      loadDependency: (specifier) => importDependency(specifier, options),
    })
    return resolvedVisual(result, box, reference.renderer)
  }
  catch (error) {
    if (error instanceof FigureSpecError) throw error
    const wrapped = new FigureSpecError(
      'visual-resolve-failed',
      `visual renderer ${reference.renderer} failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    wrapped.cause = error
    throw wrapped
  }
}

function requiredMeasurement(measurements, key) {
  const measurement = measurements[key]
  if (!measurement || !finiteNumber(measurement.width) || !finiteNumber(measurement.height)) {
    throw new FigureSpecError('missing-measurement', `missing text measurement ${key}`)
  }
  if (measurement.fontsStatus && measurement.fontsStatus !== 'loaded') {
    throw new FigureSpecError('font-not-ready', `fonts were not ready for ${key}`)
  }
  return measurement
}

function textRecord(id, slot, content, measurement) {
  return {
    id,
    slotId: slot.id,
    content,
    measurement: { ...measurement },
    html: content.type === 'text'
      ? escapeHtml(content.text).replaceAll('\n', '<br>')
      : measurement.html ?? '',
  }
}

function comparisonSlots(spec, measurements, options) {
  const metrics = comparisonMetrics(spec, options)
  const slots = []
  const texts = []
  const itemBoxes = []
  const titleMeasurements = spec.items.map((item) => requiredMeasurement(measurements, `item:${item.id}:title`))
  const noteMeasurements = spec.items.filter((item) => item.note)
    .map((item) => requiredMeasurement(measurements, `item:${item.id}:note`))

  if (spec.layout.type === 'grid') {
    const titleHeight = Math.max(...titleMeasurements.map((item) => item.height)) + options.textPaddingY * 2
    const noteHeight = noteMeasurements.length > 0
      ? Math.max(...noteMeasurements.map((item) => item.height)) + options.textPaddingY * 2
      : 0
    spec.items.forEach((item, index) => {
      const column = index % metrics.columns
      const row = Math.floor(index / metrics.columns)
      const itemBox = {
        x: options.outerPadding + column * (metrics.itemWidth + options.itemGap),
        y: options.outerPadding + row * (metrics.itemHeight + options.itemGap),
        width: metrics.itemWidth,
        height: metrics.itemHeight,
      }
      itemBoxes.push({ id: item.id, ...itemBox })
      const innerX = itemBox.x + options.itemPadding
      const innerWidth = itemBox.width - options.itemPadding * 2
      const title = { id: `${item.id}:title`, role: 'title', ownerId: item.id, peerSet: 'comparison:title', x: innerX, y: itemBox.y + options.itemPadding, width: innerWidth, height: titleHeight }
      const note = { id: `${item.id}:note`, role: 'note', ownerId: item.id, peerSet: 'comparison:note', x: innerX, y: itemBox.y + itemBox.height - options.itemPadding - noteHeight, width: innerWidth, height: noteHeight }
      const visualY = title.y + title.height + options.slotGap
      const visualBottom = noteHeight > 0 ? note.y - options.slotGap : itemBox.y + itemBox.height - options.itemPadding
      const visual = { id: `${item.id}:visual`, role: 'visual', ownerId: item.id, peerSet: 'comparison:visual', x: innerX, y: visualY, width: innerWidth, height: visualBottom - visualY }
      slots.push({ id: `${item.id}:item`, role: 'item', ownerId: item.id, peerSet: 'comparison:item', ...itemBox }, title, visual, note)
      texts.push(textRecord(`${item.id}:title`, title, item.title, titleMeasurements[index]))
      if (item.note) texts.push(textRecord(`${item.id}:note`, note, item.note, requiredMeasurement(measurements, `item:${item.id}:note`)))
    })
  }
  else {
    const innerWidth = metrics.itemWidth - options.itemPadding * 2
    const titleWidth = metrics.titleWidth
    const noteWidth = noteMeasurements.length > 0 ? metrics.noteWidth : 0
    const visualWidth = innerWidth - titleWidth - noteWidth - options.slotGap * (noteWidth > 0 ? 2 : 1)
    spec.items.forEach((item, index) => {
      const itemBox = {
        x: options.outerPadding,
        y: options.outerPadding + index * (metrics.itemHeight + options.itemGap),
        width: metrics.itemWidth,
        height: metrics.itemHeight,
      }
      itemBoxes.push({ id: item.id, ...itemBox })
      const innerY = itemBox.y + options.itemPadding
      const innerHeight = itemBox.height - options.itemPadding * 2
      const title = { id: `${item.id}:title`, role: 'title', ownerId: item.id, peerSet: 'comparison:title', x: itemBox.x + options.itemPadding, y: innerY, width: titleWidth, height: innerHeight }
      const visual = { id: `${item.id}:visual`, role: 'visual', ownerId: item.id, peerSet: 'comparison:visual', x: title.x + title.width + options.slotGap, y: innerY, width: visualWidth, height: innerHeight }
      const note = { id: `${item.id}:note`, role: 'note', ownerId: item.id, peerSet: 'comparison:note', x: visual.x + visual.width + (noteWidth > 0 ? options.slotGap : 0), y: innerY, width: noteWidth, height: innerHeight }
      slots.push({ id: `${item.id}:item`, role: 'item', ownerId: item.id, peerSet: 'comparison:item', ...itemBox }, title, visual, note)
      texts.push(textRecord(`${item.id}:title`, title, item.title, titleMeasurements[index]))
      if (item.note) texts.push(textRecord(`${item.id}:note`, note, item.note, requiredMeasurement(measurements, `item:${item.id}:note`)))
    })
  }
  return { slots, texts, itemBoxes }
}

function sideFromAnchor(anchor, visualBox) {
  if (anchor.normal) {
    if (Math.abs(anchor.normal.x) >= Math.abs(anchor.normal.y)) return anchor.normal.x >= 0 ? 'east' : 'west'
    return anchor.normal.y >= 0 ? 'south' : 'north'
  }
  const distances = [
    ['west', Math.abs(anchor.x - visualBox.x)],
    ['east', Math.abs(visualBox.x + visualBox.width - anchor.x)],
    ['north', Math.abs(anchor.y - visualBox.y)],
    ['south', Math.abs(visualBox.y + visualBox.height - anchor.y)],
  ]
  return distances.sort((left, right) => left[1] - right[1])[0][0]
}

function assertCalloutSideMatchesAnchor(callout, anchor, visualBox) {
  if (callout.side === 'auto') return
  const naturalSide = sideFromAnchor(anchor, visualBox)
  if (naturalSide !== callout.side) {
    throw new FigureSpecError(
      'invalid-layout-option',
      `callout ${callout.id} requests ${callout.side}, but anchor ${callout.target} attaches on ${naturalSide}`,
      `callouts.${callout.id}.side`,
    )
  }
}

function allocateCalloutBoxes(side, entries, visualBox, options) {
  if (entries.length === 0) return []
  const horizontal = side === 'north' || side === 'south'
  const available = horizontal ? visualBox.width : visualBox.height
  const size = (available - options.calloutGap * (entries.length - 1)) / entries.length
  const sideWidth = options.canvasWidth * options.annotationSideRatio - options.outerPadding - options.slotGap
  const railHeight = options.canvasHeight * options.annotationRailRatio - options.outerPadding - options.slotGap
  return entries.map((entry, index) => {
    const box = horizontal
      ? {
          x: visualBox.x + index * (size + options.calloutGap),
          y: side === 'north' ? options.outerPadding : options.canvasHeight - options.outerPadding - railHeight,
          width: size,
          height: railHeight,
        }
      : {
          x: side === 'west' ? options.outerPadding : options.canvasWidth - options.outerPadding - sideWidth,
          y: visualBox.y + index * (size + options.calloutGap),
          width: sideWidth,
          height: size,
        }
    return { ...entry, box }
  })
}

function leaderPoints(side, box, target) {
  if (side === 'west' || side === 'east') {
    const start = { x: side === 'west' ? box.x + box.width : box.x, y: box.y + box.height / 2 }
    const elbowX = (start.x + target.x) / 2
    return [start, { x: elbowX, y: start.y }, { x: elbowX, y: target.y }, target]
  }
  const start = { x: box.x + box.width / 2, y: side === 'north' ? box.y + box.height : box.y }
  const elbowY = (start.y + target.y) / 2
  return [start, { x: start.x, y: elbowY }, { x: target.x, y: elbowY }, target]
}

/** Resolve FigureSpec into internal SceneIR. Coordinates exist only after this step. */
export async function resolveFigureScene(input, userOptions = {}) {
  const spec = normalizeFigureSpec(input)
  const options = optionsWithDefaults(userOptions)
  const theme = themeWithDefaults(userOptions.theme)
  const canvas = { x: 0, y: 0, width: options.canvasWidth, height: options.canvasHeight }

  if (spec.kind === 'graph') {
    const graphCompiler = userOptions.graphCompiler ?? (async (diagram, graphOptions) => {
      const { compileDiagram } = await import('./diagram-engine.mjs')
      return compileDiagram(diagram, graphOptions)
    })
    let result
    try {
      const graphOptions = {
        ...options,
        ...(userOptions.graphOptions ?? {}),
        canvasWidth: options.canvasWidth,
        canvasHeight: options.canvasHeight,
      }
      result = await graphCompiler(spec.diagram, graphOptions)
      const graphCanvas = result?.geometry?.canvas
      if (!plainObject(graphCanvas) || !finiteNumber(graphCanvas.width) || !finiteNumber(graphCanvas.height)
        || Math.abs(graphCanvas.width - canvas.width) > options.geometryTolerance
        || Math.abs(graphCanvas.height - canvas.height) > options.geometryTolerance) {
        throw new Error(`DiagramSpec canvas ${graphCanvas?.width}×${graphCanvas?.height} does not match FigureSpec canvas ${canvas.width}×${canvas.height}`)
      }
    }
    catch (error) {
      const wrapped = new FigureSpecError('graph-compile-failed', `DiagramSpec compilation failed: ${error instanceof Error ? error.message : String(error)}`)
      wrapped.cause = error
      throw wrapped
    }
    return {
      schemaVersion: 1,
      id: spec.id,
      kind: spec.kind,
      canvas,
      layout: { recipe: 'diagram', authority: 'ELK_CANDIDATE' },
      slots: [],
      texts: [],
      visuals: [],
      leaders: [],
      graph: {
        spec: result.spec,
        geometry: result.geometry,
        geometryJson: result.geometryJson,
        lint: result.lint,
        svg: result.svg,
      },
    }
  }

  const measurements = userOptions.measurements ?? {}
  const visualRenderers = { ...BUILTIN_VISUAL_RENDERERS, ...(userOptions.visualRenderers ?? {}) }
  if (spec.kind === 'comparison') {
    const { slots, texts, itemBoxes } = comparisonSlots(spec, measurements, options)
    const visuals = []
    for (const item of spec.items) {
      const slot = slots.find((candidate) => candidate.id === `${item.id}:visual`)
      if (slot.width < options.minVisualWidth || slot.height < options.minVisualHeight) {
        visuals.push({
          id: item.id,
          slotId: slot.id,
          renderer: item.visual.renderer,
          purpose: item.visual.purpose,
          geometrySource: { ...item.visual.geometrySource },
          marks: [],
          anchors: [],
          bounds: { ...slot, width: 0, height: 0 },
        })
        continue
      }
      const resolved = await resolveVisual(item.visual, slot, visualRenderers, options, theme)
      visuals.push({
        id: item.id,
        slotId: slot.id,
        renderer: item.visual.renderer,
        purpose: item.visual.purpose,
        geometrySource: { ...item.visual.geometrySource },
        ...resolved,
      })
    }
    return {
      schemaVersion: 1,
      id: spec.id,
      kind: spec.kind,
      canvas,
      layout: { recipe: spec.layout.type === 'grid' ? 'comparison-grid' : 'comparison-lanes', authority: 'SLIDEBLOCKS_RECIPE' },
      slots,
      texts,
      visuals,
      leaders: [],
      items: itemBoxes.map((box) => ({ ...box, tone: spec.items.find((item) => item.id === box.id).tone })),
    }
  }

  const visualBox = annotatedVisualBox(options)
  const resolved = await resolveVisual(spec.visual, visualBox, visualRenderers, options, theme)
  const anchorById = new Map(resolved.anchors.map((anchor) => [anchor.id, anchor]))
  const grouped = { north: [], east: [], south: [], west: [] }
  for (const callout of spec.callouts) {
    const anchor = anchorById.get(callout.target)
    if (!anchor) {
      throw new FigureSpecError('unresolved-anchor', `callout ${callout.id} targets missing anchor ${callout.target}`)
    }
    if (!anchor.markId) {
      throw new FigureSpecError('visual-resolve-failed', `callout ${callout.id} targets anchor ${callout.target} that is not bound to a semantic mark`)
    }
    assertCalloutSideMatchesAnchor(callout, anchor, visualBox)
    const side = callout.side === 'auto' ? sideFromAnchor(anchor, visualBox) : callout.side
    grouped[side].push({ callout, anchor, side })
  }
  for (const [side, entries] of Object.entries(grouped)) {
    entries.sort((left, right) => side === 'north' || side === 'south'
      ? left.anchor.x - right.anchor.x
      : left.anchor.y - right.anchor.y)
  }

  const allocations = Object.entries(grouped).flatMap(([side, entries]) => allocateCalloutBoxes(side, entries, visualBox, options))
  const slots = [{ id: 'visual', role: 'visual', ownerId: spec.id, x: visualBox.x, y: visualBox.y, width: visualBox.width, height: visualBox.height }]
  const texts = []
  const leaders = []
  for (const allocation of allocations) {
    const { callout, anchor, side, box } = allocation
    const slot = { id: `${callout.id}:callout`, role: 'callout', ownerId: callout.id, peerSet: `callout:${side}`, ...box }
    slots.push(slot)
    texts.push(textRecord(callout.id, slot, callout.label, requiredMeasurement(measurements, `callout:${callout.id}:label`)))
    leaders.push({ id: callout.id, ownerId: callout.id, target: callout.target, side, points: leaderPoints(side, box, anchor) })
  }
  return {
    schemaVersion: 1,
    id: spec.id,
    kind: spec.kind,
    canvas,
    layout: { recipe: 'callout-frame', authority: 'SLIDEBLOCKS_RECIPE' },
    slots,
    texts,
    visuals: [{
      id: spec.id,
      slotId: 'visual',
      renderer: spec.visual.renderer,
      purpose: spec.visual.purpose,
      geometrySource: { ...spec.visual.geometrySource },
      ...resolved,
    }],
    leaders,
  }
}

function slotById(scene) {
  return new Map(scene.slots.map((slot) => [slot.id, slot]))
}

function peerSignature(slot, itemById) {
  const owner = itemById.get(slot.ownerId)
  return {
    width: slot.width,
    height: slot.height,
    relativeX: owner ? slot.x - owner.x : slot.x,
    relativeY: owner ? slot.y - owner.y : slot.y,
  }
}

/** Deterministic SceneIR gate. Final DOM still needs the workbench verifier and full-slide review. */
export function lintFigureScene(input, scene, userOptions = {}) {
  const spec = normalizeFigureSpec(input)
  const options = optionsWithDefaults(userOptions)
  const errors = []
  const warnings = []
  if (spec.kind === 'graph') {
    const graphLint = scene?.graph?.lint
    if (!graphLint?.ok) {
      errors.push({ code: 'graph-compile-failed', message: 'compiled DiagramSpec did not pass its geometry lint' })
    }
    return { ok: errors.length === 0, errors, warnings, stats: { kind: spec.kind } }
  }
  if (!scene || !plainObject(scene.canvas)) {
    return { ok: false, errors: [{ code: 'missing-scene', message: 'SceneIR is missing' }], warnings, stats: {} }
  }
  const slots = Array.isArray(scene.slots) ? scene.slots : []
  const slotsById = slotById(scene)
  const itemById = new Map((scene.items ?? []).map((item) => [item.id, item]))
  const expectedVisuals = spec.kind === 'comparison'
    ? new Map(spec.items.map((item) => [item.id, item.visual]))
    : new Map([[spec.id, spec.visual]])
  for (const slot of slots) {
    if (![slot.x, slot.y, slot.width, slot.height].every(finiteNumber) || slot.width < 0 || slot.height < 0) {
      errors.push({ code: 'invalid-slot', slotId: slot.id, message: `slot ${slot.id} has invalid geometry` })
    }
    else if (!rectWithin(slot, scene.canvas, options.geometryTolerance)) {
      errors.push({ code: 'slot-out-of-bounds', slotId: slot.id, message: `slot ${slot.id} leaves the figure canvas` })
    }
    if (slot.role === 'visual'
      && (slot.width < options.minVisualWidth || slot.height < options.minVisualHeight)) {
      errors.push({
        code: 'layout-capacity',
        slotId: slot.id,
        message: `visual slot ${slot.id} is smaller than the recipe minimum ${options.minVisualWidth}×${options.minVisualHeight}`,
      })
    }
    if (slot.role === 'callout' && slot.height < options.minCalloutHeight) {
      errors.push({
        code: 'callout-capacity',
        slotId: slot.id,
        message: `callout slot ${slot.id} is shorter than the recipe minimum ${options.minCalloutHeight}`,
      })
    }
  }

  const peerGroups = new Map()
  for (const slot of slots.filter((candidate) => candidate.peerSet)) {
    const group = peerGroups.get(slot.peerSet) ?? []
    group.push(slot)
    peerGroups.set(slot.peerSet, group)
  }
  for (const [peerSet, peers] of peerGroups) {
    const reference = peerSignature(peers[0], itemById)
    for (const peer of peers.slice(1)) {
      const signature = peerSignature(peer, itemById)
      if (Math.abs(signature.width - reference.width) > options.geometryTolerance
        || Math.abs(signature.height - reference.height) > options.geometryTolerance) {
        errors.push({ code: 'peer-slot-size-drift', peerSet, message: `peer slots in ${peerSet} do not share one size` })
      }
      if (spec.kind === 'comparison'
        && (Math.abs(signature.relativeX - reference.relativeX) > options.geometryTolerance
          || Math.abs(signature.relativeY - reference.relativeY) > options.geometryTolerance)) {
        errors.push({ code: 'peer-slot-baseline-drift', peerSet, message: `peer slots in ${peerSet} do not share one item-relative baseline` })
      }
    }
  }

  for (const text of scene.texts ?? []) {
    const slot = slotsById.get(text.slotId)
    if (!slot) {
      errors.push({ code: 'missing-slot', textId: text.id, message: `text ${text.id} has no owning slot` })
      continue
    }
    const insetX = slot.role === 'callout' ? options.calloutPaddingX : options.textPaddingX
    const insetY = slot.role === 'callout' ? options.calloutPaddingY : options.textPaddingY
    const capacityWidth = slot.width - insetX * 2
    const capacityHeight = slot.height - insetY * 2
    if (text.measurement.width > capacityWidth + options.geometryTolerance
      || (finiteNumber(text.measurement.scrollWidth) && text.measurement.scrollWidth > capacityWidth + options.geometryTolerance)
      || text.measurement.height > capacityHeight + options.geometryTolerance) {
      errors.push({
        code: slot.role === 'callout' ? 'callout-capacity' : 'layout-capacity',
        textId: text.id,
        message: `text ${text.id} needs ${text.measurement.width.toFixed(1)}×${text.measurement.height.toFixed(1)} but its ${slot.role} slot provides ${Math.max(0, capacityWidth).toFixed(1)}×${Math.max(0, capacityHeight).toFixed(1)}`,
      })
    }
  }

  for (const visual of scene.visuals ?? []) {
    const slot = slotsById.get(visual.slotId)
    if (!slot || !rectWithin(visual.bounds, slot, options.geometryTolerance)) {
      errors.push({ code: 'visual-out-of-slot', visualId: visual.id, message: `visual ${visual.id} leaves its visual slot` })
    }
    const expected = expectedVisuals.get(visual.id)
    if (!expected
      || visual.purpose !== expected.purpose
      || visual.geometrySource?.type !== expected.geometrySource.type
      || visual.geometrySource?.ref !== expected.geometrySource.ref) {
      errors.push({
        code: 'semantic-visual-metadata-mismatch',
        visualId: visual.id,
        message: `visual ${visual.id} lost or changed its purpose or geometry source`,
      })
    }
  }

  const calloutSlots = slots.filter((slot) => slot.role === 'callout')
  for (let leftIndex = 0; leftIndex < calloutSlots.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < calloutSlots.length; rightIndex += 1) {
      if (rectsOverlap(calloutSlots[leftIndex], calloutSlots[rightIndex], options.geometryTolerance)) {
        errors.push({ code: 'callout-overlap', message: `callouts ${calloutSlots[leftIndex].ownerId} and ${calloutSlots[rightIndex].ownerId} overlap` })
      }
    }
  }
  const anchorById = new Map((scene.visuals ?? []).flatMap((visual) => visual.anchors.map((anchor) => [anchor.id, anchor])))
  for (const leader of scene.leaders ?? []) {
    const target = anchorById.get(leader.target)
    const end = leader.points?.at(-1)
    if (!target || !end || Math.hypot(target.x - end.x, target.y - end.y) > options.geometryTolerance) {
      errors.push({ code: 'leader-target-miss', leaderId: leader.id, message: `leader ${leader.id} misses anchor ${leader.target}` })
    }
    for (const slot of calloutSlots.filter((candidate) => candidate.ownerId !== leader.ownerId)) {
      for (let index = 0; index < (leader.points?.length ?? 0) - 1; index += 1) {
        if (segmentIntersectsRect(leader.points[index], leader.points[index + 1], slot)) {
          errors.push({ code: 'leader-crosses-text', leaderId: leader.id, slotId: slot.id, message: `leader ${leader.id} crosses callout ${slot.ownerId}` })
          break
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      kind: spec.kind,
      slots: slots.length,
      texts: scene.texts?.length ?? 0,
      visuals: scene.visuals?.length ?? 0,
      leaders: scene.leaders?.length ?? 0,
    },
  }
}

function xmlAttributes(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}="${escapeXml(value)}"`)
    .join(' ')
}

function colorForRole(role, theme, { fill = false } = {}) {
  if (!role || role === 'none') return 'none'
  if (role === 'paper') return theme.paper
  if (role === 'surface') return theme.surface
  if (role === 'neutral') return fill ? theme.surface : theme.muted
  if (role === 'muted') return theme.muted
  if (fill && role === 'primary') return theme.primarySoft
  if (fill && role === 'accent') return theme.accentSoft
  if (fill && role === 'risk') return theme.riskSoft
  return theme[role] ?? theme.ink
}

function renderMark(mark, theme) {
  const common = {
    fill: colorForRole(mark.fill ?? 'none', theme, { fill: true }),
    'fill-opacity': mark.fillOpacity,
    stroke: colorForRole(mark.stroke ?? 'none', theme),
    'stroke-width': mark.strokeWidth,
    'stroke-dasharray': Array.isArray(mark.dash) ? mark.dash.join(' ') : undefined,
    'vector-effect': 'non-scaling-stroke',
  }
  if (mark.type === 'rect') return `<rect ${xmlAttributes({ x: mark.x, y: mark.y, width: mark.width, height: mark.height, rx: mark.rx, ry: mark.ry, ...common })}/>`
  if (mark.type === 'circle') return `<circle ${xmlAttributes({ cx: mark.cx, cy: mark.cy, r: mark.r, ...common })}/>`
  if (mark.type === 'ellipse') return `<ellipse ${xmlAttributes({ cx: mark.cx, cy: mark.cy, rx: mark.rx, ry: mark.ry, ...common })}/>`
  if (mark.type === 'line') return `<line ${xmlAttributes({ x1: mark.x1, y1: mark.y1, x2: mark.x2, y2: mark.y2, ...common })}/>`
  if (mark.type === 'path') return `<path ${xmlAttributes({ d: mark.d, ...common })}/>`
  const points = Array.isArray(mark.points)
    ? mark.points.map((point) => Array.isArray(point) ? point.join(',') : `${point.x},${point.y}`).join(' ')
    : mark.points
  return `<${mark.type} ${xmlAttributes({ points, ...common })}/>`
}

function boxStyle(box) {
  return `position:absolute;box-sizing:border-box;left:${box.x}px;top:${box.y}px;width:${box.width}px;height:${box.height}px;min-width:0;min-height:0;`
}

function textStyle(slot, options, theme) {
  const callout = slot.role === 'callout'
  const title = slot.role === 'title'
  return [
    boxStyle(slot),
    'display:flex',
    'align-items:center',
    title && slot.peerSet === 'comparison:title' ? 'justify-content:center' : 'justify-content:flex-start',
    `padding:${callout ? options.calloutPaddingY : options.textPaddingY}px ${callout ? options.calloutPaddingX : options.textPaddingX}px`,
    `font-family:${options.fontFamily}`,
    `font-size:${callout ? options.calloutFontSize : title ? options.titleFontSize : options.noteFontSize}px`,
    `font-weight:${callout ? options.calloutFontWeight : title ? options.titleFontWeight : options.noteFontWeight}`,
    `line-height:${callout ? options.calloutLineHeight : title ? options.titleLineHeight : options.noteLineHeight}px`,
    `color:${title || callout ? theme.ink : theme.muted}`,
    `text-align:${title && slot.peerSet === 'comparison:title' ? 'center' : 'left'}`,
    'overflow-wrap:anywhere',
    'text-wrap:balance',
    'overflow:visible',
    ...(callout ? [`background:${theme.surface}`, `border:1.5px solid ${theme.rule}`, 'border-radius:12px'] : []),
  ].filter(Boolean).join(';')
}

/** Render one resolved figure. Comparison and annotated text stays in HTML. */
export function renderFigureMarkup(input, scene, userOptions = {}) {
  const spec = normalizeFigureSpec(input)
  const options = optionsWithDefaults(userOptions)
  const theme = themeWithDefaults(userOptions.theme)
  const role = userOptions.final === true ? 'final' : 'resolved'
  if (spec.kind === 'graph') {
    const markup = `<div class="sb-figure sb-figure--graph" data-slideblocks-figure="${role}" data-slideblocks-render-route="figure:graph" data-layout-role="${role}" data-figure-kind="graph" style="position:relative;box-sizing:border-box;width:${scene.canvas.width}px;height:${scene.canvas.height}px;overflow:visible">${scene.graph.svg}</div>`
    return { svgLayer: scene.graph.svg, htmlLayer: '', markup }
  }
  const visualMarkup = (scene.visuals ?? []).map((visual) => [
    `<g data-visual-id="${escapeXml(visual.id)}" data-slot-id="${escapeXml(visual.slotId)}" data-visual-renderer="${escapeXml(visual.renderer)}" data-visual-purpose="${escapeXml(visual.purpose)}" data-geometry-source-type="${escapeXml(visual.geometrySource.type)}" data-geometry-source-ref="${escapeXml(visual.geometrySource.ref)}">`,
    ...visual.marks.map((mark) => renderMark(mark, theme)),
    ...visual.anchors.map((anchor) => `<circle data-figure-anchor="${escapeXml(anchor.id)}" cx="${anchor.x}" cy="${anchor.y}" r="0.01" fill="none" stroke="none"/>`),
    '</g>',
  ].join('')).join('')
  const leaderMarkup = (scene.leaders ?? []).map((leader) => {
    const d = leader.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    const target = leader.points.at(-1)
    return `<path ${xmlAttributes({
      'data-leader-id': leader.id,
      'data-target-anchor': leader.target,
      'data-target-x': target.x,
      'data-target-y': target.y,
      d,
      fill: 'none',
      stroke: theme.leader,
      'stroke-width': 2,
      'vector-effect': 'non-scaling-stroke',
    })}/>`
  }).join('')
  const slotsById = slotById(scene)
  const visualSlotMarkup = (scene.visuals ?? []).map((visual) => {
    const slot = slotsById.get(visual.slotId)
    return `<rect ${xmlAttributes({
      'data-figure-visual-slot': slot.id,
      'data-figure-peer-set': slot.peerSet,
      'data-owner-id': slot.ownerId,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      fill: 'none',
      stroke: 'none',
      'pointer-events': 'none',
    })}/>`
  }).join('')
  const svgLayer = `<svg class="sb-figure__svg" aria-hidden="true" width="${scene.canvas.width}" height="${scene.canvas.height}" viewBox="0 0 ${scene.canvas.width} ${scene.canvas.height}" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">${visualSlotMarkup}${leaderMarkup}${visualMarkup}</svg>`
  const itemMarkup = (scene.items ?? []).map((item) => `<div data-figure-item="${escapeHtml(item.id)}" data-figure-peer-set="comparison:item" data-owner-id="${escapeHtml(item.id)}" data-tone="${escapeHtml(item.tone)}" style="${escapeHtml(boxStyle(item))}"></div>`).join('')
  const textMarkup = (scene.texts ?? []).map((text) => {
    const slot = slotsById.get(text.slotId)
    return `<div class="sb-figure__text sb-figure__text--${escapeHtml(slot.role)}" data-figure-text-id="${escapeHtml(text.id)}" data-figure-role="${escapeHtml(slot.role)}" data-figure-peer-set="${escapeHtml(slot.peerSet ?? '')}" data-owner-id="${escapeHtml(slot.ownerId)}" data-slot-id="${escapeHtml(slot.id)}" style="${escapeHtml(textStyle(slot, options, theme))}"><span style="display:block;min-width:0;width:100%">${text.html}</span></div>`
  }).join('')
  const htmlLayer = `<div class="sb-figure__html" style="position:absolute;inset:0">${itemMarkup}${textMarkup}</div>`
  const markup = `<div class="sb-figure sb-figure--${spec.kind}" data-slideblocks-figure="${role}" data-slideblocks-render-route="figure:${spec.kind}" data-layout-role="${role}" data-figure-kind="${spec.kind}" style="position:relative;box-sizing:border-box;width:${scene.canvas.width}px;height:${scene.canvas.height}px;overflow:visible">${svgLayer}${htmlLayer}</div>`
  return { svgLayer, htmlLayer, markup }
}

export async function compileFigure(input, userOptions = {}) {
  const spec = normalizeFigureSpec(input)
  const options = optionsWithDefaults(userOptions)
  let measurements = {}
  if (spec.kind !== 'graph') {
    if (userOptions.measurements) {
      const requests = collectFigureText(spec, options)
      const htmlByKey = await renderContentMap(requests, options)
      measurements = Object.fromEntries(requests.map((request) => [
        request.key,
        { ...userOptions.measurements[request.key], html: htmlByKey[request.key] },
      ]))
    }
    else {
      measurements = await measureFigureText(spec, options)
    }
  }
  const scene = await resolveFigureScene(spec, { ...userOptions, ...options, measurements })
  const lint = lintFigureScene(spec, scene, options)
  if (!lint.ok && options.throwOnLintError) throw new FigureLayoutError(lint, scene)
  const rendered = renderFigureMarkup(spec, scene, { ...options, final: lint.ok })
  return {
    spec,
    measurements,
    scene,
    lint,
    ...rendered,
    geometryJson: JSON.stringify(scene, null, 2),
  }
}
