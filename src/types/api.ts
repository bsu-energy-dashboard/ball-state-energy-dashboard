// API Request Types
export interface EnergyPredictionRequest {
  start_date: string;
  end_date: string;
  BreaksWeather: [boolean, boolean, boolean, boolean]; // [holidays, summer_break, in_session, weather]
}

// API Response Types
export interface WeatherData {
  date: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  cloud_cover: number;
}

export interface HolidayData {
  date: string;
  holiday_name: string;
  is_not_holiday: boolean;
}

export interface SummerBreakData {
  date: string;
  is_not_summer_break: boolean;
}

export interface InSessionData {
  date: string;
  in_session: boolean;
}

export interface EnergyPredictionData {
  date: string;
  predicted_consumption: number;
  actual_consumption?: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
}

export interface EnergyPredictionResponse {
  predictions: EnergyPredictionData[];
  weather_data: WeatherData[];
  holiday_data: HolidayData[];
  summer_break_data: SummerBreakData[];
  in_session_data: InSessionData[];
  metadata: {
    model_version: string;
    generated_at: string;
    data_points: number;
  };
}

// UI State Types
export interface DashboardState {
  isLoading: boolean;
  error: string | null;
  data: EnergyPredictionResponse | null;
  parameters: EnergyPredictionRequest;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export type CleaningMethod =
  | "Prophet"
  | "Hampel"
  | "Polynomial"
  | "Neural"
  | "Fencing"
  | "None";

export type OutlierZapMode = "none" | "this_tab" | "from_storage";

export interface ManualOutlierApplied {
  meter: string;
  datetime: string;
  value_before: number;
  value_after: number;
  source: "manual";
}

export interface ManualOutlierSkipped {
  meter: string;
  datetime: string;
  reason: string;
}

export interface ManualOutlierAuditFields {
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}

export interface OutlierPreviewSeriesPoint {
  datetime: string;
  value: number;
}

export interface OutlierPreviewStats {
  min: number;
  max: number;
  p99: number;
  count: number;
}

export interface OutlierPreviewRequest {
  start_date: string;
  end_date: string;
  meter: string;
  meters_to_add?: Record<string, string[]>;
  manual_outliers?: Record<string, string[]>;
  manual_outlier_replacement?: "average" | "zero";
  cleaning_method?: CleaningMethod | null;
  cleaning_window?: number;
  cleaning_n_sigma?: number;
  cleaning_interval_width?: number;
  cleaning_max?: number;
  cleaning_min?: number;
  cleaning_order?: number;
  cleaning_daily?: boolean;
  cleaning_weekly?: boolean;
  cleaning_imputem?: boolean;
  include_cleaned_preview?: boolean;
}

export interface OutlierPreviewResponse {
  success: boolean;
  meter: string;
  date_range: TimeSeriesDateRange & { row_count?: number };
  series: OutlierPreviewSeriesPoint[];
  stats: OutlierPreviewStats;
  manual_outliers_requested: string[];
  manual_outliers_applied: ManualOutlierApplied[];
  manual_outliers_skipped: ManualOutlierSkipped[];
  auto_outliers: unknown[];
  cleaned_preview?: OutlierPreviewSeriesPoint[];
}

export interface BaseRequest {
  start_date: string;
  end_date: string;
  meter: string;
  smoothing_method?: "ma" | "hp";
  smoothing_window?: number;
  cleaning_method?: CleaningMethod;
  /** Used by Hampel and Polynomial cleaning. Default 12. */
  cleaning_window?: number;
  /** Used by Hampel and Polynomial cleaning. Default 3. */
  cleaning_n_sigma?: number;
  /** Used by Prophet cleaning method. Range: 0 to 1. */
  cleaning_interval_width?: number;
  /** Overage / per-meter cleaning. Default false. */
  cleaning_daily?: boolean;
  cleaning_weekly?: boolean;
  cleaning_imputem?: boolean;
  cleaning_max?: number;
  cleaning_min?: number;
  cleaning_order?: number;
  meters_to_add?: Record<string, string[]>; // e.g., {'totalfoundation':['FOUNDATIONAL_SCIENCE-FBPM7','FOUNDATIONAL_SCIENCE-FBPM17']}
  forecast?: boolean;
  assessment?: boolean;
  test_hours?: number;
  model?: "Prophet" | "SARIMAX" | "NeuralProphet";
  /** Forecast interval type (used when forecast=true). */
  interval_type?: "two-sided" | "upper-bounded" | "lower-bounded";
  /** Forecast interval width (used when forecast=true). Range: 0 to 1. */
  interval_width?: number;
  /** SARIMAX order (p,d,q) when model is SARIMAX. */
  sarimax_order?: [number, number, number];
  /** SARIMAX seasonal order (P,D,Q,s) when model is SARIMAX. */
  sarimax_seasonal_order?: [number, number, number, number];
  /** SARIMAX deterministic trend: n, c, t, or ct. Omit for none. */
  sarimax_trend?: "n" | "c" | "t" | "ct";
  sarimax_enforce_stationarity?: boolean;
  sarimax_enforce_invertibility?: boolean;
  sarimax_concentrate_scale?: boolean;
  sarimax_measurement_error?: boolean;
  sarimax_simple_differencing?: boolean;
  sarimax_method?: "lbfgs" | "nm" | "powell" | "bfgs" | "cg";
  sarimax_maxiter?: number;
  sarimax_cov_type?: "opg" | "oim" | "robust";
  /** Prophet trend flexibility. Default 0.05. */
  prophet_changepoint_prior_scale?: number;
  prophet_seasonality_prior_scale?: number;
  prophet_holidays_prior_scale?: number;
  prophet_n_changepoints?: number;
  prophet_changepoint_range?: number;
  prophet_growth?: "linear" | "logistic" | "flat";
  prophet_weekly_seasonality?: boolean | number;
  prophet_daily_seasonality?: boolean | number;
  prophet_mcmc_samples?: number;
  /** NeuralProphet lookback window in hours. */
  n_lags?: number;
  /** NeuralProphet number of future steps predicted per iteration. */
  n_forecasts?: number;
  /** NP: past-value regressors (may overlap with features). */
  lagged_features?: string[];
  /** NP: per lagged feature lag count; number applies to all, or map by name. */
  feature_lags?: number | Record<string, number>;
  /** NP: training epochs; omit for automatic by data size. */
  epochs?: number;
  n_changepoints?: number;
  changepoints_range?: number;
  trend_reg?: number;
  seasonality_reg?: number;
  seasonality_mode?: "additive" | "multiplicative";
  yearly_seasonality?: "auto" | boolean | number;
  /** NP: AR sparsity regularization; omit when off. */
  ar_reg?: number;
  learning_rate?: number;
  batch_size?: number;
  newer_samples_weight?: number;
  /** List of feature columns used for modeling. */
  features?: string[];
  // EDA-specific fields
  eda_route?: EdaRoute;
  /** trend-tests: number of seasons per period. Default 24. */
  seasonal_periods?: number;
  /** seasonality-tests: seasonal periods in hours. Default [24, 168]. */
  seasonality_periods?: number[];
  /** seasonality-tests: harmonics per period (int shared or dict by period). */
  n_harmonics?: number | Record<string, number>;
  /** seasonality-tests: Newey-West HAC in harmonic F-test. Default true. */
  use_hac?: boolean;
  /** seasonality-tests: run Kruskal-Wallis per period when kw_tests omitted. Default true. */
  include_kruskal_wallis?: boolean;
  /** seasonality-tests: explicit K-W specs (overrides auto list when set). */
  kw_tests?: KruskalWallisTestSpec[];
  /** unit-root-tests: ADF/KPSS regression. Default "c". */
  unit_root_regression?: "c" | "ct";
  /** unit-root-tests: include Zivot-Andrews break test. Default false. */
  include_break_test?: boolean;
  /** seasonal-decompose: decomposition period. Default 24. */
  decompose_period?: number;
  /** seasonal-decompose: model type. Default "additive". */
  decompose_model?: "additive" | "multiplicative";
  /** autocorr: number of ACF lags. Default 168. */
  acf_lags?: number;
  /** annotated-timeseries: shade covariate regions. Default true. */
  annotated?: boolean;
  // Overage threshold fields
  threshold_mode?: "rpca" | "fixed";
  threshold?: number;
  /** RPCA decomposition columns (included meters). */
  meters?: string[];
  /** Simple Campus RPCA total source columns. */
  total_meters?: string[];
  /** Simple Campus RPCA overage ranges highlighted on plots. */
  overage_windows?: { start: string; end: string }[];
  analysis_window_start?: string;
  analysis_window_end?: string;
  contribution_window_start?: string;
  contribution_window_end?: string;
  plot_window_start?: string;
  plot_window_end?: string;
  series_meters?: string[];
  contributions_top_n?: number;
  event_contributions_top_n?: number;
  contributions_method?: "sparse" | "raw";
  heatmap_normalize?: boolean;
  heatmap_top_n?: number;
  clean_all_meters?: boolean;
  n_thresholds?: number;
  threshold_min?: number;
  threshold_max?: number;
  rpca_tol?: number;
  rpca_max_iter?: number;
  manual_outliers?: Record<string, string[]>;
  manual_outlier_replacement?: "average" | "zero";
  outlierZapMode?: OutlierZapMode;
}

/** Chatbot: provider-agnostic messages to/from backend `/api/chat`. */
export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  session_id?: string;
  provider?: "ollama" | "gemini";
  model?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  session_id?: string;
}

