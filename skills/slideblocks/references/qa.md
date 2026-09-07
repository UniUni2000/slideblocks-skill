# Visual QA

Treat build success as a prerequisite, not visual approval. A successful build does not prove that a page is legible, collision-free, complete in motion, or safe to export.

## Prepare the inspection

- Run the actual Slidev project with its detected package manager.
- Open the real presentation route, not a component mockup or stale screenshot.
- Inspect at 1280 × 720 and at the project's native or export canvas size.
- Wait for `document.fonts.ready` and all required images, video, SVG, and remote assets before measuring or judging layout.
- Record the browser route, viewport, states checked, commands run, and any skipped checks.

## Mechanical layout gate

Run the bundled browser verifier on the served Deck before aesthetic approval, then run its layout-only mode on the exact copied `offline.html` used for handoff. The verifier waits for fonts and visible media, traverses keyboard-discoverable states plus native tabs, `aria-controls`, and `data-slideblocks-state-control`, and checks both ordinary HTML and inspectable SVG text. Custom controls without one of those discovery hooks remain a manual QA obligation.

Treat text overflow or clipping, slide or owning-container escape, declared macro-region overlap, negative header/body/footer clearance, content crossing a detectable foreign HTML border or thin rule, broken assets, and SVG text escaping its viewport or marked owning frame as deterministic failures. Repair the layout and rerun the affected surface; `overflow: hidden`, unreadable font reduction, or moving substantial copy into an unmeasured external SVG does not pass.

The gate does not prove the meaning of a line, detect every pseudo-element, SVG path, or canvas stroke, decide whether a crop is strong, or decide whether a page feels crowded. Review those questions from rendered screenshots under Aesthetic reasoning and Page-level checks.

## Content and narrative review

For a complete Deck, compare the rendered sequence with the merged Page Briefs before aesthetic approval. Record the findings and any repair under `## Aesthetic review and repairs` in `.slideblocks/qa-report.md`; do not create a score or a second QA artifact.

- Confirm that every page fulfills its recorded purpose with concrete enough content and material. When it makes a factual claim, require traceable support or an honest gap; do not force a showcase, transition, quotation, or orientation page into an argument model.
- Challenge an underspecified plan: reject body pages that omit the evidence, necessary equation/method, comparison or limitation needed to answer their audience question even if they match a shallow brief. A bibliography in notes does not repair missing on-screen explanation. Inspect whether adjacent thin pages should form one coherent explanation within the user's permitted scope; never repair by violating locked page boundaries.
- Reject pages that still render as generic headings, interchangeable bullets, unsupported claims, vague “add an image/chart” intent, or a restatement of another page's job.
- Confirm that adopted photographs, charts, documents, quotations, examples, and interface states match the material direction and retain the qualifier or source context that made them useful.
- Under the scientific-talk default, inspect whether substantial source or illustrative material actually leads the composition and concise ordinary bullets explain its relationships. A paper-like palette, serif titles, bullet dots or a passing carrier-only check alone do not establish the requested style. Challenge avoidable replacement of useful source imagery with generic boxes or score summaries, and inspect why any dense original was rejected before accepting a redraw.
- Inspect paper-figure axes, legends, uncertainties and short credits at final size. A visually busy but unreadable figure, unnecessary image substitution, or miniature collage does not pass as rich evidence. Source credits belong below their figure or clearly shared figure group, with full bibliography in notes/references.
- Where the Page Brief distinguishes visible, presenter, appendix, or deferred material, confirm that the separation survived implementation: screen copy remains natural and concise, deeper explanation stays available, and useful sequence context is not lost.
- Repair the highest-impact content or narrative failure in the owning source map or page plan before changing the rendered page, then recheck the affected page and its neighbors.

## Aesthetic reasoning

Complete the critique in `design-principles.md` before treating geometric correctness as visual approval.

