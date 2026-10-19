import {
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryLegend,
} from "victory";
import { VictoryBoxPlot } from "victory-box-plot";
import type { BaseRequest } from "../types/api";
import { useTemperatureAnalysis } from "../services/api";
import { AxiosError } from "axios";
import ManualOutliersAudit from "./ManualOutliersAudit";

interface TemperatureAnalysisPlotProps {
  submitParams?: BaseRequest | null;
}

export default function TemperatureAnalysisPlot({
  submitParams,
}: TemperatureAnalysisPlotProps) {
  const { data, isLoading, error } = useTemperatureAnalysis(
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
          Please submit the form to view temperature analysis data
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
            Loading temperature analysis data...
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
              : "An error occurred loading temperature analysis data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Extract unique temp_bin values and sort them
  // The temp_bin format is like "[-10.00, 20.00]" or "[20.00, 40.00]"
  // We'll extract them from the data and sort by the lower bound
  const tempBinOrder = Array.from(
    new Set(data.boxplot_data.map((item) => item.temp_bin))
  ).sort((a, b) => {
    // Extract the lower bound from the temp_bin string (e.g., "[-10.00, 20.00]" -> -10.00)
    const getLowerBound = (bin: string) => {
      const match = bin.match(/(?:\[|\()(-?\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    };
    return getLowerBound(a) - getLowerBound(b);
  });

  const chartData = data.boxplot_data
    .map((item) => {
      const tempBinIndex = tempBinOrder.indexOf(item.temp_bin);
      // Use temp bin index + offset for session status (0.25 for In Session, 0.75 for Not in Session)
      const xOffset = item.session_status === "In Session" ? 0.25 : 0.75;
      return {
        x: tempBinIndex + xOffset, // 0.25, 0.75, 1.25, 1.75, etc.
        min: item.min,
        q1: item.q25,
        median: item.q50,
        q3: item.q75,
        max: item.max,
        mean: item.mean,
        std: item.std,
        count: item.count,
        temp_bin: item.temp_bin,
        session_status: item.session_status,
      };
    })
    .sort((a, b) => {
      const tempBinDiff =
        tempBinOrder.indexOf(a.temp_bin) - tempBinOrder.indexOf(b.temp_bin);
      if (tempBinDiff !== 0) return tempBinDiff;
      return a.session_status === "In Session" ? -1 : 1;
    });

  const inSession = chartData.filter((d) => d.session_status === "In Session");
  const notInSession = chartData.filter(
    (d) => d.session_status === "Not in Session"
  );

  return (
    <div className="space-y-6">
      <ManualOutliersAudit
        applied={data.manual_outliers_applied}
        skipped={data.manual_outliers_skipped}
      />
      {data.plot_png_base64 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-[#0079A7] mb-4">
            Temperature Analysis Plot - {data.meter}
          </h3>
          <img
            src={`data:image/png;base64,${data.plot_png_base64}`}
            alt={`Temperature analysis plot for ${data.meter}`}
            className="w-full h-auto rounded-lg border border-gray-200"
          />
        </div>
      )}

     {!data.plot_png_base64 && (
       <div className="bg-white rounded-lg shadow-md p-6">
       <h3 className="text-xl font-semibold text-[#0079A7] mb-4">
         Temperature Analysis - {data.meter}
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
             tickValues={tempBinOrder.map((_, i) => i + 0.5)}
             tickFormat={tempBinOrder}
             label="Temperature Range (°F)"
             style={{
               axisLabel: { padding: 50, fontSize: 14 },
               tickLabels: { fontSize: 10 },
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
      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Temperature Range
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mean
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
                  {item.temp_bin}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.session_status}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.mean.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.q50.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.std.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.min.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.max.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
