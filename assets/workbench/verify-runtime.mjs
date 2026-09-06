import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * Presenter workbench runtime QA.
 *
 * Usage:
 *   node .slideblocks/verify-runtime.mjs [baseUrl|offline.html] [--browser=chromium|webkit]
 *     [--layout-only] [--execution-lock=/absolute/or/project-relative/path]
 *
 * Each action runs in a fresh page so fullscreen, presenter routing, drawing,
 * or modal state cannot contaminate the next assertion.
 */
const args = process.argv.slice(2)
const browserName = args.find(value => value.startsWith('--browser='))?.split('=', 2)[1]
	?? 'chromium'
const layoutOnly = args.includes('--layout-only')
const rawTarget = args.find(value => !value.startsWith('--')) ?? 'http://localhost:3030'
const executionLockArgument = args
	.find(value => value.startsWith('--execution-lock='))
	?.slice('--execution-lock='.length)

function normalizeTarget(value) {
	if (/^[a-z][a-z\d+.-]*:/iu.test(value)) return value
	return pathToFileURL(resolve(value)).href
}

const BASE = normalizeTarget(rawTarget)

const RENDER_ROUTES = new Set([
	'diagram:mermaid',
	'figure:comparison',
	'figure:annotated',
	'figure:graph',
	'diagram:elk',
	'direct-svg',
])
const PROGRAMMATIC_VISUAL_EXTENSIONS = new Set([
	'.cjs',
	'.js',
	'.jsx',
	'.mjs',
	'.ts',
	'.tsx',
	'.vue',
])

async function existingFile(path) {
	try {
		return (await stat(path)).isFile()
	}
	catch {
		return false
	}
}

function localPath(value) {
	if (value.startsWith('file:')) return fileURLToPath(value)
	if (/^[a-z][a-z\d+.-]*:/iu.test(value)) return null
	return resolve(value)
}

async function resolveExecutionLockPath() {
	if (executionLockArgument === '') {
		throw new Error('--execution-lock requires a file path')
	}
	const explicitPath = executionLockArgument
		? localPath(executionLockArgument)
		: null
	if (executionLockArgument && !explicitPath) {
		throw new Error('--execution-lock must resolve to a local JSON file')
	}
	const targetPath = localPath(rawTarget)
	const candidates = [
		explicitPath,
		targetPath ? join(dirname(targetPath), '.slideblocks', 'execution-lock.json') : null,
		resolve('.slideblocks', 'execution-lock.json'),
	].filter(Boolean)
	for (const candidate of candidates) {
		if (await existingFile(candidate)) return candidate
	}
	throw new Error(
		'Execution lock is required for runtime layout QA; pass --execution-lock=<project>/.slideblocks/execution-lock.json',
	)
}

function collectEvidenceRefs(page, mode) {
	const refs = []
	for (const region of page?.canvas ?? []) {
		for (const evidence of region?.evidence ?? []) {
			const fallback = typeof evidence?.static === 'string'
				? evidence.static.match(/^asset:(A\d{2})$/u)?.[1]
				: null
			const selected = mode === 'offline' && fallback
				? [fallback]
				: evidence?.refs ?? []
			for (const ref of selected) {
				if (/^A\d{2}$/u.test(ref) && !refs.includes(ref)) refs.push(ref)
			}
		}
	}
	return refs
}

async function loadExecutionRouteContract() {
	const path = await resolveExecutionLockPath()
	let lock
	try {
		lock = JSON.parse(await readFile(path, 'utf8'))
	}
	catch (error) {
		throw new Error(`Execution lock is not valid JSON: ${path}`, { cause: error })
	}
	if (!Array.isArray(lock?.slideOrder) || !lock.composition?.pages) {
		throw new Error(`Execution lock lacks slideOrder or composition.pages: ${path}`)
	}
	const assets = new Map()
	for (const asset of lock.requiredAssets ?? []) {
		if (asset?.id === undefined) continue
		if (!/^A\d{2}$/u.test(asset.id) || assets.has(asset.id)) {
			throw new Error(`Execution lock has an invalid or duplicate required asset ID: ${asset?.id ?? '(missing)'}`)
		}
		assets.set(asset.id, asset)
	}
	const pages = {}
	for (const [index, pageId] of lock.slideOrder.entries()) {
		const page = lock.composition.pages[pageId]
		if (!page) throw new Error(`Execution lock has no composition page for ${pageId}`)
		const byMode = {}
		for (const mode of ['live', 'offline']) {
			const expected = []
			for (const id of collectEvidenceRefs(page, mode)) {
				const asset = assets.get(id)
				if (!asset) throw new Error(`${pageId} references ${id}, which is absent from requiredAssets`)
				const codeBacked = PROGRAMMATIC_VISUAL_EXTENSIONS.has(
					extname(asset.path ?? '').toLowerCase(),
				)
				if (codeBacked && !RENDER_ROUTES.has(asset.renderRoute)) {
					throw new Error(`${pageId} requires code-backed ${id} without a supported renderRoute`)
				}
				if (RENDER_ROUTES.has(asset.renderRoute)) {
					expected.push({ assetId: id, renderRoute: asset.renderRoute })
				}
			}
			byMode[mode] = expected
		}
		pages[index + 1] = byMode
	}
	return { pages, path }
}

const EXECUTION_ROUTE_CONTRACT = await loadExecutionRouteContract().catch((error) => {
	console.error(
		`FAIL  [route-contract] ${error instanceof Error ? error.message : String(error)}`,
	)
	process.exit(1)
})

const LAYOUT_LIMITS = Object.freeze({
	bodyFooterGap: 20,
	boxClearance: 8,
	epsilon: 1.5,
	headerBodyGap: 24,
	slideTextInset: 16,
	svgBoxClearance: 8,
	svgEdgeLabelInsetX: 8,
	svgEdgeLabelInsetY: 5,
	svgEdgeLabelMarkerClearance: 6,
	svgEdgeLabelNodeClearance: 8,
	svgEdgeLabelPathClearance: 6,
	svgNodeTextInsetX: 16,
	svgNodeTextInsetY: 10,
})

if (!['chromium', 'webkit'].includes(browserName)) {
	throw new Error(`Unsupported browser ${browserName}; expected chromium or webkit`)
}

const packageName = browserName === 'webkit' ? 'playwright-webkit' : 'playwright-chromium'
let playwright
try {
	playwright = await import(packageName)
}
catch (error) {
	throw new Error(
		`Install ${packageName} before running the ${browserName} workbench check`,
		{ cause: error },
	)
}
const browserType = playwright[browserName]

const FIXED_MENU_ITEMS = [
	'Show drawing toolbar',
	'Show slide overview',
	'Enter Presenter Mode',
	'Enter fullscreen',
]
const results = []
const diagnostics = []

function formatError(error) {
	return error instanceof Error ? error.message : String(error)
}

function record(status, name, detail = '') {
	const result = { status, name, detail }
	results.push(result)
	console.log(
		`${status.toUpperCase()}  [${browserName}] ${name}${detail ? `  — ${detail}` : ''}`,
	)
}

const pass = (name, detail = '') => record('pass', name, detail)
const fail = (name, detail) => record('fail', name, detail)
const skip = (name, detail) => record('skip', name, detail)

