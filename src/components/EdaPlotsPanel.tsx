import { useEdaPlot } from "../services/api";
import type {
  BaseRequest,
  EdaTrendTestsResponse,
  EdaTrendTestResult,
  EdaSeasonalityTestsResponse,
  EdaHarmonicTestResult,
  EdaOcsbResponse,
  EdaOcsbPeriodResult,
  EdaKruskalWallisResult,
  EdaUnitRootTestsResponse,
  EdaUnitRootTestDetail,
  ManualOutlierAuditFields,
} from "../types/api";
import ManualOutliersAudit from "./ManualOutliersAudit";

interface EdaPlotsPanelProps {
  submitParams: BaseRequest | null;
}

function EdaManualOutliersAudit({ data }: { data: ManualOutlierAuditFields }) {
  return (
    <ManualOutliersAudit
      applied={data.manual_outliers_applied}
      skipped={data.manual_outliers_skipped}
    />
  );
}

function isTrendTestsResponse(data: unknown): data is EdaTrendTestsResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "trend_tests" in data
  );
}

function isSeasonalityTestsResponse(
  data: unknown,
): data is EdaSeasonalityTestsResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "seasonality_tests" in data
  );
}

function isUnitRootTestsResponse(
  data: unknown,
): data is EdaUnitRootTestsResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "unit_root_tests" in data
  );
}

function isOcsbError(
  ocsb: EdaOcsbResponse,
): ocsb is { error: string } {
  return "error" in ocsb && typeof ocsb.error === "string";
}