interface TimeSeriesStatistics {
  mean: number;
  count: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q50: number;
  q75: number;
}
export interface AssessmentMetrics {
  test_hours: number;
  mse: number;
  rmse: number;
  mae: number;
  mape: number | null;
  n_points: number;
}
interface TimeSeriesDateRange {
  start: string;
  end: string;
  actual_start: string;
  actual_end: string;
}
interface TimeSeriesData {
  date: string;
  smoothed: number | null;
  [key: string]: string | number | null;
}
interface Holiday {
  name: string;
  start: string;
  end: string;
}
interface Annotation {
  start: string;
  end: string;
  label: string;
}
export interface Outlier {
  datetime: string;
  value: number;
}

export interface TimeSeriesResponse {
  success?: boolean;
  meter: string;
  statistics: TimeSeriesStatistics;
  date_range: TimeSeriesDateRange;
  time_series?: TimeSeriesData[];
  forecast_time_series?: ForecastData[];
  holiday: Holiday[];
  annotations?: Annotation[];
  count?: string;
  zero_counts?: string | [];
  missing_counts?: MissingCounts[];
  outliers?: Outlier[];
  assessment?: AssessmentMetrics;
  assessment_plot_png_base64?: string;
  forecast_plot_png_base64?: string;
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}

export interface MissingCounts {
  meter_name: string;
  number_of_missing: number;
  missing_indices: string[];
}

