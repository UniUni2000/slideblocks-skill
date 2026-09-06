import { pathPrefix, useNav } from '@slidev/client'
import { nextTick } from 'vue'
import { applyTextEditsToRoot, savePendingTextEdits } from './text-edit'

export const SLIDEBLOCKS_PDF_ROUTE = '/slideblocks-pdf'

const PRINT_READY_TIMEOUT = 10_000
const PDF_FIRST_PAGE_CLASS = 'slideblocks-pdf-first-page'

type PdfExportWindow = Window & {
  __slideblocksPdfExportStarted?: boolean
}

function usesHashRouter() {
  return pathPrefix.includes('#/')
}

export function pdfExportUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set('print', 'true')

  if (usesHashRouter()) {
    url.hash = SLIDEBLOCKS_PDF_ROUTE
  }
  else {
    const deckBase = new URL(pathPrefix.replace(/#\/?$/u, ''), url)
    const separator = deckBase.pathname.endsWith('/') ? '' : '/'
    url.pathname = `${deckBase.pathname}${separator}${SLIDEBLOCKS_PDF_ROUTE.slice(1)}`
    url.hash = ''
  }

  return url.href
}

export function openPdfExport() {
  if (!savePendingTextEdits()) return
  const target = pdfExportUrl()
  const popup = window.open(target, '_blank')
  if (popup) {
    try {
      popup.opener = null
    }
    catch {}
    return
  }

  // A blocked popup must not turn the menu action into a no-op. The dedicated
  // print view remains usable in this tab and keeps a visible manual-print hint.
  window.location.assign(target)
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

function visiblePrintSlides() {
  return [...document.querySelectorAll<HTMLElement>(
    '#print-content > .print-slide-container',
  )].filter((slide) => {
    const style = getComputedStyle(slide)
    return !slide.hidden && style.display !== 'none' && style.visibility !== 'hidden'
  })
}

function printSlideSignature(slides: HTMLElement[]) {
  return slides.map((slide) => {
    const bounds = slide.getBoundingClientRect()
    return `${slide.id}:${Math.round(bounds.width)}x${Math.round(bounds.height)}:${slide.textContent}`
  }).join('|')
}

async function waitForStablePrintSlides() {
  const deadline = performance.now() + PRINT_READY_TIMEOUT
  let previous = ''
  let stableFrames = 0

  while (performance.now() < deadline) {
    const slides = visiblePrintSlides()
    const signature = printSlideSignature(slides)
    if (slides.length > 0 && signature === previous) stableFrames += 1
    else stableFrames = 0
    if (stableFrames >= 2) return slides
    previous = signature
    await nextFrame()
  }

  throw new Error('Slidev print view did not render any stable slides')
}

async function waitForFonts() {
  await Promise.race([
    document.fonts.ready,
    new Promise<void>(resolve => window.setTimeout(resolve, 5_000)),
  ])
}

async function waitForImages(slides: HTMLElement[]) {
  const images = slides.flatMap(slide => [
    ...slide.querySelectorAll<HTMLImageElement>('img'),
  ])
  await Promise.race([
    Promise.allSettled(images.map(image => image.decode())),
    new Promise<void>(resolve => window.setTimeout(resolve, 5_000)),
  ])
  const broken = images.filter(
    image => !image.complete || image.naturalWidth < 1 || image.naturalHeight < 1,
  )
  if (broken.length > 0) {
    const names = broken.map(image => image.alt || image.currentSrc || '<unnamed image>')
    throw new Error(`PDF print view has broken images: ${names.join(', ')}`)
  }
}

function clearPrintPagination() {
  for (const slide of document.querySelectorAll<HTMLElement>(
    '#print-content > .print-slide-container',
  )) {
    slide.classList.remove(PDF_FIRST_PAGE_CLASS)
  }
}

function markPrintPagination() {
  clearPrintPagination()
  visiblePrintSlides()[0]?.classList.add(PDF_FIRST_PAGE_CLASS)
}

function updatePrintHint(state: 'ready' | 'error') {
  const hint = document.querySelector<HTMLElement>('[data-slideblocks-pdf-hint]')
  const copy = state === 'ready'
    ? hint?.dataset.readyCopy
    : hint?.dataset.errorCopy
  if (hint && copy) hint.textContent = copy
}

export async function startPdfExport() {
  const pdfWindow = window as PdfExportWindow
  if (pdfWindow.__slideblocksPdfExportStarted) return
  pdfWindow.__slideblocksPdfExportStarted = true

  window.addEventListener('beforeprint', markPrintPagination)
  window.addEventListener('afterprint', clearPrintPagination)

  try {
    // Called synchronously from the print route's onMounted hook, while Vue's
    // injection context exists. Slidev renders fixed-size .slidev-page shells
    // before its async slide modules resolve; stable shell geometry is not
    // evidence that text nodes exist. Await the requested source modules, then
    // Vue's render flush before inspecting or replaying any DOM corrections.
    const { slides: routes, printRange } = useNav()
    const requestedRoutes = printRange.value.map((page) => {
      const route = routes.value.find(candidate => candidate.no === page)
      if (!route) throw new Error(`PDF print range references missing slide ${page}`)
      return route
    })
    let loadingTimer = 0
    try {
      await Promise.race([
        Promise.all(requestedRoutes.map(route => route.load())),
        new Promise<never>((_, reject) => {
          loadingTimer = window.setTimeout(() => reject(new Error('PDF slide modules did not finish loading')), PRINT_READY_TIMEOUT)
        }),
      ])
    }
    finally { window.clearTimeout(loadingTimer) }
    await nextTick()
    const slides = await waitForStablePrintSlides()
    await waitForFonts()
    await waitForImages(slides)
    let orphaned = 0
    for (const wrapper of slides) {
      const slide = wrapper.querySelector<HTMLElement>('.slidev-page')
      const page = Number(slide?.dataset.slidevNo)
      if (slide && Number.isInteger(page) && page > 0) orphaned += applyTextEditsToRoot(slide, page)
    }
    if (orphaned) throw new Error(`${orphaned} text correction(s) no longer match the source; PDF export stopped`)
    await nextFrame()
    await nextFrame()
    markPrintPagination()
    document.documentElement.dataset.slideblocksPdfReady = 'true'
    updatePrintHint('ready')
    window.print()
  }
  catch (error) {
    document.documentElement.dataset.slideblocksPdfError = 'true'
    updatePrintHint('error')
    console.error('[SlideBlocks] PDF export could not start automatically.', error)
  }
}

export function stopPdfExport() {
  window.removeEventListener('beforeprint', markPrintPagination)
  window.removeEventListener('afterprint', clearPrintPagination)
  clearPrintPagination()
  delete (window as PdfExportWindow).__slideblocksPdfExportStarted
}
