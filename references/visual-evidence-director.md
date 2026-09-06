# Visual Evidence Director

Use this reference only with `composition-director.md` for a schema-version-2 full-Deck plan: a new complete Deck of three or more published pages or an existing Deck redesigned as a whole. It decides what each page must show before a Block or custom composition decides where to put it. Do not add a Visual Evidence Plan to a schema-version-1 isolated page edit; preserve that edit's accepted surrounding evidence and composition contract.

Do not turn the workflow into an image quota. A text-led page may be the strongest answer, while one evidence-heavy page may need several coordinated carriers. The goal is an accountable chain from page claim to evidence need, real source asset, composition role, rendered pixels, and static delivery.

## Keep one evidence authority chain

Do not create a second `design_spec`, media plan, or asset ledger. Keep ownership narrow:

1. `.slideblocks/source-map.md` owns stable `A<NN>` asset IDs, source/provenance, truth boundary, rights, technical status, and local destination.
2. `.slideblocks/page-plan.md` owns the canonical `## Visual Evidence Plan` after Page Briefs and before Registry Candidate Decisions.
3. `## Registry Candidate Decisions` tests whether each candidate can carry the selected evidence honestly and legibly.
4. `## Deck Composition Plan` binds selected Evidence Slots to concrete canvas roles.
5. `execution-lock.json` projects only selected, locally executable assets and evidence bindings, plus a fallback explicitly activated for one binding's static delivery.
6. Editable source realizes the treatment; `.slideblocks/qa-report.md` records what was actually rendered and inspected.

When the claim, asset, source, rights state, or intended treatment changes, repair the owning upstream record and regenerate the downstream projection. Do not silently swap a selected image during layout or edit the lock merely to make implementation easier.

## Work from need, not media type

For each Page Brief, decide whether visual evidence is `required`, `supporting`, or `none`, and record its `evidenceObjective`:

- `required` means the page's core message cannot be proved or explained honestly without at least one primary Evidence Slot.
- `supporting` means a visual carrier can improve scale, context, interpretation, memory, or human connection without becoming the factual foundation of the page. It may remain text-led when the reason is explicit.
- `none` means text, a number, or a sourced quotation is deliberately the strongest lead. Keep `slots` empty and explain the decision in `textLedReason`.

Use `prove` when the carrier must establish an observable fact, occurrence, measurement, comparison, or record; `explain` when it must make a mechanism, path, or relationship visible; `qualify` when it must bound or correct interpretation; `anchor` for supporting identity, setting, scale, or human context; and `text` only with `evidenceDemand: none`. A required page uses `prove`, `explain`, or `qualify`; a supporting page may use those or `anchor`.

An Evidence Slot describes a communication need, not a predetermined layout. Use `primary` for the page's main proof, explanation, or qualification and `support` for context, qualification, attribution, scale, status, or a secondary explanatory layer. Do not pre-assign the slot to the left, right, top, or bottom; spatial binding happens only in the final Deck Composition Plan.

Every slot also records one concrete `acceptance` statement. Test it by hiding the page title and narrative body while retaining only the carrier and its intrinsic marks: labels, axes, units, legend, quotation text, document context, caption, and source. The remaining carrier must still let a viewer identify the observation, relationship, mechanism, qualification, or context named by the slot. If it merely repeats the claim in larger type, lists isolated KPIs or result names, or adds topic-related geometry, it fails the evidence-fit gate.

Use the exact `## Visual Evidence Plan` JSON contract in `project-contract.md`. The required planning order is:

```text
Page Briefs
→ Visual Evidence Plan
→ Registry Candidate Decisions
→ Deck Composition Plan
→ execution-lock.json
```

## Make one lightweight Web-native opportunity check

After the Evidence Slots are clear and before candidate selection, ask once for each page: would showing a process, state change, parameter change, audience choice, or real local execution in live Slidev make the page materially easier to understand or verify than an equally polished static treatment?

