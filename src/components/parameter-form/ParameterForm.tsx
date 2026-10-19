import { useEffect, useRef, type FormEvent } from "react";
import { toast } from "react-toastify";
import type { BaseRequest, PlotType } from "../../types/api";
import { useMeterList, useDatasetInfo } from "../../services/api";
import { useParameterForm } from "../../hooks/useParameterForm";
import { buildBaseRequest } from "../../utils/parameter-form/buildBaseRequest";
import { datasetIdFromInfo } from "../../utils/manualOutliersStorage";
import { cleaningMethodOptionsForPlot } from "../../constants/cleaningMethods";
import type { DashboardFormPatch } from "../../types/formAutomation";
import { ParameterFormHeader } from "./ParameterFormHeader";
import { EdaRouteSelector } from "./sections/EdaRouteSelector";
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
  const lastAppliedPatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!formPatch || lastAppliedPatchIdRef.current === formPatch.id) return;
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
      state: form,
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors">
      <ParameterFormHeader />

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {meterListFetched && !datasetReady && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            No energy dataset is loaded. Expand <strong>Dataset</strong> above and
            upload your CSV and holiday JSON before running analysis.
          </div>
        )}

        {selectedPlotType === "eda-plots" && (
          <EdaRouteSelector form={form} />
        )}

        {selectedPlotType === "threshold-detection" && (
          <ThresholdOptionsSection form={form} />
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-8 bg-[#ba0c2f] rounded" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Essential Parameters
            </h3>
          </div>

          {selectedPlotType === "rpca-analysis" ? (
            <>
              <EssentialParametersSection form={form} section="dates" />
              <details className="border-t border-gray-200 pt-4 dark:border-gray-600">
                <summary className="cursor-pointer text-sm font-semibold text-gray-800 dark:text-gray-200">Advanced</summary>
                <div className="mt-4 space-y-4">
                  <EssentialParametersSection form={form} section="options" />
                  <ThresholdOptionsSection form={form} />
                  <OutlierZapPanel form={form} selectedPlotType={selectedPlotType} datasetId={datasetId} />
                </div>
              </details>
            </>
          ) : <EssentialParametersSection form={form} />}
          {selectedPlotType !== "rpca-analysis" && (
          <OutlierZapPanel
            form={form}
            selectedPlotType={selectedPlotType}
            datasetId={datasetId}
          />
          )}
          <EdaOptionsSection form={form} />
          <ForecastOptionsSection form={form} />
        </div>

        {selectedPlotType !== "rpca-analysis" && (
          <>
            <SmoothingOptionsSection form={form} />
            <MeterGroupsSection form={form} />
          </>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isLoading || (meterListFetched && !datasetReady)}
            className="w-full px-6 py-3 text-base font-semibold bg-[#ba0c2f] text-white rounded-lg hover:bg-[#9a0a26] focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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
              selectedPlotType === "rpca-analysis" ? "Generate" : "Generate Analysis"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
