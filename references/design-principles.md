# Presentation Design Reasoning

Use these principles to turn the story and selected Registry Artifacts into one coherent visual system. They complement Registry discovery and Artifact delivery; they do not replace either one.

## Derive form from the content

- Write one visual thesis for the deck: the content-specific idea that should govern its composition, imagery, diagrams, typography, and motion.
- Test the thesis by mentally replacing the subject or brand. If the same treatment works unchanged for an unrelated topic, refine it until the form carries meaning rather than only style.
- Preserve locked facts and source meaning. Let the visual thesis change presentation, emphasis, sequence, and spatial relationships—not evidence.

## Ground the direction in real context

- Inspect the user's existing deck, design system, brand guidance, code, screenshots, images, charts, and prior materials before inventing a visual language.
- When a named brand or product is a visible subject, prefer accurate official logos, product imagery, and interface captures over improvised lookalikes. Acquire suitable material autonomously and keep it local for offline delivery.
- Treat a logo, wordmark, or combined lockup as protected content rather than decoration. Preserve the complete lockup and intrinsic aspect ratio, minimum clear space, contrast, and any brand-specified background field.
- Reserve a dedicated logo zone before laying out citations, page numbers, controls, or footer copy. Do not crop, stretch, mask, or visually merge a mark into a seam merely to make the remaining content fit.
- Do not create logo clutter for incidental citations or references. Brand assets should improve recognition or evidence.
- Use an honest semantic placeholder when a required factual image or brand asset is unavailable. Do not fabricate a credible-looking substitute.

## Establish one visual grammar

After the communication contract, narrative spine, and page purposes are clear, let the visual director choose one content-fit direction before page-group planning begins. Record only the shared decisions that materially guide the Deck in `.slideblocks/page-plan.md`; do not create a separate style PRD or present a menu of directions.

Record the grammar before broad slide production:

- palette sources and the role of each color,
- display and body typography, type scale, and language fallbacks,
- grid, alignment, spacing, and safe-area logic,
- imagery, diagram, chart, and annotation treatment,
- material, ornament, and the audience job of any recurring page furniture,
- motion language and static or reduced-motion behavior.

Sample color from the user's brand, source imagery, or the subject's real context. Converge on a small purposeful palette plus neutrals, then state why the colors belong to this presentation. Example color values are starting points, never a recipe.

Treat verified style profiles as proven starting points, not a closed menu. When none fits, synthesize a custom direction from the story, selected Artifacts, audience, brand, and communication goal; record it as custom rather than calling it a verified profile.

For decks of five or more slides, stabilize the grammar on two high-risk page roles with different content and material needs before expanding it across the deck. Review and repair real defects internally; do not turn this into a user approval gate.

## Compose one continuous canvas

- Treat the slide as one continuous visual field rather than a hierarchy of visible Web containers. Establish relationships with type, imagery, alignment, spacing, scale, and purposeful color fields before choosing or placing components.
- Establish only the page-level regions the content actually needs. Let one parent Grid or Flex layout own their dimensions, gaps, and safe-area relationship without giving every region a visible frame.
- Keep titles, metrics, captions, sources, and explanatory prose as measurable HTML by default. Let SVG carry geometry and concise intrinsic labels, mark intended SVG text frames with `data-slideblocks-text-owner`, and do not hide substantial copy where its real glyph bounds disappear from ordinary layout inspection.
- Reserve enough geometry for the longest meaningful interaction state so a reveal, tab, or executable result changes the content without moving the header, footer, or neighboring region into a collision.
- Prefer whitespace, alignment, and a shared safe-area edge to a visible rail, frame, or card. Use a container only when it expresses a real grouping, boundary, state, or interaction. If the relationship remains clear after removing its background, border, radius, and shadow, remove them; do not nest cards merely to organize content.
- Add page furniture only when the presentation context gives it a real audience benefit. Identity marks, page numbers, progress, source strips, or navigation may be meaningful in one Deck and noise in another. Do not fill empty corners with labels, numbers, or repeated chrome.
- At Deck level, choose zero or one recurring audience-facing navigation system and name the audience job it performs. A page number, chapter rail, progress bar, and corner breadcrumb are alternative systems, not layers to stack.
- Section labels, eyebrows, subtitles, and kickers are optional. Never make them required page fields or fill them with a generic category, English alias, or translation merely because a template exposes the slot.
- On ordinary content pages, do not repeat a Chinese and English title when one is a literal or near-literal translation of the other. Keep both only when the source, official name, language task, bilingual audience, or distinct meaning makes both necessary.
- Keep internal `P<NN>`, `I<NN>`, and `A<NN>` IDs, Registry or custom-plan names, candidate A/B markers, tool-route labels, and fixture metadata out of the audience-facing render. Preserve them in planning, code, notes, and QA where they remain useful.