- When the answer is yes, let motion, interaction, or local execution become the treatment of the selected evidence. Name the concrete information job and the complete state in the existing Page Brief or candidate `reason`.
- When the answer is no, prefer real material or a strong static structure. A static page is not a fallback when simultaneous comparison or direct documentary evidence communicates the point best.
- Decorative movement, click-to-reveal restatements, fake execution, and generic technical spectacle do not count as understanding gain. Interaction cannot substitute for a real photograph, archive, apparatus, measured result, or other required evidence.
- Do not create a separate Experience Plan, JSON field, Registry capability, interaction quota, or modality quota. The selected behavior must still work in live Slidev, the copied `offline.html`, and reduced-motion mode, with a complete stable state.

## Prefer concrete material without a closed trigger list

Before settling on text cards, generic geometry, a diagram, or a synthesized SVG, ask whether concrete subject-specific material would make the page more immediate, recognizable, credible, or memorable. If it would, search the web autonomously and choose whatever real material best serves the page. This is an open visual judgment, not a taxonomy of eligible subjects, an image quota, or a new field in the plan.

Give selected real material enough scale, crop, and compositional weight to do visible work; do not reduce it to a decorative thumbnail beside the explanation. Use diagrams for relationships, mechanisms, structures, and processes. When real material would materially improve recognition or presence, a diagram cannot substitute for it, though the two may work together. When an abstract treatment communicates the page better, use it confidently without forcing an image.

Under the scientific-talk default, seek original paper figures for research and authentic topic-specific imagery elsewhere before choosing simplified redraws. A figure that is unreadable in a proposed small region is a composition problem first: inspect useful source panels, meaningful crops, enlargement and permitted page splits before rejecting it. Preserve axes, legends, context and qualifiers. Do not fix a layout and then discard the strongest material merely because it does not fit that layout.

Download selected web media into project-local assets so both live Slidev and the copied `offline.html` remain complete without hotlinks. For ordinary presentation work, a `rights-review` status does not block selection or require user interruption; only `blocked` usage or an explicitly requested publication-grade rights requirement does.

## Register real candidates in the source map

Give every candidate asset or source-derived visual carrier one stable `A<NN>` row under `## Reusable assets` in `.slideblocks/source-map.md` before referencing it from an Evidence Slot. This includes a chart, diagram, or quotation treatment derived directly from an `I<NN>` source. Keep the ID stable if the local filename, crop, or selected page changes. Create a new ID when the source, truth meaning, or transformation changes materially.

An asset may be:

- a supplied or acquired photograph, scan, screenshot, archival fragment, brand asset, or illustration;
- a chart, map, table fragment, or diagram derived from named source data or relationships;
- a sourced quotation prepared as a visual carrier with its author, context, date, and source retained;
- a generated non-factual illustration used for atmosphere, metaphor, or abstract explanation;
- an honest placeholder whose missing factual or brand input remains visible.

Do not treat a URL, a search-result thumbnail, or an unverified generated file as ready evidence. Acquire only candidates that survive the evidence-fit boundary and record the local destination when one exists.

## Apply the four gates in order

Evaluate every option in an Evidence Slot in this order. Stop at the first failed gate and mark the option `rejected` with a concrete reason.

1. **Evidence fit** — does the option actually prove, explain, qualify, or provide the context named by `need`? Attractive decoration and topic similarity do not pass.
2. **Truth and provenance** — can the audience-relevant meaning be traced to an original source, named data transformation, or explicitly non-factual generated intent? Preserve the boundary between what a carrier shows and what the page claims.
3. **Usage block** — is the option explicitly blocked for this delivery? For ordinary presentation work, `rights-review` remains usable and does not require a separate clearance step; apply publication-grade rights review only when the user explicitly requests it.
4. **Technical readiness** — can the asset be addressed locally and rendered legibly in live, reduced-motion, offline, and static states without an unresolved dependency?

