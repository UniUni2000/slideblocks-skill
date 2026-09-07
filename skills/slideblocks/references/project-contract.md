# Project Contract and Artifact Ownership

Use this reference when creating, resuming, validating, or handing off a SlideBlocks project. Keep one owner for each fact and regenerate derived artifacts from their owner.

## Contents

- Authority chain
- Required project artifacts
- Page-plan structure
- Page Briefs
- Visual Evidence Plan
- Registry Candidate Decisions
- Deck Composition Plan
- Execution-lock schema
- Workflow-state schema
- QA report minimum

## Authority chain

1. User instructions and original sources
2. `.slideblocks/source-map.md` for source roles, facts, provenance, conflicts, and gaps
3. `.slideblocks/page-plan.md` for communication strategy, narrative, page responsibilities, Page Briefs, the Visual Evidence Plan, task-local Registry Candidate Decisions, and final visual direction
4. `.slideblocks/execution-lock.json` for stable machine-readable execution anchors
5. Editable Slidev source for realized pages and interactions
6. `.slideblocks/qa-report.md` and `.slideblocks/build-result.json` for observed verification evidence
7. `offline.html`, `portable/`, `dist/`, and explicitly requested PDF or image exports as derived delivery artifacts

Never use a downstream artifact to silently rewrite an upstream decision. Repair the owning artifact, then regenerate affected downstream work.

## Required project artifacts

| Artifact | Owns | Rules |
| --- | --- | --- |
| `.slideblocks/source-map.md` | Source inventory, factual boundary, locked values, stable `A<NN>` reusable assets, conflicts, gaps, provenance, truth boundary, technical status, and rights | Summarize rather than duplicate originals. Update when inputs change. |
| `.slideblocks/page-plan.md` | Communication contract, narrative spine, exact page roster, Page Briefs, Visual Evidence Plan, task-local Registry Candidate Decisions, visual thesis/grammar, assumptions, placeholders, and the final Deck Composition Plan when applicable | Internal design authority; not a user approval surface. |
| `.slideblocks/work/page-groups/*.md` | Disjoint page-group research and design drafts used to expand Page Briefs without one-response compression | Non-authoritative strategy-stage working input. Each worker owns one file; only the lead Agent merges accepted content into the source map and page plan. Remove only the current run's packets after the merged plan passes review. |
| `.slideblocks/execution-lock.json` | Route, canvas, page IDs/order, Registry coordinates, stable type/color roles, selected required assets, outputs, and normalized composition/evidence anchors in schema v2 | Executor may not edit it merely to make a page easier. Repair it from the page plan. |
| `.slideblocks/workflow-state.json` | Current stage, status, resume point, blockers, input fingerprints | Operational state only; never use it as a second design spec or QA report. |
| `.slideblocks/qa-report.md` | Actual rendered pages, states, viewport, aesthetic findings, fixes, reduced-motion, print/export, and offline observations | Use the canonical QA headings below and record only performed checks. |
| `.slideblocks/build-result.json` | Final offline build receipt | Keep the existing exact command/status/output/playback contract. |
| `migration/source-map.md` | Source-slide to destination-page accounting for a PowerPoint migration | Required only for `powerpoint-migration`; account for every source slide, preserved content, rebuilt elements, extracted assets, notes, and unresolved items. |
| `slides.md`, components, styles, and local assets | Editable realized deck | Source of truth for visible and interactive behavior. |
| Top-level `wakeLock: false`; `setup/shortcuts.ts`, `setup/context-menu.ts`, `setup/pdf-export.ts`, `setup/routes.ts`, `setup/text-edit.ts`, `setup/offline-export.ts`, `setup/vite-plugins.ts`, and `global-top.vue` | Presenter workbench runtime and entries | Required in every Deck; disable Slidev's unsafe automatic Wake Lock request, merge the bundled native-menu bootstrap, text editing, offline delivery, and PDF-only print route, and preserve existing setup content per `references/runtime-workbench.md`. |
| `offline.html` and explicitly requested non-Office exports | Delivery copies | Regenerate after every relevant source, style, or asset change. Never patch them as authoring sources. Workbench text edits are explicit delivery overrides: save them with the offline export action; they do not update `slides.md`, the source map, or the execution lock. |

## Page-plan structure

