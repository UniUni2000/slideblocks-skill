# FigureSpec

Use FigureSpec for a two-dimensional explanatory figure whose content is freer than a flowchart but whose repeated units or callouts still need one professional layout system. It is a small semantic input contract, not a general drawing language.

Use `assets/diagram/figure-engine.mjs` as the executable authority. It is a Node/build-time compiler, not a browser-side Vue dependency. Do not reproduce its geometry by hand.

## Decide the visual semantics before the recipe

Classify the intended carrier before choosing `comparison`, `annotated`, or `graph`:

- **Quantitative:** positions, lengths, areas, colors, or paths encode measured or computed values. Use a real plotting route that visibly preserves fields, units, domain, baseline, labels, uncertainty, transformations, and source. The current FigureSpec visual layer has no axis or legend slots and is not a ChartSpec.
- **Conceptual:** marks encode named objects, containment, direction, sequence, causality, or spatial relationships. Define those entities and relationships first, then implement one subject-specific bounded renderer.
- **Mixed:** split the quantitative and conceptual regions so viewers can tell which geometry is measured and which is explanatory. Do not make one unlabeled silhouette carry both meanings.

If the source supports only a statement, number, or uncertainty and no honest visual encoding, do not invent a figure. Use measurable HTML for the statement, value, unit, qualifier, and source.

FigureSpec recipes own outer slots, gaps, rails, anchors, and containment. They never choose subject marks. Do not infer a renderer from title keywords or populate unrelated peers by selecting stock curves, bars, dots, or nested boxes.

## Choose one of three recipes

- **`comparison`** — repeated methods, states, components, alternatives, or small multiples. Every peer receives the same `title / visual / note` anatomy.
- **`annotated`** — one irregular scientific, spatial, physical, or conceptual visual with named anchors and callouts allocated onto four outer rails.
- **`graph`** — a process, architecture, hierarchy, or relationship graph. This delegates to the existing DiagramSpec engine and ELK; do not create a second graph model.

If none of the three recipes fits, write one bounded visual renderer and place it inside `comparison` or `annotated`. Do not add a `free` page layout or expose arbitrary coordinates to FigureSpec.

## Author-facing contract

```js
const comparison = {
  schemaVersion: 1,
  id: 'method-comparison',
  kind: 'comparison',
  layout: { type: 'grid', columns: 2 }, // or { type: 'lanes' }
  items: [
    {
      id: 'method-a',
      title: 'Method A',
      note: 'Short interpretation',
      visual: {
        renderer: 'exact-search-candidate-space',
        purpose: 'Show that every candidate participates in exact search',
        geometrySource: { type: 'semantic-model', ref: 'P04.exact-search-model' },
        data: { candidates: candidateRecords },
      },
      tone: 'primary',
    },
    // 1–7 more items with the same semantic slots
  ],
}

const annotated = {
  schemaVersion: 1,
  id: 'layered-structure',
  kind: 'annotated',
  layout: { type: 'callout-frame' },
  visual: {
    renderer: 'cell-envelope-boundaries',
    purpose: 'Show the containment and adjacency of the three named boundaries',
    geometrySource: { type: 'source-figure', ref: 'I03.figure-2' },
    data: { boundaries: ['outer', 'middle', 'inner'] },
  },
  callouts: [
    { id: 'outer-label', target: 'outer', label: 'Outer layer', side: 'auto' },
    { id: 'inner-label', target: 'inner', label: 'Inner layer', side: 'east' },
  ],
}

const graph = {
  schemaVersion: 1,
  id: 'request-flow',
  kind: 'graph',
  diagram: diagramSpec,
}
```

Visible content may be a string or a formula object such as `{ type: 'formula', tex: '\\alpha + \\beta' }`. Formula rendering reuses the host's KaTeX. Do not simulate formula layout with Unicode or positioned HTML.

The author-facing contract deliberately does not include:

- `x`, `y`, `width`, `height`, or arbitrary offsets;
- per-item padding, gap, border, font, or label placement;
- `row`, `column`, `overlay`, `free`, or a generic `constraints` array;
- raw SVG markup or page-level paths.

Those choices belong to the selected recipe, shared theme, or a bounded visual renderer. If a label does not fit, shorten or wrap it, enlarge the figure region, reduce the item count, or split the page. Do not tune one peer independently or shrink its text.

Every non-graph `visual` also requires:

- `purpose` — one concise statement of what the carrier itself helps the audience understand when surrounding prose is hidden;
- `geometrySource.type` — `source-data`, `source-figure`, `semantic-model`, or `illustrative`;
- `geometrySource.ref` — the exact dataset, source figure, page-plan semantic model, or recorded illustration decision that produced the geometry.

The claim source and geometry source are different evidence questions. A paper that supports the sentence does not make an invented curve, arbitrary point count, or decorative bar height source-derived. Record claim provenance in the project source map and geometry provenance on the visual; do not let either stand in for the other.

## No stock visual library

The engine intentionally exposes no Agent-facing `bars`, `curve`, `dots`, or `layers` renderer. Those names fail closed. They encouraged shallow “concept resembles glyph” routing and cannot satisfy the current chart requirements because the visual layer has no measurable axes, units, categories, values, or legend.

Write one semantic renderer whose name and data model describe the actual entities or relationships. Reuse low-level SVG marks and open-source geometry utilities inside it; do not rebuild the outer layout or create a new page template.

Load only what the selected route needs:

- curves, contours, paths, areas, and arcs inside a semantic renderer: `d3-shape`;
- mapping legitimate data or model values to geometry inside a semantic renderer: `d3-scale`;
- `graph`: `elkjs`, through the existing DiagramSpec engine;
- formula content: reuse the project's existing `katex`;
- TikZ: no built-in adapter in this release; the future boundary is described below.

The `graph` branch inherits the Figure canvas. `graphOptions` may tune DiagramSpec routing, but it cannot silently replace the wrapper width or height; a mismatched returned Diagram canvas fails closed.

Do not install complete `d3`. Add direct dependencies to the presentation project only when its chosen visual route uses them. Skill activation itself must never install packages.

## Bounded visual renderers

A custom renderer receives one assigned visual box and returns SVG marks plus named anchors:

```js
const visualRenderers = {
  'layered-envelope': {
    validate(data) {
      return validateMyData(data)
    },
    async resolve({ data, box, semantic, theme, loadDependency }) {
      // semantic.purpose and semantic.geometrySource are the normalized contract.
      const path = makePath(data, box)
      return {
        marks: [
          {
            id: 'boundary-shape',
            type: 'path',
            d: path.d,
            bounds: path.paintedBounds,
            fill: 'none',
            stroke: 'primary',
            strokeWidth: 3,
          },
        ],
        anchors: [
          { id: 'boundary', markId: 'boundary-shape', x: box.x + box.width, y: box.y + box.height / 2, normal: { x: 1, y: 0 } },
        ],
      }
    },
  },
}
```

Allowed marks are `rect`, `circle`, `ellipse`, `line`, `path`, `polygon`, and `polyline`. A renderer may use local calculations, D3, or domain data, but it must obey these boundaries:

- draw only inside its assigned visual box;
- give semantic marks a stable `id`, bind their anchors with `markId`, and derive those anchors from the mark's actual geometry; an anchor must land on its mark and an explicit callout side must agree with its anchor normal;
- provide finite geometry for every mark; `path` marks must also provide painted `bounds` because the structural gate does not parse arbitrary path commands;
- emit no SVG `<text>`, `foreignObject`, embedded HTML, scripts, or external network assets;
- use semantic fill and stroke roles rather than inventing a separate page palette;
- never position surrounding titles, notes, callouts, or page furniture.

The engine derives painted bounds for primitive marks, validates path-provided bounds and every anchor against the slot, and keeps the visual renderer replaceable without changing the FigureSpec. The mounted workbench performs a second check against the actual rendered visual group, including stroke expansion; path bounds are therefore an input contract, not the final proof.

## Make the visual carrier explain the mechanism

An `annotated` figure can pass every collision check and still fail as an explanation. For a mechanism or transport figure, review the carrier once with the page title, takeaway, and surrounding prose hidden:

- encode every essential direction and causal handoff in the marks themselves; prose may interpret the mechanism but must not be the only place that states it;
- distinguish opposing flows and outbound channels with independently legible directional marks rather than relying only on color or callout wording;
- begin each HTML callout with the concrete target object or region, and bind its leader to that semantic mark or region instead of a convenient nearby particle or decorative point;
- remove geometry that could plausibly be read as an unclaimed orbit, path, boundary, enclosure, or relationship;
- when a formula is necessary, keep it subordinate to the figure and define unfamiliar symbols in adjacent measurable HTML.

This is a semantic review rule, not an arrow quota or a new FigureSpec field. A figure whose subject has no directional mechanism should not manufacture one.

## Generate, then mount