- Confirm that the visual thesis is specific to the content rather than an interchangeable template treatment.
- Confirm that the selected Registry Artifacts, brand assets, imagery, palette, typography, diagrams, and motion feel like one presentation.
- Trace the palette to the brand, source imagery, or subject context; reject arbitrary colors and generic AI-default styling.
- Inspect Chinese and mixed-script typography after fonts load, including fallback glyphs, line height, line breaks, punctuation, synthesized styles, baselines, and tabular numerals.
- Read visible copy aloud. Flag reusable assistant prose, empty transitions, inflated significance, vague attribution, slogan symmetry, automatic three-part lists, and formulaic contrast; preserve a familiar construction only when it carries a real source-backed relationship.
- Check that each slide has one dominant visual entry point and that composition, density, scale, background tone, and visual lead follow the content without drifting stylistically or changing merely to satisfy variety.
- Require the stable visual states to meet the craft floor of a traditional hand-polished presentation through deliberate composition, real material, useful density, and context-appropriate identity or navigation. Do not imitate an Office file by flattening or removing Slidev motion, interaction, or presenter-workbench behavior.
- Judge every page as one continuous canvas. Reject fragmented UI-like compositions whose visible containers do not express a real grouping, boundary, state, or interaction; if removing a card's surface styling would preserve the relationship, the surface is unnecessary.
- Judge persistent logos, page numbers, progress, headers, footers, and corner labels from the presentation context. Keep them when they improve identity, orientation, navigation, state, or understanding; remove them when they merely fill space.
- Judge the rendered result, not the production paperwork. If a page still feels generic, empty, or dominated by text-like SVG structure, ask whether concrete subject-specific material would significantly improve immediacy, recognition, credibility, or memory. If yes, acquire and integrate it with meaningful visual weight; if no, keep the stronger abstract treatment. Do not apply a fixed scene list or image count.
- Remove decoration that does not improve meaning, recognition, evidence, navigation, hierarchy, or memory.
- When the critique finds a material concept, brand, hierarchy, craft, function, or originality weakness, repair the highest-impact one and render again before continuing. Do not manufacture a change when the rendered page already serves its purpose well.

## Page-level checks

For every representative page and interaction state:

- Confirm one dominant communication responsibility and a clear reading order.
- Treat every audience-facing text, image, symbol, formula, chart, diagram, label, annotation, and decorative mark as an owned final deliverable. Reject a page whose rendered pixels contain accidental overlap, occlusion, clipping, confusing layers, malformed notation, or unexplained visual debris even when its source, generator, DOM boxes, or build report look correct.
- Check title wrapping, type fallback, line length, contrast, and audience-distance readability.
- Use type-size ranges and automated measurements only to prioritize inspection. The rendered page at its intended viewing distance decides whether the hierarchy is readable and visually substantial; text reduced merely to fit excess content fails.
- Check text, figures, equations, axes, legends, labels, controls, sources, and credits against their containers and the slide safe area.
- Require positive clearance; do not accept elements that merely avoid mathematical intersection while appearing crowded.
- Inspect each image together with its crop, overlays, callouts, leader lines, caption, and source. Reject ambiguous targets, tangled annotations, accidental marks, or layers that obscure the subject.
- For hybrid conceptual diagrams, inspect the generated objects and editable labels/connectors together at final page size. Check visible-object anchor landings after crop/scale, complete silhouettes, consistent style, raster sharpness, genuine alpha or a clean page-compatible background, and no accidental generated lettering, arrows or checkerboard. Keep the relationship model source-grounded and distinguish generated appearance from evidence. Do not call an SVG with embedded bitmaps pure vector.
- Verify hybrid labels follow the page's type scale and remain independently editable. Check curve continuity, endpoint direction and positive label/marker/object clearance on the actual rendered result, including reduced-motion, copied-offline and print states; an image rectangle alone cannot certify the visible object's boundary or a successful background blend.
- Inspect inline symbols and display equations in the final live and exported pixels. Reject plain-text or manually positioned scientific notation, malformed fallback glyphs, clipped accents or operators, weak subscripts and superscripts, crowded fractions, inconsistent baselines, or insufficient optical spacing.
- For an asymmetric measurement, require the central value and both errors to come from one KaTeX math atom. Confirm that the upper `+` and lower `−` occupy one shared script column in live and exported pixels; reject adjacent raw `sup/sub` siblings or a lower error shifted behind the upper error.
- Check layer order so masks, decorations, connectors, and background media never cover active text or primary evidence.
- Inspect every logo, wordmark, and brand lockup at rendered-pixel level. Confirm the complete mark and intrinsic ratio, positive clearance from edges and neighboring content, sufficient contrast, and freedom from cropping, masks, overflow, blending loss, or footer/header seams.
- Confirm selected real material is large and specific enough to establish its subject or presence rather than functioning as a decorative thumbnail. Let diagrams explain relationships, mechanisms, structures, and processes; do not accept a diagram as a substitute when concrete material would materially improve recognition or presence.
- Verify that charts, formulas, diagrams, and media have a visible takeaway or interpretation where required.
- Verify factual content, placeholders, citations, selected Evidence Slots, source-map `A<NN>` IDs, and asset provenance against the source material.

