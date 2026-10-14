import {
  CLEANING_METHOD_EXTRA_FIELDS,
  type CleaningMethodKey,
} from "../../../constants/cleaningMethodExtraFields";
import { cleaningMethodOptionsForPlot } from "../../../constants/cleaningMethods";
import type { CleaningMethod } from "../../../types/api";
import type { ParameterFormBindings } from "../types";

interface EssentialParametersSectionProps {
  form: ParameterFormBindings;
}

export function EssentialParametersSection({ form }: EssentialParametersSectionProps) {
  const meterOptions =
    form.selectedPlotType === "rpca-analysis"
      ? (form.meterList?.meters ?? [])
      : form.allMeters;

  return (
    <>
{/* Date Range with Presets */}
          {form.shouldShowField("start_date") && form.shouldShowField("end_date") && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transition-colors">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Date Range
              </label>
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => form.applyDatePreset("week")}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-[#ba0c2f] transition-colors"
                >
                  Last Week
                </button>
                <button
                  type="button"
                  onClick={() => form.applyDatePreset("month")}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-[#ba0c2f] transition-colors"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => form.applyDatePreset("quarter")}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-[#ba0c2f] transition-colors"
                >
                  Last Quarter
                </button>
                <button
                  type="button"
                  onClick={() => form.applyDatePreset("year")}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-[#ba0c2f] transition-colors"
                >
                  Last Year
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                  >
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    value={form.startDate}
                    min={form.minDate}
                    max={form.maxDate}
                    onChange={(e) => form.setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                  >
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={form.endDate}
                    min={form.minDate}
                    max={form.maxDate}
                    onChange={(e) => form.setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Meter Selection */}
          {form.shouldShowField("meter") && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transition-colors">
              <label
                htmlFor="meter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {form.selectedPlotType === "threshold-detection"
                  ? "Main Meter"
                  : form.selectedPlotType === "rpca-analysis"
                    ? "Comparison Meter"
                  : "Meter"}
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                  {form.selectedPlotType === "threshold-detection"
                    ? "Main meter — column checked against threshold"
                    : form.selectedPlotType === "rpca-analysis"
                      ? "Meter shown against the RPCA low-rank baseline"
                    : "Select a meter or create a group below"}
                </span>
              </label>
              <select
                id="meter"
                value={form.meter}
                onChange={(e) => form.setMeter(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white transition-all"
              >
                <option value="">
                  {meterOptions.length === 0
                    ? "No meters — upload dataset first"
                    : "Select a meter…"}
                </option>
                {meterOptions.map((meterOption) => (
                  <option key={meterOption} value={meterOption}>
                    {meterOption}
                    {form.selectedPlotType !== "rpca-analysis" &&
                    form.meterGroups.some((g) => g.name === meterOption)
                      ? " (Group)"
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cleaning Method */}
          {form.shouldShowField("cleaning_method") && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 transition-colors space-y-4">
              <div>
                <label
                  htmlFor="cleaningMethod"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Data Cleaning Method
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                    {form.selectedPlotType === "threshold-detection" ||
                    form.selectedPlotType === "rpca-analysis"
                      ? "Polynomial recommended for multi-meter overage"
                      : "Optional: Remove outliers and anomalies"}
                  </span>
                </label>
                {(form.selectedPlotType === "threshold-detection" ||
                  form.selectedPlotType === "rpca-analysis") && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Each method runs per meter. Prophet fits one model per meter
                    and is slow at scale.
                  </p>
                )}
                <select
                  id="cleaningMethod"
                  value={form.cleaningMethod}
                  onChange={(e) =>
                    form.setCleaningMethod(e.target.value as CleaningMethod | "")
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                >
                  {cleaningMethodOptionsForPlot(form.selectedPlotType).map(
                    (opt) => (
                      <option key={opt.value || "none"} value={opt.value}>
                        {opt.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
              {(form.selectedPlotType === "threshold-detection" ||
                form.selectedPlotType === "rpca-analysis") &&
                (form.cleaningMethod === "Prophet" ||
                  form.cleaningMethod === "Neural") && (
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.cleaningDaily}
                        onChange={(e) =>
                          form.setCleaningDaily(e.target.checked)
                        }
                        className="rounded border-gray-300 text-[#ba0c2f] focus:ring-[#ba0c2f]"
                      />
                      Daily seasonality
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.cleaningWeekly}
                        onChange={(e) =>
                          form.setCleaningWeekly(e.target.checked)
                        }
                        className="rounded border-gray-300 text-[#ba0c2f] focus:ring-[#ba0c2f]"
                      />
                      Weekly seasonality
                    </label>
                  </div>
                )}
              {/* Extra fields per cleaning method (modular: add entries to CLEANING_METHOD_EXTRA_FIELDS) */}
              {form.cleaningMethod &&
                form.cleaningMethod !== "None" &&
                CLEANING_METHOD_EXTRA_FIELDS[form.cleaningMethod as CleaningMethodKey]?.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={field.key}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {field.label}
                      {field.hint && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                          {field.hint}
                        </span>
                      )}
                    </label>
                    <input
                      id={field.key}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step ?? 1}
                      value={form.cleaningExtra[field.key] ?? field.default}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        form.setCleaningExtra((prev) => ({
                          ...prev,
                          [field.key]: Number.isNaN(n)
                            ? field.default
                            : Math.min(field.max, Math.max(field.min, n)),
                        }));
                      }}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                    />
                  </div>
                ))}
            </div>
          )}
    </>
  );
}
