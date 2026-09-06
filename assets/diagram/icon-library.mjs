import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Local Iconify JSON collections only. No runtime network or package dependency.
// Format and alias semantics: https://iconify.design/docs/types/iconify-json.html
// License metadata is passed through, not treated as a complete license notice.
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const OWN = (object, key) => Object.hasOwn(object, key)
const BASE = { left: 0, top: 0, width: 16, height: 16, rotate: 0, hFlip: false, vFlip: false }
const GEOMETRY = ['left', 'top', 'width', 'height']
const COMMON = new Set(['fill', 'stroke', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'transform', 'vector-effect'])
const TAGS = {
  g: [], path: ['d', 'pathLength'], circle: ['cx', 'cy', 'r', 'pathLength'],
  ellipse: ['cx', 'cy', 'rx', 'ry', 'pathLength'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'pathLength'],
  line: ['x1', 'y1', 'x2', 'y2', 'pathLength'], polyline: ['points', 'pathLength'], polygon: ['points', 'pathLength'],
}
const NUMBER = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?'
const NUMBER_RE = new RegExp(`^${NUMBER}$`)
const NUMBERS_RE = new RegExp(`^\\s*${NUMBER}(?:[\\s,]+${NUMBER})*\\s*$`)

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value
}

function validName(value, label) {
  if (typeof value !== 'string' || !NAME.test(value)) throw new Error(`${label} must be a lowercase Iconify name`)
}

export function validateIconCollection(collection) {
  record(collection, 'collection')
  validName(collection.prefix, 'collection.prefix')
  record(collection.icons, 'collection.icons')
  if (collection.aliases !== undefined) record(collection.aliases, 'collection.aliases')
  for (const [kind, entries] of [['icons', collection.icons], ['aliases', collection.aliases || {}]]) {
    for (const [name, item] of Object.entries(entries)) {
      validName(name, `${kind} key`)
      record(item, `${kind}.${name}`)
      if (kind === 'aliases' && OWN(collection.icons, name)) throw new Error(`Ambiguous icon and alias: ${name}`)
    }
  }
  return collection
}

export async function readIconCollection(filePath) {
  if ((await stat(filePath)).size > 64 * 1024 * 1024) throw new Error('Collection exceeds 64 MiB limit')
  return validateIconCollection(JSON.parse(await readFile(filePath, 'utf8')))
}

/** Literal ID/name/alias-parent matching, not semantic or translated search. */
export function searchIcons(collection, query, { limit = 8, includeHidden = false } = {}) {
  validateIconCollection(collection)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be an integer from 1 to 100')
  if (typeof query !== 'string' || !query.trim() || query.length > 128) throw new Error('query must contain 1–128 characters')
  const needle = query.trim().toLowerCase()
  const words = needle.split(/\s+/)
  const candidates = []
  for (const [alias, entries] of [[false, collection.icons], [true, collection.aliases || {}]]) {
    for (const [name, item] of Object.entries(entries)) {
      if (!includeHidden && item.hidden === true) continue
      const id = `${collection.prefix}:${name}`
      const haystack = `${id} ${alias ? item.parent || '' : ''}`
      if (!words.every((word) => haystack.includes(word))) continue
      const score = name === needle || id === needle ? 0 : name.startsWith(needle) ? 1 : name.includes(needle) ? 2 : 3
      candidates.push({ id, prefix: collection.prefix, name, alias, ...(alias ? { parent: item.parent } : {}), score })
    }
  }
  return candidates.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id, 'en')).slice(0, limit).map(({ score, ...item }) => item)
}

function numbers(value, label) {
  if (!NUMBERS_RE.test(value)) throw new Error(`Unsupported numeric ${label}`)
  const result = value.trim().split(/[\s,]+/).map(Number)
  if (result.some((number) => !Number.isFinite(number) || Math.abs(number) > 1e7)) throw new Error(`Out-of-range ${label}`)
  return result
}

