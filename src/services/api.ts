import { samePreviewSource } from "../utils/outlierZapChart";
import {
  keepPreviousData,
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  BaseRequest,
  TimeSeriesResponse,
  SeasonalAnalysisResponse,
  TemperatureAnalysisResponse,
  MeterListResponse,
  DatasetInfoResponse,
  DatasetDownloadUrlsResponse,
  DatasetUploadResponse,
  ForecastResponse,
  ChatRequest,
  ChatResponse,
  EdaResponse,
  OverageThresholdResponse,
  SimpleRpcaResponse,
  OutlierPreviewRequest,
  OutlierPreviewResponse,
} from "../types/api";
import axios from "axios";
import {
  EMPTY_DATASET_INFO,
  EMPTY_METER_LIST,
  isDatasetInfoResponse,
  isMeterListResponse,
} from "../utils/datasetFallbacks";
import { uploadDatasetFiles } from "../utils/datasetUpload";
import type { DatasetUploadPhase, PlotType } from "../types/api";
import {
  analysisQueryKey,
  edaPlotQueryKey,
  outlierPreviewQueryKey,
  overageThresholdQueryKey,
  seasonalAnalysisQueryKey,
  simpleRpcaQueryKey,
  temperatureAnalysisQueryKey,
  timeSeriesQueryKey,
} from "../utils/analysisQueryKeys";
import {
  appendManualOutliersToBody,
  buildSeasonalTemperatureBody,
  type SeasonalTemperatureRequestFields,
} from "../utils/apiManualOutliers";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://0.0.0.0:8000";
const API_URL = `${API_BASE}/api`;

async function fetchMeterListSafe(): Promise<MeterListResponse> {
  try {
    const response = await axios.get(`${API_URL}/meter-list`);
    if (isMeterListResponse(response.data)) {
      return response.data;
    }
    return EMPTY_METER_LIST;
  } catch {
    return EMPTY_METER_LIST;
  }
}

async function fetchDatasetInfoSafe(): Promise<DatasetInfoResponse> {
  try {
    const response = await axios.get(`${API_URL}/dataset/info`);
    if (isDatasetInfoResponse(response.data)) {
      return response.data;
    }
    return EMPTY_DATASET_INFO;
  } catch {
    return EMPTY_DATASET_INFO;
  }
}

export const DATASET_INFO_QUERY_KEY = ["dataset-info"] as const;
export const METER_LIST_QUERY_KEY = ["meter-list"] as const;

