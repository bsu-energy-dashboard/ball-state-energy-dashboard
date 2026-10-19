import type { CleaningMethod, EdaRoute, PlotType } from "./api";

export type MeterSelectionMode = "all" | "clear";

export interface DashboardFormPatch {
  id: string;
  targetPlotType?: PlotType;
  summary: string;
  updates: {
    startDate?: string;
    endDate?: string;
    meter?: string;
    cleaningMethod?: CleaningMethod | "";
    cleaningWindow?: number;
    cleaningNSigma?: number;
    smoothingMethod?: "ma" | "hp";
    smoothingWindow?: number;
    hpLambda?: number;
    forecast?: boolean;
    assessment?: boolean;
    testHours?: number;
    forecastModel?: "Prophet" | "SARIMAX" | "NeuralProphet";
    forecastIntervalType?: "two-sided" | "upper-bounded" | "lower-bounded";
    forecastIntervalWidth?: number;
    edaRoute?: EdaRoute;
    edaSeasonalPeriods?: number;
    edaSeasonalityPeriodsText?: string;
    edaUseHac?: boolean;
    edaIncludeKruskalWallis?: boolean;
    edaUnitRootRegression?: "c" | "ct";
    edaIncludeBreakTest?: boolean;
    edaDecomposePeriod?: number;
    edaDecomposeModel?: "additive" | "multiplicative";
    edaAcfLags?: number;
    edaAnnotated?: boolean;
    edaSmoothingMethod?: "ma" | "hp";
    edaSmoothingWindow?: number;
    thresholdMode?: "rpca" | "fixed";
    threshold?: string;
    totalEnergyName?: string;
    totalEnergyMeters?: string[];
    totalEnergyMetersMode?: MeterSelectionMode;
    includedMeters?: string[];
    includedMetersMode?: MeterSelectionMode;
    seriesMeters?: string[];
    seriesMetersMode?: MeterSelectionMode;
    analysisWindowStart?: string;
    analysisWindowEnd?: string;
    contributionWindowStart?: string;
    contributionWindowEnd?: string;
    plotWindowStart?: string;
    plotWindowEnd?: string;
    nThresholds?: number;
    rpcaTol?: number;
    rpcaMaxIter?: number;
    showThresholdAdvanced?: boolean;
  };
  notes?: string[];
}
