# Classroom / Handout Visual Direction

Choose this direction when a teacher-led audience reads concepts, conditions, worked examples and code across a continuous lecture. It is a scoped direction informed by reviewed local pilots, not a verified Catalog profile or a new task family. Explicit templates, accepted decks, brand requirements and applicable tastes take precedence. Programming instruction can use another direction; this direction can serve another technical lecture.

## Reading structure and material

Start from a white or near-white continuous canvas, stable title position, clear grouping/indentation and restrained local emphasis. A repeated title bar is optional; its color or presence is not the identity of the direction. For a first page that already teaches, explicitly select the appropriate `default` or `none` layout so an inferred cover does not impose a separate headline scale. Let a pure-text explanation stand when text carries the concept. Use code, equations, labelled relationships, terminal output or real source material as the teaching object when relevant.

Keep recurring anchors consistent while choosing each page's structure for its relationship: a lookup sequence, a variable/function table, an aligned before/after comparison, a trace or a grouped explanation. Keep explanations next to the specific source operation they explain. Retain complete calling expressions with their results; a large number alone rarely explains a mechanism. Preserve the project's current image/figure aesthetic when images are useful, without forcing pictures into a code lesson.

## Type hierarchy and a real CJK font

For an unbranded Chinese handout in this direction, start with the regular WenKai reading face, a stable system monospace for code, and modest role-based type. This is the selected direction's starting point, not a requirement for all teaching or a claim about a reference teacher's exact font.

| Role | Starting scale at native1280×720 |
| --- | --- |
| Page title | 36px, line-height1.3–1.4 |
| Group heading | 27–29px, line-height1.4 |
| Body explanation | 23–24px, line-height1.6–1.7 |
| Code | 20–22px, line-height1.5–1.6 |
| Source/secondary label | 16–18px, clearly secondary |

Adjust for viewing distance, language, source length and native canvas. Simplify or recompose before reducing essential text to fit. Keep relationships legible instead of applying one giant result style throughout the deck. Use the font's real regular weight, not synthesized heavy type.

When this WenKai treatment is selected, run the bundled Node helper `assets/fonts/prepare-classroom-fonts.mjs` once against the project:

```sh
node "<skill-root>/assets/fonts/prepare-classroom-fonts.mjs" "<project-root>"
```

Import the generated `classroom-font.mjs` once from the existing global component's script (for example, `import './classroom-font.mjs'` in `global-top.vue`). This entry imports `classroom-font.css` and preserves the complete font license in an inert text node; CSS comments alone can be removed by production minification. Use this entry instead of a CSS-only import. It prepares a fixed full CJK WOFF2 in `public/fonts/`, an actual `@font-face` named `SlideBlocks Classroom WenKai`, and the original OFL license bundled in `assets/fonts/LXGW-WenKai-OFL.md`. The binary is acquired into the generated project, not installed globally or shipped inside the Skill package. Keep the full license in source and offline output. Font acquisition is part of asset readiness; do not name an unavailable face in CSS and call it applied. If acquisition is unavailable, use and report a genuine installed CJK sans fallback rather than blocking ordinary production or pretending WenKai loaded. Retain a suitable supplied/brand font instead when that direction requires it.

For example, scope type to a classroom root inside Slidev's layout:

```css
.slidev-layout .classroom {
  font-family: 'SlideBlocks Classroom WenKai', 'PingFang SC', sans-serif;
  font-weight: 400;
  font-synthesis: none;
  --slidev-code-font-size: 21px;
  --slidev-code-line-height: 32px;
}
.slidev-layout .classroom h1 { font-size: 36px; line-height: 1.35; font-weight: 400; }
.slidev-layout .classroom h2 { font-size: 28px; line-height: 1.4; font-weight: 400; }
.slidev-layout .classroom p,
.slidev-layout .classroom li { font-size: 23.4px; line-height: 1.65; }
```

Adapt selectors to the actual DOM; set the line-height on the text elements. An ancestor's intended line-height does not override Slidev's direct paragraph rule. In one observed failure,25px paragraphs rendered at24px line-height despite a larger parent value. Native code styles use the `--slidev-code-font-size` and `--slidev-code-line-height` variables with high-priority declarations; set these on the root containing the native code instead of assuming a `pre` rule overrides the small runtime defaults. Confirm the final computed paragraph/list/code metrics after font loading, not just the CSS declarations or lack of overflow. Native code blocks keep their own monospace and role-specific size; do not let the reading font or a broad `font: inherit` reset consume code, controls or mathematical notation.

## Attention and complete states

Use the native code, mark and reveal treatments described in [Programming instruction](programming-instruction.md) when the page benefits from them. A prediction answer may be hidden initially and complete in print. Local marks direct attention to the current explanation without changing the source's geometry. A quiet page transition can signal a new step; keep motion subordinate to reading.

For reduced motion, explicitly reduce the selected transition/annotation animation in the project stylesheet; the installed Slidev runtime is not a universal reduced-motion guarantee. For example:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
}
```

Keep native click progression and wait for the short annotation animation to finish. Simply cancelling rough-notation's animation can leave its inline dash offset in an undrawn state. Preserve source context and the full final teaching state. Inspect native print separately: stable source, complete answers, correct CJK font and precise marks must remain readable.

Before accepting the direction, check actual glyph rendering, computed body line-height, multi-line CJK paragraphs, code and token contrast, and the first/complete/print states. A collision-free build is necessary but cannot approve a cramped paragraph or an output that overwhelms the relationship it is meant to explain.
