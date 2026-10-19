import { Plus, Trash2 } from "lucide-react";
import { MeterMultiSelect } from "../MeterMultiSelect";
import type { ParameterFormBindings } from "../types";

interface ThresholdOptionsSectionProps {
  form: ParameterFormBindings;
}

export function ThresholdOptionsSection({ form }: ThresholdOptionsSectionProps) {
  const isCampusRpca = form.selectedPlotType === "rpca-analysis";
  if (form.selectedPlotType !== "threshold-detection" && !isCampusRpca) {
    return null;
  }

  const sourceMeters = form.meterList?.meters ?? [];
  const groupNames = new Set(
    form.meterGroups
      .filter((group) => group.name && group.meters.length > 0)
      .map((group) => group.name),
  );

  if (isCampusRpca) {
    const addOverageWindow = () => {
      form.setOverageWindows((windows) => [
        ...windows,
        {
          id: `overage-${Date.now()}`,
          start: "",
          end: "",
        },
      ]);
    };
    const updateOverageWindow = (
      id: string,
      key: "start" | "end",
      value: string,
    ) => {
      form.setOverageWindows((windows) =>
        windows.map((window) =>
          window.id === id ? { ...window, [key]: value } : window,
        ),
      );
    };
    const removeOverageWindow = (id: string) => {
      form.setOverageWindows((windows) =>
        windows.filter((window) => window.id !== id),
      );
    };

    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-4">
        <div>
          <p className="text-sm font-semibold text-[#0079A7] dark:text-[#AEDBE9]">
            Campus RPCA setup
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {form.totalEnergyMeters.length ? `${form.totalEnergyMeters.length} campus total source meters selected.` : "Campus preset (Bethel 177/187 and Christy Woods 47/97/117)."}
          </p>
        </div>

        <MeterMultiSelect
          label="Meters to sum into total energy"
          hint="Choose the columns for this dataset"
          options={sourceMeters}
          selected={form.totalEnergyMeters}
          onChange={form.setTotalEnergyMeters}
          showBulkActions
          emptyMessage="No source meters — upload dataset first"
          maxHeightClass="max-h-56"
        />

        <div>
          <label
            htmlFor="rpcaThreshold"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Campus total threshold
          </label>
          <input
            id="rpcaThreshold"
            type="number"
            min={0}
            step="any"
            value={form.threshold}
            onChange={(e) => form.setThreshold(e.target.value)}
            placeholder="22000"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overage windows
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add one or more ranges to highlight on the RPCA plots.
              </p>
            </div>
            <button
              type="button"
              onClick={addOverageWindow}
              className="inline-flex items-center gap-2 rounded-md border border-[#0079A7]/30 px-3 py-2 text-sm font-medium text-[#0079A7] hover:bg-[#0079A7]/10 dark:border-[#AEDBE9]/40 dark:text-[#AEDBE9]"
            >
              <Plus className="h-4 w-4" />
              Add window
            </button>
          </div>

          {form.overageWindows.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
              No overage windows yet.
            </p>
          ) : (
            <div className="space-y-3">
              {form.overageWindows.map((window, index) => (
                <div
                  key={window.id}
                  className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-600 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div>
                    <label
                      htmlFor={`${window.id}-start`}
                      className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                    >
                      Window {index + 1} start
                    </label>
                    <input
                      id={`${window.id}-start`}
                      type="datetime-local"
                      value={window.start}
                      min={form.minDate}
                      max={form.maxDate}
                      onChange={(e) =>
                        updateOverageWindow(window.id, "start", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`${window.id}-end`}
                      className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                    >
                      End
                    </label>
                    <input
                      id={`${window.id}-end`}
                      type="datetime-local"
                      value={window.end}
                      min={form.minDate}
                      max={form.maxDate}
                      onChange={(e) =>
                        updateOverageWindow(window.id, "end", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOverageWindow(window.id)}
                    aria-label={`Remove overage window ${index + 1}`}
                    className="inline-flex h-10 w-10 items-center justify-center self-end rounded-md border border-gray-300 text-gray-600 hover:border-[#ba0c2f] hover:text-[#ba0c2f] dark:border-gray-600 dark:text-gray-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0079A7] dark:text-[#AEDBE9]">
            {isCampusRpca ? "Campus RPCA setup" : "Threshold detection options"}
          </p>
          {isCampusRpca && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Build the total energy series from this dataset, then run RPCA
              against the selected decomposition meters.
            </p>
          )}
        </div>
        {isCampusRpca && (
          <div className="rounded-md border border-[#0079A7]/20 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm dark:border-[#AEDBE9]/30 dark:bg-gray-800 dark:text-gray-200">
            Main meter: <strong>{form.totalEnergyName || "not set"}</strong>
          </div>
        )}
      </div>

      {isCampusRpca && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
          <div>
            <label
              htmlFor="totalEnergyName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Total energy series name
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                Used as the RPCA target
              </span>
            </label>
            <input
              id="totalEnergyName"
              type="text"
              value={form.totalEnergyName}
              onChange={(e) => form.setTotalEnergyName(e.target.value)}
              placeholder="totalenergy"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <MeterMultiSelect
            label="Meters to sum into total energy"
            hint="Choose the columns for this dataset"
            options={sourceMeters}
            selected={form.totalEnergyMeters}
            onChange={form.setTotalEnergyMeters}
            showBulkActions
            emptyMessage="No source meters — upload dataset first"
            maxHeightClass="max-h-56"
          />
        </div>
      )}

      {!isCampusRpca && (
        <div>
          <label
            htmlFor="thresholdMode"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Threshold Mode
          </label>
          <select
            id="thresholdMode"
            value={form.thresholdMode}
            onChange={(e) =>
              form.setThresholdMode(e.target.value as "rpca" | "fixed")
            }
            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="rpca">RPCA — auto-recommend threshold</option>
            <option value="fixed">Fixed — use explicit threshold</option>
          </select>
        </div>
      )}

      {!isCampusRpca && form.thresholdMode === "fixed" && (
        <div>
          <label
            htmlFor="threshold"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Threshold
            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
              Required for fixed mode
            </span>
          </label>
          <input
            id="threshold"
            type="number"
            min={0}
            step="any"
            value={form.threshold}
            onChange={(e) => form.setThreshold(e.target.value)}
            required={form.thresholdMode === "fixed"}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Analysis Window
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="analysisWindowStart"
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
            >
              Start
            </label>
            <input
              type="date"
              id="analysisWindowStart"
              value={form.analysisWindowStart}
              onChange={(e) => form.setAnalysisWindowStart(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="analysisWindowEnd"
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
            >
              End
            </label>
            <input
              type="date"
              id="analysisWindowEnd"
              value={form.analysisWindowEnd}
              onChange={(e) => form.setAnalysisWindowEnd(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <MeterMultiSelect
        label="RPCA Meters"
        hint="All included by default — uncheck to omit"
        options={form.allMeters}
        selected={form.includedMeters}
        onChange={form.setIncludedMeters}
        groupNames={groupNames}
      />

      <button
        type="button"
        onClick={() => form.setShowThresholdAdvanced((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-[#0079A7] dark:text-[#AEDBE9] hover:underline"
      >
        <svg
          className={`w-4 h-4 transition-transform ${form.showThresholdAdvanced ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Advanced options
      </button>

      {form.showThresholdAdvanced && (
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contribution Window
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={form.contributionWindowStart}
                onChange={(e) =>
                  form.setContributionWindowStart(e.target.value)
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                type="date"
                value={form.contributionWindowEnd}
                onChange={(e) => form.setContributionWindowEnd(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plot Window
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={form.plotWindowStart}
                onChange={(e) => form.setPlotWindowStart(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <input
                type="date"
                value={form.plotWindowEnd}
                onChange={(e) => form.setPlotWindowEnd(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <MeterMultiSelect
            label="Series Meters"
            hint="Extra meters on stacked series plot"
            options={form.allMeters}
            selected={form.seriesMeters}
            onChange={form.setSeriesMeters}
            groupNames={groupNames}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contributions top N
              </label>
              <input
                type="number"
                min={1}
                value={form.contributionsTopN}
                onChange={(e) =>
                  form.setContributionsTopN(
                    Math.max(1, parseInt(e.target.value, 10) || 1),
                  )
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event contributions top N
              </label>
              <input
                type="number"
                min={1}
                value={form.eventContributionsTopN}
                onChange={(e) =>
                  form.setEventContributionsTopN(
                    Math.max(1, parseInt(e.target.value, 10) || 1),
                  )
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contributions method
              </label>
              <select
                value={form.contributionsMethod}
                onChange={(e) =>
                  form.setContributionsMethod(
                    e.target.value as "sparse" | "raw",
                  )
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="sparse">sparse</option>
                <option value="raw">raw</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Heatmap top N rows
              </label>
              <input
                type="number"
                min={1}
                value={form.heatmapTopN}
                onChange={(e) =>
                  form.setHeatmapTopN(
                    Math.max(1, parseInt(e.target.value, 10) || 1),
                  )
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.heatmapNormalize}
                onChange={(e) => form.setHeatmapNormalize(e.target.checked)}
                className="rounded border-gray-300 text-[#ba0c2f] focus:ring-[#ba0c2f]"
              />
              Row-normalize heatmap
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.cleanAllMeters}
                onChange={(e) => form.setCleanAllMeters(e.target.checked)}
                className="rounded border-gray-300 text-[#ba0c2f] focus:ring-[#ba0c2f]"
              />
              <span>
                Clean all meters
                <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                  Cleans all selected RPCA meters, or every numeric column if
                  none selected
                </span>
              </span>
            </label>
          </div>

          {(isCampusRpca || form.thresholdMode === "rpca") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  n_thresholds
                </label>
                <input
                  type="number"
                  min={2}
                  value={form.nThresholds}
                  onChange={(e) =>
                    form.setNThresholds(
                      Math.max(2, parseInt(e.target.value, 10) || 80),
                    )
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RPCA max iterations
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.rpcaMaxIter}
                  onChange={(e) =>
                    form.setRpcaMaxIter(
                      Math.max(1, parseInt(e.target.value, 10) || 5000),
                    )
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Threshold min (optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.thresholdMin}
                  onChange={(e) => form.setThresholdMin(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Threshold max (optional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.thresholdMax}
                  onChange={(e) => form.setThresholdMax(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RPCA tolerance
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.rpcaTol}
                  onChange={(e) =>
                    form.setRpcaTol(parseFloat(e.target.value) || 1e-6)
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