interface SeasonalAnalysisData extends TimeSeriesStatistics {
  season: string;
  session_status: string;
}
interface TemperatureAnalysisData extends Omit<SeasonalAnalysisData, "season"> {
  temp_bin: string;
}
export interface SeasonalAnalysisResponse {
  success?: boolean;
  meter: string;
  date_range: TimeSeriesDateRange;
  boxplot_data: SeasonalAnalysisData[];
  plot_png_base64?: string;
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}

export interface TemperatureAnalysisResponse {
  success?: boolean;
  meter: string;
  date_range: TimeSeriesDateRange;
  boxplot_data: TemperatureAnalysisData[];
  plot_png_base64?: string;
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}
// EDA Routes
export type EdaRoute =
  | "trend-tests"
  | "seasonality-tests"
  | "unit-root-tests"
  | "seasonal-decompose"
  | "autocorr"
  | "annotated-timeseries";

export interface KruskalWallisTestSpec {
  period: number;
  aggregate?: number | null;
  aggfunc?: "mean" | "sum" | "median";
}

// EDA Response Types
export interface EdaTrendTestResult {
  trend: string;
  h: boolean;
  p: number;
  z: number;
  tau: number;
  s: number;
  var_s: number;
  slope: number;
  intercept: number;
}

export interface EdaTrendTestsResponse {
  success: boolean;
  meter: string;
  date_range: { start: string; end: string };
  count: Record<string, unknown>;
  trend_tests: {
    mann_kendall: EdaTrendTestResult;
    seasonal_kendall: EdaTrendTestResult;
    seasonal_periods: number;
    n_points: number;
  };
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}

export interface EdaPlotResponse {
  success: boolean;
  meter: string;
  plot_png_base64: string;
  [key: string]: unknown;
}

