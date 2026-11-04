import PlotViewTabs from "./PlotViewTabs";
import CampusInteractivePlot from "./CampusInteractivePlot";
import { isAxiosError } from "axios";
import { useSimpleRpca } from "../services/api";
import type { BaseRequest } from "../types/api";

interface SimpleRpcaPanelProps {
  submitParams: BaseRequest | null;
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

function getErrorDetail(error: unknown): {
  code?: string;
  message: string;
  hint?: string;
} {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
      return {
        message: detail.map((issue: { loc?: (string | number)[]; msg?: string }) =>
          `${issue.loc?.filter((part) => part !== "body").join(".") || "Request"}: ${issue.msg || "Invalid value"}`,
        ).join("; "),
      };
    }
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
    message: error instanceof Error ? error.message : "RPCA request failed",
  };
}

export default function SimpleRpcaPanel({
  submitParams,
}: SimpleRpcaPanelProps) {
  const { data, isLoading, isFetching, error } = useSimpleRpca(submitParams, {
    enabled: !!submitParams,
  });

  if (!submitParams) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No Campus overview result yet.
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
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading saved Campus overview…
        </p>
      </div>
    );
  }

  if (error) {
    const detail = getErrorDetail(error);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          {detail.code ? `${detail.code}: ` : ""}
          {detail.message}
        </p>
        {detail.hint && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {detail.hint}
          </p>
        )}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Campus overview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {data.meter}: recorded versus usual use from the saved {data.summary.saved_year} results.
            </p>
          </div>
          <div className="rounded-md bg-[#0079A7]/10 px-3 py-2 text-sm font-semibold text-[#0079A7] dark:bg-[#AEDBE9]/10 dark:text-[#AEDBE9]">
            Threshold {data.threshold.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SummaryCard label="Hourly readings" value={data.summary.data_hours} />
          <SummaryCard label="Buildings" value={data.summary.data_meters} />
          <SummaryCard label="Hours above your limit" value={data.summary.overage_hours ?? "No data"} />
          <SummaryCard
            label="Week starts"
            value={data.date_range.start.slice(0,10)}
          />
        </div>
        {data.warnings?.map((warning) => (
          <p key={warning} role="status" className="mt-3 text-sm text-gray-700 dark:text-gray-200">{warning}</p>
        ))}
        <details className="mt-4 border-t border-gray-200 pt-3 text-sm dark:border-gray-600">
          <summary className="cursor-pointer font-medium">Saved data and coverage</summary>
          <div className="mt-3 space-y-2 break-words">
            <p>Campus total: {data.summary.valid_total_hours} complete hours; {data.summary.missing_total_hours} missing hours.</p>
            <p>Week: {data.date_range.start} through {data.date_range.end}.</p>
            <p>Campus total sources: {data.total_meters.join(", ")}</p>
            <p>Building readings, usual usage, and deviations are loaded from saved files. No model is fitted on this request.</p>
          </div>
        </details>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-8 transition-colors">
        <PlotViewTabs title="Unusual energy use" image={data.heatmap_plot_png_base64}>
          {data.interactive_data && <CampusInteractivePlot result={data} kind="heatmap" />}
        </PlotViewTabs>
        <PlotViewTabs title="Actual use vs estimated usual use" image={data.series_plot_png_base64}>
          {data.interactive_data && <CampusInteractivePlot result={data} kind="series" />}
        </PlotViewTabs>
        <PlotViewTabs title={`Campus total vs limit — ${data.summary.overage_hours ?? "Unknown"} hours above limit`} image={data.overage_plot_png_base64}>
          {data.interactive_data && <CampusInteractivePlot result={data} kind="overage" />}
        </PlotViewTabs>
      </div>
    </div>
  );
}