export const useTimeSeries = (
  request: BaseRequest,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: timeSeriesQueryKey(request),
    queryFn: async () => {
      const params: BaseRequest = {
        start_date: request.start_date,
        end_date: request.end_date,
        meter: request.meter,
      };

      if (request.smoothing_method) {
        params.smoothing_method = request.smoothing_method;
      }
      if (request.smoothing_window !== undefined) {
        params.smoothing_window = request.smoothing_window;
      }
      if (request.cleaning_method) {
        params.cleaning_method = request.cleaning_method;
      }
      if (request.cleaning_window !== undefined) {
        params.cleaning_window = request.cleaning_window;
      }
      if (request.cleaning_n_sigma !== undefined) {
        params.cleaning_n_sigma = request.cleaning_n_sigma;
      }
      if (request.cleaning_interval_width !== undefined) {
        params.cleaning_interval_width = request.cleaning_interval_width;
      }
      if (request.meters_to_add) {
        // Send as JSON string for complex object
        params.meters_to_add = request.meters_to_add;
      }
      appendManualOutliersToBody(
        params as unknown as Record<string, unknown>,
        request,
      );
      if (request.forecast || request.assessment) {
        params.forecast = request.forecast;
        params.assessment = request.assessment;
        params.test_hours = request.test_hours;
        params.model = request.model;
        if (request.interval_type) {
          params.interval_type = request.interval_type;
        }
        if (request.interval_width !== undefined) {
          params.interval_width = request.interval_width;
        }
        if (request.sarimax_order) {
          params.sarimax_order = request.sarimax_order;
        }
        if (request.sarimax_seasonal_order) {
          params.sarimax_seasonal_order = request.sarimax_seasonal_order;
        }
        if (request.sarimax_trend) {
          params.sarimax_trend = request.sarimax_trend;
        }
        if (request.sarimax_enforce_stationarity !== undefined) {
          params.sarimax_enforce_stationarity =
            request.sarimax_enforce_stationarity;
        }
        if (request.sarimax_enforce_invertibility !== undefined) {
          params.sarimax_enforce_invertibility =
            request.sarimax_enforce_invertibility;
        }
        if (request.sarimax_concentrate_scale !== undefined) {
          params.sarimax_concentrate_scale = request.sarimax_concentrate_scale;
        }
        if (request.sarimax_measurement_error !== undefined) {
          params.sarimax_measurement_error = request.sarimax_measurement_error;
        }
        if (request.sarimax_simple_differencing !== undefined) {
          params.sarimax_simple_differencing =
            request.sarimax_simple_differencing;
        }
        if (request.sarimax_method) {
          params.sarimax_method = request.sarimax_method;
        }
        if (request.sarimax_maxiter !== undefined) {
          params.sarimax_maxiter = request.sarimax_maxiter;
        }
        if (request.sarimax_cov_type) {
          params.sarimax_cov_type = request.sarimax_cov_type;
        }
        if (request.prophet_changepoint_prior_scale !== undefined) {
          params.prophet_changepoint_prior_scale =
            request.prophet_changepoint_prior_scale;
        }
        if (request.prophet_seasonality_prior_scale !== undefined) {
          params.prophet_seasonality_prior_scale =
            request.prophet_seasonality_prior_scale;
        }
        if (request.prophet_holidays_prior_scale !== undefined) {
          params.prophet_holidays_prior_scale =
            request.prophet_holidays_prior_scale;
        }
        if (request.prophet_n_changepoints !== undefined) {
          params.prophet_n_changepoints = request.prophet_n_changepoints;
        }
        if (request.prophet_changepoint_range !== undefined) {
          params.prophet_changepoint_range = request.prophet_changepoint_range;
        }
        if (request.prophet_growth) {
          params.prophet_growth = request.prophet_growth;
        }
        if (request.prophet_weekly_seasonality !== undefined) {
          params.prophet_weekly_seasonality =
            request.prophet_weekly_seasonality;
        }
        if (request.prophet_daily_seasonality !== undefined) {
          params.prophet_daily_seasonality = request.prophet_daily_seasonality;
        }
        if (request.prophet_mcmc_samples !== undefined) {
          params.prophet_mcmc_samples = request.prophet_mcmc_samples;
        }
        if (request.n_lags !== undefined) {
          params.n_lags = request.n_lags;
        }
        if (request.n_forecasts !== undefined) {
          params.n_forecasts = request.n_forecasts;
        }
        if (request.lagged_features?.length) {
          params.lagged_features = request.lagged_features;
        }
        if (request.feature_lags !== undefined) {
          params.feature_lags = request.feature_lags;
        }
        if (request.epochs !== undefined) {
          params.epochs = request.epochs;
        }
        if (request.n_changepoints !== undefined) {
          params.n_changepoints = request.n_changepoints;
        }
        if (request.changepoints_range !== undefined) {
          params.changepoints_range = request.changepoints_range;
        }
        if (request.trend_reg !== undefined) {
          params.trend_reg = request.trend_reg;
        }
        if (request.seasonality_reg !== undefined) {
          params.seasonality_reg = request.seasonality_reg;
        }
        if (request.seasonality_mode) {
          params.seasonality_mode = request.seasonality_mode;
        }
        if (request.yearly_seasonality !== undefined) {
          params.yearly_seasonality = request.yearly_seasonality;
        }
        if (request.ar_reg !== undefined) {
          params.ar_reg = request.ar_reg;
        }
        if (request.learning_rate !== undefined) {
          params.learning_rate = request.learning_rate;
        }
        if (request.batch_size !== undefined) {
          params.batch_size = request.batch_size;
        }
        if (request.newer_samples_weight !== undefined) {
          params.newer_samples_weight = request.newer_samples_weight;
        }
        if (request.features) {
          params.features = request.features;
        }
      }

      const response = await axios.post<TimeSeriesResponse>(
        `${API_URL}/time-series`,
        params,
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useSeasonalAnalysis = (
  request: SeasonalTemperatureRequestFields,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: seasonalAnalysisQueryKey(request),
    queryFn: async () => {
      const body = buildSeasonalTemperatureBody(request);
      const response = await axios.post<SeasonalAnalysisResponse>(
        `${API_URL}/seasonal-analysis`,
        body,
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useMeterList = () => {
  return useQuery({
    queryKey: METER_LIST_QUERY_KEY,
    queryFn: fetchMeterListSafe,
    retry: false,
  });
};

export const useDatasetInfo = () => {
  return useQuery({
    queryKey: DATASET_INFO_QUERY_KEY,
    queryFn: fetchDatasetInfoSafe,
    retry: false,
  });
};

export interface DatasetUploadInput {
  energyCsv?: File | null;
  holidayJson?: File | null;
  onPhase?: (phase: DatasetUploadPhase) => void;
}

export async function uploadDataset(
  input: DatasetUploadInput,
): Promise<DatasetUploadResponse> {
  return uploadDatasetFiles(
    API_URL,
    { energyCsv: input.energyCsv, holidayJson: input.holidayJson },
    input.onPhase,
  );
}

export async function requestDatasetDownloadUrls(): Promise<DatasetDownloadUrlsResponse> {
  const response = await axios.post<DatasetDownloadUrlsResponse>(
    `${API_URL}/dataset/download-urls`,
  );
  return response.data;
}

/** Signed GCS URLs are absolute. Stream mode returns API-relative paths. */
export function resolveDownloadUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

export function useDatasetUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATASET_INFO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: METER_LIST_QUERY_KEY });
    },
  });
}

