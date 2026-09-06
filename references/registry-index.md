<!-- Generated SlideBlocks Skill reference. Do not edit directly. -->
# Registry Index

Built from the current public SlideBlocks Registry v2 metadata. Updates arrive with a verified Skill package upgrade.

Use this bundled index only when live public Catalog discovery is unavailable, and record that snapshot fallback in the page plan. When the Catalog is reachable, search it first so newly published or withdrawn Artifacts are discovered at execution time. Then inspect the selected entry's prompt, preview, status, and source metadata. Page responsibilities are derived deterministically from family, title, description, and tags. Relationships appear only when metadata explicitly declares Block IDs; do not infer a Deck relationship from visual similarity. Full component source is intentionally omitted.

## Responsibility coverage

| Page responsibility | Current Blocks |
| --- | --- |
| Opening | `blocks/hero/community-proof-points`<br>`blocks/hero/image-mask-hero`<br>`blocks/hero/live-execution-trace`<br>`blocks/hero/product-launch` |
| Problem | `blocks/system-diagram/live-failover-lab` |
| Evidence | `blocks/hero/community-proof-points`<br>`blocks/hero/live-execution-trace`<br>`blocks/metric-cards/verified-metrics`<br>`blocks/system-diagram/evaluation-pipeline` |
| Method | `blocks/architecture-flow/data-pipeline`<br>`blocks/architecture-flow/svg-font-export-pipeline`<br>`blocks/architecture-flow/transformer-paper-framework`<br>`blocks/hero/live-execution-trace`<br>`blocks/system-diagram/evaluation-pipeline`<br>`blocks/system-diagram/live-failover-lab`<br>`blocks/system-diagram/runtime-architecture` |
| Comparison | — |
| Decision | — |
| Result | `blocks/hero/community-proof-points`<br>`blocks/metric-cards/verified-metrics`<br>`blocks/system-diagram/live-failover-lab` |
| Closing | `blocks/closing/glacier-thanks` |

## Blocks

| Block ID | Status | Page responsibilities | Applicable scenarios | Limits | Declared Deck / Recipe |
| --- | --- | --- | --- | --- | --- |
| `blocks/architecture-flow/data-pipeline` | official | Method | `agent-workflow-report`<br>`technical-product-intro`<br>`system-walkthrough` | `maxGroups`=5<br>`maxServices`=15<br>`requiresMermaidArchitecture`=true | Recipe `recipes/mini-technical-product-deck` |
| `blocks/architecture-flow/svg-font-export-pipeline` | official | Method | `engineering-review`<br>`runtime-architecture`<br>`research-diagram` | `maxNoteLines`=4<br>`maxRegions`=4<br>`maxStepLabels`=12 | — |
| `blocks/architecture-flow/transformer-paper-framework` | draft | Method | `paper-framework-figure`<br>`research-presentation` | `maxStackItems`=4<br>`maxVisibleTextLabels`=18<br>`paper`=Attention Is All You Need<br>`requiresEditableVectors`=true<br>1 asset require rights review | — |
| `blocks/closing/glacier-thanks` | official | Closing | `engineering-review`<br>`agent-workflow-report`<br>`technical-talk` | `defaultImagePath`=./ice.webp<br>`maxBylineLength`=60<br>`maxTitleLength`=24<br>`requiresImageAsset`=true | — |
| `blocks/hero/community-proof-points` | community | Opening, Evidence, Result | `evidence-led-section-opener`<br>`community-contribution-summary`<br>`claim-with-three-supporting-reasons` | `externalAssets`=false<br>`proofPointCount`=3 | — |
| `blocks/hero/image-mask-hero` | official | Opening | `image-cover`<br>`event-title` | `maxCreditLength`=64<br>`maxSubtitleLength`=150<br>`maxTitleLength`=48 | — |
| `blocks/hero/live-execution-trace` | official | Opening, Evidence, Method | `research-process`<br>`scientific-review` | `maxEvents`=8<br>`maxLanes`=4<br>`maxSubtitleLength`=140<br>`maxTitleLength`=64<br>`supportsReplay`=true | Recipe `recipes/mini-technical-product-deck` |
| `blocks/hero/product-launch` | official | Opening | `open-source-launch`<br>`technical-product-intro`<br>`cinematic-opening` | `maxTitleLength`=28<br>`recommendedImageAspectRatio`=16:9<br>`requiresImageAsset`=true | — |
| `blocks/metric-cards/verified-metrics` | official | Evidence, Result | `weekly-reports`<br>`product-proof-points`<br>`research-summaries` | `maxItems`=4<br>`maxLabelLength`=32<br>`maxNoteLength`=90<br>`minItems`=2 | Recipe `recipes/mini-technical-product-deck` |
| `blocks/system-diagram/evaluation-pipeline` | official | Evidence, Method | `evaluation-report`<br>`quality-review` | `maxSignals`=4<br>`maxStageTitleLength`=28<br>`maxStages`=5 | — |
| `blocks/system-diagram/live-failover-lab` | official | Problem, Method, Result | `architecture-review`<br>`resilience-review` | `maxNodeTitleLength`=24<br>`maxNodes`=9<br>`maxScenarios`=4<br>`supportsFaultInjection`=true | — |
| `blocks/system-diagram/runtime-architecture` | official | Method | `runtime-walkthrough`<br>`technical-product-intro` | `maxLayers`=4<br>`maxNodeTitleLength`=28<br>`maxNodes`=8 | — |

## Decks

| Deck ID | Category | Verified style profile | Slides | Limits |
| --- | --- | --- | --- | --- |
| `decks/macbook-pro-m5-launch` | Product Launch | Product Launch | 10 | — |
| `decks/sgr-a-discovery` | Astrophysics | Academic / Scientific | 11 | — |

## Recipes

| Recipe ID | Applicable scenario | Included Blocks | Status |
| --- | --- | --- | --- |
| `recipes/mini-technical-product-deck` | A three-slide starter deck that validates Hero, Architecture Flow, and Metric Cards together. | `blocks/hero/live-execution-trace`<br>`blocks/architecture-flow/data-pipeline`<br>`blocks/metric-cards/verified-metrics` | official |
