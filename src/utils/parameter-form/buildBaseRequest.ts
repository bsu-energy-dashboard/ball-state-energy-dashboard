import { toast } from "react-toastify";
import type {
  BaseRequest,
  CleaningMethod,
  FormField,
  KruskalWallisTestSpec,
  PlotType,
} from "../../types/api";
import type { MeterGroup } from "../../types/parameterForm";
import type { ParameterFormBindings } from "../../components/parameter-form/types";
import { CLEANING_METHOD_EXTRA_FIELDS } from "../../constants/cleaningMethodExtraFields";
import { parseSeasonalityPeriodsText } from "./edaJsonSync";
import { parseOptionalNumber } from "./parseOptionalNumber";
import { sliceDateOnly } from "../../constants/thresholdDefaults";
import {
  mergeManualOutliersForOverage,
  pruneOutliersOutsideRange,
} from "../manualOutliersStorage";
import {
  resolveProphetBoolSeasonality,
  resolveYearlySeasonality,
} from "./seasonalityResolvers";

function isRpcaWorkflow(plotType: PlotType): boolean {
  return plotType === "threshold-detection" || plotType === "rpca-analysis";
}

export type BuildResult =
  | { ok: true; params: BaseRequest }
  | { ok: false };

interface BuildBaseRequestArgs {
  state: ParameterFormBindings;
  selectedPlotType: PlotType;
  shouldShowField: (field: FormField) => boolean;
  meterGroups: MeterGroup[];
  datasetId?: string;
}

