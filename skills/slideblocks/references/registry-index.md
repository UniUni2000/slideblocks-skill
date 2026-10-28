<!-- Generated SlideBlocks Skill reference. Do not edit directly. -->
# Registry Index

Built from the current public SlideBlocks Registry v2 metadata. Updates arrive with a verified Skill package upgrade.

Use this bundled index only when live public Catalog discovery is unavailable, and record that snapshot fallback in the page plan. When the Catalog is reachable, search it first so newly published or withdrawn Artifacts are discovered at execution time. Then inspect the selected entry's prompt, preview, status, and source metadata. Page responsibilities are derived deterministically from family, title, description, and tags. Relationships appear only when metadata explicitly declares Block IDs; do not infer a Deck relationship from visual similarity. Full component source is intentionally omitted.

## Responsibility coverage

| Page responsibility | Current Blocks |
| --- | --- |
| Opening | `blocks/hero/image-mask-hero`<br>`blocks/hero/live-execution-trace`<br>`blocks/hero/panorama-cover`<br>`blocks/hero/product-launch` |
| Problem | `blocks/system-diagram/failure-domains`<br>`blocks/system-diagram/live-failover-lab` |
| Evidence | `blocks/evidence/annotated-figure`<br>`blocks/evidence/chart-readout`<br>`blocks/evidence/model-comparison`<br>`blocks/evidence/model-grid`<br>`blocks/evidence/panel-row`<br>`blocks/evidence/paper-figure`<br>`blocks/evidence/zoom-panorama`<br>`blocks/hero/live-execution-trace`<br>`blocks/metric-cards/derivation`<br>`blocks/metric-cards/score-reversal`<br>`blocks/timeline/epoch-strip` |
| Method | `blocks/architecture-flow/data-pipeline`<br>`blocks/architecture-flow/process-cycle`<br>`blocks/architecture-flow/svg-font-export-pipeline`<br>`blocks/architecture-flow/transformer-paper-framework`<br>`blocks/hero/live-execution-trace`<br>`blocks/metric-cards/score-reversal`<br>`blocks/system-diagram/failure-domains`<br>`blocks/system-diagram/live-failover-lab` |
| Comparison | `blocks/evidence/chart-readout`<br>`blocks/evidence/model-comparison`<br>`blocks/metric-cards/score-reversal`<br>`blocks/timeline/epoch-strip` |
| Decision | — |
| Result | `blocks/evidence/annotated-figure`<br>`blocks/metric-cards/derivation`<br>`blocks/metric-cards/score-reversal`<br>`blocks/system-diagram/failure-domains`<br>`blocks/system-diagram/live-failover-lab` |
| Closing | `blocks/closing/known-and-open`<br>`blocks/closing/open-question` |

## Blocks

