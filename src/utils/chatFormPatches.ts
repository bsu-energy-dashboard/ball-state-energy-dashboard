import { CAMPUS_RPCA_DEMO } from "../constants/campusRpcaGuide";
import type { CleaningMethod, EdaRoute, PlotType } from "../types/api";
import type { DashboardFormPatch } from "../types/formAutomation";

const PLOT_KEYWORDS: Array<[PlotType, RegExp]> = [
  ["rpca-analysis", /\b(campus\s+)?rpca\b|\bcampus overview\b/i],
  ["threshold-detection", /\bthreshold\b|\boverage\b|\benergy limits\b/i],
  ["eda-plots", /\beda\b|\bexploratory\b/i],
  ["temperature-analysis", /\btemperature\b|\bweather\b/i],
  ["seasonal-analysis", /\bseasonal\b|\bseasonality\b/i],
  ["time-series", /\bforecast\b|\bpredict\b|\bassessment\b/i],
  ["usage-history", /\btime\s*series\b|\bplot\b|\bchart\b/i],
];

const CLEANING_METHODS: CleaningMethod[] = [
  "Prophet",
  "Hampel",
  "Polynomial",
  "Neural",
  "Fencing",
  "None",
];

const CHANGE_VERBS =
  /\b(set|switch|change|configure|config|fill|use|update|select|clear|prepare|make|show|open)\b/i;

function newPatchId(): string {
  return `chat-form-${crypto.randomUUID()}`;
}

function toDateTime(value: string, endOfDay = false): string {
  if (value.includes("T")) return value.slice(0, 16);
  return `${value}T${endOfDay ? "23:59" : "00:00"}`;
}

function dateRange(text: string, label?: string): [string, string] | null {
  const date = String.raw`(\d{4}-\d{2}-\d{2})(?:[T ]\d{2}:\d{2})?`;
  const prefix = label ? `${label}\\s+` : "";
  const match = text.match(
    new RegExp(`${prefix}${date}\\s*(?:to|through|-|–|until)\\s*${date}`, "i"),
  );
  if (!match?.[1] || !match?.[2]) return null;
  return [match[1], match[2]];
}

