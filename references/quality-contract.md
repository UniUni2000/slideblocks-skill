<!-- Generated SlideBlocks Skill reference. Do not edit directly. -->
# Quality Contract

This bundled snapshot is maintained from the canonical SlideBlocks quality rules.
Read it when the Skill is installed outside the SlideBlocks repository. Updates arrive with a verified Skill package upgrade.

## Canonical rules snapshot

You are given a task to build or extend a Slidev presentation with SlideBlocks.

The required stack is:

- Slidev
- Markdown slides
- Vue components
- `slides.md` as the main entry

## Adaptive Autonomous Execution Contract

This is one adaptive execution prompt. Do not ask the user to choose a workflow, declare an expertise level, select reproduction versus adaptation, approve an outline, or pick among visual directions. Infer the correct route from the user's request, supplied material, current workspace, and the selected SlideBlocks Artifact.

### Default autonomy

- Begin with a silent audit of the user's request, source material, current presentation, local assets, project rules, and available tools. Use information that can be inspected or safely inferred instead of asking the user to repeat it.
- Treat a direct request to create or improve a presentation as authorization for ordinary local, reversible work inside the stated scope: inspect scoped files, create or edit presentation files, install normal project dependencies, run previews and builds, render screenshots, generate explicitly requested local non-Office exports, and repair defects introduced by the task.
- Plan internally and continue. Do not require approval of an outline or implementation plan before producing the first visual draft. Keep progress updates brief and useful when the work takes time.
- Choose one strongest visual direction and execute it. Do not hedge by presenting several stylistic alternatives unless the user explicitly asks for variants.
- When the user's brief is detailed enough, implement it directly. When it is incomplete, infer safe defaults and build a polished, renderable visual hypothesis with clearly recognizable semantic placeholders. Do not block the first draft merely because copy, metrics, or factual assets are missing.
- Do not publish externally, purchase or enable paid services, broaden third-party permissions, delete uncertain files, overwrite unrelated work, or perform another destructive or irreversible action without explicit authorization.

### Content and visual adaptation

- Default to scientific-talk composition across topics: substantial imagery with concise ordinary bullets explaining connections. Choose material before layout; preserve explicit user style and source boundaries.
- Treat the selected Block, Recipe, or Deck as a visual and narrative system, not a pixel-locked form. Preserve its recognizable composition logic, hierarchy, pacing, interaction language, and quality bar while adapting layout and density to the user's content.
- Prioritize, in order: a clear core message, a strong visual result, the Artifact's visual DNA and key interaction, faithful coverage of useful user content, and only then literal reproduction of the reference layout.
- You may compress, restructure, and visually translate the user's wording, but preserve its meaning. Treat names, metrics, dates, quotations, citations, legal wording, and copy explicitly locked by the user as immutable unless the user asks to change them.
- Never invent credible-looking facts, metrics, customers, quotations, sources, screenshots, research evidence, or product claims. Use semantic placeholders such as `[CORE METRIC]`, `[PRODUCT SCREENSHOT]`, or `[SUPPORTING EVIDENCE]` that remain visually polished without pretending to be real.
- Prefer user-provided assets; autonomously seek paper figures for research and authentic photographs, screenshots, documents or other useful material elsewhere. Choose concrete material over generic geometry when it improves explanation or recognition; no image quota.
- Download selected web media into project-local assets so live Slidev and the copied `offline.html` do not depend on hotlinks. For ordinary presentation work, unresolved licensing metadata does not block using a suitable image; only an explicitly blocked asset or an explicitly requested publication-grade rights requirement does. Never fabricate a factual visual.
- Use diagrams for relationships and mechanisms; combine real material when useful. An abstract treatment may be clearer than an image.
- For conceptual diagrams, default to image-first hybrid assembly: generate or acquire assets, inspect, then add editable labels and connectors. Use available Agent image generation without text/formulas/arrows, before composition lock. Include abstract systems. Mermaid is an optional choice for simple relationships, not the default. Source figures and real-data plots remain factual evidence.
- A simple hybrid SVG may embed local bitmaps with editable intrinsic labels/connectors under its semantic geometry contract. Preserve type scale, visible-object anchors after crop/scale, curves and label clearance. Check sharpness, alpha/background and live/reduced/offline/print output; generated appearance is illustrative, not measured evidence.
- A Block produces one finished slide by default. If the material is too dense, select, compress, or restructure it rather than silently expanding into a deck; report meaningful omitted material in the handoff. Deck and Recipe prompts define their own adaptive narrative scope later in the assembled prompt.

### Interruption and decision package

- Pause only when execution truly requires the user: mutually exclusive directions would materially change the message, requirements conflict irreconcilably, a required source or permission is unavailable, or the next action is destructive, irreversible, externally published, paid, or outside the stated scope.
- Finish every safe and reversible part first. Then present all blocking decisions and required user actions together in one concise decision package; never reveal predictable questions one at a time.
- Put the recommended answer first for every decision, explain its impact, name any file, value, page, permission, fee, or external effect involved, and allow the user to continue with a single reply such as `use the recommendations`.
- If missing information can be represented honestly with a placeholder, proceed with the reviewed visual draft instead of interrupting the user.

### Reviewed draft, feedback, and handoff

