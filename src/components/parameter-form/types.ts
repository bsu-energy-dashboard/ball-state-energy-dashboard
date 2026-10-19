import type { Dispatch, SetStateAction } from "react";
import type { ParameterFormState } from "../../types/parameterForm";
import type {
  FormField,
  MeterListResponse,
  PlotType,
} from "../../types/api";
import type { DatePreset } from "../../utils/parameter-form/applyDatePreset";
import type { MeterGroup, OverageWindow } from "../../types/parameterForm";

type Setter<T> = Dispatch<SetStateAction<T>>;

export interface ParameterFormBindings extends ParameterFormState {
  selectedPlotType: PlotType;
  meterGroups: MeterGroup[];
  editingGroupId: string | null;
  showMeterGroups: boolean;
  allMeters: string[];
  meterList?: MeterListResponse;
  minDate: string;
  maxDate: string;
  shouldShowField: (field: FormField) => boolean;
  applyDatePreset: (preset: DatePreset) => void;
  syncFeatureLagsJsonForFeatures: (
    currentJson: string,
    features: string[],
    defaultLag: number,
  ) => string;
  syncNHarmonicsJsonForPeriods: (
    currentJson: string,
    periods: number[],
  ) => string;
  syncKwTestsJsonForPeriods: (
    currentJson: string,
    periods: number[],
  ) => string;
  parseSeasonalityPeriodsText: (text: string) => number[];
  setStartDate: Setter<string>;
  setEndDate: Setter<string>;
  setMeter: Setter<string>;
  setCleaningMethod: Setter<string>;
  setCleaningExtra: Setter<Record<string, number>>;
  setCleaningDaily: Setter<boolean>;
  setCleaningWeekly: Setter<boolean>;
  setSmoothingMethod: Setter<"ma" | "hp">;
  setSmoothingWindow: Setter<number>;
  setHpLambda: Setter<number>;
  setForecast: Setter<boolean>;
  setAssessment: Setter<boolean>;
  setTestHours: Setter<number>;
  setForecastIntervalType: Setter<
    "two-sided" | "upper-bounded" | "lower-bounded"
  >;
  setForecastIntervalWidth: Setter<number>;
  setForecastModel: Setter<"Prophet" | "SARIMAX" | "NeuralProphet">;
  setSarimaxOrder: Setter<[number, number, number]>;
  setSarimaxSeasonalOrder: Setter<[number, number, number, number]>;
  setSarimaxTrend: Setter<"" | "n" | "c" | "t" | "ct">;
  setSarimaxEnforceStationarity: Setter<boolean>;
  setSarimaxEnforceInvertibility: Setter<boolean>;
  setSarimaxConcentrateScale: Setter<boolean>;
  setSarimaxMeasurementError: Setter<boolean>;
  setSarimaxSimpleDifferencing: Setter<boolean>;
  setSarimaxMethod: Setter<"lbfgs" | "nm" | "powell" | "bfgs" | "cg">;
  setSarimaxMaxiter: Setter<number>;
  setSarimaxCovType: Setter<"opg" | "oim" | "robust">;
  setShowSarimaxAdvanced: Setter<boolean>;
  setProphetChangepointPriorScale: Setter<number>;
  setProphetSeasonalityPriorScale: Setter<number>;
  setProphetHolidaysPriorScale: Setter<number>;
  setProphetNChangepoints: Setter<number>;
  setProphetChangepointRange: Setter<number>;
  setProphetGrowth: Setter<"linear" | "logistic" | "flat">;
  setProphetWeeklySeasonality: Setter<
    import("../../constants/neuralProphetFields").ProphetSeasonalityBoolUi
  >;
  setProphetWeeklySeasonalityOrder: Setter<number>;
  setProphetDailySeasonality: Setter<
    import("../../constants/neuralProphetFields").ProphetSeasonalityBoolUi
  >;
  setProphetDailySeasonalityOrder: Setter<number>;
  setProphetMcmcSamples: Setter<number>;
  setNeuralProphetNLags: Setter<number>;
  setNeuralProphetNForecasts: Setter<number>;
  setLaggedFeatures: Setter<string[]>;
  setNpFeatureLagsMode: Setter<
    import("../../constants/neuralProphetFields").NpFeatureLagsUi
  >;
  setNpFeatureLagsUniform: Setter<string>;
  setNpFeatureLagsJson: Setter<string>;
  setNpEpochs: Setter<string>;
  setNpNChangepoints: Setter<number>;
  setNpChangepointsRange: Setter<number>;
  setNpTrendReg: Setter<number>;
  setNpSeasonalityReg: Setter<number>;
  setNpSeasonalityMode: Setter<"additive" | "multiplicative">;
  setNpYearlySeasonality: Setter<
    import("../../constants/neuralProphetFields").NpYearlySeasonalityUi
  >;
  setNpYearlySeasonalityOrder: Setter<number>;
  setNpArReg: Setter<string>;
  setNpLearningRate: Setter<string>;
  setNpBatchSize: Setter<string>;
  setNpNewerSamplesWeight: Setter<string>;
  setShowNeuralProphetAdvanced: Setter<boolean>;
  setFeatures: Setter<string[]>;
  setShowAdvanced: Setter<boolean>;
  setShowForecastOptions: Setter<boolean>;
  setEdaRoute: Setter<import("../../types/api").EdaRoute>;
  setEdaSeasonalPeriods: Setter<number>;
  setEdaSeasonalityPeriodsText: Setter<string>;
  setEdaNHarmonicsMode: Setter<"auto" | "shared" | "dict">;
  setEdaNHarmonicsShared: Setter<string>;
  setEdaNHarmonicsJson: Setter<string>;
  setEdaUseHac: Setter<boolean>;
  setEdaIncludeKruskalWallis: Setter<boolean>;
  setEdaKwTestsMode: Setter<"auto" | "custom">;
  setEdaKwTestsJson: Setter<string>;
  setEdaUnitRootRegression: Setter<"c" | "ct">;
  setEdaIncludeBreakTest: Setter<boolean>;
  setEdaDecomposePeriod: Setter<number>;
  setEdaDecomposeModel: Setter<"additive" | "multiplicative">;
  setEdaAcfLags: Setter<number>;
  setEdaAnnotated: Setter<boolean>;
  setEdaSmoothingMethod: Setter<"ma" | "hp">;
  setEdaSmoothingWindow: Setter<number>;
  setThresholdMode: Setter<"rpca" | "fixed">;
  setThreshold: Setter<string>;
  setTotalEnergyName: Setter<string>;
  setTotalEnergyMeters: Setter<string[]>;
  setOverageWindows: Setter<OverageWindow[]>;
  setIncludedMeters: Setter<string[]>;
  setSeriesMeters: Setter<string[]>;
  setAnalysisWindowStart: Setter<string>;
  setAnalysisWindowEnd: Setter<string>;
  setContributionWindowStart: Setter<string>;
  setContributionWindowEnd: Setter<string>;
  setPlotWindowStart: Setter<string>;
  setPlotWindowEnd: Setter<string>;
  setContributionsTopN: Setter<number>;
  setEventContributionsTopN: Setter<number>;
  setContributionsMethod: Setter<"sparse" | "raw">;
  setHeatmapNormalize: Setter<boolean>;
  setHeatmapTopN: Setter<number>;
  setCleanAllMeters: Setter<boolean>;
  setNThresholds: Setter<number>;
  setThresholdMin: Setter<string>;
  setThresholdMax: Setter<string>;
  setRpcaTol: Setter<number>;
  setRpcaMaxIter: Setter<number>;
  setShowThresholdAdvanced: Setter<boolean>;
  setOutlierZapMode: Setter<import("../../types/api").OutlierZapMode>;
  setManualOutliers: Setter<Record<string, string[]>>;
  setOutlierZapPreviewMeter: Setter<string>;
  setMeterGroups: Setter<MeterGroup[]>;
  setEditingGroupId: Setter<string | null>;
  setShowMeterGroups: Setter<boolean>;
  addMeterGroup: () => void;
  editMeterGroup: (id: string) => void;
  cancelEdit: () => void;
  removeMeterGroup: (id: string) => void;
  updateMeterGroupName: (id: string, name: string) => void;
  updateMeterGroupMeters: (id: string, meters: string[]) => void;
  saveMeterGroup: (id: string) => void;
}