## Create content-led rhythm

- Give every slide one dominant communication responsibility and one clear visual entry point. For a body page, this can be a complete question answered by several related findings, figures and equations rather than a single small claim.
- Let the page role determine the visual lead: claim, evidence, comparison, process, decision, result, image, or quotation.
- Keep the grammar coherent while letting composition, density, background tone, scale, and visual lead follow each page's purpose.
- Repeat a composition when the content relationship repeats and the repetition helps the audience compare or follow the sequence. Change the composition when the content relationship or emphasis changes; do not manufacture variety to satisfy a layout count.
- Avoid repeating the same card grid, split layout, title position, or animation merely from implementation convenience.
- Use section changes, evidence peaks, decisions, and conclusions to create deliberate rhythm rather than arbitrary decoration.
- Keep the default body-page treatment information-rich. Judge useful density by what the audience can understand, not occupied area: deepen or combine thin explanations within the allowed scope, and remove repetition before reducing type. Do not insert sparse “breather” slides simply to alternate density.

## Reason about typography

- Choose typography from content type, language, audience, and brand before choosing a fashionable font name.
- For mixed Latin and Chinese text, place the Latin family before the CJK family in the fallback chain so each script uses the intended glyphs.
- Give Chinese body text more line-height and shorter readable lines than comparable Latin text. Use `line-break: strict` where supported and inspect punctuation at line boundaries.
- Do not synthesize italic or bold CJK glyphs. Prefer real weights, color, emphasis marks, or an appropriate alternate face, and use `font-synthesis: none` when the project supports it.
- Use tabular numerals for aligned metrics and tables. Verify baselines, punctuation, wrapping, and fallback after fonts load.
- Restructure content before shrinking essential text below audience-readable size. Treat suggested type ranges and automated measurements as warnings; rendered readability and visual hierarchy at the intended viewing distance decide whether the page passes.

## Write like a particular presenter

- Lead with concrete actors, actions, evidence, outcomes, and decisions. Delete ceremonial openings that merely announce importance.
- Treat familiar AI frames as diagnostic signals, not banned strings. Constructions such as `不是……而是……`, `不仅……更……`, `从……到……`, `这意味着……`, or `本质上……` may remain when they express a real contrast, sequence, inference, or definition more clearly than a direct rewrite.
- Remove assistant residue, empty transitions, vague authorities, grand significance, automatic three-part lists, slogan symmetry, and endings that could close any presentation.
- Prefer named evidence, active verbs, concrete nouns, conditions, and honest uncertainty over abstract uplift such as “赋能”“重塑”“注入活力” or “开启新篇章”.
- Match the speaker, audience, institution, and genre. Do not add fake personality, forced colloquialism, or an invented opinion that the source does not support.
- Use precise fragments and ordinary bullets/sub-bullets when they make research copy easier to scan. Remove decorative title underlines and vertical text bars by default; real axes, error bars, range brackets and meaningful connectors retain their information job.
- Read visible copy aloud after layout. If a sentence still works after replacing its subject with an unrelated topic, rewrite it until it belongs to this deck.

## Reject generic decoration

- Require every visible element to earn its place through meaning, navigation, recognition, evidence, or hierarchy.
- Do not default to purple gradients, neon glows, emoji bullets, generic rounded-card grids, decorative statistics, or an icon beside every sentence. Use any of them only when the content or brand makes the choice specific.
- Do not redraw a real product, interface, person, or factual scene as a generic CSS or SVG approximation when recognition or accuracy matters.
- Keep charts, diagrams, images, and motion subordinate to the page purpose. A visual that does not help the audience see, understand, compare, orient, remember, or act is decoration.
- Prefer one memorable, content-specific signature detail over uniform embellishment everywhere.

## Perform an aesthetic critique

Before technical completion, review and repair the deck against these questions:

- **Concept:** Does the visual thesis come from this content, and does the deck still communicate when decorative styling is removed?
- **Context:** Do brand, imagery, data, citations, and selected Registry assets feel native to the same presentation?
- **Voice:** Does the copy sound like this presenter addressing this audience, or like reusable assistant prose and slogan scaffolding?
- **Hierarchy:** Is the intended reading order obvious at a glance and at presentation distance?
- **Craft:** Are alignment, spacing, type, color, image treatment, and motion deliberate and consistent?
- **Function:** Does every element help the audience understand, compare, decide, remember, or act?
- **Originality:** Does the result avoid interchangeable template treatment and common AI visual defaults?

Do not report a numerical aesthetic score as proof of quality. When the critique finds a material weakness, repair it and render again before completing the technical checks in `qa.md`; do not invent a change merely to demonstrate iteration.