function currentSlideNumber(rawUrl) {
	const url = new URL(rawUrl)
	const hashMatch = url.hash.match(/^#\/(?:presenter\/)?(\d+)\b/u)
	if (hashMatch) return Number(hashMatch[1])
	const pathMatch = url.pathname.match(/\/(?:presenter\/)?(\d+)\/?$/u)
	return pathMatch ? Number(pathMatch[1]) : 1
}

function presenterSlideNumber(rawUrl) {
	const url = new URL(rawUrl)
	const hashMatch = url.hash.match(/^#\/presenter\/(\d+)\b/u)
	if (hashMatch) return Number(hashMatch[1])
	const pathMatch = url.pathname.match(/\/presenter\/(\d+)\/?$/u)
	return pathMatch ? Number(pathMatch[1]) : null
}

function isPdfPrintUrl(rawUrl) {
	const url = new URL(rawUrl)
	const printRoute = url.hash === '#/slideblocks-pdf'
		|| /\/slideblocks-pdf\/?$/u.test(url.pathname)
	return printRoute && url.searchParams.get('print') === 'true'
}

const diagnosedPages = new WeakSet()
function attachDiagnostics(page) {
	if (diagnosedPages.has(page)) return
	diagnosedPages.add(page)
	page.on('pageerror', error => {
		diagnostics.push(`pageerror ${page.url()}: ${error.message}`)
	})
	page.on('console', message => {
		if (message.type() === 'error') {
			diagnostics.push(`console ${page.url()}: ${message.text()}`)
		}
	})
	page.on('crash', () => {
		diagnostics.push(`page crash: ${page.url()}`)
	})
}

function slideTarget(target, pageNumber) {
	const url = new URL(target)
	url.hash = `/${pageNumber}`
	return url.href
}

async function waitForStableRender(page, { settleMotion = false } = {}) {
	return page.evaluate(async ({ settleMotion }) => {
		const rendered = element => {
			const style = getComputedStyle(element)
			const rect = element.getBoundingClientRect()
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& Number.parseFloat(style.opacity || '1') > 0
				&& rect.width > 0
				&& rect.height > 0
		}

		await Promise.race([
			document.fonts.ready,
			new Promise(resolveWait => setTimeout(resolveWait, 5_000)),
		])
		const visibleImages = [...document.images].filter(rendered)
		await Promise.race([
			Promise.allSettled(visibleImages.map(image => image.decode())),
			new Promise(resolveWait => setTimeout(resolveWait, 5_000)),
		])

		const visibleMedia = [...document.querySelectorAll('audio, video')].filter(rendered)
		await Promise.race([
			Promise.all(visibleMedia.map(media => media.readyState >= 1
				? Promise.resolve()
				: new Promise(resolveWait => {
						const done = () => resolveWait()
						media.addEventListener('loadedmetadata', done, { once: true })
						media.addEventListener('error', done, { once: true })
					}))),
			new Promise(resolveWait => setTimeout(resolveWait, 5_000)),
		])

		if (settleMotion && typeof document.getAnimations === 'function') {
			const finiteAnimations = document.getAnimations({ subtree: true }).filter(animation => {
				const iterations = Number(animation.effect?.getTiming?.().iterations ?? 1)
				return animation.playState === 'running' && Number.isFinite(iterations)
			})
			await Promise.race([
				Promise.allSettled(finiteAnimations.map(animation => animation.finished)),
				new Promise(resolveWait => setTimeout(resolveWait, 700)),
			])
		}

		await new Promise(resolveFrame => requestAnimationFrame(() => resolveFrame()))
		await new Promise(resolveFrame => requestAnimationFrame(() => resolveFrame()))

		return visibleImages
			.filter(image => !image.complete || image.naturalWidth < 1 || image.naturalHeight < 1)
			.map(image => image.alt || image.currentSrc.slice(0, 120) || '<unnamed image>')
	}, { settleMotion })
}

async function createReadyPage(context, target = BASE, options = {}) {
	const page = await context.newPage()
	attachDiagnostics(page)
	page.setDefaultTimeout(8_000)
	page.setDefaultNavigationTimeout(10_000)
	await page.goto(target, { waitUntil: 'domcontentloaded' })
	await page.locator('#slide-container').waitFor({ state: 'visible' })
	await waitForStableRender(page, options)
	return page
}

async function inspectCurrentSlide(page, { expectedRoutes, pageNumber, state }) {
	const brokenAssets = await waitForStableRender(page, { settleMotion: true })
	const issues = await page.evaluate(async ({ expectedRoutes, limits }) => {
		const output = []
		const renderChainVisible = (element) => {
			let current = element
			while (current instanceof Element) {
				const style = getComputedStyle(current)
				if (style.display === 'none'
					|| style.visibility === 'hidden'
					|| Number.parseFloat(style.opacity || '1') <= 0) return false
				current = current.parentElement
			}
			return true
		}
		const visuallyRendered = element => {
			const rect = element.getBoundingClientRect()
			return rect.width > 0 && rect.height > 0 && renderChainVisible(element)
		}
		const visible = element => visuallyRendered(element)
			&& !element.closest('[aria-hidden="true"]')
		const slides = [...document.querySelectorAll('#slide-content .slidev-page, #slide-container .slidev-page')]
		const slide = slides.find(visible)
		if (!(slide instanceof HTMLElement)) {
			return [{
				actualPx: 0,
				code: 'SLIDE_MISSING',
				detail: 'No visible Slidev page exists',
				element: '#slide-content .slidev-page',
				requiredPx: 1,
			}]
		}

		const slideRect = slide.getBoundingClientRect()
		const scaleX = slideRect.width / (slide.offsetWidth || slideRect.width || 1)
		const scaleY = slideRect.height / (slide.offsetHeight || slideRect.height || 1)
		const scale = Math.max(0.0001, Math.min(scaleX, scaleY))
		const epsilon = limits.epsilon * scale
		const native = value => Math.round((value / scale) * 10) / 10
		const rounded = value => Math.round(value * 10) / 10
		const transparent = (value) => {
			const normalized = value?.trim().toLowerCase()
			if (!normalized || normalized === 'none' || normalized === 'transparent') return true
			if (/^#[\da-f]{4}$/u.test(normalized)) return normalized.endsWith('0')
			if (/^#[\da-f]{8}$/u.test(normalized)) return normalized.endsWith('00')
			return /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/u.test(normalized)
				|| /\/\s*0(?:\.0+)?%?\s*\)$/u.test(normalized)
		}
		const describe = element => {
			if (!(element instanceof Element)) return '<unknown>'
			if (element.id) return `${element.localName}#${element.id}`
			const classes = [...element.classList].slice(0, 3)
			const suffix = classes.length > 0 ? `.${classes.join('.')}` : ''
			const label = element.getAttribute('aria-label')
				|| element.textContent?.trim().replace(/\s+/gu, ' ').slice(0, 36)
			return `${element.localName}${suffix}${label ? ` "${label}"` : ''}`
		}
		const add = (code, element, actualPx, requiredPx, detail = '') => {
			output.push({
				actualPx: rounded(actualPx),
				code,
				detail,
				element: typeof element === 'string' ? element : describe(element),
				requiredPx: rounded(requiredPx),
			})
		}
		const within = (inner, outer, inset = 0) => inner.left >= outer.left + inset - epsilon
			&& inner.top >= outer.top + inset - epsilon
			&& inner.right <= outer.right - inset + epsilon
			&& inner.bottom <= outer.bottom - inset + epsilon
		const intersection = (left, right) => left.left < right.right - epsilon
			&& left.right > right.left + epsilon
			&& left.top < right.bottom - epsilon
			&& left.bottom > right.top + epsilon

		const textRecords = []
		const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT)
		while (walker.nextNode()) {
			const node = walker.currentNode
			const parent = node.parentElement
			if (!(parent instanceof HTMLElement)) continue
			if (parent.closest('script, style, noscript')) continue
			if (parent.closest('svg') && !parent.closest('foreignObject')) continue
			if (!visuallyRendered(parent)) continue
			const raw = node.nodeValue ?? ''
			const start = raw.search(/\S/u)
			if (start < 0) continue
			let end = raw.length
			while (end > start && /\s/u.test(raw[end - 1])) end -= 1
			const range = document.createRange()
			range.setStart(node, start)
			range.setEnd(node, end)
			const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0)
			for (const rect of rects) textRecords.push({ parent, rect })
		}

		const slideTextInset = limits.slideTextInset * scale
		const safeSlide = {
			bottom: slideRect.bottom - slideTextInset,
			left: slideRect.left + slideTextInset,
			right: slideRect.right - slideTextInset,
			top: slideRect.top + slideTextInset,
		}
		const slideBoundsReported = new Set()
		for (const { parent, rect } of textRecords) {
			if (!within(rect, safeSlide) && !slideBoundsReported.has(parent)) {
				const escape = Math.max(
					safeSlide.left - rect.left,
					rect.right - safeSlide.right,
					safeSlide.top - rect.top,
					rect.bottom - safeSlide.bottom,
					0,
				)
				add(
					'TEXT_OUTSIDE_SLIDE',
					parent,
					native(escape),
					limits.slideTextInset,
					'visible text leaves the slide text-safe inset',
				)
				slideBoundsReported.add(parent)
			}
		}

		const scrollReported = new Set()
		for (const { parent } of textRecords) {
			let block = parent
			while (block !== slide) {
				const display = getComputedStyle(block).display
				if (display !== 'inline' && display !== 'contents') break
				if (!(block.parentElement instanceof HTMLElement)) break
				block = block.parentElement
			}
			if (scrollReported.has(block) || block.clientWidth < 1 || block.clientHeight < 1) continue
			const overflowX = block.scrollWidth - block.clientWidth
			const overflowY = block.scrollHeight - block.clientHeight
			if (overflowX > Math.max(limits.epsilon, 2)) {
				add('TEXT_OVERFLOW_X', block, overflowX, 0, 'scrollWidth exceeds clientWidth')
			}
			if (overflowY > Math.max(limits.epsilon, 4)) {
				add('TEXT_OVERFLOW_Y', block, overflowY, 0, 'scrollHeight exceeds clientHeight')
			}
			scrollReported.add(block)
		}

		const rawMathScriptPairs = [...slide.querySelectorAll('sup + sub, sub + sup')]
			.filter((secondScript) => {
				const firstScript = secondScript.previousElementSibling
				if (!(firstScript instanceof HTMLElement)
					|| !visuallyRendered(firstScript)
					|| !visuallyRendered(secondScript)) return false

				let interveningNode = firstScript.nextSibling
				while (interveningNode && interveningNode !== secondScript) {
					if (interveningNode.nodeType === Node.ELEMENT_NODE
						|| (interveningNode.nodeType === Node.TEXT_NODE
							&& (interveningNode.textContent ?? '').trim())) return false
					interveningNode = interveningNode.nextSibling
				}
				return interveningNode === secondScript
			})
		for (const secondScript of rawMathScriptPairs) {
			add(
				'RAW_MATH_SCRIPT_PAIR',
				secondScript.parentElement ?? secondScript,
				1,
				0,
				'adjacent raw sup/sub elements are sequential inline boxes; use one KaTeX math atom',
			)
		}

		const borderWidth = (style, side) => Number.parseFloat(style[`border${side}Width`]) || 0
		const hasVisibleBorder = style => ['Top', 'Right', 'Bottom', 'Left'].some(side => {
			const width = borderWidth(style, side)
			const borderStyle = style[`border${side}Style`]
			const color = style[`border${side}Color`]
			return width > 0 && borderStyle !== 'none' && !transparent(color)
		})
		const establishesOwner = element => {
			const style = getComputedStyle(element)
			return element.hasAttribute('data-slideblocks-box')
				|| element.matches('button, [role="tab"], [role="cell"], td, th')
				|| style.overflowX !== 'visible'
				|| style.overflowY !== 'visible'
				|| hasVisibleBorder(style)
		}
		const ownerReported = new Set()
		for (const { parent, rect } of textRecords) {
			let owner = parent
			while (owner !== slide && !establishesOwner(owner)) owner = owner.parentElement
			if (!(owner instanceof HTMLElement) || owner === slide) continue
			const key = `${describe(parent)}@@${describe(owner)}`
			if (ownerReported.has(key)) continue
			const ownerRect = owner.getBoundingClientRect()
			const style = getComputedStyle(owner)
			const clippedX = style.overflowX !== 'visible'
			const clippedY = style.overflowY !== 'visible'
			const boxed = owner.hasAttribute('data-slideblocks-box')
				|| owner.matches('button, [role="tab"], [role="cell"], td, th')
			const activeSide = side => boxed
				|| (side === 'Left' || side === 'Right' ? clippedX : clippedY)
				|| (
					borderWidth(style, side) > 0
					&& style[`border${side}Style`] !== 'none'
					&& !transparent(style[`border${side}Color`])
				)
			const inside = {
				bottom: activeSide('Bottom')
					? ownerRect.bottom - borderWidth(style, 'Bottom') - limits.boxClearance * scale
					: Number.POSITIVE_INFINITY,
				left: activeSide('Left')
					? ownerRect.left + borderWidth(style, 'Left') + limits.boxClearance * scale
					: Number.NEGATIVE_INFINITY,
				right: activeSide('Right')
					? ownerRect.right - borderWidth(style, 'Right') - limits.boxClearance * scale
					: Number.POSITIVE_INFINITY,
				top: activeSide('Top')
					? ownerRect.top + borderWidth(style, 'Top') + limits.boxClearance * scale
					: Number.NEGATIVE_INFINITY,
			}
			if (!within(rect, inside)) {
				const clearances = [
					activeSide('Left') ? rect.left - ownerRect.left : Number.POSITIVE_INFINITY,
					activeSide('Right') ? ownerRect.right - rect.right : Number.POSITIVE_INFINITY,
					activeSide('Top') ? rect.top - ownerRect.top : Number.POSITIVE_INFINITY,
					activeSide('Bottom') ? ownerRect.bottom - rect.bottom : Number.POSITIVE_INFINITY,
				]
				const clearance = Math.min(...clearances)
				add(
					'TEXT_OUTSIDE_OWNER',
					parent,
					native(clearance),
					limits.boxClearance,
					`nearest bordered or clipped owner: ${describe(owner)}`,
				)
				ownerReported.add(key)
			}
		}

		const ruleSegments = []
		const htmlElements = [...slide.querySelectorAll('*')]
			.filter(element => element instanceof HTMLElement && visuallyRendered(element))
			.slice(0, 4096)
		for (const element of htmlElements) {
			const rect = element.getBoundingClientRect()
			const style = getComputedStyle(element)
			const borders = [
				['Top', { bottom: rect.top + borderWidth(style, 'Top'), left: rect.left, right: rect.right, top: rect.top }],
				['Right', { bottom: rect.bottom, left: rect.right - borderWidth(style, 'Right'), right: rect.right, top: rect.top }],
				['Bottom', { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.bottom - borderWidth(style, 'Bottom') }],
				['Left', { bottom: rect.bottom, left: rect.left, right: rect.left + borderWidth(style, 'Left'), top: rect.top }],
			]
			for (const [side, segment] of borders) {
				const width = borderWidth(style, side)
				if (
					width > 0
					&& style[`border${side}Style`] !== 'none'
					&& !transparent(style[`border${side}Color`])
				) {
					ruleSegments.push({ element, rect: segment })
				}
			}
			const hasText = Boolean(element.textContent?.trim())
			const painted = !transparent(style.backgroundColor) || hasVisibleBorder(style)
			const horizontal = rect.height <= 4 * scale && rect.width >= 16 * scale
			const vertical = rect.width <= 4 * scale && rect.height >= 16 * scale
			if (!hasText && painted && (horizontal || vertical)) {
				ruleSegments.push({ element, rect })
			}
		}
		const foreignReported = new Set()
		for (const { parent, rect } of textRecords) {
			for (const rule of ruleSegments) {
				if (rule.element.contains(parent) || parent.contains(rule.element)) continue
				if (!intersection(rect, rule.rect)) continue
				const key = `${describe(parent)}@@${describe(rule.element)}`
				if (foreignReported.has(key)) continue
				add(
					'TEXT_CROSSES_FOREIGN_RULE',
					parent,
					0,
					0,
					`crosses border or thin rule owned by ${describe(rule.element)}`,
				)
				foreignReported.add(key)
			}
		}

		const root = slide.querySelector('.sb-slide') ?? slide.querySelector('.slidev-layout') ?? slide
		const regionElements = kind => {
			const selectors = kind === 'header'
				? [`[data-slideblocks-region="header"]`, ':scope > header']
				: kind === 'body'
					? [`[data-slideblocks-region="body"]`, ':scope > main', ':scope > .sb-body']
					: [`[data-slideblocks-region="footer"]`, ':scope > footer', ':scope > .sb-footer']
			return [...new Set(selectors.flatMap(selector => [...root.querySelectorAll(selector)]))]
				.filter(visuallyRendered)
		}
		const unionRect = elements => {
			if (elements.length < 1) return null
			const rects = elements.map(element => element.getBoundingClientRect())
			return {
				bottom: Math.max(...rects.map(rect => rect.bottom)),
				left: Math.min(...rects.map(rect => rect.left)),
				right: Math.max(...rects.map(rect => rect.right)),
				top: Math.min(...rects.map(rect => rect.top)),
			}
		}
		const header = unionRect(regionElements('header'))
		const body = unionRect(regionElements('body'))
		const footer = unionRect(regionElements('footer'))
		const routedVisualRoots = [
			...(root.matches?.('[data-slideblocks-render-route]') ? [root] : []),
			...root.querySelectorAll('[data-slideblocks-render-route]'),
		].filter(visuallyRendered)
		if (routedVisualRoots.length > 0 && (!header || !body)) {
			add(
				'REGION_CONTRACT_MISSING',
				describe(root),
				Number(Boolean(header)) + Number(Boolean(body)),
				2,
				'a routed visual page must expose measurable header and body regions',
			)
		}
		if (header && body) {
			const gap = native(body.top - header.bottom)
			if (gap < limits.headerBodyGap - limits.epsilon) {
				add('HEADER_BODY_GAP', 'header -> body', gap, limits.headerBodyGap)
			}
		}
		if (body && footer) {
			const gap = native(footer.top - body.bottom)
			if (gap < limits.bodyFooterGap - limits.epsilon) {
				add('BODY_FOOTER_GAP', 'body -> footer', gap, limits.bodyFooterGap)
			}
		}

		const declaredRegions = [...new Set([
			...root.querySelectorAll('[data-slideblocks-region]'),
			...root.querySelectorAll(':scope > header, :scope > main, :scope > footer, :scope > .sb-body, :scope > .sb-footer'),
		])].filter(visuallyRendered)
		for (let leftIndex = 0; leftIndex < declaredRegions.length; leftIndex += 1) {
			const leftRegion = declaredRegions[leftIndex]
			for (let rightIndex = leftIndex + 1; rightIndex < declaredRegions.length; rightIndex += 1) {
				const rightRegion = declaredRegions[rightIndex]
				if (leftRegion.contains(rightRegion) || rightRegion.contains(leftRegion)) continue
				const leftRect = leftRegion.getBoundingClientRect()
				const rightRect = rightRegion.getBoundingClientRect()
				if (!intersection(leftRect, rightRect)) continue
				const overlapWidth = Math.min(leftRect.right, rightRect.right)
					- Math.max(leftRect.left, rightRect.left)
				const overlapHeight = Math.min(leftRect.bottom, rightRect.bottom)
					- Math.max(leftRect.top, rightRect.top)
				add(
					'REGION_OVERLAP',
					`${describe(leftRegion)} <> ${describe(rightRegion)}`,
					native(Math.min(overlapWidth, overlapHeight)),
					0,
					'declared macro regions intersect',
				)
			}
		}

		const svgScreenBox = element => {
			try {
				const box = element.getBBox()
				const matrix = element.getScreenCTM()
				if (!matrix) return null
				const points = [
					new DOMPoint(box.x, box.y),
					new DOMPoint(box.x + box.width, box.y),
					new DOMPoint(box.x + box.width, box.y + box.height),
					new DOMPoint(box.x, box.y + box.height),
				].map(point => point.matrixTransform(matrix))
				return {
					bottom: Math.max(...points.map(point => point.y)),
					left: Math.min(...points.map(point => point.x)),
					right: Math.max(...points.map(point => point.x)),
					top: Math.min(...points.map(point => point.y)),
				}
			}
			catch {
				return null
			}
		}
		const svgScreenScale = element => {
			const matrix = element.getScreenCTM()
			if (!matrix) return 1
			return Math.max(
				Math.hypot(matrix.a, matrix.b),
				Math.hypot(matrix.c, matrix.d),
				0.0001,
			)
		}
		const svgStrokeWidth = element => {
			const style = getComputedStyle(element)
			const stroke = style.stroke
			const opacity = Number.parseFloat(element.getAttribute('opacity') ?? style.opacity ?? '1')
			const strokeOpacity = Number.parseFloat(
				element.getAttribute('stroke-opacity') ?? style.strokeOpacity ?? '1',
			)
			if (opacity <= 0 || strokeOpacity <= 0 || transparent(stroke)) return 0
			const localWidth = Number.parseFloat(element.getAttribute('stroke-width') ?? style.strokeWidth)
			if (!Number.isFinite(localWidth) || localWidth <= 0) return 0
			return style.vectorEffect === 'non-scaling-stroke'
				? localWidth
				: localWidth * svgScreenScale(element)
		}
		const svgFillPainted = (element) => {
			if (!renderChainVisible(element)) return false
			const style = getComputedStyle(element)
			const opacity = Number.parseFloat(element.getAttribute('opacity') ?? style.opacity ?? '1')
			const fillOpacity = Number.parseFloat(
				element.getAttribute('fill-opacity') ?? style.fillOpacity ?? '1',
			)
			return opacity > 0 && fillOpacity > 0 && !transparent(style.fill)
		}
		const SVG_PAINT_SHAPES = 'path,rect,circle,ellipse,line,polyline,polygon'
		const paintedSvgShapes = element => {
			const candidates = element.matches?.(SVG_PAINT_SHAPES)
				? [element]
				: [...element.querySelectorAll(SVG_PAINT_SHAPES)]
			return candidates.filter((shape) => {
				if (!visuallyRendered(shape)) return false
				const style = getComputedStyle(shape)
				const opacity = Number.parseFloat(shape.getAttribute('opacity') ?? style.opacity ?? '1')
				const fillOpacity = Number.parseFloat(
					shape.getAttribute('fill-opacity') ?? style.fillOpacity ?? '1',
				)
				const strokeOpacity = Number.parseFloat(
					shape.getAttribute('stroke-opacity') ?? style.strokeOpacity ?? '1',
				)
				const fill = style.fill
				const stroke = style.stroke
				const fillPainted = opacity > 0 && fillOpacity > 0 && !transparent(fill)
				const strokePainted = opacity > 0
					&& strokeOpacity > 0
					&& !transparent(stroke)
					&& svgStrokeWidth(shape) > 0
				if (!fillPainted && !strokePainted) return false
				const box = svgScreenBox(shape)
				const strokeInset = strokePainted ? svgStrokeWidth(shape) / 2 : 0
				return Boolean(box)
					&& box.right - box.left + strokeInset * 2 > epsilon
					&& box.bottom - box.top + strokeInset * 2 > epsilon
			})
		}
		const expandScreenRect = (rect, amount) => ({
			bottom: rect.bottom + amount,
			left: rect.left - amount,
			right: rect.right + amount,
			top: rect.top - amount,
		})
		const pointRectClearance = (point, rect) => {
			const dx = Math.max(rect.left - point.x, 0, point.x - rect.right)
			const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom)
			return Math.hypot(dx, dy)
		}
		const rectRectClearance = (left, right) => {
			const dx = Math.max(left.left - right.right, right.left - left.right, 0)
			const dy = Math.max(left.top - right.bottom, right.top - left.bottom, 0)
			return Math.hypot(dx, dy)
		}
		const geometrySamples = new WeakMap()
		const sampleSvgGeometry = element => {
			if (geometrySamples.has(element)) return geometrySamples.get(element)
			let samples = []
			try {
				const length = element.getTotalLength()
				const matrix = element.getScreenCTM()
				if (matrix && Number.isFinite(length) && length >= 0) {
					const screenLength = length * svgScreenScale(element)
					const sampleCount = Math.min(4096, Math.max(1, Math.ceil(screenLength)))
					samples = Array.from({ length: sampleCount + 1 }, (_, index) => {
						const point = element.getPointAtLength(length * index / sampleCount)
						const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix)
						return { x: screenPoint.x, y: screenPoint.y }
					})
				}
			}
			catch {
				samples = []
			}
			geometrySamples.set(element, samples)
			return samples
		}
		const markerReference = (svg, path, position) => {
			const style = getComputedStyle(path)
			const property = position === 'start' ? 'markerStart' : 'markerEnd'
			const raw = path.getAttribute(`marker-${position}`) ?? style[property]
			const match = raw?.match(/#([^)'"\s]+)/u)
			if (!match) return null
			let id = match[1]
			try {
				id = decodeURIComponent(id)
			}
			catch {
				// Keep the literal fragment when it is not URI encoded.
			}
			return svg.querySelector(`marker#${CSS.escape(id)}`)
		}
		const pointInScreenRect = (point, rect) => point.x >= rect.left
			&& point.x <= rect.right
			&& point.y >= rect.top
			&& point.y <= rect.bottom
		const pointInPolygon = (point, polygon) => {
			let inside = false
			for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
				const left = polygon[index]
				const right = polygon[previous]
				const crosses = (left.y > point.y) !== (right.y > point.y)
					&& point.x < (right.x - left.x) * (point.y - left.y)
						/ ((right.y - left.y) || Number.EPSILON) + left.x
				if (crosses) inside = !inside
			}
			return inside
		}
		const orientation = (start, end, point) => (end.x - start.x) * (point.y - start.y)
			- (end.y - start.y) * (point.x - start.x)
		const pointOnSegment = (point, start, end) => Math.abs(orientation(start, end, point)) <= 0.01
			&& point.x >= Math.min(start.x, end.x) - 0.01
			&& point.x <= Math.max(start.x, end.x) + 0.01
			&& point.y >= Math.min(start.y, end.y) - 0.01
			&& point.y <= Math.max(start.y, end.y) + 0.01
		const segmentsIntersect = (a, b, c, d) => {
			const abC = orientation(a, b, c)
			const abD = orientation(a, b, d)
			const cdA = orientation(c, d, a)
			const cdB = orientation(c, d, b)
			if ((abC > 0 && abD < 0 || abC < 0 && abD > 0)
				&& (cdA > 0 && cdB < 0 || cdA < 0 && cdB > 0)) return true
			return pointOnSegment(c, a, b)
				|| pointOnSegment(d, a, b)
				|| pointOnSegment(a, c, d)
				|| pointOnSegment(b, c, d)
		}
		const pointSegmentClearance = (point, start, end) => {
			const dx = end.x - start.x
			const dy = end.y - start.y
			const lengthSquared = dx * dx + dy * dy
			if (lengthSquared <= Number.EPSILON) return Math.hypot(point.x - start.x, point.y - start.y)
			const ratio = Math.max(0, Math.min(1,
				((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
			))
			return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy))
		}
		const segmentClearance = (a, b, c, d) => segmentsIntersect(a, b, c, d)
			? 0
			: Math.min(
					pointSegmentClearance(a, c, d),
					pointSegmentClearance(b, c, d),
					pointSegmentClearance(c, a, b),
					pointSegmentClearance(d, a, b),
				)
		const rectPolylineClearance = (rect, points) => {
			if (points.length < 1) return Number.POSITIVE_INFINITY
			if (points.some(point => pointInScreenRect(point, rect))) return 0
			const corners = [
				{ x: rect.left, y: rect.top },
				{ x: rect.right, y: rect.top },
				{ x: rect.right, y: rect.bottom },
				{ x: rect.left, y: rect.bottom },
			]
			if (points.length === 1) return pointRectClearance(points[0], rect)
			let clearance = Number.POSITIVE_INFINITY
			for (let index = 1; index < points.length; index += 1) {
				const start = points[index - 1]
				const end = points[index]
				for (let edge = 0; edge < corners.length; edge += 1) {
					if (segmentsIntersect(start, end, corners[edge], corners[(edge + 1) % corners.length])) {
						return 0
					}
				}
				clearance = Math.min(
					clearance,
					...corners.map(corner => pointSegmentClearance(corner, start, end)),
					pointRectClearance(start, rect),
					pointRectClearance(end, rect),
				)
			}
			return clearance
		}
		const rectPolygonClearance = (rect, polygon) => {
			const rectangle = [
				{ x: rect.left, y: rect.top },
				{ x: rect.right, y: rect.top },
				{ x: rect.right, y: rect.bottom },
				{ x: rect.left, y: rect.bottom },
			]
			if (polygon.some(point => pointInScreenRect(point, rect))
				|| rectangle.some(point => pointInPolygon(point, polygon))) return 0
			let clearance = Number.POSITIVE_INFINITY
			for (let leftIndex = 0; leftIndex < polygon.length; leftIndex += 1) {
				const leftStart = polygon[leftIndex]
				const leftEnd = polygon[(leftIndex + 1) % polygon.length]
				for (let rightIndex = 0; rightIndex < rectangle.length; rightIndex += 1) {
					clearance = Math.min(clearance, segmentClearance(
						leftStart,
						leftEnd,
						rectangle[rightIndex],
						rectangle[(rightIndex + 1) % rectangle.length],
					))
				}
			}
			return clearance
		}
		const markerGeometryCache = new WeakMap()
		const markerGeometry = (svg, path, position) => {
			const cached = markerGeometryCache.get(path)?.[position]
			if (cached !== undefined) return cached
			const marker = markerReference(svg, path, position)
			if (!marker) return null
			let result
			try {
				const length = path.getTotalLength()
				const pathMatrix = path.getScreenCTM()
				const svgMatrix = svg.getScreenCTM()
				const svgLengthValue = (animatedLength, raw) => {
					const value = animatedLength?.baseVal?.value
					return Number.isFinite(value) ? value : Number.parseFloat(raw ?? '')
				}
				const width = svgLengthValue(marker.markerWidth, marker.getAttribute('markerWidth'))
				const height = svgLengthValue(marker.markerHeight, marker.getAttribute('markerHeight'))
				if (!pathMatrix || !svgMatrix || !Number.isFinite(length)
					|| !Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
					throw new Error('marker instance has no finite path or viewport geometry')
				}
				const endpointLength = position === 'start' ? 0 : length
				const tangentStep = Math.min(Math.max(length / 1000, 0.01), 1)
				const endpoint = path.getPointAtLength(endpointLength)
				const neighboring = path.getPointAtLength(position === 'start'
					? Math.min(length, tangentStep)
					: Math.max(0, length - tangentStep))
				const tangent = position === 'start'
					? { x: neighboring.x - endpoint.x, y: neighboring.y - endpoint.y }
					: { x: endpoint.x - neighboring.x, y: endpoint.y - neighboring.y }
				if (Math.hypot(tangent.x, tangent.y) <= Number.EPSILON) {
					throw new Error('marker path has no resolvable endpoint tangent')
				}
				const orient = marker.getAttribute('orient') ?? '0'
				let angle = /^auto(?:-start-reverse)?$/u.test(orient)
					? Math.atan2(tangent.y, tangent.x) * 180 / Math.PI
					: marker.orientAngle?.baseVal?.value ?? Number.parseFloat(orient)
				if (orient === 'auto-start-reverse' && position === 'start') angle += 180
				if (!Number.isFinite(angle)) throw new Error(`unsupported marker orient ${orient}`)

				const viewBox = marker.viewBox?.baseVal
				const hasViewBox = marker.hasAttribute('viewBox')
					&& viewBox && viewBox.width > 0 && viewBox.height > 0
				const preserve = (marker.getAttribute('preserveAspectRatio') || 'xMidYMid meet')
					.trim()
					.replace(/^defer\s+/u, '')
				const mapViewBoxPoint = point => {
					if (!hasViewBox) return { x: point.x, y: point.y }
					const scaleX = width / viewBox.width
					const scaleY = height / viewBox.height
					if (preserve.startsWith('none')) {
						return {
							x: (point.x - viewBox.x) * scaleX,
							y: (point.y - viewBox.y) * scaleY,
						}
					}
					const scaleToUse = preserve.endsWith('slice')
						? Math.max(scaleX, scaleY)
						: Math.min(scaleX, scaleY)
					const align = preserve.split(/\s+/u)[0]
					const alignX = align.includes('xMin') ? 0 : align.includes('xMax') ? 1 : 0.5
					const alignY = align.includes('YMin') ? 0 : align.includes('YMax') ? 1 : 0.5
					return {
						x: (point.x - viewBox.x) * scaleToUse
							+ (width - viewBox.width * scaleToUse) * alignX,
						y: (point.y - viewBox.y) * scaleToUse
							+ (height - viewBox.height * scaleToUse) * alignY,
					}
				}
				const ref = mapViewBoxPoint({
					x: svgLengthValue(marker.refX, marker.getAttribute('refX')) || 0,
					y: svgLengthValue(marker.refY, marker.getAttribute('refY')) || 0,
				})
				const localStrokeWidth = Number.parseFloat(
					path.getAttribute('stroke-width') ?? getComputedStyle(path).strokeWidth,
				) || 1
				const unitsScale = (marker.getAttribute('markerUnits') ?? 'strokeWidth') === 'strokeWidth'
					? localStrokeWidth
					: 1
				const radians = angle * Math.PI / 180
				const cosine = Math.cos(radians)
				const sine = Math.sin(radians)
				const svgInverse = svgMatrix.inverse()
				const markerElements = [...marker.querySelectorAll(
					'path, rect, circle, ellipse, line, polyline, polygon, text, use',
				)]
				const unresolvedElement = [...marker.querySelectorAll('*')].find(element => {
					const style = getComputedStyle(element)
					return element.matches('image, foreignObject')
						|| (style.filter && style.filter !== 'none')
				})
				if (unresolvedElement) {
					throw new Error(`unsupported painted marker child ${unresolvedElement.localName}`)
				}
				const polygons = markerElements.flatMap(element => {
					const style = getComputedStyle(element)
					const opacity = Number.parseFloat(element.getAttribute('opacity') ?? style.opacity ?? '1')
					const fillOpacity = Number.parseFloat(
						element.getAttribute('fill-opacity') ?? style.fillOpacity ?? '1',
					)
					const strokeOpacity = Number.parseFloat(
						element.getAttribute('stroke-opacity') ?? style.strokeOpacity ?? '1',
					)
					const fill = style.fill
					const stroke = style.stroke
					const paintedFill = opacity > 0 && fillOpacity > 0 && !transparent(fill)
					const paintedStroke = opacity > 0 && strokeOpacity > 0 && !transparent(stroke)
					if ((!paintedFill && !paintedStroke)
						|| style.display === 'none' || style.visibility === 'hidden') return []
					const box = element.getBBox()
					const elementMatrix = element.getScreenCTM()
					if (!elementMatrix) return []
					const strokeInset = paintedStroke
						? (Number.parseFloat(element.getAttribute('stroke-width') ?? style.strokeWidth) || 0) / 2
						: 0
					const localCorners = [
						new DOMPoint(box.x - strokeInset, box.y - strokeInset),
						new DOMPoint(box.x + box.width + strokeInset, box.y - strokeInset),
						new DOMPoint(box.x + box.width + strokeInset, box.y + box.height + strokeInset),
						new DOMPoint(box.x - strokeInset, box.y + box.height + strokeInset),
					]
					const elementToMarker = svgInverse.multiply(elementMatrix)
					return [localCorners.map(localPoint => {
						const markerPoint = localPoint.matrixTransform(elementToMarker)
						const viewportPoint = mapViewBoxPoint(markerPoint)
						const shiftedX = (viewportPoint.x - ref.x) * unitsScale
						const shiftedY = (viewportPoint.y - ref.y) * unitsScale
						const pathPoint = new DOMPoint(
							endpoint.x + shiftedX * cosine - shiftedY * sine,
							endpoint.y + shiftedX * sine + shiftedY * cosine,
						)
						const screenPoint = pathPoint.matrixTransform(pathMatrix)
						return { x: screenPoint.x, y: screenPoint.y }
					})]
				})
				if (polygons.length < 1) throw new Error('marker has no measurable painted child geometry')
				result = { markerId: marker.id || '(anonymous)', polygons }
			}
			catch (error) {
				result = {
					markerId: marker.id || '(anonymous)',
					unresolved: error instanceof Error ? error.message : String(error),
				}
			}
			const pathCache = markerGeometryCache.get(path) || {}
			pathCache[position] = result
			markerGeometryCache.set(path, pathCache)
			return result
		}
		// Native Mermaid owns its geometry and DOM. Do not apply the custom
		// DiagramSpec owner/padding model or treat its on-edge backing as a collision.
		// This is a bounded mechanical gate, not a generic Mermaid semantic parser.
		const inspectMermaid = (svg) => {
			const label = describe(svg)
			const fail = (code, detail, actual = 0, required = 1) => add(code, label, actual, required, detail)
			const version = svg.getAttribute('data-mermaid-version') || ''
			const viewBox = svg.viewBox.baseVal
			if (svg.getAttribute('data-slideblocks-mermaid') !== 'final'
				|| !/^\d+\.\d+\.\d+(?:[-+].+)?$/u.test(version)
				|| !svg.getAttribute('aria-roledescription')?.trim()
				|| !(viewBox.width > 0 && viewBox.height > 0)
				|| svg.hasAttribute('data-slideblocks-diagram')
				|| svg.querySelector('[data-node-id], [data-edge-id]')) {
				fail('MERMAID_METADATA_INVALID', 'requires native type, actual version, viewBox, final Mermaid role and no impersonated DiagramSpec ownership')
			}
			const matrix = svg.getScreenCTM()
			const xScale = matrix ? Math.hypot(matrix.a, matrix.b) : 0
			const yScale = matrix ? Math.hypot(matrix.c, matrix.d) : 0
			if (!xScale || Math.abs(xScale - yScale) / Math.max(xScale, yScale) > 0.01) {
				fail('MERMAID_DISTORTED', 'SVG must preserve its aspect ratio')
			}
			const rootBox = svg.getBoundingClientRect()
			const graphics = [...svg.querySelectorAll('path, rect, circle, ellipse, line, polygon, polyline, image, use')]
				.filter(el => !el.closest('defs, marker, clipPath, mask, pattern') && renderChainVisible(el))
				.filter(el => {
					const style = getComputedStyle(el)
					const box = svgScreenBox(el)
					if (!box) return false
					const width = box.right - box.left
					const height = box.bottom - box.top
					return (width > 0 && height > 0 && !el.matches('line')
							&& !transparent(style.fill) && Number(style.fillOpacity) > 0)
						|| (Math.max(width, height) > 0 && parseFloat(style.strokeWidth) > 0
							&& !transparent(style.stroke) && Number(style.strokeOpacity) > 0)
						|| (width > 0 && height > 0 && el.matches('image, use'))
				})
			if (!graphics.length) fail('MERMAID_EMPTY', 'native diagram has no visible graphics')
			for (const el of graphics) {
				const box = svgScreenBox(el)
				if (box && !within(box, rootBox)) {
					fail('MERMAID_GRAPHIC_OUTSIDE', `graphic ${el.id || el.localName} exceeds SVG viewport`)
				}
				for (const attr of ['marker-start', 'marker-mid', 'marker-end']) {
					const marker = getComputedStyle(el).getPropertyValue(attr)
					if (!marker || marker === 'none') continue
					const id = marker.match(/#([^)'"\s]+)/u)?.[1]
					const target = id ? document.getElementById(id) : null
					if (!target || !svg.contains(target) || target.localName !== 'marker'
						|| !target.querySelector('path, polygon, polyline, circle, rect, use')) {
						fail('MERMAID_MARKER_MISSING', `unresolved local arrowhead ${id || marker}`)
					}
				}
			}
			const walker = document.createTreeWalker(svg, NodeFilter.SHOW_TEXT)
			let node
			let textCount = 0
			while ((node = walker.nextNode())) {
				const el = node.parentElement
				if (!node.textContent.trim() || !el || el.closest('style, script, title, desc, metadata, defs')
					|| !renderChainVisible(el)) continue
				const textStyle = getComputedStyle(el)
				if (el.closest('foreignObject') ? transparent(textStyle.color)
					: transparent(textStyle.fill) && transparent(textStyle.stroke)) continue
				const range = document.createRange()
				range.selectNodeContents(node)
				const boxes = [...range.getClientRects()].filter(box => box.width > 0 && box.height > 0)
				if (!boxes.length) continue
				textCount++
				const owner = el.closest('foreignObject') || el.closest('text')
				const transform = owner?.getScreenCTM()
				// Normalize to a 1280px-wide displayed slide, not the SVG source font.
				const fontPx = parseFloat(getComputedStyle(el).fontSize)
					* (transform ? Math.min(Math.hypot(transform.a, transform.b), Math.hypot(transform.c, transform.d)) : xScale)
					* 1280 / slideRect.width
				const nodeLabel = el.closest('.node, .actor, .cluster-label')
				const minimum = nodeLabel ? 22 : 18
				if (!Number.isFinite(fontPx) || fontPx + 0.1 < minimum) {
					fail('MERMAID_TEXT_SMALL', `text ${JSON.stringify(node.textContent.trim())} at 1280px slide width`, fontPx || 0, minimum)
				}
				for (const box of boxes) {
					if (!within(box, rootBox)) fail('MERMAID_TEXT_OUTSIDE', `label ${JSON.stringify(node.textContent.trim())} exceeds SVG viewport`)
					const foreign = el.closest('foreignObject')
					if (foreign && !within(box, foreign.getBoundingClientRect())) {
						fail('MERMAID_LABEL_CLIPPED', `label ${JSON.stringify(node.textContent.trim())} exceeds its native HTML label frame`)
					}
				}
			}
			if (!textCount) fail('MERMAID_EMPTY', 'native diagram has no visible labels')
		}
		const inspectSvg = (svg, label, ignoreInheritedVisibility = false) => {
			if (svg.hasAttribute('data-slideblocks-mermaid')) inspectMermaid(svg)
			const rootRect = svg.getBoundingClientRect()
			const rootArea = rootRect.width * rootRect.height
			const finalDiagram = svg.getAttribute('data-slideblocks-diagram') === 'final'
			const semanticSelector = '[data-edge-id][data-label-id], [data-node-id]'
			const semanticDiagram = Boolean(svg.querySelector(
				'path[data-edge-id], [data-edge-id][data-label-id], [data-node-id], [data-port-id]',
			))
			const strictDiagram = finalDiagram || semanticDiagram
			let canonicalNodeOwner = null
			const canonicalNode = [...svg.querySelectorAll('[data-node-id]:not([data-port-id])')]
				.find((node) => {
					const owner = node.querySelector('[data-slideblocks-text-owner="node"]')
					const nodeBox = svgScreenBox(node)
					const ownerBox = owner ? svgScreenBox(owner) : null
					const measurable = nodeBox
						&& ownerBox
						&& nodeBox.right - nodeBox.left > epsilon
						&& nodeBox.bottom - nodeBox.top > epsilon
						&& ownerBox.right - ownerBox.left > epsilon
						&& ownerBox.bottom - ownerBox.top > epsilon
					if (!owner
						|| !measurable
						|| !visuallyRendered(node)
						|| !visuallyRendered(owner)
						|| paintedSvgShapes(owner).length < 1) return false
					canonicalNodeOwner = owner
					return true
				})
			const layoutRole = svg.getAttribute('data-layout-role')
			const layoutEngine = svg.getAttribute('data-layout-engine')
			const visualRenderer = svg.getAttribute('data-visual-renderer')
			const renderRoute = svg.getAttribute('data-slideblocks-render-route')
			const expectedRoute = layoutEngine === 'elkjs'
				? 'diagram:elk'
				: layoutEngine === 'direct-svg'
					? 'direct-svg'
					: null
			if (finalDiagram && (!canonicalNode || !canonicalNodeOwner)) {
				add(
					'SVG_FINAL_SEMANTICS_MISSING',
					label,
					canonicalNode && canonicalNodeOwner ? 1 : 0,
					1,
					'final semantic SVG must expose a canonical node and its data-slideblocks-text-owner="node" boundary',
				)
			}
			const finalMetadataMatches = [
				layoutRole === 'final',
				expectedRoute !== null,
				visualRenderer === 'slideblocks-svg',
				expectedRoute !== null && renderRoute === expectedRoute,
			].filter(Boolean).length
			if (finalDiagram && finalMetadataMatches < 4) {
				add(
					'SVG_FINAL_METADATA_MISSING',
					label,
					finalMetadataMatches,
					4,
					'final semantic SVG requires data-layout-role="final", a supported layout engine, data-visual-renderer="slideblocks-svg", and its matching render route',
				)
			}
			if (semanticDiagram && !finalDiagram) {
				add(
					'SVG_FINAL_ROLE_MISSING',
					label,
					0,
					1,
					'semantic SlideBlocks SVG must declare data-slideblocks-diagram="final"',
				)
			}
			if (svg.getAttribute('data-layout-role') === 'candidate') {
				add(
					'SVG_FINAL_ROLE_MISSING',
					label,
					0,
					1,
					'a candidate layout is visible where the final SVG is required',
				)
			}
			if (finalDiagram && layoutEngine === 'direct-svg') {
				const edgeGeometrySelector = [
					'path[data-edge-id]',
					'line[data-edge-id]',
					'polyline[data-edge-id]',
					'polygon[data-edge-id]',
				].join(',')
				const semanticElements = [...svg.querySelectorAll([
					'[data-node-id]',
					edgeGeometrySelector,
					'[data-edge-id][data-label-id]',
					'[data-port-id]',
					'[data-slideblocks-text-owner]',
				].join(','))].filter(element => element.matches(edgeGeometrySelector)
					? renderChainVisible(element)
						&& (svgStrokeWidth(element) > 0 || svgFillPainted(element))
					: visuallyRendered(element))
				const semanticPaint = []
				const seenPaint = new Set()
				for (const element of semanticElements) {
					if (element.matches(edgeGeometrySelector)) {
						const samples = sampleSvgGeometry(element)
						const radius = svgStrokeWidth(element) / 2
						if (samples.length > 0 && radius > 0) {
							semanticPaint.push({ radius, samples, type: 'path' })
						}
						if (!element.matches('line') && svgFillPainted(element) && samples.length >= 3) {
							semanticPaint.push({ polygon: samples, type: 'polygon' })
						}
						for (const position of ['start', 'end']) {
							const marker = markerGeometry(svg, element, position)
							for (const polygon of marker?.polygons ?? []) {
								semanticPaint.push({ polygon, type: 'polygon' })
							}
						}
						continue
					}
					for (const shape of paintedSvgShapes(element)) {
						if (seenPaint.has(shape)) continue
						seenPaint.add(shape)
						const box = svgScreenBox(shape)
						if (box) {
							semanticPaint.push({
								rect: expandScreenRect(box, svgStrokeWidth(shape) / 2),
								type: 'rect',
							})
						}
					}
				}
				const overlayReported = new Set()
				for (const { parent, rect } of textRecords) {
					if (svg.contains(parent) || overlayReported.has(parent)) continue
					const crossesPaint = semanticPaint.some(painted => painted.type === 'path'
						? rectPolylineClearance(rect, painted.samples) <= painted.radius + epsilon
						: painted.type === 'polygon'
							? rectPolygonClearance(rect, painted.polygon) <= epsilon
							: intersection(painted.rect, rect))
					if (!crossesPaint) continue
					add(
						'DIRECT_SVG_HTML_OVERLAY_UNOWNED',
						describe(parent),
						0,
						1,
						'direct-svg must be self-contained; mixed HTML text over an SVG visual must use a FigureSpec route',
					)
					overlayReported.add(parent)
				}
			}
			const texts = [...svg.querySelectorAll('text')].filter(text => {
				if (ignoreInheritedVisibility) {
					const display = text.getAttribute('display')
					const visibility = text.getAttribute('visibility')
					const opacity = Number.parseFloat(text.getAttribute('opacity') ?? '1')
					return display !== 'none' && visibility !== 'hidden' && opacity > 0
				}
				return visuallyRendered(text)
			})
			const rects = [...svg.querySelectorAll('rect')].map(rect => {
				const box = svgScreenBox(rect)
				const style = getComputedStyle(rect)
				const fill = style.fill
				const stroke = style.stroke
				const opacity = Number.parseFloat(rect.getAttribute('opacity') ?? style.opacity ?? '1')
				const fillOpacity = Number.parseFloat(
					rect.getAttribute('fill-opacity') ?? style.fillOpacity ?? '1',
				)
				const strokeOpacity = Number.parseFloat(
					rect.getAttribute('stroke-opacity') ?? style.strokeOpacity ?? '1',
				)
				const fillVisible = opacity > 0 && fillOpacity > 0 && !transparent(fill)
				const strokeVisible = opacity > 0 && strokeOpacity > 0 && !transparent(stroke)
				const explicitOwner = rect.hasAttribute('data-slideblocks-text-owner')
				const rounded = Number.parseFloat(rect.getAttribute('rx') ?? '0') > 0
					|| Number.parseFloat(rect.getAttribute('ry') ?? '0') > 0
				const displayed = rect.getAttribute('display') !== 'none'
					&& rect.getAttribute('visibility') !== 'hidden'
					&& style.display !== 'none'
					&& style.visibility !== 'hidden'
				// Explicit ownership is canonical. A visibly rounded fill-and-stroke card is
				// retained as a conservative legacy fallback for already-built Decks.
				const owner = displayed
					&& (explicitOwner || rounded && fillVisible && strokeVisible)
				return box ? { box, explicitOwner, owner, rect } : null
			}).filter(Boolean)
			const semanticOwner = group => rects.filter(candidate => candidate.owner
				&& candidate.explicitOwner
				&& candidate.rect.closest(semanticSelector) === group)
				.sort((left, right) => {
					const leftArea = (left.box.right - left.box.left) * (left.box.bottom - left.box.top)
					const rightArea = (right.box.right - right.box.left) * (right.box.bottom - right.box.top)
					return leftArea - rightArea
				})[0]
			for (const text of texts) {
				const textBox = svgScreenBox(text)
				if (!textBox) continue
				const textLabel = `${label} text "${text.textContent?.trim().replace(/\s+/gu, ' ').slice(0, 44)}"`
				if (!within(textBox, rootRect)) {
					const escape = Math.max(
						rootRect.left - textBox.left,
						textBox.right - rootRect.right,
						rootRect.top - textBox.top,
						textBox.bottom - rootRect.bottom,
						0,
					)
					add('SVG_TEXT_OUTSIDE_ROOT', textLabel, native(escape), 0)
				}
				const center = {
					x: (textBox.left + textBox.right) / 2,
					y: (textBox.top + textBox.bottom) / 2,
				}
				const semanticGroup = text.closest(semanticSelector)
				const declaredOwner = semanticGroup ? semanticOwner(semanticGroup) : null
				if (strictDiagram && semanticGroup && !declaredOwner) {
					add(
						'SVG_TEXT_OWNER_MISSING',
						textLabel,
						0,
						1,
						'semantic node or edge label has no rect marked data-slideblocks-text-owner',
					)
					continue
				}
				const candidates = rects.filter(candidate => {
					const box = candidate.box
					const area = Math.max(0, box.right - box.left) * Math.max(0, box.bottom - box.top)
					const textHeight = Math.max(1, textBox.bottom - textBox.top)
					return candidate.owner
						&& area < rootArea * 0.9
						&& box.right - box.left >= textHeight * 2
						&& box.bottom - box.top >= textHeight * 1.5
						&& center.x >= box.left
						&& center.x <= box.right
						&& center.y >= box.top
						&& center.y <= box.bottom
				}).sort((left, right) => {
					const leftArea = (left.box.right - left.box.left) * (left.box.bottom - left.box.top)
					const rightArea = (right.box.right - right.box.left) * (right.box.bottom - right.box.top)
					return leftArea - rightArea
				})
				const card = declaredOwner ?? candidates[0]
				if (!card) continue
				const cardBox = card.box
				const overflow = Math.max(
					cardBox.left - textBox.left,
					textBox.right - cardBox.right,
					cardBox.top - textBox.top,
					textBox.bottom - cardBox.bottom,
					0,
				)
				const inferredOverflowThreshold = Math.max(
					limits.svgBoxClearance * scale,
					(textBox.bottom - textBox.top) * 0.2,
				)
				if (overflow > (card.explicitOwner ? epsilon : inferredOverflowThreshold)) {
					add('SVG_TEXT_OUTSIDE_BOX', textLabel, native(overflow), 0, 'text exceeds its owning rect')
					continue
				}
				if (!card.explicitOwner) continue
				const horizontalClearance = Math.min(
					textBox.left - cardBox.left,
					cardBox.right - textBox.right,
				)
				const verticalClearance = Math.min(
					textBox.top - cardBox.top,
					cardBox.bottom - textBox.bottom,
				)
				const role = semanticGroup?.hasAttribute('data-label-id')
					? 'edge-label'
					: semanticGroup?.hasAttribute('data-node-id')
						? 'node'
						: 'generic'
				const lineBoxes = [...text.querySelectorAll('tspan')]
					.map(svgScreenBox)
					.filter(Boolean)
				const glyphHeight = native(lineBoxes.length > 0
					? Math.max(...lineBoxes.map(box => box.bottom - box.top))
					: textBox.bottom - textBox.top)
				const requiredX = role === 'node'
					? Math.max(limits.svgNodeTextInsetX, glyphHeight * 0.6)
					: role === 'edge-label'
						? Math.max(limits.svgEdgeLabelInsetX, glyphHeight * 0.4)
						: limits.svgBoxClearance
				const requiredY = role === 'node'
					? Math.max(limits.svgNodeTextInsetY, glyphHeight * 0.35)
					: role === 'edge-label'
						? Math.max(limits.svgEdgeLabelInsetY, glyphHeight * 0.2)
						: limits.svgBoxClearance
				if (horizontalClearance < requiredX * scale - epsilon) {
					add(
						'SVG_TEXT_BOX_CLEARANCE',
						textLabel,
						native(horizontalClearance),
						requiredX,
						`${role} text needs more horizontal inset inside its owning rect`,
					)
				}
				if (verticalClearance < requiredY * scale - epsilon) {
					add(
						'SVG_TEXT_BOX_CLEARANCE',
						textLabel,
						native(verticalClearance),
						requiredY,
						`${role} text needs more vertical inset inside its owning rect`,
					)
				}
			}

			if (!strictDiagram) return

			const edgePaths = [...svg.querySelectorAll('path[data-edge-id]')].filter(path => {
				const style = getComputedStyle(path)
				const opacity = Number.parseFloat(path.getAttribute('opacity') ?? style.opacity ?? '1')
				return path.getAttribute('display') !== 'none'
					&& path.getAttribute('visibility') !== 'hidden'
					&& style.display !== 'none'
					&& style.visibility !== 'hidden'
					&& opacity > 0
					&& svgStrokeWidth(path) > 0
			})
			const nodeFrames = rects.map(candidate => {
				const group = candidate.rect.closest('[data-node-id]')
				return candidate.owner && candidate.explicitOwner && group
					? { ...candidate, group, nodeId: group.getAttribute('data-node-id') }
					: null
			}).filter(Boolean)
			const edgeLabels = [...svg.querySelectorAll('[data-edge-id][data-label-id]')].map(group => {
				const frame = semanticOwner(group)
				return frame ? {
					edgeId: group.getAttribute('data-edge-id'),
					frame,
					group,
					labelId: group.getAttribute('data-label-id'),
				} : null
			}).filter(Boolean)

			for (const edgeLabel of edgeLabels) {
				const frameStroke = svgStrokeWidth(edgeLabel.frame.rect) / 2
				const protectedFrame = expandScreenRect(edgeLabel.frame.box, frameStroke)
				const edgeLabelName = `${label} edge label ${edgeLabel.edgeId}.${edgeLabel.labelId}`

				for (const path of edgePaths) {
					const samples = sampleSvgGeometry(path)
					if (samples.length < 1) continue
					const pathStroke = svgStrokeWidth(path) / 2
					const clearance = Math.max(
						0,
						Math.min(...samples.map(point => pointRectClearance(point, protectedFrame))) - pathStroke,
					)
					if (clearance < limits.svgEdgeLabelPathClearance * scale - epsilon) {
						add(
							'SVG_EDGE_LABEL_PATH_CLEARANCE',
							edgeLabelName,
							native(clearance),
							limits.svgEdgeLabelPathClearance,
							`too close to rendered edge ${path.getAttribute('data-edge-id')}`,
						)
					}

					for (const position of ['start', 'end']) {
						const marker = markerGeometry(svg, path, position)
						if (!marker) continue
						if (marker.unresolved) {
							add(
								'SVG_MARKER_GEOMETRY_UNRESOLVED',
								edgeLabelName,
								0,
								1,
								`${position} marker ${marker.markerId}: ${marker.unresolved}`,
							)
							continue
						}
						const markerClearance = Math.min(
							...marker.polygons.map(polygon => rectPolygonClearance(protectedFrame, polygon)),
						)
						if (markerClearance < limits.svgEdgeLabelMarkerClearance * scale - epsilon) {
							add(
								'SVG_EDGE_LABEL_MARKER_CLEARANCE',
								edgeLabelName,
								native(markerClearance),
								limits.svgEdgeLabelMarkerClearance,
								`too close to ${position} marker on edge ${path.getAttribute('data-edge-id')}`,
							)
						}
					}
				}

				for (const node of nodeFrames) {
					const nodeStroke = svgStrokeWidth(node.rect) / 2
					const paintedNode = expandScreenRect(node.box, nodeStroke)
					const clearance = rectRectClearance(protectedFrame, paintedNode)
					if (clearance < limits.svgEdgeLabelNodeClearance * scale - epsilon) {
						add(
							'SVG_EDGE_LABEL_NODE_CLEARANCE',
							edgeLabelName,
							native(clearance),
							limits.svgEdgeLabelNodeClearance,
							`too close to rendered node ${node.nodeId}`,
						)
					}
				}
			}
		}

		const renderedOnSlide = (element) => {
			if (!visuallyRendered(element)) return false
			return intersection(element.getBoundingClientRect(), slideRect)
		}
		const routeOutput = (carrier, selector) => {
			const candidates = carrier.matches?.(selector)
				? [carrier]
				: [...carrier.querySelectorAll(selector)]
			return candidates.find((candidate) => {
				if (!renderedOnSlide(candidate)) return false
				const assetOwner = candidate.closest('[data-slideblocks-asset-id]')
				return carrier.hasAttribute('data-slideblocks-asset-id')
					? assetOwner === carrier
					: !assetOwner || assetOwner === carrier.closest('[data-slideblocks-asset-id]')
			}) ?? null
		}
		const routeCarriers = [...slide.querySelectorAll('[data-slideblocks-render-route]')]
		const topLevelRouteCarriers = routeCarriers.filter((carrier) => {
			const ancestor = carrier.parentElement?.closest('[data-slideblocks-render-route]')
			return !ancestor || !slide.contains(ancestor)
		})
		const lockedRoutes = Array.isArray(expectedRoutes) ? expectedRoutes : []
		if (!Array.isArray(expectedRoutes)) {
			add(
				'ROUTE_OUTPUT_MISMATCH',
				describe(slide),
				0,
				1,
				'execution lock has no route contract for this slide number',
			)
		}
		const lockedByAsset = new Map(lockedRoutes.map(expected => [expected.assetId, expected]))
		for (const expected of lockedRoutes) {
			const declaredMatches = topLevelRouteCarriers.filter(
				carrier => carrier.getAttribute('data-slideblocks-asset-id') === expected.assetId,
			)
			if (declaredMatches.length !== 1) {
				add(
					'ROUTE_OUTPUT_MISMATCH',
					declaredMatches[0] ?? `asset ${expected.assetId}`,
					declaredMatches.length,
					1,
					declaredMatches.length === 0
						? `locked carrier ${expected.assetId} (${expected.renderRoute}) is missing from this page`
						: `locked carrier ${expected.assetId} appears ${declaredMatches.length} times on this page`,
				)
				continue
			}
			const carrier = declaredMatches[0]
			if (!renderedOnSlide(carrier)) {
				add(
					'ROUTE_OUTPUT_MISMATCH',
					carrier,
					0,
					1,
					`locked carrier ${expected.assetId} must be visibly rendered inside the slide`,
				)
				continue
			}
			const actualRoute = carrier.getAttribute('data-slideblocks-render-route')
			if (actualRoute !== expected.renderRoute) {
				add(
					'ROUTE_OUTPUT_MISMATCH',
					carrier,
					0,
					1,
					`${expected.assetId} renders ${actualRoute ?? '(missing)'} but the execution lock requires ${expected.renderRoute}`,
				)
			}
		}
		for (const carrier of topLevelRouteCarriers) {
			const assetId = carrier.getAttribute('data-slideblocks-asset-id')
			if (!lockedByAsset.has(assetId)) {
				add(
					'ROUTE_OUTPUT_MISMATCH',
					carrier,
					0,
					1,
					`unplanned route carrier ${assetId ?? '(missing asset ID)'} cannot satisfy this page's execution lock`,
				)
			}
		}
		for (const carrier of routeCarriers) {
			const routeAncestor = carrier.parentElement?.closest('[data-slideblocks-render-route]')
			if (routeAncestor && carrier.hasAttribute('data-slideblocks-asset-id')) {
				add(
					'ROUTE_OUTPUT_MISMATCH',
					carrier,
					0,
					1,
					`nested route carrier ${carrier.getAttribute('data-slideblocks-asset-id')} must not declare a second asset boundary`,
				)
			}
		}
		for (const carrier of routeCarriers) {
			const route = carrier.getAttribute('data-slideblocks-render-route')
			let realized = false
			if (route?.startsWith('figure:')) {
				const expectedKind = route.slice('figure:'.length)
				const figure = routeOutput(carrier, '[data-slideblocks-figure]')
				realized = Boolean(
					figure
					&& figure.getAttribute('data-slideblocks-figure') === 'final'
					&& figure.getAttribute('data-layout-role') === 'final'
					&& figure.getAttribute('data-figure-kind') === expectedKind,
				)
			}
			else if (route === 'diagram:elk') {
				realized = Boolean(routeOutput(
					carrier,
					'svg[data-slideblocks-diagram="final"][data-layout-role="final"][data-layout-engine="elkjs"][data-visual-renderer="slideblocks-svg"]',
				))
			}
			else if (route === 'diagram:mermaid') {
				realized = Boolean(routeOutput(carrier, 'svg[data-slideblocks-mermaid="final"]'))
			}
			else if (route === 'direct-svg') {
				realized = Boolean(routeOutput(
					carrier,
					'svg[data-slideblocks-diagram="final"][data-layout-role="final"][data-layout-engine="direct-svg"][data-visual-renderer="slideblocks-svg"]',
				))
			}
			if (!realized) {
				add(
					'ROUTE_OUTPUT_MISMATCH',
					describe(carrier),
					0,
					1,
					`rendered output does not realize locked route ${route ?? '(missing)'}`,
				)
			}
		}

		for (const figure of [...slide.querySelectorAll('[data-slideblocks-figure]')].filter(visuallyRendered)) {
			const role = figure.getAttribute('data-slideblocks-figure')
			const layoutRole = figure.getAttribute('data-layout-role')
			const kind = figure.getAttribute('data-figure-kind')
			const renderRoute = figure.getAttribute('data-slideblocks-render-route')
			if (role !== 'final' || layoutRole !== 'final') {
				add(
					'FIGURE_FINAL_ROLE_MISSING',
					describe(figure),
					0,
					1,
					`FigureSpec DOM gate did not promote the mounted root to final (figure=${role}, layout=${layoutRole})`,
				)
			}
			if (!kind || renderRoute !== `figure:${kind}`) {
				add(
					'ROUTE_OUTPUT_MISMATCH',
					describe(figure),
					0,
					1,
					`FigureSpec root must declare data-slideblocks-render-route="figure:${kind ?? '(missing)'}"`,
				)
			}
			if ((kind === 'comparison' || kind === 'annotated') && figure.querySelector('svg text')) {
				add(
					'FIGURE_SVG_TEXT_FORBIDDEN',
					describe(figure),
					0,
					1,
					'FigureSpec comparison and annotated visual layers must keep text in measurable HTML',
				)
			}
			const visualSlots = new Map([...figure.querySelectorAll('[data-figure-visual-slot]')]
				.map(slot => [slot.getAttribute('data-figure-visual-slot'), slot]))
			for (const visual of figure.querySelectorAll('[data-visual-id][data-slot-id]')) {
				const slotId = visual.getAttribute('data-slot-id')
				const slot = visualSlots.get(slotId)
				if (!slot) {
					add(
						'FIGURE_VISUAL_SLOT_MISSING',
						describe(visual),
						0,
						1,
						`mounted visual has no inspectable slot boundary for ${slotId}`,
					)
					continue
				}
				const paintedRects = [...visual.children]
					.filter(mark => typeof mark.getBoundingClientRect === 'function')
					.map((mark) => {
						const style = getComputedStyle(mark)
						const strokeExpansion = style.stroke && style.stroke !== 'none'
							? (Number.parseFloat(style.strokeWidth) || 0) / 2
							: 0
						return expandScreenRect(mark.getBoundingClientRect(), strokeExpansion)
					})
				const visualRect = paintedRects.length > 0
					? {
							left: Math.min(...paintedRects.map(rect => rect.left)),
							top: Math.min(...paintedRects.map(rect => rect.top)),
							right: Math.max(...paintedRects.map(rect => rect.right)),
							bottom: Math.max(...paintedRects.map(rect => rect.bottom)),
						}
					: visual.getBoundingClientRect()
				const slotRect = slot.getBoundingClientRect()
				const escape = Math.max(
					slotRect.left - visualRect.left,
					visualRect.right - slotRect.right,
					slotRect.top - visualRect.top,
					visualRect.bottom - slotRect.bottom,
					0,
				)
				if (escape > epsilon) {
					add(
						'FIGURE_VISUAL_OUT_OF_SLOT',
						describe(visual),
						native(escape),
						0,
						`rendered visual leaves its FigureSpec slot ${slotId}`,
					)
				}
			}

			const peerGroups = new Map()
			for (const element of figure.querySelectorAll('[data-figure-peer-set]')) {
				const peerSet = element.getAttribute('data-figure-peer-set')
				if (!peerSet) continue
				const peers = peerGroups.get(peerSet) ?? []
				peers.push(element)
				peerGroups.set(peerSet, peers)
			}
			const itemRects = new Map([...figure.querySelectorAll('[data-figure-item]')]
				.map(item => [item.getAttribute('data-figure-item'), item.getBoundingClientRect()]))
			for (const [peerSet, peers] of peerGroups) {
				if (peers.length < 2) continue
				const referenceRect = peers[0].getBoundingClientRect()
				const referenceOwner = itemRects.get(peers[0].getAttribute('data-owner-id'))
				for (const peer of peers.slice(1)) {
					const peerRect = peer.getBoundingClientRect()
					const sizeDrift = Math.max(
						Math.abs(peerRect.width - referenceRect.width),
						Math.abs(peerRect.height - referenceRect.height),
					)
					if (sizeDrift > epsilon) {
						add(
							'FIGURE_PEER_SLOT_SIZE_DRIFT',
							describe(peer),
							native(sizeDrift),
							0,
							`mounted peer slots in ${peerSet} do not share one size`,
						)
					}
					const peerOwner = itemRects.get(peer.getAttribute('data-owner-id'))
					if (kind === 'comparison' && referenceOwner && peerOwner) {
						const baselineDrift = Math.max(
							Math.abs((peerRect.left - peerOwner.left) - (referenceRect.left - referenceOwner.left)),
							Math.abs((peerRect.top - peerOwner.top) - (referenceRect.top - referenceOwner.top)),
						)
						if (baselineDrift > epsilon) {
							add(
								'FIGURE_PEER_SLOT_BASELINE_DRIFT',
								describe(peer),
								native(baselineDrift),
								0,
								`mounted peer slots in ${peerSet} do not share one item-relative baseline`,
							)
						}
					}
				}
			}

			const callouts = [...figure.querySelectorAll('[data-figure-role="callout"]')].filter(visuallyRendered)
			for (let leftIndex = 0; leftIndex < callouts.length; leftIndex += 1) {
				for (let rightIndex = leftIndex + 1; rightIndex < callouts.length; rightIndex += 1) {
					const leftRect = callouts[leftIndex].getBoundingClientRect()
					const rightRect = callouts[rightIndex].getBoundingClientRect()
					const overlapWidth = Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left)
					const overlapHeight = Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top)
					if (overlapWidth > epsilon && overlapHeight > epsilon) {
						add(
							'FIGURE_CALLOUT_OVERLAP',
							describe(callouts[rightIndex]),
							native(Math.min(overlapWidth, overlapHeight)),
							0,
							'mounted FigureSpec callouts overlap',
						)
					}
				}
			}

			const anchors = new Map([...figure.querySelectorAll('[data-figure-anchor]')]
				.map(anchor => [anchor.getAttribute('data-figure-anchor'), anchor]))
			for (const leader of figure.querySelectorAll('[data-leader-id][data-target-anchor]')) {
				const anchor = anchors.get(leader.getAttribute('data-target-anchor'))
				if (!anchor || typeof leader.getTotalLength !== 'function') {
					add('FIGURE_LEADER_TARGET_MISS', describe(leader), 0, 1, 'mounted leader target anchor is missing')
					continue
				}
				const pathPoint = leader.getPointAtLength(leader.getTotalLength())
				const matrix = leader.getScreenCTM()
				const anchorRect = anchor.getBoundingClientRect()
				if (!matrix) continue
				const end = {
					x: matrix.a * pathPoint.x + matrix.c * pathPoint.y + matrix.e,
					y: matrix.b * pathPoint.x + matrix.d * pathPoint.y + matrix.f,
				}
				const target = { x: anchorRect.left + anchorRect.width / 2, y: anchorRect.top + anchorRect.height / 2 }
				const miss = Math.hypot(end.x - target.x, end.y - target.y)
				if (miss > Math.max(1, epsilon)) {
					add(
						'FIGURE_LEADER_TARGET_MISS',
						describe(leader),
						native(miss),
						0,
						`mounted leader misses anchor ${leader.getAttribute('data-target-anchor')}`,
					)
				}
			}
		}

		for (const svg of [...slide.querySelectorAll('svg')].filter(visuallyRendered)) {
			inspectSvg(svg, describe(svg))
		}

		const externalSvgImages = [...slide.querySelectorAll('img')].filter(image => {
			if (!visuallyRendered(image)) return false
			const source = image.currentSrc || image.src
			return /^data:image\/svg\+xml(?:;|,)/iu.test(source)
				|| /\.svg(?:[?#]|$)/iu.test(source)
		})
		for (const image of externalSvgImages) {
			let host
			try {
				const controller = new AbortController()
				const timeout = setTimeout(() => controller.abort(), 5_000)
				let response
				try {
					response = await fetch(image.currentSrc || image.src, { signal: controller.signal })
				}
				finally {
					clearTimeout(timeout)
				}
				if (!response.ok && response.status !== 0) throw new Error(`HTTP ${response.status}`)
				const source = await response.text()
				const parsed = new DOMParser().parseFromString(source, 'image/svg+xml')
				if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') {
					throw new Error('invalid SVG XML')
				}
				const imageRect = image.getBoundingClientRect()
				host = document.createElement('div')
				host.style.cssText = [
					'position:fixed',
					'left:0',
					'top:-100000px',
					`width:${imageRect.width}px`,
					`height:${imageRect.height}px`,
					'opacity:0',
					'pointer-events:none',
				].join(';')
				const imported = document.importNode(parsed.documentElement, true)
				imported.style.width = '100%'
				imported.style.height = '100%'
				imported.style.display = 'block'
				host.append(imported)
				document.body.append(host)
				await Promise.race([
					document.fonts.ready,
					new Promise(resolveWait => setTimeout(resolveWait, 5_000)),
				])
				await new Promise(resolveFrame => requestAnimationFrame(() => resolveFrame()))
				inspectSvg(imported, `img "${image.alt || image.currentSrc.slice(0, 60)}"`, true)
			}
			catch (error) {
				add(
					'SVG_UNINSPECTABLE',
					image,
					0,
					1,
					error instanceof Error ? error.message : String(error),
				)
			}
			finally {
				host?.remove()
			}
		}

		return output
	}, { expectedRoutes, limits: LAYOUT_LIMITS })

	for (const asset of brokenAssets) {
		issues.push({
			actualPx: 0,
			code: 'BROKEN_ASSET',
			detail: asset,
			element: 'img',
			requiredPx: 1,
		})
	}
	return issues.map(issue => ({ ...issue, page: pageNumber, state }))
}