## Diagram checks

- For native `diagram:mermaid`, follow `mermaid-presentation.md`: retain native inline SVG, its actual version/type, editable source/config and generator receipt. Compare entities, words, groups and directed relationships with the source; inspect the final displayed fonts, icon rendering, arrow-label association and full-page composition. Run its distinct workbench gate in live and copied offline states; do not claim the custom DiagramSpec clearance checks cover native Mermaid. Native on-edge backings are acceptable only when their meaning remains unambiguous. Unsupported types or silent relationship loss fail.
- Audit meaning before geometry. For a quantitative carrier, hide the surrounding narrative and confirm that fields, values, units, domains, baselines, uncertainty, transformations, labels, and source remain recoverable from the chart itself. Reject an unlabeled bar, curve, area, or point field that merely looks quantitative.
- For a conceptual carrier, map every salient mark to a named object, containment, direction, sequence, causal handoff, or spatial relationship. Reject arbitrary curve amplitude, bar height, point count, highlight position, or nesting depth that has no stated semantic meaning.
- Compare claim provenance with geometry provenance. A source that supports the sentence cannot approve authored geometry as source-derived. For mixed figures, require a visible boundary between measured encoding and explanatory illustration.
- When unrelated pages or peers reduce to substantially interchangeable silhouettes after their text is hidden, treat that similarity as an encoding failure and re-audit the semantic model. Shared typography and alignment are desirable; repeated stock marks are not.
- Confirm every selected code-backed diagram or chart realizes the `renderRoute` locked for its exact `A<NN>` carrier. A same-page sibling figure cannot satisfy another asset's route. Reject an unknown route, a carrier missing its literal asset/route handshake, a FigureSpec route without a final matching FigureSpec root, or a DiagramSpec route without a final semantic ELK SVG.
- For a FigureSpec comparison or annotated visual, inspect the actual mounted root after fonts load. Require `data-slideblocks-figure="final"` as evidence that the build-time structural gate passed; `resolved`, `invalid`, or an omitted role fails immediately, but the attribute alone never proves the mounted DOM passed.
- Compare every peer's final `title / visual / note` slots. Same-role peers must keep one size and one item-relative baseline; individual items may change content and semantic tone, not their own padding, gap, label relationship, or visual height.
- Keep comparison titles and notes and annotated callout copy in measurable HTML. The workbench must remeasure same-role peer sizes and item-relative baselines, actual painted visual bounds including strokes, callout overlap, and leader endpoints against named anchors. Reject SVG `<text>` in those visual layers, visual marks outside their assigned slot, callout overflow or overlap, a leader that crosses another label, or a leader that misses its named anchor.
- Treat a FigureSpec capacity failure as a content or composition decision: shorten or wrap the label, enlarge the figure, reduce the peer count, or split the page. Do not shrink one peer, move one callout by eye, or bypass the shared recipe with page coordinates.
- For an annotated mechanism or transport figure, hide the title, takeaway, and surrounding prose and confirm the visual carrier still shows every essential direction and causal handoff. Reject opposing flows with indistinguishable directional marks, a callout whose named object or region does not match its anchored mark, or decorative geometry that implies an unclaimed structure or relationship.
- Inspect the actual SVG rendered by the final live slide and copied `offline.html` after fonts load and after every manual refinement. Require `data-slideblocks-diagram="final"` only on a displayed semantic SVG that also exposes the final layout role, supported layout engine, SlideBlocks visual renderer, canonical node ownership, and matching render route; an empty or manually labelled `final` shell fails closed. Reject a visible candidate role. A passing candidate geometry, lint report, or unused generated SVG cannot approve a different final SVG.
- Screen-visible content remains part of visual QA when it is `aria-hidden`; that attribute changes the accessibility tree, not the pixels. Use it to avoid duplicate announcements, never to bypass overflow, containment, route, or collision checks.
- Confirm that every connector lands precisely on the correct semantic node or port; a nearby edge or group boundary passes only when that is the intended relationship.
- Inspect node labels, edge labels, group titles, axes, and legends at the intended projection distance. Reject labels that become small merely to make the graph fit. Every node label must retain deliberate inner whitespace after final fonts load; mere containment is insufficient, so widen, wrap, or shorten before reducing type.
- For DiagramSpec output, verify every edge-owned label remains visibly attached to its owning routed edge after node movement or rerouting. Require positive measured clearance from its own painted connector, every other path, every arrow marker, and every node; an opaque backing that merely hides a continuous line does not pass. Reject a label that overlaps another label, sits ambiguously near an unrelated relationship, or leaves the diagram bounds.
- Verify the arrow terminal against the declared target-port anchor and side, not merely a nearby node box.
- Reject any connector that runs through an unrelated node, label, body text, or other relationship. Require positive clearance and an unambiguous route.
- Judge the diagram on the complete slide. It must use the page canvas with purposeful scale and hierarchy rather than shrink into a centered “tool export” surrounded by unused space.

