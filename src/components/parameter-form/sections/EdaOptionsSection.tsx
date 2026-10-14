import type { ParameterFormBindings } from "../types";

interface EdaOptionsSectionProps {
  form: ParameterFormBindings;
}

export function EdaOptionsSection({ form }: EdaOptionsSectionProps) {
  return (
    <>
{/* EDA Route-Specific Options */}
          {form.selectedPlotType === "eda-plots" && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-4">
              <p className="text-xs font-medium text-[#0079A7] dark:text-[#AEDBE9] uppercase tracking-wide">
                {form.edaRoute === "trend-tests" && "Trend Test Options"}
                {form.edaRoute === "seasonality-tests" && "Seasonality Test Options"}
                {form.edaRoute === "unit-root-tests" && "Unit Root Test Options"}
                {form.edaRoute === "seasonal-decompose" && "Decomposition Options"}
                {form.edaRoute === "autocorr" && "Autocorrelation Options"}
                {form.edaRoute === "annotated-timeseries" && "Time Series Options"}
              </p>

              {/* trend-tests */}
              {form.edaRoute === "trend-tests" && (
                <div>
                  <label
                    htmlFor="edaSeasonalPeriods"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Seasonal Periods
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                      Hours per season (default 24)
                    </span>
                  </label>
                  <input
                    type="number"
                    id="edaSeasonalPeriods"
                    min={1}
                    value={form.edaSeasonalPeriods}
                    onChange={(e) =>
                      form.setEdaSeasonalPeriods(Math.max(1, parseInt(e.target.value, 10) || 24))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  />
                </div>
              )}

              {form.edaRoute === "seasonality-tests" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edaSeasonalityPeriodsText"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      seasonality_periods
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                        Comma-separated hours (default 24, 168)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="edaSeasonalityPeriodsText"
                      value={form.edaSeasonalityPeriodsText}
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setEdaSeasonalityPeriodsText(value);
                        const periods = form.parseSeasonalityPeriodsText(value);
                        if (periods.length > 0) {
                          form.setEdaNHarmonicsJson((prev) =>
                            form.syncNHarmonicsJsonForPeriods(prev, periods),
                          );
                          form.setEdaKwTestsJson((prev) =>
                            form.syncKwTestsJsonForPeriods(prev, periods),
                          );
                        }
                      }}
                      placeholder="24, 168"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      n_harmonics
                    </label>
                    <select
                      value={form.edaNHarmonicsMode}
                      onChange={(e) =>
                        form.setEdaNHarmonicsMode(
                          e.target.value as "auto" | "shared" | "dict",
                        )
                      }
                      className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="auto">auto (omit)</option>
                      <option value="shared">shared count (int)</option>
                      <option value="dict">per period (JSON)</option>
                    </select>
                    {form.edaNHarmonicsMode === "shared" && (
                      <input
                        type="number"
                        min={1}
                        value={form.edaNHarmonicsShared}
                        onChange={(e) => form.setEdaNHarmonicsShared(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                    {form.edaNHarmonicsMode === "dict" && (
                      <textarea
                        value={form.edaNHarmonicsJson}
                        onChange={(e) => form.setEdaNHarmonicsJson(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.edaUseHac}
                      onChange={(e) => form.setEdaUseHac(e.target.checked)}
                      className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      use_hac (Newey-West HAC standard errors)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.edaIncludeKruskalWallis}
                      onChange={(e) =>
                        form.setEdaIncludeKruskalWallis(e.target.checked)
                      }
                      className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      include_kruskal_wallis (one K-W test per period when
                      kw_tests omitted)
                    </span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      kw_tests
                    </label>
                    <select
                      value={form.edaKwTestsMode}
                      onChange={(e) =>
                        form.setEdaKwTestsMode(e.target.value as "auto" | "custom")
                      }
                      className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="auto">
                        auto from seasonality_periods (omit)
                      </option>
                      <option value="custom">custom specs (JSON array)</option>
                    </select>
                    {form.edaKwTestsMode === "custom" && (
                      <textarea
                        value={form.edaKwTestsJson}
                        onChange={(e) => form.setEdaKwTestsJson(e.target.value)}
                        rows={4}
                        placeholder='[{"period": 24}, {"period": 168, "aggregate": 24, "aggfunc": "mean"}]'
                        className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  </div>
                </div>
              )}

              {form.edaRoute === "unit-root-tests" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edaUnitRootRegression"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      unit_root_regression
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                        ADF/KPSS deterministic terms
                      </span>
                    </label>
                    <select
                      id="edaUnitRootRegression"
                      value={form.edaUnitRootRegression}
                      onChange={(e) =>
                        form.setEdaUnitRootRegression(e.target.value as "c" | "ct")
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="c">c — constant only</option>
                      <option value="ct">ct — constant + linear trend</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.edaIncludeBreakTest}
                      onChange={(e) =>
                        form.setEdaIncludeBreakTest(e.target.checked)
                      }
                      className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      include_break_test (Zivot-Andrews; slower)
                    </span>
                  </label>
                </div>
              )}

              {/* seasonal-decompose */}
              {form.edaRoute === "seasonal-decompose" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="edaDecomposePeriod"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Decompose Period
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                        Default 24
                      </span>
                    </label>
                    <input
                      type="number"
                      id="edaDecomposePeriod"
                      min={1}
                      value={form.edaDecomposePeriod}
                      onChange={(e) =>
                        form.setEdaDecomposePeriod(Math.max(1, parseInt(e.target.value, 10) || 24))
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edaDecomposeModel"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Model
                    </label>
                    <select
                      id="edaDecomposeModel"
                      value={form.edaDecomposeModel}
                      onChange={(e) =>
                        form.setEdaDecomposeModel(e.target.value as "additive" | "multiplicative")
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                    >
                      <option value="additive">Additive</option>
                      <option value="multiplicative">Multiplicative</option>
                    </select>
                  </div>
                </div>
              )}

              {/* autocorr */}
              {form.edaRoute === "autocorr" && (
                <div>
                  <label
                    htmlFor="edaAcfLags"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    ACF Lags
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                      Number of lags to compute (default 168)
                    </span>
                  </label>
                  <input
                    type="number"
                    id="edaAcfLags"
                    min={1}
                    value={form.edaAcfLags}
                    onChange={(e) =>
                      form.setEdaAcfLags(Math.max(1, parseInt(e.target.value, 10) || 168))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  />
                </div>
              )}

              {/* annotated-timeseries */}
              {form.edaRoute === "annotated-timeseries" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="edaSmoothingMethod"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Smoothing Method
                      </label>
                      <select
                        id="edaSmoothingMethod"
                        value={form.edaSmoothingMethod}
                        onChange={(e) => form.setEdaSmoothingMethod(e.target.value as "ma" | "hp")}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                      >
                        <option value="ma">Moving Average (MA)</option>
                        <option value="hp">Hodrick-Prescott (HP)</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="edaSmoothingWindow"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {form.edaSmoothingMethod === "hp" ? "Lambda (λ)" : "Window"}
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                          {form.edaSmoothingMethod === "hp" ? "Default 200" : "Days (default 200)"}
                        </span>
                      </label>
                      <input
                        type="number"
                        id="edaSmoothingWindow"
                        min={1}
                        value={form.edaSmoothingWindow}
                        onChange={(e) =>
                          form.setEdaSmoothingWindow(Math.max(1, parseInt(e.target.value, 10) || 200))
                        }
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.edaAnnotated}
                      onChange={(e) => form.setEdaAnnotated(e.target.checked)}
                      className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Shade covariate regions (holidays, sessions)
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
    </>
  );
}
