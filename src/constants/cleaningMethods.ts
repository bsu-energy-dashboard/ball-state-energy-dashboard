import type { CleaningMethod } from "../types/api";

export const BASE_CLEANING_METHOD_OPTIONS: {
  value: CleaningMethod | "";
  label: string;
}[] = [
  { value: "", label: "None (No cleaning)" },
  { value: "Prophet", label: "Prophet (Facebook Prophet)" },
  { value: "Hampel", label: "Hampel Filter" },
  { value: "Polynomial", label: "Polynomial Regression" },
];

export const OVERAGE_CLEANING_METHOD_OPTIONS: {
  value: CleaningMethod;
  label: string;
}[] = [
  { value: "Neural", label: "Neural (NeuralProphet)" },
  { value: "Fencing", label: "Fencing" },
];

export function cleaningMethodOptionsForPlot(
  plotType: string,
): { value: CleaningMethod | ""; label: string }[] {
  if (plotType === "threshold-detection" || plotType === "rpca-analysis") {
    return [...BASE_CLEANING_METHOD_OPTIONS, ...OVERAGE_CLEANING_METHOD_OPTIONS];
  }
  return BASE_CLEANING_METHOD_OPTIONS;
}