| Block ID | Status | Page responsibilities | Applicable scenarios | Limits | Declared Deck / Recipe |
| --- | --- | --- | --- | --- | --- |
| `blocks/architecture-flow/data-pipeline` | official | Method | `agent-workflow-report`<br>`technical-product-intro`<br>`system-walkthrough` | `maxGroups`=5<br>`maxServices`=15<br>`requiresMermaidArchitecture`=true | Recipe `recipes/mini-technical-product-deck` |
| `blocks/architecture-flow/process-cycle` | official | Method | `scientific-talk`<br>`process-explanation`<br>`mechanism-overview` | `defaultImagePath`=./star-formation-stages.webp<br>`feedbackCount`=2<br>`maxFormulas`=2<br>`requiresImageAsset`=true<br>`stageCount`=4<br>`stageStripAspect`=3:1<br>`stepCount`=3 | — |
| `blocks/architecture-flow/svg-font-export-pipeline` | official | Method | `engineering-review`<br>`runtime-architecture`<br>`research-diagram` | `maxNoteLines`=4<br>`maxRegions`=4<br>`maxStepLabels`=12 | — |
| `blocks/architecture-flow/transformer-paper-framework` | draft | Method | `paper-framework-figure`<br>`research-presentation` | `maxStackItems`=4<br>`maxVisibleTextLabels`=18<br>`paper`=Attention Is All You Need<br>`requiresEditableVectors`=true<br>1 asset require rights review | — |
| `blocks/closing/known-and-open` | official | Closing | `research-closing`<br>`scientific-talk`<br>`review-summary` | `columnCount`=2<br>`defaultImagePath`=./phat-phast-mosaic.jpg<br>`maxItemsPerColumn`=6<br>`panoramaAspect`=about 4:1<br>`requiresImageAsset`=true | — |
| `blocks/closing/open-question` | official | Closing | `research-closing`<br>`scientific-talk`<br>`seminar` | `maxFindings`=5<br>`maxTitleLines`=2<br>`questionCount`=1 | — |
| `blocks/evidence/annotated-figure` | official | Evidence, Result | `paper-reading`<br>`scientific-talk`<br>`observation-result` | `defaultImagePath`=./g336-streamers.png<br>`maxKeyGroups`=4<br>`requiresImageAsset`=true | — |
| `blocks/evidence/chart-readout` | official | Evidence, Comparison | `benchmark-review`<br>`evaluation-report`<br>`research-summary` | `defaultImagePath`=./scientific-evals-infra-original.png<br>`maxFindings`=3<br>`requiresImageAsset`=true | Recipe `recipes/mini-technical-product-deck` |
| `blocks/evidence/model-comparison` | official | Evidence, Comparison | `scientific-talk`<br>`literature-review`<br>`model-comparison` | `defaultImagePath`=./hammer-2018-fig1.jpg<br>`maxColumns`=4<br>`maxPoints`=3<br>`maxRows`=4<br>`requiresImageAsset`=true | — |
| `blocks/evidence/model-grid` | official | Evidence | `scientific-talk`<br>`model-comparison`<br>`simulation-review` | `defaultImagePath`=./eht-model-degeneracy.webp<br>`maxLegendRows`=6<br>`maxPoints`=4<br>`requiresImageAsset`=true | — |
| `blocks/evidence/panel-row` | official | Evidence | `scientific-talk`<br>`method-comparison`<br>`robustness-check` | `columnCount`=2<br>`defaultImagePath`=./eht-independent-teams.png<br>`maxPointsPerColumn`=2<br>`requiresImageAsset`=true | — |
| `blocks/evidence/paper-figure` | official | Evidence | `paper-reading`<br>`research-summary`<br>`scientific-talk` | `defaultImagePath`=./inference-goku-w0-detail.svg<br>`maxPoints`=4<br>`requiresImageAsset`=true | — |
| `blocks/evidence/zoom-panorama` | official | Evidence | `scientific-talk`<br>`survey-overview`<br>`image-walkthrough` | `defaultImagePath`=./phat-phast-mosaic.jpg<br>`maxPoints`=4<br>`maxZooms`=3<br>`requiresImageAsset`=true | — |
| `blocks/hero/image-mask-hero` | official | Opening | `image-cover`<br>`event-title` | `maxCreditLength`=64<br>`maxSubtitleLength`=150<br>`maxTitleLength`=48 | — |
| `blocks/hero/live-execution-trace` | official | Opening, Evidence, Method | `research-process`<br>`scientific-review` | `maxEvents`=8<br>`maxLanes`=4<br>`maxSubtitleLength`=140<br>`maxTitleLength`=64<br>`supportsReplay`=true | Recipe `recipes/mini-technical-product-deck` |
| `blocks/hero/panorama-cover` | official | Opening | `scientific-talk`<br>`research-briefing`<br>`talk-opening` | `defaultImagePath`=./phat-phast-mosaic.jpg<br>`maxSubtitleLines`=2<br>`maxTitleLines`=1<br>`panoramaAspect`=about 4:1<br>`requiresImageAsset`=true | — |
| `blocks/hero/product-launch` | official | Opening | `open-source-launch`<br>`technical-product-intro`<br>`cinematic-opening` | `maxTitleLength`=28<br>`recommendedImageAspectRatio`=16:9<br>`requiresImageAsset`=true | — |
| `blocks/metric-cards/derivation` | official | Evidence, Result | `scientific-talk`<br>`measurement-explanation`<br>`research-result` | `maxCaveats`=3<br>`maxComparisonRows`=4<br>`maxSteps`=6 | — |
| `blocks/metric-cards/score-reversal` | official | Evidence, Method, Comparison, Result | `benchmark-review`<br>`evaluation-report`<br>`agent-systems` | `defaultImagePath`=./scientific-evals-bench-pipeline.png<br>`maxColumns`=4<br>`maxPoints`=3<br>`maxRows`=4<br>`requiresImageAsset`=true | — |
| `blocks/system-diagram/failure-domains` | official | Problem, Method, Result | `architecture-review`<br>`resilience-review`<br>`agent-systems` | `defaultImagePath`=./systems-managed-architecture.webp<br>`maxModeLines`=2<br>`maxModes`=3<br>`maxPrinciples`=3<br>`requiresImageAsset`=true | — |
| `blocks/system-diagram/live-failover-lab` | official | Problem, Method, Result | `architecture-review`<br>`resilience-review` | `maxNodeTitleLength`=24<br>`maxNodes`=9<br>`maxScenarios`=4<br>`supportsFaultInjection`=true | — |
| `blocks/timeline/epoch-strip` | official | Evidence, Comparison | `scientific-talk`<br>`change-over-time`<br>`research-finding` | `defaultImagePath`=./m87-polarization-epochs.webp<br>`maxEpochs`=4<br>`maxPoints`=3<br>`minEpochs`=2<br>`requiresImageAsset`=true | — |

## Decks

| Deck ID | Category | Verified style profile | Slides | Limits |
| --- | --- | --- | --- | --- |
| `decks/agent-harness-frontiers` | AI Engineering | Academic / Scientific | 21 | — |
| `decks/macbook-pro-m5-launch` | Product Launch | Product Launch | 10 | — |
| `decks/ml-astronomy-frontiers` | Astronomy | Academic / Scientific | 31 | — |
| `decks/sgr-a-discovery` | Astrophysics | Academic / Scientific | 11 | — |

## Recipes

| Recipe ID | Applicable scenario | Included Blocks | Status |
| --- | --- | --- | --- |
| `recipes/mini-technical-product-deck` | A three-slide starter deck that validates Hero, Architecture Flow, and Evidence together. | `blocks/hero/live-execution-trace`<br>`blocks/architecture-flow/data-pipeline`<br>`blocks/evidence/chart-readout` | official |