- Do not present the first successful render as the result. Inspect the real presentation viewport after fonts and assets load, repair obvious visual and technical defects, and render again. Show the first reviewed draft, not the first raw render.
- Treat follow-up feedback as a delta against the latest accepted draft. Preserve content, layout, assets, motion, and project structure that the user did not ask to change; repair the visual side effects of the requested change and rerun the affected checks.
- Lead the final response with the visual result or the shortest exact path to view it. Then concisely report what was created, important assumptions, visible placeholders, verification evidence, source location, and genuine limitations. Do not bury the result beneath implementation logs.

## First-Run Project Routing

Before writing presentation files, inspect the current workspace, the user's supplied files, and the available file-writing capabilities. Choose exactly one route below. Do not combine routes or initialize a second project inside an existing Slidev project.

### Source precedence

Use sources in this order:

1. the user's explicit instructions,
2. the user's existing Slidev project, PowerPoint, notes, assets, data, and citations,
3. the selected SlideBlocks block or complete-deck prompt as a structural, interaction, and visual reference,
4. clearly marked placeholders for information that is still missing.

User-provided PowerPoint or project content takes priority over example block or deck facts. Never mix the example subject matter into the user's presentation unless the user explicitly asks for that content.

### Route 1 — PowerPoint migration

Choose this route whenever the user supplies a `.ppt` or `.pptx` file and asks to migrate, redesign, extend, or continue it.

- Treat the PowerPoint as source material, not as the target runtime.
- Complete a faithful content migration before applying the selected block or deck style and before creating new slides.
- PowerPoint migration overrides demo-only slide-count rules. Preserve every source slide or account for it explicitly in the migration map.
- If the user explicitly asks to migrate into an existing Slidev project, integrate there while preserving its current content. Otherwise create a sibling or workspace project folder named `<powerpoint-name>-slidev`.
- Follow the full PowerPoint Migration Contract below.

### Route 2 — Existing Slidev project

Choose this route when the workspace already contains a Slidev entry such as `slides.md` together with a Slidev package configuration.

- Reuse the existing package manager, lockfile, theme, scripts, and project structure.
- Do not initialize a new project and do not replace the complete deck unless the user explicitly asks.
- Preserve existing slides, assets, components, presenter notes, configuration, and unrelated dirty work.
- Modify only presentation-related files such as `slides.md`, `components/`, `layouts/`, `public/`, and `styles/`.
- Integrate the selected block or deck according to the artifact-specific scope later in this prompt.

### Route 3 — Empty dedicated folder

Choose this route when the current folder is empty, writable, and clearly dedicated to the requested presentation.

- Create the Slidev project directly in the current folder. Do not create an unnecessary nested `slideblocks-demo/` directory.
- Use the current package manager when one is specified. Otherwise a supported initializer is:

```bash
npm init slidev@latest
```

- In a non-interactive environment, create the minimal files directly instead of waiting on an initializer prompt.
- Ensure `package.json` includes `dev`, `build`, and `export` scripts and the required `@slidev/cli`, `@slidev/theme-default`, and `vue` dependencies.

### Route 4 — No project folder or unrelated workspace

Choose this route when no project folder was supplied, or when the current repository is unrelated to Slidev.

- If a writable workspace exists, create one isolated folder using the artifact-specific project name later in this prompt; use `slideblocks-demo` only as a final fallback name.
- Do not modify unrelated application files or install Slidev dependencies into an unrelated app root.
- If no writable filesystem or project workspace is available, stop before implementation and clearly ask the user to create or attach a folder. Do not claim that the project was saved.
- After a folder becomes available, continue with Route 3 inside that folder.

## PowerPoint Migration Contract

When Route 1 applies, migrate the source presentation as an inspectable, content-preserving rebuild:

1. Do not move, rename, overwrite, or delete the original PowerPoint file. Treat it as read-only input.
2. Inspect every source slide, including title, body text, page order, speaker notes, images, charts, tables, equations, citations, hyperlinks, and meaningful transitions or builds.
3. Render or export reference images of the original slides when tooling permits, so visual comparisons are possible. Reference renders are evidence, not the final editable implementation.
4. Extract reusable media into a local folder such as `public/imported/` with stable descriptive filenames. Preserve provenance and do not fabricate missing assets.
5. Create `migration/source-map.md`. For every source slide, record its destination Slidev slide or slides, preserved content, rebuilt elements, extracted assets, notes status, and any unresolved item.
6. First complete a faithful migration pass. Then apply the selected SlideBlocks visual system, interaction pattern, or complete-deck structure as a second pass.
7. Rebuild text, formulas, diagrams, tables, and charts as editable Markdown, KaTeX, Vue, HTML, or data-driven SVG whenever practical. Do not use full-slide screenshots as the final deck merely to imitate the source.
8. If an embedded object cannot be reconstructed reliably, preserve it as a clearly documented local image or placeholder and report the limitation. Do not silently drop it.
9. For legacy binary `.ppt` files, use an available safe converter to produce PDF or page-image reference material. If no converter is available, ask the user for a `.pptx`, PDF, or page-image input rather than pretending the file was migrated.
10. Verify content completeness against `migration/source-map.md` before adding new creative material.

## Project Handoff Contract

The task is not complete until a first-time user can find, open, run, edit, build, and hand off the saved project.