Keep `.slideblocks/page-plan.md` implementation-ready without copying the planning transcript:

1. **Communication contract** — audience, objective, intended audience experience or outcome, core subject, message, or ask as applicable, delivery context, afterlife, language, constraints, and source-fidelity boundary.
2. **Source and fact boundary** — source-map path, locked facts, scenario data, citations, research permission, and unresolved conflicts.
3. **Narrative spine** — opening tension, argument/evidence sequence, decision or result peak, and close.
4. **Visual direction** — after the narrative and page purposes are clear but before page-group work, record one content-fit visual thesis and only the shared decisions that materially guide the Deck: palette and type roles, continuous-canvas logic, imagery/diagram/chart language, material treatment, contextual page furniture, motion, reduced-motion, and static behavior.
5. **Exact slide roster** — one row per page with stable ID, why the page exists, intended audience experience, needed content or material, content relationship, selected Artifact or custom reason after selection, asset state, and notes/static-state needs.
6. **Page Briefs** — purpose-led, flexible pre-Registry briefs for each stable page. Record the content, material, research, sources, presenter support, sequence context, density, or static behavior that the page actually needs; do not force every page into one argument model or equal-depth template. Do not assign the final family or normalized structural signature here.
7. **Visual Evidence Plan** — on a schema-version-2 composition-directed full Deck, the exact page-by-page demand, text-led reason, primary/support Evidence Slots, and gated asset options under the canonical section and JSON contract below. Complete it before Registry Candidate Decisions; omit it from schema-version-1 isolated edits.
8. **Registry Candidate Decisions** — task-local evidence from hard filtering and real preview inspection, encoded under the exact section and JSON contract below. Keep custom as a first-class candidate and select exactly one candidate per page.
9. **Deck Composition Plan** — required only when `composition-director.md` applies and written after the candidate sequence is selected. It records the final families, density, canvas roles, selected-evidence bindings, continuity, rhythm, and intentional repetition while keeping semantic page responsibility separate from spatial composition.
10. **Assumptions, placeholders, rights, and deferred items** — keep this exact section title for project validation; record explicit usage blocks and any deferred rights review here without treating ordinary rights review as a blocker.

Do not create a second outline, candidate ledger, or design specification elsewhere. Page-group work packets are temporary merge inputs, not another authority, and downstream stages may not read them instead of the merged Page Briefs. `.slideblocks/page-plan.md` remains the only human-readable design authority. Page additions, deletion, merge, split, reordering, candidate selection, or material composition changes update the page plan first and then the execution lock.

## Page Briefs

For the complete-Deck content-planning route, write every stable page under `## Page Briefs` in roster order. Each entry begins with its stable ID, working title, and one clear statement of why the page exists. After that, use the structure the page needs rather than a fixed field set:

```markdown
**P01 — Working title**

- **Purpose:** Why this page exists and what the audience should experience.
- Add only the content, material, sources, presenter notes, sequence context, interaction, or static-state guidance needed to realize that purpose.
```

Follow `content-planning.md` to create and merge file-backed page-group work without turning those packets into a second plan. A cover, transition, quotation, or single-object showcase may remain concise; a page that depends on explanation, comparison, decision, or evidence receives deeper work. Any substantive need must be specific enough to execute rather than left as generic future intent.

Complete Page Briefs before Registry discovery, but leave final `topology`, `axis`, `primaryZone`, family ID, density rhythm, evidence canvas binding, and adjacent-page solution unresolved. Search and hard-filter against semantic responsibility, evidence capacity, binding real assets, explicit usage blocks, status, and compatibility first. A `rights-review` state alone is not a rejection for ordinary presentation work. Only surviving candidates receive a normalized structural signature derived from a real Registry preview or task-local custom preview.

## Visual Evidence Plan

For a schema-version-2 full Deck governed by `composition-director.md`, write exactly one canonical `## Visual Evidence Plan` section in `.slideblocks/page-plan.md` after Page Briefs and before Registry Candidate Decisions. Do not add this section to a schema-version-1 isolated edit. It contains exactly one fenced `json` object rooted at `pages`:

```json
{
  "pages": {
    "P03": {
      "evidenceDemand": "required",
      "evidenceObjective": "prove",
      "textLedReason": null,
      "slots": [
        {
          "id": "facility-scale",
          "role": "primary",
          "need": "Show the facility's real physical scale without implying unobserved performance.",
          "acceptance": "With surrounding title and body copy hidden, the apparatus and nearby people remain visible together, so a viewer can identify the physical scale from the carrier itself.",
          "options": [
            {
              "refs": ["A31"],
              "kind": "photo",
              "truth": "documentary",
              "claimSupport": "proof",
              "independenceTest": "pass",
              "rights": "cleared",
              "technical": "ready",
              "decision": "selected",
              "reason": "Official photograph directly shows the apparatus and surrounding people for scale."
            },
            {
              "refs": ["A32"],
              "kind": "generated",
              "truth": "generated-nonfactual",
              "claimSupport": "decoration",
              "independenceTest": "fail",
              "rights": "cleared",
              "technical": "ready",
              "decision": "rejected",
              "reason": "It may provide atmosphere but cannot satisfy this factual primary need."
            }
          ]
        },
        {
          "id": "facility-status",
          "role": "support",
          "need": "Distinguish operating, under-construction, and research states.",
          "acceptance": "Without the page narrative, the carrier still shows the three named states and their source-derived mapping.",
          "options": [
            {
              "refs": ["A33"],
              "kind": "diagram",
              "truth": "source-derived",
              "claimSupport": "qualification",
              "independenceTest": "pass",
              "rights": "cleared",
              "technical": "ready",
              "decision": "selected",
              "reason": "Source-derived status diagram keeps the three states explicit."
            }
          ]
        }
      ]
    },
    "P04": {
      "evidenceDemand": "none",
      "evidenceObjective": "text",
      "textLedReason": "The sourced quotation itself is the intended closing focus; added imagery would weaken attribution and pacing.",
      "slots": []
    }
  }
}
```

Every page-plan page ID appears exactly once and uses exactly these page fields: `evidenceDemand`, `evidenceObjective`, `textLedReason`, and `slots`.

- `evidenceDemand` is `required`, `supporting`, or `none`. `evidenceObjective` is `prove`, `explain`, `qualify`, `anchor`, or `text`. `required` uses `prove`, `explain`, or `qualify` and has at least one `primary` slot. `supporting` may use `prove`, `explain`, `qualify`, or `anchor`, and may have no slots only when `textLedReason` is non-empty. `none` uses `text`, has no slots, and has a non-empty `textLedReason`. Otherwise `textLedReason` may be a non-empty string or `null`.
- A slot contains exactly `id`, `role`, `need`, `acceptance`, and `options`. `id` is unique within its page and uses a stable lowercase kebab-case token. `role` is `primary` or `support`; `need` states what the carrier must prove, explain, qualify, or contextualize rather than naming a layout. `acceptance` states what remains visibly identifiable when the page title and narrative body are hidden but the carrier's intrinsic labels, axes, units, legend, quotation text, document context, caption, and source remain.
- An option contains exactly `refs`, `kind`, `truth`, `claimSupport`, `independenceTest`, `rights`, `technical`, `decision`, and a non-empty `reason`. Every `refs` item is a stable `A<NN>` ID in the source map's canonical `## Reusable assets` table, including a chart, diagram, or quotation treatment derived from an `I<NN>` source. Its source-map `Kind`, leading `Truth and provenance` token, `Rights`, and `Technical status` agree with the option.
- `kind` is `photo`, `chart`, `diagram`, `document`, `quote`, `illustration`, `generated`, or `placeholder`. `truth` is `documentary`, `source-derived`, `contextual`, `generated-nonfactual`, or `placeholder`. `rights` is `cleared`, `rights-review`, or `blocked`. `technical` is `ready`, `resolvable`, or `blocked`. `decision` is `selected`, `alternate`, `fallback`, or `rejected`.
- `claimSupport` is `proof`, `explanation`, `qualification`, `context`, `restatement`, or `decoration`. `independenceTest` is `pass` or `fail`. Apply option gates in this order: evidence fit (`claimSupport` plus the carrier-only independence test), truth fit, explicit usage blocks, then technical readiness. A failed option is `rejected` and names the decisive gate in `reason`. Every `selected`, `alternate`, or `fallback` option has `independenceTest: pass`, uses `rights: cleared` or `rights-review`, is `technical: ready`, and is neither `restatement` nor `decoration`; an option that only repeats body copy, lists isolated KPIs or result names, adds ornamental geometry, is explicitly blocked, is merely resolvable, is technically blocked, or is still a placeholder remains `rejected` until repaired. Every non-empty slot has exactly one `selected` option. Alternates and fallbacks remain planning evidence only, except that a single-ref fallback may be explicitly activated for the same slot's static delivery by `static: asset:A<NN>`.
- Every viable option in a required primary slot must match the page objective: `prove` accepts only `proof`; `explain` accepts `proof` or `explanation`; `qualify` accepts `proof` or `qualification`. A `required` need also cannot be satisfied by an option whose `kind` is `illustration`, `generated`, or `placeholder`, or whose `truth` is `generated-nonfactual` or `placeholder`. Qualify the claim, select traceable evidence, or keep the owning stage blocked. Generated material may support mood, metaphor, or explicitly abstract explanation on a supporting page but may not impersonate a real person, place, product interface, historical event, apparatus, experiment, or measured result.
- SVG is only a delivery format. A source-derived SVG chart or mechanism diagram may pass when its intrinsic marks satisfy the recorded acceptance test. An empty or decorative SVG, label constellation, KPI-card row, or achievement-name list does not become proof by being stored as an asset.