function HarmonicTestCard({
  period,
  result,
}: {
  period: string;
  result: EdaHarmonicTestResult;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Period {period}h
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">F</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.F.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">p-value</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.p_value.toExponential(3)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Significant (α=0.05)</p>
          <p
            className={`font-semibold ${result.significant_at_0_05 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
          >
            {result.significant_at_0_05 ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">n_harmonics</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.n_harmonics}
          </p>
        </div>
        {result.df_num != null && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">df (num / denom)</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {result.df_num} / {result.df_denom}
            </p>
          </div>
        )}
        {result.hac_robust != null && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">HAC robust</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {result.hac_robust ? "Yes" : "No"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function KruskalWallisCard({ result }: { result: EdaKruskalWallisResult }) {
  if (result.skipped) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
        <p className="font-semibold">Period {result.period}h — skipped</p>
        {result.reason && <p className="mt-1">{result.reason}</p>}
      </div>
    );
  }
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Period {result.period}h
        {result.aggregate != null && (
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
            aggregate={result.aggregate}
            {result.aggfunc ? ` · ${result.aggfunc}` : ""}
          </span>
        )}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">H</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.H.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">p-value</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.p_value.toExponential(3)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Significant (α=0.05)</p>
          <p
            className={`font-semibold ${result.significant_at_0_05 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
          >
            {result.significant_at_0_05 ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">n_groups</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.n_groups}
          </p>
        </div>
      </div>
    </div>
  );
}

function OcsbPeriodCard({
  period,
  result,
}: {
  period: string;
  result: EdaOcsbPeriodResult;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Period {period}h
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">D statistic</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.D}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Stochastic seasonality</p>
          <p
            className={`font-semibold ${result.stochastic_seasonality ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
          >
            {result.stochastic_seasonality ? "Yes" : "No"}
          </p>
        </div>
      </div>
    </div>
  );
}

function OcsbSection({ ocsb }: { ocsb: EdaOcsbResponse }) {
  if (isOcsbError(ocsb)) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
        <p className="font-semibold mb-1">OCSB tests</p>
        <p>{ocsb.error}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        OCSB (one per period)
      </p>
      {Object.entries(ocsb).map(([period, result]) => (
        <OcsbPeriodCard key={period} period={period} result={result} />
      ))}
    </div>
  );
}

function UnitRootTestDetailCard({
  label,
  result,
}: {
  label: string;
  result: EdaUnitRootTestDetail;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
        {label}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        H₀: {result.null}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Statistic</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.statistic.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">p-value</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.p_value.toExponential(3)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rejects H₀</p>
          <p
            className={`font-semibold ${result.rejects_null ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
          >
            {result.rejects_null ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Lags</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {result.lags}
          </p>
        </div>
        {result.n_obs != null && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">n_obs</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {result.n_obs}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendTestRow({ label, result }: { label: string; result: EdaTrendTestResult }) {
  const trendColor =
    result.trend === "increasing"
      ? "text-red-600 dark:text-red-400"
      : result.trend === "decreasing"
      ? "text-[#0079A7] dark:text-[#AEDBE9]"
      : "text-gray-600 dark:text-gray-400";

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{label}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Trend</p>
          <p className={`text-sm font-semibold capitalize ${trendColor}`}>{result.trend}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Significant</p>
          <p className={`text-sm font-semibold ${result.h ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
            {result.h ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">p-value</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {result.p.toExponential(3)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">z-score</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {result.z.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tau</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {result.tau.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Slope</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {result.slope.toFixed(6)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Intercept</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {result.intercept.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">S</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {result.s.toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function EdaFooter({
  meter,
  dateRange,
}: {
  meter: string;
  dateRange?: { start: string; end: string };
}) {
  return (
    <div className="mt-4 p-3 bg-[#AEDBE9]/25 dark:bg-[#0079A7]/20 rounded-lg border border-[#AEDBE9] dark:border-[#0079A7]/50">
      <p className="text-xs text-[#005F80] dark:text-[#AEDBE9]">
        <strong>Meter:</strong> {meter}
        {dateRange && (
          <span className="ml-3">
            <strong>Period:</strong> {dateRange.start} — {dateRange.end}
          </span>
        )}
      </p>
    </div>
  );
}

const EDA_ROUTE_LABELS: Record<string, string> = {
  "trend-tests": "Is energy use going up or down?",
  "seasonality-tests": "Daily and weekly patterns",
  "unit-root-tests": "Unit Root Tests",
  "seasonal-decompose": "Long-term and repeating patterns",
  "autocorr": "Autocorrelation (ACF)",
  "annotated-timeseries": "Energy use around holidays and weekends",
};

export default function EdaPlotsPanel({ submitParams }: EdaPlotsPanelProps) {
  const { data, isLoading, isFetching, error } = useEdaPlot(submitParams, {
    enabled: !!submitParams,
  });

  if (!submitParams) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
        <div className="text-[#0079A7] dark:text-[#AEDBE9] mb-3">
          <svg className="w-12 h-12 mx-auto opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Choose a location and dates, then click <strong>Show results</strong>.
        </p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
        <svg className="animate-spin h-8 w-8 text-[#0079A7] dark:text-[#AEDBE9] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Running analysis…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm">Analysis failed</p>
            <p className="text-sm mt-1 text-red-500 dark:text-red-300">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const routeLabel = EDA_ROUTE_LABELS[submitParams.eda_route ?? ""] ?? "EDA";

  if (isSeasonalityTestsResponse(data)) {
    const { seasonality_tests: st } = data;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1 w-8 bg-[#0079A7] rounded" />
          <h2 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9]">
            {routeLabel}
          </h2>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {st.n_points.toLocaleString()} readings
          </span>
        </div>

        <EdaManualOutliersAudit data={data} />

        <div className="mb-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
          {Object.entries(st.harmonic_tests).map(([period, result]) => <p key={period}>{period === "24" ? "Daily pattern" : period === "168" ? "Weekly pattern" : `${period}-hour pattern`}: {result.significant_at_0_05 ? "the data shows evidence of a repeating pattern." : "this check did not find clear evidence of a repeating pattern."}</p>)}
          <p>These checks describe your selected dates. They do not explain what caused a pattern.</p>
        </div>
        <details><summary className="mb-3 cursor-pointer text-sm font-medium">Technical details</summary>
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Harmonic F-tests · periods [{st.periods.join(", ")}]
          </p>
          {Object.entries(st.harmonic_tests).map(([period, result]) => (
            <HarmonicTestCard key={period} period={period} result={result} />
          ))}

          {st.kruskal_wallis && st.kruskal_wallis.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Kruskal-Wallis
              </p>
              {st.kruskal_wallis.map((kw, i) => (
                <KruskalWallisCard key={`${kw.period}-${i}`} result={kw} />
              ))}
            </div>
          )}

          <OcsbSection ocsb={st.ocsb} />
        </div>

        </details>

        <EdaFooter meter={data.meter} dateRange={data.date_range} />
      </div>
    );
  }

  if (isUnitRootTestsResponse(data)) {
    const { unit_root_tests: ut } = data;
    const conclusionColor =
      ut.conclusion === "STATIONARY"
        ? "text-green-600 dark:text-green-400"
        : ut.conclusion === "UNIT_ROOT"
          ? "text-red-600 dark:text-red-400"
          : "text-amber-600 dark:text-amber-400";

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1 w-8 bg-[#0079A7] rounded" />
          <h2 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9]">
            {routeLabel}
          </h2>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {ut.n_points.toLocaleString()} points · regression {ut.regression}
          </span>
        </div>

        <EdaManualOutliersAudit data={data} />

        <div className="mb-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Joint conclusion
          </p>
          <p className={`text-lg font-semibold ${conclusionColor}`}>
            {ut.conclusion}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {ut.diagnosis}
          </p>
        </div>

        <div className="space-y-4">
          <UnitRootTestDetailCard label="Augmented Dickey-Fuller (ADF)" result={ut.adf} />
          <UnitRootTestDetailCard label="KPSS" result={ut.kpss} />
          {ut.zivot_andrews && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Zivot-Andrews
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                H₀: {ut.zivot_andrews.null}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Statistic</p>
                  <p className="font-semibold">{ut.zivot_andrews.statistic.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">p-value</p>
                  <p className="font-semibold">
                    {ut.zivot_andrews.p_value.toExponential(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Break time</p>
                  <p className="font-semibold text-xs">{ut.zivot_andrews.break_time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rejects H₀</p>
                  <p className="font-semibold">
                    {ut.zivot_andrews.rejects_null ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <EdaFooter meter={data.meter} dateRange={data.date_range} />
      </div>
    );
  }

  if (isTrendTestsResponse(data)) {
    const { trend_tests } = data;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1 w-8 bg-[#0079A7] rounded" />
          <h2 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9]">{routeLabel}</h2>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {trend_tests.n_points.toLocaleString()} readings
          </span>
        </div>

        <EdaManualOutliersAudit data={data} />

        <p className="mb-4 text-sm leading-6 text-gray-700 dark:text-gray-200">
          {trend_tests.seasonal_kendall.h
            ? `After accounting for repeating cycles, this check found evidence that energy use is ${trend_tests.seasonal_kendall.trend === "increasing" ? "going up" : trend_tests.seasonal_kendall.trend === "decreasing" ? "going down" : "changing"}.`
            : "This check did not find clear evidence that energy use is consistently going up or down after accounting for repeating cycles."}
          {" "}This describes the selected period and does not predict future use.
        </p>
        <details><summary className="mb-3 cursor-pointer text-sm font-medium">Technical details</summary>
        <div className="space-y-4">
          <TrendTestRow label="Mann-Kendall Test" result={trend_tests.mann_kendall} />
          <TrendTestRow label="Seasonal Kendall Test" result={trend_tests.seasonal_kendall} />
        </div>

        </details>

        <EdaFooter meter={data.meter} dateRange={data.date_range} />
      </div>
    );
  }

  const plotData = data as { plot_png_base64?: string; meter?: string };
  if (plotData.plot_png_base64) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-8 bg-[#0079A7] rounded" />
          <h2 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9]">{routeLabel}</h2>
          {plotData.meter && (
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              {plotData.meter}
            </span>
          )}
        </div>
        <EdaManualOutliersAudit data={data as ManualOutlierAuditFields} />
        <img
          src={`data:image/png;base64,${plotData.plot_png_base64}`}
          alt={routeLabel}
          className="w-full rounded-lg"
        />
      </div>
    );
  }

  return null;
}
