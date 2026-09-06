import { createRequire } from 'node:module'
import { basename, delimiter, dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assertOfflineSvgBody } from './icon-library.mjs'

const DIRECTION_ALIASES = new Map([
  ['RIGHT', 'RIGHT'],
  ['LR', 'RIGHT'],
  ['LEFT', 'LEFT'],
  ['RL', 'LEFT'],
  ['DOWN', 'DOWN'],
  ['TB', 'DOWN'],
  ['UP', 'UP'],
  ['BT', 'UP'],
])

const SIDE_ALIASES = new Map([
  ['NORTH', 'NORTH'],
  ['TOP', 'NORTH'],
  ['N', 'NORTH'],
  ['EAST', 'EAST'],
  ['RIGHT', 'EAST'],
  ['E', 'EAST'],
  ['SOUTH', 'SOUTH'],
  ['BOTTOM', 'SOUTH'],
  ['S', 'SOUTH'],
  ['WEST', 'WEST'],
  ['LEFT', 'WEST'],
  ['W', 'WEST'],
])

export const DEFAULT_DIAGRAM_OPTIONS = Object.freeze({
  canvasWidth: 1440,
  canvasHeight: 720,
  canvasPadding: 48,
  maxScale: 1.5,
  fontFamily: 'Inter, "PingFang SC", "Hiragino Sans GB", Arial, sans-serif',
  nodeFontSize: 22,
  nodeFontWeight: 650,
  nodeLineHeight: 28,
  nodePaddingX: 28,
  nodePaddingY: 18,
  nodeMinWidth: 152,
  nodeMinHeight: 68,
  nodeMaxTextWidth: null,
  iconSize: 28,
  iconGap: 12,
  edgeFontSize: 16,
  edgeFontWeight: 560,
  edgeLineHeight: 20,
  edgePaddingX: 8,
  edgePaddingY: 5,
  edgeMaxTextWidth: null,
  nodeSpacing: 42,
  layerSpacing: 96,
  edgeSpacing: 18,
  edgeNodeSpacing: 42,
  betweenLayerEdgeSpacing: 22,
  cycleBreakingStrategy: 'GREEDY_MODEL_ORDER',
  portSize: 8,
  endpointTolerance: 1.5,
  labelAnchorTolerance: 0.75,
  labelClearance: 5,
  throwOnLintError: true,
})

const PALETTE = Object.freeze({
  paper: '#F4F1E8',
  white: '#FFFEFA',
  graphite: '#171B1A',
  muted: '#5D6661',
  green: '#24A66A',
  greenFill: '#E7F5EC',
  orange: '#E46A36',
  orangeFill: '#FCEBE4',
  blue: '#2F6DA3',
  blueFill: '#EEF3F7',
  neutralFill: '#F8F8F4',
})

export class GeometryLintError extends Error {
  constructor(report, geometry) {
    super(`Diagram geometry failed lint:\n${report.errors.map((item) => `- ${item.message}`).join('\n')}`)
    this.name = 'GeometryLintError'
    this.report = report
    this.geometry = geometry
  }
}

function mergedOptions(options = {}) {
  const merged = { ...DEFAULT_DIAGRAM_OPTIONS, ...options }
  for (const key of ['nodeMaxTextWidth', 'edgeMaxTextWidth']) {
    if (merged[key] != null && (!finiteNumber(merged[key]) || merged[key] <= 0)) {
      throw new RangeError(`${key} must be a positive finite number when provided`)
    }
  }
  if (!finiteNumber(merged.iconSize) || merged.iconSize <= 0
    || !finiteNumber(merged.iconGap) || merged.iconGap < 0) {
    throw new RangeError('iconSize must be positive and iconGap must be non-negative')
  }
  if (merged.idPrefix != null && (typeof merged.idPrefix !== 'string'
    || !/^[a-z][a-z0-9_-]*$/iu.test(merged.idPrefix))) {
    throw new TypeError('idPrefix must start with an ASCII letter and contain only letters, digits, _ or -')
  }
  return merged
}

function resolvedIcon(node, options) {
  if (!node.icon) return null
  const icon = options.icons instanceof Map
    ? options.icons.get(node.icon)
    : Object.hasOwn(options.icons || {}, node.icon) ? options.icons[node.icon] : undefined
  if (!icon || typeof icon.body !== 'string' || !icon.body.trim()
    || !finiteNumber(icon.width) || icon.width <= 0 || !finiteNumber(icon.height) || icon.height <= 0) {
    throw new TypeError(`Unknown or invalid icon ${node.icon} on node ${node.id}; provide a resolved SVG body, width, and height in options.icons`)
  }
  assertOfflineSvgBody(icon.body)
  return icon
}

function nodeContentMetrics(node, measurement, options) {
  const icon = resolvedIcon(node, options)
  const iconSlotWidth = icon ? options.iconSize + options.iconGap : 0
  return {
    width: measurement.width + iconSlotWidth,
    height: Math.max(measurement.height, icon ? options.iconSize : 0),
    iconSlotWidth,
  }
}

function normalizeDirection(value) {
  return DIRECTION_ALIASES.get(String(value || 'RIGHT').toUpperCase())
}

