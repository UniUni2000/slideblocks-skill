# Autonomous Deck Workflow

Use this workflow to turn a short request plus arbitrary materials into one complete SlideBlocks deck. Keep the user-facing entry simple while maintaining explicit internal stages, gates, and recovery points.

## Contents

- Select one route internally
- Run the production pipeline
- Resume from the artifact owner

## Select one route internally

| Route | Trigger | Output behavior |
| --- | --- | --- |
| New deck | Topic, desired outcome, or source bundle without an existing Slidev project | Create one isolated runnable Slidev project. |
| Existing Slidev improvement | A runnable Slidev project already exists | Preserve its structure and unrelated work; improve or extend it in place. |
| PowerPoint migration | PPT/PPTX is supplied for migration, redesign, extension, or continuation | Treat the Office file as read-only source and rebuild it in Slidev under the migration contract. |
| Resume | A prior SlideBlocks project contains durable planning state | Validate the persisted artifacts and resume from the owning incomplete or stale stage. |

Do not show this route matrix or ask the user to select a route when the evidence resolves it. Every PPT/PPTX output remains outside the delivery promise; PowerPoint is accepted only as read-only input for a Slidev rebuild or visual reference.

## Run the production pipeline

### 1. Intake and project boundary

- Inspect instructions, working state, materials, available tools, and output location.
- Read `source-intake.md`, normalize the source bundle, and create or update `.slideblocks/source-map.md`.
- Give every reusable visual carrier a stable `A<NN>` row under the canonical `## Reusable assets` table, including source-derived charts, diagrams, quotation treatments, document fragments, generated non-factual material, and honest placeholders.
- Initialize `.slideblocks/workflow-state.json` and record the chosen route without treating it as user confirmation.

### 2. Reconstruct the communication contract

Infer the strongest supported answer from the request and sources for:

- primary audience and what they already know or care about,
- communication objective and intended audience experience or outcome,
- core subject, message, decision ask, or required action as applicable,
- presenter-led, reader-led, hybrid, or self-running use,
- time, page-count, language, brand, and delivery constraints,
- required afterlife such as approval, audit, handoff, archive, or reuse,
- source fidelity, locked content, and permitted research.

Record the result and material assumptions in the page plan. Do not turn these fields into a questionnaire. Interrupt only when unresolved alternatives would materially change the message or when a genuine permission, source, destructive action, external publication, or paid action is required.

### 3. Establish factual sufficiency

- Verify that the corpus can support the desired outcome.
- Before the exact page roster exists, inspect the principal evidence, actual figures, methods or equations, useful comparisons, and limitations when research is permitted. Establish enough depth to decide which questions belong together; page-level enrichment continues later. Do not lock an arbitrary short duration or beginner scope solely from “introduction”.
- Preserve citations and distinguish sourced facts, user-provided assertions, and scenario data.
- Continue with explicit semantic placeholders when a missing item can be represented honestly.

### 4. Author the complete deck strategy

- Write the narrative spine before selecting Blocks.
- Define the exact ordered slide roster after factual and material sufficiency. Give each slide one clear reason to exist, an intended audience experience, the content or material it needs, a relationship to the surrounding sequence, and a static-state requirement. A complete question may need several connected findings on one page; respect any user-locked roster rather than regrouping it.
- Translate every communication objective into an outline obligation. A decision deck must expose the ask, options, criteria, trade-offs, recommendation, and consequence of delay; a report must expose baseline, progress, variance, evidence, risk, ownership, and next steps.
- Derive one content-fit visual thesis and one coherent visual grammar using `design-principles.md` after the narrative and roster are clear but before page-group work begins. Record only the shared decisions that materially guide the Deck; do not create a separate style PRD.
- For a new complete Deck or deck-wide narrative redesign, follow `content-planning.md` after the roster and shared visual direction are stable. Prefer one dedicated owner per information-rich body page, batched within available concurrency. Merge its content and design packet into the canonical Page Briefs without compressing away useful substance, run independent review that can reject an underspecified roster, then edit visible language before visual evidence planning. Keep that owner responsible for exclusive page implementation and rendered repairs after composition is locked; the lead owns shared files and final assembly. Use the same file-backed assignments serially when delegation is unavailable. Do not create a separate page-visual-planning Agent, and do not use this pass for an isolated or source-faithful edit whose narrative is already fixed.
- When `composition-director.md` applies, let it preserve the shared visual direction while preparing purpose-led Page Briefs before Registry discovery. Record only the density, visual lead, asset, or coarse weight-zone guidance a page actually needs; do not assign final structural signatures yet.
- For composition-directed decks of five or more slides, identify two high-risk page roles whose content and material needs exercise the shared visual direction differently after candidate selection.
- Complete Page Briefs in `.slideblocks/page-plan.md`; the same file remains the sole internal design authority as visual evidence, candidate decisions, and final composition are added later, not an approval gate.