async function currentSlideSnapshot(page) {
	return page.evaluate(() => {
		const visible = element => {
			const style = getComputedStyle(element)
			const rect = element.getBoundingClientRect()
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& Number.parseFloat(style.opacity || '1') > 0
				&& rect.width > 0
				&& rect.height > 0
		}
		const slide = [...document.querySelectorAll('#slide-content .slidev-page, #slide-container .slidev-page')]
			.find(visible)
		if (!slide) return { fingerprint: '', pageNumber: null, url: location.href }
		const fingerprint = [...slide.querySelectorAll('[class*="v-click"], [aria-expanded], [aria-selected], [aria-hidden]')]
			.map(element => [
				element.localName,
				element.className?.baseVal ?? element.className,
				element.getAttribute('aria-expanded'),
				element.getAttribute('aria-selected'),
				element.getAttribute('aria-hidden'),
			].join(':'))
			.join('|')
		return {
			fingerprint,
			pageNumber: Number.parseInt(slide.getAttribute('data-slidev-no') ?? '', 10) || null,
			url: location.href,
		}
	})
}

async function stateControls(page) {
	return page.evaluate(() => {
		const visible = element => {
			const style = getComputedStyle(element)
			const rect = element.getBoundingClientRect()
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& Number.parseFloat(style.opacity || '1') > 0
				&& rect.width > 0
				&& rect.height > 0
				&& !element.disabled
		}
		const slide = [...document.querySelectorAll('#slide-content .slidev-page, #slide-container .slidev-page')]
			.find(visible)
		if (!slide) return []
		return [...slide.querySelectorAll('[role="tab"], button[aria-controls], [data-slideblocks-state-control]')]
			.filter(visible)
			.slice(0, 64)
			.map((element, index) => ({
				index,
				label: element.getAttribute('aria-label')
					|| element.textContent?.trim().replace(/\s+/gu, ' ').slice(0, 36)
					|| `control-${index + 1}`,
			}))
	})
}

