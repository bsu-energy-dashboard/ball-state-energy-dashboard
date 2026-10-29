import type { CleaningMethod, PlotType } from "../types/api";

export const BASE_CLEANING_METHOD_OPTIONS: {
  value: CleaningMethod | "";
  label: string;
}[] = [
  { value: "", label: "Keep readings as they are - No automatic cleaning" },
  { value: "Prophet", label: "Find unusual readings using expected seasonal patterns - Prophet" },
  { value: "Hampel", label: "Replace isolated spikes using nearby typical readings - Hampel" },
  { value: "Polynomial", label: "Replace readings that stray from the local pattern - Polynomial" },
];

export const OVERAGE_CLEANING_METHOD_OPTIONS: {
  value: CleaningMethod;
  label: string;
}[] = [
  { value: "Neural", label: "Learn usage patterns to find unusual readings - NeuralProphet" },
  { value: "Fencing", label: "Replace extreme values with the middle reading - Fencing" },
];

export function cleaningMethodOptionsForPlot(
  plotType: string,
): { value: CleaningMethod | ""; label: string }[] {
  if (plotType === "threshold-detection" || plotType === "rpca-analysis") {
    return [...BASE_CLEANING_METHOD_OPTIONS, ...OVERAGE_CLEANING_METHOD_OPTIONS];
  }
  return BASE_CLEANING_METHOD_OPTIONS;
}

/** Starting defaults based on the backend data-cleaning guide, not a claim of optimality. */
export function defaultCleaningMethod(plot: PlotType): CleaningMethod {
  return plot === "eda-plots" || plot === "rpca-analysis" || plot === "threshold-detection"
    ? "Polynomial" : "Hampel";
}

export const CLEANING_DESCRIPTIONS: Record<string, string> = {
  "": "Leaves readings unchanged by automatic cleaning. Any manual zaps you select still apply.",
  None: "Leaves readings unchanged by automatic cleaning. Any manual zaps you select still apply.",
  Hampel: "Compares each reading with nearby readings and replaces unusually high or low points with a typical nearby value. Useful for isolated meter spikes.",
  Polynomial: "Follows the local rise and fall in usage, then replaces readings that sit unusually far from that pattern. Useful for trends and comparisons across many meters.",
  Prophet: "Learns the usual direction and repeating patterns of energy use, then replaces readings outside the expected range. It takes longer, especially across many meters.",
  Fencing: "Finds readings far outside the usual range and replaces them with the middle value. It does not consider when a reading happened.",
  Neural: "Trains a model to learn usage patterns and replace readings that differ greatly from its estimates. It can take longer and depends on the available history.",
};