export const useTemperatureAnalysis = (
  request: SeasonalTemperatureRequestFields,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: temperatureAnalysisQueryKey(request),
    queryFn: async () => {
      const body = buildSeasonalTemperatureBody(request);
      const response = await axios.post<TemperatureAnalysisResponse>(
        `${API_URL}/temperature-analysis`,
        body,
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useForecast = (
  request: BaseRequest,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [
      "forecast",
      request.start_date,
      request.end_date,
      request.meter,
      request.cleaning_method,
      request.cleaning_window,
      request.cleaning_n_sigma,
      request.cleaning_interval_width,
      request.interval_type,
      request.interval_width,
      request.sarimax_order,
      request.sarimax_seasonal_order,
      request.features,
      request.meters_to_add,
    ],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        start_date: request.start_date,
        end_date: request.end_date,
        meter: request.meter,
      };

      if (request.cleaning_method) {
        params.cleaning_method = request.cleaning_method;
      }
      if (request.cleaning_window !== undefined) {
        params.cleaning_window = request.cleaning_window;
      }
      if (request.cleaning_n_sigma !== undefined) {
        params.cleaning_n_sigma = request.cleaning_n_sigma;
      }
      if (request.cleaning_interval_width !== undefined) {
        params.cleaning_interval_width = request.cleaning_interval_width;
      }
      if (request.interval_type) {
        params.interval_type = request.interval_type;
      }
      if (request.interval_width !== undefined) {
        params.interval_width = request.interval_width;
      }
      if (request.sarimax_order) {
        params.sarimax_order = request.sarimax_order;
      }
      if (request.sarimax_seasonal_order) {
        params.sarimax_seasonal_order = request.sarimax_seasonal_order;
      }
      if (request.features) {
        params.features = request.features;
      }
      if (request.meters_to_add) {
        params.meters_to_add = request.meters_to_add;
      }

      const response = await axios.post<ForecastResponse>(
        `${API_URL}/forecast`,
        params,
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useEdaPlot = (
  request: BaseRequest | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: request ? edaPlotQueryKey(request) : ["eda-plot", "disabled"],
    queryFn: async () => {
      if (!request?.eda_route) throw new Error("No EDA route selected");

      const body: Record<string, unknown> = {
        start_date: request.start_date,
        end_date: request.end_date,
        meter: request.meter,
      };

      body.cleaning_method = request.cleaning_method && request.cleaning_method !== "None" ? request.cleaning_method : null;
      if (request.cleaning_window !== undefined)
        body.cleaning_window = request.cleaning_window;
      if (request.cleaning_n_sigma !== undefined)
        body.cleaning_n_sigma = request.cleaning_n_sigma;
      if (request.cleaning_interval_width !== undefined)
        body.cleaning_interval_width = request.cleaning_interval_width;
      if (request.meters_to_add) body.meters_to_add = request.meters_to_add;

      if (
        request.eda_route === "trend-tests" &&
        request.seasonal_periods !== undefined
      ) {
        body.seasonal_periods = request.seasonal_periods;
      }
      if (request.eda_route === "seasonality-tests") {
        if (request.seasonality_periods?.length) {
          body.seasonality_periods = request.seasonality_periods;
        }
        if (request.n_harmonics !== undefined) {
          body.n_harmonics = request.n_harmonics;
        }
        body.use_hac = request.use_hac ?? true;
        if (request.include_kruskal_wallis !== undefined) {
          body.include_kruskal_wallis = request.include_kruskal_wallis;
        }
        if (request.kw_tests?.length) {
          body.kw_tests = request.kw_tests;
        }
      }
      if (request.eda_route === "unit-root-tests") {
        body.unit_root_regression = request.unit_root_regression ?? "c";
        body.include_break_test = request.include_break_test ?? false;
      }
      if (request.eda_route === "seasonal-decompose") {
        if (request.decompose_period !== undefined)
          body.decompose_period = request.decompose_period;
        if (request.decompose_model)
          body.decompose_model = request.decompose_model;
      }
      if (request.eda_route === "autocorr" && request.acf_lags !== undefined) {
        body.acf_lags = request.acf_lags;
      }
      if (request.eda_route === "annotated-timeseries") {
        if (request.smoothing_method)
          body.smoothing_method = request.smoothing_method;
        if (request.smoothing_window !== undefined)
          body.smoothing_window = request.smoothing_window;
        body.annotated = request.annotated ?? true;
      }

      appendManualOutliersToBody(body, request);

      const response = await axios.post<EdaResponse>(
        `${API_URL}/eda/${request.eda_route}`,
        body,
      );
      return response.data;
    },
    enabled: !!request && !!request.eda_route && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 60 * 24,
    placeholderData: keepPreviousData,
  });
};

export const useOverageThreshold = (
  request: BaseRequest | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: request
      ? overageThresholdQueryKey(request)
      : ["overage-threshold", "disabled"],
    queryFn: async () => {
      if (!request) throw new Error("No request provided");

      const body: Record<string, unknown> = {
        start_date: request.start_date.slice(0, 10),
        end_date: request.end_date.slice(0, 10),
        main_meter: request.meter,
        threshold_mode: request.threshold_mode ?? "rpca",
      };

      if (request.meters_to_add) body.meters_to_add = request.meters_to_add;
      if (request.meters?.length) body.meters = request.meters;
      if (request.threshold_mode === "fixed" && request.threshold !== undefined) {
        body.threshold = request.threshold;
      }
      if (request.analysis_window_start) {
        body.analysis_window_start = request.analysis_window_start;
      }
      if (request.analysis_window_end) {
        body.analysis_window_end = request.analysis_window_end;
      }
      if (request.contribution_window_start) {
        body.contribution_window_start = request.contribution_window_start;
      }
      if (request.contribution_window_end) {
        body.contribution_window_end = request.contribution_window_end;
      }
      if (request.plot_window_start) {
        body.plot_window_start = request.plot_window_start;
      }
      if (request.plot_window_end) {
        body.plot_window_end = request.plot_window_end;
      }
      if (request.series_meters?.length) {
        body.series_meters = request.series_meters;
      }
      if (request.contributions_top_n !== undefined) {
        body.contributions_top_n = request.contributions_top_n;
      }
      if (request.event_contributions_top_n !== undefined) {
        body.event_contributions_top_n = request.event_contributions_top_n;
      }
      if (request.contributions_method) {
        body.contributions_method = request.contributions_method;
      }
      if (request.heatmap_normalize !== undefined) {
        body.heatmap_normalize = request.heatmap_normalize;
      }
      if (request.heatmap_top_n !== undefined) {
        body.heatmap_top_n = request.heatmap_top_n;
      }
      if (request.clean_all_meters !== undefined) {
        body.clean_all_meters = request.clean_all_meters;
      }
      body.cleaning_method = request.cleaning_method && request.cleaning_method !== "None" ? request.cleaning_method : null;
      if (request.cleaning_window !== undefined) {
        body.cleaning_window = request.cleaning_window;
      }
      if (request.cleaning_n_sigma !== undefined) {
        body.cleaning_n_sigma = request.cleaning_n_sigma;
      }
      if (request.cleaning_interval_width !== undefined) {
        body.cleaning_interval_width = request.cleaning_interval_width;
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
      if (request.cleaning_max !== undefined) {
        body.cleaning_max = request.cleaning_max;
      }
      if (request.cleaning_min !== undefined) {
        body.cleaning_min = request.cleaning_min;
      }
      if (request.cleaning_order !== undefined) {
        body.cleaning_order = request.cleaning_order;
      }
      if (request.n_thresholds !== undefined) {
        body.n_thresholds = request.n_thresholds;
      }
      if (request.threshold_min !== undefined) {
        body.threshold_min = request.threshold_min;
      }
      if (request.threshold_max !== undefined) {
        body.threshold_max = request.threshold_max;
      }
      if (request.rpca_tol !== undefined) {
        body.rpca_tol = request.rpca_tol;
      }
      if (request.rpca_max_iter !== undefined) {
        body.rpca_max_iter = request.rpca_max_iter;
      }

      appendManualOutliersToBody(body, request);

      const response = await axios.post<OverageThresholdResponse>(
        `${API_URL}/overage/threshold-optimization`,
        body,
      );
      return response.data;
    },
    enabled: !!request && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 60 * 24,
    placeholderData: keepPreviousData,
  });
};

export const useSimpleRpca = (
  request: BaseRequest | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: request ? simpleRpcaQueryKey(request) : ["simple-rpca", "disabled"],
    queryFn: async () => {
      if (!request) throw new Error("No request provided");

      const body: Record<string, unknown> = {
        start_date: request.start_date,
        end_date: request.end_date,
        meter: request.meter || undefined,
        total_meters: request.total_meters?.length ? request.total_meters : undefined,
        threshold: request.threshold ?? 22000,
      };

      if (request.overage_windows?.length) {
        body.overage_windows = request.overage_windows;
      }
      body.cleaning_method = request.cleaning_method && request.cleaning_method !== "None" ? request.cleaning_method : null;
      if (request.cleaning_window !== undefined) {
        body.cleaning_window = request.cleaning_window;
      }
      if (request.cleaning_n_sigma !== undefined) {
        body.cleaning_n_sigma = request.cleaning_n_sigma;
      }
      if (request.cleaning_interval_width !== undefined) {
        body.cleaning_interval_width = request.cleaning_interval_width;
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
      if (request.cleaning_max !== undefined) body.cleaning_max = request.cleaning_max;
      if (request.cleaning_min !== undefined) body.cleaning_min = request.cleaning_min;
      if (request.cleaning_order !== undefined) {
        body.cleaning_order = request.cleaning_order;
      }

      appendManualOutliersToBody(body, request);

      const response = await axios.post<SimpleRpcaResponse>(
        `${API_URL}/rpca/simple`,
        body,
      );
      return response.data;
    },
    enabled: !!request && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 60 * 24,
    placeholderData: keepPreviousData,
  });
};