- Write the complete project to disk. The editable source of truth is the project folder containing `slides.md`, `components/`, and local assets—not a chat response and not an exported PowerPoint.
- Create or update a project-root `README.md` with parallel `English` and `中文` usage sections. It must identify the main entry file and give exact commands for the detected package manager.
- The README must include installation, local development presentation, single-file offline playback and migration, the compatible static-HTTP path, production build, project structure, output locations, and how to resume editing with an agent. Document PDF or image export only when the user explicitly requests that non-Office artifact.
- Include commands equivalent to `npm install`, `npm run dev`, `npm run build:offline`, `npm run build`, and `npm run build:portable` when applicable, adapted to the actual package manager and scripts. Include an export command only for an explicitly requested non-Office artifact.
- Execute every command documented in `package.json` and the project README at least once against the installed Slidev version. If the CLI rejects an option, correct the script and documentation before handoff or report the exact unresolved blocker.
- After the last source or style change, rerun tests and the production build, record that final result, and regenerate every requested export. Never validate or hand off an artifact produced from an earlier source state.
- If PDF or PNG export is requested, install or document the required `playwright-chromium` dependency and verify the requested output file exists.
- Do not generate, export, validate, or deliver PPT/PPTX files. Treat PowerPoint only as read-only source material for a Slidev rebuild or as a visual reference; the finished format remains editable Slidev source plus the verified `offline.html`.
- In the final response, report the absolute project path, the main entry file, files created or modified, the exact command to reopen the presentation, the local URL or server output, build/export results, and every remaining placeholder or migration limitation.
- If files could not be written or verification did not run, say so directly. Never say that a project was saved, opened, migrated, built, or exported without checking the corresponding artifact or runtime state.

## Offline and Portable Playback Contract

Every finished project must include editable Slidev source and a verified, self-contained `offline.html` that can be copied alone and opened directly from `file://` in a current Chromium browser.

- Preserve the existing `build` script as the ordinary HTTP deployment build. Never change its hosting contract or describe its `dist/` output as double-clickable.
- Add `vite-plugin-singlefile` version `2.3.3`, place the offline builder at `.slideblocks/build-offline.mjs`, and define `build:offline` as exactly `node .slideblocks/build-offline.mjs`. It must build with `--base ./` and `--router-mode hash`, use `.slideblocks/offline-build/` only for temporary work, and write the one final playback file to the project root as `offline.html`.
- The offline builder must inline every emitted JavaScript and CSS resource plus every required font, image, media, and other `public/` runtime asset. It must fail closed if an executable asset, automatic external request, or non-data runtime asset reference remains; do not silently emit a partially portable file.
- Compose with an existing Slidev `setup/vite-plugins.*` configuration instead of replacing it. Build from isolated temporary work so a failed export cannot overwrite the user's source configuration, then clean the temporary directory after success.
- Disable theme-level remote font and favicon injection (for example, use `fonts.provider: none` and `favicon: false`) unless the user explicitly requires and approves a network dependency. Bundle required fonts and media locally so offline playback does not depend on SlideBlocks or another origin.
- After the final source, style, or asset change, run `build:offline`, copy `offline.html` to a different temporary location, and open that copy through a real `file://` URL in Chromium with non-local network access disabled. Confirm the first slide, direct hash navigation, keyboard navigation, representative interactions, reduced motion, local assets, and browser console remain correct.
- Immediately record the final offline build in `.slideblocks/build-result.json` as `{ "command": "npm run build:offline", "status": "passed", "outputFile": "offline.html", "playback": "file://" }`; use `status: "failed"` when the final attempt failed. Never reuse a record or HTML file from an earlier source state.
- Keep `build:portable` equivalent to `slidev build slides.md --out portable --base ./ --router-mode hash` only when it already exists or compatibility with static HTTP automation is required. That compatible path still requires copying the complete `portable/` directory and serving it over HTTP; `portable/index.html` and ordinary `dist/index.html` are not direct-file artifacts.
- In parallel `English` and `中文` README sections, make the primary paths unambiguous: use `npm run dev` to edit and inspect the source; after the final change use `npm run build:offline`, copy the single `offline.html`, and double-click it to present elsewhere. Mention `build:portable` only as the compatible static-HTTP option, never as the preferred migration path.
- State the exact local development URL, offline output file, tested browser and copied `file://` path, compatible portable directory when present, and any feature that still requires the source development runtime.

## Visual Quality Contract

Treat the copied component source as a starting point for a real Slidev slide, not as a fixed webpage card. Compose each slide as one continuous canvas rather than a hierarchy of visible Web containers. You may make style-only changes to improve fit and presentation quality while preserving the component props, content rules, and data behavior.

