import { defaultCleaningMethod } from "../constants/cleaningMethods";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import type { BaseRequest, PlotType, FormField, EdaRoute, OutlierZapMode } from "../types/api";
import { PLOT_TYPES } from "../constants/plotTypes";
import type {
  NpFeatureLagsUi,
  NpYearlySeasonalityUi,
  ProphetSeasonalityBoolUi,
} from "../constants/neuralProphetFields";
import {
  parseSeasonalityPeriodsText,
  syncFeatureLagsJsonForFeatures,
  syncKwTestsJsonForPeriods,
  syncNHarmonicsJsonForPeriods,
} from "../utils/parameter-form/edaJsonSync";
import { prophetSeasonalityBoolFromInitial } from "../utils/parameter-form/seasonalityResolvers";
import { applyDatePreset as computeDatePreset } from "../utils/parameter-form/applyDatePreset";
import {
  CONTRIBUTIONS_METHOD_DEFAULT,
  THRESHOLD_BOOL_DEFAULTS,
  THRESHOLD_MODE_DEFAULT,
  THRESHOLD_NUMERIC_DEFAULTS,
  defaultAnalysisWindow,
  defaultContributionWindow,
  defaultPlotWindow,
} from "../constants/thresholdDefaults";
import {
  campusTotalPreset,
} from "../constants/derivedMeterRecipes";
import type { ParameterFormBindings } from "../components/parameter-form/types";
import type { MeterListResponse } from "../types/api";
import type { OverageWindow } from "../types/parameterForm";

function isRpcaWorkflow(plotType: PlotType): boolean {
  return plotType === "threshold-detection" || plotType === "rpca-analysis";
}

interface UseParameterFormOptions {
  resetSignal: number;
  initialValues?: BaseRequest | null;
  selectedPlotType: PlotType;
  meterList?: MeterListResponse;
}

