# Multi-Agent Page Planning

Use this reference for a new complete Deck or a deck-wide narrative redesign. Its purpose is to overcome one-response planning limits while giving each page only the content depth, material work, and visual thought its purpose needs. The existing content-planning workers become page-group planners: the same planner owns both page substance and its page-level visual solution. Do not create a separate page-visual-planning Agent, visual PRD, schema, or approval step. Skip it for an isolated page edit, a purely visual repair, or a source-faithful migration whose accepted story must remain unchanged.

## Establish one shared frame

The lead Agent first records the communication contract, source boundary, and provisional audience questions in `.slideblocks/page-plan.md`. Before fixing page count, inspect enough actual research and visual material to understand the main findings, how they were obtained, useful comparisons or equations, and limits. Bounded research scouts may investigate separate questions; they do not invent separate Deck outlines. Do not interpret an unspecified “introduction” as a short beginner talk or move substantive explanation to notes to meet an invented duration.

Group the material into complete, explainable questions, then record the narrative spine and exact ordered `P<NN>` roster. A body page may combine related results, method, comparison, and qualification when that makes the explanation easier to follow. If a proposed page contains only a figure and a small claim, check for missing explanation or combine it with related material; do not add filler or split a coherent explanation merely to increase page count. Explicit page-count, order, source-fidelity, and independent-page constraints override regrouping. Every page needs a clear reason to exist, but it does not need to prove a claim or carry the same amount of research as its neighbors.

Once the content is clear enough to judge fit, the visual director derives one unified direction from the audience, subject, materials, narrative, and viewing context. Record only the decisions that materially guide the Deck, including its continuous-canvas logic and the contextual use of boundaries or page furniture. Do not create a separate style PRD or a menu of alternatives. This direction guides page-group work; final Registry choice and normalized composition remain downstream decisions.

Split that roster into coherent, non-overlapping assignments. Prefer one dedicated owner per information-rich body page; covers and concise closing pages may share an owner. Batch assignments within available concurrency rather than reducing page depth to fit the worker limit. Each owner is the page's content and design planner and remains responsible through rendered repair. Give every worker:

- the shared communication contract and narrative spine,
- the unified content-fit visual direction,
- its exact page IDs and responsibilities for both content and page-level visual solution,
- a short summary of the preceding and following page groups,
- `.slideblocks/source-map.md` and the permitted research boundary,
- one exclusive output path under `.slideblocks/work/page-groups/`.

Workers may read the complete source bundle, but they write only their assigned page-group file during planning. They do not concurrently edit `source-map.md`, `page-plan.md`, or `execution-lock.json`. After the lead merges the accepted plan and locks composition, it can assign that owner exclusive page component and asset files for implementation. Shared styles, entrypoint assembly, source-map adoption, lock updates, and final build/export remain lead-owned. Return full-size rendered pages to their owners for inspection and repair; a written brief alone does not complete page ownership.

## Develop pages according to their purpose

Begin each assigned page with why it exists and what the audience should see, understand, feel, compare, or do. Then develop both the substance and a concrete page-level visual solution: its dominant visual entry, intended hierarchy or relationship, likely carrier and material, relative emphasis, use of the canvas, presenter support, sequence context, and complete static behavior. Add only what is needed to realize that purpose.

