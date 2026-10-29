import { useCallback, useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import type { PlotParams } from "react-plotly.js";
import type { PlotMouseEvent } from "plotly.js";
import { toast } from "react-toastify";
import type { OutlierPreviewRequest, OutlierZapMode, PlotType } from "../../types/api";
import { useOutlierPreview } from "../../services/api";
import { useDarkMode } from "../../hooks/use-darkmode.ts";
import type { ParameterFormBindings } from "./types";
import {
  clearStoredZaps,
  countZaps,
  formatSavedAgo,
  loadStoredZaps,
  plotTypeLabel,
  pruneOutliersOutsideRange,
  saveStoredZaps,
} from "../../utils/manualOutliersStorage";
import {
  addZap,
  zapBaselineRequest,
  retainedReadingStats,
  removeZap,
  valueAtDatetime,
  zapsForMeter,
} from "../../utils/outlierZapChart";

interface OutlierZapPanelProps {
  form: ParameterFormBindings;
  selectedPlotType: PlotType;
  datasetId: string;
}


export function OutlierZapPanel({
  form,
  selectedPlotType,
  datasetId,
}: OutlierZapPanelProps) {
  const { darkMode } = useDarkMode();
  const [expanded, setExpanded] = useState(false);
  const [debouncedSelection, setDebouncedSelection] = useState({ meter: "", zaps: [] as string[] });
  const [storageRevision, setStorageRevision] = useState(0);

  const isOverage =
    selectedPlotType === "threshold-detection" ||
    selectedPlotType === "rpca-analysis";
  const activeMeter = isOverage
    ? form.outlierZapPreviewMeter || form.meter || form.includedMeters[0] || ""
    : form.meter;

  const previewMeterOptions = useMemo(() => {
    const csvMeters = new Set([...(form.meterList?.meters ?? []), ...form.meterGroups.map((group) => group.name)]);
    const candidates = new Set([
      form.meter,
      ...form.includedMeters,
      ...form.seriesMeters,
    ]);
    return [...candidates].filter((m) => csvMeters.has(m));
  }, [form.meter, form.includedMeters, form.seriesMeters, form.meterList?.meters, form.meterGroups]);

  const storedEntry = useMemo(() => {
    void storageRevision;
    if (!datasetId || !activeMeter) return null;
    return loadStoredZaps(datasetId, activeMeter);
  }, [datasetId, activeMeter, storageRevision]);

  const currentZaps = useMemo(() => zapsForMeter(form.manualOutliers, activeMeter), [form.manualOutliers, activeMeter]);
  const debouncedZaps = useMemo(() => debouncedSelection.meter === activeMeter ? debouncedSelection.zaps : [], [debouncedSelection, activeMeter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSelection({ meter: activeMeter, zaps: currentZaps });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [currentZaps, activeMeter]);

  const metersToAdd = useMemo(() => {
    const group = form.meterGroups.find((g) => g.name === activeMeter);
    if (group?.meters.length) {
      return { [group.name]: group.meters };
    }
    return undefined;
  }, [activeMeter, form.meterGroups]);

  const includeCleanedPreview =
    form.outlierZapMode !== "none" && debouncedZaps.length > 0;

  const previewRequest = useMemo((): OutlierPreviewRequest | null => {
    if (!expanded || !form.startDate || !form.endDate || !activeMeter) {
      return null;
    }
    const req: OutlierPreviewRequest = {
      start_date: form.startDate,
      end_date: form.endDate,
      meter: activeMeter,
      include_cleaned_preview: includeCleanedPreview,
      manual_outlier_replacement: form.manualOutlierReplacement,
    };
    if (metersToAdd) req.meters_to_add = metersToAdd;
    if (form.cleaningMethod && form.cleaningMethod !== "None") {
      req.cleaning_method = form.cleaningMethod as OutlierPreviewRequest["cleaning_method"];
      if (form.cleaningExtra.cleaning_window != null) {
        req.cleaning_window = form.cleaningExtra.cleaning_window;
      }
      if (form.cleaningExtra.cleaning_n_sigma != null) {
        req.cleaning_n_sigma = form.cleaningExtra.cleaning_n_sigma;
      }
      if (form.cleaningExtra.cleaning_interval_width != null) {
        req.cleaning_interval_width = form.cleaningExtra.cleaning_interval_width;
      }
      if (form.cleaningDaily) req.cleaning_daily = true;
      if (form.cleaningWeekly) req.cleaning_weekly = true;
    }
    if (includeCleanedPreview && debouncedZaps.length > 0) {
      req.manual_outliers = { [activeMeter]: debouncedZaps };
    }
    return req;
  }, [
    expanded,
    form.startDate,
    form.endDate,
    activeMeter,
    metersToAdd,
    form.manualOutlierReplacement,
    form.cleaningMethod,
    form.cleaningExtra,
    form.cleaningDaily,
    form.cleaningWeekly,
    includeCleanedPreview,
    debouncedZaps,
  ]);

  const hasAutomaticCleaning = !!form.cleaningMethod && form.cleaningMethod !== "None";
  // Keep the selectable baseline independent of zaps, so clicking never reloads it.
  const baselineRequest = zapBaselineRequest(previewRequest);
  const { data: baseline, isLoading, error: baselineError } = useOutlierPreview(baselineRequest, {
    enabled: !!baselineRequest && form.outlierZapMode !== "none",
  });
  const { data: preview, isFetching, isPlaceholderData, error: correctionError } = useOutlierPreview(previewRequest, {
    enabled: !!previewRequest && form.outlierZapMode !== "none" && debouncedZaps.length > 0,
  });
  const selectableSeries = hasAutomaticCleaning ? baseline?.cleaned_preview : baseline?.series;
  const error = baselineError || (currentZaps.length > 0 ? correctionError : null);
  const summaryStats = useMemo(() => retainedReadingStats(selectableSeries ?? [], currentZaps), [selectableSeries, currentZaps]);
  const refreshingPreview = currentZaps.length > 0 && (isFetching || currentZaps !== debouncedZaps);

  const handleModeChange = (mode: OutlierZapMode) => {
    form.setOutlierZapMode(mode);
    if (mode === "from_storage" && storedEntry) {
      form.setManualOutlierReplacement(storedEntry.manual_outlier_replacement ?? "average");
      form.setManualOutliers({
        ...form.manualOutliers,
        ...storedEntry.manual_outliers,
      });
    }
    if (mode === "this_tab" && storedEntry) {
      form.setManualOutlierReplacement(storedEntry.manual_outlier_replacement ?? "average");
      form.setManualOutliers({
        ...form.manualOutliers,
        ...storedEntry.manual_outliers,
      });
    }
    if (mode === "none") {
      form.setManualOutliers({});
    }
  };

  const acceptStored = () => {
    if (!storedEntry) return;
    form.setManualOutlierReplacement(storedEntry.manual_outlier_replacement ?? "average");
    const { pruned, removedCount } = pruneOutliersOutsideRange(
      storedEntry.manual_outliers,
      form.startDate,
      form.endDate,
    );
    if (removedCount > 0) {
      toast.warn(
        `${removedCount} stored zap(s) fall outside the current date range.`,
      );
    }
    form.setManualOutliers({ ...form.manualOutliers, ...pruned });
    form.setOutlierZapMode("from_storage");
  };

  const handleChartClick = useCallback(
    (event: PlotMouseEvent) => {
      if (form.outlierZapMode === "none" || form.outlierZapMode === "from_storage") {
        return;
      }
      // Use the exact source timestamp, never a rounded Plotly x-axis value.
      const point = event.points?.find((p) => p.curveNumber === 0);
      if (!point || typeof point.customdata !== "string") return;
      const datetime = point.customdata;
      if (!selectableSeries?.some((p) => p.datetime === datetime)) return;
      form.setManualOutliers((previous) => addZap(previous, activeMeter, datetime));
    },
    [form, selectableSeries, activeMeter],
  );

  const handleRemoveZap = (datetime: string) => {
    form.setManualOutliers(removeZap(form.manualOutliers, activeMeter, datetime));
  };

  const handleClearAll = () => {
    const next = { ...form.manualOutliers };
    delete next[activeMeter];
    form.setManualOutliers(next);
  };

  const handleSaveToStorage = () => {
    if (!datasetId || !activeMeter) return;
    const meterZaps = zapsForMeter(form.manualOutliers, activeMeter);
    if (meterZaps.length === 0) {
      toast.info("No zaps to save for this meter.");
      return;
    }
    saveStoredZaps(datasetId, activeMeter, {
      version: 1,
      savedAt: new Date().toISOString(),
      savedFromTab: selectedPlotType,
      startDate: form.startDate,
      endDate: form.endDate,
      cleaningMethod: form.cleaningMethod || null,
      manual_outlier_replacement: form.manualOutlierReplacement,
      manual_outliers: { [activeMeter]: meterZaps },
    });
    setStorageRevision((revision) => revision + 1);
    toast.success("Zaps saved to browser storage.");
  };

  const handleClearSaved = () => {
    if (!datasetId || !activeMeter) return;
    clearStoredZaps(datasetId, activeMeter);
    setStorageRevision((revision) => revision + 1);
    handleClearAll();
    form.setOutlierZapMode("none");
    toast.success("Saved zaps cleared.");
  };

  const handlePreviewMeterChange = (nextMeter: string) => {
    form.setOutlierZapPreviewMeter(nextMeter);
  };

  const zapRows = currentZaps.map((datetime) => ({
    datetime,
    value:
      selectableSeries
        ? valueAtDatetime(selectableSeries, datetime)
        : undefined,
  }));

  const traces: PlotParams["data"] = [];
  if (selectableSeries?.length) {
    traces.push({
      x: selectableSeries.map((p) => p.datetime),
      customdata: selectableSeries.map((p) => p.datetime),
      hovertemplate: `%{customdata}<br>${hasAutomaticCleaning ? "After automatic cleaning" : "Original reading"}: %{y}<extra></extra>`,
      y: selectableSeries.map((p) => p.value),
      mode: "lines+markers",
      name: hasAutomaticCleaning ? "After automatic cleaning" : "Original readings",
      type: "scatter",
      marker: { size: 7 },
      line: { color: darkMode ? "#AEDBE9" : "#0079A7", width: 1.5 },
    });
  }
  if (currentZaps.length && selectableSeries?.length) {
    const zapped = selectableSeries.filter((p) =>
      currentZaps.includes(p.datetime),
    );
    if (zapped.length) {
      traces.push({
        x: zapped.map((p) => new Date(p.datetime)),
        y: zapped.map((p) => p.value),
        mode: "markers",
        name: "Zapped points",
        hoverinfo: "skip",
        type: "scatter",
        marker: { size: 10, color: "#ba0c2f", symbol: "x" },
      });
    }
  }
  if (currentZaps.length > 0 && preview?.cleaned_preview?.length && !isPlaceholderData && !refreshingPreview) {
    traces.push({
      x: preview.cleaned_preview.map((p) => new Date(p.datetime)),
      y: preview.cleaned_preview.map((p) => p.value),
      mode: "lines",
      name: "Cleaned preview",
      hoverinfo: "skip",
      type: "scatter",
      line: { color: darkMode ? "#F06B83" : "#ba0c2f", width: 1.5, dash: "dash" },
    });
  }

  const chartReady =
    form.startDate && form.endDate && activeMeter && previewMeterOptions.length > 0;

  if (!form.shouldShowField("cleaning_method")) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Preview &amp; zap outliers
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["none", "Don't use"],
                ["from_storage", "Use from storage"],
                ["this_tab", "Edit in this tab"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeChange(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  form.outlierZapMode === mode
                    ? "bg-[#ba0c2f] text-white border-[#ba0c2f]"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#ba0c2f]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Replace selected readings with
            <select value={form.manualOutlierReplacement}
              onChange={(event) => form.setManualOutlierReplacement(event.target.value as "average" | "zero")}
              className="ml-2 rounded border p-2 bg-white dark:bg-gray-800">
              <option value="average">Average of neighbouring readings</option>
              <option value="zero">Zero</option>
            </select>
          </label>
          <p className="text-xs text-gray-500">Average uses the nearest valid reading on each side, excluding all selected points. At an edge it uses the available neighbour; with no valid neighbours it uses zero. Automatic cleaning, if enabled, runs afterwards.</p>
          {storedEntry &&
            form.outlierZapMode === "none" &&
            countZaps(storedEntry.manual_outliers) > 0 && (
              <div className="rounded-lg border border-[#AEDBE9] dark:border-[#0079A7]/50 bg-[#AEDBE9]/25 dark:bg-[#0079A7]/20 px-3 py-2 text-sm text-[#005F80] dark:text-[#AEDBE9] flex flex-wrap items-center justify-between gap-2">
                <span>
                  Use {countZaps(storedEntry.manual_outliers)} zap(s) from{" "}
                  {plotTypeLabel(storedEntry.savedFromTab)} (saved{" "}
                  {formatSavedAgo(storedEntry.savedAt)})
                </span>
                <button
                  type="button"
                  onClick={acceptStored}
                  className="px-2 py-1 text-xs font-medium bg-[#0079A7] text-white rounded hover:bg-[#005F80]"
                >
                  Use saved zaps
                </button>
              </div>
            )}

          {isOverage && previewMeterOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Preview meter
              </label>
              <select
                value={activeMeter}
                onChange={(e) => handlePreviewMeterChange(e.target.value)}
                className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {previewMeterOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!chartReady && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a date range and meter to enable the zap chart.
            </p>
          )}

          {form.outlierZapMode !== "none" && chartReady && (
            <>
              {selectableSeries && (
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span>{summaryStats.count.toLocaleString()} retained readings · {currentZaps.length} selected for correction</span>
                  <span className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                    Highest retained reading: {summaryStats.max?.toLocaleString() ?? "—"}
                  </span>
                  <span className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                    99th percentile: {summaryStats.p99?.toLocaleString() ?? "—"}
                  </span>
                </div>
              )}

              {baseline && refreshingPreview && (
                <p role="status" className="text-xs text-gray-500 dark:text-gray-400">Updating corrected preview… You can keep selecting points.</p>
              )}
              {isLoading && !baseline && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading preview…
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Preview failed. Check dates and meter.
                </p>
              )}

              {traces.length > 0 && (
                <div className="h-72 w-full">
                  <Plot
                    data={traces}
                    layout={{
                      autosize: true,
                      hovermode: "closest",
                      clickmode: "event",
                      uirevision: `${activeMeter}:${form.startDate}:${form.endDate}`,
                      height: 288,
                      margin: { l: 48, r: 16, t: 24, b: 40 },
                      paper_bgcolor: "transparent",
                      plot_bgcolor: "transparent",
                      font: { color: darkMode ? "#e5e7eb" : "#374151" },
                      xaxis: { type: "date" },
                      yaxis: { title: { text: "Value" } },
                      showlegend: true,
                      legend: { orientation: "h", y: 1.15 },
                    }}
                    config={{ displayModeBar: true, responsive: true, displaylogo: false }}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler
                    onClick={handleChartClick}
                  />
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-300">
                {hasAutomaticCleaning
                  ? `Showing readings after ${form.cleaningMethod} cleaning. Select any remaining problem points.`
                  : "Showing original readings because automatic cleaning is off."}
              </p>
              {form.outlierZapMode === "this_tab" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click a point on the blue line to correct it. Zoom in to choose closely spaced readings. The table shows the exact timestamp selected; Remove undoes the selection. The dashed red line shows the result after your manual corrections and backend processing.
                </p>
              )}

              {preview?.manual_outliers_skipped &&
                preview.manual_outliers_skipped.length > 0 && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-900 dark:text-amber-200">
                    {preview.manual_outliers_skipped.map((s) => (
                      <p key={`${s.meter}-${s.datetime}`}>
                        Skipped {s.datetime}: {s.reason}
                      </p>
                    ))}
                  </div>
                )}

              {zapRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                        <th className="py-2 pr-4 font-medium">Datetime</th>
                        <th className="py-2 pr-4 font-medium">Value</th>
                        <th className="py-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zapRows.map((row) => (
                        <tr
                          key={row.datetime}
                          className="border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          <td className="py-2 pr-4">{row.datetime}</td>
                          <td className="py-2 pr-4">
                            {row.value != null
                              ? row.value.toLocaleString()
                              : "—"}
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveZap(row.datetime)}
                              className="text-[#ba0c2f] hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveToStorage}
                  className="px-3 py-1.5 text-xs font-medium bg-[#0079A7] text-white rounded-md hover:bg-[#005F80]"
                >
                  Save to storage
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:border-[#ba0c2f]"
                >
                  Clear all (this meter)
                </button>
                <button
                  type="button"
                  onClick={handleClearSaved}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:border-[#ba0c2f]"
                >
                  Clear saved zaps
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