function normalizeSide(value) {
  return SIDE_ALIASES.get(String(value || '').toUpperCase())
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function measuredLineHeight(measurement, text, fallback) {
  const sourceLines = Math.max(1, String(text ?? '').split('\n').length)
  const measuredLines = finiteNumber(measurement?.lines) && measurement.lines > 0
    ? measurement.lines
    : sourceLines
  return finiteNumber(measurement?.height) && measurement.height > 0
    ? measurement.height / measuredLines
    : fallback
}

function requiredTextPadding(role, measurement, text, options) {
  const lineHeight = measuredLineHeight(
    measurement,
    text,
    role === 'node' ? options.nodeLineHeight : options.edgeLineHeight,
  )
  return role === 'node'
    ? {
        x: Math.max(options.nodePaddingX, 16, lineHeight * 0.6),
        y: Math.max(options.nodePaddingY, 10, lineHeight * 0.35),
      }
    : {
        x: Math.max(options.edgePaddingX, 8, lineHeight * 0.4),
        y: Math.max(options.edgePaddingY, 5, lineHeight * 0.2),
      }
}

function pointIsFinite(point) {
  return point && finiteNumber(point.x) && finiteNumber(point.y)
}

function clonePoint(point) {
  return { x: point.x, y: point.y }
}

function pointsEqual(left, right, tolerance = 0.01) {
  return pointIsFinite(left)
    && pointIsFinite(right)
    && Math.hypot(left.x - right.x, left.y - right.y) <= tolerance
}

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function elkPortId(nodeId, portId) {
  return `port:${encodeURIComponent(nodeId)}:${encodeURIComponent(portId)}`
}

function edgeLabelId(edgeId, labelId) {
  return `edge-label:${encodeURIComponent(edgeId)}:${encodeURIComponent(labelId)}`
}

function normalizeOffset(value, prefix, errors) {
  if (value == null) return null
  if (finiteNumber(value)) return value
  if (value && typeof value === 'object' && !Array.isArray(value)
    && finiteNumber(value.x) && finiteNumber(value.y)) {
    return { x: value.x, y: value.y }
  }
  errors.push(`${prefix}.offset must be a finite number or { x, y }`)
  return null
}

function normalizeEdgeLabels(edge, edgeIndex, errors) {
  const prefix = `edges[${edgeIndex}]`
  const hasLegacyLabel = Object.prototype.hasOwnProperty.call(edge, 'label')
  const hasLabels = Object.prototype.hasOwnProperty.call(edge, 'labels')
  if (hasLegacyLabel && hasLabels) {
    errors.push(`${prefix} cannot contain both legacy label and labels`)
    return []
  }

  let rawLabels
  if (hasLegacyLabel) {
    if (typeof edge.label !== 'string' || edge.label.trim() === '') {
      errors.push(`${prefix}.label must be a non-empty string`)
      return []
    }
    rawLabels = [{ id: 'label-0', text: edge.label, position: { distance: 0.5 } }]
  } else if (hasLabels) {
    if (!Array.isArray(edge.labels)) {
      errors.push(`${prefix}.labels must be an array`)
      return []
    }
    rawLabels = edge.labels
  } else {
    rawLabels = []
  }

  const labelIds = new Set()
  return rawLabels.map((label, labelIndex) => {
    const labelPrefix = `${prefix}.labels[${labelIndex}]`
    if (!label || typeof label !== 'object' || Array.isArray(label)) {
      errors.push(`${labelPrefix} must be an object`)
      return { id: `invalid-label-${labelIndex}`, text: '', position: { distance: 0.5, offset: null } }
    }
    const id = String(label.id || '')
    const text = typeof label.text === 'string' ? label.text : ''
    if (!id) errors.push(`${labelPrefix}.id is required`)
    if (labelIds.has(id)) errors.push(`${labelPrefix}.id duplicates label ${id}`)
    if (!text.trim()) errors.push(`${labelPrefix}.text must be a non-empty string`)
    labelIds.add(id)

    const position = label.position
    if (position != null && (typeof position !== 'object' || Array.isArray(position))) {
      errors.push(`${labelPrefix}.position must be an object when provided`)
    }
    if (rawLabels.length > 1 && position?.distance == null) {
      errors.push(`${labelPrefix}.position.distance is required when an edge has multiple labels`)
    }
    const distance = position?.distance == null ? 0.5 : Number(position.distance)
    if (!finiteNumber(distance) || distance < 0 || distance > 1) {
      errors.push(`${labelPrefix}.position.distance must be between 0 and 1`)
    }
    return {
      id,
      text,
      position: {
        distance: finiteNumber(distance) ? distance : 0.5,
        offset: normalizeOffset(position?.offset, `${labelPrefix}.position`, errors),
      },
    }
  })
}

/** Normalize the author-facing DiagramSpec. Legacy edge.label is accepted only as input. */
export function normalizeDiagramSpec(input) {
  const errors = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Invalid DiagramSpec:\n- spec must be an object')
  }
  if (input.schemaVersion != null && input.schemaVersion !== 1) {
    errors.push(`schemaVersion must be 1; received ${input.schemaVersion}`)
  }

  const direction = normalizeDirection(input.direction)
  if (!direction) errors.push(`direction must be RIGHT, LEFT, DOWN, UP, LR, RL, TB, or BT; received ${input.direction}`)
  if (!Array.isArray(input.nodes) || input.nodes.length === 0) errors.push('nodes must be a non-empty array')
  if (!Array.isArray(input.edges)) errors.push('edges must be an array')

  const nodeIds = new Set()
  const nodes = Array.isArray(input.nodes) ? input.nodes.map((node, nodeIndex) => {
    const prefix = `nodes[${nodeIndex}]`
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      errors.push(`${prefix} must be an object`)
      return { id: `invalid-node-${nodeIndex}`, label: '', tone: 'neutral', ports: [] }
    }
    const id = String(node.id || '')
    if (!id) errors.push(`${prefix}.id is required`)
    if (nodeIds.has(id)) errors.push(`${prefix}.id duplicates node ${id}`)
    nodeIds.add(id)
    if ('x' in node || 'y' in node || 'position' in node) {
      errors.push(`${prefix} contains a manual coordinate; DiagramSpec stores semantics, not final geometry`)
    }
    if (node.icon != null && (typeof node.icon !== 'string' || !/^[a-z0-9][a-z0-9:_-]*$/iu.test(node.icon))) {
      errors.push(`${prefix}.icon must be a stable icon ID when provided`)
    }

    const portIds = new Set()
    let ports = []
    if (node.ports != null) {
      if (!Array.isArray(node.ports)) {
        errors.push(`${prefix}.ports must be an array when provided`)
      } else {
        ports = node.ports.map((port, portIndex) => {
          const portPrefix = `${prefix}.ports[${portIndex}]`
          if (!port || typeof port !== 'object' || Array.isArray(port)) {
            errors.push(`${portPrefix} must be an object`)
            return { id: `invalid-port-${portIndex}`, side: 'EAST' }
          }
          const portId = String(port.id || '')
          const side = normalizeSide(port.side)
          if (!portId) errors.push(`${portPrefix}.id is required`)
          if (portIds.has(portId)) errors.push(`${portPrefix}.id duplicates port ${portId} on node ${id}`)
          if (!side) errors.push(`${portPrefix}.side must be NORTH, EAST, SOUTH, or WEST; received ${port.side}`)
          portIds.add(portId)
          return { id: portId, side: side || 'EAST' }
        })
      }
    }
    return {
      id,
      label: String(node.label ?? id),
      tone: String(node.tone || 'neutral'),
      ...(node.icon != null ? { icon: node.icon } : {}),
      ports,
    }
  }) : []

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const edgeIds = new Set()
  const edges = Array.isArray(input.edges) ? input.edges.map((edge, edgeIndex) => {
    const prefix = `edges[${edgeIndex}]`
    if (!edge || typeof edge !== 'object' || Array.isArray(edge)) {
      errors.push(`${prefix} must be an object`)
      return { id: `invalid-edge-${edgeIndex}`, source: '', target: '', labels: [], tone: 'neutral' }
    }
    const id = String(edge.id || '')
    const source = String(edge.source || '')
    const target = String(edge.target || '')
    const sourcePort = edge.sourcePort == null ? undefined : String(edge.sourcePort)
    const targetPort = edge.targetPort == null ? undefined : String(edge.targetPort)
    if (!id) errors.push(`${prefix}.id is required`)
    if (edgeIds.has(id)) errors.push(`${prefix}.id duplicates edge ${id}`)
    edgeIds.add(id)
    if (!nodeById.has(source)) errors.push(`${prefix}.source references missing node ${source}`)
    if (!nodeById.has(target)) errors.push(`${prefix}.target references missing node ${target}`)
    if (sourcePort && !nodeById.get(source)?.ports.some((port) => port.id === sourcePort)) {
      errors.push(`${prefix}.sourcePort ${sourcePort} is not declared on node ${source}`)
    }
    if (targetPort && !nodeById.get(target)?.ports.some((port) => port.id === targetPort)) {
      errors.push(`${prefix}.targetPort ${targetPort} is not declared on node ${target}`)
    }
    return {
      id,
      source,
      target,
      sourcePort,
      targetPort,
      labels: normalizeEdgeLabels(edge, edgeIndex, errors),
      tone: String(edge.tone || 'neutral'),
      feedback: Boolean(edge.feedback),
      layoutPriority: Number.isFinite(Number(edge.layoutPriority))
        ? Number(edge.layoutPriority)
        : edge.feedback ? 0 : 1000,
    }
  }) : []

  if (errors.length > 0) throw new TypeError(`Invalid DiagramSpec:\n- ${errors.join('\n- ')}`)
  return { schemaVersion: 1, id: String(input.id || 'diagram'), direction, nodes, edges }
}

