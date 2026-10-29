import { CalendarDays, Play, Settings2 } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";
import { toast } from "react-toastify";
import type { BaseRequest, PlotType, EdaRoute } from "../../types/api";
import { useMeterList, useDatasetInfo } from "../../services/api";
import { useParameterForm } from "../../hooks/useParameterForm";
import { buildBaseRequest } from "../../utils/parameter-form/buildBaseRequest";
import { datasetIdFromInfo } from "../../utils/manualOutliersStorage";
import { cleaningMethodOptionsForPlot } from "../../constants/cleaningMethods";
import type { DashboardFormPatch } from "../../types/formAutomation";
import { ParameterFormHeader } from "./ParameterFormHeader";

import { EssentialParametersSection } from "./sections/EssentialParametersSection";
import { EdaOptionsSection } from "./sections/EdaOptionsSection";
import { ThresholdOptionsSection } from "./sections/ThresholdOptionsSection";
import { ForecastOptionsSection } from "./sections/ForecastOptionsSection";
import { SmoothingOptionsSection } from "./sections/SmoothingOptionsSection";
import { MeterGroupsSection } from "./sections/MeterGroupsSection";
import { OutlierZapPanel } from "./OutlierZapPanel";

interface ParameterFormProps {
  onSubmit: (params: BaseRequest) => void;
  isLoading: boolean;
  resetSignal: number;
  selectedPlotType?: PlotType;
  initialValues?: BaseRequest | null;
  formPatch?: DashboardFormPatch | null;
  explorationRoute?: EdaRoute;
}

function positiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.round(value));
}

function positiveNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

