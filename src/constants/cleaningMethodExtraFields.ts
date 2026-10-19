import type { BaseRequest } from "../types/api";

/** Cleaning method keys that can have extra form fields. */
export type CleaningMethodKey =
  | "Prophet"
  | "Hampel"
  | "Polynomial"
  | "Neural"
  | "Fencing"
  | "None";

/** Config for one extra input (e.g. window, n_sigma). Add more keys to BaseRequest and here to support new fields. */
export interface CleaningExtraFieldConfig {
  key: keyof Pick<
    BaseRequest,
    "cleaning_window" | "cleaning_n_sigma" | "cleaning_interval_width"
  >;
  label: string;
  min: number;
  max: number;
  default: number;
  step?: number;
  hint?: string;
}

/** Extra form fields per cleaning method. Add entries here to support more methods or fields. */
export const CLEANING_METHOD_EXTRA_FIELDS: Partial<
  Record<CleaningMethodKey, CleaningExtraFieldConfig[]>
> = {
  Prophet: [
    {
      key: "cleaning_interval_width",
      label: "Interval Width",
      min: 0,
      max: 1,
      default: 0.8,
      step: 0.01,
      hint: "Confidence interval width (0 to 1)",
    },
  ],
  Hampel: [
    {
      key: "cleaning_window",
      label: "Window",
      min: 1,
      max: 100,
      default: 12,
      hint: "Window size",
    },
    {
      key: "cleaning_n_sigma",
      label: "n_sigma",
      min: 1,
      max: 10,
      default: 3,
      step: 0.1,
      hint: "Sigma multiplier",
    },
  ],
  Polynomial: [
    {
      key: "cleaning_window",
      label: "Window",
      min: 1,
      max: 100,
      default: 12,
      hint: "Window size",
    },
    {
      key: "cleaning_n_sigma",
      label: "n_sigma",
      min: 1,
      max: 10,
      default: 3,
      step: 0.1,
      hint: "Sigma multiplier",
    },
  ],
  Neural: [
    {
      key: "cleaning_window",
      label: "Window",
      min: 1,
      max: 100,
      default: 12,
      hint: "Window size",
    },
    {
      key: "cleaning_n_sigma",
      label: "n_sigma",
      min: 1,
      max: 10,
      default: 3.3,
      step: 0.1,
      hint: "Sigma multiplier",
    },
  ],
};
