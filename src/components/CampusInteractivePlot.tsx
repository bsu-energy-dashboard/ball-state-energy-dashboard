import Plot from "react-plotly.js";
import type { Data, PlotData } from "plotly.js";
import type { SimpleRpcaResponse } from "../types/api";
import { useDarkMode } from "../hooks/use-darkmode";
import { BSU_CHART, chartAxis, chartColors, chartTheme } from "../constants/chartTheme";

export default function CampusInteractivePlot({ result, kind }: {
  result: SimpleRpcaResponse;
  kind: "heatmap" | "series" | "overage";
}) {
  const { darkMode } = useDarkMode();
  const values = result.interactive_data;
  if (!values) return null;
  const colors = chartColors(darkMode);
  const x = values.timestamps;
  const line = (name: string, y: (number | null)[], color: string): Partial<PlotData> => ({
    type: "scatter", mode: "lines", x, y, name, connectgaps: false,
    line: { color, width: 2 }, hovertemplate: "%{x|%b %d, %H:%M}<br>%{y:,.2f}<extra>%{fullData.name}</extra>",
  });
  const traces: Data[] = kind === "heatmap" ? [{
    type: "heatmap", x, y: values.buildings, z: values.deviations,
    colorscale: [[0, BSU_CHART.blue], [0.5, "#FFFFFF"], [1, BSU_CHART.red]],
    zmin: -300, zmax: 300, colorbar: { title: { text: "Deviation" } },
    hovertemplate: "%{y}<br>%{x|%b %d, %H:%M}<br>Deviation: %{z:,.2f}<extra></extra>",
  }] : kind === "series" ? [
    line("Recorded use", values.actual, colors[0]),
    line("Estimated usual use", values.usual, colors[1]),
  ] : [
    line("Campus total", values.campus_total, colors[1]),
    { ...line("Limit", x.map(() => result.threshold), colors[3]), line: { color: colors[3], dash: "dash" } },
    { type: "scatter", mode: "markers", name: "Above limit", x,
      y: values.campus_total.map(value => value !== null && value > result.threshold ? value : null),
      marker: { color: colors[0], size: 8 },
      hovertemplate: "%{x|%b %d, %H:%M}<br>Above limit: %{y:,.2f}<extra></extra>" },
  ];
  return <div>
    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Hover for readings, drag to zoom, and double-click to reset. Use the date slider to move through the week. The summary count always covers the full week.</p>
    <Plot data={traces} layout={{
      ...chartTheme(darkMode), autosize: true,
      height: kind === "heatmap" ? Math.max(600, values.buildings.length * 18 + 180) : 440,
      margin: { l: kind === "heatmap" ? 180 : 65, r: kind === "heatmap" ? 100 : 25, t: 45, b: 80 },
      uirevision: `${result.summary.saved_year}:${x[0]}:${kind}:${result.meter}`,
      xaxis: { ...chartAxis(darkMode), type: "date", rangeslider: { visible: true, thickness: 0.12 }, title: { text: "Date and time" } },
      yaxis: { ...chartAxis(darkMode), ...(kind === "heatmap" ? { type: "category", autorange: "reversed", tickfont: { size: 10 } } : { title: { text: "Energy use" } }) },
      legend: { orientation: "h", y: 1.15 },
    }} config={{ responsive: true, displaylogo: false }} useResizeHandler style={{ width: "100%" }} />
  </div>;
}