export default function ParameterForm({
  onSubmit,
  isLoading,
  resetSignal,
  selectedPlotType = "time-series",
  initialValues,
  formPatch,
  explorationRoute,
}: ParameterFormProps) {
  const { data: meterList, isFetched: meterListFetched } = useMeterList();
  const { data: datasetInfo } = useDatasetInfo();
  const datasetId = datasetIdFromInfo(datasetInfo);
  const datasetReady = (meterList?.meters.length ?? 0) > 0;
  const form = useParameterForm({
    resetSignal,
    initialValues,
    selectedPlotType,
    meterList,
  });
  const { edaRoute, setEdaRoute } = form;
  useEffect(() => {
    if (explorationRoute && edaRoute !== explorationRoute) setEdaRoute(explorationRoute);
  }, [explorationRoute, edaRoute, setEdaRoute]);
  const lastAppliedPatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!formPatch || (formPatch.targetPlotType && formPatch.targetPlotType !== selectedPlotType) || lastAppliedPatchIdRef.current === formPatch.id) return;
    lastAppliedPatchIdRef.current = formPatch.id;

    const applied: string[] = [];
    const skipped: string[] = [];
    const updates = formPatch.updates;

    if (updates.startDate) {
      form.setStartDate(updates.startDate);
      applied.push("start date");
    }
    if (updates.endDate) {
      form.setEndDate(updates.endDate);
      applied.push("end date");
    }
    if (updates.meter) {
      if (form.allMeters.includes(updates.meter)) {
        form.setMeter(updates.meter);
        applied.push("main meter");
      } else {
        skipped.push(`main meter "${updates.meter}" was not found`);
      }
    }
    if (updates.cleaningMethod !== undefined) {
      const cleaningOptions = cleaningMethodOptionsForPlot(selectedPlotType);
      const isAllowed = cleaningOptions.some(
        (option) => option.value === updates.cleaningMethod,
      );
      if (isAllowed) {
        form.setCleaningMethod(updates.cleaningMethod);
        applied.push("cleaning method");
      } else {
        skipped.push(`cleaning method "${updates.cleaningMethod}" is not valid here`);
      }
    }
    if (updates.cleaningWindow !== undefined) {
      form.setCleaningExtra((prev) => ({
        ...prev,
        cleaning_window: positiveInt(updates.cleaningWindow ?? 12, 12),
      }));
      applied.push("cleaning window");
    }
    if (updates.cleaningNSigma !== undefined) {
      form.setCleaningExtra((prev) => ({
        ...prev,
        cleaning_n_sigma: positiveNumber(updates.cleaningNSigma ?? 3, 3),
      }));
      applied.push("cleaning n_sigma");
    }
    if (updates.smoothingMethod) {
      form.setSmoothingMethod(updates.smoothingMethod);
      form.setShowAdvanced(true);
      applied.push("smoothing method");
    }
    if (updates.smoothingWindow !== undefined) {
      form.setSmoothingWindow(
        Math.min(30, Math.max(1, positiveInt(updates.smoothingWindow, 7))),
      );
      form.setShowAdvanced(true);
      applied.push("smoothing window");
    }
    if (updates.hpLambda !== undefined) {
      form.setSmoothingMethod("hp");
      form.setHpLambda(positiveInt(updates.hpLambda, 1600));
      form.setShowAdvanced(true);
      applied.push("HP lambda");
    }
    if (updates.forecast !== undefined) {
      form.setForecast(updates.forecast);
      if (updates.forecast) {
        form.setAssessment(false);
        form.setShowForecastOptions(true);
      } else if (!updates.assessment) {
        form.setShowForecastOptions(false);
      }
      applied.push("forecast mode");
    }
    if (updates.assessment !== undefined) {
      form.setAssessment(updates.assessment);
      if (updates.assessment) {
        form.setForecast(false);
        form.setShowForecastOptions(true);
      } else if (!updates.forecast) {
        form.setShowForecastOptions(false);
      }
      applied.push("assessment mode");
    }
    if (updates.testHours !== undefined) {
      form.setTestHours(
        Math.min(8760, Math.max(1, positiveInt(updates.testHours, 240))),
      );
      form.setShowForecastOptions(true);
      applied.push("forecast hours");
    }
    if (updates.forecastModel) {
      form.setForecastModel(updates.forecastModel);
      form.setShowForecastOptions(true);
      applied.push("forecast model");
    }
    if (updates.forecastIntervalType) {
      form.setForecastIntervalType(updates.forecastIntervalType);
      form.setShowForecastOptions(true);
      applied.push("forecast interval type");
    }
    if (updates.forecastIntervalWidth !== undefined) {
      form.setForecastIntervalWidth(
        Math.min(1, Math.max(0, positiveNumber(updates.forecastIntervalWidth, 0.95))),
      );
      form.setShowForecastOptions(true);
      applied.push("forecast interval width");
    }
    if (updates.edaRoute) {
      form.setEdaRoute(updates.edaRoute);
      applied.push("EDA route");
    }
    if (updates.edaSeasonalPeriods !== undefined) {
      form.setEdaSeasonalPeriods(
        Math.max(1, positiveInt(updates.edaSeasonalPeriods, 24)),
      );
      applied.push("EDA seasonal periods");
    }
    if (updates.edaSeasonalityPeriodsText !== undefined) {
      form.setEdaSeasonalityPeriodsText(updates.edaSeasonalityPeriodsText);
      const periods = form.parseSeasonalityPeriodsText(
        updates.edaSeasonalityPeriodsText,
      );
      if (periods.length > 0) {
        form.setEdaNHarmonicsJson((prev) =>
          form.syncNHarmonicsJsonForPeriods(prev, periods),
        );
        form.setEdaKwTestsJson((prev) =>
          form.syncKwTestsJsonForPeriods(prev, periods),
        );
      }
      applied.push("EDA seasonality periods");
    }
    if (updates.edaUseHac !== undefined) {
      form.setEdaUseHac(updates.edaUseHac);
      applied.push("EDA HAC");
    }
    if (updates.edaIncludeKruskalWallis !== undefined) {
      form.setEdaIncludeKruskalWallis(updates.edaIncludeKruskalWallis);
      applied.push("EDA Kruskal-Wallis");
    }
    if (updates.edaUnitRootRegression) {
      form.setEdaUnitRootRegression(updates.edaUnitRootRegression);
      applied.push("EDA unit-root regression");
    }
    if (updates.edaIncludeBreakTest !== undefined) {
      form.setEdaIncludeBreakTest(updates.edaIncludeBreakTest);
      applied.push("EDA break test");
    }
    if (updates.edaDecomposePeriod !== undefined) {
      form.setEdaDecomposePeriod(
        Math.max(1, positiveInt(updates.edaDecomposePeriod, 24)),
      );
      applied.push("EDA decompose period");
    }
    if (updates.edaDecomposeModel) {
      form.setEdaDecomposeModel(updates.edaDecomposeModel);
      applied.push("EDA decompose model");
    }
    if (updates.edaAcfLags !== undefined) {
      form.setEdaAcfLags(Math.max(1, positiveInt(updates.edaAcfLags, 168)));
      applied.push("EDA ACF lags");
    }
    if (updates.edaAnnotated !== undefined) {
      form.setEdaAnnotated(updates.edaAnnotated);
      applied.push("EDA annotation");
    }
    if (updates.edaSmoothingMethod) {
      form.setEdaSmoothingMethod(updates.edaSmoothingMethod);
      applied.push("EDA smoothing method");
    }
    if (updates.edaSmoothingWindow !== undefined) {
      form.setEdaSmoothingWindow(
        Math.max(1, positiveInt(updates.edaSmoothingWindow, 200)),
      );
      applied.push("EDA smoothing window");
    }
    if (updates.thresholdMode) {
      form.setThresholdMode(updates.thresholdMode);
      applied.push("threshold mode");
    }
    if (updates.threshold !== undefined) {
      form.setThreshold(updates.threshold);
      applied.push("threshold");
    }
    if (updates.totalEnergyName !== undefined) {
      form.setTotalEnergyName(updates.totalEnergyName);
      applied.push("total energy name");
    }
    if (updates.totalEnergyMetersMode === "all") {
      form.setTotalEnergyMeters([...(form.meterList?.meters ?? [])]);
      applied.push("all total-energy source meters");
    }
    if (updates.totalEnergyMetersMode === "clear") {
      form.setTotalEnergyMeters([]);
      applied.push("clear total-energy source meters");
    }
    if (updates.totalEnergyMeters?.length) {
      const sourceMeters = new Set(form.meterList?.meters ?? []);
      const validMeters = updates.totalEnergyMeters.filter((meter) =>
        sourceMeters.has(meter),
      );
      const missingMeters = updates.totalEnergyMeters.filter(
        (meter) => !sourceMeters.has(meter),
      );
      form.setTotalEnergyMeters(validMeters);
      applied.push("total-energy source meters");
      if (missingMeters.length) {
        skipped.push(`${missingMeters.length} total-energy source meter(s) were not found`);
      }
    }
    if (updates.includedMetersMode === "all") {
      form.setIncludedMeters(
        selectedPlotType === "rpca-analysis"
          ? [...(form.meterList?.meters ?? [])]
          : [...form.allMeters],
      );
      applied.push("all decomposition meters");
    }
    if (updates.includedMetersMode === "clear") {
      form.setIncludedMeters([]);
      applied.push("clear decomposition meters");
    }
    if (updates.includedMeters?.length) {
      const allowedMeters =
        selectedPlotType === "rpca-analysis"
          ? (form.meterList?.meters ?? [])
          : form.allMeters;
      const availableMeters = new Set(allowedMeters);
      const validMeters = updates.includedMeters.filter((meter) =>
        availableMeters.has(meter),
      );
      const missingMeters = updates.includedMeters.filter(
        (meter) => !availableMeters.has(meter),
      );
      form.setIncludedMeters(validMeters);
      applied.push("decomposition meters");
      if (missingMeters.length) {
        skipped.push(`${missingMeters.length} decomposition meter(s) were not found`);
      }
    }
    if (updates.seriesMetersMode === "all") {
      form.setSeriesMeters([...form.allMeters]);
      applied.push("all series meters");
    }
    if (updates.seriesMetersMode === "clear") {
      form.setSeriesMeters([]);
      applied.push("clear series meters");
    }
    if (updates.seriesMeters?.length) {
      const availableMeters = new Set(form.allMeters);
      form.setSeriesMeters(
        updates.seriesMeters.filter((meter) => availableMeters.has(meter)),
      );
      applied.push("series meters");
    }
    if (updates.analysisWindowStart) {
      form.setAnalysisWindowStart(updates.analysisWindowStart);
      applied.push("analysis window start");
    }
    if (updates.analysisWindowEnd) {
      form.setAnalysisWindowEnd(updates.analysisWindowEnd);
      applied.push("analysis window end");
    }
    if (updates.contributionWindowStart) {
      form.setContributionWindowStart(updates.contributionWindowStart);
      applied.push("contribution window start");
    }
    if (updates.contributionWindowEnd) {
      form.setContributionWindowEnd(updates.contributionWindowEnd);
      applied.push("contribution window end");
    }
    if (updates.plotWindowStart) {
      form.setPlotWindowStart(updates.plotWindowStart);
      applied.push("plot window start");
    }
    if (updates.plotWindowEnd) {
      form.setPlotWindowEnd(updates.plotWindowEnd);
      applied.push("plot window end");
    }
    if (updates.nThresholds !== undefined) {
      form.setNThresholds(Math.max(2, positiveInt(updates.nThresholds, 80)));
      applied.push("n_thresholds");
    }
    if (updates.rpcaTol !== undefined) {
      form.setRpcaTol(positiveNumber(updates.rpcaTol, 1e-6));
      applied.push("RPCA tolerance");
    }
    if (updates.rpcaMaxIter !== undefined) {
      form.setRpcaMaxIter(positiveInt(updates.rpcaMaxIter, 5000));
      applied.push("RPCA max iterations");
    }
    if (updates.showThresholdAdvanced !== undefined) {
      form.setShowThresholdAdvanced(updates.showThresholdAdvanced);
      applied.push("advanced options visibility");
    }

    if (applied.length) {
      toast.success(`Applied ${applied.length} dashboard setting${applied.length === 1 ? "" : "s"}`);
    }
    if (skipped.length) {
      toast.warn(`Some chat settings were skipped: ${skipped.join("; ")}`);
    }
  }, [formPatch, form, selectedPlotType]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = buildBaseRequest({
      state: selectedPlotType === "threshold-detection" ? {
        ...form,
        analysisWindowStart: form.analysisWindowStart || form.startDate.slice(0, 10),
        analysisWindowEnd: form.analysisWindowEnd || form.endDate.slice(0, 10),
        contributionWindowStart: form.contributionWindowStart || form.startDate.slice(0, 10),
        contributionWindowEnd: form.contributionWindowEnd || form.endDate.slice(0, 10),
        plotWindowStart: form.plotWindowStart || form.startDate.slice(0, 10),
        plotWindowEnd: form.plotWindowEnd || form.endDate.slice(0, 10),
      } : form,
      selectedPlotType,
      shouldShowField: form.shouldShowField,
      meterGroups: form.meterGroups,
      datasetId,
    });
    if (result.ok) {
      onSubmit(result.params);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors">
      <ParameterFormHeader />

      <form onSubmit={handleSubmit} className="analysis-form p-4 sm:p-6 space-y-6">
        {meterListFetched && !datasetReady && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            No energy dataset is loaded. Expand <strong>Dataset</strong> above and
            upload your CSV and holiday JSON before running analysis.
          </div>
        )}

        {selectedPlotType === "time-series" && (
          <section className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label htmlFor="prediction-purpose" className="block font-medium">What would you like to do?</label>
            <select id="prediction-purpose" value={form.assessment ? "assessment" : "forecast"} className="w-full rounded-lg border p-3 dark:bg-gray-700 dark:border-gray-600" onChange={(e) => { form.setAssessment(e.target.value === "assessment"); form.setForecast(e.target.value === "forecast"); }}>
              <option value="forecast">Predict future use</option>
              <option value="assessment">Check prediction accuracy</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.assessment ? "We reserve the end of your selected history, then compare predictions with those recorded readings." : "We use the selected history to estimate what comes next."}</p>
            <label htmlFor="prediction-hours" className="block text-sm font-medium">{form.assessment ? "Hours to reserve for checking" : "Hours ahead to predict"}</label>
            <input id="prediction-hours" type="number" min={1} max={8760} value={form.testHours} onChange={(e) => form.setTestHours(Number(e.target.value))} className="w-full rounded-lg border p-3 dark:bg-gray-700 dark:border-gray-600" required />
            <p className="text-xs text-gray-500 dark:text-gray-400">24 hours = 1 day · 168 hours = 1 week. Predictions are estimates, not guarantees.</p>
          </section>
        )}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold"><CalendarDays size={18} aria-hidden="true" />Time period{selectedPlotType !== "rpca-analysis" && " & location"}</h3>
          <EssentialParametersSection form={form} section="dates" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Quick date choices end at the latest reading in your dataset.</p>
          {selectedPlotType !== "rpca-analysis" && <EssentialParametersSection form={form} section="meter" />}
          {selectedPlotType === "rpca-analysis" && <p className="text-sm text-gray-600 dark:text-gray-300">Campus sources are selected automatically. The energy limit is {form.threshold || "22000"} kW. You’ll see unusual usage, actual versus usual usage, and hours above the limit. Change these settings below if needed.</p>}
          {selectedPlotType === "threshold-detection" && (
            <div className="space-y-3">
              <label htmlFor="simple-limit-mode" className="block font-medium">Choose an energy limit</label>
              <select id="simple-limit-mode" value={form.thresholdMode} onChange={(e) => form.setThresholdMode(e.target.value as "fixed" | "rpca")} className="w-full rounded-lg border p-3 dark:bg-gray-700 dark:border-gray-600"><option value="rpca">Suggest a limit from the data</option><option value="fixed">Use my limit</option></select>
              {form.thresholdMode === "fixed" && <label className="block text-sm">Energy limit (kW)<input type="number" min={0} step="any" required value={form.threshold} onChange={(e) => form.setThreshold(e.target.value)} className="mt-2 w-full rounded-lg border p-3 dark:bg-gray-700 dark:border-gray-600" /></label>}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">Data preparation: {form.cleaningMethod && form.cleaningMethod !== "None" ? `${form.cleaningMethod} automatic cleaning` : "original readings; no automatic cleaning"}. You can review or change this below.</p>
        </div>
        <details className="rounded-xl border border-gray-200 p-4 dark:border-gray-700" key={`${selectedPlotType}-advanced`}>
          <summary className="cursor-pointer font-medium"><Settings2 size={16} className="mr-2 inline" aria-hidden="true" />Advanced settings <span className="text-sm font-normal text-gray-500">— optional</span></summary>
          <div className="mt-5 space-y-5">
            {selectedPlotType === "rpca-analysis" && <EssentialParametersSection form={form} section="meter" />}
            <EssentialParametersSection form={form} section="cleaning" />
            {(selectedPlotType === "rpca-analysis" || selectedPlotType === "threshold-detection") && <ThresholdOptionsSection form={form} />}
            <OutlierZapPanel form={form} selectedPlotType={selectedPlotType} datasetId={datasetId} />
            <EdaOptionsSection form={form} />
            <ForecastOptionsSection form={{ ...form, forecast: selectedPlotType === "time-series" && !form.assessment, showForecastOptions: true }} />
            {selectedPlotType === "usage-history" && <SmoothingOptionsSection form={form} />}
            <MeterGroupsSection form={form} />
          </div>
        </details>

        <div className="flex flex-col gap-4 border-t border-gray-200 pt-5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">{isLoading ? "Your analysis is running. Results will appear below." : "Ready? Generate your analysis to see the results below."}</p>
          <button
            type="submit"
            disabled={isLoading || (meterListFetched && !datasetReady)}
            className="w-full sm:w-auto shrink-0 px-6 py-3 text-base font-semibold bg-[#ba0c2f] text-white rounded-lg hover:bg-[#9a0a26] focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating Analysis...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><Play size={16} aria-hidden="true" />{selectedPlotType === "rpca-analysis" ? "Generate" : "Show results"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
