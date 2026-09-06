import {
  compileDiagram,
  lintGeometry,
  normalizeDiagramSpec,
  normalizeElkCandidate,
  pointAtEdgeDistance,
  renderDiagramSvg,
} from './diagram-engine.mjs'

// A bounded candidate search for an already-authored semantic graph. It does not
// remove content, rewrite meaning, change declared ports, or author coordinates.
export class PresentationFitError extends Error {
  constructor(report) {
    super(`Diagram cannot fit ${report.canvas.width}×${report.canvas.height} at readable size. Enlarge its region or explicitly reorganize the content. See error.report.attempts.`)
    this.name = 'PresentationFitError'
    this.report = report
  }
}

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${name} must be a positive number`)
  return value
}

function validateSupportedSemantics(input) {
  for (const key of ['groups', 'lanes', 'ranks', 'children']) {
    if (input?.[key] != null) throw new TypeError(`Presentation diagram does not yet implement ${key}; do not silently flatten it`)
  }
  for (const node of input?.nodes ?? []) {
    for (const key of ['parent', 'parentId', 'group', 'lane', 'rank', 'shape', 'children']) {
      if (node[key] != null) throw new TypeError(`Node ${node.id}: ${key} is not supported by this prototype`)
    }
    if (typeof node.label !== 'string' || !node.label.trim()) throw new TypeError(`Node ${node.id} requires a non-empty label`)
  }
}

function sections(edge) {
  return edge.sections.flatMap(section => {
    const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
    return points.slice(1).map((end, i) => ({ start: points[i], end, length: Math.hypot(end.x - points[i].x, end.y - points[i].y) }))
  })
}

function crossesNode(segment, node) {
  // ELK emits orthogonal paths. Treat an unexpected diagonal conservatively with
  // the same parametric segment/rectangle test instead of assuming it is safe.
  const rect = { left: node.x + 0.1, right: node.x + node.width - 0.1, top: node.y + 0.1, bottom: node.y + node.height - 0.1 }
  const dx = segment.end.x - segment.start.x
  const dy = segment.end.y - segment.start.y
  let enter = 0
  let leave = 1
  for (const [p, q] of [[-dx, segment.start.x - rect.left], [dx, rect.right - segment.start.x], [-dy, segment.start.y - rect.top], [dy, rect.bottom - segment.start.y]]) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue }
    const t = q / p
    if (p < 0) enter = Math.max(enter, t)
    else leave = Math.min(leave, t)
    if (enter > leave) return false
  }
  return true
}

export function inspectPresentationGeometry(spec, geometry, options) {
  const errors = [...lintGeometry(spec, geometry, options).errors]
  const scale = geometry.canvas.scale
  const { width: canvasWidth, height: canvasHeight, translateX, translateY, padding = 0 } = geometry.canvas
  if (![scale, canvasWidth, canvasHeight, translateX, translateY, padding].every(Number.isFinite) || scale <= 0 || padding < 0) {
    errors.push({ code: 'invalid-canvas-transform' })
  }
  const visible = (x, y) => {
    const px = x * scale + translateX
    const py = y * scale + translateY
    return Number.isFinite(px) && Number.isFinite(py) && px >= padding - 0.01 && py >= padding - 0.01 && px <= canvasWidth - padding + 0.01 && py <= canvasHeight - padding + 0.01
  }
  const effectiveFonts = {
    node: options.nodeFontSize * scale,
    edge: options.edgeFontSize * scale,
  }
  if (effectiveFonts.node < options.minNodeFontSize - 0.01) errors.push({ code: 'unreadable-node-text', actual: effectiveFonts.node, required: options.minNodeFontSize })
  if (spec.edges.some(edge => edge.labels.length) && effectiveFonts.edge < options.minEdgeFontSize - 0.01) errors.push({ code: 'unreadable-edge-text', actual: effectiveFonts.edge, required: options.minEdgeFontSize })
  const inside = (x, y) => x >= -0.01 && y >= -0.01 && x <= geometry.layout.width + 0.01 && y <= geometry.layout.height + 0.01
  for (const node of geometry.nodes) {
    if (!inside(node.x, node.y) || !inside(node.x + node.width, node.y + node.height)) errors.push({ code: 'node-outside-canvas', nodeId: node.id })
    if (!visible(node.x, node.y) || !visible(node.x + node.width, node.y + node.height)) errors.push({ code: 'node-outside-viewport', nodeId: node.id })
  }
  for (const edge of geometry.edges) {
    for (const segment of sections(edge)) {
      if (!inside(segment.start.x, segment.start.y) || !inside(segment.end.x, segment.end.y)) errors.push({ code: 'edge-outside-canvas', edgeId: edge.id })
      if (!visible(segment.start.x, segment.start.y) || !visible(segment.end.x, segment.end.y)) errors.push({ code: 'edge-outside-viewport', edgeId: edge.id })
      for (const node of geometry.nodes) {
        if (node.id !== edge.source && node.id !== edge.target && crossesNode(segment, node)) errors.push({ code: 'edge-crosses-node', edgeId: edge.id, nodeId: node.id })
      }
    }
    for (const label of edge.labels) {
      if (!visible(label.x, label.y) || !visible(label.x + label.width, label.y + label.height)) errors.push({ code: 'label-outside-viewport', edgeId: edge.id, labelId: label.id })
    }
  }
  return { ok: errors.length === 0, errors, effectiveFonts }
}

function labelPositions(edge, label, rawLabel, clearance) {
  const pinnedDistance = rawLabel?.position?.distance != null
  const pinnedOffset = rawLabel?.position?.offset != null
  const distances = [label.position.distance]
  if (!pinnedDistance) {
    const segments = sections(edge)
    const total = segments.reduce((sum, segment) => sum + segment.length, 0)
    let traversed = 0
    const midpoints = segments.map(segment => {
      const distance = (traversed + segment.length / 2) / total
      traversed += segment.length
      return { distance, length: segment.length }
    }).sort((a, b) => b.length - a.length)
    distances.push(...midpoints.slice(0, 5).map(segment => segment.distance))
  }
  return [...new Set(distances)].filter(Number.isFinite).flatMap(distance => {
    if (pinnedOffset) return [{ distance, offset: structuredClone(rawLabel.position.offset) }]
    const anchor = pointAtEdgeDistance(edge.sections, distance)
    const gap = Math.abs(anchor.normal.x) * label.width / 2 + Math.abs(anchor.normal.y) * label.height / 2 + clearance + 4
    return [{ distance, offset: gap }, { distance, offset: -gap }]
  })
}

function measurementsFrom(geometry) {
  return Object.fromEntries([
    ...geometry.nodes.map(node => [`node:${node.id}`, node.labelBox]),
    ...geometry.edges.flatMap(edge => edge.labels.map(label => [`edge:${edge.id}:label:${label.id}`, label.labelBox])),
  ])
}

function resolveAutomaticLabels(result, sourceSpec, options) {
  let spec = structuredClone(result.spec)
  let geometry = result.geometry
  const measurements = measurementsFrom(geometry)
  let check = inspectPresentationGeometry(spec, geometry, options)
  const changes = []
  // Explicitly bounded, reported label candidate placement. No relaxation loop
  // or cosmetic mask; every accepted position remains owned by its actual edge.
  for (let pass = 0; pass < 2 && !check.ok; pass++) {
    let improved = false
    for (const edge of spec.edges) {
      for (const label of edge.labels) {
        const rawEdge = sourceSpec.edges.find(item => item.id === edge.id)
        const rawLabel = rawEdge.labels?.find(item => item.id === label.id)
        if (rawLabel?.position?.distance != null && rawLabel?.position?.offset != null) continue
        const drawnEdge = geometry.edges.find(item => item.id === edge.id)
        const drawnLabel = drawnEdge.labels.find(item => item.id === label.id)
        let best = { spec, geometry, check, position: null }
        for (const position of labelPositions(drawnEdge, drawnLabel, rawLabel, options.labelClearance)) {
          const candidateSpec = structuredClone(spec)
          candidateSpec.edges.find(item => item.id === edge.id).labels.find(item => item.id === label.id).position = position
          const candidateGeometry = normalizeElkCandidate(candidateSpec, result.candidate, measurements, options)
          const candidateCheck = inspectPresentationGeometry(candidateSpec, candidateGeometry, options)
          if (candidateCheck.errors.length < best.check.errors.length) best = { spec: candidateSpec, geometry: candidateGeometry, check: candidateCheck, position }
          if (best.check.ok) break
        }
        if (best.position) {
          spec = best.spec
          geometry = best.geometry
          check = best.check
          changes.push({ edgeId: edge.id, labelId: label.id, position: best.position })
          improved = true
        }
      }
    }
    if (!improved) break
  }
  return { spec, geometry, check, changes }
}

/** Layout DiagramSpec in a fixed presentation region without lowering type floors. */
export async function compilePresentationDiagram(input, userOptions = {}) {
  validateSupportedSemantics(input)
  const sourceSpec = structuredClone(input)
  const normalized = normalizeDiagramSpec(input)
  const options = {
    canvasWidth: 1160, canvasHeight: 440, canvasPadding: 24,
    maxScale: 1, nodeFontSize: 26, nodeLineHeight: 36,
    edgeFontSize: 20, edgeLineHeight: 28,
    nodePaddingX: 24, nodePaddingY: 20, nodeMinWidth: 112, nodeMinHeight: 76,
    edgePaddingX: 12, edgePaddingY: 10, labelClearance: 8,
    minNodeFontSize: 22, minEdgeFontSize: 18,
    ...userOptions,
    throwOnLintError: false,
  }
  for (const key of ['canvasWidth', 'canvasHeight', 'maxScale', 'nodeFontSize', 'edgeFontSize', 'minNodeFontSize', 'minEdgeFontSize']) positive(options[key], key)
  if (!Number.isFinite(options.canvasPadding) || options.canvasPadding < 0 || 2 * options.canvasPadding >= Math.min(options.canvasWidth, options.canvasHeight)) throw new TypeError('canvasPadding must be finite, non-negative, and leave a positive drawing region')
  const widths = userOptions.textWidths ?? [180, 230, 140]
  if (!Array.isArray(widths) || widths.length < 1 || widths.length > 4) throw new TypeError('textWidths must contain 1 to 4 positive widths')
  widths.forEach(width => positive(width, 'textWidths entry'))
  const directions = userOptions.directions ?? [normalized.direction]
  if (!Array.isArray(directions) || directions.length < 1 || directions.length > 2) throw new TypeError('directions must contain 1 or 2 explicit direction candidates')
  // Directions are opt-in. In particular, changing a diagram region never
  // silently changes its author-declared direction or physical port sides.
  const gaps = [{ nodeSpacing: 32, layerSpacing: 64, edgeNodeSpacing: 28 }, { nodeSpacing: 44, layerSpacing: 88, edgeNodeSpacing: 40 }]
  const attempts = []
  for (const direction of directions) {
    for (const width of widths) {
      for (const gap of gaps) {
        const candidateOptions = { ...options, ...gap, nodeMaxTextWidth: width, edgeMaxTextWidth: Math.max(100, width - 40) }
        const result = await compileDiagram({ ...input, direction }, candidateOptions)
        const resolved = resolveAutomaticLabels(result, sourceSpec, candidateOptions)
        const attempt = { direction: result.spec.direction, textWidth: width, spacing: gap, effectiveFonts: resolved.check.effectiveFonts, errors: resolved.check.errors }
        attempts.push(attempt)
        if (!resolved.check.ok) continue
        return {
          ...result,
          sourceSpec,
          spec: resolved.spec,
          geometry: resolved.geometry,
          geometryJson: JSON.stringify(resolved.geometry, null, 2),
          lint: { ...lintGeometry(resolved.spec, resolved.geometry, candidateOptions), ok: true },
          svg: renderDiagramSvg(resolved.spec, resolved.geometry, candidateOptions),
          presentation: { canvas: { width: options.canvasWidth, height: options.canvasHeight }, selected: attempts.length - 1, attempts, labelPlacements: resolved.changes, effectiveFonts: resolved.check.effectiveFonts },
        }
      }
    }
  }
  throw new PresentationFitError({ canvas: { width: options.canvasWidth, height: options.canvasHeight }, attempts })
}
