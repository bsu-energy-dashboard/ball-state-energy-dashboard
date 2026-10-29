import type { PlotTypeConfig } from "../types/api";

// Available plot types configuration
export const PLOT_TYPES: PlotTypeConfig[] = [
  { id: "usage-history", label: "Explore patterns", description: "Understand past energy use, seasons, and weather", available: true, fields: ["start_date", "end_date", "meter", "cleaning_method", "smoothing_method", "smoothing_window"] },
  {
    id: "time-series",
    label: "Forecast & accuracy",
    description: "Predict future use or check prediction accuracy",
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
    label: "Campus overview",
    description: "See usual campus use and hours above your limit",
    available: true,
    fields: ["start_date", "end_date", "meter", "cleaning_method"],
  },
  {
    id: "threshold-detection",
    label: "Energy limits",
    description: "Set a limit or get a suggested limit",
    available: true,
    fields: ["start_date", "end_date", "meter", "cleaning_method"],
  },
];
