// Deck-level shortcut extensions for the SlideBlocks presenter workbench.
import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { pathPrefix, useNav } from '@slidev/client'

export default function deckShortcutsSetup(
  _nav: NavOperations,
  shortcuts: ShortcutOptions[],
): ShortcutOptions[] {
  const { currentPage } = useNav()

  function openPresenter() {
    // pathPrefix covers history and hash routing. Deep-link to the page that is
    // currently visible instead of silently returning the presenter to page 1.
    window.open(`${pathPrefix}presenter/${currentPage.value}`, '_blank')
  }

  return [
    ...shortcuts,
    {
      name: 'open_presenter',
      key: 'p',
      fn: openPresenter,
    },
  ]
}
