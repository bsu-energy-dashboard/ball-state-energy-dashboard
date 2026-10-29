import {
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryLegend,
} from "victory";
import { VictoryBoxPlot } from "victory-box-plot";
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

  const seasonOrder = [
    "EarlyWinter",
    "LateWinter",
    "EarlySpring",
    "LateSpring",
    "Summer",
    "EarlyFall",
    "LateFall",
  ];

  // Transform data for Victory BoxPlot with numeric x values
  // Use season index + offset for session status to group boxes side-by-side
  const chartData = data.boxplot_data
    .map((item) => {
      const seasonIndex = seasonOrder.indexOf(item.season);
      // Use season index + offset for session status (0.25 for In Session, 0.75 for Not in Session)
      const xOffset = item.session_status === "In Session" ? 0.25 : 0.75;
      return {
        x: seasonIndex + xOffset, // 1.25, 1.75, 2.25, 2.75, etc.
        min: item.min,
        q1: item.q25,
        median: item.q50,
        q3: item.q75,
        max: item.max,
        mean: item.mean,
        std: item.std,
        count: item.count,
        season: item.season,
        session_status: item.session_status,
      };
    })
    .sort((a, b) => {
      const seasonDiff =
        seasonOrder.indexOf(a.season) - seasonOrder.indexOf(b.season);
      if (seasonDiff !== 0) return seasonDiff;
      return a.session_status === "In Session" ? -1 : 1;
    });

  const inSession = chartData.filter((d) => d.session_status === "In Session");
  const notInSession = chartData.filter(
    (d) => d.session_status === "Not in Session"
  );

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">Compare seasons and times when classes are in session. In the box charts, each box contains the middle half of readings; the line inside marks the middle reading.</p>
      <ManualOutliersAudit
        applied={data.manual_outliers_applied}
        skipped={data.manual_outliers_skipped}
      />
      {data.plot_png_base64 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-[#0079A7] mb-4">
            Energy use across the year — {data.meter}
          </h3>
          <img
            src={`data:image/png;base64,${data.plot_png_base64}`}
            alt={`Seasonal analysis plot for ${data.meter}`}
            className="w-full h-auto rounded-lg border border-gray-200"
          />
        </div>
      )}

     {!data.plot_png_base64 && (
       <div className="bg-white rounded-lg shadow-md p-6">
       <h3 className="text-xl font-semibold text-[#0079A7] mb-4">
         Seasonal comparison — {data.meter}
       </h3>
       <div className="w-full overflow-x-auto">
         <VictoryChart
           theme={VictoryTheme.material}
           domainPadding={{ x: 40 }}
           height={500}
           width={1000}
           padding={{ top: 80, bottom: 80, left: 90, right: 60 }}
         >
           <VictoryLegend
             x={200}
             y={10}
             orientation="horizontal"
             gutter={20}
             style={{ border: { stroke: "none" }, labels: { fontSize: 12 } }}
             data={[
               { name: "In Session", symbol: { fill: "#10b981" } },
               { name: "Not in Session", symbol: { fill: "#ba0c2f" } },
             ]}
           />

           <VictoryAxis
             dependentAxis
             label="Energy Consumption (kWh)"
             style={{
               axisLabel: { padding: 40, fontSize: 14 },
               tickLabels: { fontSize: 12 },
             }}
           />

           <VictoryAxis
             tickValues={seasonOrder.map((_, i) => i + 1)}
             tickFormat={seasonOrder}
             label="Season"
             style={{
               axisLabel: { padding: 50, fontSize: 14 },
               tickLabels: { fontSize: 11 },
             }}
           />

           {/* In Session Boxplots */}
           <VictoryBoxPlot
             data={inSession}
             x="x"
             min="min"
             q1="q1"
             median="median"
             q3="q3"
             max="max"
             boxWidth={18}
             whiskerWidth={8}
             style={{
               min: { stroke: "#10b981", strokeWidth: 1.5 },
               max: { stroke: "#10b981", strokeWidth: 1.5 },
               q1: {
                 fill: "#10b981",
                 fillOpacity: 0.4,
                 stroke: "#047857",
                 strokeWidth: 1,
               },
               q3: {
                 fill: "#10b981",
                 fillOpacity: 0.4,
                 stroke: "#047857",
                 strokeWidth: 1,
               },
               median: { stroke: "#047857", strokeWidth: 2 },
               minLabels: { fill: "none" },
               maxLabels: { fill: "none" },
             }}
           />

           {/* Not in Session Boxplots */}
           <VictoryBoxPlot
             data={notInSession}
             x="x"
             min="min"
             q1="q1"
             median="median"
             q3="q3"
             max="max"
             boxWidth={18}
             whiskerWidth={8}
             style={{
               min: { stroke: "#ba0c2f", strokeWidth: 1.5 },
               max: { stroke: "#ba0c2f", strokeWidth: 1.5 },
               q1: {
                 fill: "#ba0c2f",
                 fillOpacity: 0.4,
                 stroke: "#7f1d1d",
                 strokeWidth: 1,
               },
               q3: {
                 fill: "#ba0c2f",
                 fillOpacity: 0.4,
                 stroke: "#7f1d1d",
                 strokeWidth: 1,
               },
               median: { stroke: "#7f1d1d", strokeWidth: 2 },
               minLabels: { fill: "none" },
               maxLabels: { fill: "none" },
             }}
           />
         </VictoryChart>
       </div>
     </div>
     )}

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
                  {item.mean?.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.q50?.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.std?.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.min?.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.max?.toFixed(2)}
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