export const useOutlierPreview = (
  request: OutlierPreviewRequest | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: request
      ? outlierPreviewQueryKey(request)
      : ["outlier-preview", "disabled"],
    queryFn: async () => {
      if (!request) throw new Error("No preview request");
      const response = await axios.post<OutlierPreviewResponse>(
        `${API_URL}/cleaning/outlier-preview`,
        request,
      );
      return response.data;
    },
    enabled: !!request && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
    // Zap edits refresh the overlay in the background; meter/date changes need fresh data.
    placeholderData: (previousData, previousQuery) =>
      request && previousQuery && samePreviewSource(previousQuery.queryKey, outlierPreviewQueryKey(request))
        ? previousData
        : undefined,
  });
};

/** True while the active plot type's analysis query is in flight. */
export function useAnalysisFetching(
  plotType: PlotType,
  request: BaseRequest | null,
): boolean {
  const queryKey = analysisQueryKey(plotType, request);
  const fetchingCount = useIsFetching({
    queryKey: queryKey ?? ["analysis", "idle"],
    exact: true,
  });
  return !!queryKey && fetchingCount > 0;
}

export async function sendChatMessage(
  request: ChatRequest,
): Promise<ChatResponse> {
  const response = await axios.post<ChatResponse>(`${API_URL}/chat`, request);
  return response.data;
}
