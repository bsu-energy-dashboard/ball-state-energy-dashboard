import type { EdaRoute, PlotType } from "../types/api";
export const EXPLORATION_OPTIONS: { value: string; label: string; plot: PlotType; route?: EdaRoute; description: string; technical?: boolean }[] = [
  { value: "usage-history", label: "How has energy use changed over time?", plot: "usage-history", description: "See recorded energy use over your selected dates. Peaks show times of higher demand." },
  { value: "seasonal-analysis", label: "How does energy use change across the year?", plot: "seasonal-analysis", description: "Compare energy use across seasons and when classes are in session. A full year gives a more complete comparison." },
  { value: "temperature-analysis", label: "How does energy use vary with outdoor temperature?", plot: "temperature-analysis", description: "Compare usage in warmer and colder weather. This shows a relationship, not proof that temperature caused a change." },
  { value: "trend-tests", label: "Is energy use going up or down?", plot: "eda-plots", route: "trend-tests", description: "Check for evidence of a lasting increase or decrease in usage." },
  { value: "seasonality-tests", label: "Does usage repeat each day or week?", plot: "eda-plots", route: "seasonality-tests", description: "Look for recurring daily and weekly usage patterns." },
  { value: "annotated-timeseries", label: "How does usage change around holidays and weekends?", plot: "eda-plots", route: "annotated-timeseries", description: "View a smoothed usage chart with calendar highlights." },
  { value: "seasonal-decompose", label: "What are the long-term and repeating patterns?", plot: "eda-plots", route: "seasonal-decompose", description: "Separate the overall direction, repeating daily pattern, and remaining changes." },
  { value: "autocorr", label: "Autocorrelation (technical)", plot: "eda-plots", route: "autocorr", description: "Compare readings with earlier readings at different time gaps.", technical: true },
  { value: "unit-root-tests", label: "Series stability tests (technical)", plot: "eda-plots", route: "unit-root-tests", description: "Advanced checks used to prepare data for forecasting.", technical: true },
];
export const isExploration = (plot: PlotType) => ["usage-history", "seasonal-analysis", "temperature-analysis", "eda-plots"].includes(plot);