export function validateDiagramSpec(input) {
  return normalizeDiagramSpec(input)
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
  } catch (error) {
    failures.push(error)
  }
  for (const root of dependencyRoots(options)) {
    const projectRoot = basename(root) === 'node_modules' ? dirname(root) : root
    try {
      const localRequire = createRequire(resolve(projectRoot, 'package.json'))
      return await import(pathToFileURL(localRequire.resolve(specifier)).href)
    } catch (error) {
      failures.push(error)
    }
  }
  const error = new Error(`Unable to load ${specifier}. Install it in the deck or pass dependencyRoot.`)
  error.cause = failures.at(-1)
  throw error
}

async function measureItemsInChromium(items, options) {
  const ownBrowser = !options.browser
  let browser = options.browser
  if (!browser) {
    const playwright = await importDependency('playwright-chromium', options)
    if (!playwright.chromium) throw new Error('playwright-chromium did not expose chromium')
    browser = await playwright.chromium.launch({ headless: true })
  }
  const page = await browser.newPage({ viewport: { width: options.canvasWidth, height: options.canvasHeight } })
  try {
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>', { waitUntil: 'load' })
    if (options.fontCss) await page.addStyleTag({ content: options.fontCss })
    return await page.evaluate(async ({ measurementItems, fontFamily }) => {
      await Promise.all(measurementItems.map((item) => document.fonts.load(
        `${item.fontWeight} ${item.fontSize}px ${fontFamily}`, item.text || 'M国',
      )))
      await document.fonts.ready
      const output = {}
      for (const item of measurementItems) {
        const wrapper = document.createElement('span')
        Object.assign(wrapper.style, {
          position: 'absolute',
          left: '-100000px',
          top: '0',
          visibility: 'hidden',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: 'max-content',
          whiteSpace: 'pre',
          fontFamily,
          fontSize: `${item.fontSize}px`,
          fontWeight: String(item.fontWeight),
          lineHeight: `${item.lineHeight}px`,
        })
        document.body.append(wrapper)
        // Measure in the output's SVG text context. HTML and SVG fallback-font
        // shaping can differ on Linux even when their CSS font family agrees.
        // Keep Unicode word boundaries and split oversized tokens by grapheme.
        const lines = []
        const probeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        const probe = document.createElementNS(probeSvg.namespaceURI, 'text')
        probe.setAttribute('xml:space', 'preserve')
        probe.style.whiteSpace = 'pre'
        // Match the final SVG: pixel hinting otherwise changes widths on scale.
        probe.style.textRendering = 'geometricPrecision'
        probeSvg.append(probe)
        wrapper.append(probeSvg)
        const widthCache = new Map()
        const textWidth = (text) => {
          if (!widthCache.has(text)) {
            probe.textContent = text
            widthCache.set(text, probe.getComputedTextLength())
          }
          return widthCache.get(text)
        }
        const splitOversizedToken = (token) => {
          const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(token)]
          const fragments = []
          let currentLine = ''
          for (const segment of segments) {
            if (currentLine && textWidth(currentLine + segment.segment) > item.maxTextWidth) {
              fragments.push(currentLine)
              currentLine = ''
            }
            currentLine += segment.segment
          }
          fragments.push(currentLine)
          return fragments
        }
        for (const explicitLine of item.text.split('\n')) {
          if (!item.maxTextWidth || !explicitLine) {
            lines.push(explicitLine)
            continue
          }
          const tokens = []
          let opening = ''
          for (const { segment } of new Intl.Segmenter('zh', { granularity: 'word' }).segment(explicitLine)) {
            if (/^[（(\[【《〈「『“‘{]+$/u.test(segment)) {
              opening += segment
            } else if (/^[\s，,、。.!?！？；;：:）)\]】》〉」』”’}％%…]+$/u.test(segment) && !opening && tokens.length) {
              tokens[tokens.length - 1] += segment
            } else {
              tokens.push(opening + segment)
              opening = ''
            }
          }
          if (opening) {
            if (tokens.length) tokens[tokens.length - 1] += opening
            else tokens.push(opening)
          }
          let currentLine = ''
          for (const token of tokens) {
            if (textWidth(token) > item.maxTextWidth) {
              if (currentLine) lines.push(currentLine)
              const fragments = splitOversizedToken(token)
              lines.push(...fragments.slice(0, -1))
              currentLine = fragments.at(-1)
            } else if (currentLine && textWidth(currentLine + token) > item.maxTextWidth) {
              lines.push(currentLine)
              currentLine = token
            } else {
              currentLine += token
            }
          }
          lines.push(currentLine)
        }
        const lineWidths = lines.map(line => Math.ceil(textWidth(line) * 100) / 100)
        probeSvg.remove()
        lines.forEach((line) => {
          const element = document.createElement('span')
          element.style.display = 'block'
          element.style.height = `${item.lineHeight}px`
          element.style.lineHeight = `${item.lineHeight}px`
          element.textContent = line || '\u200b'
          wrapper.append(element)
        })
        const rect = wrapper.getBoundingClientRect()
        output[item.key] = {
          width: Math.max(0, ...lineWidths),
          height: Math.ceil(rect.height * 100) / 100,
          lineWidths,
          lines: lines.length,
          displayLines: lines,
          displayText: lines.join('\n'),
          fontsStatus: document.fonts.status,
        }
        wrapper.remove()
      }
      return output
    }, { measurementItems: items, fontFamily: options.fontFamily })
  } finally {
    await page.close()
    if (ownBrowser) await browser.close()
  }
}

export async function measureDiagramText(input, userOptions = {}) {
  const spec = normalizeDiagramSpec(input)
  const options = mergedOptions(userOptions)
  const items = [
    ...spec.nodes.map((node) => ({
      key: `node:${node.id}`,
      text: node.label,
      fontSize: options.nodeFontSize,
      fontWeight: options.nodeFontWeight,
      lineHeight: options.nodeLineHeight,
      maxTextWidth: options.nodeMaxTextWidth,
    })),
    ...spec.edges.flatMap((edge) => edge.labels.map((label) => ({
      key: `edge:${edge.id}:label:${label.id}`,
      text: label.text,
      fontSize: options.edgeFontSize,
      fontWeight: options.edgeFontWeight,
      lineHeight: options.edgeLineHeight,
      maxTextWidth: options.edgeMaxTextWidth,
    }))),
  ]
  return measureItemsInChromium(items, options)
}

