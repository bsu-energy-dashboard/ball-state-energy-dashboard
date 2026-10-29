import type { EdaRoute, OutlierZapMode } from "./api";
import type {
  NpFeatureLagsUi,
  NpYearlySeasonalityUi,
  ProphetSeasonalityBoolUi,
} from "../constants/neuralProphetFields";

export interface MeterGroup {
  id: string;
  name: string;
  meters: string[];
}

export interface OverageWindow {
  id: string;
  start: string;
  end: string;
}

export interface ParameterFormState {
  startDate: string;
  endDate: string;
  meter: string;
  cleaningMethod: string;
  cleaningExtra: Record<string, number>;
  cleaningDaily: boolean;
  cleaningWeekly: boolean;
  smoothingMethod: "" | "ma" | "hp";
  smoothingWindow: number;
  hpLambda: number;
  forecast: boolean;
  assessment: boolean;
  testHours: number;
  forecastIntervalType: "two-sided" | "upper-bounded" | "lower-bounded";
  forecastIntervalWidth: number;
  forecastModel: "Prophet" | "SARIMAX" | "NeuralProphet";
  sarimaxOrder: [number, number, number];
  sarimaxSeasonalOrder: [number, number, number, number];
  sarimaxTrend: "" | "n" | "c" | "t" | "ct";
  sarimaxEnforceStationarity: boolean;
  sarimaxEnforceInvertibility: boolean;
  sarimaxConcentrateScale: boolean;
  sarimaxMeasurementError: boolean;
  sarimaxSimpleDifferencing: boolean;
  sarimaxMethod: "lbfgs" | "nm" | "powell" | "bfgs" | "cg";
  sarimaxMaxiter: number;
  sarimaxCovType: "opg" | "oim" | "robust";
  showSarimaxAdvanced: boolean;
  prophetChangepointPriorScale: number;
  prophetSeasonalityPriorScale: number;
  prophetHolidaysPriorScale: number;
  prophetNChangepoints: number;
  prophetChangepointRange: number;
  prophetGrowth: "linear" | "logistic" | "flat";
  prophetWeeklySeasonality: ProphetSeasonalityBoolUi;
  prophetWeeklySeasonalityOrder: number;
  prophetDailySeasonality: ProphetSeasonalityBoolUi;
  prophetDailySeasonalityOrder: number;
  prophetMcmcSamples: number;
  neuralProphetNLags: number;
  neuralProphetNForecasts: number;
  laggedFeatures: string[];
  npFeatureLagsMode: NpFeatureLagsUi;
  npFeatureLagsUniform: string;
  npFeatureLagsJson: string;
  npEpochs: string;
  npNChangepoints: number;
  npChangepointsRange: number;
  npTrendReg: number;
  npSeasonalityReg: number;
  npSeasonalityMode: "additive" | "multiplicative";
  npYearlySeasonality: NpYearlySeasonalityUi;
  npYearlySeasonalityOrder: number;
  npArReg: string;
  npLearningRate: string;
  npBatchSize: string;
  npNewerSamplesWeight: string;
  showNeuralProphetAdvanced: boolean;
  features: string[];
  showAdvanced: boolean;
  showForecastOptions: boolean;
  edaRoute: EdaRoute;
  edaSeasonalPeriods: number;
  edaSeasonalityPeriodsText: string;
  edaNHarmonicsMode: "auto" | "shared" | "dict";
  edaNHarmonicsShared: string;
  edaNHarmonicsJson: string;
  edaUseHac: boolean;
  edaIncludeKruskalWallis: boolean;
  edaKwTestsMode: "auto" | "custom";
  edaKwTestsJson: string;
  edaUnitRootRegression: "c" | "ct";
  edaIncludeBreakTest: boolean;
  edaDecomposePeriod: number;
  edaDecomposeModel: "additive" | "multiplicative";
  edaAcfLags: number;
  edaAnnotated: boolean;
  edaSmoothingMethod: "ma" | "hp";
  edaSmoothingWindow: number;
  thresholdMode: "rpca" | "fixed";
  threshold: string;
  totalEnergyName: string;
  totalEnergyMeters: string[];
  overageWindows: OverageWindow[];
  includedMeters: string[];
  seriesMeters: string[];
  analysisWindowStart: string;
  analysisWindowEnd: string;
  contributionWindowStart: string;
  contributionWindowEnd: string;
  plotWindowStart: string;
  plotWindowEnd: string;
  contributionsTopN: number;
  eventContributionsTopN: number;
  contributionsMethod: "sparse" | "raw";
  heatmapNormalize: boolean;
  heatmapTopN: number;
  cleanAllMeters: boolean;
  nThresholds: number;
  thresholdMin: string;
  thresholdMax: string;
  rpcaTol: number;
  rpcaMaxIter: number;
  showThresholdAdvanced: boolean;
  outlierZapMode: OutlierZapMode;
  manualOutlierReplacement: "average" | "zero";
  manualOutliers: Record<string, string[]>;
  outlierZapPreviewMeter: string;
}