Use these normalized planning values:

- `kind`: `photo`, `chart`, `diagram`, `document`, `quote`, `illustration`, `generated`, or `placeholder`;
- `truth`: `documentary`, `source-derived`, `contextual`, `generated-nonfactual`, or `placeholder`;
- `claimSupport`: `proof`, `explanation`, `qualification`, `context`, `restatement`, or `decoration`;
- `independenceTest`: `pass` or `fail`;
- `rights`: `cleared`, `rights-review`, or `blocked`;
- `technical`: `ready`, `resolvable`, or `blocked`;
- `decision`: `selected`, `alternate`, `fallback`, or `rejected`.

`alternate` is a viable unselected option. `fallback` is an explicitly honest substitute if the selected option later becomes unavailable. It stays out of live execution unless promoted to `selected`; the only exception is a single-ref fallback explicitly activated for the same slot by `static: asset:A<NN>`. Every `selected`, `alternate`, or `fallback` option must have `rights` set to `cleared` or `rights-review`, `technical: ready`, and `independenceTest: pass`; an option blocked for use, merely resolvable, technically blocked, still a placeholder, or failing the carrier-only test is `rejected` until its owning source-map state or treatment is repaired. `restatement` and `decoration` never remain viable evidence options. Every non-empty slot has exactly one selected option, and only the selected option may bind as live evidence.

For `required`, include at least one `primary` slot. On a `prove` page, every viable primary option has `claimSupport: proof`; on an `explain` page it has `proof` or `explanation`; on a `qualify` page it has `proof` or `qualification`. A required primary may not use `kind: illustration`, `generated`, or `placeholder`, or `truth: generated-nonfactual` or `placeholder`, to satisfy the need. Use a real traceable carrier, qualify the claim, or retain a visible blocker. For `supporting`, slots may be empty only when `textLedReason` explains why a supporting visual would not improve the page. For `none`, use `evidenceObjective: text`, keep slots empty, and provide a non-empty `textLedReason`.

SVG is only a file format. A source-derived chart or mechanism diagram can pass when its intrinsic marks encode the required relationship and its carrier-only test passes. An empty or ornamental SVG, a label constellation, isolated KPI cards, and a list of named achievements are `restatement` or `decoration` unless they visibly encode a claim-specific observation, comparison, mechanism, or qualification.

## Preserve the epistemic boundary

Different carriers support different claims:

- A documentary photograph can establish that a person, object, or scene existed in the recorded context; it does not by itself prove causality, scale outside the frame, or performance.
- A chart can support a comparison or trend only when its range, units, baseline, categories, transformations, and source remain recoverable.
- A diagram explains a mechanism or relationship; unless sourced as an observed result, it does not prove that the system behaved that way. Lines between repeated body labels do not become evidence merely by being exported as SVG.
- An archival fragment needs enough date, signature, caption, or document context to remain interpretable after cropping.
- A quotation needs the speaker or author, context, date when relevant, and a nearby source reference; do not turn paraphrase into quotation.
- A generated image may carry mood, metaphor, or abstract explanation. It must not impersonate a real building, person, product interface, historical event, scientific apparatus, experiment, or measured result.

Do not improve apparent image quality by inventing factual pixels, removing provenance marks, or cropping away a qualifier. Generated extension, reconstruction, or cleanup that changes factual meaning requires a new source-map asset ID and an explicit non-factual or transformed status.

## Filter Blocks against selected evidence

Run Registry and custom candidates only after the Visual Evidence Plan is stable enough to identify selected evidence for each required slot. Candidate selection still follows the priority in `block-selection.md`:

1. semantic responsibility and evidence capacity;
2. real selected assets, truth fit, non-blocked usage, and technical readiness;
3. a clear Web-native understanding gain when the Page Brief benefits from one;
4. Deck visual-grammar fit;
5. fit with the page's actual role in the ordered sequence.

