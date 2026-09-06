# Mermaid for presentation pages

Use native Mermaid only after `diagram-direction.md` selects it for a simple relationship, an explicit user request, or to preserve an explicitly selected Artifact's contract. The default conceptual route is image-first hybrid assembly. This is guidance for using a mature renderer, not another diagram language, a fixed template catalog, or a promise of arbitrary perfect layout. Quantitative/scientific plotting remains on its existing source/data route.

## Decide the drawing with the page

In the existing Page Brief, say what the drawing must make easy to see, its likely diagram type, useful icons or imagery, visual treatment, and proposed position and space. For example, who hands work to whom calls for a different drawing from the order in which systems exchange messages. Keep essential words, actors, directions, conditions, and grouping; omit decorative steps and icons. Real photographs or documents may belong beside a diagram when they establish something the drawing cannot. Never substitute a conceptual drawing for documentary evidence.

Think first of the clearest possible explanation, then check the tool's actual ability. Do not start with default Mermaid output and arrange the slide around it. Do not produce a second planning document or prescribe the same composition for every page. The proposed region can change when the real drawing shows that it needs more room.

## Use the actual installed tool

- Check the project's installed Mermaid version and the official syntax/configuration for the chosen type. Use the [official syntax index](https://mermaid.js.org/intro/) and [configuration](https://mermaid.js.org/config/usage.html) as needed. Do not hardcode a permanent list of supported types, copy the entire manual, or assume a website example works in an older package. A new/beta type or optional integration needs an actual render probe before page commitment.
- Prefer the pinned open-source native `mermaid` package. Third-party compatible renderers are separate tools with different syntax, fonts and layouts; use one only after checking its license and the exact labels, actors, arrows and groups survive. This native route does not certify third-party output; keep it an isolated comparison until explicitly integrated. A prettier output that silently drops relationships fails. Do not silently switch to a paid editor or service.
- Share the deck's real font, background, palette, line treatment and emphasis. Choose a theme/look only when the installed renderer supports it. Renderer-specific configuration differs by diagram type: flowchart spacing options do not automatically style sequence or architecture diagrams.
- Icons are optional recognition aids, not one-per-node decoration. Search one suitable free/open collection using concrete names, inspect the artwork, and preserve its license. [Register a local Iconify pack](https://mermaid.js.org/config/icons.html) through `mermaid.registerIconPacks([{ name, icons }])` for a type that supports it. Bundle selected static icons; do not rely on a CDN, invent icon IDs, mix inconsistent families, or treat a generic icon as a factual logo/photo.

## Fit the allocated space without hiding the problem

Use the actual region width and height and the complete slide, not a generic 16:9 export size. Wide, tall and near-square regions may need different directions and text breaks. On a 1280 × 720 slide, start around 24–32px for node text and at least 18px for relationship labels **after the SVG is fitted**. Larger venues may require more. A configured 28px font can become unreadable after scaling.

1. Preserve the meaning, shorten unnecessary wording, and break labels at natural phrases. Avoid isolated characters or words and unexplained abbreviations.
2. Choose a direction and grouping appropriate to both the relationship and the available space. Change supported spacing, padding and wrapping options, then rerender using the real loaded font. Use the selected type's own controls; do not manually move individual nodes or arrow labels after rendering.
3. Fit uniformly with `preserveAspectRatio="xMidYMid meet"`. Check the actual screen text size, label spacing, arrow destinations, drawing bounds, and unused space. Try a small number of meaningful alternatives only when the first result fails; do not build a general automatic-layout search engine.
4. If it is still cramped, give it more of the page or revise the explanation. Never use nonuniform scaling, clipping, overflow hiding, a raster screenshot, or tiny fonts to make the box appear satisfied. Split a page only when the user's page boundaries permit it. Report a genuine unresolved capacity problem.

## Reproducible native output

Keep project-local editable `.mmd` source, configuration, local fonts/icons and their licenses, and a generator script. Install dependencies only in that project; in a workspace repository use `npm install --workspaces=false` to avoid changing the parent workspace. Load fonts before calling native `mermaid.render(uniqueId, source)`. Preserve its SVG geometry and native type/label structure; use a unique ID prefix per mounted instance because hidden slides share one document.

Record `renderRoute: "diagram:mermaid"` and the generator in the asset's execution-lock entry. Mount the generated SVG **inline**, inside a component with literal `data-slideblocks-asset-id="A<NN>"` and `data-slideblocks-render-route="diagram:mermaid"`. On the SVG root retain native `aria-roledescription`, set `data-slideblocks-mermaid="final"` and `data-mermaid-version` to the actual package version, and retain its `viewBox`. Do not use `data-slideblocks-diagram`, `data-node-id` or other custom DiagramSpec ownership attributes to impersonate SlideBlocks SVG. The final marker identifies the intended output; it does not certify quality. An `<img>` wrapper cannot satisfy the inline runtime route.

Save a small generation receipt beside the SVG naming the exact source/config, renderer version, icon/font inputs and resulting SVG. Compare the source's entities, labels, directed relationships and groups with the output, including the direction of every exception/feedback path. Do not use a generic graph parser to flatten all Mermaid types into a flowchart. Check type-specific meaning directly when a programmatic comparison is unavailable, and record that inspection honestly.

## Approve the displayed result

Run the bundled workbench verifier on the live slide and copied `file://` offline file. Its native route checks inline output, metadata, visible text/graphics, final-size text, nonuniform scaling, label/viewport containment and unresolved marker references. These checks are not full semantic or collision proof for every Mermaid type. Inspect the full-size page for label-to-arrow association, crossing/overlap, node padding, alignment, actual font fallback and overall reading clarity. Do not claim that all types are validated because one flowchart passed.

Native Mermaid's on-edge label backing is allowed when the label clearly belongs to that edge and obscures no important information. This is not the custom DiagramSpec positive-clearance guarantee. If the rendered result is ambiguous, change Mermaid inputs/options or page composition, not its individual coordinates.

After fonts and icons load, review normal, reduced-motion, print/PDF and the copied offline output at the real presentation size (at least 1280 × 720). Verify text, icons, arrowheads, all essential relationships and a complete static state. Rebuild and rerender after repairs. Keep one strongest result; retain rejected candidates only as development evidence, not extra slides.
