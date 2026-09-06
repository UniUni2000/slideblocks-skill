# Runtime Workbench (Presenter Tools)

Presenter tools must work in dev, production, static hosting, and `offline.html`.

## Wiring

Set top-level `wakeLock: false` and `drawings: { persist: false }`. Wake Lock is an
optional convenience. The Deck must not make the automatic request: Safari can
reject the automatic screen Wake Lock request before activation. Never patch
`navigator.wakeLock` or suppress failures.

Use the canonical files under `assets/workbench/`:

- Merge `context-menu.vue` into `global-top.vue`; preserve Deck UI, prime native
  `.z-context-menu` in Vue setup, and install/dispose listeners. Intercept only
  `#slide-container` right-click; preserve Shift+right-click and outside menus.
- Copy all supplied Workbench `.ts` helpers to `setup/`. Check all supported
  setup extensions; compose existing setup/plugins once, reject competing files/routes.
- Keep drawing, overview, presenter, fullscreen, navigation, and `P` opening the
  current presenter slide in a new tab. First custom export: English-only
  **Export offline HTML**, emphasized **(Recommended)**. Final action:
  **Export PDF**. Use `pathPrefix` for presenter/subpath-safe Deck roots.

Skill updates do not migrate Deck copies; explicitly migrate when in scope,
then rebuild every output.

## Editing and export

Double-click ordinary text to edit with outlines/unsaved indicator, not formatting
tools. `⌘/Ctrl+S` saves; Escape/blank-slide click saves/exits; navigation saves the
outgoing page. Failed saves stay visibly unsaved and block export. Preserve
presentation clicks, undo/redo, clipboard, inline styling, and noneditable
code/SVG/formulas/links/controls.

Bound plain-text patches by deck/page; match structure/original text, skip
mismatches. Explain that editing does not write changes back to slides.md or Vue source.
Never inject HTML or silently reconcile source-map facts/execution locks.

The development-only bridge runs canonical `.slideblocks/build-offline.mjs`: enforce
same-origin/local-client, body/schema bounds, concurrency, and timeouts. Static
hosting reads prebuilt self-contained HTML without build tools. Missing or
incompatible artifacts fail; never substitute a DOM snapshot.

Capture the original shell before Vue mounts; export it plus inert JSON patches,
never live DOM. Keep export in `file://`. Reopening preserves saved edits over
initial seeds. Re-export new browser-local edits to carry them with the file;
never duplicate runtime payloads.

PDF saves pending edits and synchronously opens `/slideblocks-pdf`, falling back
to this tab if blocked. Register once; put `?print=true` before the hash. Reuse
native DOM print after stable slides/fonts/images; replay patches and fix trailing
blank pages. Keep visible `⌘/Ctrl+P` fallback and the route offline. Text/SVG stay
vector: no screenshot libraries or full Browser Exporter/PPTX/image-export UI.

## Verification

The verifier enumerates hash routes. Use a hash-routed production preview for its
full gate; inspect history-routed development pages by their actual URLs. Keep the
offline download byte-identical to the generated file, without injected Vite scripts.

Native `diagram:mermaid` has a separate final-output contract: inline native SVG,
actual renderer version/type, visible graphics and labels, uniform scaling,
readable final-size type, label/viewport containment, and local arrowhead references.
Do not relabel it as SlideBlocks semantic SVG. Follow `mermaid-presentation.md`
for source and rendered review of type-specific meaning, collisions, resolved
fonts and icons; passing geometry checks alone cannot certify these.

Copy the builder and `assets/workbench/verify-runtime.mjs` byte-for-byte to
`.slideblocks/`. Build the final player, then check the served Deck:

```sh
node .slideblocks/verify-runtime.mjs http://localhost:3030 --browser=chromium \
  --execution-lock=.slideblocks/execution-lock.json
```

Copy `offline.html` alone and check that exact handoff file:

```sh
node .slideblocks/verify-runtime.mjs /absolute/path/to/copied/offline.html \
  --layout-only --browser=chromium --execution-lock=.slideblocks/execution-lock.json
```

The explicit lock prevents wrong-project discovery. Check fonts/media-ready
keyboard/tab/`aria-controls`/`data-slideblocks-state-control` states. Apply every
geometry, source/route/carrier, and semantic-SVG gate in the verifier and
`references/qa.md`. Adjacent raw sup/sub pairs fail as `RAW_MATH_SCRIPT_PAIR`.
Visible `aria-hidden` counts; masks/tiny type cannot hide failures. The verifier
does not prove every pseudo-element, path, or canvas stroke; screenshot-review
line meaning, crop, and clutter.

Use fresh pages for P, menu clamping/Escape/Shift+right-click, overview, presenter,
drawing/stroke, PDF, download, and console. Prove Chromium fullscreen. For Safari
changes run matching `playwright-webkit` with `--browser=webkit`; its headless
fullscreen is **SKIP**. Check menus/fullscreen manually in the current macOS Safari release,
served and offline.

Test repeated editing, immediate/repeated undo/redo, source mismatch, and denied
storage. Require dev edit → export → copied-file edit/save → reload → re-export →
fresh-context/new-path open → print latest text. Block file-playback network;
preserve navigation/formatting/controls/reduced-motion. Save PDF with backgrounds; inspect page count,
latest/vector text, and no trailing blank page. Markers, print readiness, hidden
panels, or failed exports prove no delivery.
