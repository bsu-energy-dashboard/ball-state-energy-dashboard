import { chartTheme, chartColors, chartAxis, BSU_CHART } from "../constants/chartTheme";
import Plot from "react-plotly.js";
import type { Data, Layout } from "plotly.js";
import { useDarkMode } from "../hooks/use-darkmode";

export interface AnalysisChartData {
  panels: { title: string; x: (string | number)[]; series: { name: string; values: (number | null)[]; kind?: "bar" | "line" }[]; date_axis?: boolean; bands?: { start: string; end: string; label: string }[] }[];
}
export default function InteractiveAnalysisChart({ chart }: { chart: AnalysisChartData }) {
  const { darkMode } = useDarkMode();
  return <div className="space-y-4">
    <p className="text-xs text-gray-500 dark:text-gray-400">Hover for values, drag to zoom, and double-click to reset. Click a legend label to hide or show a line. {chart.panels.some(panel => panel.date_axis) && "Use the slider below each dated chart: drag either handle to change the visible dates, or drag the selected window to move it. This only changes the view."}</p>
    {chart.panels.map((panel, i) => <Plot key={i} data={panel.series.map((series, index) => ({
      line: { color: chartColors(darkMode)[index % 4], width: 2, dash: !panel.date_axis && index > 0 ? "dash" : "solid" },
      marker: { color: chartColors(darkMode)[index % 4] },
      x: panel.x, y: series.values, name: series.name,
      type: series.kind === "bar" ? "bar" : "scatter", mode: "lines", connectgaps: false,
    } as Data))} layout={{
      ...chartTheme(darkMode),
      autosize: true, height: panel.date_axis ? 420 : 340,
      uirevision: `${panel.title}:${panel.x.length}:${panel.x[0]}:${panel.x[panel.x.length - 1]}`,
      title: { text: panel.title },
      margin: { l: 65, r: 20, t: panel.date_axis ? 80 : 45, b: 65 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent",
      font: { color: darkMode ? "#e5e7eb" : "#374151" },
      xaxis: { ...chartAxis(darkMode), type: panel.date_axis ? "date" : "linear", title: { text: panel.date_axis ? "Date" : "Time gap (readings)" },
        ...(panel.date_axis ? { rangeslider: {
          visible: true, thickness: 0.18,
          bgcolor: darkMode ? "#1F2937" : "#F3F8FA",
          bordercolor: darkMode ? BSU_CHART.paleBlue : BSU_CHART.blue,
          borderwidth: 1,
        } } : {}),
      },
      yaxis: { ...chartAxis(darkMode), title: { text: panel.date_axis ? "Value" : "Correlation" }, zeroline: true },
      legend: { orientation: "h", y: panel.date_axis ? 1.15 : -0.25 },
      shapes: (panel.bands ?? []).map((band) => ({ type: "rect", xref: "x", yref: "paper", x0: band.start, x1: band.end, y0: 0, y1: 1, fillcolor: BSU_CHART.blue, opacity: 0.18, line: { width: 0 }, layer: "below" })),
      annotations: (panel.bands ?? []).map((band) => ({ x: band.start, y: 1, xref: "x", yref: "paper", text: band.label, showarrow: false, textangle: "-90", font: { size: 10 } })),
    } as Partial<Layout>} config={{ responsive: true, displaylogo: false }} useResizeHandler style={{ width: "100%" }} />)}
  </div>;
}