async function inspectDeckLayout(context, target, motion, routeContract, routeMode) {
	const issues = []
	let states = 0
	let pages = 0
	let pageNumber = 1
	const visitedPages = new Set()

	while (!visitedPages.has(pageNumber) && pages < 256) {
		visitedPages.add(pageNumber)
		pages += 1
		const page = await createReadyPage(context, slideTarget(target, pageNumber))
		let nextPageNumber = null
		try {
			issues.push(...await inspectCurrentSlide(page, {
				expectedRoutes: routeContract.pages[pageNumber]?.[routeMode] ?? null,
				pageNumber,
				state: `${motion}:default`,
			}))
			states += 1

			for (let step = 1; step <= 64; step += 1) {
				const before = await currentSlideSnapshot(page)
				await page.keyboard.press('ArrowRight')
				await waitForStableRender(page, { settleMotion: true })
				const after = await currentSlideSnapshot(page)
				if (after.pageNumber && after.pageNumber !== pageNumber) {
					nextPageNumber = after.pageNumber
					break
				}
				if (after.url === before.url && after.fingerprint === before.fingerprint) break
				issues.push(...await inspectCurrentSlide(page, {
					expectedRoutes: routeContract.pages[pageNumber]?.[routeMode] ?? null,
					pageNumber,
					state: `${motion}:keyboard-${step}`,
				}))
				states += 1
			}
		}
		finally {
			await page.close().catch(() => {})
		}

		const controlsPage = await createReadyPage(context, slideTarget(target, pageNumber))
		let controls
		try {
			controls = await stateControls(controlsPage)
		}
		finally {
			await controlsPage.close().catch(() => {})
		}
		for (const control of controls) {
			const statePage = await createReadyPage(context, slideTarget(target, pageNumber))
			try {
				const selector = '[role="tab"]:visible, button[aria-controls]:visible, [data-slideblocks-state-control]:visible'
				const candidate = statePage.locator(selector).nth(control.index)
				requireCondition(await candidate.count() === 1, `State control disappeared: ${control.label}`)
				await candidate.click()
				await waitForStableRender(statePage, { settleMotion: true })
				const snapshot = await currentSlideSnapshot(statePage)
				if (snapshot.pageNumber !== pageNumber) {
					issues.push({
						actualPx: snapshot.pageNumber ?? 0,
						code: 'STATE_CONTROL_NAVIGATED',
						detail: `state control ${control.label} left the current slide`,
						element: control.label,
						page: pageNumber,
						requiredPx: pageNumber,
						state: `${motion}:control-${control.index + 1}`,
					})
				}
				else {
					issues.push(...await inspectCurrentSlide(statePage, {
						expectedRoutes: routeContract.pages[pageNumber]?.[routeMode] ?? null,
						pageNumber,
						state: `${motion}:control-${control.index + 1}:${control.label}`,
					}))
					states += 1
				}
			}
			finally {
				await statePage.close().catch(() => {})
			}
		}

		if (!nextPageNumber) break
		pageNumber = nextPageNumber
	}

	if (pages >= 256) {
		issues.push({
			actualPx: pages,
			code: 'PAGE_TRAVERSAL_LIMIT',
			detail: 'keyboard traversal exceeded the safety limit',
			element: '#slide-container',
			page: pageNumber,
			requiredPx: 255,
			state: `${motion}:traversal`,
		})
	}
	return { issues, pages, states }
}

