# Block Selection

Read this reference after defining the story and exact page roster. On a schema-version-2 composition-directed full Deck, first complete the pre-Registry Page Briefs and canonical Visual Evidence Plan. Search the live public Catalog first when available; use `registry-index.md` only as an offline or unavailable-service snapshot. Do not lock final composition families before inspecting viable candidates and their real previews.

## Assign one primary page responsibility

Give every slide one primary responsibility. Add a secondary responsibility only when it does not weaken the primary one.

| Responsibility | Communication job | Typical evidence |
| --- | --- | --- |
| Opening | Establish the subject, thesis, and reason to listen. | One claim, image, or short evidence path |
| Problem | Make the gap, failure, risk, or unresolved question concrete. | Symptom, constraint, incident, or before state |
| Evidence | Prove or qualify a claim. | Verified metric, observation, citation, or test |
| Method | Explain how a system, process, model, or experiment works. | Flow, architecture, stages, or mechanism |
| Comparison | Expose a meaningful difference using the same criteria. | Before/after, alternatives, benchmark, or tradeoff |
| Decision | Help the audience choose, approve, or act. | Recommendation, options, criteria, and consequence |
| Result | State the outcome and why it matters. | Measured change, finding, deliverable, or takeaway |
| Closing | Leave one final thought, question, or handoff cue. | Summary claim, invitation, or next step |

Do not select a Block from topic similarity alone. Match the communication job first, then the content shape and interaction needs. When time, state, parameter, audience choice, or real local execution matters, use the lightweight opportunity check in `visual-evidence-director.md` to compare an equally polished static treatment with a Web-native one.

## Write a Page Brief before discovery

For every stable page ID, record one implementation-ready Page Brief in `.slideblocks/page-plan.md` before searching the Catalog. Follow the flexible format in `project-contract.md`: begin with why the page exists, then preserve only the concrete content, material, sources, presenter support, evidence capacity, asset or technical limits, density, visual lead, exclusions, sequence context, and static behavior that page actually needs. When relevant, name why polished static, motion, interaction, or local execution makes the information easiest to understand; keep this as prose rather than a new schema field.

A Page Brief may name a needed visual lead, such as a photograph, timeline, comparison, or diagram, but must not pre-assign the final `topology`, `axis`, `primaryZone`, family ID, or adjacent-page solution. Those decisions require evidence from surviving candidates. A desired silhouette never rescues an Artifact whose responsibility, evidence contract, limits, assets, or explicit usage state do not fit the page.

## Resolve visual evidence before discovery

When `composition-director.md` applies, follow `visual-evidence-director.md` and write the schema-version-2 canonical `## Visual Evidence Plan` immediately after Page Briefs. Give every asset candidate or source-derived visual carrier a stable source-map `A<NN>` ID, apply the evidence-fit gate through `claimSupport` and the carrier-only `independenceTest`, then apply truth fit, explicit usage blocks, and technical readiness in that order. A `rights-review` option remains usable for ordinary presentation work; only `blocked` usage fails. Select exactly one option for every non-empty Evidence Slot. Do not add that plan to a schema-version-1 isolated edit.

Block selection evaluates what is actually selected, not a hypothetical future image or chart. A page may deliberately remain text-led through `evidenceDemand: none`, or through an empty `supporting` plan with a substantive `textLedReason`; do not add decorative imagery merely to make a candidate preview easier to reuse.

## Use an existing Block when

- Match its page responsibility and intended use cases.
- Fit the supplied content within its declared constraints without deleting required evidence.
- Give selected concrete material enough scale and compositional weight to establish its subject or presence when that is part of the page's visual job; a decorative thumbnail or diagram-only substitute does not satisfy that need.
- Survive the semantic, evidence, asset, explicit-use, status, and compatibility gates before visual ranking begins.
- Preserve the Block's data and interaction contract while adapting its surface style to the selected direction.
- Accept its status, compatibility, asset requirements, and any explicit usage block.
- Confirm its preview and prompt still describe the current source.

## Create a custom Slidev page when

- Treat a custom page as a first-class candidate for every Page Brief, not only as a failed-Registry fallback.
- Find no direct Registry match for the primary responsibility.
- Exceed a Block's item, label, region, or interaction constraints.
- Need a comparison, decision, or other content structure the current Registry does not cover directly.
- Distort the story, evidence, or reading order merely to fit an existing Block.
- Need a deck-specific visual or interaction whose reuse value is not yet proven.

Apply `quality-contract.md` and `qa.md` to custom pages. Give a surviving custom candidate a task-local composition plan or preview before deriving a known structural signature and ranking the complete sequence. Do not register a custom page as a reusable Block unless it is separately reviewed and approved.

## Hard rejection before ranking

Reject a candidate before assigning a structural signature when any condition holds:

- its semantic responsibility or evidence relationship does not match the Page Brief;
- its capacity would require deleting, distorting, or making required evidence unreadable;
- it cannot carry every selected Visual Evidence Slot, its qualifiers, source/credit, and complete static state in an honest readable form;
- it turns a required carrier into restated body copy, isolated KPI/name cards, ornamental geometry, or another treatment that cannot pass the slot's carrier-only acceptance test;
- its motion, interaction, or execution is decorative, merely reveals a restatement, or has no concrete information job for the Page Brief;
- a clearly useful Web-native treatment cannot remain complete in live Slidev, the copied `offline.html`, and reduced-motion mode;
- a binding factual or brand asset is unavailable, unapproved, rights-blocked, technically blocked, or cannot use an explicitly approved honest placeholder;
- its status, compatibility, provenance, declared limits, or current preview/prompt agreement is invalid.

Composition and adjacent-page variety are never hard-gate substitutes. When an otherwise valid Artifact's immutable contract cannot be adapted honestly, reject it and retain the custom candidate instead.

## Selection sequence

1. Complete the exact roster and Page Brief for every page; keep final composition unresolved.
2. Write the canonical Visual Evidence Plan. Resolve its selected options from source-map assets before a Block can become selected; keep final canvas zones unresolved.
3. Group the roster into at most three semantic Catalog searches by responsibility, communication job, selected evidence shape, capacity, and applicable scenario. Allow at most 10 seconds per search. If the client is missing or any request fails or times out, stop all remaining live searches; filter `registry-index.md` and record the exact snapshot fallback.
4. Build the task-local candidate pool. Expand a Recipe only through its declared `blockIds` and evaluate those Blocks individually. Treat a Deck only as an end-to-end narrative and visual-grammar reference; do not reinterpret its pages as undeclared Blocks or let its native grid become the project plan. Include a custom candidate for every Page Brief.
5. Apply the hard rejection gates using the Page Brief, selected Evidence Slots, source-map truth fit, real-asset readiness, explicit usage blocks, public metadata, declared constraints, compatibility, and preview/prompt agreement. A `rights-review` status alone is not a rejection. Any candidate with a rejected gate must have `decision: rejected`, `signature: { "status": "unknown" }`, and `signatureEvidence: null`; do not derive or reward its composition.
6. Inspect the real preview of every surviving Registry candidate. Derive `topology`, `axis`, and `primaryZone` from observed large-scale geometry rather than titles, tags, family names, or decorative styling. A known Registry signature must cite the actual public or local preview and the complete static state inspected. A custom candidate may derive a known signature from its task-local composition plan using `custom-plan:P<NN>` as evidence. If evidence is unavailable, record an unknown signature and do not invent one.
7. Record exactly one `## Registry Candidate Decisions` section in `.slideblocks/page-plan.md` using the schema in `project-contract.md`. It contains exactly one fenced `json` object rooted at `pages`; every candidate records `id`, `source`, the four hard-gate outcomes, `grammarFit`, `signature`, `signatureEvidence`, `decision`, and a non-empty reason. Every page has exactly one selected candidate, and `custom` participates under the same contract. A selected custom candidate must have a known signature backed by the exact `custom-plan:P<NN>` evidence for that page.
8. Select the complete page sequence lexicographically, never by adding compensating scores: first semantic responsibility and selected-evidence capacity, then real selected-asset readiness, then a clear Web-native understanding gain when the Page Brief benefits from one, then compatibility with the Deck's visual grammar, and finally fit with the page's actual role in the ordered sequence. Record the expression decision in the existing candidate `reason`; do not add a Candidate Decisions field. A different silhouette is not an advantage by itself, a lower-priority advantage cannot outweigh a higher-priority weakness, and pages are not finalized greedily one at a time.
9. Reuse at least one suitable current Block when a survivor is genuinely stronger than the custom candidate, but do not force Registry coverage. Custom remains eligible at every page and wins whenever the lexicographic comparison supports it.
10. Write the final `## Deck Composition Plan` from the selected combination and bind every selected Evidence Slot to its canvas role. Its family must equal each selected known signature; surface adaptation may change tokens and styling but not silently change the normalized triplet. If a structural rebuild is necessary, represent it as a custom candidate with `custom-plan:P<NN>` evidence, then recheck the whole sequence. Update the Page Brief and Visual Evidence Plan first if discovery changes the communication job, evidence need, selected refs, or treatment.
11. Retrieve the exact published Prompt or source only when implementation needs the selected Artifact; the client handles its signed anonymous delivery context without a login. Use an account Session only for an explicitly restricted feature. Then derive `execution-lock.json` from the final page plan, selected evidence only, and exact Registry coordinates.

Registry Candidate Decisions are task-local planning evidence. They do not belong in `execution-lock.json`, add fields to Registry v2, modify Catalog records, infer undeclared relationships, or change an Artifact's published responsibility, constraints, status, provenance, or source.