- Let the user's intended story and the page's actual purpose determine its structure. Do not force every page into a universal explanatory or argument sequence; a page may explain, compare, demonstrate, orient, or simply present one thing.
- Own every audience-facing element in the final rendered pixels. Text, images, symbols, formulas, charts, diagrams, labels, annotations, and decoration must remain deliberate, legible, unambiguous, and professionally finished at presentation and export size. Source correctness, successful generation, or a passing build never excuses accidental overlap, occlusion, clipping, malformed notation, confusing layers, or visual clutter.
- Do not keep a default large card or frame around the whole slide. Unless the content has a real grouping, state, interaction, or boundary that needs a container, remove or neutralize outer and nested `border`, heavy `border-radius`, shadow, and card-like background styles.
- Choose typography by subject. Product and interface decks may use `font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;`. Academic and scientific decks should use the scholarly typography profile below.
- Use a restrained type scale with `clamp()` for titles, subtitles, values, labels, and notes so short text feels intentional and long text does not overflow.
- Prefer concise rewriting within the provided facts over awkward title wraps, tiny unreadable text, or clipped content.
- When a page uses a full-bleed background, apply it to the actual slide layout or root stage and verify that default layout padding does not expose unintended canvas strips in live, reduced-motion, print, or export states.
- Verify sufficient contrast for inline code, command chips, badges, and other nested text in live and export states; inherited text color must not make these labels disappear against their local background.
- After running the deck, visually check for overflow, clipped text, awkward title wraps, oversized values, and misaligned connectors.

### Canvas-First Layout and Measurable Content

- Begin with the whole canvas. Establish hierarchy and relationships through type, imagery, alignment, spacing, and purposeful color fields, then define only the page-level regions the content actually needs. Use semantic `header`, `main`, and `footer` elements where they fit, or mark only these macro regions with `data-slideblocks-region`; components serve the composition and do not each invent a competing visible frame.
- Keep primary text, media, and controls in normal Grid or Flex flow whenever practical. Scope `box-sizing: border-box` to the slide, give Grid and Flex children `min-width: 0; min-height: 0`, clear inherited heading and paragraph margins inside custom components, and use parent `gap` or padding as the spacing authority. Reserve absolute positioning for decoration or for measured relationships that are revalidated after content and fonts change.
- For statements, use ordinary round bullets; own indentation, `list-style`, item margins and inherited line-height. Check live and print: theme resets must neither erase dots nor expand lists into figures or credits.
- When several peers repeat one explanatory pattern, give them one parent-owned anatomy such as title, visual, and note: same-role slots share dimensions, baselines, padding, and gaps, while each peer changes only its content and semantic tone. For one irregular visual with callouts, keep the free drawing inside a bounded visual region and allocate labels from shared outer rails to named anchors. Keep those titles, notes, and callouts in measurable HTML and use SVG only for the visual geometry and leaders; do not tune each peer or label with unrelated page coordinates.
- Decide whether a visual is quantitative, conceptual, or mixed before choosing its marks. Quantitative geometry must come from declared data and preserve visible fields, values, units, domains, baselines, uncertainty, transformations, labels, and source. Conceptual geometry must correspond to named entities and relationships. A layout recipe may standardize slots, gaps, rails, and containment, but it must not supply interchangeable stock bars, curves, point fields, or nested boxes for unrelated claims. If no honest encoding exists, show the statement, number, unit, qualifier, and source in measurable HTML instead of inventing a figure.
- For a mechanism or transport figure, encode every essential direction and causal handoff in the visual carrier itself rather than leaving it only in prose. Distinguish opposing flows and outbound channels with unambiguous directional marks; have each HTML callout name its target object or region, anchor its leader to that semantic mark or region, and remove geometry that could be mistaken for an unclaimed orbit, path, boundary, or relationship.
- Keep each interactive state inside geometry reserved for its longest meaningful content. A click, tab, reveal, or executable result may change information, emphasis, or media without pushing the header, footer, or neighboring region into a new collision. Use native tabs or `aria-controls` where appropriate, and mark any other custom control that exposes a stable state with `data-slideblocks-state-control` so final QA can enter it.
- Keep layout-bearing copy such as titles, metrics, captions, sources, and explanatory prose in measurable Slidev HTML by default. Use SVG for geometry and concise intrinsic labels; when SVG contains text, keep it inspectable and put `data-slideblocks-text-owner` on the actual frame primitive that owns the text, normally its `<rect>`, rather than on an ancestor container. Verify final rendered glyph bounds against that frame and the SVG viewport. Do not hide substantial copy inside an external SVG merely to freeze layout.
- Do not apply `white-space: nowrap` to variable or substantial text until its final font and container capacity have been measured. When content does not fit, widen, reflow, shorten, or restructure it before hiding overflow or shrinking it below a readable size.
- Use the lightest sufficient boundary: whitespace and alignment first, then a necessary rule, field, outline, or card. A card is a semantic grouping tool, not a default layout unit. If removing its background, border, radius, and shadow leaves the relationship equally clear, remove them; do not nest cards merely to organize content. Every visible line or frame needs a concrete owner and an information job such as connection, separation, state, or boundary.
- Choose persistent page furniture from the actual viewing context. An institutional mark may provide useful identity in an academic report, and page numbers or progress may orient a long presentation; the same elements may be noise elsewhere. Omit rails, corner labels, footers, and repeated microcopy that do not improve identity, orientation, navigation, state, or understanding.
- Section labels, eyebrows, subtitles, and kickers are optional content roles, not required fields in every page schema or fixed slots to fill on every slide.
- Choose zero or one recurring audience-facing navigation system for the complete Deck and state its audience job. Do not stack page numbers, chapter rails, progress bars, and corner breadcrumbs as separate persistent systems.
- On an ordinary content page, use one primary title language. Do not repeat a Chinese title with a literal or near-literal English translation, or vice versa, merely to fill a kicker; retain a second language only when an official name, language instruction, a genuinely bilingual audience, or distinct meaning requires it.
- Keep internal `P<NN>`, `I<NN>`, and `A<NN>` identifiers, Registry or custom-plan names, candidate A/B markers, tool-route labels, and fixture metadata in planning, code, notes, or QA—not on the audience-facing canvas. A real A/B experiment or domain identifier remains valid when it is the page's subject. Use human-readable source references such as author, year, figure, or DOI when attribution belongs on the slide.