function formatLayoutIssue(issue) {
	const page = `P${String(issue.page ?? 0).padStart(2, '0')}`
	return [
		`code=${issue.code}`,
		`page=${page}`,
		`state=${JSON.stringify(issue.state ?? 'unknown')}`,
		`element=${JSON.stringify(issue.element ?? '<unknown>')}`,
		`actualPx=${issue.actualPx}`,
		`requiredPx=${issue.requiredPx}`,
		issue.detail ? `detail=${JSON.stringify(issue.detail)}` : '',
	].filter(Boolean).join(' ')
}

async function runLayoutGate(browser, target, targetLabel) {
	const normalizedTarget = normalizeTarget(target)
	const routeMode = new URL(normalizedTarget).protocol === 'file:' ? 'offline' : 'live'
	const reports = []
	for (const reduced of [false, true]) {
		const motion = reduced ? 'reduced' : 'regular'
		const context = await browser.newContext({
			locale: 'en-US',
			reducedMotion: reduced ? 'reduce' : 'no-preference',
			viewport: { width: 1280, height: 720 },
		})
		context.on('page', attachDiagnostics)
		try {
			reports.push({
				...await inspectDeckLayout(
					context,
					normalizedTarget,
					motion,
					EXECUTION_ROUTE_CONTRACT,
					routeMode,
				),
				motion,
			})
		}
		catch (error) {
			reports.push({
				issues: [{
					actualPx: 0,
					code: 'LAYOUT_GATE_UNAVAILABLE',
					detail: formatError(error),
					element: '#slide-container',
					page: 0,
					requiredPx: 1,
					state: `${motion}:startup`,
				}],
				motion,
				pages: 0,
				states: 0,
			})
		}
		finally {
			await context.close().catch(() => {})
		}
	}

	for (const report of reports) {
		const name = `pixel layout gate: ${targetLabel} ${report.motion}`
		if (report.issues.length === 0) {
			pass(name, `${report.pages} pages, ${report.states} stable states`)
			continue
		}
		for (const issue of report.issues) console.error(`LAYOUT  ${formatLayoutIssue(issue)}`)
		fail(name, `${report.issues.length} hard issue(s); see LAYOUT diagnostics above`)
	}
	return reports
}

