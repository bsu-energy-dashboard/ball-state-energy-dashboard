import type { BaseRequest, OutlierPreviewRequest, PlotType } from "../types/api";
import { manualOutliersKeyPart } from "./apiManualOutliers";

export function timeSeriesQueryKey(request: BaseRequest) {
  return [
    "time-series",
    request.start_date,
    request.end_date,
    request.meter,
    request.smoothing_method,
    request.smoothing_window,
    request.cleaning_method,
    request.cleaning_window,
    request.cleaning_n_sigma,
    request.cleaning_interval_width,
    request.meters_to_add,
    request.forecast,
    request.assessment,
    request.test_hours,
    request.model,
    request.interval_type,
    request.interval_width,
    request.sarimax_order,
    request.sarimax_seasonal_order,
    request.sarimax_trend,
    request.sarimax_enforce_stationarity,
    request.sarimax_enforce_invertibility,
    request.sarimax_concentrate_scale,
    request.sarimax_measurement_error,
    request.sarimax_simple_differencing,
    request.sarimax_method,
    request.sarimax_maxiter,
    request.sarimax_cov_type,
    request.prophet_changepoint_prior_scale,
    request.prophet_seasonality_prior_scale,
    request.prophet_holidays_prior_scale,
    request.prophet_n_changepoints,
    request.prophet_changepoint_range,
    request.prophet_growth,
    request.prophet_weekly_seasonality,
    request.prophet_daily_seasonality,
    request.prophet_mcmc_samples,
    request.n_lags,
    request.n_forecasts,
    request.lagged_features,
    request.feature_lags,
    request.epochs,
    request.n_changepoints,
    request.changepoints_range,
    request.trend_reg,
    request.seasonality_reg,
    request.seasonality_mode,
    request.yearly_seasonality,
    request.ar_reg,
    request.learning_rate,
    request.batch_size,
    request.newer_samples_weight,
    request.features,
    manualOutliersKeyPart(request),
    request.outlierZapMode,
  ] as const;
}

export function seasonalAnalysisQueryKey(
  request: Pick<
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
    | "outlierZapMode"
  >,
) {
  return [
    "seasonal-analysis",
    request.start_date,
    request.end_date,
    request.meter,
    request.meters_to_add,
    request.cleaning_method,
    request.cleaning_window,
    request.cleaning_n_sigma,
    request.cleaning_interval_width,
    request.cleaning_max,
    request.cleaning_min,
    request.cleaning_order,
    request.cleaning_daily,
    request.cleaning_weekly,
    request.cleaning_imputem,
    manualOutliersKeyPart(request),
    request.outlierZapMode,
  ] as const;
}

export function temperatureAnalysisQueryKey(
  request: Pick<
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
    | "outlierZapMode"
  >,
) {
  return [
    "temperature-analysis",
    request.start_date,
    request.end_date,
    request.meter,
    request.meters_to_add,
    request.cleaning_method,
    request.cleaning_window,
    request.cleaning_n_sigma,
    request.cleaning_interval_width,
    request.cleaning_max,
    request.cleaning_min,
    request.cleaning_order,
    request.cleaning_daily,
    request.cleaning_weekly,
    request.cleaning_imputem,
    manualOutliersKeyPart(request),
    request.outlierZapMode,
  ] as const;
}

export function edaPlotQueryKey(request: BaseRequest) {
  return [
    "eda-plot",
    request.eda_route,
    request.start_date,
    request.end_date,
    request.meter,
    request.meters_to_add,
    request.cleaning_method,
    request.cleaning_window,
    request.cleaning_n_sigma,
    request.cleaning_interval_width,
    request.seasonal_periods,
    request.seasonality_periods,
    request.n_harmonics,
    request.use_hac,
    request.include_kruskal_wallis,
    request.kw_tests,
    request.unit_root_regression,
    request.include_break_test,
    request.decompose_period,
    request.decompose_model,
    request.acf_lags,
    request.smoothing_method,
    request.smoothing_window,
    request.annotated,
    manualOutliersKeyPart(request),
    request.outlierZapMode,
  ] as const;
}

export function overageThresholdQueryKey(request: BaseRequest) {
  return [
    "overage-threshold",
    request.start_date,
    request.end_date,
    request.meter,
    request.meters_to_add,
    request.cleaning_method,
    request.cleaning_window,
    request.cleaning_n_sigma,
    request.cleaning_interval_width,
    request.cleaning_daily,
    request.cleaning_weekly,
    request.cleaning_imputem,
    request.cleaning_max,
    request.cleaning_min,
    request.cleaning_order,
    request.threshold_mode,
    request.threshold,
    request.meters,
    request.analysis_window_start,
    request.analysis_window_end,
    request.contribution_window_start,
    request.contribution_window_end,
    request.plot_window_start,
    request.plot_window_end,
    request.series_meters,
    request.contributions_top_n,
    request.event_contributions_top_n,
    request.contributions_method,
    request.heatmap_normalize,
    request.heatmap_top_n,
    request.clean_all_meters,
    request.n_thresholds,
    request.threshold_min,
    request.threshold_max,
    request.rpca_tol,
    request.rpca_max_iter,
    manualOutliersKeyPart(request),
    request.outlierZapMode,
  ] as const;
}

export function simpleRpcaQueryKey(request: BaseRequest) {
  return [
    "simple-rpca",
    request.start_date,
    request.end_date,
    request.meter,
    request.total_meters,
    request.threshold,
    request.overage_windows,
    request.cleaning_method,
    request.cleaning_window,
    request.cleaning_n_sigma,
    request.cleaning_interval_width,
    request.cleaning_daily,
    request.cleaning_weekly,
    request.cleaning_imputem,
    request.cleaning_max,
    request.cleaning_min,
    request.cleaning_order,
    manualOutliersKeyPart(request),
    request.outlierZapMode,
  ] as const;
}

export function outlierPreviewQueryKey(request: OutlierPreviewRequest) {
  return [
    "outlier-preview",
    request.start_date,
    request.end_date,
    request.meter,
    request.meters_to_add,
    request.manual_outliers,
    request.cleaning_method,
    request.cleaning_window,
    request.cleaning_n_sigma,
    request.cleaning_interval_width,
    request.cleaning_max,
    request.cleaning_min,
    request.cleaning_order,
    request.cleaning_daily,
    request.cleaning_weekly,
    request.cleaning_imputem,
    request.include_cleaned_preview,
  ] as const;
}

export function analysisQueryKey(
  plotType: PlotType,
  request: BaseRequest | null,
): readonly unknown[] | null {
  if (!request) return null;

  switch (plotType) {
    case "usage-history":
    case "time-series":
    case "forecast":
      return timeSeriesQueryKey(request);
    case "seasonal-analysis":
      return seasonalAnalysisQueryKey(request);
    case "temperature-analysis":
      return temperatureAnalysisQueryKey(request);
    case "eda-plots":
      return request.eda_route ? edaPlotQueryKey(request) : null;
    case "rpca-analysis":
      return simpleRpcaQueryKey(request);
    case "threshold-detection":
      return overageThresholdQueryKey(request);
    default:
      return null;
  }
}