Follow `visual-evidence-director.md` for carrier-specific truth boundaries, treatment decisions, fallback promotion, and rendered review. Do not create a separate evidence plan or asset ledger.

## Registry Candidate Decisions

Keep Registry Candidate Decisions inside `.slideblocks/page-plan.md`. Use exactly one `## Registry Candidate Decisions` section containing exactly one fenced `json` object with this root shape:

```json
{
  "pages": {
    "P01": {
      "candidates": [
        {
          "id": "blocks/hero/image-mask-hero",
          "source": "live-catalog",
          "gates": {
            "semantic": "exact",
            "evidence": "complete",
            "assets": "ready",
            "delivery": "pass"
          },
          "grammarFit": "native",
          "signature": {
            "status": "known",
            "topology": "split",
            "axis": "horizontal",
            "primaryZone": "right"
          },
          "signatureEvidence": "public-preview:<actual Catalog URL or local path>; state=complete-static",
          "decision": "selected",
          "reason": "Exact opening responsibility, complete evidence capacity, and ready hero image."
        },
        {
          "id": "custom",
          "source": "custom",
          "gates": {
            "semantic": "exact",
            "evidence": "complete",
            "assets": "ready",
            "delivery": "pass"
          },
          "grammarFit": "adaptable",
          "signature": { "status": "unknown" },
          "signatureEvidence": null,
          "decision": "survivor",
          "reason": "First-class fallback retained; define custom-plan:P01 if it becomes selected."
        }
      ]
    }
  }
}
```

Candidate fields use only these normalized values:

- `id`: exact `blocks/...` Registry ID or `custom`; Recipe IDs must first expand through declared `blockIds`, and Deck IDs are not page candidates. `source`: `live-catalog`, `bundled-snapshot`, or `custom`.
- `gates.semantic`: `exact`, `adaptable`, or `reject`; `gates.evidence`: `complete`, `bounded-adaptation`, or `reject`; `gates.assets`: `ready`, `resolvable`, or `reject`; `gates.delivery`: `pass` or `reject`.
- `grammarFit`: `native`, `adaptable`, `disruptive`, or `not-assessed`.
- `signature`: `{ "status": "known", "topology": "...", "axis": "...", "primaryZone": "..." }` or `{ "status": "unknown" }`. A known signature requires non-empty `signatureEvidence`; a Registry candidate must identify the real public or local preview and inspected complete static state, while a custom candidate uses the exact `custom-plan:P<NN>` evidence for its page. An unknown signature requires `signatureEvidence: null` and a reason explaining the uncertainty.
- `decision`: `selected`, `survivor`, or `rejected`, with a non-empty `reason`. Every page has exactly one selected candidate. Any candidate containing a `reject` gate must have `decision: rejected`, an unknown signature, and null signature evidence. A selected custom candidate must have a known signature and its exact page-scoped `custom-plan:P<NN>` evidence.