### 5. Direct visual evidence before Registry selection on the schema-version-2 full-Deck route

- When `composition-director.md` applies, read `visual-evidence-director.md` and decide `required`, `supporting`, or `none` plus one compatible `evidenceObjective` for every stable page ID. For a schema-version-1 isolated edit, skip this plan and preserve the accepted surrounding evidence/composition contract.
- Write exactly one canonical `## Visual Evidence Plan` after Page Briefs. Define primary/support Evidence Slots from communication needs, not desired image counts or layouts, and give every slot a carrier-only acceptance test.
- Resolve every option to stable source-map `A<NN>` refs. Apply evidence fit first by recording its `claimSupport` and carrier-only `independenceTest`, then apply truth fit, explicit usage blocks, and technical readiness in order; reject at the first failed gate and keep a concrete reason.
- Select exactly one option for every non-empty slot. Selected, alternate, and fallback options must already pass the carrier-only test, have non-blocked usage, be technically ready and non-placeholder, and satisfy the owning primary objective. A `rights-review` status remains usable for ordinary presentation work. `restatement` and `decoration` are always rejected. Do not let illustration, generated non-factual material, a bare KPI/name list, or a placeholder satisfy a required evidence need, and do not add decorative media to a deliberately text-led page.
- Run the lightweight Web-native opportunity check from `visual-evidence-director.md`. Keep its one-sentence result in the existing Page Brief or candidate reason; do not add a plan, schema field, or modality quota.
- Keep canvas zones unresolved. The plan decides what the page must show; Registry Candidate Decisions test what can carry it, and the final Deck Composition Plan decides where it belongs.

### 6. Discover Registry assets after the story and evidence plan are stable

- Search the live public Catalog first when the installed client and network are available. Query by page responsibility, communication job, content shape, and constraints rather than topic alone.
- Keep discovery bounded: group the page roster into at most three semantic searches and allow at most 10 seconds for each one. If the client is absent or any Catalog request fails or times out, stop all remaining live searches, record the exact failure, and use the bundled `registry-index.md` as an offline or unavailable-service fallback. Never represent snapshot fallback as current discovery.
- Inspect Recipe, Deck, and Block candidates in that order when each level is relevant. Snapshot fallback may select an Artifact ID, but exact version/hash/Prompt coordinates require the live Catalog or delivery response; otherwise keep the lock's `registryArtifacts` empty and record the fallback in the page plan.
- Reject semantic responsibility, selected-evidence capacity, real-asset, truth-fit, explicit-use, technical, status, or compatibility failures before considering layout. Infer a structural signature only for survivors whose real public or local preview was inspected; keep unavailable-preview signatures unknown rather than guessing.
- Compare the surviving Registry and custom candidates as complete ordered Deck sequences. Rank lexicographically by semantic responsibility/evidence capacity, selected real-asset readiness, a clear Web-native understanding gain when relevant, visual-grammar fit, and then fit with each page's actual role in the sequence. A different silhouette is not an advantage by itself. Record `## Registry Candidate Decisions`, then finalize `## Deck Composition Plan` and bind every selected Evidence Slot to a canvas role before deriving the execution lock.
- Retrieve an exact published Prompt or source package directly through the client's signed anonymous delivery context. Use optional device login only when the user wants that same published delivery bound to a revocable account Session; do not claim the current CLI grant broadens the published Catalog or exposes private, unlisted, submission, Creator, or administrative capabilities.
- Record inspected, selected, and rejected IDs. Build a custom page when no suitable current Artifact fits; do not bend the story to force Registry coverage.

### 7. Close the selected asset plan

Before broad page production, resolve every required image, chart dataset, product capture, brand asset, font, icon, formula, citation, and explicit usage state to one of:

- ready and locally addressable,
- approved semantic placeholder,
- rights review required but usable for the current draft,
- blocked and genuinely requires user action.

Do not search or invent a replacement during page layout when the Strategist already selected a binding factual or brand asset. Return to this stage instead.

Only selected Visual Evidence Plan options enter live execution. Alternates, unactivated fallbacks, rejected options, search candidates, and rights-blocked assets remain planning history. A single-ref fallback may enter only when the same slot explicitly activates it for static delivery through `static: asset:A<NN>`. If a fallback must be promoted for live use, repair the Visual Evidence Plan, affected candidate decision, composition binding, and lock before continuing.

