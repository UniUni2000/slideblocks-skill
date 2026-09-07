# Deck Composition Director

Use this reference when creating a complete Deck with three or more published pages, or when redesigning an existing Deck as a whole. After the narrative and page-purpose roster are clear, it first keeps one content-fit visual direction coherent across page-group planning. Later it coordinates Page Briefs, the Visual Evidence Plan, gated candidate decisions, preview-derived signatures, and one final composition plan before individual pages are implemented.

Do not invoke it for an isolated one- or two-page edit. Preserve that Deck's existing strategy and limit the edit to the requested pages. If an isolated edit reveals a deck-wide composition problem, report it separately rather than silently redesigning neighboring pages.

## Keep one composition authority

`.slideblocks/page-plan.md` is the human-readable authority for deck composition. Do not create a parallel `design_spec`, media plan, layout inventory, or second outline. Keep four ordered records in that one file:

1. **Page Briefs before discovery** — the exact roster plus a purpose-led, flexible brief for every page. Record only the content, material, research, presenter support, density, visual lead, asset, sequence, or static-state guidance that page needs. File-backed page-group planning may expand these briefs, but it does not create a fifth composition record. Do not assign a normalized `topology`, `axis`, `primaryZone`, family, preview signature, or adjacent-page solution yet.
2. **Visual Evidence Plan before Registry selection** — use the exact `## Visual Evidence Plan` JSON contract in `project-contract.md` and the four option gates in `visual-evidence-director.md`. It owns page evidence demand, primary/support slots, selected source-map refs, and honest text-led reasons without assigning canvas zones.
3. **Registry Candidate Decisions after discovery** — use the exact `## Registry Candidate Decisions` JSON contract in `project-contract.md` and the gate meanings in `block-selection.md`. It owns candidate IDs, source, gate results, grammar fit, signature status, `signatureEvidence`, decision, and reason; do not duplicate that schema here.
4. **Deck Composition Plan after selection** — once every page has a selected Registry or custom candidate, bind selected Evidence Slots to final canvas roles, lock the whole-sequence composition, and derive `execution-lock.json.composition` from it.

Selection history stays in the Visual Evidence Plan and Registry Candidate Decisions. The execution lock contains only selected live evidence, a same-slot fallback explicitly activated for static delivery, selected Artifact coordinates, and the final normalized composition anchors; it never contains other alternates, fallbacks, rejected candidates, or search history.

The final Deck Composition Plan must contain:

- `families`: a small legend of the structural families the Deck actually uses;
- `continuityAnchors`: the recurring alignment, typography, color, image treatment, spacing, or safe-area relationships that keep different page structures in one visual grammar;
- `densityRhythm`: the ordered `anchor`, `balanced`, and `dense` sequence, including the intended evidence peak and recovery beats;
- one `pages` entry for every stable page ID in the exact slide roster.

Write `continuityAnchors` and `densityRhythm` as concise human-readable direction. In the same section, include exactly one fenced `json` object containing `families` and `pages`; this is the parseable composition contract from which `execution-lock.json.composition` is derived after candidate selection. For example:

Alignment, typography, image treatment, shared safe-area edges, gutters, and intentional whitespace may be continuity anchors. A visible logo, page number, progress rail, header, footer, frame, or repeated line belongs only when the presentation context gives it a real identity, orientation, navigation, state, or understanding job.

```json
{
  "families": {
    "F01": { "topology": "split", "axis": "horizontal", "primaryZone": "right" }
  },
  "pages": {
    "P01": {
      "family": "F01",
      "density": "balanced",
      "canvas": [
        {
          "zone": "right",
          "role": "primary",
          "purpose": "Right two-thirds carry the campus image and the first visual entry.",
          "evidence": [
            {
              "slot": "P01.campus-reality",
              "refs": ["A01"],
              "treatment": "Preserve the building silhouette and the official credit; crop only excess sky.",
              "static": "same"
            }
          ]
        },
        { "zone": "left", "role": "support", "purpose": "Left column carries the claim and two evidence points." },
        { "zone": "center", "role": "negative-space", "purpose": "Center gutter separates identity from evidence and protects the reading order." }
      ]
    }
  }
}
```

Define each expanded triplet once in `families` and use its ID on each page. A reader and the validator must be able to resolve every page to `topology`, `axis`, and `primaryZone` without inference. The family ID is a reference, not a substitute for the structural definition. Keep explanatory prose outside the JSON; the JSON must remain parseable and data-equivalent to the lock projection.

### Family

Use these normalized values:

- `topology`: `field`, `split`, `stack`, `sequence`, `matrix`, `single-focus`, or `custom`;
- `axis`: `horizontal`, `vertical`, `radial`, or `none`;
- `primaryZone`: `left`, `right`, `top`, `bottom`, `center`, or `full`.

Choose topology from the page's actual large-scale geometry:

- `field` distributes meaningful elements across the canvas without a dominant row, column, or cluster;
- `split` uses two major regions across a horizontal or vertical division;
- `stack` uses parallel bands or layers that are read as grouped strata rather than a progression;
- `sequence` expresses ordered movement such as a timeline, process, or staged argument;
- `matrix` organizes repeated evidence through rows and columns;
- `single-focus` gives one statement, object, quotation, or visual a dominant cluster;
- `custom` is a last resort when none of the normalized structures describes the geometry. Explain the mismatch in the page notes; do not invent a new topology label.

Use lowercase normalized values in the plan. Decorative names such as `hero-split`, `editorial-duo`, or `evidence-wall` may appear as descriptive notes, but they do not replace the normalized family.

### Density

Density describes evidence throughput and audience effort, not word count, DOM-node count, or pixel occupancy:

- `anchor`: one dominant idea or visual with deliberately limited supporting evidence;
- `balanced`: a normal explanatory page with a clear lead and a bounded supporting layer;
- `dense`: an intentional evidence peak such as a comparison, matrix, technical diagram, or metric set that remains readable at presentation distance.

A dense page is not permission to shrink type. An anchor page may use broad open canvas when that strengthens focus, scale, pacing, or recognition. Use `densityRhythm` as human direction for peaks and recovery beats, not an occupancy target.

### Canvas roles

Map only materially active or intentionally reserved canvas regions. Do not divide the slide into boxes merely to account for every quiet area:

- `zone`: use one coarse location from `top-left`, `top`, `top-right`, `left`, `center`, `right`, `bottom-left`, `bottom`, `bottom-right`, or `full`. This is a planning anchor, not a pixel grid; use `full` for a true full-canvas field or visual rather than to avoid naming a dominant region.

- `primary`: the dominant visual entry and message-bearing region; every page needs at least one;
- `support`: evidence, annotation, explanation, navigation, or a secondary visual that helps the primary region;
- `continuity`: a recurring deck-level anchor whose purpose is consistency across otherwise different structures;
- `negative-space`: an intentionally empty region that creates focus, separation, pacing, contrast, or room for a defined live state.

Write a concrete `purpose` for every recorded role in the page plan. Include location and communication job when they are not obvious. `negative-space` is optional and should be recorded only when a deliberately reserved area materially controls focus, separation, pacing, contrast, or a live state; ordinary uncluttered canvas does not need its empty areas itemized.

When a canvas role carries selected visual evidence, add its `evidence` array using the exact binding contract in `project-contract.md` and `visual-evidence-director.md`. Every selected slot appears in at least one binding; its `refs` exactly match the selected option. Bind primary slots to primary canvas roles. Bind support slots to support, or to primary only when they are intentionally integrated into one visual system. Continuity and negative-space entries may omit `evidence` and cannot satisfy a selected slot.

## Filter candidates before composing the sequence

Use this observable order for every complete-Deck route:

1. `page-brief`
2. `visual-evidence-plan`
3. `semantic-gate`
4. `evidence-capacity-gate`
5. `selected-assets-gate`
6. `delivery-gate`
7. `preview-signature`
8. `grammar-fit`
9. `sequence-tie-break`
10. `final-composition-and-evidence-binding`

The Visual Evidence Plan applies evidence fit, truth fit, explicit usage blocks, and technical readiness before Block ranking. A `rights-review` state alone remains usable for ordinary presentation work. The Block gates are defined in `block-selection.md`; record their results in the canonical Candidate Decisions object from `project-contract.md`. Reject a candidate as soon as a required gate fails. Its signature stays `unknown`, `signatureEvidence` stays `null`, and its reason names the decisive failed gate. Do not inspect or label a rejected preview merely to earn a more varied silhouette.

Always include a custom page as a real candidate rather than a fallback of shame. It must pass the same semantic responsibility, selected-evidence capacity, real-asset, truth-fit, explicit-use, technical, and delivery reasoning as a Registry candidate. A custom candidate may win one page or the entire Deck when it gives the strongest honest answer.

Only after a candidate survives the gates may composition evidence enter the decision:

- For a Registry candidate, inspect the actual public or local preview and its complete relevant state. A `known` signature requires non-empty `signatureEvidence` naming that inspected preview; metadata labels or an Artifact ID alone are not visual evidence.
- For a custom candidate, make one bounded composition sketch or thumbnail identified as `custom-plan:P<NN>`. It may receive a `known` signature only when that exact page-scoped plan exists and is named in `signatureEvidence`; a selected custom candidate must meet this condition.
- When no trustworthy preview or custom plan exists, keep the signature `unknown`. Do not use it as geometry evidence; a deliverable Registry candidate may still win on the stronger content, material, and visual-grammar fit.
- Normalize the observed large-scale geometry as `topology/axis/primaryZone`; do not infer it from a Block title, category, color, or card count.

Choose the strongest candidate sequence lexicographically: semantic responsibility and selected-evidence capacity, then real selected-asset readiness, then a clear Web-native understanding gain when the Page Brief benefits from one, then `grammarFit`, and finally fit with the page's actual role in the ordered sequence. Delivery must pass. Do not reward motion, interaction, execution, or a different silhouette merely for existing, and never sacrifice a stronger page answer to manufacture variety.

Review the surviving page choices as one ordered candidate set. A selected Block contributes page-local material and one inspected composition possibility; it does not own the Deck's grid, title rail, canvas split, or neighboring pages. Reusing one Block on several pages does not authorize copying its preview geometry everywhere. Evaluate every assignment against its own Page Brief. Surface adaptation may change tokens and styling, but if the required geometry changes the normalized triplet, replace that assignment with a custom candidate backed by `custom-plan:P<NN>` evidence before selection is finalized.

If a uniquely stronger semantic candidate repeats a neighboring structure, keep the stronger answer. Repetition is appropriate when the content relationship repeats or stable geometry helps the audience compare or follow a sequence; change the composition only when the content or emphasis calls for it.

After the complete selected set is known, write the final Deck Composition Plan, bind all selected Evidence Slots, review the whole-sequence composition and density rhythm, and then derive the execution lock. Every selected known candidate signature must equal the final family assigned to its page. If later work requires a different triplet, replace the assignment with a custom candidate, add `custom-plan:P<NN>` evidence, re-run the candidate sequence decision, then update the final plan and lock; never rewrite the original preview evidence after the fact. If a visual carrier changes, repair the Visual Evidence Plan and all affected candidate, composition, and lock projections before layout continues.

### Anti-gaming forward-test contract

| ID | Fixture | Required observable result | Must fail when |
| --- | --- | --- | --- |
| AG1 | The highest-variety candidate has the wrong semantic responsibility. | Reject it at `semantic-gate`; keep its signature unknown; select a semantically valid Registry or custom candidate. | Layout novelty rescues or selects the wrong page job. |
| AG2 | A semantically perfect Block requires a factual image or dataset that is absent and does not permit placeholders. | Reject it at the evidence or assets gate; preserve the missing input; select another viable candidate or custom page. | The plan invents the asset, drops the requirement, or binds the Block before the gap is resolved. |
| AG3 | One strong Block is convenient enough to tempt reuse across the full Deck. | Evaluate it independently for every Page Brief; reuse only where it wins, and keep the final Deck grid under the composition plan rather than the Block preview. | Convenience assigns it to weaker-fit pages or makes every page inherit one preview geometry. |
| AG4 | Every Registry candidate fails at least one gate while custom pages survive. | Select custom candidates, retain explicit rejection reasons, and allow `registryArtifacts` to remain empty. | A Registry item is forced into the Deck merely to satisfy reuse. |
| AG5 | Two candidates tie through semantic/evidence fit, real-asset readiness, Web-native understanding gain when relevant, and grammar fit, and both remain deliverable. | Choose the candidate that best serves the page's actual role in the ordered sequence and record that content reason. | A different silhouette wins merely to increase layout variety or a signature is claimed without preview evidence. |

## Normalize and validate structural signatures

For each surviving candidate, derive a preliminary observed signature from its inspected preview or `custom-plan:P<NN>` evidence. After selection, resolve the chosen page family in the final Deck Composition Plan and form its normalized signature as:

```text
topology/axis/primaryZone
```

For example, `split/horizontal/right`, `sequence/horizontal/full`, and `matrix/vertical/full` are three signatures. Family IDs, colors, title positions, card counts, imagery, and decorative motifs are not part of the signature. A selected known candidate's triplet and its final page family must match. A different triplet is a structural rebuild, so represent it as a custom candidate with new `custom-plan:P<NN>` evidence rather than claiming the Registry preview already showed it.