### Visual-First Communication and Legibility

- Avoid paragraph-length prose on slides. Condense wording, not the explanation: keep decisive evidence, necessary relationships and important limits visible; use presenter notes to expand rather than hide them.
- On word-heavy pages, remove repetition and filler; enlarge useful figures or add evidence that replaces prose. Preserve definitions, units, uncertainty and inference limits. Do not impose a fixed text-reduction percentage or image quota, or count views of the same evidence as independent support.
- Prefer diagrams, plots, images, direct annotations, spatial grouping, and progressive disclosure over prose when they communicate the relationship more clearly.
- Use visible text mainly for titles, short claims, labels, annotations, ordered steps, lists, and necessary qualifications.
- Treat audience legibility as non-negotiable. Primary text must remain readable without zoom at a 1280 × 720 viewport; reduce, restructure, or stage content before shrinking type.
- Treat type-size ranges and automated measurements as diagnostic starting points, not aesthetic proof. Rendered readability at the intended viewing distance is the final judgment; small text that exists only to fit excess content must be rewritten, split, or moved off the slide.
- When the page's intended story or target audience needs an interpretation of a formula, chart, or displayed object, keep that explanation visibly attached through proximity, highlighting, or an unambiguous leader line, and define any symbols the audience cannot reasonably infer.
- Do not manufacture a formula explanation, chart takeaway, or argument merely to satisfy a page template. A showcase, orientation, transition, or single-object page may let the displayed object stand on its own.

### Natural, Specific Presentation Copy

- Write in the register of a real presenter speaking to this audience. Lead with the concrete subject, action, evidence, result, or decision instead of announcing that something is important.
- In language adaptations, rewrite and reflow without changing evidence. Keep the exact measured quantity, comparison basis and scope explicit: structural similarity is not equal magnitude, association is not cause, and models are not observations. Recheck visible labels and notes.
- Prefer precise keywords, fragments, ordinary bullets and sub-bullets; retain subjects, relations, units and qualifiers. Avoid decorative title underlines and colored list bars; keep meaningful axes, uncertainty, connections, ranges and boundaries.
- Treat formulaic frames as review triggers, not a lexical blacklist. Rework patterns such as `不是……而是……`, `不仅……更……`, `从……到……`, `真正的……`, `本质上……`, `在这个……时代`, `这背后……`, `这意味着……`, and slogan verbs such as `赋能`, `重塑`, `开启新篇章`, `注入活力`, or `见证`. Keep one only when the contrast, sequence, or causality is real and a simpler direct sentence would lose meaning.
- Delete throat-clearing and assistant residue such as `当然`, `值得注意的是`, `让我们……`, `希望这对你有帮助`, or `如果你需要……`. Do not paste chat-style offers, apologies, or self-commentary into slide copy or presenter notes.
- Avoid automatic three-part lists, mirrored slogan syntax, rhetorical questions answered immediately, inflated significance, and generic closing claims such as “这不是终点，而是新的起点” unless the source, speaker, or event genuinely requires that rhetoric.
- Replace vague authorities and abstractions with named actors, concrete nouns, active verbs, numbers, conditions, and traceable evidence. State uncertainty directly instead of hiding it behind ceremonial wording.
- Read every visible sentence aloud after layout. If its subject could be swapped for an unrelated topic without changing the sentence, rewrite it until it belongs to this deck. Preserve useful scientific, legal, or decision contrasts; do not flatten precise meaning merely to avoid a familiar construction.

### Icon Usage

- Use icons only when they improve recognition, navigation, or information structure—not to fill empty space.
- Prefer clean, editable SVG icons. Search Lucide first, then Alibaba Iconfont when a suitable symbol is unavailable.
- Keep one consistent icon language across the deck: matching stroke weight, corner style, fill mode, optical size, and color.
- Small icons should support labels, steps, metrics, and diagrams. Do not place an icon beside every sentence or use generic icons instead of meaningful visuals and evidence.

### Illustration Usage

- Use an illustration only when it clarifies an abstract idea, state, process, or memorable claim—not to fill empty space or replace evidence.
- Let one illustration communicate one cognitive action. Translate the idea into a concrete physical action, object, or spatial relationship with one dominant subject and clear negative space.
- Match the deck's visual language. Avoid generic stock metaphors, crowded scenes, and repeated template compositions.
- Prefer generated illustrations without baked-in text. Add titles, labels, and callouts as editable Slidev HTML or SVG; use native SVG instead when structural precision matters.

### Collision-Free Layout and Attention Hierarchy

