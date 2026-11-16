# Presentation Design Reasoning

Use these principles to turn the story and selected Registry Artifacts into one coherent visual system. They complement Registry discovery and Artifact delivery; they do not replace either one.

## Derive form from the content

- Write one visual thesis for the deck: the content-specific idea that should govern its composition, imagery, diagrams, typography, and motion.
- Test the thesis by mentally replacing the subject or brand. If the same treatment works unchanged for an unrelated topic, refine it until the form carries meaning rather than only style.
- Preserve locked facts and source meaning. Let the visual thesis change presentation, emphasis, sequence, and spatial relationships—not evidence.

For an evidence-rich body page, plan the reading task before dividing up the canvas. Write down what the audience should be able to compare, trace or decide, and gather the source details that enable that reading. A baseline, a variance, its cause and its consequence often belong together. Give space to that relationship. An isolated number or a photograph earns prominent space when it helps the audience answer the question.

Ask what the presenter would point to as each finding is explained. When several explanations refer to identifiable parts of one figure, let that figure grow until its parts can carry their own labels. Place each explanation at its referent or in nearby white space, with a short leader only if needed. When readers need to scan several cases against common criteria, aligned rows may serve them better. An independent argument can use its own text group. Choose afresh on each page and carry the resulting relationships into the mockup prompt.

## Ground the direction in real context

- Inspect the user's existing deck, design system, brand guidance, code, screenshots, images, charts, and prior materials before inventing a visual language.
- When a named brand or product is a visible subject, prefer accurate official logos, product imagery, and interface captures over improvised lookalikes. Acquire suitable material autonomously and keep it local for offline delivery.
- Treat a logo, wordmark, or combined lockup as protected content rather than decoration. Preserve the complete lockup and intrinsic aspect ratio, minimum clear space, contrast, and any brand-specified background field.
- Reserve a dedicated logo zone before laying out citations, page numbers, controls, or footer copy. Do not crop, stretch, mask, or visually merge a mark into a seam merely to make the remaining content fit.
- Do not create logo clutter for incidental citations or references. Brand assets should improve recognition or evidence.
- Use an honest semantic placeholder when a required factual image or brand asset is unavailable. Do not fabricate a credible-looking substitute.

When designing information-rich pages without a supplied template, inspect a rendered professional content page that supports a similar reading task. Start with a relevant accepted page or the specific pages linked by the task guide; search official presentations if needed and permitted. A Registry search or a source document used only for facts does not show how a reference page reads. In the existing page plan, identify the page and the visual decision it informed (for example how comparators align, or where a figure is explained). Design the rest for the present material. If a suitable example is unavailable, use the source and state that limitation in the plan.

Read the reference at slide size. What job does its heading do, where does the audience find the conclusion, and how do grouped statements help them read the adjacent evidence? Choose those roles for the new page before choosing type sizes. A short topic heading can orient a reader while the finding sits beside its evidence; a conclusion-led heading earns its emphasis when it helps interpret the whole page. Set their relative scale and weight by looking at the rendered result. Use bullets for parallel observations, aligned rows for comparisons, and nearby explanations for what the evidence means, as the material warrants.

## From professional reference to editable page

For a new visual direction, run this loop before authoring the representative body page. Reuse the result on pages with the same reading job. Generate another study when the relationship to explain materially changes. Local repairs and exact template reproduction can keep their accepted visual direction.

1. Identify the question the reader should answer and the source-backed details needed together. Select and actually view a professional original page with a similar reading task. Keep its URL, page/figure locator and rendered image in the project. Decide which relationship to borrow and what the new material needs to do differently.
2. Using the available image-generation tool, make a full-slide visual mockup from that reference image, the factual brief, and the chosen type direction. Prompt for the actual reading order, content groups, comparison units and focal evidence. Inspect the returned bitmap at slide size. Follow each annotation back to its exact feature, including both ends of any comparison. If the reader has to hunt, move the note or resize the figure. Remove repeated captions and claims added by the image model without source support. If the evidence becomes incidental or a headline overwhelms it, identify the specific defect and revise the mockup before implementation. Store the selected bitmap and its prompt under the project’s working assets. When image generation is explicitly disallowed, unavailable or fails, record which step was skipped and continue with reference-led native design; describe the actual path at handoff.
3. The implementer must view the selected bitmap. Use its spatial and typographic decisions to build editable text, charts, code or diagrams from the original materials. Verify numbers, units, qualifiers and sources independently of image-model lettering. Documentary images still come from the factual source.
4. Inspect the reference, mockup and real render at equal width. At thumbnail size, identify what attracts attention first; at reading size, answer the planned question using the visible evidence. Repair the editable page and rerender where either reading fails. Record the reference, chosen mockup, and observed repair or pass in the existing page plan and QA report. For unattended work, these are internal reviews; deliver the completed page without requesting a mockup vote.

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

For decks of five or more slides, stabilize the grammar on two high-risk page roles with different content and material needs before expanding it across the deck. Review and repair real defects internally. On a cold start these two pages also become the user's samples, as `taste-profile.md` describes; otherwise they are not a user approval gate.

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

View a representative rendered body page and the selected reference at the same display width. Read both as the intended audience. What can a reader actually compare or verify in the draft? Inspect the most prominent element: does its size earn its place, or would the space better show a missing relationship from the source? A fully legible draft can still need a different composition. In that case return to the source, revise the page brief and rebuild before polishing spacing. The QA report should name the visible finding and the outcome, including a decision to keep a page that already works.

Before technical completion, review and repair the deck against these questions:

- **Concept:** Does the visual thesis come from this content, and does the deck still communicate when decorative styling is removed?
- **Context:** Do brand, imagery, data, citations, and selected Registry assets feel native to the same presentation?
- **Voice:** Does the copy sound like this presenter addressing this audience, or like reusable assistant prose and slogan scaffolding?
- **Hierarchy:** At equal display width, compare how much attention the heading takes relative to the evidence on each page. If the same conclusion competes for attention in the title, lead and figure, keep it where the reader can best verify it. Reclaim the space for related source detail when it improves the reading task; check grouping, alignment and legibility again in the full render.
- **Craft:** Are alignment, spacing, type, color, image treatment, and motion deliberate and consistent?
- **Function:** Does every element help the audience understand, compare, decide, remember, or act?
- **Originality:** Does the result avoid interchangeable template treatment and common AI visual defaults?

Do not report a numerical aesthetic score as proof of quality. When the critique finds a material weakness, repair it and render again before completing the technical checks in `qa.md`; do not invent a change merely to demonstrate iteration.
