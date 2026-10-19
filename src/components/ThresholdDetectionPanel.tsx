import { isAxiosError } from "axios";
import { useOverageThreshold } from "../services/api";
import type { BaseRequest } from "../types/api";
import ManualOutliersAudit from "./ManualOutliersAudit";

interface ThresholdDetectionPanelProps {
  submitParams: BaseRequest | null;
  title?: string;
  emptyMessage?: string;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-1">
        {value}
      </p>
    </div>
  );
}

function PngPlot({ title, base64 }: { title: string; base64: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
        {title}
      </h3>
      <img
        src={`data:image/png;base64,${base64}`}
        alt={title}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-600"
      />
    </div>
  );
}

function getErrorDetail(error: unknown): {
  code?: string;
  message: string;
  hint?: string;
} {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      const structured = detail as {
        code?: unknown;
        message?: unknown;
        hint?: unknown;
      };
      return {
        code:
          typeof structured.code === "string" ? structured.code : undefined,
        message:
          typeof structured.message === "string"
            ? structured.message
            : error.message,
        hint:
          typeof structured.hint === "string" ? structured.hint : undefined,
      };
    }
    if (typeof detail === "string") {
      return { message: detail };
    }
  }
  return {
    message: error instanceof Error ? error.message : "Analysis request failed",
  };
}

export default function ThresholdDetectionPanel({
  submitParams,
  title = "Threshold Detection",
  emptyMessage = "Select parameters and click Generate Analysis to run threshold detection.",
}: ThresholdDetectionPanelProps) {
  const { data, isLoading, isFetching, error } = useOverageThreshold(
    submitParams,
    { enabled: !!submitParams },
  );

  if (!submitParams) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
        <div className="text-[#0079A7] dark:text-[#AEDBE9] mb-3">
          <svg
            className="w-12 h-12 mx-auto opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
        <svg
          className="animate-spin h-8 w-8 text-[#0079A7] dark:text-[#AEDBE9] mx-auto mb-3"
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
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Running threshold analysis…
        </p>
      </div>
    );
  }

  if (error) {
    const errorDetail = getErrorDetail(error);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
          <svg
            className="w-5 h-5 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold text-sm">Analysis failed</p>
            {errorDetail.code && (
              <p className="mt-1 inline-flex rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-200">
                {errorDetail.code}
              </p>
            )}
            <p className="text-sm mt-1 text-red-500 dark:text-red-300">
              {errorDetail.message}
            </p>
            {errorDetail.hint && (
              <p className="mt-2 text-xs text-red-500/90 dark:text-red-300/90">
                {errorDetail.hint}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors space-y-8">
      <div className="flex items-center gap-2">
        <div className="h-1 w-8 bg-[#0079A7] rounded" />
        <h2 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9]">
          {title}
        </h2>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {data.main_meter} · {data.threshold_mode} · threshold{" "}
          {data.threshold.toLocaleString()}
        </span>
      </div>

      <ManualOutliersAudit
        applied={data.manual_outliers_applied}
        skipped={data.manual_outliers_skipped}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <SummaryCard label="Overage hours" value={summary.overage_hours} />
        <SummaryCard label="Overage events" value={summary.overage_event_count} />
        <SummaryCard
          label="Threshold"
          value={summary.threshold.toLocaleString()}
        />
        <SummaryCard label="Rank (L)" value={summary.rank_l} />
        <SummaryCard label="Lambda" value={summary.lambda.toExponential(3)} />
        <SummaryCard label="Mu" value={summary.mu.toExponential(3)} />
        <SummaryCard
          label="Converged"
          value={summary.converged ? "Yes" : "No"}
        />
        <SummaryCard label="Iterations" value={summary.iterations} />
        <SummaryCard label="Data hours" value={summary.data_hours} />
        <SummaryCard label="Data meters" value={summary.data_meters} />
        <SummaryCard
          label="S nonzero share"
          value={(summary.s_nonzero_share * 100).toFixed(1) + "%"}
        />
        <SummaryCard
          label="Final delta"
          value={summary.final_delta.toExponential(2)}
        />
      </div>

      {data.threshold_optimization && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Threshold optimization (RPCA)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard
              label="Recommended threshold"
              value={data.threshold_optimization.recommended_threshold.toLocaleString()}
            />
            <SummaryCard
              label="Selection method"
              value={data.threshold_optimization.selection_method}
            />
            <SummaryCard
              label="Sweep range"
              value={`${data.threshold_optimization.threshold_range.min.toLocaleString()} – ${data.threshold_optimization.threshold_range.max.toLocaleString()}`}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <SummaryCard
              label="p90"
              value={data.threshold_optimization.percentile_thresholds.p90.toLocaleString()}
            />
            <SummaryCard
              label="p95"
              value={data.threshold_optimization.percentile_thresholds.p95.toLocaleString()}
            />
            <SummaryCard
              label="p99"
              value={data.threshold_optimization.percentile_thresholds.p99.toLocaleString()}
            />
          </div>
          {data.threshold_sweep_plot_png_base64 && (
            <PngPlot
              title="Threshold sweep"
              base64={data.threshold_sweep_plot_png_base64}
            />
          )}
        </div>
      )}

      {data.overage_events.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Overage events
          </h3>
          <div className="max-h-80 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Start
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    End
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Duration (h)
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Peak
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Total exceedance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {data.overage_events.map((event) => (
                  <tr key={`${event.start}-${event.end}`}>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {event.start}
                    </td>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {event.end}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                      {event.duration_hours}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                      {event.peak.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                      {event.total_exceedance.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.contributions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Contributions
          </h3>
          <div className="max-h-80 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Meter
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Contribution
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {data.contributions.map((row) => (
                  <tr key={row.meter}>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                      {row.meter}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                      {row.contribution.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {row.method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.event_contributions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Event contributions
          </h3>
          <div className="max-h-80 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Event
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Rank
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Meter
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Contribution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {data.event_contributions.map((row, i) => (
                  <tr key={`${row.event_start}-${row.meter}-${row.rank}-${i}`}>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {row.event_start} → {row.event_end}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                      {row.rank}
                    </td>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                      {row.meter}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                      {row.contribution.toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.heatmap_plot_png_base64 && (
          <PngPlot title="Overage heatmap" base64={data.heatmap_plot_png_base64} />
        )}
        {data.series_plot_png_base64 && (
          <PngPlot
            title="Stacked series"
            base64={data.series_plot_png_base64}
          />
        )}
      </div>

      <div className="p-3 bg-[#AEDBE9]/25 dark:bg-[#0079A7]/20 rounded-lg border border-[#AEDBE9] dark:border-[#0079A7]/50">
        <p className="text-xs text-[#005F80] dark:text-[#AEDBE9]">
          <strong>Main meter:</strong> {data.main_meter}
          <span className="ml-3">
            <strong>Data range:</strong> {data.date_range.start} —{" "}
            {data.date_range.end}
          </span>
          <span className="ml-3">
            <strong>Analysis window:</strong> {data.analysis_window.start} —{" "}
            {data.analysis_window.end}
          </span>
          <span className="ml-3">
            <strong>Meters in RPCA:</strong> {data.meters.length}
          </span>
        </p>
      </div>
    </div>
  );
}