Run the compiler from a Node authoring or build script such as `.slideblocks/generate-figures.mjs`. Do not import `figure-engine.mjs` directly from a Slidev/Vue component: the compiler intentionally uses Node APIs for dependency discovery and Chromium measurement. Persist the generated markup or a generated module, then mount that output from the component. `comparison` and `annotated` need only `figure-engine.mjs`; `graph` also needs the adjacent `diagram-engine.mjs` and its `icon-library.mjs` dependency, even without icons. The graph engine is loaded lazily only for that route.

Lock the selected code-backed asset to `figure:comparison`, `figure:annotated`, or `figure:graph` in `execution-lock.json`, and lock the project-local generator path. The mounting component must expose literal `data-slideblocks-asset-id="A<NN>"` and the matching `data-slideblocks-render-route` on its carrier. Compiled final markup repeats the route on the FigureSpec root, so static validation can bind the source to the lock and runtime QA can prove that the mounted output realizes the same route.

```js
import { compileFigure } from './figure-engine.mjs'

const compiled = await compileFigure(spec, {
  canvasWidth: 1200,
  canvasHeight: 620,
  visualRenderers,
  // Optional but recommended when the deck uses custom fonts or formulas:
  measurementCss: deckFontAndKatexCss,
})

// Persist compiled.markup, mount the generated output in Slidev, then run the bundled
// workbench verifier against the real slide after fonts load.
```

`compileFigure()` returns normalized spec, measurements, SceneIR, lint report, separate SVG and HTML layers, complete markup, and stable geometry JSON. Comparison titles and notes and annotated callouts stay in measurable HTML. Their visual marks and leader lines stay in SVG and contain no text. The graph compatibility branch preserves concise intrinsic SVG labels from DiagramSpec.

The default Chromium measurement document applies the requested font stack but cannot infer arbitrary deck CSS. Pass the deck's relevant `@font-face`, typography, and KaTeX CSS through `measurementCss`, or provide a trusted host `measureText` adapter. Measurement waits for fonts after the content is mounted and records both vertical and horizontal overflow. The real mounted workbench remains mandatory because build-time measurement is still not the final host render.

`renderFigureMarkup()` used on an unapproved SceneIR emits `data-slideblocks-figure="resolved"`. `compileFigure()` emits `data-slideblocks-figure="final"` only after the deterministic SceneIR gate passes. Here `final` means compiler-final, not delivery-approved. The bundled workbench then checks real post-font HTML overflow, peer slot size and baseline equality, visual containment, callout overlap, leader landing, SVG text boundaries, assets, macro regions, and the complete slide in live, reduced-motion, and offline states. Export still requires rendered review; neither an attribute nor a passing structural lint is aesthetic approval.

## Future TikZ adapter boundary

This release does not ship a TikZ probe, compiler, sanitizer, or nested-SVG visual renderer. TikZ is therefore not an executable FigureSpec route yet, not a fourth layout engine, and not a default dependency.

If a later adapter is added, use it only when the source is already TikZ, the figure is math-native, the TeX ecosystem materially improves the result, and the delivery environment has a pinned TeX-to-SVG toolchain. It must compile in a temporary directory with shell escape disabled, crop to exact bounds, sanitize scripts, external references and embedded content, expose a bounded visual leaf with named anchors, and keep surrounding Chinese or explanatory labels in FigureSpec HTML callouts.

For now, report TikZ as unavailable and use a native SVG renderer. Do not install a TeX distribution automatically. Do not use TikZ merely to tidy an ordinary process, architecture, comparison, or heavily Chinese-labelled figure.

## Failure behavior

The engine fails closed instead of silently moving or shrinking content. Important stable codes include:

- input: `invalid-kind`, `duplicate-id`, `manual-geometry-forbidden`, `unknown-visual-renderer`, `generic-visual-renderer-forbidden`, `missing-visual-purpose`, `missing-geometry-source`, `invalid-layout-option`;
- resolution: `font-not-ready`, `missing-measurement`, `visual-resolve-failed`, `unresolved-anchor`, `layout-capacity`, `callout-capacity`, `graph-compile-failed`;
- geometry and final DOM: `slot-out-of-bounds`, `visual-out-of-slot`, `semantic-visual-metadata-mismatch`, `peer-slot-size-drift`, `peer-slot-baseline-drift`, `text-overflow`, `callout-overlap`, `leader-crosses-text`, `leader-target-miss`, `svg-text-forbidden`.

These checks prove structural consistency, not taste. The visual director still owns page-scale hierarchy, density, palette, evidence, and the final projection review.