The record is durable for this task and resume flow but is not a new project authority, Registry artifact, Catalog field, or execution-lock payload. Expand a Recipe only through its declared `blockIds`; treat a Deck only as a whole-deck narrative and visual reference. Evaluate evidence capacity and asset readiness against the selected Visual Evidence Plan options, not an imagined future image. Select the complete candidate sequence lexicographically by semantic/evidence fit, real-asset readiness, a clear Web-native understanding gain when relevant, visual-grammar fit, and fit with each page's actual role in the ordered sequence before writing the final Deck Composition Plan. A different silhouette is not an advantage by itself. Record that expression decision in the existing candidate `reason`; do not add a field. Custom is always a first-class candidate.

## Deck Composition Plan

When `composition-director.md` applies, write `## Deck Composition Plan` only after the task-local candidate sequence has survived hard filtering, real-preview signature derivation, and whole-deck lexicographic selection. Follow that reference for maintained field definitions and sequence rules. Include the continuity anchors and density rhythm in readable prose, then include exactly one fenced `json` object whose root contains `families` and `pages`. That object is the parseable final composition contract and must contain every selected family, page, density, canvas zone/role/purpose, selected-evidence binding, and repetition intent.

The page plan remains the sole human-readable authority. Registry Candidate Decisions and previews are decision evidence rather than a second design authority, and a Block, Recipe, or Deck may not silently determine the complete project grid. Every selected known candidate signature must equal the final family assigned to that page. A surface adaptation may change tokens and styling but not silently change the normalized triplet; represent a structural rebuild as a custom candidate with `custom-plan:P<NN>` evidence. If discovery supports a materially better structure, update the page plan and re-evaluate the complete sequence before deriving the lock. The execution lock stores a data-equivalent projection under `composition` so the validator can detect drift regardless of JSON key order or formatting.

Any canvas entry may add an `evidence` array. Each binding has exactly `slot`, `refs`, `treatment`, and `static`: `slot` uses `P<NN>.<slot-id>`, `refs` exactly match that slot's selected Visual Evidence Plan option, `treatment` records the meaning-preserving crop, encoding, emphasis, quotation context, or diagram state, and `static` is exactly `same`, `state:complete`, or `asset:A<NN>`. An `asset:A<NN>` static value must name either one of the selected refs or the sole ref of an explicit `fallback` option in the same slot, and that source-map asset must pass the same truth, non-blocked usage, technical, and required-primary factual gates. Every selected slot appears in at least one canvas binding. A primary slot binds to a primary canvas role; a support slot binds to support, or to primary only when intentionally integrated with the main visual. Continuity and negative-space roles do not satisfy an evidence binding. Pages with `evidenceDemand: none` contain no evidence bindings.

Do not add this section merely to relabel an isolated one- or two-page edit. Preserve that edit's accepted surrounding plan and lock unless the user authorizes a deck-wide redesign.

## Execution-lock schema

After the final Deck Composition Plan is recorded, new or regenerated locks on the composition-director route use schema version 2 and this minimal shape:

```json
{
  "schemaVersion": 2,
  "route": "new-deck",
  "canvas": { "width": 1280, "height": 720 },
  "slideOrder": ["P01", "P02", "P03"],
  "registryArtifacts": [],
  "style": {
    "direction": "content-specific direction",
    "palette": { "background": "#FFFFFF", "text": "#111111", "accent": "#0057FF" },
    "typography": { "heading": "local font stack", "body": "local font stack" }
  },
  "composition": {
    "families": {
      "F01": { "topology": "single-focus", "axis": "none", "primaryZone": "center" },
      "F02": { "topology": "sequence", "axis": "horizontal", "primaryZone": "full" },
      "F03": { "topology": "split", "axis": "horizontal", "primaryZone": "right" }
    },
    "pages": {
      "P01": {
        "family": "F01",
        "density": "anchor",
        "canvas": [
          { "zone": "center", "role": "primary", "purpose": "establish the subject" },
          { "zone": "left", "role": "negative-space", "purpose": "separate the title from the subject" }
        ]
      },
      "P02": {
        "family": "F02",
        "density": "balanced",
        "canvas": [
          { "zone": "full", "role": "primary", "purpose": "carry the ordered institutional milestones" },
          { "zone": "bottom", "role": "continuity", "purpose": "retain the deck baseline across the sequence" }
        ]
      },
      "P03": {
        "family": "F03",
        "density": "balanced",
        "canvas": [
          {
            "zone": "right",
            "role": "primary",
            "purpose": "carry the main evidence visual",
            "evidence": [
              {
                "slot": "P03.facility-scale",
                "refs": ["A31"],
                "treatment": "Keep the apparatus and surrounding people in frame; retain a nearby source credit.",
                "static": "same"
              }
            ]
          },
          {
            "zone": "left",
            "role": "support",
            "purpose": "explain the evidence and takeaway",
            "evidence": [
              {
                "slot": "P03.facility-status",
                "refs": ["A33"],
                "treatment": "Keep all three state labels visible and use the source-derived color mapping.",
                "static": "state:complete"
              }
            ]
          }
        ]
      }
    }
  },
  "requiredAssets": [
    {
      "id": "A31",
      "path": "public/assets/facility.jpg",
      "status": "ready",
      "provenance": "source-map:A31"
    },
    {
      "id": "A33",
      "path": "components/FacilityStatus.vue",
      "status": "ready",
      "provenance": "source-map:A33",
      "renderRoute": "figure:comparison",
      "generator": ".slideblocks/generate-figures.mjs"
    }
  ],
  "outputs": { "editableSource": "slides.md", "offlineFile": "offline.html", "staticExports": [] }
}
```

