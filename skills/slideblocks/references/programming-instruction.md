# Programming Instruction

Use when learners need to read code, predict behavior, explain why it occurs, debug a misconception, or transfer a concept to a small program. This covers introductory and advanced lessons whose main job is learning to reason with code. It does not prescribe a curriculum, page roster, research argument or one visual skin. An expert optimization/implementation talk may instead use `technical-deep-dive.md`; a project checkpoint remains a progress report.

## Teach the behavior, not just the definition

Infer the prerequisites from the request and establish only what the example needs. Keep one small, real program or recognizable set of objects through the causal explanation. Show enough source to locate the binding, operation, condition or return value under discussion. Connect a predicted or observed result to the exact inputs and operation that produce it, rather than displaying isolated giant output numerals.

Use a simultaneous table or aligned comparison when learners must compare alternatives; use stable successive states when they must trace an execution. A question, example, explanation, counterexample and exercise are useful choices, not required page roles. A pure-text page can explain a definition or condition. Do not add decorative diagrams, photographs, formulas or interaction just to signal technical sophistication.

Distinguish demonstration from learner practice. In a prediction or independent exercise, start with the question/code and reveal the answer later; a complete handout is the final/static state, not a requirement to expose answers immediately in live playback. If an API outside the stated prerequisites is necessary, explain its relevant operation next to the example.

Choose visual expression separately through `style-profiles.md`. For a teacher-led source/text walkthrough with no stronger template or style instruction, load [Classroom / Handout visual direction](classroom-handout-visuals.md). A supplied dark brand, accepted deck or applicable taste can override that recommendation without changing the learning job.

## Use Slidev's teaching primitives

Prefer native Markdown/region imports and Slidev's existing Shiki highlighting for source. Do not build a regex tokenizer, a Vue code-display system or a custom click-state engine merely to color or progressively emphasize code. Keep runnable examples as real local files; import the same source into the slide and execution path where feasible. Custom components are appropriate for an actual interactive program, not as a replacement for native source rendering.

Choose the primitive from the reasoning step:

| The learner needs to… | Native treatment |
| --- | --- |
| Follow operations or compare a small change in source | Fenced code or `<<<` source import with click-based line ranges; retain the complete program and end with `all`. |
| Locate an exact term, binding or condition in surrounding explanation | `v-mark` circle/underline on that small target at the relevant click. Avoid permanently highlighting most lines with the same meaning. |
| Predict an output before seeing it | Ordinary `v-click` for the answer and causal explanation; keep question/code anchored. |
| Compare related versions whose unchanged tokens matter | Native Magic Move when token continuity actually helps; otherwise use a simultaneous comparison. |
| Notice a page change while keeping a lecture pace | A short native `fade` or `slide-left`; use `none` when motion would disturb a continuous comparison. |
| Verify an actual behavior or parameter | A small local execution component using the displayed source or explicitly corresponding model, with actual observations labelled separately from predictions. |

These choices are not a feature quota. Use a relevant native treatment when it improves the page's learning step instead of defaulting every page to static code plus a visible answer. No Monaco, runner service or new dependency is needed for ordinary source walkthroughs.

### Native source and local attention

For example, after authoring a subject-specific local file, use actual line numbers from that file:

~~~~md
<<< ./examples/example.mjs {2-3|5-6|all}{at:1,lines:true}

<p>The change affects the <span v-mark="{ at: 1, type: 'circle', color: '#79559b', animationDuration: 250 }">shared binding</span>.</p>

<div v-click="2">The predicted output is … because …</div>
~~~~

The first code range is visible at click0; `at:1` advances to the next range on the first click. Align mark/answer indices with the actual reasoning sequence. Keep line ranges accurate after edits, and keep source positions fixed while emphasis moves. Use ordinary `v-click` for a hidden answer; `v-click.fade` can leave it partly visible in the installed runtime. Use a persistent reveal rather than a finite click interval when the answer must remain in the final handout.

Slidev transition names belong in headmatter/frontmatter. Use the installed runtime's APIs; the current workbench contains the compatibility support for native `v-mark`, so copy the canonical workbench rather than replacing the directive. For print, reuse its `?print=true#/slideblocks-pdf` route; a bare native print route is not enabled in every production build. Primary references: [source highlighting](https://sli.dev/features/line-highlighting), [rough markers](https://sli.dev/features/rough-marker), [click animation](https://sli.dev/guide/animations), [slide transitions](https://sli.dev/features/slide-transitions).

## Verify the claimed demonstration

Execute the displayed code or check its exact adaptation, not a separately retyped approximation. A static output can be a recorded observation when the shown source was actually executed. A button changing text is not by itself evidence that the claimed mechanism ran.

Check the particular causal claim: which function or object was created, which state is shared, when a callback was registered versus invoked, which condition changed, and which output followed. For a pre-created callback demonstration, observe creation before the event and invocation afterward; a helper-only result test cannot detect a component that creates and immediately invokes a new function inside the click.

During the existing QA, inspect the first live state, each meaningful click/control state and the complete state. Prediction answers should be initially hidden where intended; source remains readable throughout. Native print/export should show complete answers and source; reduced motion removes movement while retaining deliberate click progression and a complete final state. Inspect both, including annotation placement after fonts load. Record these observations in the existing QA report, without adding a new teaching schema or score.
