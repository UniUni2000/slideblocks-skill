# Style Profiles

The profiles below have been exercised by a real Deck in the current Registry. SlideBlocks defaults to scientific-talk composition across topics, including product, business and technical presentations: substantial visual material with concise ordinary bullets explaining its meaning and connections. The Academic / Scientific profile develops that house direction. Palette and layout remain content-led; explicit user direction and genuine page roles can select another treatment. A product or business topic alone does not select a different default. The profiles are not fixed templates or a closed menu.

## Separate quality from style

Keep these requirements non-negotiable across every direction:

- Preserve facts, evidence, citations, and asset provenance.
- Keep primary content readable at the real 1280 × 720 viewport.
- Prevent clipping, collisions, occlusion, and hidden required content.
- Keep formulas, charts, diagrams, and motion clear, legible, unambiguous, and professionally finished in their final rendered context.
- Provide complete reduced-motion and stable print/export states.
- Complete the checks in `qa.md` and obey `quality-contract.md`.

Allow the user or selected direction to override palette, background tone, type personality, composition, image treatment, ornament, and motion intensity when the quality floor remains intact.

## Product Launch

Verified by `decks/macbook-pro-m5-launch`.

- Build an image- or product-led narrative with large claims and restrained supporting copy.
- Use cinematic continuity only when the object, camera, or lighting needs to persist across pages.
- Carry adjacent scenes through focal anchors, physical seams, scale, translation, perspective, or masks; do not use a full-slide opacity fade as the main transition.
- Let each visible feature or motion prove the claim it accompanies.
- Keep persistent chrome sparse and hold a stable final composition.
- Snap reduced-motion, overview, print, and export to complete readable states.

Vary light or dark treatment, brand color, typography, image density, and motion amplitude to fit the product and audience.

## Academic / Scientific

Verified by `decks/sgr-a-discovery`.

- Carry the scientific-talk craft into non-research topics: use authentic product images, interfaces, photographs, documents or appropriate illustrative assets in place of paper figures. Do not invent research framing, equations or data merely to look academic.
- Collect and inspect useful visual material before fixing composition. Give imagery the main canvas weight through large source panels, meaningful crops, close-ups or coordinated visual groups. If a source figure is dense, crop a relevant panel, enlarge it or distribute the explanation across permitted pages before rejecting it for an arbitrary layout region.
- Use concise ordinary bullets to connect observations, mechanisms, comparisons and implications to the visible material. Keep node labels short and move explanation into the nearby bullets; preserve necessary qualifiers and source context. Scientific style is established by material, relationships and composition, not by a paper-colored background or serif font alone.
- When the research argument is central, make its claim, evidence, quantitative result, interpretation, and source relationship clear. Let showcase, orientation, transition, and single-object pages follow their own purpose instead of forcing that sequence onto every slide.
- Answer one complete question per body page with enough related evidence and explanation. A multi-panel paper figure, a comparison, or a figure/formula/schematic combination can form the visual center; do not force a single dominant image with a small text sidebar on every page.
- Use accurate figures, semantic KaTeX, readable axes and legends, local annotations, and adjacent credits.
- Reveal conclusions only when the evidence supports them; keep future evidence fully hidden beforehand.
- Use a white or paper-like canvas, restrained palette, scholarly title treatment, and sans-serif labels when they fit the brand, source material, audience, viewing context, and content-specific visual thesis; choose another coherent treatment when the content supports it more strongly.
- Preserve mathematical correctness, evidence integrity, legibility, and figure clearance under every stylistic override.
- Follow the canonical Academic and Scientific Slides and Scientific Figure and Visual QA guidance in `quality-contract.md` for useful density, mathematics, source-figure selection, short adjacent citations, and poster-like openings/focused endings. Do not use stylistic restraint as a reason to remove necessary evidence or create sparse body slides.

Vary palette, background, editorial character, illustration treatment, and interaction density when the research argument remains clear and source-backed.

## Selecting and synthesizing a direction

Choose one strongest direction internally by adapting or combining the verified profiles with the actual story. Present alternatives only when the user explicitly asks for variants.

These profiles are not a closed style list. When neither verified profile fits, use `design-principles.md` to synthesize a custom direction from the content, audience, brand, selected Registry Artifacts, and communication goal. Record it as a custom direction; do not name it as a verified profile until a real Registry Deck has exercised and passed it.
