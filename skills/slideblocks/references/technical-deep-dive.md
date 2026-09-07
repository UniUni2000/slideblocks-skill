# Technical Deep Dive

Use this reference when the Deck's main job is to help a technical audience understand how one concrete system, algorithm, implementation, or optimization works, why it behaves that way, and what evidence supports its use. It can guide a developer conference talk, engineering knowledge-sharing session, advanced technical enablement, architecture or algorithm walkthrough, performance case study, or research-to-implementation presentation.

Do not use it merely because the topic is technical or the materials contain code, formulas, diagrams, or charts. Use `systemic-technical-briefing.md` when the audience primarily needs a broad domain overview, relationship model, capability view, or direction. Prefer another direction for a product reveal, sales presentation, project status, incident review, beginner overview, or procedural manual whose main job is completing steps rather than understanding a mechanism.

When a broader Deck contains one genuine deep-dive section, apply this guidance to that section without replacing the Deck's overall communication contract or visual grammar. This reference does not create a style profile, fixed teaching sequence, required evidence chain, page-count target, schema field, media quota, or scoring system.

## Desired result

Aim for a presentation that feels technically rigorous, teachable, traceable, and well paced.

- Let the audience build and reuse a stable mental model instead of decoding a new picture on every page.
- Let depth unfold across time when that improves understanding. A sequence of simple, connected states can carry more useful information than one compressed overview.
- Treat the real technical object—code, data movement, memory layout, algorithm state, formula, execution path, or benchmark—as potential primary visual evidence rather than surrounding it with generic technology imagery.
- Infer the audience's necessary starting knowledge and establish only the prerequisites the explanation actually needs. Do not dilute precise terminology, but do not assume an unstated model the audience must already hold.
- Derive palette, typography, background, material treatment, and identity from the subject, brand, audience, and venue. Do not treat one vendor conference skin as the genre.

When several talks are bundled into one event artifact, keep the event cover, schedule, speaker dividers, and discussion logistics as a lightweight shell. Preserve a restrained shared identity while allowing each session to follow its own teaching object; do not invent one false narrative across unrelated sessions or let event chrome crowd the technical pages.

## Build a traceable explanation

Choose the technical object the audience must be able to reason about: for example a pipeline, memory hierarchy, data structure, model component, code path, algorithm state, or performance trade-off. Keep that object recognizable through the explanation.

Use the shortest causal path the subject requires. Useful links can include the problem or constraint, a working model, the bottleneck or trade-off, an implementation choice, an observed result, and an applicability limit. Include, omit, or reorder them according to the real explanation; do not turn them into a mandatory page sequence.

When adjacent pages or Slidev states continue the same explanation:

- keep stable objects in stable positions and preserve the meaning of colors, shapes, labels, and boundaries;
- make the current delta visible through local emphasis, direct annotation, or a changed state that the audience can identify quickly;
- change one meaningful reasoning step at a time instead of redrawing the complete model or advancing several hidden operations at once;
- retain enough prior context for the audience to understand what changed without relying on the presenter's memory alone.

The presenter should be able to trace a short visible path through each state. Repetition is useful when it preserves the mental map and exposes a meaningful delta; it is waste when the pixels repeat without a new understanding gain.

## Make technical evidence legible

- **Code and commands:** Show only the scope needed for the current reasoning step. Prefer real, syntax-highlighted text; when a source screenshot is itself evidence, crop it to useful scale. Use a small number of local highlights and nearby explanations to show what changes, why it matters, and where it connects to execution or output. Put complete files, long commands, and copyable reference material in notes, appendix pages, or linked resources.
- **Formulas:** Typeset them correctly, define unfamiliar symbols at the point of use, and connect the mathematical object to the structure, variable behavior, implementation choice, or measured result it controls. A formula must not function as a prestige signal.
- **Mechanism diagrams:** Encode real operations, state, data movement, memory, control, dependency, or contention. Use direct labels and stable semantics; avoid generic box-and-arrow architecture that could be swapped into an unrelated talk.
- **Benchmarks:** State the comparison question and preserve the baseline, metric, unit, direction of improvement, and enough workload, hardware, software, precision, batch, or dataset conditions to interpret the result. Make the winner, breakpoint, regression, or trade-off visible when the evidence supports one. Never invent missing measurements or imply that one test proves a universal result.

Code, formulas, diagrams, and benchmarks may appear in any useful combination. They belong together only when they advance the same explanation; do not assemble them as a collage to signal expertise.

## Pace the depth

Use an orientation or section reset when the teaching object, abstraction level, or question changes materially. Repeated agenda pages are optional; a concise statement of the current question can restore orientation more effectively than replaying a full table of contents.

Allow low-density pages when they isolate one algorithm step, state transition, or decision. Follow a dense technical sequence with a usable synthesis—what changed, why it worked, when to use it, or where it stops applying—where the audience would otherwise lose the point. Do not create empty interstitials merely to manufacture rhythm.

Use motion, progressive emphasis, interaction, or local execution only when it materially improves causal understanding. The initial, complete static, reduced-motion, print, offline, and requested export states must preserve the essential model, state sequence, labels, and conclusion without depending on hover, autoplay, or presenter-only narration.

## Final rendered checks

The following failures block approval:

- required code, formulas, diagram labels, benchmark legends, axes, conditions, or annotations are not legible at the intended viewing distance;
- consecutive states change geometry or visual encoding so much that the audience cannot tell what stayed stable and what changed;
- a state repeats without a discernible reasoning delta, or advances a critical operation that is visible only in motion or narration;
- an implementation or mechanism claim is unsupported, technically misleading, or presented with invented detail;
- a benchmark lacks enough baseline, metric, unit, direction, or test context to support the stated interpretation;
- a technical artifact functions mainly as complexity texture and could be replaced by unrelated code, formulas, diagrams, or charts without changing the argument;
- the event or brand shell receives more visual authority than the technical object being taught.

During aesthetic review, also ask:

- What usable mental model should the audience retain, and does the sequence keep it recognizable?
- Can the presenter point to the current cause, change, and consequence without searching the page?
- Do implementation details and performance evidence close the same reasoning loop rather than creating parallel stories?
- Is complexity unfolding because the subject requires it, or because the Deck failed to choose a focus?

Treat these questions as rendered judgment, not a score, artifact count, code-line limit, state quota, or mandatory title formula. Repair the highest-impact failed explanation and recheck it in the complete session sequence.
