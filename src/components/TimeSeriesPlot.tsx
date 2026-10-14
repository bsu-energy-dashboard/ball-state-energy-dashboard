import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Brush,
} from "recharts";
import type { BaseRequest } from "../types/api";
import { useTimeSeries } from "../services/api";
import { AxiosError } from "axios";
import ForecastPlot from "./ForecastPlot";
import ManualOutliersAudit from "./ManualOutliersAudit";
import { normalizeOutliers } from "../utils/outliers";

interface TimeSeriesPlotProps {
  submitParams?: BaseRequest | null;
}

export default function TimeSeriesPlot({ submitParams }: TimeSeriesPlotProps) {
  const { data, isLoading, error } = useTimeSeries(
    submitParams || {
      start_date: "",
      end_date: "",
      meter: "",
      smoothing_method: "ma",
      smoothing_window: 7,
      cleaning_method: "None",
    },
    { enabled: !!submitParams }
  );

  // If modeling returned forecast_time_series, render ForecastPlot
  if ((submitParams?.forecast || submitParams?.assessment) && data?.forecast_time_series) {
    return (
      <div className="space-y-6">
        <ManualOutliersAudit
          applied={data.manual_outliers_applied}
          skipped={data.manual_outliers_skipped}
        />
        <ForecastPlot
          submitParams={submitParams}
          forecastData={data.forecast_time_series}
          timeSeriesData={data}
        />
      </div>
    );
  }

  // const totalMissing = useMemo(() => {
  //   return (
  //     data?.missing_counts?.reduce(
  //       (acc, curr) => acc + curr.number_of_missing,
  //       0
  //     ) || 0
  //   );
  // }, [data?.missing_counts]);
  // Create a set of outlier timestamps for quick lookup (must be before early returns)
  // const outlierTimestamps = useMemo(() => {
  //   if (!data?.outliers) return new Set<string>();
  //   return new Set(
  //     data.outliers.map((outlier) =>
  //       new Date(outlier.DateTime).getTime().toString()
  //     )
  //   );
  // }, [data?.outliers]);

  // // Prepare outlier data for scatter plot (must be before early returns)
  // const outlierData = useMemo(() => {
  //   if (!data?.outliers) return [];
  //   return data.outliers.map((outlier) => {
  //     const dateObj = new Date(outlier.DateTime);
  //     return {
  //       date: dateObj.toLocaleDateString("en-US", {
  //         month: "short",
  //         day: "numeric",
  //       }),
  //       fullDate: dateObj.getTime(),
  //       value: outlier.Value,
  //       DateTime: outlier.DateTime,
  //     };
  //   });
  // }, [data?.outliers]);

  if (!submitParams) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Please submit the form to view time series data
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0079A7] dark:border-[#AEDBE9]"></div>
          <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">
            Loading time series data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {error instanceof AxiosError
              ? error.response?.data?.detail || error.message
              : "An error occurred loading time series data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // If modeling returned forecast_time_series, render ForecastPlot
  if ((submitParams?.forecast || submitParams?.assessment) && data?.forecast_time_series) {
    return (
      <div className="space-y-6">
        <ManualOutliersAudit
          applied={data.manual_outliers_applied}
          skipped={data.manual_outliers_skipped}
        />
        <ForecastPlot
          submitParams={submitParams}
          forecastData={data.forecast_time_series}
          timeSeriesData={data}
        />
      </div>
    );
  }

  const assessmentComparisonData =
    submitParams?.assessment && data.forecast_time_series
      ? data.forecast_time_series
          .filter((row) => row.y != null && (row.yhat != null || row.trend != null))
          .map((row) => ({
            date: new Date(row.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            actual: row.y as number,
            predicted: (row.yhat ?? row.trend) as number,
          }))
      : [];

  const outliers = data.outliers?.length
    ? normalizeOutliers(data.outliers)
    : [];

  // Regular time series plot
  if (!data.time_series) {
    return null;
  }

  const chartData = data.time_series
    .map((item) => {
      const date = new Date(item.date);
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: item.date,
        smoothed: item.smoothed,
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([key, value]) =>
              key !== "date" && key !== "smoothed" && typeof value === "number"
          )
        ),
      };
    })
    .sort(
      (a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );

  const numericKeys = new Set<string>();
  data.time_series.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (
        key !== "date" &&
        key !== "smoothed" &&
        typeof item[key] === "number"
      ) {
        numericKeys.add(key);
      }
    });
  });

  const firstTimestamp = data.time_series[0]?.date || 0;
  const lastTimestamp =
    data.time_series[data.time_series.length - 1]?.date || 0;
  const daysDiff = Math.ceil(
    (new Date(lastTimestamp).getTime() - new Date(firstTimestamp).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const includeYear = daysDiff > 365;

  return (
    <div className="space-y-6">
      <ManualOutliersAudit
        applied={data.manual_outliers_applied}
        skipped={data.manual_outliers_skipped}
      />
      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Mean Consumption
          </h4>
          <p className="text-2xl font-bold text-[#0079A7] dark:text-[#AEDBE9]">
            {data.statistics.mean.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Data Points
          </h4>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
            {data.statistics.count}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Peak Consumption
          </h4>
          <p className="text-2xl font-bold text-[#ba0c2f] dark:text-red-400">
            {data.statistics.max.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Min Consumption
          </h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.statistics.min.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Data Quality Metrics */}
      {(data.count || data.zero_counts || data.missing_counts) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Data Quality Metrics
          </h3>
          <div className="space-y-3">
            {data.count && (
              <div className="flex items-start">
                <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                  Outlier Detection:
                </span>
                <p className="text-gray-600 dark:text-gray-400">{data.count}</p>
              </div>
            )}
            {data.zero_counts && (
              <div className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[200px]">
                  Zero Values:
                </span>
                {/* <p className="text-gray-600">{data.zero_counts}</p> */}
              </div>
            )}
            {/* {data.missing_counts && (
              <div className="flex items-start">
                <span className="font-medium text-gray-700 min-w-[200px]">
                  Missing Values:
                </span>
                <p className="text-gray-600">{totalMissing}</p>
                {data?.missing_counts &&
                  data?.missing_counts?.map((missing) => (
                    <div key={missing.meter_name}>
                      <p>{missing.meter_name}</p>
                      <p>{missing.number_of_missing}</p>
                      <p>
                        {missing.missing_indices.map((index) =>
                          new Date(index).toLocaleString()
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            )} */}
          </div>
        </div>
      )}

      {submitParams?.assessment && data.assessment && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Assessment Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Test Hours
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {data.assessment.test_hours}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                MSE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {data.assessment.mse.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                RMSE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {data.assessment.rmse.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                MAE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {data.assessment.mae.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                MAPE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {data.assessment.mape == null
                  ? "N/A"
                  : `${(data.assessment.mape * 100).toFixed(2)}%`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Points
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {data.assessment.n_points}
              </p>
            </div>
          </div>
        </div>
      )}

      {submitParams?.assessment && data.assessment_plot_png_base64 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Assessment Plot
          </h3>
          <img
            src={`data:image/png;base64,${data.assessment_plot_png_base64}`}
            alt="Assessment plot"
            className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}

      {submitParams?.assessment && assessmentComparisonData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Assessment Test Window: Actual vs Predicted
          </h3>
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" aspect={2}>
              <LineChart data={assessmentComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  width={80}
                  label={{
                    value: "Energy Consumption (kWh)",
                    angle: -90,
                    position: "insideBottomLeft",
                    offset: 10,
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={false}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#0079A7"
                  strokeWidth={2}
                  dot={false}
                  name="Predicted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
          Time Series Plot - {data.meter}
        </h3>
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" aspect={2}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                label={{
                  value: includeYear
                    ? "Date (Month Day, Year)"
                    : "Date (Month Day)",
                  angle: -0,
                  position: "insideBottom",
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                width={80}
                label={{
                  value: "Energy Consumption (kWh)",
                  angle: -90,
                  position: "insideBottomLeft",
                  offset: 10,
                }}
                domain={["dataMin - 0.5", "dataMax + 0.5"]}
              />
              <Brush
                dataKey="date"
                height={30}
                stroke="#8884d8"
                travellerWidth={10}
                alwaysShowText={true}
              />

              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}`,
                  name === "smoothed" ? "Smoothed" : name,
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="smoothed"
                stroke="#0079A7"
                strokeWidth={2}
                dot={false}
                name="Smoothed"
              />
              {Array.from(numericKeys).map((key, index) => {
                const colors = ["#ba0c2f", "#10b981"];
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={1.5}
                    dot={false}
                    name={key}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Outliers Table */}
      {outliers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Detected Outliers ({outliers.length})
          </h3>
          <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value (kWh)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deviation from Mean
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {outliers.map((outlier, index) => {
                  const deviation = outlier.value - data.statistics.mean;
                  const deviationPercent = (
                    (deviation / data.statistics.mean) *
                    100
                  ).toFixed(1);
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(outlier.datetime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-[#ba0c2f] dark:text-red-400">
                        {outlier.value.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <span
                          className={
                            deviation > 0 ? "text-red-600 dark:text-red-400" : "text-[#0079A7] dark:text-[#AEDBE9]"
                          }
                        >
                          {deviation > 0 ? "+" : ""}
                          {deviation.toFixed(2)} ({deviationPercent}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Holiday */}
      {data.holiday && data.holiday.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Holiday
          </h3>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Holiday
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.holiday.map((h) => (
                <tr key={h.name + h.start} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {h.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {h.start}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {h.end}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Date Range Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
          Date Range Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Requested Start:</span>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(data.date_range.start).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Requested End:</span>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(data.date_range.end).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Actual Start:</span>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(data.date_range.actual_start).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Actual End:</span>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(data.date_range.actual_end).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
          Statistical Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Standard Deviation:
            </span>
            <p className="text-gray-600 dark:text-gray-400">{data.statistics.std.toFixed(2)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Median (Q50):</span>
            <p className="text-gray-600 dark:text-gray-400">{data.statistics.q50.toFixed(2)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Meter:</span>
            <p className="text-gray-600 dark:text-gray-400">{data.meter}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