- Axis titles, tick labels, units, and legends must not intersect one another or cover plotted marks. Reserve explicit plot margins and a clear legend zone; do not solve collisions by shrinking type.
- Legends, captions, descriptive labels, and callouts must not cover data marks or the main visual subject. Place them in reserved whitespace; use leader lines when the target would otherwise be ambiguous.
- Treat figures, equations, and text as mutually reserved layout regions. A figure, image, or panel must never overlap, cover, or visually intrude into an equation or explanatory text in any interaction or export state.
- Treat an image, its crop, and every attached callout, overlay, leader line, caption, and source as one composed visual. Reject accidental marks, ambiguous targets, tangled annotations, conflicting layers, or a crop that obscures the subject; simplify, redraw, or remove the offending element instead of shipping confusion.
- Every visible text box must remain fully inside its assigned container and the slide safe area in every interaction, reduced-motion, and print/export state. Shorten, reflow, or restructure content before it clips, overflows, or crosses a border.
- Use separator lines only when they communicate a boundary that whitespace or alignment cannot. Do not add redundant horizontal rules inside an already isolated panel or between tightly coupled content.
- Set layer order deliberately: background maps and decorative context first; structural guides, nodes, and connector rails next; primary evidence and readable labels above them. No mask, ornament, or background marker may occlude active text or the main visual subject.
- Treat every logo, wordmark, and combined brand lockup as protected content. Preserve its complete visible silhouette and intrinsic aspect ratio; use `object-fit: contain` or equivalent sizing and never crop any part of the mark with `object-fit: cover`, a clipping mask, or container overflow.
- Reserve a dedicated logo safe zone with visibly positive clearance from slide edges, footer and header seams, page numbers, sources, controls, and other layers. A logo whose box merely fits but whose visible pixels touch a boundary is not acceptable.
- If a supplied logo asset has a baked-in background, stray edge, or insufficient contrast, clean or replace the asset or place it on a verified compatible field. Do not hide the defect by cutting into the mark, stretching it, or relying on a blend mode that erases part of the lockup.
- Verify logo integrity from the rendered pixels in live, reduced-motion, print, PDF, and image-export states. DOM non-intersection alone does not prove that the mark is unobstructed, fully visible, or readable.
- For a horizontal word sequence, keep all terms on one baseline and use simple typographic arrows centered in the available gaps. Do not build a rule-plus-arrow connector unless the line length encodes information.
- Let the audience question determine the weight of mathematics: formulas, derivations or model comparisons may lead or share the canvas; do not impose a one-equation limit. Keep steps and symbol definitions needed to understand the result visible. Staged attention must leave a complete readable static explanation.
- After fonts load, verify positive clearance with DOM bounds. Axis text, legends, annotations, containers, and the slide safe area must remain collision-free at the real viewport and export size.
- Treat mechanical layout integrity as an independent release gate on both the served Deck and the final copied `offline.html`. After fonts and media are ready, inspect every keyboard-discoverable or explicitly declared stable state and require zero text overflow, clipping, slide escape, container escape, declared macro-region overlap, detectable foreign HTML border or thin-rule crossing, broken asset, and negative header/body/footer clearance. A hidden overflow mask, unreadable font reduction, or unmeasured text inside an SVG does not count as a repair.
- Lock and realize one executable render route for every selected code-backed diagram or chart. The mounted carrier keeps its stable asset ID and exact route; FigureSpec/DiagramSpec routes keep their project-local generator. `Custom` is not a route, and a same-page sibling output cannot satisfy another carrier's contract.
- For diagrams, run geometry checks against the actual SVG rendered on the final slide after every refinement, not only an ELK candidate, geometry report, or generated file that the page may no longer use. For SlideBlocks-authored semantic SVG, mark the displayed root `data-slideblocks-diagram="final"` only when it also exposes a final layout role, supported layout engine, SlideBlocks renderer, canonical node ownership, and the matching render route; an empty final shell fails closed. Screen-visible `aria-hidden` content remains inside visual QA. In this custom SVG route, edge-label backings must keep real positive clearance from their own painted connector, every other path, arrow marker, and node; covering a continuous line with a background is not clearance.
- Native Mermaid uses the separate `diagram:mermaid` route. Plan type, icons, style and space with the page; keep editable source/config and a pinned native generator. Require inline native SVG, actual version/type, final-size fonts and containment in live/copied offline views. On-edge backings need clear ownership and visibility. Review source fidelity and full pages; custom SVG node-padding and painted-path-clearance formulas below do not certify native Mermaid.
- Measure SVG node text after final fonts load and preserve deliberate inner whitespace rather than merely containing the glyphs. Using the tallest rendered line's glyph height, retain at least `max(16px, 0.6 × line glyph height)` on each horizontal side and `max(10px, 0.35 × line glyph height)` above and below the complete text block; widen, wrap, or shorten before reducing projection-readable type.

### Continuous Product-Film Motion

Use this profile when the user asks for a launch film, cinematic product story, or a deck whose object and camera should remain continuous across pages. Do not impose it on ordinary document-like slides.

