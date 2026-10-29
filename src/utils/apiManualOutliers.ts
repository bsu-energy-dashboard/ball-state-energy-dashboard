import type { BaseRequest } from "../types/api";

export type SeasonalTemperatureRequestFields = Pick<
  BaseRequest,
  | "start_date"
  | "end_date"
  | "meter"
  | "meters_to_add"
  | "cleaning_method"
  | "cleaning_window"
  | "cleaning_n_sigma"
  | "cleaning_interval_width"
  | "cleaning_max"
  | "cleaning_min"
  | "cleaning_order"
  | "cleaning_daily"
  | "cleaning_weekly"
  | "cleaning_imputem"
  | "manual_outliers"
  | "manual_outlier_replacement"
  | "outlierZapMode"
>;

/** Build POST body for seasonal/temperature analysis (shared request shape). */
export function buildSeasonalTemperatureBody(
  request: SeasonalTemperatureRequestFields,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    start_date: request.start_date,
    end_date: request.end_date,
    meter: request.meter,
  };
  if (request.meters_to_add) body.meters_to_add = request.meters_to_add;
  if (request.cleaning_method) body.cleaning_method = request.cleaning_method;
  if (request.cleaning_window !== undefined) {
    body.cleaning_window = request.cleaning_window;
  }
  if (request.cleaning_n_sigma !== undefined) {
    body.cleaning_n_sigma = request.cleaning_n_sigma;
  }
  if (request.cleaning_interval_width !== undefined) {
    body.cleaning_interval_width = request.cleaning_interval_width;
  }
  if (request.cleaning_max !== undefined) body.cleaning_max = request.cleaning_max;
  if (request.cleaning_min !== undefined) body.cleaning_min = request.cleaning_min;
  if (request.cleaning_order !== undefined) {
    body.cleaning_order = request.cleaning_order;
  }
  if (request.cleaning_daily !== undefined) {
    body.cleaning_daily = request.cleaning_daily;
  }
  if (request.cleaning_weekly !== undefined) {
    body.cleaning_weekly = request.cleaning_weekly;
  }
  if (request.cleaning_imputem !== undefined) {
    body.cleaning_imputem = request.cleaning_imputem;
  }
  appendManualOutliersToBody(body, request);
  return body;
}

/** Attach manual_outliers to a POST body when zap mode is active. */
export function appendManualOutliersToBody(
  body: Record<string, unknown>,
  request: Pick<BaseRequest, "outlierZapMode" | "manual_outliers" | "manual_outlier_replacement">,
): void {
  if (
    request.outlierZapMode &&
    request.outlierZapMode !== "none" &&
    request.manual_outliers &&
    Object.keys(request.manual_outliers).length > 0
  ) {
    body.manual_outliers = request.manual_outliers;
    body.manual_outlier_replacement = request.manual_outlier_replacement ?? "average";
  }
}

export function manualOutliersKeyPart(
  request: Pick<BaseRequest, "outlierZapMode" | "manual_outliers" | "manual_outlier_replacement">,
): unknown {
  if (!request.outlierZapMode || request.outlierZapMode === "none") {
    return null;
  }
  return [request.manual_outliers ?? null, request.manual_outlier_replacement ?? "average"];
}
