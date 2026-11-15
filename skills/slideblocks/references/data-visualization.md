# Data Visualization

Use this for quantitative graphics: comparisons, trends, compositions, distributions, relationships, and uncertainty. It is shared across tasks. Mermaid and the conceptual-diagram routes describe entities and relationships; they are not statistical plotting tools.

The task determines the question and emphasis. The data determines the encoding and scale. The selected visual direction supplies typography, palette, density, and annotation treatment without changing the data meaning.

## Use a mature Node/Web plotting library

Preserve a suitable library already used by the project or explicitly requested by the user. For a new plotting path, start with **Apache ECharts**, using native option objects and Node SVG server-side rendering. It supports common presentation charts without adding Python, R, a new frontend framework, or a plotting service. Do not invent a universal ChartSpec or hand-code data-to-pixel geometry that the library already handles.

Other useful options are **Vega-Lite / Vega** for declarative statistical graphics and composition, and **Observable Plot** for concise mark-based statistical plots. These are alternatives when the actual chart benefits from them, not dependencies every project must install. Chart.js is Canvas-first; D3 is a lower-level toolkit. Neither is the default merely because it is familiar.

Official references: [ECharts Node SVG rendering](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/), [ECharts styling](https://echarts.apache.org/handbook/en/concepts/style/), [Vega-Lite gallery](https://vega.github.io/vega-lite/examples/), [Vega Node rendering](https://vega.github.io/vega/usage/), [Observable Plot in Node](https://observablehq.com/plot/getting-started#plot-in-node-js).

## A small executable authoring path

For a project using ECharts, declare `echarts` in its package dependencies and lock the installed version. Copy `assets/charts/echarts-render.mjs` into the project, for example as `.slideblocks/echarts-render.mjs`. A normal local authoring script can import it:

```js
import { writeFile } from 'node:fs/promises';
import { renderEChartsSvg } from './.slideblocks/echarts-render.mjs';

const option = {
  grid: { left: 70, right: 30, top: 35, bottom: 55, containLabel: true },
  xAxis: { type: 'category', data: periods, name: 'Quarter' },
  yAxis: { type: 'value', name: 'Revenue ($M)' },
  series: [{ type: 'bar', data: revenue, label: { show: true, position: 'top' } }]
};
await writeFile('public/charts/revenue.svg', renderEChartsSvg(option, {
  width: 1000, height: 480, theme: chartTheme
}));
```

`periods`, `revenue`, and `chartTheme` come from the real project data and selected direction. Keep raw CSV/JSON, the native options, and the generator alongside the result. Generate during authoring/build, then embed the local SVG as a pre-rendered data-derived asset. PNG is an optional compatibility output, obtainable from SVG with an existing rasterizer such as `sharp`; verify Chinese fonts in the actual rendering environment. Ordinary tables remain semantic HTML/CSS unless a genuine table-plot needs a charting library.

This path does not require loading the full ECharts runtime into every slide or relying on CDN assets. The helper disables animation for complete static output. Add live interaction only when it helps the audience and retains the same static evidence in reduced-motion, print, and offline output.

## Plan and style the chart

- Select a visual encoding from the audience question, not from available chart types. Do not manufacture a time series from one snapshot or a percentage from incomparable quantities.
- Preserve source units, denominators, periods, missing values, restatements, and the distinction between actual, forecast, and capacity. Do not infer a causal explanation from a coincident trend.
- Use appropriate baselines and domains. Keep comparable panels on comparable scales; separate unlike units rather than using a misleading shared axis. Clearly label a justified secondary axis.
- Carry chart colors, type, axes, gridlines, marks, number formatting, and direct annotations from the deck grammar. A research plot may emphasize uncertainty and method; a work report may emphasize target/actual and variance. A theme must not alter values, scale semantics, or evidence boundaries.
- Prefer useful plot area and direct labels over ornamental frames or a dashboard grid. Put the source, statistical scope, and necessary qualifier adjacent to the chart. Do not hide essential values in hover alone.
- Size the SVG for its final slide slot, or account for the embedding scale. Set native text, axis-label, legend, and data-label sizes for that displayed scale; dashboard defaults around 12px are not presentation typography.
- Let the library handle axes, ticks, scale geometry, and legends. Repair crowded labels through size, margins, wrapping, or honest content selection before reducing text below presentation readability.

## Keep plotting distinct from custom semantic diagrams

A pre-rendered library SVG is a data-derived figure, like a source figure, with its raw data and generator retained. Do not relabel it as an ELK/Mermaid graph or add fake node ownership to its axes. Use the existing source-map/evidence/asset records and the actual file type. If the selected mounted carrier is itself code-backed, keep its executable route and source/lock handshake accurate under the shared contract.

Review the SVG itself at intended size before embedding: visible axis titles, tick labels, units, legend, data labels, annotations, actual mark geometry, and source context. Then inspect the mounted figure in the final slide, reduced-motion state, copied offline file, and native print output. An SVG `<img>` gives a measurable image boundary but not a DOM measurement of its internal labels, so it also needs an actual image review; inline SVG permits additional text-bounds inspection. Reject clipping, illegible labels, misleading scales, detached qualifiers, remote asset dependencies, or a chart that only looks quantitative without explaining its data.
