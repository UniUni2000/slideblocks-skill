import * as echarts from 'echarts';

/** Render native ECharts options to a complete static SVG in Node.js. */
export function renderEChartsSvg(option, { width, height, theme = null } = {}) {
  if (!option || typeof option !== 'object' || Array.isArray(option)) {
    throw new TypeError('Provide a native ECharts option object.');
  }
  for (const [name, value] of Object.entries({ width, height })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(`${name} must be a finite positive number.`);
    }
  }
  const chart = echarts.init(null, theme, { renderer: 'svg', ssr: true, width, height });
  try {
    chart.setOption({ ...option, animation: false });
    return chart.renderToSVGString();
  } finally {
    chart.dispose();
  }
}