## Motion and interaction checks

- Inspect initial, intermediate, and final frames instead of checking only settled states.
- Capture or pause representative intermediate frames during camera moves, masks, text reveals, object transforms, and cross-page transitions.
- Check for stale frames, black flashes, duplicated titles, clipped glyphs, occlusion, layout jumps, autoplay conflicts, and unreachable controls.
- Verify direct navigation, keyboard stepping, replay, and any interactive branch the deck exposes.
- For every non-static behavior, verify that it changes, compares, reveals, or computes information named by the Page Brief. Remove decorative behavior or click-to-reveal restatements when an equally clear static treatment exists.
- Repeat the action and inspect its complete result in both the live Deck and the copied `offline.html`; reduced-motion must preserve the information and controls without relying on animation.
- Confirm that future evidence remains completely hidden until its supporting state.

## Deck-level checks

- Review the full deck in order for narrative continuity, page-role balance, repeated layouts, inconsistent terminology, and visual drift.
- Confirm that the chosen style direction remains coherent without forcing identical composition on every page.
- Confirm that section changes, evidence peaks, comparisons, decisions, results, and closing beats create an intentional visual and information-density rhythm.
- Check page count, ordering, navigation, links, notes, local assets, console errors, and missing network requests.
- Verify that opening, section transitions, results, decisions, and closing pages fulfill distinct jobs.
- Confirm that required material was not lost when content was shortened or restructured.

## Independent finished-deck review

For a complete Deck, use a reviewer that did not plan or implement the pages when independent delegation is available. Give it every page at the final 1280 × 720 viewport plus the same-scale final rendered sequence and contact sheet, not only thumbnails and not the planning transcript or intended solution. The contact sheet judges rhythm; the full-size pages judge typography, boundaries, labels, and local geometry. The reviewer judges the result as an audience member and returns only concrete failed page IDs with reasons.

The reviewer must reject the Deck and block approval when any rendered page has a material audience-facing failure, including unnatural or translation-like visible language, presentation-distance unreadability, weak hierarchy, fragmented card-like composition, visual drift, or a direction that does not fit the content. It must also reject:

- an ordinary content page with a repeated Chinese and English title when one is only a literal or near-literal translation;
- a section label, eyebrow, subtitle, kicker, corner label, or other page-furniture element with no independent hierarchy, orientation, identity, state, source, or understanding job;
- default colored title underlines or vertical list bars that merely decorate text rather than encode a real relationship or necessary boundary;
- a body page whose headline and sparse material leave a substantive audience question unexplained, or whose essential evidence has been moved only into notes; review depth independently of the author's plan, without imposing a figure or formula quota;
- more than one recurring navigation system across the Deck, or a recurring system whose audience job cannot be stated;
- internal experiment or contract identifiers such as candidate A/B markers, `P<NN>`, `I<NN>`, `A<NN>`, Registry or custom-plan names, tool-route labels, or fixture metadata leaking into the audience view, unless that identifier is itself the page's real subject.
- any audience-facing text, image, symbol, formula, chart, diagram, or annotation with material accidental overlap, clipping, occlusion, tangled layering, ambiguous ownership, or unexplained visual debris;
- scientific symbols or formulas that look improvised or malformed because of plain-text simulation, bad glyph fallback, broken accents or operators, crowded fractions, weak subscript or superscript hierarchy, inconsistent baselines, or insufficient breathing room.