export interface EdaHarmonicTestResult {
  F: number;
  p_value: number;
  df_num: number;
  df_denom: number;
  n_harmonics: number;
  hac_robust: boolean;
  significant_at_0_05: boolean;
}

export interface EdaOcsbPeriodResult {
  D: number;
  stochastic_seasonality: boolean;
}

export type EdaOcsbResponse =
  | { error: string }
  | Record<string, EdaOcsbPeriodResult>;

export interface EdaKruskalWallisResult {
  period: number;
  aggregate: number | null;
  aggfunc: string | null;
  n_groups: number;
  H: number;
  p_value: number;
  significant_at_0_05: boolean;
  skipped?: boolean;
  reason?: string;
}

export interface EdaSeasonalityTestsPayload {
  periods: number[];
  harmonic_tests: Record<string, EdaHarmonicTestResult>;
  kruskal_wallis?: EdaKruskalWallisResult[];
  ocsb: EdaOcsbResponse;
  n_points: number;
  use_hac: boolean;
}

export interface EdaSeasonalityTestsResponse {
  success: boolean;
  meter: string;
  date_range?: { start: string; end: string };
  seasonality_tests: EdaSeasonalityTestsPayload;
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}

export interface EdaUnitRootTestDetail {
  statistic: number;
  p_value: number;
  lags: number;
  n_obs?: number;
  critical_values: Record<string, number>;
  rejects_null: boolean;
  null: string;
}

export interface EdaZivotAndrewsResult {
  statistic: number;
  p_value: number;
  lags: number;
  break_index: number;
  break_time: string;
  rejects_null: boolean;
  null: string;
}

export interface EdaUnitRootTestsPayload {
  regression: string;
  n_points: number;
  adf: EdaUnitRootTestDetail;
  kpss: EdaUnitRootTestDetail;
  conclusion: string;
  diagnosis: string;
  zivot_andrews?: EdaZivotAndrewsResult;
}

export interface EdaUnitRootTestsResponse {
  success: boolean;
  meter: string;
  date_range?: { start: string; end: string };
  count?: Record<string, unknown>;
  unit_root_tests: EdaUnitRootTestsPayload;
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}

export type EdaResponse =
  | EdaTrendTestsResponse
  | EdaSeasonalityTestsResponse
  | EdaUnitRootTestsResponse
  | EdaPlotResponse;

// Overage threshold response types
export interface OverageSummary {
  data_hours: number;
  data_meters: number;
  data_start: string;
  data_end: string;
  main_meter: string;
  threshold: number;
  lambda: number;
  mu: number;
  converged: boolean;
  iterations: number;
  final_delta: number;
  rank_l: number;
  s_nonzero_share: number;
  overage_hours: number;
  overage_event_count: number;
}

export interface OverageEvent {
  start: string;
  end: string;
  duration_hours: number;
  peak: number;
  total_exceedance: number;
}

export interface OverageContribution {
  meter: string;
  contribution: number;
  method: string;
}

export interface EventContribution {
  event_start: string;
  event_end: string;
  duration_hours: number;
  total_exceedance: number;
  rank: number;
  meter: string;
  contribution: number;
}

export interface ThresholdSweepPoint {
  threshold: number;
  n_overage_hours: number;
  n_events: number;
}

export interface ThresholdOptimization {
  recommended_threshold: number;
  selection_method: string;
  threshold_range: { min: number; max: number; n_thresholds: number };
  percentile_thresholds: { p90: number; p95: number; p99: number };
  threshold_sweep: ThresholdSweepPoint[];
}

export interface OverageThresholdResponse {
  success: boolean;
  main_meter: string;
  threshold_mode: "rpca" | "fixed";
  threshold: number;
  analysis_window: { start: string; end: string };
  date_range: { start: string; end: string };
  meters: string[];
  summary: OverageSummary;
  overage_events: OverageEvent[];
  contributions: OverageContribution[];
  event_contributions: EventContribution[];
  heatmap_plot_png_base64: string;
  series_plot_png_base64: string;
  threshold_optimization?: ThresholdOptimization;
  threshold_sweep_plot_png_base64?: string;
  manual_outliers_applied?: ManualOutlierApplied[];
  manual_outliers_skipped?: ManualOutlierSkipped[];
}