async function runWithFreshPage(context, name, check) {
	let page
	try {
		page = await createReadyPage(context)
		const outcome = await check(page)
		if (outcome?.status === 'skip') skip(name, outcome.detail)
		else pass(name, outcome?.detail ?? '')
	}
	catch (error) {
		fail(name, formatError(error))
	}
	finally {
		await page?.close().catch(() => {})
	}
}

function requireCondition(condition, message) {
	if (!condition) throw new Error(message)
}

async function openMenu(page, placement = 'center') {
	const slide = page.locator('#slide-container')
	const slideBox = await slide.boundingBox()
	const viewport = page.viewportSize()
	requireCondition(slideBox && viewport, 'Slide or viewport geometry is unavailable')

	const x = placement === 'bottom-right'
		? Math.max(slideBox.x + 1, Math.min(viewport.width - 2, slideBox.x + slideBox.width - 2))
		: slideBox.x + slideBox.width / 2
	const y = placement === 'bottom-right'
		? Math.max(slideBox.y + 1, Math.min(viewport.height - 2, slideBox.y + slideBox.height - 2))
		: slideBox.y + slideBox.height / 2

	await page.mouse.move(x, y)
	await page.mouse.click(x, y, { button: 'right' })
	const menu = page.locator('.z-context-menu')
	await menu.waitFor({ state: 'visible', timeout: 5_000 })
	return { menu, slide }
}

