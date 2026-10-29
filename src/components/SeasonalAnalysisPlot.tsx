import PlotViewTabs from "./PlotViewTabs";
import InteractiveBoxPlot from "./InteractiveBoxPlot";
import { formatStatistic } from "../utils/formatStatistic";
import type { BaseRequest } from "../types/api";
import { useSeasonalAnalysis } from "../services/api";
import { AxiosError } from "axios";
import ManualOutliersAudit from "./ManualOutliersAudit";

interface SeasonalAnalysisPlotProps {
  submitParams?: BaseRequest | null;
}

export default function SeasonalAnalysisPlot({
  submitParams,
}: SeasonalAnalysisPlotProps) {
  const { data, isLoading, error } = useSeasonalAnalysis(
    submitParams || {
      start_date: "",
      end_date: "",
      meter: "",
    },
    { enabled: !!submitParams }
  );

  if (!submitParams) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center py-8">
          Please submit the form to view seasonal analysis data
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0079A7]"></div>
          <span className="ml-3 text-lg text-gray-600">
            Loading seasonal analysis data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-2 text-sm text-red-700">
            {error instanceof AxiosError
              ? error.response?.data?.detail || error.message
              : "An error occurred loading seasonal analysis data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">Compare seasons and times when classes are in session. In the box charts, each box contains the middle half of readings; the line inside marks the middle reading.</p>
      <ManualOutliersAudit
        applied={data.manual_outliers_applied}
        skipped={data.manual_outliers_skipped}
      />
      <PlotViewTabs image={data.plot_png_base64} title="Seasonal comparison">
        <InteractiveBoxPlot readings={data.boxplot_data} />
      </PlotViewTabs>

      {/* Statistics Table */}
      <details className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-x-auto">
        <summary className="mb-3 cursor-pointer font-medium">Detailed readings and statistics</summary>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Season
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class schedule
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Average
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Median
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Std Dev
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.boxplot_data.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.season}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.session_status}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatStatistic(item.mean)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatStatistic(item.q50)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatStatistic(item.std)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatStatistic(item.min)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatStatistic(item.max)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      {/* Date Range Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-[#0079A7] mb-4">
          Date Range Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Requested Start:</span>
            <p className="text-gray-600">
              {new Date(data.date_range.start).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Requested End:</span>
            <p className="text-gray-600">
              {new Date(data.date_range.end).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Actual Start:</span>
            <p className="text-gray-600">
              {new Date(data.date_range.actual_start).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Actual End:</span>
            <p className="text-gray-600">
              {new Date(data.date_range.actual_end).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