export function buildElkGraph(input, measurements, userOptions = {}) {
  const spec = normalizeDiagramSpec(input)
  const options = mergedOptions(userOptions)
  return {
    id: spec.id,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': spec.direction,
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.feedbackEdges': 'true',
      'elk.layered.cycleBreaking.strategy': String(options.cycleBreakingStrategy),
      'elk.padding': '[top=24,left=24,bottom=24,right=24]',
      'elk.spacing.nodeNode': String(options.nodeSpacing),
      'elk.spacing.edgeEdge': String(options.edgeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(options.layerSpacing),
      'elk.layered.spacing.edgeNodeBetweenLayers': String(options.edgeNodeSpacing),
      'elk.layered.spacing.edgeEdgeBetweenLayers': String(options.betweenLayerEdgeSpacing),
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.randomSeed': '1',
    },
    children: spec.nodes.map((node) => {
      const measured = measurements[`node:${node.id}`]
      const padding = requiredTextPadding('node', measured, node.label, options)
      const content = nodeContentMetrics(node, measured, options)
      const child = {
        id: node.id,
        width: Math.max(options.nodeMinWidth, content.width + padding.x * 2),
        height: Math.max(options.nodeMinHeight, content.height + padding.y * 2),
      }
      if (node.ports.length > 0) {
        child.layoutOptions = { 'elk.portConstraints': 'FIXED_SIDE' }
        child.ports = node.ports.map((port) => ({
          id: elkPortId(node.id, port.id),
          width: options.portSize,
          height: options.portSize,
          layoutOptions: { 'elk.port.side': port.side },
        }))
      }
      return child
    }),
    edges: spec.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.sourcePort ? elkPortId(edge.source, edge.sourcePort) : edge.source],
      targets: [edge.targetPort ? elkPortId(edge.target, edge.targetPort) : edge.target],
      layoutOptions: { 'elk.layered.priority.direction': String(edge.layoutPriority) },
      labels: edge.labels.map((label) => {
        const measured = measurements[`edge:${edge.id}:label:${label.id}`]
        const padding = requiredTextPadding('edge-label', measured, label.text, options)
        return {
          id: edgeLabelId(edge.id, label.id),
          text: label.text,
          width: measured.width + padding.x * 2,
          height: measured.height + padding.y * 2,
          layoutOptions: { 'elk.edgeLabels.placement': 'CENTER' },
        }
      }),
    })),
  }
}

function orderedSections(sections) {
  if (sections.length < 2) return sections
  const byId = new Map(sections.map((section) => [section.id, section]))
  const ordered = []
  const visited = new Set()
  let current = sections.find((section) => !section.incomingSections?.length) || sections[0]
  while (current && !visited.has(current.id)) {
    ordered.push(current)
    visited.add(current.id)
    current = (current.outgoingSections || []).map((id) => byId.get(id)).find(Boolean)
  }
  ordered.push(...sections.filter((section) => !visited.has(section.id)))
  return ordered
}

function sectionPoints(section) {
  return [section.startPoint, ...(section.bendPoints || []), section.endPoint]
}

/** Resolve a 0..1 distance along the complete routed edge into point, tangent, and normal. */
export function pointAtEdgeDistance(sections, distance) {
  if (!Array.isArray(sections) || sections.length === 0) throw new TypeError('sections must be a non-empty array')
  if (!finiteNumber(distance) || distance < 0 || distance > 1) throw new RangeError('distance must be between 0 and 1')
  const segments = []
  for (const section of orderedSections(sections)) {
    const points = sectionPoints(section)
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index]
      const end = points[index + 1]
      if (!pointIsFinite(start) || !pointIsFinite(end)) continue
      const length = Math.hypot(end.x - start.x, end.y - start.y)
      if (length > 1e-9) segments.push({ start, end, length })
    }
  }
  if (segments.length === 0) throw new TypeError('edge has no finite non-zero segment')
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
  const targetLength = distance * totalLength
  let traversed = 0
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    if (targetLength <= traversed + segment.length || index === segments.length - 1) {
      const ratio = Math.max(0, Math.min(1, (targetLength - traversed) / segment.length))
      const dx = segment.end.x - segment.start.x
      const dy = segment.end.y - segment.start.y
      const tangent = {
        x: dx === 0 ? 0 : dx / segment.length,
        y: dy === 0 ? 0 : dy / segment.length,
      }
      return {
        point: {
          x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
          y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
        },
        tangent,
        normal: {
          x: tangent.y === 0 ? 0 : -tangent.y,
          y: tangent.x === 0 ? 0 : tangent.x,
        },
        segmentIndex: index,
        totalLength,
      }
    }
    traversed += segment.length
  }
  throw new Error('unable to resolve edge distance')
}

function offsetAnchor(anchor, offset) {
  if (finiteNumber(offset)) {
    return {
      x: anchor.point.x + anchor.normal.x * offset,
      y: anchor.point.y + anchor.normal.y * offset,
    }
  }
  return { x: anchor.point.x + offset.x, y: anchor.point.y + offset.y }
}

function resolvedLabelOffset(position, labelWidth, labelHeight, anchor, options) {
  if (position.offset != null) return position.offset
  const normalExtent = Math.abs(anchor.normal.x) * labelWidth / 2
    + Math.abs(anchor.normal.y) * labelHeight / 2
  return normalExtent + options.labelClearance + 2
}

function portAnchor(port) {
  if (port.side === 'NORTH') return { x: port.x + port.width / 2, y: port.y }
  if (port.side === 'EAST') return { x: port.x + port.width, y: port.y + port.height / 2 }
  if (port.side === 'SOUTH') return { x: port.x + port.width / 2, y: port.y + port.height }
  return { x: port.x, y: port.y + port.height / 2 }
}

function terminalSectionForTarget(sections, targetShape) {
  return sections.find((section) => section.outgoingShape === targetShape && !section.outgoingSections?.length)
    || sections.find((section) => section.outgoingShape === targetShape)
    || sections.at(-1)
}

function arrowFromSections(sections, targetShape) {
  const terminal = terminalSectionForTarget(sections, targetShape)
  if (!terminal) return null
  const points = sectionPoints(terminal).filter(pointIsFinite)
  for (let index = points.length - 1; index > 0; index -= 1) {
    const tip = points[index]
    const previous = points[index - 1]
    const dx = tip.x - previous.x
    const dy = tip.y - previous.y
    if (Math.hypot(dx, dy) > 0.01) {
      return { tip: clonePoint(tip), angle: Math.atan2(dy, dx) * 180 / Math.PI }
    }
  }
  return null
}