Allowed `route` values are `new-deck`, `existing-slidev`, and `powerpoint-migration`. A resumed project retains its original route.

- Schema version 1 remains accepted for legacy projects and for isolated one- or two-page edits outside the composition-director route. Do not fabricate a v2 composition plan after implementation merely to relabel an old lock. When a legacy project's strategy, page roster, or material composition is regenerated under a deck-wide redesign, update the page plan first, derive a complete v2 lock, and run the v2 composition review.
- In schema version 2, `composition.families` is the normalized projection of the page-plan JSON contract, and `composition.pages` contains exactly the same page IDs as `slideOrder`. Every page family reference must exist, and the complete `composition` object, including selected-evidence bindings, must match the page-plan contract. Follow `composition-director.md` for density, canvas roles, structural-signature meaning, and content-led repetition instead of duplicating them here.
- `repetitionIntent` is optional and may document why stable geometry helps a finite comparison, progression, demonstration, or source-faithful sequence; it is not required merely because pages repeat.
- The lock proves that the planned anchors agree. It cannot prove that the rendered composition serves each page purpose or that repetition and change feel appropriate in sequence; that judgment belongs in the Deck composition review.

- `slideOrder` contains every published page exactly once using stable `P<NN>` IDs. Put exactly one `<!-- slideblocks-page: P<NN> -->` marker in each Slidev slide body so the validator can compare the realized source order with the lock.
- `registryArtifacts` may be empty only when no current semantic match exists or delivery is unavailable; document inspected/rejected candidates in the page plan.
- Every selected Artifact must retain exact ID, version, content hash, Prompt variant, and assigned pages. Never invent missing coordinates.
- Obtain exact version, content hash, and Prompt variant from the live Catalog or delivery response. The bundled snapshot supplies Artifact IDs and selection metadata only; when live coordinates are unavailable, leave `registryArtifacts` empty and record the selected snapshot ID plus fallback reason in the page plan. The deterministic project validator checks coordinate shape and page assignment; it does not prove live Registry authenticity.
- Keep rejected candidates and ranking evidence in the task-local Registry Candidate Decisions, not in `execution-lock.json`. The lock contains only selected Registry coordinates and the final composition projection.
- `requiredAssets.status` is `ready`, `placeholder`, or `rights-review`. Every `ready` path must exist locally. Record blockers in workflow state rather than adding a fake asset.
- A selected Visual Evidence Plan option projects every live `A<NN>` ref into `requiredAssets`; a single-ref fallback also enters only when the same slot explicitly activates it through `static: asset:A<NN>`. Other alternates, fallbacks, rejected options, search candidates, and blocked assets stay out. Each evidence-backed asset entry contains its stable source-map `id`, existing local `path`, `status: ready`, and `provenance: source-map:<Axx>`, with the provenance suffix agreeing with the ID. A selected `diagram` or `chart` implemented by `.vue`, `.js`, `.mjs`, `.ts`, `.tsx`, `.jsx`, or `.cjs` also contains `renderRoute`; `figure:*`, `diagram:elk`, and `diagram:mermaid` routes contain a project-local `generator`. Its mounted source root carries literal matching `data-slideblocks-asset-id="A<NN>"` and `data-slideblocks-render-route="..."` attributes. Assets unrelated to visual-evidence slots, such as an already-established local font, may omit `id` and retain their existing provenance form.
- Every evidence binding's `refs` must exactly resolve to the selected Visual Evidence Plan refs and to matching `requiredAssets.id` entries. A distinct static asset must resolve to the same slot's explicit single-ref fallback and its matching required-asset entry. Promote a fallback in the Visual Evidence Plan and repair downstream artifacts before using it live; do not switch live refs only in the lock.
- Keep style anchors compact. Page-local garnish does not require a lock entry; recurring semantic roles do.

