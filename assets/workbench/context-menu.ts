// Append SlideBlocks' PDF and offline exports to Slidev's native context menu.
import { defineContextMenuSetup } from '@slidev/types'
import { computed, defineComponent, h } from 'vue'
import { openPdfExport } from './pdf-export'
import { downloadOfflinePlayer } from './offline-export'

const OFFLINE_EXPORT_RECOMMENDATION = '(Recommended)'
const PDF_EXPORT_LABEL = 'Export PDF'

const RecommendedOfflineExportLabel = defineComponent({
  name: 'SlideBlocksRecommendedOfflineExportLabel',
  setup() {
    return () => h('span', {
      'aria-label': 'Export offline HTML (Recommended)',
      'data-slideblocks-offline-export-label': 'true',
      'style': 'display:flex;flex-direction:column;align-items:flex-start;line-height:1.25;font-weight:600',
    }, [
      h('span', { style: 'white-space:nowrap' }, 'Export offline HTML'),
      h('span', {
        'data-slideblocks-export-recommended': 'true',
        'style': 'color:var(--slidev-theme-primary,currentColor);font-size:.82em;font-weight:700;white-space:nowrap',
      }, OFFLINE_EXPORT_RECOMMENDATION),
    ])
  },
})

export default defineContextMenuSetup((items) => {
  return computed(() => [
    ...items.value,
    'separator',
    {
      small: false,
      icon: 'i-carbon:download',
      label: RecommendedOfflineExportLabel,
      action: downloadOfflinePlayer,
    },
    {
      small: false,
      icon: 'i-carbon:document-pdf',
      label: PDF_EXPORT_LABEL,
      action: openPdfExport,
    },
  ])
})