/** Convert raw ELK output into JSON-safe candidate geometry and place labels on routed edges. */
export function normalizeElkCandidate(input, rawLayout, measurements, userOptions = {}) {
  const spec = normalizeDiagramSpec(input)
  const options = mergedOptions(userOptions)
  const rawNodeById = new Map((rawLayout.children || []).map((node) => [node.id, node]))
  const rawEdgeById = new Map((rawLayout.edges || []).map((edge) => [edge.id, edge]))

  const nodes = spec.nodes.map((sourceNode) => {
    const rawNode = rawNodeById.get(sourceNode.id)
    if (!rawNode) return { id: sourceNode.id, label: sourceNode.label, tone: sourceNode.tone, ports: [] }
    const rawPortById = new Map((rawNode.ports || []).map((port) => [port.id, port]))
    const ports = sourceNode.ports.map((sourcePort) => {
      const rawPort = rawPortById.get(elkPortId(sourceNode.id, sourcePort.id))
      if (!rawPort) return { id: sourcePort.id, side: sourcePort.side }
      const port = {
        id: sourcePort.id,
        elkId: rawPort.id,
        side: sourcePort.side,
        x: rawNode.x + rawPort.x,
        y: rawNode.y + rawPort.y,
        width: rawPort.width,
        height: rawPort.height,
      }
      port.anchor = portAnchor(port)
      return port
    })
    return {
      id: sourceNode.id,
      label: sourceNode.label,
      tone: sourceNode.tone,
      ...(sourceNode.icon ? { icon: sourceNode.icon } : {}),
      x: rawNode.x,
      y: rawNode.y,
      width: rawNode.width,
      height: rawNode.height,
      labelBox: { ...measurements[`node:${sourceNode.id}`] },
      ports,
    }
  })

  const edges = spec.edges.map((sourceEdge) => {
    const rawEdge = rawEdgeById.get(sourceEdge.id)
    const sections = (rawEdge?.sections || []).map((section) => ({
      id: section.id,
      startPoint: clonePoint(section.startPoint),
      endPoint: clonePoint(section.endPoint),
      bendPoints: (section.bendPoints || []).map(clonePoint),
      incomingShape: section.incomingShape,
      outgoingShape: section.outgoingShape,
      ...(section.incomingSections ? { incomingSections: [...section.incomingSections] } : {}),
      ...(section.outgoingSections ? { outgoingSections: [...section.outgoingSections] } : {}),
    }))
    const rawLabelById = new Map((rawEdge?.labels || []).map((label) => [label.id, label]))
    const labels = sourceEdge.labels.map((sourceLabel) => {
      const measured = measurements[`edge:${sourceEdge.id}:label:${sourceLabel.id}`]
      const rawLabel = rawLabelById.get(edgeLabelId(sourceEdge.id, sourceLabel.id))
      const width = rawLabel?.width ?? measured.width + options.edgePaddingX * 2
      const height = rawLabel?.height ?? measured.height + options.edgePaddingY * 2
      const anchor = pointAtEdgeDistance(sections, sourceLabel.position.distance)
      const resolvedOffset = resolvedLabelOffset(sourceLabel.position, width, height, anchor, options)
      const center = offsetAnchor(anchor, resolvedOffset)
      return {
        id: sourceLabel.id,
        elkId: edgeLabelId(sourceEdge.id, sourceLabel.id),
        text: sourceLabel.text,
        position: structuredClone(sourceLabel.position),
        resolvedOffset: structuredClone(resolvedOffset),
        x: center.x - width / 2,
        y: center.y - height / 2,
        width,
        height,
        center,
        anchor: anchor.point,
        segmentIndex: anchor.segmentIndex,
        labelBox: { ...measured },
      }
    })
    const targetShape = sourceEdge.targetPort ? elkPortId(sourceEdge.target, sourceEdge.targetPort) : sourceEdge.target
    return {
      id: sourceEdge.id,
      source: sourceEdge.source,
      target: sourceEdge.target,
      sourcePort: sourceEdge.sourcePort,
      targetPort: sourceEdge.targetPort,
      labels,
      tone: sourceEdge.tone,
      feedback: sourceEdge.feedback,
      layoutPriority: sourceEdge.layoutPriority,
      sections,
      arrow: arrowFromSections(sections, targetShape),
    }
  })

  const layoutWidth = rawLayout.width || 1
  const layoutHeight = rawLayout.height || 1
  const availableWidth = Math.max(1, options.canvasWidth - options.canvasPadding * 2)
  const availableHeight = Math.max(1, options.canvasHeight - options.canvasPadding * 2)
  const scale = Math.min(options.maxScale, availableWidth / layoutWidth, availableHeight / layoutHeight)
  const renderedWidth = layoutWidth * scale
  const renderedHeight = layoutHeight * scale
  return {
    schemaVersion: 1,
    id: spec.id,
    direction: spec.direction,
    layout: {
      engine: 'elkjs',
      role: 'candidate',
      coordinateAuthority: 'ELK_CANDIDATE',
      algorithm: 'layered',
      edgeRouting: 'ORTHOGONAL',
      portConstraints: 'FIXED_SIDE',
      width: layoutWidth,
      height: layoutHeight,
    },
    rendering: {
      engine: 'slideblocks-svg',
      labelPlacement: 'edge-relative-distance-offset',
    },
    measurement: {
      engine: 'playwright-chromium-dom',
      fontsReady: Object.values(measurements).every((item) => item.fontsStatus === 'loaded'),
      fontFamily: options.fontFamily,
    },
    canvas: {
      width: options.canvasWidth,
      height: options.canvasHeight,
      padding: options.canvasPadding,
      scale,
      translateX: (options.canvasWidth - renderedWidth) / 2,
      translateY: (options.canvasHeight - renderedHeight) / 2,
    },
    nodes,
    edges,
  }
}

function pointWithinRect(point, rect, tolerance = 0) {
  return point.x >= rect.x - tolerance
    && point.x <= rect.x + rect.width + tolerance
    && point.y >= rect.y - tolerance
    && point.y <= rect.y + rect.height + tolerance
}

function pointOnNodeBoundary(point, node, tolerance) {
  if (!pointWithinRect(point, node, tolerance)) return false
  return Math.abs(point.x - node.x) <= tolerance
    || Math.abs(point.x - (node.x + node.width)) <= tolerance
    || Math.abs(point.y - node.y) <= tolerance
    || Math.abs(point.y - (node.y + node.height)) <= tolerance
}

function rectanglesOverlap(left, right, epsilon = 0.01) {
  const overlapWidth = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)
  const overlapHeight = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y)
  return overlapWidth > epsilon && overlapHeight > epsilon
}

function expandRect(rect, amount) {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  }
}

function rectangleWithinBounds(rect, bounds, tolerance = 0.01) {
  return rect.x >= bounds.x - tolerance
    && rect.y >= bounds.y - tolerance
    && rect.x + rect.width <= bounds.x + bounds.width + tolerance
    && rect.y + rect.height <= bounds.y + bounds.height + tolerance
}

