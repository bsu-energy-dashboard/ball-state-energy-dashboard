import { useState, type ComponentType } from "react";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Gauge,
  LineChart,
  Moon,
  Network,
  Sun,
  Thermometer,
} from "lucide-react";
import type { BaseRequest, PlotType } from "../types/api";
import ParameterForm from "./ParameterForm";
import TimeSeriesPlot from "./TimeSeriesPlot";
import SeasonalAnalysisPlot from "./SeasonalAnalysisPlot";
import TemperatureAnalysisPlot from "./TemperatureAnalysisPlot";
import ChatbotWidget from "./ChatbotWidget";
import DatasetUploadPanel from "./DatasetUploadPanel";
import EdaPlotsPanel from "./EdaPlotsPanel";
import ThresholdDetectionPanel from "./ThresholdDetectionPanel";
import SimpleRpcaPanel from "./SimpleRpcaPanel";
import bsuLogo from "../assets/bsu-logo.png";
import { PLOT_TYPES } from "../constants/plotTypes";
import { useDarkMode } from "../hooks/use-darkmode";
import { useAnalysisFetching } from "../services/api";
import type { DashboardFormPatch } from "../types/formAutomation";

const PLOT_ICONS: Record<PlotType, ComponentType<{ className?: string }>> = {
  "time-series": LineChart,
  forecast: LineChart,
  "seasonal-analysis": BarChart3,
  "temperature-analysis": Thermometer,
  "eda-plots": Activity,
  "rpca-analysis": Network,
  "threshold-detection": Gauge,
};

export default function Dashboard() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [selectedPlotType, setSelectedPlotType] =
    useState<PlotType>("time-series");
  const [resetFormSignal, setResetFormSignal] = useState(0);
  const [pendingFormPatch, setPendingFormPatch] =
    useState<DashboardFormPatch | null>(null);
  // Track submitted params per plot type (only for passing to components)
  const [plotSubmitParams, setPlotSubmitParams] = useState<
    Partial<Record<PlotType, BaseRequest | null>>
  >({});

  const handleSubmit = (params: BaseRequest) => {
    // Store the submitted params for the current plot type
    setPlotSubmitParams((prev) => ({
      ...prev,
      [selectedPlotType]: params,
    }));
  };

  const switchPlotType = (plotType: PlotType) => {
    // If switching to a plot type with no cached params, reset the form
    if (!plotSubmitParams[plotType]) {
      setResetFormSignal((prev) => prev + 1);
    }
    setSelectedPlotType(plotType);
  };

  const applyChatFormPatch = (patch: DashboardFormPatch) => {
    if (patch.targetPlotType) {
      setSelectedPlotType(patch.targetPlotType);
    }
    setPendingFormPatch(patch);
  };

  const activeSubmitParams = plotSubmitParams[selectedPlotType] ?? null;
  const activePlot = PLOT_TYPES.find((plot) => plot.id === selectedPlotType);
  const isAnalysisLoading = useAnalysisFetching(
    selectedPlotType,
    activeSubmitParams,
  );

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <div className="lg:flex lg:min-h-screen">
        <aside className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
              <img
                src={bsuLogo}
                alt="Ball State University"
                className="h-12 w-12 object-contain"
              />
              <div className="min-w-0">
                <h1 className="text-base font-semibold leading-tight text-[#ba0c2f] dark:text-red-300">
                  Energy dashboard
                </h1>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ball State modeling and analysis
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className="ml-auto rounded-md border border-gray-200 p-2 text-gray-600 transition-colors hover:border-[#ba0c2f] hover:text-[#ba0c2f] dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-300 dark:hover:text-red-300"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                type="button"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
              {PLOT_TYPES.map((plotType) => {
                const Icon = PLOT_ICONS[plotType.id];
                const isActive = selectedPlotType === plotType.id;
                return (
                  <button
                    key={plotType.id}
                    onClick={() => switchPlotType(plotType.id)}
                    disabled={!plotType.available}
                    type="button"
                    className={`group flex min-w-56 items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors lg:min-w-0 ${
                      isActive
                        ? "border-[#0079A7] bg-[#0079A7] text-white shadow-sm"
                        : "border-transparent bg-gray-50 text-gray-700 hover:border-gray-200 hover:bg-white dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-700 dark:hover:bg-gray-800/80"
                    } ${
                      !plotType.available
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-white text-[#0079A7] shadow-xs dark:bg-gray-900 dark:text-[#AEDBE9]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {plotType.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs leading-snug ${
                          isActive
                            ? "text-white/90"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {plotType.description}
                      </span>
                    </span>
                    {isActive && (
                      <ChevronRight className="hidden h-4 w-4 lg:block" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hidden border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:block">
              Model v1.0.0
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 sm:px-6 lg:sticky lg:top-0 lg:z-20">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Current workspace
                </p>
                <h2 className="text-2xl font-semibold tracking-normal text-gray-950 dark:text-white">
                  {activePlot?.label ?? "Analysis"}
                </h2>
              </div>
              <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                {activePlot?.description ??
                  "Choose an analysis mode from the sidebar."}
              </p>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <DatasetUploadPanel />

            <ParameterForm
              onSubmit={handleSubmit}
              isLoading={isAnalysisLoading}
              resetSignal={resetFormSignal}
              initialValues={activeSubmitParams}
              selectedPlotType={selectedPlotType}
              formPatch={pendingFormPatch}
            />

            {selectedPlotType === "time-series" && (
              <TimeSeriesPlot submitParams={activeSubmitParams} />
            )}

            {selectedPlotType === "seasonal-analysis" && (
              <SeasonalAnalysisPlot submitParams={activeSubmitParams} />
            )}

            {selectedPlotType === "temperature-analysis" && (
              <TemperatureAnalysisPlot submitParams={activeSubmitParams} />
            )}

            {selectedPlotType === "eda-plots" && (
              <EdaPlotsPanel submitParams={activeSubmitParams} />
            )}

            {selectedPlotType === "rpca-analysis" && (
              <SimpleRpcaPanel submitParams={activeSubmitParams} />
            )}

            {selectedPlotType === "threshold-detection" && (
              <ThresholdDetectionPanel
                submitParams={activeSubmitParams}
                title="Threshold Detection"
                emptyMessage="Select parameters and click Generate Analysis to run threshold detection."
              />
            )}
          </main>
        </div>
      </div>
      <ChatbotWidget
        selectedPlotType={selectedPlotType}
        onApplyFormPatch={applyChatFormPatch}
      />
    </div>
  );
}