export function useParameterForm({
  resetSignal,
  initialValues,
  selectedPlotType,
  meterList,
}: UseParameterFormOptions): ParameterFormBindings {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [meter, setMeter] = useState("");
  const [cleaningMethod, setCleaningMethod] = useState<string>(defaultCleaningMethod(selectedPlotType));
  const [cleaningExtra, setCleaningExtra] = useState<Record<string, number>>({
    cleaning_window: 12,
    cleaning_n_sigma: 3,
    cleaning_interval_width: 0.8,
  });
  const [cleaningDaily, setCleaningDaily] = useState(false);
  const [cleaningWeekly, setCleaningWeekly] = useState(false);
  const [smoothingMethod, setSmoothingMethod] = useState<"" | "ma" | "hp">("");
  const [smoothingWindow, setSmoothingWindow] = useState(7);
  const [hpLambda, setHpLambda] = useState(1600);
  const [forecast, setForecast] = useState(false);
  const [assessment, setAssessment] = useState(false);
  const [testHours, setTestHours] = useState(240);
  const [forecastIntervalType, setForecastIntervalType] = useState<
    "two-sided" | "upper-bounded" | "lower-bounded"
  >("two-sided");
  const [forecastIntervalWidth, setForecastIntervalWidth] = useState(0.95);
  const [forecastModel, setForecastModel] = useState<
    "Prophet" | "SARIMAX" | "NeuralProphet"
  >("Prophet");
  const [sarimaxOrder, setSarimaxOrder] = useState<[number, number, number]>([
    2, 1, 1,
  ]);
  const [sarimaxSeasonalOrder, setSarimaxSeasonalOrder] = useState<
    [number, number, number, number]
  >([0, 0, 0, 0]);
  const [sarimaxTrend, setSarimaxTrend] = useState<
    "" | "n" | "c" | "t" | "ct"
  >("");
  const [sarimaxEnforceStationarity, setSarimaxEnforceStationarity] =
    useState(false);
  const [sarimaxEnforceInvertibility, setSarimaxEnforceInvertibility] =
    useState(false);
  const [sarimaxConcentrateScale, setSarimaxConcentrateScale] = useState(false);
  const [sarimaxMeasurementError, setSarimaxMeasurementError] = useState(false);
  const [sarimaxSimpleDifferencing, setSarimaxSimpleDifferencing] =
    useState(false);
  const [sarimaxMethod, setSarimaxMethod] = useState<
    "lbfgs" | "nm" | "powell" | "bfgs" | "cg"
  >("lbfgs");
  const [sarimaxMaxiter, setSarimaxMaxiter] = useState(50);
  const [sarimaxCovType, setSarimaxCovType] = useState<
    "opg" | "oim" | "robust"
  >("opg");
  const [showSarimaxAdvanced, setShowSarimaxAdvanced] = useState(false);
  const [prophetChangepointPriorScale, setProphetChangepointPriorScale] =
    useState(0.05);
  const [prophetSeasonalityPriorScale, setProphetSeasonalityPriorScale] =
    useState(10);
  const [prophetHolidaysPriorScale, setProphetHolidaysPriorScale] = useState(10);
  const [prophetNChangepoints, setProphetNChangepoints] = useState(25);
  const [prophetChangepointRange, setProphetChangepointRange] = useState(0.8);
  const [prophetGrowth, setProphetGrowth] = useState<
    "linear" | "logistic" | "flat"
  >("linear");
  const [prophetWeeklySeasonality, setProphetWeeklySeasonality] =
    useState<ProphetSeasonalityBoolUi>("true");
  const [prophetWeeklySeasonalityOrder, setProphetWeeklySeasonalityOrder] =
    useState(10);
  const [prophetDailySeasonality, setProphetDailySeasonality] =
    useState<ProphetSeasonalityBoolUi>("true");
  const [prophetDailySeasonalityOrder, setProphetDailySeasonalityOrder] =
    useState(10);
  const [prophetMcmcSamples, setProphetMcmcSamples] = useState(0);
  const [neuralProphetNLags, setNeuralProphetNLags] = useState(24);
  const [neuralProphetNForecasts, setNeuralProphetNForecasts] = useState(6);
  const [laggedFeatures, setLaggedFeatures] = useState<string[]>([]);
  const [npFeatureLagsMode, setNpFeatureLagsMode] =
    useState<NpFeatureLagsUi>("default");
  const [npFeatureLagsUniform, setNpFeatureLagsUniform] = useState("");
  const [npFeatureLagsJson, setNpFeatureLagsJson] = useState("");
  const [npEpochs, setNpEpochs] = useState("");
  const [npNChangepoints, setNpNChangepoints] = useState(10);
  const [npChangepointsRange, setNpChangepointsRange] = useState(0.8);
  const [npTrendReg, setNpTrendReg] = useState(0);
  const [npSeasonalityReg, setNpSeasonalityReg] = useState(0);
  const [npSeasonalityMode, setNpSeasonalityMode] = useState<
    "additive" | "multiplicative"
  >("additive");
  const [npYearlySeasonality, setNpYearlySeasonality] =
    useState<NpYearlySeasonalityUi>("auto");
  const [npYearlySeasonalityOrder, setNpYearlySeasonalityOrder] = useState(10);
  const [npArReg, setNpArReg] = useState("");
  const [npLearningRate, setNpLearningRate] = useState("");
  const [npBatchSize, setNpBatchSize] = useState("");
  const [npNewerSamplesWeight, setNpNewerSamplesWeight] = useState("");
  const [showNeuralProphetAdvanced, setShowNeuralProphetAdvanced] =
    useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [meterGroups, setMeterGroups] = useState<
    Array<{ id: string; name: string; meters: string[] }>
  >([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMeterGroups, setShowMeterGroups] = useState(false);
  const [showForecastOptions, setShowForecastOptions] = useState(false);
  // EDA-specific state
  const [edaRoute, setEdaRoute] = useState<EdaRoute>("trend-tests");
  const [edaSeasonalPeriods, setEdaSeasonalPeriods] = useState(24);
  const [edaSeasonalityPeriodsText, setEdaSeasonalityPeriodsText] =
    useState("24, 168");
  const [edaNHarmonicsMode, setEdaNHarmonicsMode] = useState<
    "auto" | "shared" | "dict"
  >("auto");
  const [edaNHarmonicsShared, setEdaNHarmonicsShared] = useState("");
  const [edaNHarmonicsJson, setEdaNHarmonicsJson] = useState(
    '{"24": 3, "168": 6}',
  );
  const [edaUseHac, setEdaUseHac] = useState(true);
  const [edaIncludeKruskalWallis, setEdaIncludeKruskalWallis] = useState(true);
  const [edaKwTestsMode, setEdaKwTestsMode] = useState<"auto" | "custom">("auto");
  const [edaKwTestsJson, setEdaKwTestsJson] = useState(
    '[\n  { "period": 24 },\n  { "period": 168 }\n]',
  );
  const [edaUnitRootRegression, setEdaUnitRootRegression] = useState<
    "c" | "ct"
  >("c");
  const [edaIncludeBreakTest, setEdaIncludeBreakTest] = useState(false);
  const [edaDecomposePeriod, setEdaDecomposePeriod] = useState(24);
  const [edaDecomposeModel, setEdaDecomposeModel] = useState<"additive" | "multiplicative">("additive");
  const [edaAcfLags, setEdaAcfLags] = useState(168);
  const [edaAnnotated, setEdaAnnotated] = useState(true);
  const [edaSmoothingMethod, setEdaSmoothingMethod] = useState<"ma" | "hp">("hp");
  const [edaSmoothingWindow, setEdaSmoothingWindow] = useState(200);
  const analysisDefaults = defaultAnalysisWindow(meterList?.time_range);
  const contributionDefaults = defaultContributionWindow();
  const plotDefaults = defaultPlotWindow();
  const [thresholdMode, setThresholdMode] = useState<"rpca" | "fixed">(
    THRESHOLD_MODE_DEFAULT,
  );
  const [threshold, setThreshold] = useState("");
  const [totalEnergyName, setTotalEnergyName] = useState("totalenergy");
  const [totalEnergyMeters, setTotalEnergyMeters] = useState<string[]>([]);
  const [overageWindows, setOverageWindows] = useState<OverageWindow[]>([]);
  const [includedMeters, setIncludedMeters] = useState<string[]>([]);
  const [seriesMeters, setSeriesMeters] = useState<string[]>([]);
  const [analysisWindowStart, setAnalysisWindowStart] = useState<string>(
    analysisDefaults.start,
  );
  const [analysisWindowEnd, setAnalysisWindowEnd] = useState<string>(
    analysisDefaults.end,
  );
  const [contributionWindowStart, setContributionWindowStart] = useState<string>(
    contributionDefaults.start,
  );
  const [contributionWindowEnd, setContributionWindowEnd] = useState<string>(
    contributionDefaults.end,
  );
  const [plotWindowStart, setPlotWindowStart] = useState<string>(
    plotDefaults.start,
  );
  const [plotWindowEnd, setPlotWindowEnd] = useState<string>(plotDefaults.end);
  const [contributionsTopN, setContributionsTopN] = useState<number>(
    THRESHOLD_NUMERIC_DEFAULTS.contributions_top_n,
  );
  const [eventContributionsTopN, setEventContributionsTopN] = useState<number>(
    THRESHOLD_NUMERIC_DEFAULTS.event_contributions_top_n,
  );
  const [contributionsMethod, setContributionsMethod] = useState<
    "sparse" | "raw"
  >(CONTRIBUTIONS_METHOD_DEFAULT);
  const [heatmapNormalize, setHeatmapNormalize] = useState<boolean>(
    THRESHOLD_BOOL_DEFAULTS.heatmap_normalize,
  );
  const [heatmapTopN, setHeatmapTopN] = useState<number>(
    THRESHOLD_NUMERIC_DEFAULTS.heatmap_top_n,
  );
  const [cleanAllMeters, setCleanAllMeters] = useState<boolean>(
    THRESHOLD_BOOL_DEFAULTS.clean_all_meters,
  );
  const [nThresholds, setNThresholds] = useState<number>(
    THRESHOLD_NUMERIC_DEFAULTS.n_thresholds,
  );
  const [thresholdMin, setThresholdMin] = useState("");
  const [thresholdMax, setThresholdMax] = useState("");
  const [rpcaTol, setRpcaTol] = useState<number>(
    THRESHOLD_NUMERIC_DEFAULTS.rpca_tol,
  );
  const [rpcaMaxIter, setRpcaMaxIter] = useState<number>(
    THRESHOLD_NUMERIC_DEFAULTS.rpca_max_iter,
  );
  const [showThresholdAdvanced, setShowThresholdAdvanced] = useState(false);
  const [manualOutlierReplacement, setManualOutlierReplacement] = useState<"average" | "zero">("average");
  const [outlierZapMode, setOutlierZapMode] = useState<OutlierZapMode>("none");
  const [manualOutliers, setManualOutliers] = useState<Record<string, string[]>>(
    {},
  );
  const [outlierZapPreviewMeter, setOutlierZapPreviewMeter] = useState("");
  const lastAutoIncludedMetersKeyRef = useRef<string | null>(null);
  const lastAutoTotalEnergyMetersKeyRef = useRef<string | null>(null);
  // Load meter groups from localStorage on mount
  useEffect(() => {
    const savedGroups = localStorage.getItem("meterGroups");
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups);
        setMeterGroups(parsed);
        if (parsed.length > 0) {
          setShowMeterGroups(true);
        }
      } catch (error) {
        console.error("Error loading meter groups from localStorage:", error);
      }
    }
  }, []);

  // Helper function to save meter groups to localStorage
  const saveMeterGroupsToStorage = (
    groups: Array<{ id: string; name: string; meters: string[] }>
  ) => {
    if (groups.length > 0) {
      localStorage.setItem("meterGroups", JSON.stringify(groups));
    } else {
      localStorage.removeItem("meterGroups");
    }
  };

  // Combine original meters with group names for the dropdown
  const allMeters = useMemo(() => {
    const originalMeters = meterList?.meters || [];
    const groupNames = meterGroups
      .filter((group) => group.name && group.meters.length > 0)
      .map((group) => group.name);
    return [...originalMeters, ...groupNames];
  }, [meterList?.meters, meterGroups]);
  const allMetersKey = useMemo(() => allMeters.join("\u001f"), [allMeters]);
  const rawMetersKey = useMemo(
    () => (meterList?.meters ?? []).join("\u001f"),
    [meterList?.meters],
  );

  useEffect(() => {
    const range = meterList?.time_range;
    if (range?.start && range.end) {
      const preset = selectedPlotType === "rpca-analysis" || selectedPlotType === "threshold-detection" ? "week" : selectedPlotType === "usage-history" ? "month" : "year";
      const dates = computeDatePreset(preset, range.end);
      setStartDate(new Date(dates.startDate) < new Date(range.start) ? range.start.slice(0, 16) : dates.startDate);
      setEndDate(dates.endDate);
    } else { setStartDate(""); setEndDate(""); }
    setMeter("");
    if (isRpcaWorkflow(selectedPlotType)) {
      setCleaningMethod("Polynomial");
      setCleaningExtra({
        cleaning_window: 12,
        cleaning_n_sigma: 3.3,
        cleaning_interval_width: 0.95,
      });
      setCleaningDaily(false);
      setCleaningWeekly(false);
    } else {
      setCleaningMethod(defaultCleaningMethod(selectedPlotType));
      setCleaningExtra({
        cleaning_window: 12,
        cleaning_n_sigma: 3,
        cleaning_interval_width: 0.8,
      });
      setCleaningDaily(false);
      setCleaningWeekly(false);
    }
    setSmoothingMethod("");
    setSmoothingWindow(7);
    setHpLambda(1600);
    setForecast(selectedPlotType === "time-series");
    setAssessment(false);
    setTestHours(168);
    setForecastIntervalType("two-sided");
    setForecastIntervalWidth(0.95);
    setForecastModel("Prophet");
    setSarimaxOrder([2, 1, 1]);
    setSarimaxSeasonalOrder([0, 0, 0, 0]);
    setSarimaxTrend("");
    setSarimaxEnforceStationarity(false);
    setSarimaxEnforceInvertibility(false);
    setSarimaxConcentrateScale(false);
    setSarimaxMeasurementError(false);
    setSarimaxSimpleDifferencing(false);
    setSarimaxMethod("lbfgs");
    setSarimaxMaxiter(50);
    setSarimaxCovType("opg");
    setShowSarimaxAdvanced(false);
    setProphetChangepointPriorScale(0.05);
    setProphetSeasonalityPriorScale(10);
    setProphetHolidaysPriorScale(10);
    setProphetNChangepoints(25);
    setProphetChangepointRange(0.8);
    setProphetGrowth("linear");
    setProphetWeeklySeasonality("true");
    setProphetWeeklySeasonalityOrder(10);
    setProphetDailySeasonality("true");
    setProphetDailySeasonalityOrder(10);
    setProphetMcmcSamples(0);
    setNeuralProphetNLags(24);
    setNeuralProphetNForecasts(6);
    setLaggedFeatures([]);
    setNpFeatureLagsMode("default");
    setNpFeatureLagsUniform("");
    setNpFeatureLagsJson("");
    setNpEpochs("");
    setNpNChangepoints(10);
    setNpChangepointsRange(0.8);
    setNpTrendReg(0);
    setNpSeasonalityReg(0);
    setNpSeasonalityMode("additive");
    setNpYearlySeasonality("auto");
    setNpYearlySeasonalityOrder(10);
    setNpArReg("");
    setNpLearningRate("");
    setNpBatchSize("");
    setNpNewerSamplesWeight("");
    setShowNeuralProphetAdvanced(false);
    setFeatures([]);
    setShowAdvanced(false);
    setShowForecastOptions(false);
    setEdaRoute("trend-tests");
    setEdaSeasonalPeriods(24);
    setEdaSeasonalityPeriodsText("24, 168");
    setEdaNHarmonicsMode("auto");
    setEdaNHarmonicsShared("");
    setEdaNHarmonicsJson('{"24": 3, "168": 6}');
    setEdaUseHac(true);
    setEdaIncludeKruskalWallis(true);
    setEdaKwTestsMode("auto");
    setEdaKwTestsJson('[\n  { "period": 24 },\n  { "period": 168 }\n]');
    setEdaUnitRootRegression("c");
    setEdaIncludeBreakTest(false);
    setEdaDecomposePeriod(24);
    setEdaDecomposeModel("additive");
    setEdaAcfLags(168);
    setEdaAnnotated(true);
    setEdaSmoothingMethod("hp");
    setEdaSmoothingWindow(200);
    setThresholdMode(THRESHOLD_MODE_DEFAULT);
    setThreshold(selectedPlotType === "rpca-analysis" ? "22000" : "");
    setTotalEnergyName("totalenergy");
    setTotalEnergyMeters([]);
    setOverageWindows([]);
    const groupNames = meterGroups
      .filter((group) => group.name && group.meters.length > 0)
      .map((group) => group.name);
    setIncludedMeters(
      selectedPlotType === "rpca-analysis"
        ? [...(meterList?.meters ?? [])]
        : [...(meterList?.meters ?? []), ...groupNames],
    );
    setSeriesMeters([]);
    setAnalysisWindowStart("");
    setAnalysisWindowEnd("");
    setContributionWindowStart("");
    setContributionWindowEnd("");
    setPlotWindowStart("");
    setPlotWindowEnd("");
    setContributionsTopN(THRESHOLD_NUMERIC_DEFAULTS.contributions_top_n);
    setEventContributionsTopN(
      THRESHOLD_NUMERIC_DEFAULTS.event_contributions_top_n,
    );
    setContributionsMethod(CONTRIBUTIONS_METHOD_DEFAULT);
    setHeatmapNormalize(THRESHOLD_BOOL_DEFAULTS.heatmap_normalize);
    setHeatmapTopN(THRESHOLD_NUMERIC_DEFAULTS.heatmap_top_n);
    setCleanAllMeters(THRESHOLD_BOOL_DEFAULTS.clean_all_meters);
    setNThresholds(THRESHOLD_NUMERIC_DEFAULTS.n_thresholds);
    setThresholdMin("");
    setThresholdMax("");
    setRpcaTol(THRESHOLD_NUMERIC_DEFAULTS.rpca_tol);
    setRpcaMaxIter(THRESHOLD_NUMERIC_DEFAULTS.rpca_max_iter);
    setShowThresholdAdvanced(false);
    setOutlierZapMode("none");
    setManualOutlierReplacement("average");
    setManualOutliers({});
    setOutlierZapPreviewMeter("");
  }, [resetSignal, meterList?.meters, meterList?.time_range, selectedPlotType]);

  useEffect(() => {
    if (!initialValues) return;
    setStartDate(initialValues.start_date);
    setEndDate(initialValues.end_date);
    setMeter(initialValues.meter);
    setCleaningMethod(initialValues.cleaning_method ?? defaultCleaningMethod(selectedPlotType));
    if (initialValues.cleaning_daily !== undefined) {
      setCleaningDaily(initialValues.cleaning_daily);
    }
    if (initialValues.cleaning_weekly !== undefined) {
      setCleaningWeekly(initialValues.cleaning_weekly);
    }
    setCleaningExtra((prev) => ({
      ...prev,
      ...(initialValues.cleaning_window != null && { cleaning_window: initialValues.cleaning_window }),
      ...(initialValues.cleaning_n_sigma != null && { cleaning_n_sigma: initialValues.cleaning_n_sigma }),
      ...(initialValues.cleaning_interval_width != null && {
        cleaning_interval_width: initialValues.cleaning_interval_width,
      }),
    }));
    setSmoothingMethod(initialValues.smoothing_method ?? "");
    setSmoothingWindow(initialValues.smoothing_window ?? 7);
    setHpLambda(
      initialValues.smoothing_method === "hp"
        ? (initialValues.smoothing_window ?? 1600)
        : 1600,
    );
    setForecast(initialValues.forecast ?? false);
    setAssessment(initialValues.assessment ?? false);
    setTestHours(initialValues.test_hours ?? 240);
    setForecastIntervalType(initialValues.interval_type ?? "two-sided");
    setForecastIntervalWidth(initialValues.interval_width ?? 0.95);
    setForecastModel(initialValues.model ?? "Prophet");
    if (initialValues.sarimax_order) {
      setSarimaxOrder(initialValues.sarimax_order);
    }
    if (initialValues.sarimax_seasonal_order) {
      setSarimaxSeasonalOrder(initialValues.sarimax_seasonal_order);
    }
    if (initialValues.sarimax_trend) {
      setSarimaxTrend(initialValues.sarimax_trend);
    } else {
      setSarimaxTrend("");
    }
    if (initialValues.sarimax_enforce_stationarity !== undefined) {
      setSarimaxEnforceStationarity(initialValues.sarimax_enforce_stationarity);
    }
    if (initialValues.sarimax_enforce_invertibility !== undefined) {
      setSarimaxEnforceInvertibility(initialValues.sarimax_enforce_invertibility);
    }
    if (initialValues.sarimax_concentrate_scale !== undefined) {
      setSarimaxConcentrateScale(initialValues.sarimax_concentrate_scale);
    }
    if (initialValues.sarimax_measurement_error !== undefined) {
      setSarimaxMeasurementError(initialValues.sarimax_measurement_error);
    }
    if (initialValues.sarimax_simple_differencing !== undefined) {
      setSarimaxSimpleDifferencing(initialValues.sarimax_simple_differencing);
    }
    if (initialValues.sarimax_method) {
      setSarimaxMethod(initialValues.sarimax_method);
    }
    if (initialValues.sarimax_maxiter !== undefined) {
      setSarimaxMaxiter(initialValues.sarimax_maxiter);
    }
    if (initialValues.sarimax_cov_type) {
      setSarimaxCovType(initialValues.sarimax_cov_type);
    }
    if (initialValues.prophet_changepoint_prior_scale !== undefined) {
      setProphetChangepointPriorScale(initialValues.prophet_changepoint_prior_scale);
    }
    if (initialValues.prophet_seasonality_prior_scale !== undefined) {
      setProphetSeasonalityPriorScale(initialValues.prophet_seasonality_prior_scale);
    }
    if (initialValues.prophet_holidays_prior_scale !== undefined) {
      setProphetHolidaysPriorScale(initialValues.prophet_holidays_prior_scale);
    }
    if (initialValues.prophet_n_changepoints !== undefined) {
      setProphetNChangepoints(initialValues.prophet_n_changepoints);
    }
    if (initialValues.prophet_changepoint_range !== undefined) {
      setProphetChangepointRange(initialValues.prophet_changepoint_range);
    }
    if (initialValues.prophet_growth) {
      setProphetGrowth(initialValues.prophet_growth);
    }
    if (initialValues.prophet_mcmc_samples !== undefined) {
      setProphetMcmcSamples(initialValues.prophet_mcmc_samples);
    }
    const weekly = prophetSeasonalityBoolFromInitial(
      initialValues.prophet_weekly_seasonality,
    );
    setProphetWeeklySeasonality(weekly.ui);
    setProphetWeeklySeasonalityOrder(weekly.order);
    const daily = prophetSeasonalityBoolFromInitial(
      initialValues.prophet_daily_seasonality,
    );
    setProphetDailySeasonality(daily.ui);
    setProphetDailySeasonalityOrder(daily.order);
    const npLags = initialValues.n_lags ?? 24;
    setNeuralProphetNLags(npLags);
    setNeuralProphetNForecasts(initialValues.n_forecasts ?? 6);
    const lagged = initialValues.lagged_features ?? [];
    setLaggedFeatures(lagged);
    if (lagged.length > 0) {
      if (initialValues.feature_lags != null) {
        if (typeof initialValues.feature_lags === "number") {
          setNpFeatureLagsMode("uniform");
          setNpFeatureLagsUniform(String(initialValues.feature_lags));
          setNpFeatureLagsJson(
            syncFeatureLagsJsonForFeatures(
              "",
              lagged,
              initialValues.feature_lags,
            ),
          );
        } else {
          setNpFeatureLagsMode("json");
          setNpFeatureLagsJson(
            syncFeatureLagsJsonForFeatures(
              JSON.stringify(initialValues.feature_lags),
              lagged,
              npLags,
            ),
          );
        }
      } else {
        setNpFeatureLagsMode("default");
        setNpFeatureLagsUniform("");
        setNpFeatureLagsJson(
          syncFeatureLagsJsonForFeatures("", lagged, npLags),
        );
      }
    } else if (initialValues.feature_lags != null) {
      if (typeof initialValues.feature_lags === "number") {
        setNpFeatureLagsMode("uniform");
        setNpFeatureLagsUniform(String(initialValues.feature_lags));
        setNpFeatureLagsJson("");
      } else {
        setNpFeatureLagsMode("json");
        setNpFeatureLagsJson(JSON.stringify(initialValues.feature_lags));
      }
    } else {
      setNpFeatureLagsMode("default");
      setNpFeatureLagsUniform("");
      setNpFeatureLagsJson("");
    }
    setNpEpochs(
      initialValues.epochs != null ? String(initialValues.epochs) : "",
    );
    setNpNChangepoints(initialValues.n_changepoints ?? 10);
    setNpChangepointsRange(initialValues.changepoints_range ?? 0.8);
    setNpTrendReg(initialValues.trend_reg ?? 0);
    setNpSeasonalityReg(initialValues.seasonality_reg ?? 0);
    setNpSeasonalityMode(initialValues.seasonality_mode ?? "additive");
    const ys = initialValues.yearly_seasonality;
    if (ys === "auto" || ys === undefined) {
      setNpYearlySeasonality("auto");
    } else if (ys === true) {
      setNpYearlySeasonality("true");
    } else if (ys === false) {
      setNpYearlySeasonality("false");
    } else if (typeof ys === "number") {
      setNpYearlySeasonality("custom");
      setNpYearlySeasonalityOrder(ys);
    }
    setNpArReg(initialValues.ar_reg != null ? String(initialValues.ar_reg) : "");
    setNpLearningRate(
      initialValues.learning_rate != null
        ? String(initialValues.learning_rate)
        : "",
    );
    setNpBatchSize(
      initialValues.batch_size != null ? String(initialValues.batch_size) : "",
    );
    setNpNewerSamplesWeight(
      initialValues.newer_samples_weight != null
        ? String(initialValues.newer_samples_weight)
        : "",
    );
    if (initialValues.features) {
      setFeatures(initialValues.features);
    }
    setShowForecastOptions(
      (initialValues.forecast ?? false) || (initialValues.assessment ?? false),
    );
    if (initialValues.eda_route) {
      setEdaRoute(initialValues.eda_route);
      if (initialValues.seasonal_periods !== undefined) setEdaSeasonalPeriods(initialValues.seasonal_periods);
      if (initialValues.seasonality_periods?.length) {
        const periods = initialValues.seasonality_periods;
        setEdaSeasonalityPeriodsText(periods.join(", "));
        if (initialValues.n_harmonics != null) {
          if (typeof initialValues.n_harmonics === "number") {
            setEdaNHarmonicsMode("shared");
            setEdaNHarmonicsShared(String(initialValues.n_harmonics));
          } else {
            setEdaNHarmonicsMode("dict");
            setEdaNHarmonicsJson(
              syncNHarmonicsJsonForPeriods(
                JSON.stringify(initialValues.n_harmonics),
                periods,
              ),
            );
          }
        } else {
          setEdaNHarmonicsJson(
            syncNHarmonicsJsonForPeriods('{"24": 3, "168": 6}', periods),
          );
        }
      } else if (initialValues.n_harmonics != null) {
        if (typeof initialValues.n_harmonics === "number") {
          setEdaNHarmonicsMode("shared");
          setEdaNHarmonicsShared(String(initialValues.n_harmonics));
        } else {
          setEdaNHarmonicsMode("dict");
          setEdaNHarmonicsJson(JSON.stringify(initialValues.n_harmonics));
        }
      }
      if (initialValues.use_hac !== undefined) setEdaUseHac(initialValues.use_hac);
      if (initialValues.include_kruskal_wallis !== undefined) {
        setEdaIncludeKruskalWallis(initialValues.include_kruskal_wallis);
      }
      if (initialValues.kw_tests?.length) {
        setEdaKwTestsMode("custom");
        setEdaKwTestsJson(JSON.stringify(initialValues.kw_tests, null, 2));
      } else if (initialValues.seasonality_periods?.length) {
        setEdaKwTestsJson(
          syncKwTestsJsonForPeriods(
            '[\n  { "period": 24 },\n  { "period": 168 }\n]',
            initialValues.seasonality_periods,
          ),
        );
      }
      if (initialValues.unit_root_regression) {
        setEdaUnitRootRegression(initialValues.unit_root_regression);
      }
      if (initialValues.include_break_test !== undefined) {
        setEdaIncludeBreakTest(initialValues.include_break_test);
      }
      if (initialValues.decompose_period !== undefined) setEdaDecomposePeriod(initialValues.decompose_period);
      if (initialValues.decompose_model) setEdaDecomposeModel(initialValues.decompose_model);
      if (initialValues.acf_lags !== undefined) setEdaAcfLags(initialValues.acf_lags);
      if (initialValues.annotated !== undefined) setEdaAnnotated(initialValues.annotated);
      if (initialValues.smoothing_method) setEdaSmoothingMethod(initialValues.smoothing_method);
      if (initialValues.smoothing_window !== undefined) setEdaSmoothingWindow(initialValues.smoothing_window);
    }
    if (initialValues.meters_to_add) {
      const totalEnergyEntry = Object.entries(initialValues.meters_to_add)[0];
      if (selectedPlotType === "rpca-analysis" && totalEnergyEntry) {
        const [name, meters] = totalEnergyEntry;
        setTotalEnergyName(name);
        setTotalEnergyMeters(meters);
      }
      if (selectedPlotType !== "rpca-analysis") {
        const groups = Object.entries(initialValues.meters_to_add).map(
          ([name, meterList], index) => ({
            id: `group-${index}`,
            name,
            meters: meterList,
          })
        );
        setMeterGroups(groups);
      }
    }
    if (initialValues.threshold_mode) {
      setThresholdMode(initialValues.threshold_mode);
    }
    if (initialValues.threshold !== undefined) {
      setThreshold(String(initialValues.threshold));
    }
    if (initialValues.total_meters?.length) {
      setTotalEnergyMeters(initialValues.total_meters);
    }
    if (initialValues.overage_windows?.length) {
      setOverageWindows(
        initialValues.overage_windows.map((window, index) => ({
          id: `overage-${index}-${window.start}-${window.end}`,
          start: window.start,
          end: window.end,
        })),
      );
    }
    if (initialValues.meters?.length) {
      setIncludedMeters(initialValues.meters);
    }
    if (initialValues.series_meters?.length) {
      setSeriesMeters(initialValues.series_meters);
    }
    if (initialValues.analysis_window_start) {
      setAnalysisWindowStart(initialValues.analysis_window_start);
    }
    if (initialValues.analysis_window_end) {
      setAnalysisWindowEnd(initialValues.analysis_window_end);
    }
    if (initialValues.contribution_window_start) {
      setContributionWindowStart(initialValues.contribution_window_start);
    }
    if (initialValues.contribution_window_end) {
      setContributionWindowEnd(initialValues.contribution_window_end);
    }
    if (initialValues.plot_window_start) {
      setPlotWindowStart(initialValues.plot_window_start);
    }
    if (initialValues.plot_window_end) {
      setPlotWindowEnd(initialValues.plot_window_end);
    }
    if (initialValues.contributions_top_n !== undefined) {
      setContributionsTopN(initialValues.contributions_top_n);
    }
    if (initialValues.event_contributions_top_n !== undefined) {
      setEventContributionsTopN(initialValues.event_contributions_top_n);
    }
    if (initialValues.contributions_method) {
      setContributionsMethod(initialValues.contributions_method);
    }
    if (initialValues.heatmap_normalize !== undefined) {
      setHeatmapNormalize(initialValues.heatmap_normalize);
    }
    if (initialValues.heatmap_top_n !== undefined) {
      setHeatmapTopN(initialValues.heatmap_top_n);
    }
    if (initialValues.clean_all_meters !== undefined) {
      setCleanAllMeters(initialValues.clean_all_meters);
    }
    if (initialValues.n_thresholds !== undefined) {
      setNThresholds(initialValues.n_thresholds);
    }
    if (initialValues.threshold_min !== undefined) {
      setThresholdMin(String(initialValues.threshold_min));
    }
    if (initialValues.threshold_max !== undefined) {
      setThresholdMax(String(initialValues.threshold_max));
    }
    if (initialValues.rpca_tol !== undefined) {
      setRpcaTol(initialValues.rpca_tol);
    }
    if (initialValues.rpca_max_iter !== undefined) {
      setRpcaMaxIter(initialValues.rpca_max_iter);
    }
    setManualOutlierReplacement(initialValues.manual_outlier_replacement ?? "average");
    if (initialValues.outlierZapMode) {
      setOutlierZapMode(initialValues.outlierZapMode);
    }
    if (initialValues.manual_outliers) {
      setManualOutliers(initialValues.manual_outliers);
    }
  }, [initialValues, selectedPlotType]);

  useEffect(() => {
    if (!isRpcaWorkflow(selectedPlotType)) return;
    const defaultMeters =
      selectedPlotType === "rpca-analysis"
        ? (meterList?.meters ?? [])
        : allMeters;
    const defaultMetersKey =
      selectedPlotType === "rpca-analysis" ? rawMetersKey : allMetersKey;
    if (
      defaultMeters.length &&
      includedMeters.length === 0 &&
      lastAutoIncludedMetersKeyRef.current !== defaultMetersKey
    ) {
      setIncludedMeters([...defaultMeters]);
      lastAutoIncludedMetersKeyRef.current = defaultMetersKey;
    }
  }, [
    selectedPlotType,
    meterList?.meters,
    allMeters,
    rawMetersKey,
    allMetersKey,
    includedMeters.length,
  ]);

  useEffect(() => {
    if (selectedPlotType !== "rpca-analysis") return;
    if (totalEnergyMeters.length > 0) return;
    const sourceMeters = meterList?.meters ?? [];
    const recipe = campusTotalPreset(sourceMeters);
    if (
      recipe.length > 0 &&
      lastAutoTotalEnergyMetersKeyRef.current !== rawMetersKey
    ) {
      setTotalEnergyMeters([...recipe]);
      lastAutoTotalEnergyMetersKeyRef.current = rawMetersKey;
    }
  }, [selectedPlotType, meterList?.meters, rawMetersKey, totalEnergyMeters.length]);

  useEffect(() => {
    if (!isRpcaWorkflow(selectedPlotType)) return;
    if (meter && !outlierZapPreviewMeter) {
      setOutlierZapPreviewMeter(meter);
    }
  }, [selectedPlotType, meter, outlierZapPreviewMeter]);

  const addMeterGroup = () => {
    const newId = `group-${Date.now()}`;
    const updatedGroups = [
      ...meterGroups,
      { id: newId, name: "", meters: [] },
    ];
    setMeterGroups(updatedGroups);
    saveMeterGroupsToStorage(updatedGroups);
    setEditingGroupId(newId);
    setShowMeterGroups(true);
  };

  const saveMeterGroup = (id: string) => {
    const group = meterGroups.find((g) => g.id === id);
    if (!group) return;

    if (!group.name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (group.meters.length === 0) {
      toast.error("Please select at least one meter to sum");
      return;
    }

    const nameExists = meterGroups.some(
      (g) => g.id !== id && g.name.toLowerCase() === group.name.toLowerCase()
    );
    if (nameExists) {
      toast.error(
        "A group with this name already exists. Please use a different name."
      );
      return;
    }

    saveMeterGroupsToStorage(meterGroups);
    setEditingGroupId(null);
    toast.success(
      `Meter group "${group.name}" saved! You can now select it from the Meter dropdown.`
    );
  };

  const editMeterGroup = (id: string) => {
    setEditingGroupId(id);
  };

  const cancelEdit = () => {
    const editingGroup = meterGroups.find((g) => g.id === editingGroupId);
    if (
      editingGroup &&
      !editingGroup.name &&
      editingGroup.meters.length === 0
    ) {
      const updatedGroups = meterGroups.filter((g) => g.id !== editingGroupId);
      setMeterGroups(updatedGroups);
      saveMeterGroupsToStorage(updatedGroups);
    }
    setEditingGroupId(null);
  };

  const removeMeterGroup = (id: string) => {
    if (window.confirm("Are you sure you want to remove this meter group?")) {
      const updatedGroups = meterGroups.filter((group) => group.id !== id);
      setMeterGroups(updatedGroups);
      saveMeterGroupsToStorage(updatedGroups);
      if (editingGroupId === id) {
        setEditingGroupId(null);
      }
      toast.success("Meter group removed");
    }
  };

  const updateMeterGroup = (
    id: string,
    updates: { name?: string; meters?: string[] }
  ) => {
    const updatedGroups = meterGroups.map((group) =>
      group.id === id ? { ...group, ...updates } : group
    );
    setMeterGroups(updatedGroups);
    saveMeterGroupsToStorage(updatedGroups);
  };

  const updateMeterGroupName = (id: string, name: string) => {
    updateMeterGroup(id, { name });
  };

  const updateMeterGroupMeters = (id: string, meters: string[]) => {
    updateMeterGroup(id, { meters });
  };
  const plotConfig = useMemo(
    () => PLOT_TYPES.find((plot) => plot.id === selectedPlotType),
    [selectedPlotType],
  );

  const shouldShowField = useCallback(
    (field: FormField): boolean => plotConfig?.fields.includes(field) ?? false,
    [plotConfig],
  );

  const availableDateRange = meterList?.time_range;
  const minDate = availableDateRange?.start
    ? availableDateRange.start.replace(" ", "T").slice(0, 16)
    : "";
  const maxDate = availableDateRange?.end
    ? availableDateRange.end.replace(" ", "T").slice(0, 16)
    : "";

  const applyDatePreset = useCallback(
    (preset: "week" | "month" | "quarter" | "year") => {
      const { startDate: s, endDate: e } = computeDatePreset(
        preset,
        availableDateRange?.end,
      );
      setStartDate(availableDateRange?.start && new Date(s) < new Date(availableDateRange.start) ? availableDateRange.start.replace(" ", "T").slice(0, 16) : s);
      setEndDate(e);
    },
    [availableDateRange?.start, availableDateRange?.end],
  );

  return {
    selectedPlotType,
    startDate,
    endDate,
    meter,
    cleaningMethod,
    cleaningExtra,
    cleaningDaily,
    cleaningWeekly,
    smoothingMethod,
    smoothingWindow,
    hpLambda,
    forecast,
    assessment,
    testHours,
    forecastIntervalType,
    forecastIntervalWidth,
    forecastModel,
    sarimaxOrder,
    sarimaxSeasonalOrder,
    sarimaxTrend,
    sarimaxEnforceStationarity,
    sarimaxEnforceInvertibility,
    sarimaxConcentrateScale,
    sarimaxMeasurementError,
    sarimaxSimpleDifferencing,
    sarimaxMethod,
    sarimaxMaxiter,
    sarimaxCovType,
    showSarimaxAdvanced,
    prophetChangepointPriorScale,
    prophetSeasonalityPriorScale,
    prophetHolidaysPriorScale,
    prophetNChangepoints,
    prophetChangepointRange,
    prophetGrowth,
    prophetWeeklySeasonality,
    prophetWeeklySeasonalityOrder,
    prophetDailySeasonality,
    prophetDailySeasonalityOrder,
    prophetMcmcSamples,
    neuralProphetNLags,
    neuralProphetNForecasts,
    laggedFeatures,
    npFeatureLagsMode,
    npFeatureLagsUniform,
    npFeatureLagsJson,
    npEpochs,
    npNChangepoints,
    npChangepointsRange,
    npTrendReg,
    npSeasonalityReg,
    npSeasonalityMode,
    npYearlySeasonality,
    npYearlySeasonalityOrder,
    npArReg,
    npLearningRate,
    npBatchSize,
    npNewerSamplesWeight,
    showNeuralProphetAdvanced,
    features,
    showAdvanced,
    showForecastOptions,
    edaRoute,
    edaSeasonalPeriods,
    edaSeasonalityPeriodsText,
    edaNHarmonicsMode,
    edaNHarmonicsShared,
    edaNHarmonicsJson,
    edaUseHac,
    edaIncludeKruskalWallis,
    edaKwTestsMode,
    edaKwTestsJson,
    edaUnitRootRegression,
    edaIncludeBreakTest,
    edaDecomposePeriod,
    edaDecomposeModel,
    edaAcfLags,
    edaAnnotated,
    edaSmoothingMethod,
    edaSmoothingWindow,
    thresholdMode,
    threshold,
    totalEnergyName,
    totalEnergyMeters,
    overageWindows,
    includedMeters,
    seriesMeters,
    analysisWindowStart,
    analysisWindowEnd,
    contributionWindowStart,
    contributionWindowEnd,
    plotWindowStart,
    plotWindowEnd,
    contributionsTopN,
    eventContributionsTopN,
    contributionsMethod,
    heatmapNormalize,
    heatmapTopN,
    cleanAllMeters,
    nThresholds,
    thresholdMin,
    thresholdMax,
    rpcaTol,
    rpcaMaxIter,
    showThresholdAdvanced,
    outlierZapMode,
    manualOutlierReplacement,
    manualOutliers,
    outlierZapPreviewMeter,
    meterGroups,
    editingGroupId,
    showMeterGroups,
    allMeters,
    meterList,
    minDate,
    maxDate,
    setStartDate,
    setEndDate,
    setMeter,
    setCleaningMethod,
    setCleaningExtra,
    setCleaningDaily,
    setCleaningWeekly,
    setSmoothingMethod,
    setSmoothingWindow,
    setHpLambda,
    setForecast,
    setAssessment,
    setTestHours,
    setForecastIntervalType,
    setForecastIntervalWidth,
    setForecastModel,
    setSarimaxOrder,
    setSarimaxSeasonalOrder,
    setSarimaxTrend,
    setSarimaxEnforceStationarity,
    setSarimaxEnforceInvertibility,
    setSarimaxConcentrateScale,
    setSarimaxMeasurementError,
    setSarimaxSimpleDifferencing,
    setSarimaxMethod,
    setSarimaxMaxiter,
    setSarimaxCovType,
    setShowSarimaxAdvanced,
    setProphetChangepointPriorScale,
    setProphetSeasonalityPriorScale,
    setProphetHolidaysPriorScale,
    setProphetNChangepoints,
    setProphetChangepointRange,
    setProphetGrowth,
    setProphetWeeklySeasonality,
    setProphetWeeklySeasonalityOrder,
    setProphetDailySeasonality,
    setProphetDailySeasonalityOrder,
    setProphetMcmcSamples,
    setNeuralProphetNLags,
    setNeuralProphetNForecasts,
    setLaggedFeatures,
    setNpFeatureLagsMode,
    setNpFeatureLagsUniform,
    setNpFeatureLagsJson,
    setNpEpochs,
    setNpNChangepoints,
    setNpChangepointsRange,
    setNpTrendReg,
    setNpSeasonalityReg,
    setNpSeasonalityMode,
    setNpYearlySeasonality,
    setNpYearlySeasonalityOrder,
    setNpArReg,
    setNpLearningRate,
    setNpBatchSize,
    setNpNewerSamplesWeight,
    setShowNeuralProphetAdvanced,
    setFeatures,
    setShowAdvanced,
    setShowForecastOptions,
    setEdaRoute,
    setEdaSeasonalPeriods,
    setEdaSeasonalityPeriodsText,
    setEdaNHarmonicsMode,
    setEdaNHarmonicsShared,
    setEdaNHarmonicsJson,
    setEdaUseHac,
    setEdaIncludeKruskalWallis,
    setEdaKwTestsMode,
    setEdaKwTestsJson,
    setEdaUnitRootRegression,
    setEdaIncludeBreakTest,
    setEdaDecomposePeriod,
    setEdaDecomposeModel,
    setEdaAcfLags,
    setEdaAnnotated,
    setEdaSmoothingMethod,
    setEdaSmoothingWindow,
    setThresholdMode,
    setThreshold,
    setTotalEnergyName,
    setTotalEnergyMeters,
    setOverageWindows,
    setIncludedMeters,
    setSeriesMeters,
    setAnalysisWindowStart,
    setAnalysisWindowEnd,
    setContributionWindowStart,
    setContributionWindowEnd,
    setPlotWindowStart,
    setPlotWindowEnd,
    setContributionsTopN,
    setEventContributionsTopN,
    setContributionsMethod,
    setHeatmapNormalize,
    setHeatmapTopN,
    setCleanAllMeters,
    setNThresholds,
    setThresholdMin,
    setThresholdMax,
    setRpcaTol,
    setRpcaMaxIter,
    setShowThresholdAdvanced,
    setOutlierZapMode,
    setManualOutlierReplacement,
    setManualOutliers,
    setOutlierZapPreviewMeter,
    setMeterGroups,
    setEditingGroupId,
    setShowMeterGroups,
    shouldShowField,
    applyDatePreset,
    parseSeasonalityPeriodsText,
    syncFeatureLagsJsonForFeatures,
    syncNHarmonicsJsonForPeriods,
    syncKwTestsJsonForPeriods,
    addMeterGroup,
    editMeterGroup,
    cancelEdit,
    removeMeterGroup,
    updateMeterGroupName,
    updateMeterGroupMeters,
    saveMeterGroup,
  };
}