function segmentIntersectsRect(start, end, rect, tolerance = 0.01) {
  if (!pointIsFinite(start) || !pointIsFinite(end)) return false
  const bounds = {
    left: rect.x - tolerance,
    right: rect.x + rect.width + tolerance,
    top: rect.y - tolerance,
    bottom: rect.y + rect.height + tolerance,
  }
  const dx = end.x - start.x
  const dy = end.y - start.y
  let minimum = 0
  let maximum = 1
  for (const [direction, distance] of [
    [-dx, start.x - bounds.left],
    [dx, bounds.right - start.x],
    [-dy, start.y - bounds.top],
    [dy, bounds.bottom - start.y],
  ]) {
    if (Math.abs(direction) <= 1e-9) {
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

function edgeIntersectsRect(edge, rect) {
  return (edge.sections || []).some((section) => {
    const points = sectionPoints(section)
    for (let index = 0; index < points.length - 1; index += 1) {
      if (segmentIntersectsRect(points[index], points[index + 1], rect)) return true
    }
    return false
  })
}

function portTouchesDeclaredSide(node, port, tolerance) {
  if (port.side === 'NORTH') return Math.abs(port.y + port.height - node.y) <= tolerance
  if (port.side === 'EAST') return Math.abs(port.x - (node.x + node.width)) <= tolerance
  if (port.side === 'SOUTH') return Math.abs(port.y - (node.y + node.height)) <= tolerance
  return Math.abs(port.x + port.width - node.x) <= tolerance
}

/** Deterministic geometry gate. It reports collisions; it never hides them by moving content. */
export function lintGeometry(input, geometry, userOptions = {}) {
  const options = mergedOptions(userOptions)
  const errors = []
  const warnings = []
  let spec
  try {
    spec = normalizeDiagramSpec(input)
  } catch (error) {
    return { ok: false, errors: [{ code: 'invalid-spec', message: error.message }], warnings, stats: {} }
  }
  if (!geometry || typeof geometry !== 'object') {
    return { ok: false, errors: [{ code: 'missing-geometry', message: 'geometry must be an object' }], warnings, stats: {} }
  }

  const geometryNodes = Array.isArray(geometry.nodes) ? geometry.nodes : []
  const geometryEdges = Array.isArray(geometry.edges) ? geometry.edges : []
  const nodeById = new Map(geometryNodes.map((node) => [node.id, node]))
  const edgeById = new Map(geometryEdges.map((edge) => [edge.id, edge]))

  for (const sourceNode of spec.nodes) {
    const node = nodeById.get(sourceNode.id)
    if (!node) {
      errors.push({ code: 'missing-node', nodeId: sourceNode.id, message: `candidate geometry is missing node ${sourceNode.id}` })
      continue
    }
    if (![node.x, node.y, node.width, node.height].every(finiteNumber) || node.width <= 0 || node.height <= 0) {
      errors.push({ code: 'invalid-node-geometry', nodeId: node.id, message: `node ${node.id} has invalid bounds` })
    }
    const labelBox = node.labelBox
    if (!labelBox || ![labelBox.width, labelBox.height].every(finiteNumber)) {
      errors.push({ code: 'missing-node-label-box', nodeId: node.id, message: `node ${node.id} is missing measured label bounds` })
    } else if ([node.width, node.height].every(finiteNumber)) {
      const requiredPadding = requiredTextPadding('node', labelBox, sourceNode.label, options)
      const content = nodeContentMetrics(sourceNode, labelBox, options)
      const horizontal = (node.width - content.width) / 2
      const vertical = (node.height - content.height) / 2
      if (horizontal < requiredPadding.x - options.endpointTolerance
        || vertical < requiredPadding.y - options.endpointTolerance) {
        errors.push({
          code: 'node-label-padding',
          nodeId: node.id,
          message: `node ${node.id} leaves only ${horizontal.toFixed(1)} horizontal and ${vertical.toFixed(1)} vertical label padding; expected ${requiredPadding.x.toFixed(1)} and ${requiredPadding.y.toFixed(1)}`,
        })
      }
    }
    for (const sourcePort of sourceNode.ports) {
      const port = node.ports?.find((candidate) => candidate.id === sourcePort.id)
      if (!port || !pointIsFinite(port.anchor)) {
        errors.push({ code: 'missing-port', nodeId: node.id, portId: sourcePort.id, message: `node ${node.id} is missing port ${sourcePort.id}` })
      } else if (port.side !== sourcePort.side || !portTouchesDeclaredSide(node, port, options.endpointTolerance)) {
        errors.push({ code: 'port-side-miss', nodeId: node.id, portId: sourcePort.id, message: `port ${sourcePort.id} does not touch the declared ${sourcePort.side} side of node ${node.id}` })
      }
    }
  }

  for (let leftIndex = 0; leftIndex < geometryNodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < geometryNodes.length; rightIndex += 1) {
      if (rectanglesOverlap(geometryNodes[leftIndex], geometryNodes[rightIndex])) {
        errors.push({
          code: 'node-overlap',
          nodeIds: [geometryNodes[leftIndex].id, geometryNodes[rightIndex].id],
          message: `nodes ${geometryNodes[leftIndex].id} and ${geometryNodes[rightIndex].id} overlap`,
        })
      }
    }
  }

  const allLabels = []
  for (const sourceEdge of spec.edges) {
    const edge = edgeById.get(sourceEdge.id)
    if (!edge) {
      errors.push({ code: 'missing-edge', edgeId: sourceEdge.id, message: `candidate geometry is missing edge ${sourceEdge.id}` })
      continue
    }
    const sections = Array.isArray(edge.sections) ? edge.sections : []
    if (sections.length === 0) {
      errors.push({ code: 'missing-section', edgeId: edge.id, message: `edge ${edge.id} has no routed section` })
      continue
    }
    const expectedSourceShape = sourceEdge.sourcePort ? elkPortId(sourceEdge.source, sourceEdge.sourcePort) : sourceEdge.source
    const expectedTargetShape = sourceEdge.targetPort ? elkPortId(sourceEdge.target, sourceEdge.targetPort) : sourceEdge.target
    const sourceSection = sections.find((section) => section.incomingShape === expectedSourceShape) || sections[0]
    const targetSection = terminalSectionForTarget(sections, expectedTargetShape)
    const sourceNode = nodeById.get(sourceEdge.source)
    const targetNode = nodeById.get(sourceEdge.target)

    if (!edge.arrow || !pointIsFinite(edge.arrow.tip) || !finiteNumber(edge.arrow.angle)) {
      errors.push({ code: 'missing-arrow', edgeId: edge.id, message: `edge ${edge.id} has no valid terminal arrow` })
    } else if (!targetSection || !pointsEqual(edge.arrow.tip, targetSection.endPoint, options.endpointTolerance)) {
      errors.push({ code: 'arrow-terminal-mismatch', edgeId: edge.id, message: `edge ${edge.id} arrow does not match its terminal section` })
    }

    if (sourceNode && pointIsFinite(sourceSection?.startPoint)) {
      const sourcePort = sourceEdge.sourcePort ? sourceNode.ports?.find((port) => port.id === sourceEdge.sourcePort) : null
      const valid = sourcePort
        ? pointsEqual(sourceSection.startPoint, sourcePort.anchor, options.endpointTolerance)
        : pointOnNodeBoundary(sourceSection.startPoint, sourceNode, options.endpointTolerance)
      if (!valid) errors.push({ code: 'source-endpoint-miss', edgeId: edge.id, message: `edge ${edge.id} misses its declared source port or node boundary` })
    }
    if (targetNode && pointIsFinite(targetSection?.endPoint)) {
      const targetPort = sourceEdge.targetPort ? targetNode.ports?.find((port) => port.id === sourceEdge.targetPort) : null
      const valid = targetPort
        ? pointsEqual(targetSection.endPoint, targetPort.anchor, options.endpointTolerance)
        : pointOnNodeBoundary(targetSection.endPoint, targetNode, options.endpointTolerance)
      if (!valid) errors.push({ code: 'target-endpoint-miss', edgeId: edge.id, message: `edge ${edge.id} misses its declared target port or node boundary` })
      if (edge.arrow && !pointsEqual(edge.arrow.tip, targetPort?.anchor || targetSection.endPoint, options.endpointTolerance)) {
        errors.push({ code: 'arrow-target-miss', edgeId: edge.id, message: `edge ${edge.id} arrow misses its declared target` })
      }
    }

    const labelById = new Map((edge.labels || []).map((label) => [label.id, label]))
    for (const sourceLabel of sourceEdge.labels) {
      const label = labelById.get(sourceLabel.id)
      if (!label) {
        errors.push({ code: 'missing-edge-label', edgeId: edge.id, labelId: sourceLabel.id, message: `edge ${edge.id} is missing label ${sourceLabel.id}` })
        continue
      }
      if (![label.x, label.y, label.width, label.height].every(finiteNumber) || label.width <= 0 || label.height <= 0) {
        errors.push({ code: 'invalid-edge-label', edgeId: edge.id, labelId: label.id, message: `edge ${edge.id} label ${label.id} has invalid bounds` })
        continue
      }
      const labelBox = label.labelBox
      if (!labelBox || ![labelBox.width, labelBox.height].every(finiteNumber)) {
        errors.push({ code: 'missing-edge-label-box', edgeId: edge.id, labelId: label.id, message: `edge ${edge.id} label ${label.id} is missing measured text bounds` })
      } else {
        const requiredPadding = requiredTextPadding('edge-label', labelBox, sourceLabel.text, options)
        const horizontal = (label.width - labelBox.width) / 2
        const vertical = (label.height - labelBox.height) / 2
        if (horizontal < requiredPadding.x - options.endpointTolerance
          || vertical < requiredPadding.y - options.endpointTolerance) {
          errors.push({
            code: 'edge-label-padding',
            edgeId: edge.id,
            labelId: label.id,
            message: `edge ${edge.id} label ${label.id} leaves only ${horizontal.toFixed(1)} horizontal and ${vertical.toFixed(1)} vertical text padding; expected ${requiredPadding.x.toFixed(1)} and ${requiredPadding.y.toFixed(1)}`,
          })
        }
      }
      const bounds = { x: 0, y: 0, width: geometry.layout?.width, height: geometry.layout?.height }
      if (![bounds.width, bounds.height].every(finiteNumber) || !rectangleWithinBounds(label, bounds)) {
        errors.push({ code: 'edge-label-out-of-bounds', edgeId: edge.id, labelId: label.id, message: `edge ${edge.id} label ${label.id} falls outside candidate bounds` })
      }
      const expectedAnchor = pointAtEdgeDistance(sections, sourceLabel.position.distance)
      const expectedCenter = offsetAnchor(
        expectedAnchor,
        resolvedLabelOffset(sourceLabel.position, label.width, label.height, expectedAnchor, options),
      )
      const actualCenter = { x: label.x + label.width / 2, y: label.y + label.height / 2 }
      if (!pointsEqual(actualCenter, expectedCenter, options.labelAnchorTolerance)) {
        errors.push({ code: 'edge-label-anchor-miss', edgeId: edge.id, labelId: label.id, message: `edge ${edge.id} label ${label.id} is detached from its declared distance and offset` })
      }
      for (const node of geometryNodes) {
        if (rectanglesOverlap(expandRect(label, options.labelClearance), node)) {
          errors.push({ code: 'edge-label-overlaps-node', edgeId: edge.id, labelId: label.id, nodeId: node.id, message: `edge ${edge.id} label ${label.id} overlaps node ${node.id}` })
        }
      }
      allLabels.push({ ...label, edgeId: edge.id })
    }
    for (const label of edge.labels || []) {
      if (!sourceEdge.labels.some((candidate) => candidate.id === label.id)) {
        errors.push({ code: 'unexpected-edge-label', edgeId: edge.id, labelId: label.id, message: `edge ${edge.id} contains unexpected label ${label.id}` })
      }
    }
  }

  for (let leftIndex = 0; leftIndex < allLabels.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < allLabels.length; rightIndex += 1) {
      const left = allLabels[leftIndex]
      const right = allLabels[rightIndex]
      if (rectanglesOverlap(expandRect(left, options.labelClearance / 2), expandRect(right, options.labelClearance / 2))) {
        errors.push({
          code: 'edge-label-overlap',
          edgeIds: [left.edgeId, right.edgeId],
          labelIds: [left.id, right.id],
          message: `labels ${left.edgeId}.${left.id} and ${right.edgeId}.${right.id} overlap`,
        })
      }
    }
  }

  for (const label of allLabels) {
    const protectedBounds = expandRect(label, options.labelClearance)
    for (const edge of geometryEdges) {
      if (!edgeIntersectsRect(edge, protectedBounds)) continue
      const owningEdge = edge.id === label.edgeId
      errors.push({
        code: owningEdge
          ? 'edge-label-overlaps-owning-edge'
          : 'edge-label-overlaps-unrelated-edge',
        labelEdgeId: label.edgeId,
        labelId: label.id,
        edgeId: edge.id,
        message: `${owningEdge ? 'owning edge' : `edge ${edge.id}`} crosses the protected bounds of label ${label.edgeId}.${label.id}`,
      })
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      expectedNodes: spec.nodes.length,
      renderedNodes: geometryNodes.length,
      expectedEdges: spec.edges.length,
      renderedEdges: geometryEdges.length,
      expectedLabels: spec.edges.reduce((sum, edge) => sum + edge.labels.length, 0),
      renderedLabels: geometryEdges.reduce((sum, edge) => sum + (edge.labels?.length || 0), 0),
    },
  }
}

function tonePalette(tone, theme = {}) {
  const normalized = String(tone || '').toLowerCase()
  let palette
  if (['active', 'success', 'primary', 'green'].includes(normalized)) {
    palette = { fill: PALETTE.greenFill, stroke: PALETTE.green, marker: 'active' }
  } else if (['risk', 'warning', 'fail', 'danger', 'orange'].includes(normalized)) {
    palette = { fill: PALETTE.orangeFill, stroke: PALETTE.orange, marker: 'risk' }
  } else if (['info', 'support', 'blue', 'context'].includes(normalized)) {
    palette = { fill: PALETTE.blueFill, stroke: PALETTE.blue, marker: 'info' }
  } else {
    palette = { fill: PALETTE.neutralFill, stroke: theme.muted || PALETTE.muted, marker: 'neutral' }
  }
  const override = theme.tones?.[palette.marker] || {}
  return {
    fill: override.fill || theme.nodeFill || palette.fill,
    stroke: override.stroke || theme.nodeStroke || palette.stroke,
    marker: palette.marker,
  }
}

function roundedPolylinePath(points, radius = 10) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  const commands = [`M ${points[0].x} ${points[0].y}`]
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]
    const corner = points[index]
    const next = points[index + 1]
    const incomingLength = Math.hypot(corner.x - previous.x, corner.y - previous.y)
    const outgoingLength = Math.hypot(next.x - corner.x, next.y - corner.y)
    if (incomingLength < 0.01 || outgoingLength < 0.01) continue
    const cornerRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2)
    const before = {
      x: corner.x - ((corner.x - previous.x) / incomingLength) * cornerRadius,
      y: corner.y - ((corner.y - previous.y) / incomingLength) * cornerRadius,
    }
    const after = {
      x: corner.x + ((next.x - corner.x) / outgoingLength) * cornerRadius,
      y: corner.y + ((next.y - corner.y) / outgoingLength) * cornerRadius,
    }
    commands.push(`L ${before.x} ${before.y}`, `Q ${corner.x} ${corner.y} ${after.x} ${after.y}`)
  }
  const last = points.at(-1)
  commands.push(`L ${last.x} ${last.y}`)
  return commands.join(' ')
}

