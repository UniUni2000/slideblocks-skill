import PrintPage from '@slidev/client/pages/print.vue'
import { defineRoutesSetup } from '@slidev/types'
import { defineComponent, h, onBeforeUnmount, onMounted } from 'vue'
import {
  SLIDEBLOCKS_PDF_ROUTE,
  startPdfExport,
  stopPdfExport,
} from './pdf-export'

const PDF_PRINT_STYLES = `
[data-slideblocks-pdf-hint] {
  position: fixed;
  z-index: 9999;
  right: 16px;
  bottom: 16px;
  max-width: min(440px, calc(100vw - 32px));
  margin: 0;
  padding: 10px 14px;
  border: 1px solid rgb(148 163 184 / 0.45);
  border-radius: 10px;
  color: #e2e8f0;
  background: rgb(15 23 42 / 0.92);
  box-shadow: 0 12px 32px rgb(15 23 42 / 0.24);
  font: 500 14px/1.45 ui-sans-serif, system-ui, sans-serif;
}

@media print {
  [data-slideblocks-pdf-hint] {
    display: none !important;
  }

  #print-content > .print-slide-container {
    break-before: page !important;
    page-break-before: always !important;
    break-after: auto !important;
    page-break-after: auto !important;
  }

  #print-content > .print-slide-container.slideblocks-pdf-first-page {
    break-before: auto !important;
    page-break-before: auto !important;
  }
}
`

function isChinese() {
  const lang = new URLSearchParams(window.location.search).get('lang')
  return lang === 'zh' || lang === 'zh-CN'
    || document.documentElement.lang.toLowerCase().startsWith('zh')
    || navigator.language.toLowerCase().startsWith('zh')
}

const SlideBlocksPdfPage = defineComponent({
  name: 'SlideBlocksPdfPage',
  setup() {
    const chinese = isChinese()
    document.documentElement.dataset.slideblocksPdfView = 'true'

    onMounted(() => {
      void startPdfExport()
    })
    onBeforeUnmount(() => {
      stopPdfExport()
      delete document.documentElement.dataset.slideblocksPdfView
      delete document.documentElement.dataset.slideblocksPdfReady
      delete document.documentElement.dataset.slideblocksPdfError
    })

    return () => [
      h(PrintPage),
      h('aside', {
        'aria-live': 'polite',
        'data-error-copy': chinese
          ? '自动打印未能启动。请等待页面完成后按 ⌘/Ctrl+P。'
          : 'Automatic printing could not start. Wait for the pages, then press ⌘/Ctrl+P.',
        'data-ready-copy': chinese
          ? '如果打印对话框没有打开，请按 ⌘/Ctrl+P。'
          : 'If the print dialog did not open, press ⌘/Ctrl+P.',
        'data-slideblocks-pdf-hint': '',
        'role': 'status',
      }, chinese ? '正在准备 PDF 打印视图…' : 'Preparing the PDF print view…'),
      h('style', { 'data-slideblocks-pdf-styles': '' }, PDF_PRINT_STYLES),
    ]
  },
})

export default defineRoutesSetup((routes) => {
  if (routes.some(route => route.path === SLIDEBLOCKS_PDF_ROUTE)) return routes

  const playRouteIndex = routes.findIndex(route => route.name === 'play')
  const insertionIndex = playRouteIndex < 0 ? routes.length : playRouteIndex
  return [
    ...routes.slice(0, insertionIndex),
    {
      name: 'slideblocks-pdf',
      path: SLIDEBLOCKS_PDF_ROUTE,
      component: SlideBlocksPdfPage,
    },
    ...routes.slice(insertionIndex),
  ]
})