export interface SimpleRpcaSummary {
  data_hours: number;
  data_meters: number;
  data_start: string;
  data_end: string;
  meter: string;
  threshold: number;
  total_source_meter_count: number;
  overage_hours: number | null;
  valid_total_hours: number;
  missing_total_hours: number;
  excluded_empty_meters: string[];
  imputed_value_count: number;
  overage_window_count: number;
  converged: boolean;
  iterations: number;
  final_delta: number;
}

export interface SimpleRpcaResponse {
  warnings?: string[];
  success: boolean;
  meter: string;
  threshold: number;
  date_range: { start: string; end: string };
  total_meters: string[];
  overage_windows: { start: string; end: string }[];
  summary: SimpleRpcaSummary;
  heatmap_plot_png_base64: string;
  series_plot_png_base64: string;
  overage_plot_png_base64: string;
}

// Plot Types
export type PlotType =
  | "usage-history"
  | "time-series"
  | "forecast"
  | "seasonal-analysis"
  | "temperature-analysis"
  | "eda-plots"
  | "rpca-analysis"
  | "threshold-detection";

export type FormField =
  | "start_date"
  | "end_date"
  | "meter"
  | "smoothing_method"
  | "smoothing_window"
  | "cleaning_method";

export interface PlotTypeConfig {
  id: PlotType;
  label: string;
  description: string;
  available: boolean;
  fields: FormField[];
}

export interface MeterListResponse {
  success?: boolean;
  meters: string[];
  time_range: Pick<TimeSeriesDateRange, "start" | "end">;
}

export interface DatasetInfoResponse {
  success?: boolean;
  csv_path?: string;
  meters: string[];
  time_range: Pick<TimeSeriesDateRange, "start" | "end">;
  holiday_keys: string[];
  meter_count?: number;
}

export interface StoredManualOutliers {
  version: 1;
  savedAt: string;
  savedFromTab: PlotType;
  startDate: string;
  endDate: string;
  cleaningMethod: string | null;
  manual_outlier_replacement?: "average" | "zero";
  manual_outliers: Record<string, string[]>;
}

export interface DatasetUploadUrlsResponse {
  csv_upload_url: string;
  holiday_upload_url: string;
}

export interface DatasetDownloadUrlsResponse {
  success: boolean;
  mode: "signed" | "stream";
  bucket?: string | null;
  csv_download_url: string;
  holiday_download_url: string;
  csv_filename: string;
  holiday_filename: string;
  expires_in_seconds: number | null;
  instructions?: string;
}

export interface DatasetUploadResponse {
  success: boolean;
  message?: string;
  meters?: string[];
  time_range?: Pick<TimeSeriesDateRange, "start" | "end">;
  holiday_keys?: string[];
}

export type DatasetUploadPhase =
  | "multipart"
  | "requesting-urls"
  | "uploading-csv"
  | "uploading-holiday"
  | "confirming";

export interface ForecastData {
  date: string;
  trend: number;
  yhat_lower: number;
  yhat_upper: number;
  trend_lower: number;
  trend_upper: number;
  IsNotHoliday: number;
  IsNotHoliday_lower: number;
  IsNotHoliday_upper: number;
  IsnotSummerBreak: number;
  IsnotSummerBreak_lower: number;
  IsnotSummerBreak_upper: number;
  additive_terms: number;
  additive_terms_lower: number;
  additive_terms_upper: number;
  daily: number;
  daily_lower: number;
  daily_upper: number;
  extra_regressors_additive: number;
  extra_regressors_additive_lower: number;
  extra_regressors_additive_upper: number;
  is_not_weekend: number;
  is_not_weekend_lower: number;
  is_not_weekend_upper: number;
  weather: number;
  weather_lower: number;
  weather_upper: number;
  weekly: number;
  weekly_lower: number;
  weekly_upper: number;
  multiplicative_terms: number;
  multiplicative_terms_lower: number;
  multiplicative_terms_upper: number;
  yhat?: number;
  yhat_upper_ub?: number;
  yhat_lower_lb?: number;
  y?: number; // actual value if available
}

export interface ForecastResponse {
  success?: boolean;
  meter: string;
  statistics: TimeSeriesStatistics;
  date_range: TimeSeriesDateRange;
  forecast_data: ForecastData[];
  holiday?: Holiday[];
}