- Mount one persistent visual stage and let Slidev navigation update scene state. Disable the normal page transition so the product, camera, and lighting do not remount or flash between slides.
- Preload recurring imagery. At the end of a transition, commit the incoming scene behind the transition layer before removing that layer; do not expose a black frame, stale frame, replayed image reveal, or one-frame layout jump.
- Define a source focal anchor and a destination focal anchor for every adjacent pair. Carry the viewer through the product or a shared element with camera scale, translation, perspective, masks, or a physical seam; never use a full-slide opacity crossfade as the main transition.
- Adjacent transitions may use different recipes, but they must share one motion language: consistent easing, decisive acceleration, a readable held beat, and a stable final frame. Tune timing from captured intermediate frames rather than from the end state alone.
- Treat title copy as part of the camera choreography. Clear outgoing copy decisively and reveal incoming copy as one complete group at the intended focal beat. Do not sweep a clipping mask across live glyphs when that exposes incomplete characters, and never leave old and new titles competing on screen.
- Let the visual prove the claim. Page count needs visible page motion, refresh rate needs an obviously moving comparison or sample, and a feature hotspot needs a real camera focus on that component; a static label is not evidence of the advertised behavior.
- Keep persistent chrome sparse. Do not add blinking progress bars, cursors, footers, navigation rails, or repeated microcopy unless they communicate necessary state or provide an essential control.
- Reduced-motion mode must snap to the complete final composition. Overview, print, and export must render the same stable scene content without timers, autoplay, or hidden transition-only dependencies.

### Academic and Scientific Slides

Default to this craft across topics; do not invent academic framing or equations. Explicit user direction and a block's intentional art direction may override style, never legibility, mathematical correctness or evidence integrity.

- Choose the canvas tone from the subject, source material, audience, brand, and viewing context. White or paper-like treatment is often useful for reports and dense figures; a coherent dark or image-led treatment is equally valid when it fits the material more strongly.
- Use a restrained, content-fit palette with clear roles for ink, emphasis, muted text, rules, and genuine semantic distinctions. Do not impose one academic-blue palette on unrelated subjects.
- Treat semantically coupled labels as one visual unit. A timeline year and its action verb, for example, should share the same accent color and comparable emphasis.
- Avoid decorative top navigation and chrome. In a long report, a quiet chapter or page-progress indicator may help the audience stay oriented; in a short talk, omit it. Use a source or caveat strip only when that information is necessary.
- Use `"STIX Two Text", "Times New Roman", Times, serif` for scholarly titles, scientific claims, equations, and important numerical results. Use `Arial, "Helvetica Neue", Helvetica, sans-serif` for labels, metadata, controls, plot ticks, and compact annotations.
- Size type from displayed scale: at a 1280 × 720 viewport, start around 40–52 px for titles, 24–28 px for body text, 28–36 px for equations, 18–22 px for figure labels, 14–16 px for adjacent credits. Scale for larger native canvases. Verify projection readability, including labels baked into source figures.
- Do not create information density by shrinking text. Remove redundant prose, navigation, framing, repeated labels, and decorative cards before reducing type size.
- Make body pages evidence-rich: one complete question may combine related findings, source figures, imagery, schematics, equations, interpretation and limits. Linked visuals can form one focal group; no single-image template or medium quota. Keep openings/endings distinct. Explicit style, duration, source-fidelity, page-count and independent-page instructions remain controlling.
- Research before locking an unconstrained page count. Combine related thin explanations; add necessary comparisons or reasoning, not decoration. No page, image or formula quota; no miniature plot walls.
- When a page actually needs a subtitle, kicker, or divider, treat it with the title as one header block. Leave a clearly perceptible breathing band before the first active body content; the body must not appear attached to or crowded against the header.
- Enlarge plot titles, axes, legends, and annotations until the figure can be understood at normal presentation distance. Axes and legends are part of the scientific argument, not disposable footnotes.
- For satellites, instruments, telescopes, aircraft, or other equipment, prefer an accurate transparent-background cutout or vector schematic over a rectangular screenshot with baked-in surroundings or captions.
- Treat opening pages as content-specific posters; ending pages collect a bounded takeaway, thanks/Q&A or selected references. Keep bibliography readable; do not force every closing element into one slide. Add neither when source boundaries exclude them.
- For findings-based endings, prefer a short ordinary bullet list of bounded conclusions. Thanks-only, Q&A and reference-only endings need no forced summary.

### Mathematical Typesetting

- Render mathematical expressions with Slidev's KaTeX support using `$...$` or `$$...$$`. For trusted dynamic expressions inside Vue components, use the KaTeX API and load its stylesheet.
- Never simulate mathematical notation with nested HTML, Unicode substitutes, manually positioned `sub` or `sup` elements, negative margins, compressed line heights, or CSS transforms.
- Typeset an asymmetric measurement as one KaTeX math atom, for example `$1.38^{+0.27}_{-0.24}\times10^{11}\,M_\odot$`, so both errors share one script column. Never write the errors as adjacent raw `<sup>` and `<sub>` siblings or position them independently.
- Use field-standard semantic notation consistently, including roman subscripts when appropriate: `M_{\mathrm{BH}}`, `r_{\mathrm{p}}`, `a_{\mathrm{ang}}`, `d_{\mathrm{ring}}`, `\Delta\alpha\cos\delta`, `\Delta\delta`, and `M_\odot`.
- Use KaTeX for inline symbols, metric labels, axis variables, and display equations, not only for the largest formula.
- Semantic notation and KaTeX are necessary but not sufficient. Inspect the final rendered pixels for coherent glyph style, correct fallbacks, intact accents and operators, readable subscripts and superscripts, uncrowded fractions, consistent baselines, optical scale, and breathing room; retypeset or recompose anything that still looks improvised, cramped, or malformed.
- Give fractions, superscripts, and subscripts real vertical space. Style the equation through its container instead of transforming KaTeX internals.
- After fonts load, verify that each rendered equation's bounding box does not intersect its explanation, divider, or following content at both the slide canvas size and the export size.
- Require a visibly positive breathing gap between every displayed equation and its adjacent title, label, interpretation, or other text; non-intersection alone is insufficient. Verify the post-font DOM-bound gap at the canvas and export sizes.

