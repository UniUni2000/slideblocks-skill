# DiagramSpec

Use this compact model only for a complex process, architecture, or relationship graph. It is a semantic contract for the diagram, not a second page plan and not a visual style system.

It borrows one narrow idea from X6: labels belong to an edge and move with that edge. It does not adopt X6 markup, attributes, themes, or rendering; SlideBlocks remains the visual system.

## Ownership

Copy `assets/diagram/diagram-engine.mjs` and its adjacent `icon-library.mjs` into the project together, even when no node uses icons.

- Nodes own their text, dimensions, ports, and semantic tone.
- Edges own their endpoints, route meaning, and zero or more labels. A label is never a free-floating node.
- ELK consumes measured node and label dimensions and returns candidate node positions and connector routes.
- SlideBlocks SVG renders the approved hierarchy, type, color, line, arrow, label, and canvas treatment. The visual director may refine candidate geometry and decides whether the page passes.

## Minimal shape

```ts
type EdgeLabel = {
  id: string
  text: string
  position?: {
    distance?: number // 0..1 along the complete routed polyline; default 0.5
    offset?: number | { x: number; y: number } // normal offset, or explicit canvas delta
  }
}

type Edge = {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  tone?: string
  feedback?: boolean
  layoutPriority?: number
  labels?: EdgeLabel[]
}
```

Every label `id` is unique within its edge, `text` is non-empty, `distance` stays within `0..1`, and all endpoints and ports resolve. Use `labels: []` or omit the field when a relationship needs no visible label. The deprecated single `label` string may be read only as a legacy adapter and normalizes once to `labels: [{ id: "label-0", text, position: { distance: 0.5 } }]`; reject a spec that supplies both forms or an empty legacy label.

## Geometry and review

Measure real rendered text before ELK layout and pass every node and edge label's width and height to the candidate graph. Size nodes from those glyph bounds plus deliberate inner padding; `nodePaddingX: 28` and `nodePaddingY: 18` are useful starting values, not permission to shrink a node until its text merely fits. After routing, place each edge label from the cumulative length of the complete edge polyline, then apply its normal or canvas offset. When `offset` is omitted, the bundled engine places the label clear of the owning path using the rectangle's half-extent projected onto the path normal and configured clearance. Moving a node or rerouting the edge therefore moves its labels with it.

Do not limit node labels by character count: Chinese, Latin, numbers, and mixed scripts occupy different real widths. In the final rendered SVG, use the tallest rendered line's glyph height and keep at least `max(16px, 0.6 × line glyph height)` on each horizontal side of node text and `max(10px, 0.35 × line glyph height)` above and below the complete text block. For edge-label text, keep at least `max(8px, 0.4 × line glyph height)` horizontally and `max(5px, 0.2 × line glyph height)` vertically. Configured padding may increase these floors but never reduce them. If a label fails, widen its frame, use a meaningful two-line wrap, or shorten the wording, then rerun layout; do not solve it by pushing text against the frame or shrinking it below projection readability.

Treat a collision as a failed candidate, not permission for a hidden physics pass. Adjust the semantic graph, ELK constraints, node spacing, label `distance` or `offset`, or the page composition explicitly. An edge label's protected bounds must keep positive measured clearance from its own painted connector, every unrelated path, every arrow marker, and every node. Resolve marker clearance from the final marker's painted child bounds plus its live `viewBox`, `preserveAspectRatio`, `markerUnits`, `refX`, `refY`, endpoint tangent, and `orient`; fail closed when painted marker geometry cannot be resolved. A background mask over a continuous line is not clearance. Reject labels that leave the diagram bounds, overlap a node or another label, sit ambiguously near an unrelated relationship, detach visibly from their owning edge, or become unreadable at projection distance. Verify the arrow terminal against the declared target port and port side.