It does not compute a score, count layouts or cards, or require a change when the rendered Deck has no material failure. Return the failed page IDs and concrete reasons, record the observations and repairs under the existing `## Aesthetic review and repairs` section, then repair and rerender the affected pages and sequence before approval.

When delegation is unavailable, run the same rendered-output review as an explicit self-review and do not claim independence.

## Visual evidence review

When a schema-version-2 `.slideblocks/page-plan.md` contains the canonical Visual Evidence Plan, follow `visual-evidence-director.md` and record actual observations under `## Visual evidence review` in `.slideblocks/qa-report.md`. The section must name every page with a selected Evidence Slot; the validator checks this record coverage but does not judge its aesthetics:

- Compare each non-empty Evidence Slot with the rendered page. Confirm the selected source-map refs appear in a planned canvas `evidence` binding; no alternate, fallback, rejected, or unplanned substitute may silently replace them.
- Confirm primary evidence remains a dominant visual entry and support evidence remains legible without competing with the page message. A correct DOM reference does not prove the carrier has sufficient visual weight or context.
- For every required primary slot, temporarily hide the page title and narrative body. Keep only the carrier and its intrinsic labels, axes, units, legend, quotation text, document context, caption, and source. Require the result to satisfy the slot's recorded `acceptance`; a restated headline, isolated KPI cards, achievement-name list, label constellation, or ornamental SVG fails even when its asset and source records are valid.
- Record the final result on one exact line: `P<NN>.<slot-id> — carrier-only: PASS — <what remained identifiable with surrounding narrative removed>`. A missing or failed final observation is a deterministic completion error; repair the carrier, treatment, or Visual Evidence Plan and rerun the page before handoff.
- Inspect photographs and archival fragments for meaningful crop, factual context, legible dates or signatures, and any transformation that could imply facts outside the source.
- Inspect charts, maps, and diagrams for ranges, units, baselines, labels, legends, category definitions, source-derived relationships, and the takeaway the page actually claims.
- Inspect quotations for exact wording or explicit paraphrase status, speaker/author, context, relevant date, and a nearby source reference.
- Confirm generated material remains visibly non-factual in role and does not impersonate a real person, place, interface, event, apparatus, experiment, or result. A generated asset cannot close a factual Evidence Slot merely because it looks plausible.
- Compare live, reduced-motion, offline, print, and requested non-Office export states with each binding's `static` contract. Ensure the complete evidence state, labels, credits, and qualifiers survive.
- Warn when one asset or substantially the same crop repeatedly acts as primary evidence across pages, when a raster asset is materially enlarged, when evidence lands outside its planned region, or when attribution is distant, clipped, or visually detached. These are inspection priorities, not automatic aesthetic failures.
- Repair the highest-impact evidence defect and rerender the affected full-size page plus the full contact sheet. Record the defect, change, and rechecked result. If no page has a selected slot, record `not applicable — no selected visual-evidence slots`.

Missing source-map IDs, mismatched selected refs, absent canvas bindings, unavailable ready paths, and execution-lock drift are deterministic contract errors. Crop quality, visual dominance, contextual sufficiency, and excessive reuse remain rendered-review judgments; do not convert them into an aesthetic score.

## Deck composition review

For a schema-version-2 execution lock, follow `composition-director.md` and record the result under `## Deck composition review` in `.slideblocks/qa-report.md`:

- Render one final-sequence contact sheet after fonts and assets are ready. Judge the deck at thumbnail scale before returning to individual pages.
- Compare each rendered page with its planned composition family, density, canvas roles, and selected-evidence bindings. Then judge every adjacent pair by whether stable or changed geometry serves the two page purposes; repetition does not require an exception record. Record concrete mismatches instead of only saying that the deck varies.
- Treat semantic DOM annotations and automated 3 × 3 canvas-region measurements only as warnings that prioritize inspection. They may flag a missing role, concentrated occupancy, or suspected repetition, but they cannot approve or reject aesthetics, and they do not replace the rendered contact sheet.
- Do not compute or report an aesthetic score. Contract/schema mismatches remain deterministic errors; composition heuristics remain review warnings.
- When the rendered sequence exposes a material deck-level composition weakness, such as content-inappropriate repetition, broken focus or balance, or a failed density rhythm, repair it, render the full contact sheet again, and recheck the affected adjacent pairs. Do not manufacture a change merely to prove iteration.