function numberAfter(text: string, label: RegExp): number | undefined {
  const match = text.match(
    new RegExp(`${label.source}\\s*(?:=|:|to|is)?\\s*([0-9]+(?:\\.[0-9]+)?)`, "i"),
  );
  if (!match?.[1]) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function textAfter(text: string, label: RegExp): string | undefined {
  const match = text.match(
    new RegExp(`${label.source}\\s*(?:=|:|to|as|is)?\\s*([A-Za-z0-9_+./:-]+)`, "i"),
  );
  return match?.[1]?.trim();
}

function targetFromText(text: string): PlotType | undefined {
  return PLOT_KEYWORDS.find(([, regex]) => regex.test(text))?.[0];
}

function cleaningMethodFromText(text: string): CleaningMethod | undefined {
  return CLEANING_METHODS.find((method) =>
    new RegExp(`\\b${method}\\b`, "i").test(text),
  );
}

function smoothingMethodFromText(text: string): "ma" | "hp" | undefined {
  if (/\bhp\b|\bhodrick\b|\bprescott\b/i.test(text)) return "hp";
  if (/\bma\b|\bmoving\s+average\b/i.test(text)) return "ma";
  return undefined;
}

function forecastModelFromText(
  text: string,
): "Prophet" | "SARIMAX" | "NeuralProphet" | undefined {
  if (/\bneural\s*prophet\b|\bneuralprophet\b/i.test(text)) {
    return "NeuralProphet";
  }
  if (/\bsarimax\b/i.test(text)) return "SARIMAX";
  if (/\bprophet\b/i.test(text)) return "Prophet";
  return undefined;
}

function edaRouteFromText(text: string): EdaRoute | undefined {
  if (/\btrend\b|\bmann\s*kendall\b|\bseasonal\s+kendall\b/i.test(text)) {
    return "trend-tests";
  }
  if (/\bseasonality\s+test\b|\bharmonic\b|\bkruskal\b|\bocsb\b/i.test(text)) {
    return "seasonality-tests";
  }
  if (/\bunit\s*root\b|\badf\b|\bkpss\b/i.test(text)) {
    return "unit-root-tests";
  }
  if (/\bdecompose\b|\bdecomposition\b/i.test(text)) {
    return "seasonal-decompose";
  }
  if (/\bautocorr\b|\bauto\s*correlation\b|\bacf\b/i.test(text)) {
    return "autocorr";
  }
  if (/\bannotated\b/i.test(text)) return "annotated-timeseries";
  return undefined;
}

function booleanFor(text: string, label: RegExp): boolean | undefined {
  if (new RegExp(`\\b(?:enable|turn on|include|show|shade)\\s+${label.source}`, "i").test(text)) {
    return true;
  }
  if (new RegExp(`\\b(?:disable|turn off|exclude|hide|omit)\\s+${label.source}`, "i").test(text)) {
    return false;
  }
  return undefined;
}

function looksLikeFormControlRequest(text: string): boolean {
  const lower = text.toLowerCase();
  if (CHANGE_VERBS.test(text)) return true;
  return (
    /\b(demo|testing|test|smoke)\s+(config|setup|settings)\b/.test(lower) ||
    /\b(config|setup|settings)\s+(for\s+)?(demo|testing|test|smoke)\b/.test(
      lower,
    )
  );
}

function buildRecommendedRpcaPatch(text: string): DashboardFormPatch {
  const threshold = numberAfter(text, /\bthreshold\b/) ?? CAMPUS_RPCA_DEMO.threshold;
  return {
    id: newPatchId(),
    targetPlotType: "rpca-analysis",
    summary: "Demo Campus RPCA setup",
    updates: {
      ...CAMPUS_RPCA_DEMO,
      threshold: String(threshold),
    },
    notes: [
      "Check which meter you want to compare and which meters make up the campus total. After applying these settings, click Generate in the Campus overview panel to get your results.",
    ],
  };
}

function buildRecommendedThresholdPatch(text: string): DashboardFormPatch {
  const threshold = numberAfter(text, /\bthreshold\b/) ?? 22000;
  return {
    id: newPatchId(),
    targetPlotType: "threshold-detection",
    summary: "Demo threshold detection setup",
    updates: {
      startDate: "2024-04-01T00:00",
      endDate: "2025-07-28T23:59",
      cleaningMethod: "Polynomial",
      cleaningWindow: 12,
      cleaningNSigma: 3.3,
      thresholdMode: "fixed",
      threshold: String(threshold),
      includedMetersMode: "all",
      analysisWindowStart: "2024-04-01",
      analysisWindowEnd: "2024-10-30",
      contributionWindowStart: "2024-08-20",
      contributionWindowEnd: "2024-08-31",
      plotWindowStart: "2024-08-14",
      plotWindowEnd: "2024-08-30",
      showThresholdAdvanced: true,
    },
    notes: [
      "Pick the main meter or a saved total-energy meter group before running.",
    ],
  };
}

export function createFormPatchFromChat(
  text: string,
  currentPlotType: PlotType,
): DashboardFormPatch | null {
  const trimmed = text.trim();
  if (!trimmed || !looksLikeFormControlRequest(trimmed)) return null;

  const requestedTarget = targetFromText(trimmed);
  const targetPlotType = requestedTarget ?? currentPlotType;

  if (
    targetPlotType === "rpca-analysis" &&
    /\b(demo|testing|test|smoke|recommended|good config|setup)\b/i.test(trimmed)
  ) {
    return buildRecommendedRpcaPatch(trimmed);
  }

  if (
    targetPlotType === "threshold-detection" &&
    /\b(demo|testing|test|smoke|recommended|good config|setup)\b/i.test(trimmed)
  ) {
    return buildRecommendedThresholdPatch(trimmed);
  }

  const updates: DashboardFormPatch["updates"] = {};
  const notes: string[] = [];
  const range = dateRange(trimmed);
  if (range) {
    updates.startDate = toDateTime(range[0]);
    updates.endDate = toDateTime(range[1], true);
  }

  const analysisRange = dateRange(trimmed, "analysis(?:\\s+window)?");
  if (analysisRange) {
    updates.analysisWindowStart = analysisRange[0];
    updates.analysisWindowEnd = analysisRange[1];
    updates.showThresholdAdvanced = true;
  }

  const contributionRange = dateRange(trimmed, "contribution(?:\\s+window)?");
  if (contributionRange) {
    updates.contributionWindowStart = contributionRange[0];
    updates.contributionWindowEnd = contributionRange[1];
    updates.showThresholdAdvanced = true;
  }

  const plotRange = dateRange(trimmed, "plot(?:\\s+window)?");
  if (plotRange) {
    updates.plotWindowStart = plotRange[0];
    updates.plotWindowEnd = plotRange[1];
    updates.showThresholdAdvanced = true;
  }

  const cleaningMethod = cleaningMethodFromText(trimmed);
  if (cleaningMethod) updates.cleaningMethod = cleaningMethod;

  const cleaningWindow = numberAfter(trimmed, /\bcleaning\s+window\b/);
  if (cleaningWindow !== undefined) updates.cleaningWindow = cleaningWindow;

  const cleaningNSigma = numberAfter(trimmed, /\bn[_\s-]?sigma\b/);
  if (cleaningNSigma !== undefined) updates.cleaningNSigma = cleaningNSigma;

  const smoothingMethod = smoothingMethodFromText(trimmed);
  if (smoothingMethod) {
    updates.smoothingMethod = smoothingMethod;
  }

  const smoothingWindow =
    numberAfter(trimmed, /\bsmoothing\s+window\b/) ??
    numberAfter(trimmed, /\bwindow\b/);
  if (
    smoothingWindow !== undefined &&
    targetPlotType !== "rpca-analysis" &&
    targetPlotType !== "threshold-detection"
  ) {
    updates.smoothingWindow = smoothingWindow;
  }

  const hpLambda = numberAfter(trimmed, /\b(?:hp\s+)?lambda\b/);
  if (hpLambda !== undefined) {
    updates.smoothingMethod = "hp";
    updates.hpLambda = hpLambda;
  }

  if (targetPlotType === "time-series") {
    const forecastRequested = booleanFor(trimmed, /\bforecast(?:\s+mode)?\b/);
    const assessmentRequested = booleanFor(trimmed, /\bassessment(?:\s+mode)?\b/);
    if (forecastRequested !== undefined || /\bforecast\b|\bpredict\b/i.test(trimmed)) {
      updates.forecast = forecastRequested ?? true;
      if (updates.forecast) updates.assessment = false;
    }
    if (assessmentRequested !== undefined || /\bassessment\b/i.test(trimmed)) {
      updates.assessment = assessmentRequested ?? true;
      if (updates.assessment) updates.forecast = false;
    }
    const testHours =
      numberAfter(trimmed, /\bforecast\s+hours?\b/) ??
      numberAfter(trimmed, /\btest\s+hours?\b/) ??
      numberAfter(trimmed, /\bhours?\b/);
    if (testHours !== undefined) updates.testHours = testHours;
    const forecastModel = forecastModelFromText(trimmed);
    if (forecastModel) updates.forecastModel = forecastModel;
    if (/\bupper[-\s]?bounded\b/i.test(trimmed)) {
      updates.forecastIntervalType = "upper-bounded";
    } else if (/\blower[-\s]?bounded\b/i.test(trimmed)) {
      updates.forecastIntervalType = "lower-bounded";
    } else if (/\btwo[-\s]?sided\b/i.test(trimmed)) {
      updates.forecastIntervalType = "two-sided";
    }
    const intervalWidth = numberAfter(trimmed, /\binterval\s+width\b|\bconfidence\s+width\b/);
    if (intervalWidth !== undefined) updates.forecastIntervalWidth = intervalWidth;
  }

  if (targetPlotType === "eda-plots") {
    const edaRoute = edaRouteFromText(trimmed);
    if (edaRoute) updates.edaRoute = edaRoute;
    const seasonalPeriods = numberAfter(trimmed, /\bseasonal\s+periods?\b/);
    if (seasonalPeriods !== undefined) updates.edaSeasonalPeriods = seasonalPeriods;
    const seasonalityPeriods = trimmed.match(
      /\bseasonality\s+periods?\s*(?:=|:|to|as|is)?\s*([0-9,\s]+)/i,
    )?.[1];
    if (seasonalityPeriods) {
      updates.edaSeasonalityPeriodsText = seasonalityPeriods
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");
    }
    const hac = booleanFor(trimmed, /\bhac\b/);
    if (hac !== undefined) updates.edaUseHac = hac;
    const kw = booleanFor(trimmed, /\bkruskal(?:[-\s]?wallis)?\b|\bkw\b/);
    if (kw !== undefined) updates.edaIncludeKruskalWallis = kw;
    if (/\bregression\s+ct\b|\bconstant\s*\+\s*trend\b/i.test(trimmed)) {
      updates.edaUnitRootRegression = "ct";
    } else if (/\bregression\s+c\b|\bconstant\s+only\b/i.test(trimmed)) {
      updates.edaUnitRootRegression = "c";
    }
    const breakTest = booleanFor(trimmed, /\bbreak\s+test\b|\bzivot\b/);
    if (breakTest !== undefined) updates.edaIncludeBreakTest = breakTest;
    const decomposePeriod = numberAfter(trimmed, /\bdecompose\s+period\b|\bdecomposition\s+period\b/);
    if (decomposePeriod !== undefined) updates.edaDecomposePeriod = decomposePeriod;
    if (/\bmultiplicative\b/i.test(trimmed)) {
      updates.edaDecomposeModel = "multiplicative";
    } else if (/\badditive\b/i.test(trimmed)) {
      updates.edaDecomposeModel = "additive";
    }
    const acfLags = numberAfter(trimmed, /\bacf\s+lags?\b|\blags?\b/);
    if (acfLags !== undefined) updates.edaAcfLags = acfLags;
    const annotated = booleanFor(trimmed, /\bannotated\b|\bshade\b|\bcovariate\s+regions?\b/);
    if (annotated !== undefined) updates.edaAnnotated = annotated;
    const edaSmoothingMethod = smoothingMethodFromText(trimmed);
    if (edaSmoothingMethod && /annotated|eda/i.test(trimmed)) {
      updates.edaSmoothingMethod = edaSmoothingMethod;
    }
    if (smoothingWindow !== undefined && /annotated|eda/i.test(trimmed)) {
      updates.edaSmoothingWindow = smoothingWindow;
    }
  }

  const nThresholds = numberAfter(trimmed, /\bn[_\s-]?thresholds?\b/);
  if (nThresholds !== undefined && targetPlotType === "threshold-detection") {
    updates.nThresholds = nThresholds;
    updates.showThresholdAdvanced = true;
  }

  const rpcaTol = numberAfter(trimmed, /\brpca\s+(?:tol|tolerance)\b/);
  if (rpcaTol !== undefined && targetPlotType === "threshold-detection") {
    updates.rpcaTol = rpcaTol;
    updates.showThresholdAdvanced = true;
  }

  const rpcaMaxIter = numberAfter(trimmed, /\brpca\s+max(?:imum)?\s+iter(?:ations?)?\b/);
  if (rpcaMaxIter !== undefined && targetPlotType === "threshold-detection") {
    updates.rpcaMaxIter = rpcaMaxIter;
    updates.showThresholdAdvanced = true;
  }

  const thresholdValue = numberAfter(trimmed, /\bthreshold\b/);
  if (thresholdValue !== undefined) {
    if (targetPlotType === "threshold-detection") updates.thresholdMode = "fixed";
    updates.threshold = String(thresholdValue);
  }

  if (
    targetPlotType === "threshold-detection" &&
    /\brpca\s+mode\b|\bauto(?:matic)?\s+threshold\b/i.test(trimmed)
  ) {
    updates.thresholdMode = "rpca";
  }

  if (
    targetPlotType === "threshold-detection" &&
    /\bfixed\s+(?:threshold|mode)\b/i.test(trimmed)
  ) {
    updates.thresholdMode = "fixed";
  }

  const totalEnergyName = textAfter(trimmed, /\btotal\s+energy(?:\s+series)?(?:\s+name)?\b/);
  if (totalEnergyName) updates.totalEnergyName = totalEnergyName;

  const meter = textAfter(trimmed, /\bmain\s+meter\b|\bmeter\b/);
  if (meter && !["all", "clear", "rpca", "threshold"].includes(meter.toLowerCase())) {
    updates.meter = meter;
  }

  if (/\b(clear|remove)\s+(all\s+)?(?:decomposition|rpca|included)\s+meters\b/i.test(trimmed)) {
    updates.includedMetersMode = "clear";
  } else if (/\b(select|include|use)\s+all\s+(?:decomposition|rpca|included)?\s*meters\b/i.test(trimmed)) {
    updates.includedMetersMode = "all";
  }

  if (/\b(clear|remove)\s+(all\s+)?(?:source|total(?:\s+energy)?)\s+meters\b/i.test(trimmed)) {
    updates.totalEnergyMetersMode = "clear";
  } else if (/\b(select|include|use)\s+all\s+(?:source|total(?:\s+energy)?)\s+meters\b/i.test(trimmed)) {
    updates.totalEnergyMetersMode = "all";
    notes.push("Using all source meters for total energy can be noisy; for demos, pick the official campus-total components when you know them.");
  }

  if (/\b(clear|remove)\s+(all\s+)?series\s+meters\b/i.test(trimmed)) {
    updates.seriesMetersMode = "clear";
  } else if (/\b(select|include|use)\s+all\s+series\s+meters\b/i.test(trimmed)) {
    updates.seriesMetersMode = "all";
  }

  if (Object.keys(updates).length === 0 && requestedTarget) {
    return {
      id: newPatchId(),
      targetPlotType,
      summary: `Switch to ${targetPlotType.replaceAll("-", " ")}`,
      updates: {},
    };
  }

  if (Object.keys(updates).length === 0) return null;

  return {
    id: newPatchId(),
    targetPlotType,
    summary: `${targetPlotType.replaceAll("-", " ")} settings from chat`,
    updates,
    notes: notes.length ? notes : undefined,
  };
}

export function describeFormPatch(patch: DashboardFormPatch): string[] {
  const items: string[] = [];
  const updates = patch.updates;
  if (patch.targetPlotType) {
    items.push(`Open ${patch.targetPlotType.replaceAll("-", " ")}`);
  }
  if (updates.startDate || updates.endDate) {
    items.push(`Date range ${updates.startDate ?? "current"} to ${updates.endDate ?? "current"}`);
  }
  if (updates.meter) items.push(`Main meter ${updates.meter}`);
  if (updates.cleaningMethod) items.push(`Cleaning ${updates.cleaningMethod}`);
  if (updates.smoothingMethod) items.push(`Smoothing ${updates.smoothingMethod}`);
  if (updates.smoothingWindow) items.push(`Smoothing window ${updates.smoothingWindow}`);
  if (updates.hpLambda) items.push(`HP lambda ${updates.hpLambda}`);
  if (updates.forecast !== undefined) items.push(`${updates.forecast ? "Enable" : "Disable"} forecast mode`);
  if (updates.assessment !== undefined) items.push(`${updates.assessment ? "Enable" : "Disable"} assessment mode`);
  if (updates.testHours) items.push(`Forecast hours ${updates.testHours}`);
  if (updates.forecastModel) items.push(`Forecast model ${updates.forecastModel}`);
  if (updates.edaRoute) items.push(`EDA route ${updates.edaRoute}`);
  if (updates.edaSeasonalPeriods) items.push(`Seasonal periods ${updates.edaSeasonalPeriods}`);
  if (updates.edaSeasonalityPeriodsText) items.push(`Seasonality periods ${updates.edaSeasonalityPeriodsText}`);
  if (updates.edaAcfLags) items.push(`ACF lags ${updates.edaAcfLags}`);
  if (updates.edaDecomposePeriod) items.push(`Decompose period ${updates.edaDecomposePeriod}`);
  if (updates.edaDecomposeModel) items.push(`Decompose model ${updates.edaDecomposeModel}`);
  if (updates.thresholdMode) items.push(`Threshold mode ${updates.thresholdMode}`);
  if (updates.threshold) items.push(`Threshold ${updates.threshold}`);
  if (updates.totalEnergyName) items.push(`Total energy name ${updates.totalEnergyName}`);
  if (updates.totalEnergyMetersMode) items.push(`${updates.totalEnergyMetersMode} total-energy source meters`);
  if (updates.includedMetersMode) items.push(`${updates.includedMetersMode} decomposition meters`);
  if (updates.nThresholds) items.push(`n_thresholds ${updates.nThresholds}`);
  if (updates.rpcaMaxIter) items.push(`RPCA max iterations ${updates.rpcaMaxIter}`);
  if (updates.rpcaTol) items.push(`RPCA tolerance ${updates.rpcaTol}`);
  return items;
}