## Workflow-state schema

Write valid JSON with this minimal shape:

```json
{
  "schemaVersion": 1,
  "route": "new-deck",
  "stage": "execution",
  "status": "in-progress",
  "resumeFrom": "P03",
  "inputs": [
    {
      "kind": "file",
      "path": "materials/report.pdf",
      "sha256": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }
  ],
  "blockers": []
}
```

Allowed stages are `intake`, `strategy`, `registry`, `assets`, `execution`, `qa`, and `delivery`. Allowed statuses are `in-progress`, `blocked`, and `complete`.

- A local-file input uses `{ "kind": "file", "path": "...", "sha256": "sha256:<64 lowercase hex>" }`. Recompute it when resuming. The validator also recomputes project-contained readable files; external paths remain structurally checked because a portable project must not grant arbitrary filesystem reads.
- A retrieved URL input uses `{ "kind": "url", "url": "https://...", "retrievedAt": "<ISO-8601>", "sha256": "sha256:<64 lowercase hex>" }`.
- Pasted material uses `{ "kind": "text", "label": "...", "sha256": "sha256:<64 lowercase hex>" }`. The source map retains its scope and any binding wording; the state stores only the fingerprint.
- `inputs` may be empty only when the source inventory contains the canonical `NONE` row. Every listed input must satisfy one of the shapes above and match one `I<NN>` source-inventory row by kind plus exact path, URL, or label.
- If an input fingerprint changes, return to intake, update dependent planning artifacts, and regenerate downstream work.
- At successful handoff use `stage: "delivery"`, `status: "complete"`, `resumeFrom: null`, and an empty `blockers` array.
- A blocked state names the smallest owning stage and exact missing artifact or decision.

## QA report minimum

Write `.slideblocks/qa-report.md` with these canonical headings. Record `not applicable` plus the reason rather than omitting a surface:

1. **Inspection boundary** — final source/style change boundary, live route, viewport, fonts/assets readiness, and commands used.
2. **Rendered states** — exact page IDs and interaction states actually inspected.
3. **Aesthetic review and repairs** — rendered critique, independent finished-deck observations when available, concrete failed pages and reasons, repairs performed, and rechecked results. Do not add a score or a second review artifact.
4. **Visual evidence review** — selected slot-to-render observations, source/credit and truth-boundary checks, crop/chart/diagram/quotation treatment, static-state result, repeated-carrier warnings, the highest-impact evidence repair, and the rechecked result. For every required primary slot include one exact line `P<NN>.<slot-id> — carrier-only: PASS — <what remained identifiable with surrounding narrative removed>`. A missing or failed final carrier-only observation blocks completion. Record `not applicable — no selected visual-evidence slots` when appropriate rather than inventing evidence.
5. **Deck composition review** — required for a schema-version-2 lock: final contact sheet, planned-versus-rendered page and adjacent-pair observations, material problems found, repairs when needed, and rechecked results. A legacy v1 project may record `not applicable — legacy v1 lock` rather than inventing evidence.
6. **Reduced motion** — tested route/state and observed result.
7. **Print and export** — generated artifact, page order/count, clipping, fonts, backgrounds, and static-state result.
8. **Offline playback** — copied `file://` path, navigation/interactions, console, network, local fonts, and media result.
9. **Limitations and deferred items** — skipped checks, placeholders, explicit asset-use blockers, and known limitations.

A build receipt does not prove these observations. The deterministic validator may check evidence-plan, source-map, composition-binding, and lock agreement, but it does not prove the rendered evidence review. A QA report does not replace deterministic validation.