Structural signatures describe observed large-scale geometry; they are not a quality score or a diversity quota. A Deck may repeat one signature when the content relationship repeats, or use several when different pages genuinely need different compositions. Judge the sequence from the rendered contact sheet and the audience experience rather than a required count.

Optional `repetitionIntent` may document why stable geometry helps a finite comparison, progression, demonstration, or source-faithful sequence, but it is never required merely because adjacent pages share a signature. It does not excuse implementation convenience from replacing content-led composition judgment.

## Derive the execution lock

After the gated candidate decisions and final Deck Composition Plan pass planning review, normalize the plan into `execution-lock.json` schema version 2. The lock is an execution anchor, never a second composition authority:

```json
{
  "composition": {
    "families": {
      "F01": { "topology": "split", "axis": "horizontal", "primaryZone": "right" }
    },
    "pages": {
      "P01": {
        "family": "F01",
        "density": "balanced",
        "canvas": [
          {
            "zone": "right",
            "role": "primary",
            "purpose": "Right two-thirds carry the first visual entry.",
            "evidence": [
              {
                "slot": "P01.campus-reality",
                "refs": ["A01"],
                "treatment": "Preserve the building silhouette and official credit; crop only excess sky.",
                "static": "same"
              }
            ]
          },
          { "zone": "left", "role": "support", "purpose": "Left column carries the claim and evidence." },
          { "zone": "center", "role": "negative-space", "purpose": "Center gutter separates the reading paths." }
        ]
      }
    }
  }
}
```

Every `slideOrder` ID must have exactly one `composition.pages` entry, every family reference must resolve, every selected Evidence Slot must retain its exact binding, and unused family definitions should be removed. Regenerate the lock from the page plan when composition or evidence intent changes; do not edit the lock merely to make validation pass. Keep only selected executable evidence under `requiredAssets` as defined in `project-contract.md`.

## Treat render analysis as warnings, not taste scores

After a complete render, compare observed geometry with the plan. DOM measurements, image occupancy, and blank-region detection may raise warnings for:

- the dominant visual entry landing outside the planned `primaryZone`;
- a planned primary or support role rendering empty, weak, or visually subordinate to decoration;
- a selected Evidence Slot missing from the rendered canvas, using different refs, losing its source or qualifier, or becoming subordinate to decoration;
- a documentary image, chart, diagram, document fragment, or quotation whose crop, labels, units, context, or credit changes the planned truth boundary;
- an open or crowded region that disrupts the intended focus, balance, pacing, or reading order when judged in the rendered page;
- declared density differing materially from the actual evidence load;
- pages with different signatures rendering as substantially the same geometry;
- repeated pages losing the progression named by `repetitionIntent`;
- a continuity anchor disappearing, moving arbitrarily, or competing with the primary region.

These detectors are diagnostic warnings, not an aesthetic score and not proof of failure. Do not reject a page merely because its occupancy is low, and do not approve it because it reaches a numeric fill ratio. Inspect the rendered pixels, decide whether the space and hierarchy serve the communication job, then repair the page plan or implementation at the owning layer.

Missing contract fields and unresolved family references remain deterministic planning errors. Composition quality, repetition, open space, and rhythm remain render-time visual judgments.

## Run contact-sheet plan-versus-render QA

After the first complete Deck render, generate an ordered contact sheet labeled with stable page IDs. Review the entire sequence and the adjacent groups that form real narrative sections before judging pages only at full size.

Record a concise plan-versus-render comparison for every page:

| Page | Planned signature | Observed structure and visual entry | Planned/observed density | Selected evidence and canvas roles realized | Repair or accepted reason |
| --- | --- | --- | --- | --- | --- |

Use the contact sheet to check adjacent silhouettes, density peaks and recovery, continuity anchors, and whether covers, section pages, evidence peaks, and closings fulfill their actual jobs. Then inspect representative full-size pages to judge typography, evidence legibility, and the purpose of negative space; thumbnails cannot prove those details.

When the contact-sheet review finds a material deck-level composition problem, repair it, render again, and update the comparison with observed evidence. If the intended composition itself changed, update the page plan first and regenerate the lock. Do not invent a failure merely to demonstrate iteration, and do not declare QA complete with an unexplained plan-versus-render mismatch.

## Use signatures only to describe geometry

Normalize from observed large-scale geometry, not decorative names, colors, title positions, card counts, or motifs. A signature exists to keep the selected candidate, page plan, execution lock, and rendered structure aligned; it does not prove craft, originality, or appropriate variety. Judge those qualities from the content and rendered Deck.