async function exportMenuEntry(menu) {
	const entry = menu.locator('[data-slideblocks-offline-export-label="true"]')
	const recommendation = entry.locator('[data-slideblocks-export-recommended="true"]')
	requireCondition(
		await entry.count() === 1,
		'Expected exactly one recommended offline export menu item',
	)
	requireCondition(
		await entry.getByText('Export offline HTML', { exact: true }).count() === 1,
		'Expected the offline export label to remain in English',
	)
	requireCondition(
		await recommendation.count() === 1
			&& await recommendation.innerText() === '(Recommended)',
		'Expected the offline export to expose one English recommendation marker',
	)
	await entry.waitFor({ state: 'visible' })
	return entry
}

async function pdfMenuEntry(menu) {
	const entry = menu.getByText('Export PDF', { exact: true })
	requireCondition(
		await entry.count() === 1,
		'Expected exactly one English PDF export menu item',
	)
	await entry.waitFor({ state: 'visible' })
	return entry
}

async function main() {
	const browser = await browserType.launch({ headless: true })
	await runLayoutGate(browser, BASE, layoutOnly ? 'target' : 'served Deck')

	if (layoutOnly) {
		if (diagnostics.length === 0) pass('all layout pages kept a clean console')
		else fail('all layout pages kept a clean console', diagnostics.join(' | ').slice(0, 800))
		await browser.close().catch(() => {})
		const failures = results.filter(result => result.status === 'fail').length
		const skips = results.filter(result => result.status === 'skip').length
		const passed = results.filter(result => result.status === 'pass').length
		console.log(`\n${passed} passed, ${skips} skipped, ${failures} failed.`)
		process.exitCode = failures === 0 ? 0 : 1
		return
	}

	const context = await browser.newContext({
		acceptDownloads: true,
		locale: 'en-US',
		viewport: { width: 1280, height: 720 },
	})
	await context.addInitScript(() => {
		window.__slideblocksPrintCalls = 0
		window.print = () => {
			window.__slideblocksPrintCalls += 1
		}
	})
	context.on('page', attachDiagnostics)

	try {
		await runWithFreshPage(context, 'P key opens the current slide in a presenter tab', async (page) => {
			const beforeNavigation = page.url()
			await page.keyboard.press('ArrowDown')
			await page.waitForURL(url => url.href !== beforeNavigation, { timeout: 1_500 }).catch(() => {})
			const expectedSlide = currentSlideNumber(page.url())

			const popupPromise = page.waitForEvent('popup', { timeout: 8_000 })
			await page.keyboard.press('p')
			const presenter = await popupPromise
			attachDiagnostics(presenter)
			await presenter.waitForURL(
				url => presenterSlideNumber(url.href) === expectedSlide,
				{ timeout: 8_000 },
			)
			await presenter.locator('#slide-container').waitFor({ state: 'visible' })
			const presenterUrl = presenter.url()
			await presenter.close()
			return { detail: `${expectedSlide} -> ${presenterUrl}` }
		})

		await runWithFreshPage(context, 'native context menu opens with the required items', async (page) => {
			const { menu } = await openMenu(page)
			for (const item of FIXED_MENU_ITEMS) {
				const entry = menu.getByText(item, { exact: true })
				requireCondition(await entry.count() === 1, `Expected exactly one ${item} menu item`)
				await entry.waitFor({ state: 'visible' })
			}
			const exportEntry = await exportMenuEntry(menu)
			const pdfEntry = await pdfMenuEntry(menu)
			const [exportBox, pdfBox] = await Promise.all([
				exportEntry.boundingBox(),
				pdfEntry.boundingBox(),
			])
			requireCondition(
				exportBox && pdfBox && exportBox.y < pdfBox.y,
				'Expected the recommended offline HTML export before the final PDF action',
			)
			requireCondition(
				(await menu.locator(':scope > .cursor-pointer').last().innerText()).trim()
					=== 'Export PDF',
				'Expected PDF export to remain the final clickable menu action',
			)
		})

		await runWithFreshPage(context, 'dedicated PDF print view renders and invokes print once', async (page) => {
			const { menu } = await openMenu(page)
			const entry = await pdfMenuEntry(menu)
			const popupPromise = page.waitForEvent('popup', { timeout: 8_000 })
			await entry.click()
			const printView = await popupPromise
			attachDiagnostics(printView)
			printView.setDefaultTimeout(12_000)
			try {
				await printView.waitForURL(url => isPdfPrintUrl(url.href), { timeout: 10_000 })
				await printView.locator('#print-content').waitFor({ state: 'visible' })
				await printView.waitForFunction(() =>
					document.documentElement.dataset.slideblocksPdfReady === 'true'
					&& window.__slideblocksPrintCalls === 1,
				)
				const slides = printView.locator('#print-content > .print-slide-container')
				const slideCount = await slides.count()
				requireCondition(slideCount > 0, 'PDF print view rendered no slides')
				requireCondition(
					await slides.first().evaluate(element =>
						element.classList.contains('slideblocks-pdf-first-page')),
					'PDF pagination did not mark the first visible slide',
				)
				requireCondition(
					await printView.getByText('Browser Exporter', { exact: true }).count() === 0,
					'PDF-only route exposed Slidev Browser Exporter',
				)
				requireCondition(
					await printView.getByText('PPTX', { exact: true }).count() === 0,
					'PDF-only route exposed PPTX export',
				)
				return { detail: `${slideCount} print slides -> ${printView.url()}` }
			}
			finally {
				await printView.close().catch(() => {})
			}
		})

		await runWithFreshPage(context, 'Escape closes the context menu', async (page) => {
			const { menu } = await openMenu(page)
			await page.keyboard.press('Escape')
			await menu.waitFor({ state: 'hidden' })
		})

		await runWithFreshPage(context, 'trusted Shift+right-click preserves the browser default', async (page) => {
			const slide = page.locator('#slide-container')
			await page.evaluate(() => {
				window.__slideblocksShiftContextMenu = null
				document.addEventListener('contextmenu', (event) => {
					queueMicrotask(() => {
						window.__slideblocksShiftContextMenu = {
							defaultPrevented: event.defaultPrevented,
							isTrusted: event.isTrusted,
							shiftKey: event.shiftKey,
						}
					})
				}, { once: true })
			})
			await slide.click({
				button: 'right',
				modifiers: ['Shift'],
				position: { x: 260, y: 200 },
			})
			await page.waitForFunction(() => window.__slideblocksShiftContextMenu !== null)
			const outcome = await page.evaluate(() => window.__slideblocksShiftContextMenu)
			requireCondition(outcome?.isTrusted === true, 'Shift contextmenu was not a trusted browser event')
			requireCondition(outcome?.shiftKey === true, 'Shift modifier was lost')
			requireCondition(outcome?.defaultPrevented === false, 'Shift contextmenu was prevented')
			requireCondition(
				!(await page.locator('.z-context-menu').isVisible().catch(() => false)),
				'Slidev menu opened for Shift+right-click',
			)
		})

		await runWithFreshPage(context, 'context menu stays inside the bottom-right viewport edge', async (page) => {
			const { menu } = await openMenu(page, 'bottom-right')
			await page.waitForFunction(() => {
				const element = document.querySelector('.z-context-menu')
				if (!(element instanceof HTMLElement)) return false
				const box = element.getBoundingClientRect()
				return box.left >= -0.5
					&& box.top >= -0.5
					&& box.right <= window.innerWidth + 0.5
					&& box.bottom <= window.innerHeight + 0.5
			})
			const box = await menu.boundingBox()
			requireCondition(box, 'Context menu geometry is unavailable')
			return { detail: `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}` }
		})

		await runWithFreshPage(context, 'overview action opens the Slidev modal', async (page) => {
			const { menu } = await openMenu(page)
			await menu.getByText('Show slide overview', { exact: true }).click()
			await page.locator('.z-modal:visible').first().waitFor({ state: 'visible' })
		})

		await runWithFreshPage(context, 'fullscreen action enters fullscreen', async (page) => {
			const { menu } = await openMenu(page)
			const entry = menu.getByText('Enter fullscreen', { exact: true })
			await entry.waitFor({ state: 'visible' })
			if (browserName === 'webkit') {
				const diagnosticsBefore = diagnostics.length
				await entry.click()
				await menu.waitFor({ state: 'hidden' })
				await page.waitForTimeout(100)
				requireCondition(
					diagnostics.length === diagnosticsBefore,
					'Fullscreen menu action emitted a browser diagnostic before the WebKit API check',
				)
				return {
					status: 'skip',
					detail: 'headless WebKit does not settle the Fullscreen API; verify in current macOS Safari',
				}
			}
			await entry.click()
			await page.waitForFunction(() => Boolean(document.fullscreenElement))
		})

		await runWithFreshPage(context, 'presenter menu action navigates in the same page', async (page) => {
			const expectedSlide = currentSlideNumber(page.url())
			const { menu } = await openMenu(page)
			const navigationPromise = page.waitForURL(
				url => presenterSlideNumber(url.href) === expectedSlide,
				{ timeout: 8_000 },
			)
			await menu.getByText('Enter Presenter Mode', { exact: true }).click()
			await navigationPromise
			await page.locator('#slide-container').waitFor({ state: 'visible' })
			return { detail: page.url() }
		})

		await runWithFreshPage(context, 'drawing action opens Drauu and records a stroke', async (page) => {
			const { menu, slide } = await openMenu(page)
			await menu.getByText('Show drawing toolbar', { exact: true }).click()
			const drawing = page.locator('svg.touch-none:visible').first()
			await drawing.waitFor({ state: 'visible' })
			const before = await drawing.locator('path[d]').count()
			const box = await slide.boundingBox()
			requireCondition(box, 'Slide geometry is unavailable for drawing')
			await page.mouse.move(box.x + box.width * 0.38, box.y + box.height * 0.38)
			await page.mouse.down()
			await page.mouse.move(
				box.x + box.width * 0.62,
				box.y + box.height * 0.56,
				{ steps: 12 },
			)
			await page.mouse.up()
			await page.waitForFunction(
				({ before }) => {
					const overlay = [...document.querySelectorAll('svg.touch-none')]
						.find(element => element.getClientRects().length > 0)
					return Boolean(overlay && overlay.querySelectorAll('path[d]').length > before)
				},
				{ before },
			)
			const after = await drawing.locator('path[d]').count()
			return { detail: `paths ${before}->${after}` }
		})

		await runWithFreshPage(context, 'offline export downloads the self-contained player', async (page) => {
			const { menu } = await openMenu(page)
			const entry = await exportMenuEntry(menu)
			const downloadPromise = page.waitForEvent('download', { timeout: 8_000 })
			await entry.click()
			const download = await downloadPromise
			requireCondition(
				download.suggestedFilename() === 'offline.html',
				`Unexpected download name ${download.suggestedFilename()}`,
			)
			const failure = await download.failure()
			requireCondition(failure === null, `Offline download failed: ${failure}`)
			const path = await download.path()
			requireCondition(path, 'Offline download did not expose a local file')
			const offlineQaDirectory = await mkdtemp(join(tmpdir(), 'slideblocks-offline-qa-'))
			const offlineQaPath = join(offlineQaDirectory, 'offline.html')
			try {
				await download.saveAs(offlineQaPath)
				const details = await stat(offlineQaPath)
				requireCondition(details.size > 0, 'Downloaded offline.html is empty')
				const html = await readFile(offlineQaPath, 'utf8')
				requireCondition(
					html.includes('data-slideblocks-offline-player="true"'),
					'Downloaded file is not the SlideBlocks self-contained offline player',
				)
				await runLayoutGate(browser, offlineQaPath, 'downloaded offline.html')
				return { detail: `${details.size} bytes` }
			}
			finally {
				await rm(offlineQaDirectory, { force: true, recursive: true }).catch(() => {})
				await download.delete().catch(() => {})
			}
		})

		if (diagnostics.length === 0) pass('all opened pages kept a clean console')
		else fail('all opened pages kept a clean console', diagnostics.join(' | ').slice(0, 800))
	}
	finally {
		await context.close().catch(() => {})
		await browser.close().catch(() => {})
	}

	const failures = results.filter(result => result.status === 'fail').length
	const skips = results.filter(result => result.status === 'skip').length
	const passed = results.filter(result => result.status === 'pass').length
	console.log(`\n${passed} passed, ${skips} skipped, ${failures} failed.`)
	if (skips > 0) {
		console.log('Skipped platform behavior still requires the documented real-browser check.')
	}
	process.exitCode = failures === 0 ? 0 : 1
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack : String(error))
	process.exitCode = 1
})
