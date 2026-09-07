<script setup lang="ts">
// Presenter workbench: native Slidev context-menu bootstrap.
// Slidev 52 creates the menu lazily from an event callback, but the setup
// composables require Vue injection context. Prime the official items here and
// open that same native component before the broken bubble listener runs.
import { onMounted, onUnmounted, watch } from 'vue'
import { useNav } from '@slidev/client'
import { closeContextMenu, openContextMenu } from '@slidev/client/logic/contextMenu.ts'
import setupContextMenu from '@slidev/client/setup/context-menu.ts'
import { applyTextEditsWhenReady, installTextEditInteractions, notifyPageChange, uninstallTextEditInteractions } from './setup/text-edit'

const isPdfPrintView = document.documentElement.dataset.slideblocksPdfView === 'true'
if (!isPdfPrintView) setupContextMenu()
const { currentPage } = useNav()
let stopPageWatch: (() => void) | undefined

function openNativeContextMenu(event: MouseEvent) {
  if (event.shiftKey || event.defaultPrevented) return
  const slide = document.querySelector('#slide-container')
  if (!(slide instanceof HTMLElement) || !(event.target instanceof Node)) return
  if (!slide.contains(event.target)) return
  openContextMenu(event.pageX, event.pageY)
  event.preventDefault()
  event.stopImmediatePropagation()
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !document.querySelector('.z-context-menu')) return
  closeContextMenu()
  event.preventDefault()
  event.stopImmediatePropagation()
}

onMounted(() => {
  if (isPdfPrintView) return
  installTextEditInteractions()
  stopPageWatch = watch(currentPage, (page) => {
    notifyPageChange(page)
    applyTextEditsWhenReady(page)
  }, { immediate: true, flush: 'post' })
  document.addEventListener('contextmenu', openNativeContextMenu, { capture: true })
  document.addEventListener('keydown', closeOnEscape, { capture: true })
})

onUnmounted(() => {
  if (isPdfPrintView) return
  stopPageWatch?.()
  uninstallTextEditInteractions()
  document.removeEventListener('contextmenu', openNativeContextMenu, { capture: true })
  document.removeEventListener('keydown', closeOnEscape, { capture: true })
})
</script>

<template>
</template>