## Presenter workbench

- Double-click ordinary text, type and immediately undo, repeat undo/redo, save, navigate, and reload. Confirm inline styling, code, formulas, links, and controls are preserved; a storage failure must leave the unsaved edit visible rather than silently exit.
- Export a real edited offline file, open it with networking disabled, edit and save again, reload, then export and open the new copy at another path in a fresh context. Confirm the newest text survives without resetting or duplicating edit records. Browser-local edits do not modify `slides.md` and require a new export to travel with the file.
- Press `P` and confirm presenter mode opens in a new tab at the current slide.
- Right-click the slide and confirm Slidev's native menu exposes drawing, overview, presenter, fullscreen, visually emphasized English-only **Export offline HTML** with **(Recommended)**, then ordinary **Export PDF** as the final clickable action; Escape closes it.
- Choose **Export PDF** and confirm the dedicated print-only tab renders every slide, opens the browser print dialog after fonts and images settle, and leaves a visible `⌘/Ctrl+P` fallback. Save the PDF with backgrounds enabled, then verify its page count and confirm there is no trailing blank page. Repeat from the copied `file://` offline player.
- Start PDF export while the text session still has unsaved changes; verify the latest text in the real PDF and that text/SVG remain vector content. A failed export or a panel disappearing cannot satisfy this check.
- Confirm Shift+right-click still reaches the browser's native menu.
- Load without pre-granting screen Wake Lock permission and require a clean
  console. Confirm `wakeLock: false` prevents any automatic request; a WebKit
  `NotAllowedError` must not be ignored by the verifier.
- Open the drawing toolbar from the menu and confirm a stroke lands.
- Run the full workbench verifier on the served Deck. On the exact copied `offline.html`, run the verifier with `--layout-only`, then manually exercise the representative offline menu, navigation, drawing, and interaction paths listed below. For Safari-related changes, run the served-Deck verifier in Chromium and WebKit, then inspect the current macOS Safari release manually.

## Reduced motion

- Enable `prefers-reduced-motion: reduce` and reload the presentation.
- Confirm that every page renders a complete, stable composition without timers, autoplay, or transition-only dependencies.
- Confirm that essential content is not hidden behind hover, replay, or animation.
- In the final static state, restore readable contrast for all necessary evidence, including context muted during interactive emphasis. Do not export a focus state in which earlier evidence survives only as faint ghosts.
- Recheck overflow, collisions, visibility, and reading order in the reduced-motion state.

## Print and optional static export

- Render print view and an explicitly requested PDF or image export when applicable.
- Check every page for clipping, missing fonts, absent assets, broken backgrounds, transparent text, stale animation frames, and incorrect order.
- Recheck selected evidence, labels, units, credits, qualifiers, and complete static treatment in the exported pixels; a correct live page does not prove the evidence survived export.
- Recheck logos and wordmarks in the exported pixels; a correct live DOM box does not prove the mark survived print, rasterization, scaling, or clipping.
- Confirm that interactive pages choose a complete and meaningful static state.
- Open the exported artifact and verify its page count and visible content; do not infer success from the command exit code alone.

## Offline and compatible portable playback

- Run the delivered `build:offline` command after the final source, style, and asset change. Confirm it preserves the ordinary deployment build, uses hash routing, inlines all required JavaScript, CSS, fonts, images, media, and other public assets, and writes only the main `offline.html` handoff file.
- Copy `offline.html` alone to a different temporary location. Open that copy through a real `file://` URL in a current Chromium browser with non-local network access disabled.
- Check first render, direct hash navigation, keyboard navigation, representative interactions, local fonts and media, console errors, missing requests, and the representative reduced-motion state from the copied file.
- Scan the built HTML for external scripts, stylesheets, media, CSS URLs, imports, and automatic fetches. Build success is not evidence that runtime assets were actually inlined.
- Keep ordinary `dist/` and compatible `portable/` semantics separate: neither ordinary `dist/index.html` nor `portable/index.html` is a direct-file artifact. If `build:portable` remains for static-host compatibility, copy the complete directory and verify it through ordinary HTTP.

## Completion evidence

Report build and test results separately from visual QA. List the pages and states inspected, selected Evidence Slots reviewed, reduced-motion and export outcomes, placeholders, and exact checks that did not run. Report rights only when publication-grade clearance was explicitly requested.