### Evidence-Driven Visibility and Interaction

- Reveal an equation, model, conclusion, or derived quantity only at the state where the evidence first supports it.
- Before that state, hide the entire future-evidence block completely. Do not leave ghosted formulas, partial borders, dim explanatory text, or low-opacity future conclusions competing with the active state.
- Preserve a hidden block's layout footprint when needed to prevent surrounding content from jumping, while using `opacity: 0`, `visibility: hidden`, `pointer-events: none` where relevant, and an appropriate `aria-hidden` state.
- Each interaction state should have one unambiguous focal point. Persistent context may be muted; future evidence must not be previewed accidentally.
- Motion must explain evidence accumulation, causality, scale, or comparison. Prefer restrained 180–320 ms state transitions and avoid decorative motion.
- Direct timeline selection should stop autoplay. Support keyboard stepping and replay when useful, respect `prefers-reduced-motion`, and render a complete stable final state for print and export.

### Scientific Figure and Visual QA

- Prefer authentic paper figures and observational imagery: use source vectors or sharp crops. Redraw only from data or a declared reproducible transformation, not invented curves for editability. Distinguish measurements, models, inference and illustration.
- Before rejecting dense source imagery, try meaningful crops, enlargement or permitted page splits; retain context and qualifiers. Review imagery and bullets together: fonts, palette or carrier-only correctness do not establish scientific-talk craft.
- Use conventional variables and units on axes, keep tick labels readable, and include an unobtrusive source or credit for observational images and research data.
- Preserve complete source figures when every panel contributes evidence. Use an uncropped frame such as `object-fit: contain`; do not use `cover` when it removes a panel, legend, scale, or lower edge.
- Keep figure-specific credits and quantitative annotations adjacent to their figure. Put a short author/year/figure credit directly below it or its shared group; retain required attribution and adaptation status. Full titles/DOIs belong in notes/references, not microscopic page footers.
- Center short captions and credits beneath the actual image frame or shared figure group, not a wider column. Prefer one readable line; shorten bibliography before shrinking type. Retain scientific explanation, units, conditions and required attribution; never crop or omit them to satisfy a one-line quota.
- Treat figure-reading context as part of the figure: keep relevant date, instrument/band, sample, legend and scale-comparability warnings beside it. Retain them in carrier-only review even if they are implemented as HTML outside the image element; a citation alone is insufficient.
- For a focus-centred Kepler ellipse in its orbital plane, generate the path from `x(E) = a(cos E - e)` and `y(E) = a sqrt(1 - e^2) sin E`; this construction places the gravitating body at the physical focus `(0, 0)`. Derive both the path and the focus marker from the same orbital elements and transform.
- A linear sky projection preserves the physical origin but does not generally preserve the Euclidean foci of the apparent 2D ellipse. Label the central marker `projected dynamical focus`; never relocate it to a focus inferred from an SVG ellipse or bounding box. If a visibly classical focus is required, show a separate face-on orbital-plane schematic.
- For segmented timelines, scales, and progress rails, treat nodes as segment boundaries: center each segment label between adjacent node centers, place its supporting value or unit below the rail, and position the rail midway between the two text rows with balanced vertical gaps. Keep both gaps compact enough that the labels and rail read as one connected control rather than detached captions. Never anchor both text rows against one node or let the rail cross a label.
- Give timelines a reserved safety band. In every state, require `contentBottom + safeGap <= timelineVisualTop`, with at least 24 px at the native slide canvas and more for large filled regions. Timeline labels must also clear the footer.
- Treat vertically stacked regions as one coordinated layout. Require `titleBlockBottom + breathingGap <= contentTop`; if a title wraps, gains an image, or the body moves, recompute the downstream body, conclusion, timeline, and footer positions together instead of shifting one region into the next.
- Avoid high-specificity `font: inherit` resets on controls: the shorthand can overwrite local size, weight, style, and line height. Inherit only `font-family` when descendants define their own typography, then verify the computed styles.
- Inspect every interactive state, not only the final state. At the real viewport, check title wrapping, font fallback, equation bounds, axes, legends, source strips, clipping, contrast, and layout shifts.
- Use DOM bounding boxes for dynamic safe-zone checks rather than relying on visual estimates. Normalize measured gaps by the Slidev scale factor when the canvas is transformed.
- Verify reduced-motion behavior and the static export separately. A successful build alone is not sufficient evidence that the slide is finished.

Do not convert this task into a PowerPoint-first workflow, React slides, Reveal.js, Remotion, image-only slides, or raw HTML without Slidev.

Do not invent facts, metrics, dates, customer names, quotes, or citations. Use clearly marked placeholders when source information is missing.

After implementation, run the Slidev dev server, final offline build, compatible portable build when present, and relevant tests; report files created or modified, the verified copied `offline.html` `file://` playback path, any explicitly requested non-Office export, and every placeholder.