A candidate fails when it drops a selected slot, makes its qualifiers or attribution unreadable, requires an incompatible media shape, cannot preserve the complete static evidence state, or adds behavior that performs no concrete information job. A more varied silhouette or richer interaction cannot rescue that failure. Conversely, a fitting Block does not authorize every page to inherit its image ratio or grid.

## Bind selected evidence to the canvas

After the complete candidate sequence is selected, bind every selected Evidence Slot to at least one canvas entry in `## Deck Composition Plan` using its optional `evidence` array:

```json
{
  "zone": "right",
  "role": "primary",
  "purpose": "Use the official facility photograph to establish physical scale and reality.",
  "evidence": [
    {
      "slot": "P03.facility-scale",
      "refs": ["A31"],
      "treatment": "Keep the apparatus and surrounding people in frame; preserve the nearby source credit.",
      "static": "same"
    }
  ]
}
```

Use the page-qualified slot key `P<NN>.<slot-id>`. `refs` must exactly match the selected option's source-map `A<NN>` asset IDs. `treatment` names the intended crop, chart emphasis, diagram state, quotation context, or other meaning-preserving transformation. `static` is exactly `same`, `state:complete`, or `asset:A<NN>`; use `same` when no alternate static treatment is required, `state:complete` for a deterministic complete component state, and `asset:A<NN>` only when that asset is already a selected ref or is the sole ref of one explicit `fallback` option in the same slot. The active static asset must pass the same source-map truth, non-blocked usage, technical, and required-primary factual gates and also enters `requiredAssets`.

Bind a `primary` slot to a `primary` canvas role. Bind a `support` slot to a `support` role, or to a `primary` role only when it is intentionally integrated with the main visual. Continuity and negative-space roles do not satisfy evidence bindings. Every selected slot must appear in at least one canvas binding; a canvas entry without evidence may omit the array.

## Lock only the selected executable set

Keep execution-lock schema version 2. Project selected evidence bindings through `composition.pages[*].canvas[*].evidence` and include every selected live ref plus every explicitly activated static ref in `requiredAssets`. Each evidence-backed required-asset item contains the exact stable `id`, local `path`, `status: "ready"`, and `provenance: "source-map:<Axx>"` defined in `project-contract.md`.

Do not copy alternates, unactivated fallbacks, rejected options, research candidates, search URLs, or rights-blocked publication assets into the lock. A single-ref fallback may enter only when the same slot explicitly names it as `static: asset:A<NN>`. For a live fallback promotion, update the Visual Evidence Plan first, update the source map if needed, recheck Candidate Decisions and composition treatment, then regenerate the lock.

## Review the rendered evidence

Follow `qa.md` and record the result under `## Visual evidence review` in `.slideblocks/qa-report.md`. Inspect the actual pixels at full size as well as the contact sheet:

- the selected asset appears in the planned canvas role and remains the intended visual entry;
- every required primary slot passes its carrier-only acceptance test after surrounding title and narrative body are removed; record the exact `P<NN>.<slot-id> — carrier-only: PASS — ...` observation in the QA report;
- crop, scale, labels, axes, units, quotations, document context, and any visible source credit remain legible and truthful;
- treatment preserves the selected option's meaning and does not introduce an unplanned substitute;
- live, reduced-motion, offline, print, and requested non-Office exports retain the complete static evidence state;
- repeated imagery or repeated crops do not create a false impression of broader evidence;
- the highest-impact evidence defect is repaired and the affected states are rerendered.

Contract drift, missing asset IDs, missing selected-slot bindings, mismatched refs, an incompatible `evidenceObjective`/`claimSupport`, a failed independence test, a missing required carrier-only PASS observation, and unavailable ready paths are deterministic errors. Perceived visual dominance, crop quality, contextual sufficiency beyond the recorded acceptance test, and excessive reuse are rendered-review judgments or warnings; do not replace pixel inspection with an aesthetic score.