### 8. Lock and execute

- Create `.slideblocks/execution-lock.json` from the final plan and selected assets. When the composition director applies, new or regenerated locks use schema version 2 and include the normalized composition and selected-evidence projection defined in `project-contract.md`; otherwise preserve the existing schema and surrounding composition. Factual authority remains in the source map and human design authority remains in the page plan.
- Project only selected locally executable visual carriers and explicitly activated static fallbacks into `requiredAssets`. Every Evidence Slot asset includes its stable `id`, existing local `path`, `status: ready`, and exact `provenance: source-map:<Axx>`; unrelated required assets may omit `id`. Keep canvas binding refs data-equivalent to the selected option, and require any distinct `static: asset:A<NN>` to be the sole ref of the same slot's explicit fallback.
- The implementation may condense, reflow, regroup, or visually translate material within one page, but must preserve its core message, audience move, evidence, qualifiers, and literal requirements.
- For composition-directed decks of five or more slides, stabilize the visual grammar on two high-risk pages with different content and material needs, silently review and repair real defects, then produce the remaining pages in narrative order. For shorter decks, implement and review the complete roster directly.
- Treat each finished slide as a Block-quality page even when it is custom: one semantic job, one dominant entry point, explicit content relationships, editable source, and complete live/reduced-motion/static states.

### 9. Review and repair

- Run the real deck and complete the aesthetic critique before geometric QA.
- Inspect the full sequence plus representative interaction states. For every non-static behavior, confirm that it performs the recorded information job in live Slidev and the copied `offline.html`; remove it when an equally clear static treatment exists. Review selected evidence at full size for truth boundary, crop, labels, units, context, credits, planned canvas role, and complete static treatment. For every required primary slot, remove surrounding title/body copy and require the carrier plus its intrinsic labels/caption/source to pass the recorded acceptance test. When this review finds a material concept, evidence, brand, hierarchy, craft, originality, typography, collision, motion, or export defect, repair the highest-impact one and rerun the affected checks.
- When independent delegation is available for a complete Deck, give the final rendered sequence and contact sheet to a reviewer that did not plan or implement it. It judges the result as an audience member and returns only concrete failed page IDs and reasons. The failures defined in `qa.md`, including repeated translated titles, purposeless labels, leaked internal identifiers, and competing navigation systems, block approval until the affected pages are repaired and rerendered. Do not use a score or layout quota, and do not invent a change when the review finds none.
- Write `.slideblocks/qa-report.md` from actual observations. Do not fabricate browser, reduced-motion, print, export, or offline evidence.

### 10. Postflight and handoff

- Regenerate every derived artifact after the final source or style change.
- Produce and verify `offline.html`, any explicitly requested non-Office exports, `.slideblocks/build-result.json`, and the bilingual README.
- Run the structural validator only after the project contract reflects the finished deck.
- Mark `workflow-state.json` complete only when all required delivery gates pass. Report blockers and limitations instead of forcing a green state.

## Resume from the artifact owner

| Problem | Resume point |
| --- | --- |
| New, unread, conflicting, or changed source | Intake and source-map repair |
| Unsupported claim or missing evidence | Factual sufficiency and page-plan repair |
| Weak story, missing page job, wrong slide order, shallow page substance, vague material direction, or an unusable page-level visual solution | Deck strategy and the affected page-group planning packet |
| Wrong evidence demand, unsuitable selected carrier, truth/use/technical change, or missing `A<NN>` ref | Visual Evidence Plan and source-map repair |
| Content-inappropriate repetition, accidental empty canvas, or weak sequence rhythm | Deck Composition Plan, then the affected high-risk pages according to their content and material needs |
| Registry mismatch or stale coordinates | Registry discovery and execution-lock refresh |
| Missing selected image, font, dataset, brand asset, or explicit usage decision | Selected asset plan; promote a fallback only through the Visual Evidence Plan |
| Layout, copy-fit, interaction, or implementation defect | Current slide execution |
| Concept, brand, or deck-wide visual-system weakness | Visual thesis and Deck Composition Plan, then affected pages |
| Selected evidence is unbound, substituted, misleading, clipped, or incomplete in static output | Visual Evidence Plan when the choice changed; otherwise composition binding or page implementation |
| QA failure | Repair owning source and rerun the affected QA surface |
| Stale or failed offline/export artifact | Rebuild from the current editable source; do not patch the derived output |

Do not restart completed upstream work unless its owning source changed. Persisted artifacts replace conversational memory when resuming in a fresh context.
