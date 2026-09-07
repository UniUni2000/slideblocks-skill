# Source Intake

Use this reference whenever the user supplies files, URLs, pasted material, an existing presentation, or a mixed source bundle. Normalize the evidence before outlining the deck; do not begin from whichever file is easiest to parse.

## Preserve and classify the originals

- Treat every supplied local file as read-only input. Do not move, rename, overwrite, or delete it.
- Inventory every source in `.slideblocks/source-map.md`, including its original path or URL, type, role, extraction status, provenance, and unresolved limitations.
- Classify each item by what it can authoritatively provide:
  - factual content or evidence,
  - data or citations,
  - brand identity,
  - visual or layout reference,
  - reusable media or presentation assets,
  - presenter notes or narrative intent,
  - constraints or required wording,
  - duplicate, irrelevant, or uncertain material.
- One item may have several roles. An old PPT may provide facts, brand cues, page order, speaker notes, and reusable images without becoming an immutable template.
- Preserve the user's explicit instructions above every inferred role. Do not infer that visual similarity makes a reference binding.

## Read each format through the strongest available path

| Input | Intake contract |
| --- | --- |
| Markdown, text, CSV, TSV, JSON, YAML | Read directly. Preserve headings, table relationships, units, labels, and source boundaries. |
| PDF | Extract text and tables, then render representative or information-bearing pages so layout, figures, captions, and reading order can be inspected. |
| DOCX or Word material | Extract headings, paragraphs, lists, tables, notes, links, and embedded media. Preserve heading hierarchy rather than flattening the document into prose. |
| PPT or PPTX | Follow the PowerPoint migration route in `quality-contract.md` when the requested output is Slidev. Inspect every source slide, notes, media, charts, tables, equations, links, order, and meaningful builds. Render source slides for visual comparison. |
| Web page or URL | Read the relevant page, record the exact URL and retrieval date, preserve the distinction between quoted source facts and the agent's synthesis, and acquire only assets actually selected for the deck. |
| Spreadsheet | Inspect the relevant sheets, ranges, units, formulas, data definitions, and existing charts. Do not turn unlabeled cells into claims. |
| Images, screenshots, scans | Inspect visually and use OCR only as an aid. Treat readable text as source content only when its origin remains traceable; do not infer hidden product behavior or unsupported facts from appearance. |
| Logos, brand guides, fonts, icons, templates | Record identity, intended use, and technical suitability. A brand asset guides identity; it does not determine the story. |
| Pasted chat material | Record a concise source entry describing its scope and any literal wording, facts, or exclusions the user marked as binding. |

Use available format-specific readers, renderers, and converters. If a required format cannot be read reliably, finish every safe intake step first, name the exact unread source and missing capability, and request one useful conversion such as PDF, PPTX, CSV, or exported images. Never pretend an unread file was analyzed.

## Build a source map, not a content dump

Write `.slideblocks/source-map.md` with these sections:

1. **Request and source boundary** — the user's request, supplied-only or research-permitted boundary, and any explicit exclusions.
2. **Source inventory** — use `| Input ID | Kind | Location | Role | Status | Provenance and notes |`. Give each supplied file, URL, or pasted source one stable `I<NN>` row; `Kind` is exactly `file`, `url`, or `text`, and `Location` exactly matches the workflow-state `path`, `url`, or `label`. When there is no supplied source, use one `| NONE | none | none | ... |` row.
3. **Facts and locked content** — names, dates, metrics, quotations, citations, legal wording, decisions, and other values that must remain faithful.
4. **Reusable assets** — use the exact table below so every candidate visual carrier has one stable source-map identity before planning or layout:

   | Asset ID | Local destination | Source | Kind | Truth and provenance | Rights | Technical status | Intended page/slot | Notes |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | A01 | `public/assets/example.jpg` | `I01`, page 4 | photo | documentary — supplied source image; no factual pixel edits | cleared | ready | `P03.facility-scale` candidate | Preserve the apparatus and people for scale. |

   Assign IDs as uppercase `A<NN>` in stable sequence. Keep an ID when only the local filename, crop, or page assignment changes; create a new ID when the source, truth meaning, or transformation changes materially. `Kind` uses the Visual Evidence Plan `kind` token. `Truth and provenance` begins with its exact `truth` token followed by ` — ` and a traceable source or transformation note. For every chart or diagram, distinguish what supports the claim from what produced the geometry: name the source data fields or source figure and any transformation when geometry is source-derived, or name the semantic model or illustration decision when only the claim comes from a source. A cited sentence alone never makes authored geometry source-derived. `Rights` is exactly `cleared`, `rights-review`, or `blocked`; use `rights-review` for ordinary web material when no separate clearance was requested, without interrupting the presentation workflow. `Technical status` is exactly `ready`, `resolvable`, or `blocked`. `ready` requires an existing project-local destination that carries the complete active/static payload, including a local data or quotation carrier when the slide renders it as text rather than a bitmap. Use `none` for a destination that does not yet exist rather than inventing a file path. Every `documentary`, `source-derived`, or `contextual` asset must reference at least one known source-inventory `I<NN>` ID in `Source` or provenance, and every cited `I<NN>` must exist in that inventory; record an acquired URL automatically as its own source-inventory row. A `ready`, non-placeholder asset may remain selected, alternate, or fallback when `rights` is `cleared` or `rights-review`; only `blocked` usage fails this gate.
5. **Uncertainty and gaps** — missing evidence, conflicting values, unreadable material, and allowed placeholders.
6. **Migration accounting** — when a PowerPoint is supplied, record `Source slide count: <N>`, link to `migration/source-map.md`, and account for every original slide. In that file use exactly one row per 1-based source slide with source slide ID, destination page IDs from the execution lock, preserved content, rebuilt elements, extracted assets, notes status, and unresolved items.

Summarize; do not paste complete documents into this artifact. The originals and normalized extracts remain the evidence.

## Test factual sufficiency

Before story planning, ask internally whether the requested audience outcome can be supported without invention.

- If the supplied corpus is sufficient for both the requested claims and intended content depth, or the source boundary is closed, remain inside it.
- If external research is allowed and a planned page needs stronger factual support, a concrete case or comparison, or specific real material, research that bounded obligation and add only adopted sources to the source map.
- If the user requires a closed corpus, preserve the gap and use an honest placeholder or qualify the claim.
- If sources conflict, keep both values visible in the source map and resolve only when the evidence or user instruction establishes authority.
- Treat invented targets, illustrative numbers, and hypothetical KPIs as scenario data and label them visibly in the deck. Never present them as observed facts.

The source map is the factual authority. Later roles may reorganize and visualize its content, but they may not silently broaden the evidence boundary.

When `composition-director.md` applies to a schema-version-2 full Deck, follow `visual-evidence-director.md`. Every `refs` value in the canonical Visual Evidence Plan resolves to one reusable-asset `A<NN>` row, including source-derived charts, diagrams, quotation treatments, generated non-factual material, and honest placeholders. Every factual row points back to at least one authoritative known `I<NN>` source in `Source` or provenance notes rather than replacing source inventory.