function multilineText({ text, measurement, x, centerY, fontSize, fontWeight, lineHeight, fill, className }) {
  const lines = Array.isArray(measurement?.displayLines)
    ? measurement.displayLines : String(text).split('\n')
  const measuredHeight = measuredLineHeight(measurement, lines.join('\n'), lineHeight)
  const firstY = centerY - ((lines.length - 1) * measuredHeight) / 2
  return `<text class="${className}" x="${x}" y="${firstY}" text-anchor="middle" dominant-baseline="middle" xml:space="preserve" style="white-space:pre" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(fill)}">${lines.map((line, index) => `<tspan x="${x}" y="${firstY + index * measuredHeight}">${escapeXml(line || '\u200b')}</tspan>`).join('')}</text>`
}

/** Render candidate geometry with SlideBlocks-owned SVG styling and edge-relative labels. */
export function renderDiagramSvg(input, geometry, userOptions = {}) {
  const spec = normalizeDiagramSpec(input)
  const options = mergedOptions(userOptions)
  const theme = options.theme || {}
  // IDs resolve document-wide even when another Slidev page is hidden. Encode
  // the full semantic ID without lossy slugification; repeated mounts of the
  // same diagram can provide a unique idPrefix for each mounting location.
  const idPrefix = options.idPrefix || `sb-diagram-${Buffer.from(spec.id, 'utf8').toString('hex')}`
  const titleId = `${idPrefix}-title`
  const descId = `${idPrefix}-desc`
  const markerId = (tone) => `${idPrefix}-arrow-${tone}`
  const sourceNodeById = new Map(spec.nodes.map((node) => [node.id, node]))
  const sourceEdgeById = new Map(spec.edges.map((edge) => [edge.id, edge]))
  const markers = ['neutral', 'active', 'risk', 'info'].map((id) => `<marker id="${markerId(id)}" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 14 7 L 0 14 Z" fill="${escapeXml(tonePalette(id, theme).stroke)}"/></marker>`).join('')

  const edgeMarkup = geometry.edges.map((edge) => {
    const source = sourceEdgeById.get(edge.id)
    if (!source) return ''
    const tone = tonePalette(source.tone, theme)
    const expectedTargetShape = source.targetPort ? elkPortId(source.target, source.targetPort) : source.target
    const terminal = terminalSectionForTarget(edge.sections, expectedTargetShape)
    const paths = edge.sections.map((section) => {
      const marker = section === terminal ? ` marker-end="url(#${markerId(tone.marker)})"` : ''
      return `<path data-edge-id="${escapeXml(edge.id)}" data-section-id="${escapeXml(section.id)}" d="${roundedPolylinePath(sectionPoints(section))}" fill="none" stroke="${escapeXml(tone.stroke)}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"${marker}/>`
    }).join('')
    const labels = edge.labels.map((label) => `<g data-edge-id="${escapeXml(edge.id)}" data-label-id="${escapeXml(label.id)}"><rect data-slideblocks-text-owner="edge-label" x="${label.x}" y="${label.y}" width="${label.width}" height="${label.height}" rx="7" fill="${escapeXml(theme.labelBackground || theme.background || PALETTE.paper)}"/>${multilineText({
      text: label.text,
      measurement: label.labelBox,
      x: label.x + label.width / 2,
      centerY: label.y + label.height / 2,
      fontSize: options.edgeFontSize,
      fontWeight: options.edgeFontWeight,
      lineHeight: options.edgeLineHeight,
      fill: tone.stroke,
      className: 'edge-label',
    })}</g>`).join('')
    return `${paths}${labels}`
  }).join('')

  const nodeMarkup = geometry.nodes.map((node) => {
    const source = sourceNodeById.get(node.id)
    if (!source || ![node.x, node.y, node.width, node.height].every(finiteNumber)) return ''
    const tone = tonePalette(source.tone, theme)
    const icon = resolvedIcon(source, options)
    const iconSlotWidth = icon ? options.iconSize + options.iconGap : 0
    const padding = requiredTextPadding('node', node.labelBox, source.label, options)
    const iconMarkup = icon ? `<svg data-icon-id="${escapeXml(source.icon)}" x="${node.x + padding.x}" y="${node.y + (node.height - options.iconSize) / 2}" width="${options.iconSize}" height="${options.iconSize}" viewBox="0 0 ${icon.width} ${icon.height}" preserveAspectRatio="xMidYMid meet" color="${escapeXml(tone.stroke)}" aria-hidden="true">${icon.body}</svg>` : ''
    const ports = (node.ports || []).filter((port) => pointIsFinite(port.anchor)).map((port) => `<circle data-node-id="${escapeXml(node.id)}" data-port-id="${escapeXml(port.id)}" cx="${port.anchor.x}" cy="${port.anchor.y}" r="2.8" fill="${escapeXml(theme.portFill || PALETTE.white)}" stroke="${escapeXml(tone.stroke)}" stroke-width="1.6"/>`).join('')
    return `<g data-node-id="${escapeXml(node.id)}"><rect data-slideblocks-text-owner="node" x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="14" fill="${escapeXml(tone.fill)}" stroke="${escapeXml(tone.stroke)}" stroke-width="3"/>${iconMarkup}${multilineText({
      text: source.label,
      measurement: node.labelBox,
      x: node.x + (node.width + iconSlotWidth) / 2,
      centerY: node.y + node.height / 2,
      fontSize: options.nodeFontSize,
      fontWeight: options.nodeFontWeight,
      lineHeight: options.nodeLineHeight,
      fill: theme.text || PALETTE.graphite,
      className: 'node-label',
    })}${ports}</g>`
  }).join('')

  const transform = `translate(${geometry.canvas.translateX} ${geometry.canvas.translateY}) scale(${geometry.canvas.scale})`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.canvas.width}" height="${geometry.canvas.height}" viewBox="0 0 ${geometry.canvas.width} ${geometry.canvas.height}" role="img" text-rendering="geometricPrecision" aria-labelledby="${titleId} ${descId}" data-slideblocks-diagram="final" data-slideblocks-render-route="diagram:elk" data-layout-engine="elkjs" data-layout-role="final" data-layout-source="elkjs-candidate" data-visual-renderer="slideblocks-svg"><title id="${titleId}">${escapeXml(spec.id)}</title><desc id="${descId}">SlideBlocks final SVG refined from an ELK candidate with ${spec.nodes.length} nodes, ${spec.edges.length} edges, and ${spec.edges.reduce((sum, edge) => sum + edge.labels.length, 0)} edge labels.</desc><defs>${options.fontCss ? `<style><![CDATA[${options.fontCss.replaceAll(']]>', ']]]]><![CDATA[>')}]]></style>` : ''}${markers}</defs><rect width="100%" height="100%" fill="${escapeXml(theme.background || PALETTE.paper)}"/><g transform="${transform}" style="font-family:${escapeXml(options.fontFamily)}">${edgeMarkup}${nodeMarkup}</g></svg>`
}

