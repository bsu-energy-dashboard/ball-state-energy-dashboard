import type { Layout } from "plotly.js";

// Match the dashboard's cardinal red, blue, pale blue, and neutral palette.
export const BSU_CHART = {
  red: "#ba0c2f",
  blue: "#0079A7",
  paleBlue: "#AEDBE9",
  navy: "#003DA5",
  gray: "#6B7280",
};

export function chartColors(dark: boolean) {
  return dark
    ? ["#F06B83", BSU_CHART.paleBlue, "#75B8D1", "#B6BBC3"]
    : [BSU_CHART.red, BSU_CHART.blue, BSU_CHART.navy, BSU_CHART.gray];
}

export function chartTheme(dark: boolean): Partial<Layout> {
  return {
    colorway: chartColors(dark),
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Inter, ui-sans-serif, system-ui, sans-serif", color: dark ? "#E5E7EB" : "#374151", size: 12 },
    hoverlabel: { bgcolor: dark ? "#1F2937" : "#FFFFFF", bordercolor: dark ? BSU_CHART.paleBlue : BSU_CHART.blue, font: { color: dark ? "#F9FAFB" : "#111827" } },
    modebar: { bgcolor: "transparent", color: dark ? BSU_CHART.paleBlue : BSU_CHART.blue, activecolor: dark ? "#F06B83" : BSU_CHART.red },
  };
}

export function chartAxis(dark: boolean) {
  return { gridcolor: dark ? "#374151" : "#E5E7EB", zerolinecolor: dark ? "#6B7280" : "#9CA3AF", linecolor: dark ? "#6B7280" : "#D1D5DB", automargin: true };
}