function validateAttribute(name, value) {
  if (/[<>&\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error(`Unsafe SVG attribute: ${name}`)
  if (name === 'd') {
    if (!value.trim() || !/^[MmZzLlHhVvCcSsQqTtAa0-9eE+.,\s-]+$/.test(value)) throw new Error('Unsupported SVG path data')
    return
  }
  if (name === 'fill' || name === 'stroke') {
    if (!/^(?:none|currentColor|transparent|[a-z]+|#[\da-fA-F]{3,4}|#[\da-fA-F]{6}|#[\da-fA-F]{8})$/.test(value)) throw new Error(`Unsupported SVG paint: ${value}`)
    return
  }
  const enums = {
    'fill-rule': ['nonzero', 'evenodd'], 'clip-rule': ['nonzero', 'evenodd'],
    'stroke-linecap': ['butt', 'round', 'square'], 'stroke-linejoin': ['miter', 'round', 'bevel'],
    'vector-effect': ['none', 'non-scaling-stroke'],
  }
  if (enums[name]) {
    if (!enums[name].includes(value)) throw new Error(`Unsupported SVG ${name}: ${value}`)
    return
  }
  if (name === 'transform') {
    let remaining = value.trim()
    if (!remaining) throw new Error('Empty SVG transform')
    while (remaining) {
      const match = /^(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^()]*)\)\s*,?\s*/.exec(remaining)
      if (!match) throw new Error('Unsupported SVG transform')
      const count = numbers(match[2], 'transform').length
      if (!({ matrix: [6], translate: [1, 2], scale: [1, 2], rotate: [1, 3], skewX: [1], skewY: [1] })[match[1]].includes(count)) throw new Error('Invalid SVG transform argument count')
      remaining = remaining.slice(match[0].length)
    }
    return
  }
  if (name === 'stroke-dasharray' && value === 'none') return
  const values = numbers(value, name)
  if (name === 'points') {
    if (values.length < 4 || values.length % 2) throw new Error('SVG points must contain coordinate pairs')
  } else if (name !== 'stroke-dasharray' && (values.length !== 1 || !NUMBER_RE.test(value.trim()))) {
    throw new Error(`SVG ${name} must be one number`)
  }
  if (['opacity', 'fill-opacity', 'stroke-opacity'].includes(name) && (values[0] < 0 || values[0] > 1)) throw new Error(`${name} must be from 0 to 1`)
  if (['width', 'height', 'r', 'rx', 'ry', 'pathLength', 'stroke-width', 'stroke-dasharray'].includes(name) && values.some((number) => number < 0)) throw new Error(`${name} must not be negative`)
}

/** Strict static fragment subset: shape primitives and groups; no styles, IDs,
 * references, text, animation, images, namespaces, entities, or active content.
 * Rejected fragments remain rejected rather than silently losing artwork. */
export function assertOfflineSvgBody(body) {
  if (typeof body !== 'string' || !body.trim() || body.length > 1024 * 1024) throw new Error('SVG body must contain 1 byte to 1 MiB of static shapes')
  const stack = []
  let offset = 0
  let nodes = 0
  let shapes = 0
  while (offset < body.length) {
    const tail = body.slice(offset)
    const whitespace = /^\s+/.exec(tail)
    if (whitespace) { offset += whitespace[0].length; continue }
    if (body[offset] !== '<') throw new Error('SVG body contains text or malformed markup')
    const end = body.indexOf('>', offset)
    if (end === -1) throw new Error('Unclosed SVG tag')
    const token = body.slice(offset, end + 1)
    offset = end + 1
    const close = /^<\/([a-zA-Z][a-zA-Z0-9]*)\s*>$/.exec(token)
    if (close) {
      if (stack.pop() !== close[1]) throw new Error('Mismatched SVG closing tag')
      continue
    }
    const open = /^<([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)(\/?)>$/.exec(token)
    if (!open || !OWN(TAGS, open[1])) throw new Error(`Unsupported or active SVG tag: ${token.slice(0, 60)}`)
    const [, tag, attributes, selfClosing] = open
    if (++nodes > 10000) throw new Error('SVG body exceeds node limit')
    if (tag !== 'g') shapes++
    const seen = new Set()
    let rest = attributes
    while (rest.trim()) {
      const attr = /^\s+([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(rest)
      if (!attr) throw new Error('Malformed or unquoted SVG attribute')
      const name = attr[1]
      if (seen.has(name)) throw new Error(`Duplicate SVG attribute: ${name}`)
      seen.add(name)
      if (!COMMON.has(name) && !TAGS[tag].includes(name)) throw new Error(`Unsupported SVG attribute: ${name}`)
      validateAttribute(name, attr[2] ?? attr[3])
      rest = rest.slice(attr[0].length)
    }
    if (!selfClosing) {
      stack.push(tag)
      if (stack.length > 128) throw new Error('SVG body exceeds nesting limit')
    }
  }
  if (stack.length) throw new Error('Unclosed SVG element')
  if (!shapes) throw new Error('SVG body has no supported shapes')
  return body
}

function checkedProperties(item, label) {
  const result = {}
  for (const key of GEOMETRY) {
    if (!OWN(item, key)) continue
    if (typeof item[key] !== 'number' || !Number.isFinite(item[key]) || Math.abs(item[key]) > 1e7 || (['width', 'height'].includes(key) && item[key] <= 0)) throw new Error(`${label}.${key} is invalid`)
    result[key] = item[key]
  }
  for (const key of ['hFlip', 'vFlip']) {
    if (!OWN(item, key)) continue
    if (typeof item[key] !== 'boolean') throw new Error(`${label}.${key} must be boolean`)
    result[key] = item[key]
  }
  if (OWN(item, 'rotate')) {
    if (!Number.isSafeInteger(item.rotate)) throw new Error(`${label}.rotate must be integer quarter-turns`)
    result.rotate = ((item.rotate % 4) + 4) % 4
  }
  return result
}

function mergeProperties(parent, child) {
  const result = { ...parent, ...child }
  for (const key of ['hFlip', 'vFlip']) {
    if (OWN(parent, key) || OWN(child, key)) result[key] = Boolean(parent[key]) !== Boolean(child[key])
  }
  if (OWN(parent, 'rotate') || OWN(child, 'rotate')) result.rotate = ((parent.rotate || 0) + (child.rotate || 0)) % 4
  return result
}

function multiply(a, b) {
  return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]]
}

/** Resolve an exact name or prefix:name. Returns a zero-origin SVG body. */
export function getIcon(collection, iconId) {
  validateIconCollection(collection)
  if (typeof iconId !== 'string') throw new Error('Icon ID must be a string')
  const parts = iconId.split(':')
  if (parts.length > 2 || (parts.length === 2 && parts[0] !== collection.prefix)) throw new Error(`Icon ID must belong to ${collection.prefix}`)
  const name = parts.at(-1)
  validName(name, 'Icon name')
  const seen = new Set()
  function visit(key) {
    if (seen.has(key)) throw new Error(`Circular icon alias: ${[...seen, key].join(' -> ')}`)
    if (seen.size >= 128) throw new Error('Icon alias chain exceeds 128 entries')
    seen.add(key)
    if (OWN(collection.icons, key)) {
      const item = collection.icons[key]
      if (typeof item.body !== 'string') throw new Error(`Icon ${key} has no SVG body`)
      return { ...checkedProperties(item, key), body: item.body }
    }
    const alias = collection.aliases && OWN(collection.aliases, key) ? collection.aliases[key] : undefined
    if (!alias) throw new Error(`Icon or alias not found: ${collection.prefix}:${key}`)
    validName(alias.parent, `${key}.parent`)
    if (OWN(alias, 'body')) throw new Error(`Alias ${key} must not replace the parent body`)
    return mergeProperties(visit(alias.parent), checkedProperties(alias, key))
  }
  // Collection properties are fallback values; they do not add transformations.
  const icon = { ...BASE, ...checkedProperties(collection, 'collection'), ...visit(name) }
  let { width, height } = icon
  let matrix = [1, 0, 0, 1, -icon.left, -icon.top]
  if (icon.hFlip) matrix = multiply([-1, 0, 0, 1, width, 0], matrix)
  if (icon.vFlip) matrix = multiply([1, 0, 0, -1, 0, height], matrix)
  for (let turn = 0; turn < icon.rotate; turn++) {
    matrix = multiply([0, 1, -1, 0, height, 0], matrix)
    ;[width, height] = [height, width]
  }
  let body = assertOfflineSvgBody(icon.body)
  if (matrix.some((value, index) => value !== [1, 0, 0, 1, 0, 0][index])) body = `<g transform="matrix(${matrix.map((value) => Object.is(value, -0) ? 0 : value).join(' ')})">${body}</g>`
  const result = { body, width, height, prefix: collection.prefix, name }
  if (collection.info?.license !== undefined) result.license = structuredClone(collection.info.license)
  return result
}

async function main(args) {
  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage:\n  node icon-library.mjs search collection.json query [--limit 8]\n  node icon-library.mjs get collection.json prefix:name [--output icon.json]\nSearch matches literal IDs, names, and alias parents. Existing output files are not overwritten.\nOnly static shape/group SVG fragments are supported. Preserve the collection license notice separately.')
    return
  }
  const [command, collectionPath, query, ...flags] = args
  if (!['search', 'get'].includes(command) || !collectionPath || !query) throw new Error('Expected search/get, collection JSON path, and query/icon ID; use --help')
  if (flags.length && (flags.length !== 2 || flags[0] !== (command === 'search' ? '--limit' : '--output') || !flags[1])) throw new Error('Unknown or incomplete option; use --help')
  const collection = await readIconCollection(collectionPath)
  const result = command === 'search' ? searchIcons(collection, query, { limit: flags.length ? Number(flags[1]) : 8 }) : getIcon(collection, query)
  const json = `${JSON.stringify(result, null, 2)}\n`
  if (command === 'get' && flags.length) {
    const outputPath = resolve(flags[1])
    await writeFile(outputPath, json, { flag: 'wx' })
    console.log(outputPath)
  } else console.log(json.trimEnd())
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => { console.error(`icon-library: ${error.message}`); process.exitCode = 1 })
}