export function buildBaseRequest({
  state,
  selectedPlotType,
  shouldShowField,
  meterGroups,
  datasetId = "",
}: BuildBaseRequestArgs): BuildResult {
  if (!state.startDate || !state.endDate) {
    toast.error("Please select both start and end dates");
    return { ok: false };
  }

  if (new Date(state.startDate) > new Date(state.endDate)) {
    toast.error("Start date must be before or equal to end date");
    return { ok: false };
  }

  const params: BaseRequest = {
    start_date: state.startDate,
    end_date: state.endDate,
    meter: state.meter,
  };

  if (shouldShowField("cleaning_method") && state.cleaningMethod) {
    params.cleaning_method = state.cleaningMethod as CleaningMethod;
    const extraFields = CLEANING_METHOD_EXTRA_FIELDS[params.cleaning_method];
    if (extraFields?.length) {
      for (const f of extraFields) {
        const v = state.cleaningExtra[f.key];
        if (typeof v === "number" && !Number.isNaN(v)) {
          if (f.key === "cleaning_window") params.cleaning_window = v;
          else if (f.key === "cleaning_n_sigma") params.cleaning_n_sigma = v;
          else if (f.key === "cleaning_interval_width") {
            params.cleaning_interval_width = v;
          }
        }
      }
    }
  }

  if (shouldShowField("smoothing_method") && state.smoothingMethod) {
    params.smoothing_method = state.smoothingMethod;
  }
  if (shouldShowField("smoothing_window")) {
    if (state.smoothingMethod === "ma" && state.smoothingWindow) {
      params.smoothing_window = state.smoothingWindow;
    } else if (state.smoothingMethod === "hp" && state.hpLambda) {
      params.smoothing_window = state.hpLambda;
    }
  }

  if (selectedPlotType === "time-series" && (state.forecast || state.assessment)) {
    params.forecast = state.forecast;
    params.assessment = state.assessment;
    params.test_hours = state.testHours;
    params.model = state.forecastModel;
    params.interval_type = state.forecastIntervalType;
    params.interval_width = state.forecastIntervalWidth;

    if (state.forecastModel === "SARIMAX") {
      params.sarimax_order = state.sarimaxOrder;
      params.sarimax_seasonal_order = state.sarimaxSeasonalOrder;
      if (state.sarimaxTrend) params.sarimax_trend = state.sarimaxTrend;
      params.sarimax_enforce_stationarity = state.sarimaxEnforceStationarity;
      params.sarimax_enforce_invertibility = state.sarimaxEnforceInvertibility;
      params.sarimax_concentrate_scale = state.sarimaxConcentrateScale;
      params.sarimax_measurement_error = state.sarimaxMeasurementError;
      params.sarimax_simple_differencing = state.sarimaxSimpleDifferencing;
      params.sarimax_method = state.sarimaxMethod;
      params.sarimax_maxiter = state.sarimaxMaxiter;
      params.sarimax_cov_type = state.sarimaxCovType;
    }

    if (state.forecastModel === "Prophet") {
      params.prophet_changepoint_prior_scale = state.prophetChangepointPriorScale;
      params.prophet_seasonality_prior_scale = state.prophetSeasonalityPriorScale;
      params.prophet_holidays_prior_scale = state.prophetHolidaysPriorScale;
      params.prophet_n_changepoints = state.prophetNChangepoints;
      params.prophet_changepoint_range = state.prophetChangepointRange;
      params.prophet_growth = state.prophetGrowth;
      params.prophet_weekly_seasonality = resolveProphetBoolSeasonality(
        state.prophetWeeklySeasonality,
        state.prophetWeeklySeasonalityOrder,
      );
      params.prophet_daily_seasonality = resolveProphetBoolSeasonality(
        state.prophetDailySeasonality,
        state.prophetDailySeasonalityOrder,
      );
      params.prophet_mcmc_samples = state.prophetMcmcSamples;
      params.seasonality_mode = state.npSeasonalityMode;
      params.yearly_seasonality = resolveYearlySeasonality(
        state.npYearlySeasonality,
        state.npYearlySeasonalityOrder,
      );
    }

    if (state.forecastModel === "NeuralProphet") {
      params.n_lags = state.neuralProphetNLags;
      params.n_forecasts = state.neuralProphetNForecasts;
      params.n_changepoints = state.npNChangepoints;
      params.changepoints_range = state.npChangepointsRange;
      params.trend_reg = state.npTrendReg;
      params.seasonality_reg = state.npSeasonalityReg;
      params.seasonality_mode = state.npSeasonalityMode;
      if (state.laggedFeatures.length > 0) {
        params.lagged_features = state.laggedFeatures;
      }
      const epochs = parseOptionalNumber(state.npEpochs);
      if (epochs !== undefined) params.epochs = epochs;
      if (state.npFeatureLagsMode === "uniform") {
        const fl = parseOptionalNumber(state.npFeatureLagsUniform);
        if (fl !== undefined) params.feature_lags = fl;
      } else if (
        state.npFeatureLagsMode === "json" &&
        state.npFeatureLagsJson.trim()
      ) {
        try {
          const parsed = JSON.parse(state.npFeatureLagsJson) as Record<
            string,
            number
          >;
          if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new Error("Expected JSON object");
          }
          params.feature_lags = parsed;
        } catch {
          toast.error("feature_lags must be valid JSON object");
          return { ok: false };
        }
      }
      params.yearly_seasonality = resolveYearlySeasonality(
        state.npYearlySeasonality,
        state.npYearlySeasonalityOrder,
      );
      const arReg = parseOptionalNumber(state.npArReg);
      if (arReg !== undefined) params.ar_reg = arReg;
      const lr = parseOptionalNumber(state.npLearningRate);
      if (lr !== undefined) params.learning_rate = lr;
      const bs = parseOptionalNumber(state.npBatchSize);
      if (bs !== undefined) params.batch_size = bs;
      const nsw = parseOptionalNumber(state.npNewerSamplesWeight);
      if (nsw !== undefined) params.newer_samples_weight = nsw;
    }

    if (state.features.length > 0) {
      params.features = state.features;
    }
  }

  if (selectedPlotType === "eda-plots") {
    params.eda_route = state.edaRoute;
    if (state.edaRoute === "trend-tests") {
      params.seasonal_periods = state.edaSeasonalPeriods;
    }
    if (state.edaRoute === "seasonality-tests") {
      const periods = parseSeasonalityPeriodsText(state.edaSeasonalityPeriodsText);
      if (periods.length === 0) {
        toast.error(
          "Enter at least one seasonality period (hours), e.g. 24, 168",
        );
        return { ok: false };
      }
      params.seasonality_periods = periods;
      params.use_hac = state.edaUseHac;
      params.include_kruskal_wallis = state.edaIncludeKruskalWallis;
      if (state.edaKwTestsMode === "custom" && state.edaKwTestsJson.trim()) {
        try {
          const parsed = JSON.parse(state.edaKwTestsJson) as unknown;
          if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
          params.kw_tests = parsed as KruskalWallisTestSpec[];
        } catch {
          toast.error("kw_tests must be a valid JSON array");
          return { ok: false };
        }
      }
      if (state.edaNHarmonicsMode === "shared") {
        const n = parseInt(state.edaNHarmonicsShared, 10);
        if (!Number.isNaN(n) && n > 0) params.n_harmonics = n;
      } else if (
        state.edaNHarmonicsMode === "dict" &&
        state.edaNHarmonicsJson.trim()
      ) {
        try {
          const parsed = JSON.parse(state.edaNHarmonicsJson) as Record<
            string,
            number
          >;
          if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new Error("Expected JSON object");
          }
          params.n_harmonics = parsed;
        } catch {
          toast.error("n_harmonics must be valid JSON object");
          return { ok: false };
        }
      }
    }
    if (state.edaRoute === "unit-root-tests") {
      params.unit_root_regression = state.edaUnitRootRegression;
      params.include_break_test = state.edaIncludeBreakTest;
    }
    if (state.edaRoute === "seasonal-decompose") {
      params.decompose_period = state.edaDecomposePeriod;
      params.decompose_model = state.edaDecomposeModel;
    }
    if (state.edaRoute === "autocorr") {
      params.acf_lags = state.edaAcfLags;
    }
    if (state.edaRoute === "annotated-timeseries") {
      params.smoothing_method = state.edaSmoothingMethod;
      params.smoothing_window = state.edaSmoothingWindow;
      params.annotated = state.edaAnnotated;
    }
  }

  if (isRpcaWorkflow(selectedPlotType)) {
    const isCampusRpca = selectedPlotType === "rpca-analysis";
    if (isCampusRpca) {
      const thresholdVal = parseFloat(state.threshold);
      if (Number.isNaN(thresholdVal)) {
        toast.error("Please enter a valid campus total threshold");
        return { ok: false };
      }
      params.threshold = thresholdVal;
      params.total_meters = state.totalEnergyMeters.length ? state.totalEnergyMeters : undefined;
      params.cleaning_method = (state.cleaningMethod || "None") as CleaningMethod;
      const completeWindows = [];
      for (const window of state.overageWindows) {
        if (!window.start && !window.end) continue;
        if (!window.start || !window.end) {
          toast.error("Each RPCA overage window needs both start and end");
          return { ok: false };
        }
        if (new Date(window.start) > new Date(window.end)) {
          toast.error("RPCA overage window start must be before end");
          return { ok: false };
        }
        completeWindows.push({
          start: window.start,
          end: window.end,
        });
      }
      if (completeWindows.length > 0) {
        params.overage_windows = completeWindows;
      }
    } else {
      if (!state.meter) {
        toast.error("Please select a main meter");
        return { ok: false };
      }
      if (state.includedMeters.length === 0) {
        toast.error("Select at least one meter for RPCA decomposition");
        return { ok: false };
      }
      params.threshold_mode = state.thresholdMode;
      params.meters = state.includedMeters;
      if (state.thresholdMode === "fixed") {
        const thresholdVal = parseFloat(state.threshold);
        if (Number.isNaN(thresholdVal)) {
          toast.error("Please enter a valid threshold for fixed mode");
          return { ok: false };
        }
        params.threshold = thresholdVal;
      }
    }
    if (!isCampusRpca && state.analysisWindowStart) {
      params.analysis_window_start = sliceDateOnly(state.analysisWindowStart);
    }
    if (!isCampusRpca && state.analysisWindowEnd) {
      params.analysis_window_end = sliceDateOnly(state.analysisWindowEnd);
    }
    if (!isCampusRpca && state.contributionWindowStart) {
      params.contribution_window_start = sliceDateOnly(
        state.contributionWindowStart,
      );
    }
    if (!isCampusRpca && state.contributionWindowEnd) {
      params.contribution_window_end = sliceDateOnly(
        state.contributionWindowEnd,
      );
    }
    if (!isCampusRpca && state.plotWindowStart) {
      params.plot_window_start = sliceDateOnly(state.plotWindowStart);
    }
    if (!isCampusRpca && state.plotWindowEnd) {
      params.plot_window_end = sliceDateOnly(state.plotWindowEnd);
    }
    if (!isCampusRpca && state.seriesMeters.length > 0) {
      params.series_meters = state.seriesMeters;
    }
    if (!isCampusRpca) {
      params.contributions_top_n = state.contributionsTopN;
      params.event_contributions_top_n = state.eventContributionsTopN;
      params.contributions_method = state.contributionsMethod;
      params.heatmap_normalize = state.heatmapNormalize;
      params.heatmap_top_n = state.heatmapTopN;
      params.clean_all_meters = state.cleanAllMeters;
    }
    if (
      state.cleaningMethod === "Prophet" ||
      state.cleaningMethod === "Neural"
    ) {
      params.cleaning_daily = state.cleaningDaily;
      params.cleaning_weekly = state.cleaningWeekly;
    }
    if (!isCampusRpca && state.thresholdMode === "rpca") {
      params.n_thresholds = state.nThresholds;
      params.rpca_tol = state.rpcaTol;
      params.rpca_max_iter = state.rpcaMaxIter;
      const tMin = parseOptionalNumber(state.thresholdMin);
      if (tMin !== undefined) params.threshold_min = tMin;
      const tMax = parseOptionalNumber(state.thresholdMax);
      if (tMax !== undefined) params.threshold_max = tMax;
    }
  }

  const derivedMetersToAdd: Record<string, string[]> = {};

  const referencedMeters = new Set([
    state.meter,
    ...state.includedMeters,
    ...state.seriesMeters,
  ]);
  for (const group of meterGroups) {
    if (
      group.name &&
      group.meters.length > 0 &&
      referencedMeters.has(group.name)
    ) {
      derivedMetersToAdd[group.name] = group.meters;
    }
  }
  if (Object.keys(derivedMetersToAdd).length > 0) {
    params.meters_to_add = derivedMetersToAdd;
  }

  if (state.outlierZapMode !== "none") {
    let zaps: Record<string, string[]> = { ...state.manualOutliers };
    if (isRpcaWorkflow(selectedPlotType) && datasetId) {
      zaps = mergeManualOutliersForOverage(
        params.meter,
        state.includedMeters,
        state.seriesMeters,
        datasetId,
        state.manualOutliers,
      );
    }
    const { pruned, removedCount } = pruneOutliersOutsideRange(
      zaps,
      state.startDate,
      state.endDate,
    );
    if (removedCount > 0) {
      toast.warn(
        `${removedCount} saved zap(s) fall outside the selected date range and were omitted.`,
      );
    }
    if (Object.keys(pruned).length > 0) {
      params.manual_outliers = pruned;
      params.outlierZapMode = state.outlierZapMode;
    }
  }

  return { ok: true, params };
}
