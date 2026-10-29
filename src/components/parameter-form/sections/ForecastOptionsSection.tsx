import {
  NP_REGRESSOR_OPTIONS,
  type NpFeatureLagsUi,
  type NpYearlySeasonalityUi,
  type ProphetSeasonalityBoolUi,
} from "../../../constants/neuralProphetFields";
import type { ParameterFormBindings } from "../types";

interface ForecastOptionsSectionProps {
  form: ParameterFormBindings;
}

export function ForecastOptionsSection({ form }: ForecastOptionsSectionProps) {
  return (
    <>
{/* Forecast Options - Only for Time Series */}
          {form.selectedPlotType === "time-series" && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200">
              {form.showForecastOptions && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="form.forecastModel"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Prediction method
                    </label>
                    <select
                      id="form.forecastModel"
                      value={form.forecastModel}
                      onChange={(e) =>
                        form.setForecastModel(
                          e.target.value as
                            | "Prophet"
                            | "SARIMAX"
                            | "NeuralProphet"
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                    >
                      <option value="Prophet">Prophet</option>
                      <option value="SARIMAX">SARIMAX</option>
                      <option value="NeuralProphet">NeuralProphet</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="form.forecastIntervalType"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Confidence Interval Type
                      </label>
                      <select
                        id="form.forecastIntervalType"
                        value={form.forecastIntervalType}
                        onChange={(e) =>
                          form.setForecastIntervalType(
                            e.target.value as
                              | "two-sided"
                              | "upper-bounded"
                              | "lower-bounded",
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                      >
                        <option value="two-sided">two-sided</option>
                        <option value="upper-bounded">upper-bounded</option>
                        <option value="lower-bounded">lower-bounded</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="form.forecastIntervalWidth"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Confidence Interval Width
                        <span className="text-xs text-gray-500 font-normal ml-2">
                          0 to 1 (default 0.95)
                        </span>
                      </label>
                      <input
                        type="number"
                        id="form.forecastIntervalWidth"
                        min={0}
                        max={1}
                        step={0.01}
                        value={form.forecastIntervalWidth}
                        onChange={(e) =>
                          form.setForecastIntervalWidth(
                            Math.min(
                              1,
                              Math.max(0, parseFloat(e.target.value) || 0.95),
                            ),
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba0c2f] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                      />
                    </div>
                  </div>
                  {(form.forecastModel === "Prophet" ||
                    form.forecastModel === "NeuralProphet") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="sharedSeasonalityMode"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          seasonality_mode
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                            Prophet &amp; NeuralProphet
                          </span>
                        </label>
                        <select
                          id="sharedSeasonalityMode"
                          value={form.npSeasonalityMode}
                          onChange={(e) =>
                            form.setNpSeasonalityMode(
                              e.target.value as "additive" | "multiplicative",
                            )
                          }
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="additive">additive</option>
                          <option value="multiplicative">multiplicative</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="sharedYearlySeasonality"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          yearly_seasonality
                        </label>
                        <select
                          id="sharedYearlySeasonality"
                          value={form.npYearlySeasonality}
                          onChange={(e) =>
                            form.setNpYearlySeasonality(
                              e.target.value as NpYearlySeasonalityUi,
                            )
                          }
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="auto">auto</option>
                          <option value="true">on (true)</option>
                          <option value="false">off (false)</option>
                          <option value="custom">custom order (number)</option>
                        </select>
                        {form.npYearlySeasonality === "custom" && (
                          <input
                            type="number"
                            min={0}
                            value={form.npYearlySeasonalityOrder}
                            onChange={(e) =>
                              form.setNpYearlySeasonalityOrder(
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Fourier order"
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {form.forecastModel === "Prophet" && (
                    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-white/60 dark:bg-gray-800/40">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Prophet parameters
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_changepoint_prior_scale
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={form.prophetChangepointPriorScale}
                            onChange={(e) =>
                              form.setProphetChangepointPriorScale(
                                parseFloat(e.target.value) || 0.05,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_seasonality_prior_scale
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={form.prophetSeasonalityPriorScale}
                            onChange={(e) =>
                              form.setProphetSeasonalityPriorScale(
                                parseFloat(e.target.value) || 10,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_holidays_prior_scale
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={form.prophetHolidaysPriorScale}
                            onChange={(e) =>
                              form.setProphetHolidaysPriorScale(
                                parseFloat(e.target.value) || 10,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_n_changepoints
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.prophetNChangepoints}
                            onChange={(e) =>
                              form.setProphetNChangepoints(
                                parseInt(e.target.value, 10) || 25,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_changepoint_range (0–1)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.01}
                            value={form.prophetChangepointRange}
                            onChange={(e) =>
                              form.setProphetChangepointRange(
                                Math.min(
                                  1,
                                  Math.max(0, parseFloat(e.target.value) || 0.8),
                                ),
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_growth
                          </label>
                          <select
                            value={form.prophetGrowth}
                            onChange={(e) =>
                              form.setProphetGrowth(
                                e.target.value as "linear" | "logistic" | "flat",
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="linear">linear</option>
                            <option value="logistic">logistic</option>
                            <option value="flat">flat</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_weekly_seasonality
                          </label>
                          <select
                            value={form.prophetWeeklySeasonality}
                            onChange={(e) =>
                              form.setProphetWeeklySeasonality(
                                e.target.value as ProphetSeasonalityBoolUi,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="true">on (true)</option>
                            <option value="false">off (false)</option>
                            <option value="custom">custom order (int)</option>
                          </select>
                          {form.prophetWeeklySeasonality === "custom" && (
                            <input
                              type="number"
                              min={0}
                              value={form.prophetWeeklySeasonalityOrder}
                              onChange={(e) =>
                                form.setProphetWeeklySeasonalityOrder(
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                              className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_daily_seasonality
                          </label>
                          <select
                            value={form.prophetDailySeasonality}
                            onChange={(e) =>
                              form.setProphetDailySeasonality(
                                e.target.value as ProphetSeasonalityBoolUi,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="true">on (true)</option>
                            <option value="false">off (false)</option>
                            <option value="custom">custom order (int)</option>
                          </select>
                          {form.prophetDailySeasonality === "custom" && (
                            <input
                              type="number"
                              min={0}
                              value={form.prophetDailySeasonalityOrder}
                              onChange={(e) =>
                                form.setProphetDailySeasonalityOrder(
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                              className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            prophet_mcmc_samples
                            <span className="font-normal text-gray-500 ml-1">
                              (0 = MAP)
                            </span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.prophetMcmcSamples}
                            onChange={(e) =>
                              form.setProphetMcmcSamples(
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {form.forecastModel === "SARIMAX" && (
                    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-white/60 dark:bg-gray-800/40">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        SARIMAX parameters
                      </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          SARIMAX Order (p, d, q)
                        </label>
                        <div className="flex gap-2">
                          {(["p", "d", "q"] as const).map((label, idx) => (
                            <input
                              key={label}
                              type="number"
                              min={0}
                              max={5}
                              value={form.sarimaxOrder[idx]}
                              onChange={(e) => {
                                const n = parseInt(e.target.value, 10) || 0;
                                form.setSarimaxOrder((prev) => {
                                  const next = [...prev] as [
                                    number,
                                    number,
                                    number,
                                  ];
                                  next[idx] = Math.max(0, n);
                                  return next;
                                });
                              }}
                              className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              aria-label={`SARIMAX ${label}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Seasonal Order (P, D, Q, s)
                        </label>
                        <div className="flex gap-2">
                          {(["P", "D", "Q", "s"] as const).map((label, idx) => (
                            <input
                              key={label}
                              type="number"
                              min={0}
                              max={24}
                              value={form.sarimaxSeasonalOrder[idx]}
                              onChange={(e) => {
                                const n = parseInt(e.target.value, 10) || 0;
                                form.setSarimaxSeasonalOrder((prev) => {
                                  const next = [...prev] as [
                                    number,
                                    number,
                                    number,
                                    number,
                                  ];
                                  next[idx] = Math.max(0, n);
                                  return next;
                                });
                              }}
                              className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              aria-label={`SARIMAX seasonal ${label}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                      <button
                        type="button"
                        onClick={() => form.setShowSarimaxAdvanced((v) => !v)}
                        className="text-sm font-medium text-[#ba0c2f] dark:text-red-400"
                      >
                        {form.showSarimaxAdvanced ? "Hide" : "Show"} advanced SARIMAX
                      </button>
                      {form.showSarimaxAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              sarimax_trend
                            </label>
                            <select
                              value={form.sarimaxTrend}
                              onChange={(e) =>
                                form.setSarimaxTrend(
                                  e.target.value as "" | "n" | "c" | "t" | "ct",
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">none (omit)</option>
                              <option value="n">n — no trend</option>
                              <option value="c">c — constant</option>
                              <option value="t">t — linear trend</option>
                              <option value="ct">ct — constant + trend</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              sarimax_method
                            </label>
                            <select
                              value={form.sarimaxMethod}
                              onChange={(e) =>
                                form.setSarimaxMethod(
                                  e.target.value as
                                    | "lbfgs"
                                    | "nm"
                                    | "powell"
                                    | "bfgs"
                                    | "cg",
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="lbfgs">lbfgs</option>
                              <option value="nm">nm</option>
                              <option value="powell">powell</option>
                              <option value="bfgs">bfgs</option>
                              <option value="cg">cg</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              sarimax_maxiter
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={form.sarimaxMaxiter}
                              onChange={(e) =>
                                form.setSarimaxMaxiter(parseInt(e.target.value, 10) || 50)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              sarimax_cov_type
                            </label>
                            <select
                              value={form.sarimaxCovType}
                              onChange={(e) =>
                                form.setSarimaxCovType(
                                  e.target.value as "opg" | "oim" | "robust",
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="opg">opg</option>
                              <option value="oim">oim</option>
                              <option value="robust">robust</option>
                            </select>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.sarimaxEnforceStationarity}
                              onChange={(e) =>
                                form.setSarimaxEnforceStationarity(e.target.checked)
                              }
                              className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              sarimax_enforce_stationarity
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.sarimaxEnforceInvertibility}
                              onChange={(e) =>
                                form.setSarimaxEnforceInvertibility(e.target.checked)
                              }
                              className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              sarimax_enforce_invertibility
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.sarimaxConcentrateScale}
                              onChange={(e) =>
                                form.setSarimaxConcentrateScale(e.target.checked)
                              }
                              className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              sarimax_concentrate_scale
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.sarimaxMeasurementError}
                              onChange={(e) =>
                                form.setSarimaxMeasurementError(e.target.checked)
                              }
                              className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              sarimax_measurement_error
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer md:col-span-2">
                            <input
                              type="checkbox"
                              checked={form.sarimaxSimpleDifferencing}
                              onChange={(e) =>
                                form.setSarimaxSimpleDifferencing(e.target.checked)
                              }
                              className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              sarimax_simple_differencing
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {form.forecastModel === "NeuralProphet" && (
                    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-white/60 dark:bg-gray-800/40">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        NeuralProphet parameters
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="form.neuralProphetNLags"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            n_lags
                          </label>
                          <input
                            type="number"
                            id="form.neuralProphetNLags"
                            min={1}
                            max={8760}
                            value={form.neuralProphetNLags}
                            onChange={(e) =>
                              form.setNeuralProphetNLags(
                                Math.max(
                                  1,
                                  parseInt(e.target.value, 10) || 24,
                                ),
                              )
                            }
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="form.neuralProphetNForecasts"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            n_forecasts
                          </label>
                          <input
                            type="number"
                            id="form.neuralProphetNForecasts"
                            min={1}
                            max={168}
                            value={form.neuralProphetNForecasts}
                            onChange={(e) =>
                              form.setNeuralProphetNForecasts(
                                Math.max(1, parseInt(e.target.value, 10) || 6),
                              )
                            }
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          lagged_features
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                            Past-value regressors (may overlap form.features)
                          </span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {NP_REGRESSOR_OPTIONS.map((feat) => (
                            <label
                              key={feat}
                              className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <input
                                type="checkbox"
                                checked={form.laggedFeatures.includes(feat)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? form.laggedFeatures.includes(feat)
                                      ? form.laggedFeatures
                                      : [...form.laggedFeatures, feat]
                                    : form.laggedFeatures.filter((f) => f !== feat);
                                  form.setLaggedFeatures(next);
                                  form.setNpFeatureLagsJson((prev) =>
                                    form.syncFeatureLagsJsonForFeatures(
                                      prev,
                                      next,
                                      form.neuralProphetNLags,
                                    ),
                                  );
                                }}
                                className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                              />
                              <span>{feat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          feature_lags
                        </label>
                        <select
                          value={form.npFeatureLagsMode}
                          onChange={(e) =>
                            form.setNpFeatureLagsMode(e.target.value as NpFeatureLagsUi)
                          }
                          className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="default">
                            default (null → each lagged feature uses n_lags)
                          </option>
                          <option value="uniform">uniform lag count</option>
                          <option value="json">per-feature JSON map</option>
                        </select>
                        {form.npFeatureLagsMode === "uniform" && (
                          <input
                            type="number"
                            min={1}
                            max={form.neuralProphetNLags}
                            value={form.npFeatureLagsUniform}
                            onChange={(e) => form.setNpFeatureLagsUniform(e.target.value)}
                            placeholder="1..n_lags"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        )}
                        {form.npFeatureLagsMode === "json" && (
                          <textarea
                            value={form.npFeatureLagsJson}
                            onChange={(e) => form.setNpFeatureLagsJson(e.target.value)}
                            rows={2}
                            placeholder='{"IsnotSummerBreak": 12}'
                            className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          form.setShowNeuralProphetAdvanced((v) => !v)
                        }
                        className="text-sm font-medium text-[#ba0c2f] dark:text-red-400"
                      >
                        {form.showNeuralProphetAdvanced ? "Hide" : "Show"} advanced
                        training / regularization
                      </button>
                      {form.showNeuralProphetAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              epochs
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={form.npEpochs}
                              onChange={(e) => form.setNpEpochs(e.target.value)}
                              placeholder="30 or empty for auto"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              n_changepoints
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={form.npNChangepoints}
                              onChange={(e) =>
                                form.setNpNChangepoints(parseInt(e.target.value, 10) || 10)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              changepoints_range (0–1)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step={0.01}
                              value={form.npChangepointsRange}
                              onChange={(e) =>
                                form.setNpChangepointsRange(
                                  Math.min(
                                    1,
                                    Math.max(0, parseFloat(e.target.value) || 0),
                                  ),
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              trend_reg
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={form.npTrendReg}
                              onChange={(e) =>
                                form.setNpTrendReg(parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              seasonality_reg
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={form.npSeasonalityReg}
                              onChange={(e) =>
                                form.setNpSeasonalityReg(parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              ar_reg
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={form.npArReg}
                              onChange={(e) => form.setNpArReg(e.target.value)}
                              placeholder="empty = off"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              learning_rate
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={0.0001}
                              value={form.npLearningRate}
                              onChange={(e) => form.setNpLearningRate(e.target.value)}
                              placeholder="empty = auto search"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              batch_size
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={form.npBatchSize}
                              onChange={(e) => form.setNpBatchSize(e.target.value)}
                              placeholder="empty = auto"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              newer_samples_weight
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={form.npNewerSamplesWeight}
                              onChange={(e) =>
                                form.setNpNewerSamplesWeight(e.target.value)
                              }
                              placeholder="empty = default"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Features
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                        Select feature columns for modeling
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
                      {NP_REGRESSOR_OPTIONS.map((feat) => (
                        <label
                          key={feat}
                          className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={form.features.includes(feat)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                form.setFeatures((prev) =>
                                  prev.includes(feat)
                                    ? prev
                                    : [...prev, feat],
                                );
                              } else {
                                form.setFeatures((prev) =>
                                  prev.filter((f) => f !== feat),
                                );
                              }
                            }}
                            className="h-4 w-4 text-[#ba0c2f] focus:ring-[#ba0c2f] border-gray-300 rounded"
                          />
                          <span>{feat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
    </>
  );
}