/** Compile DiagramSpec through measured text, ELK candidate layout, lint, and SlideBlocks SVG. */
export async function compileDiagram(input, userOptions = {}) {
  const options = mergedOptions(userOptions)
  const spec = normalizeDiagramSpec(input)
  // Validate every requested icon before launching a browser or layout engine.
  for (const node of spec.nodes) resolvedIcon(node, options)
  const measurements = typeof options.measureText === 'function'
    ? await options.measureText(spec, options)
    : await measureDiagramText(spec, options)
  const elkGraph = buildElkGraph(spec, measurements, options)
  let layoutEngine = options.layoutEngine
  if (!layoutEngine) {
    const elkModule = await importDependency('elkjs/lib/elk.bundled.js', options)
    const ELK = elkModule.default || elkModule.ELK || elkModule
    layoutEngine = new ELK()
  }
  const candidate = typeof layoutEngine === 'function'
    ? await layoutEngine(elkGraph, { spec, measurements, options })
    : await layoutEngine.layout(elkGraph)
  const geometry = normalizeElkCandidate(spec, candidate, measurements, options)
  const lint = lintGeometry(spec, geometry, options)
  if (!lint.ok && options.throwOnLintError) throw new GeometryLintError(lint, geometry)
  const svg = renderDiagramSvg(spec, geometry, options)
  return {
    spec,
    candidate,
    geometry,
    geometryJson: JSON.stringify(geometry, null, 2),
    lint,
    svg,
  }
}