Manual refinement must preserve `data-edge-id`, `data-label-id`, `data-node-id`, and `data-port-id`, mark the actual node and label backing primitives with `data-slideblocks-text-owner`, and keep `data-slideblocks-diagram="final"` on the SVG that the page really renders. A generated final root also declares `data-slideblocks-render-route="diagram:elk"`, `data-layout-role="final"`, `data-layout-engine="elkjs"`, and `data-visual-renderer="slideblocks-svg"`. The mounting component exposes literal `data-slideblocks-asset-id="A<NN>"` plus the same route, while `execution-lock.json` records that route and its project-local generator. Run the final DOM geometry gate after refinement; do not validate a sibling candidate file that the slide does not display.

## Experimental presentation fit adapter

`assets/diagram/presentation-diagram.mjs` is an opt-in bounded adapter, not a universal diagram language or a new default for every page. Copy it with `diagram-engine.mjs` and `icon-library.mjs` into the project. Install `elkjs` and `playwright-chromium` only in that project. It supports rectangular graph nodes, explicit ports, branches, feedback and graph hierarchies. Swimlanes, nested containment, ranks and arbitrary shapes are not implemented and are rejected instead of silently flattened.

```js
import { compilePresentationDiagram } from './presentation-diagram.mjs'

const result = await compilePresentationDiagram(spec, {
  dependencyRoot: projectRoot,
  canvasWidth: 1160, canvasHeight: 440,
  fontFamily: '"Your local font", sans-serif',
  fontCss: localEmbeddedFontCss,
  minNodeFontSize: 22, minEdgeFontSize: 18,
  idPrefix: 'p03-review-main',
  icons: resolvedLocalIcons,
})
// Write result.svg, sourceSpec, resolved spec and presentation report.
```

The adapter measures real browser wrapping, tries a finite set of text widths and spacing profiles, and returns the **first passing** candidate. It does not claim global optimality. `textWidths` accepts one to four positive widths; `directions` accepts one or two explicitly authorized directions and otherwise preserves the source direction. It does not delete content, rewrite labels or change ports to fit. Edge-label repairs stay edge-relative, preserve pinned position fields, and are reported. `PresentationFitError.report.attempts` explains a failure; enlarge or deliberately recompose the diagram region rather than lowering the font floors. Extra height alone cannot repair a width-constrained graph.

`nodeMaxTextWidth` / `edgeMaxTextWidth` on the underlying engine use the real loaded font and preserve source text separately from measured `displayLines`. Check Chinese word grouping and orphan lines visually: automatic wrapping is not linguistic editing. The wrapper guards effective font size and transformed viewport bounds, but the final browser gate is still required for painted markers and whole-page geometry. Supply a unique `idPrefix` for each mounted SVG instance, including repeated copies of the same graph; hidden Slidev slides still share the document's ID namespace. The default prefix is derived from the full graph ID, not a guarantee of unique repeated mounts.

## Local icons and theme

Use one coherent icon collection; a diagram node may declare `icon: 'lucide:database'`. Resolve that exact ID to `{ body, width, height }` in `options.icons` before compiling. Unknown or unsafe icons fail. The default icon slot is 28px plus a 12px gap and participates in node sizing. Do not use icons in place of photographs, evidence or missing labels.

```sh
node icon-library.mjs search /path/to/collection.json database --limit 8
node icon-library.mjs get /path/to/collection.json lucide:database --output ./database.json
```

This is literal local Iconify name/alias search, not multilingual semantic search or a complete icon service. Search a relevant English concept, inspect the returned artwork, preserve the original collection and complete license notice, then embed only selected static SVG bodies. The CLI refuses to overwrite existing output. The safe subset rejects scripts, external references, styles, animations and unsupported artwork instead of silently changing it. License metadata alone may omit a collection's additional attribution terms.

The engine accepts a compact `theme` with `background`, `text`, `muted`, `nodeFill`, `nodeStroke`, `labelBackground`, `portFill` and `tones.active|risk|info|neutral` fill/stroke overrides. Keep those roles aligned with the page's content and palette; theme tokens do not decide the page composition.
