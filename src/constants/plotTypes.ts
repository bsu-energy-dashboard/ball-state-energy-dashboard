import type { PlotTypeConfig } from "../types/api";

// Available plot types configuration
export const PLOT_TYPES: PlotTypeConfig[] = [
  {
    id: "time-series",
    label: "Time Series",
    description: "View time series data with smoothing",
    available: true,
    fields: [
      "start_date",
      "end_date",
      "meter",
      "cleaning_method",
      "smoothing_method",
      "smoothing_window",
    ],
  },
  {
    id: "seasonal-analysis",
    label: "Seasonal Analysis",
    description: "Seasonal analysis of energy consumption",
    available: true,
    fields: ["start_date", "end_date", "meter", "cleaning_method"],
  },
  {
    id: "temperature-analysis",
    label: "Temperature Analysis",
    description: "Temperature analysis of energy consumption",
    available: true,
    fields: ["start_date", "end_date", "meter", "cleaning_method"],
  },
  {
    id: "eda-plots",
    label: "EDA Plots",
    description: "Exploratory data analysis plots",
    available: true,
    fields: ["start_date", "end_date", "meter", "cleaning_method"],
  },
  {
    id: "rpca-analysis",
    label: "Campus RPCA",
    description: "Run Robust PCA on the campus total",
    available: true,
    fields: ["start_date", "end_date", "meter", "cleaning_method"],
  },
  {
    id: "threshold-detection",
    label: "Threshold Detection",
    description: "Overage threshold optimization and event analysis",
    available: true,
    fields: ["start_date", "end_date", "meter", "cleaning_method"],
  },
];