- A cover, transition, quotation, or single-object showcase may be naturally concise.
- A difficult explanation, comparison, decision, or evidence-heavy page may need substantially deeper research and material discovery.
- Search for material whenever it would improve the assigned page, subject to explicit user or source restrictions. Preserve traceable support and honest qualifiers when the page makes factual claims; do not fabricate a plausible carrier.
- Keep visible wording, presenter explanation, appendix detail, interaction, and static behavior distinct when that distinction helps the page. Do not force all of them into every brief.
- Keep the decisive evidence, necessary model relationship, and material interpretation boundary on the canvas. Notes expand the explanation; they must not conceal the substance behind a sparse page. Combine real figures, custom explanation and mathematics when they do different useful jobs, without requiring every medium on every page.
- When a page's primary explanation is a process, architecture, relationship, structure, or scientific plot, follow `diagram-direction.md` while proposing its visual solution.
- Plan diagrams and images with the page, not after reserving an arbitrary empty box. For a diagram, describe what the audience should recognize first, the relationship to show, useful icons (or none), the shared visual style, and a plausible position, orientation, and space alongside the other material. Think of the clearest drawing before considering a renderer's defaults; then check that it can actually be made. Keep this reasoning in the existing Page Brief, not a new form. Position and size are proposals until the page composition is locked.
- For conceptual diagrams, default to image-first hybrid assembly and separate asset appearance from editable labels, formulas and relationships in that same Page Brief. Follow the hybrid object workflow in `diagram-direction.md`: specify the needed assets, style, approximate space and connector landing regions; generate or acquire those assets before locking composition, inspect them at proposed page size, and adjust the layout to their actual visible shapes. A complete generated diagram draft is optional, not a prerequisite for generating object assets. Mermaid remains an optional simple-relationship treatment.

Use the flexible Page Brief guidance in `project-contract.md`. Do not impose a word count, fixed field set, evidence quota, or equal research budget. A page is ready when its purpose can be realized with specific content and material rather than generic future intent.

The page-level visual solution is a content-led proposal inside the shared direction, not final composition approval. It does not lock a Registry Artifact, normalized family, `topology`, `axis`, `primaryZone`, evidence canvas zone, exact geometry, or adjacent-page composition. The visual director still owns diagram composition, and final candidate and Deck Composition decisions remain downstream.

## Integrate without compressing away the work

After every page group finishes, the lead Agent:

1. reads every work packet and adopts accepted sources and reusable assets into `.slideblocks/source-map.md`;
2. resolves factual conflicts, duplicate page jobs, inconsistent terminology, and broken transitions;
3. merges the detailed briefs in roster order under the single canonical `## Page Briefs` section of `.slideblocks/page-plan.md`;
4. preserves useful explanations, sources, material candidates, page-level visual reasoning, presenter notes, and qualifiers instead of replacing them with a short summary.

The work packets are non-authoritative planning inputs. `.slideblocks/page-plan.md` remains the only human-readable design authority. If an input, source boundary, page responsibility, or page order changes, repair the affected work packet and merge it again before continuing downstream. After the merged plan passes review, remove only the current run's known page-group packets; never delete or overwrite uncertain pre-existing work.

## Review once, then repair only failed pages

When independent delegation is available, assign a reviewer that did not author the page groups. It checks whether every page's recorded purpose is supported by concrete enough content and material, whether its proposed visual solution can realize that purpose inside the shared direction, and whether factual claims retain traceable support or an honest gap. Challenge the frame itself: an internally consistent but shallow roster fails when it omits the main evidence, how results were obtained, or important limitations required by the audience question. It also checks the complete sequence for duplication, contradiction, fragmented explanations, and drift from the shared frame and visual direction.

The reviewer returns only failed page IDs with concrete reasons. Run one targeted repair pass for those pages, merge the repairs, and recheck the affected sequence. Do not restart research for passing pages or loop for stylistic preference. If a factual need remains unavailable, qualify the claim or keep the honest placeholder and record the limitation.

If the host cannot delegate, create the same disjoint work packets serially and run the same review as an explicit self-review. Do not claim that the result received independent review. The file-backed packets still prevent one short response from becoming the entire planning budget.

## Edit visible language after the plan is stable

After the merged plan passes page-group review and before implementation, run one lightweight presentation-copy edit across the proposed titles, labels, and other visible wording already present in the Page Briefs. Use a separate Agent when delegation is available; otherwise make it an explicit pass.

The editor writes in the natural register of this presenter addressing this audience. Prefer precise keywords, short phrases, ordinary bullets and sub-bullets; sentence fragments are welcome when the subject, relation, units, and qualifiers remain clear. Remove internal planning labels, unnatural translation-like compression, filler, and reusable assistant prose while preserving facts, source meaning, necessary uncertainty, and the deeper presenter layer. Also remove literal or near-literal second-language title duplicates and generic kicker text unless they perform a distinct audience job. It does not add a new file, schema, or approval step, and it does not flatten research detail merely to shorten the screen copy.
