import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import type { PlotParams } from "react-plotly.js";
import type { BaseRequest, ForecastData, TimeSeriesResponse } from "../types/api";
import { useDarkMode } from "../hooks/use-darkmode.ts";
import data from "../../data.json";

interface ForecastPlotProps {
  submitParams?: BaseRequest | null;
  forecastData?: ForecastData[];
  timeSeriesData?: TimeSeriesResponse;
}

export default function ForecastPlot({ submitParams, forecastData, timeSeriesData }: ForecastPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useDarkMode();
  const [showBounds, setShowBounds] = useState(true);

  // Use forecastData prop if provided, otherwise fall back to static data
  const forecastDataToUse = forecastData || data?.forecast_data;
  const meterName = submitParams?.meter || timeSeriesData?.meter || data?.meter || "Unknown";
  const statistics = timeSeriesData?.statistics || data?.statistics;
  const dateRange = timeSeriesData?.date_range || data?.date_range;
  const assessment = timeSeriesData?.assessment;
  const assessmentPlotBase64 = timeSeriesData?.assessment_plot_png_base64;

  if (!forecastDataToUse || forecastDataToUse.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No forecast data available
        </p>
      </div>
    );
  }

  // Split data to match Python: historical = y not null, forecast = y null (future only)
  const historicalData = forecastDataToUse.filter((d) => d.y !== undefined && d.y !== null);
  const forecastOnlyData = forecastDataToUse.filter(
    (d) => (d.y === undefined || d.y === null) && (d.yhat !== undefined || d.trend !== undefined)
  );

  // Prepare traces - use Date objects for x-axis to work with Plotly rangeslider
  const traces: PlotParams["data"] = [];

  // 1. Historical data (all rows where y is present) – black line, no forecast over historical
  if (historicalData.length > 0) {
    traces.push({
      x: historicalData.map((d) => new Date(d.date)),
      y: historicalData.map((d) => d.y!),
      mode: "lines+markers",
      line: { color: "rgba(0, 0, 0, 0.7)", width: 1.5 },
      marker: { size: 4 },
      name: "Historical Data",
      type: "scatter",
    });
  }

  // 2. Only future forecast (where y is null): forecast line + CI + bound lines
  const forecastDates = forecastOnlyData.map((d) => new Date(d.date));
  const forecastLowerBounds = forecastOnlyData.map((d) => d.yhat_lower);
  const forecastUpperBounds = forecastOnlyData.map((d) => d.yhat_upper);
  const forecastValues = forecastOnlyData.map((d) => d.yhat ?? d.trend);

  if (forecastOnlyData.length > 0) {
    // Confidence interval (shaded area) – only over future forecast, not over historical
    traces.push({
      x: [...forecastDates, ...forecastDates.slice().reverse()],
      y: [...forecastUpperBounds, ...forecastLowerBounds.slice().reverse()],
      fill: "toself",
      fillcolor: "rgba(0, 121, 167, 0.2)",
      line: { color: "transparent", width: 0 },
      showlegend: true,
      name: "Confidence Interval",
      type: "scatter",
      hoverinfo: "skip",
    } as PlotParams["data"][0]);

    // Forecast line (blue)
    traces.push({
      x: forecastDates,
      y: forecastValues,
      mode: "lines",
      line: { color: "#0079A7", width: 2 },
      name: "Forecast",
      type: "scatter",
    });

    // Upper and lower bound lines – only over future forecast
    if (showBounds) {
      traces.push({
        x: forecastDates,
        y: forecastUpperBounds,
        mode: "lines",
        line: { color: "#0079A7", width: 1, dash: "dash" },
        name: "Upper Bound",
        type: "scatter",
      } as PlotParams["data"][0]);

      traces.push({
        x: forecastDates,
        y: forecastLowerBounds,
        mode: "lines",
        line: { color: "#0079A7", width: 1, dash: "dash" },
        name: "Lower Bound",
        type: "scatter",
      } as PlotParams["data"][0]);
    }
  }

  // Y-axis range from data min/max so the spread is visible
  const allYValues = [
    ...historicalData.map((d) => d.y!),
    ...forecastValues,
    ...forecastLowerBounds,
    ...forecastUpperBounds,
  ].filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  const dataYMin = allYValues.length ? Math.min(...allYValues) : 0;
  const dataYMax = allYValues.length ? Math.max(...allYValues) : 100;
  const padding = Math.max((dataYMax - dataYMin) * 0.05, 1);
  const yRange: [number, number] = [dataYMin - padding, dataYMax + padding];

  const layout: Partial<PlotParams["layout"]> = {
    title: { text: `Forecast - ${meterName}` },
    xaxis: {
      title: { text: "Date" },
      showgrid: true,
      gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      griddash: "dot",
      color: darkMode ? "#fff" : "#000",
      rangeselector: {
        buttons: [
          {
            step: "month",
            stepmode: "backward",
            count: 1,
            label: "1m",
          },
          {
            step: "month",
            stepmode: "backward",
            count: 3,
            label: "3m",
          },
          {
            step: "month",
            stepmode: "backward",
            count: 6,
            label: "6m",
          },
          {
            step: "year",
            stepmode: "todate",
            count: 1,
            label: "YTD",
          },
          {
            step: "year",
            stepmode: "backward",
            count: 1,
            label: "1y",
          },
          {
            step: "all",
            label: "All",
          },
        ],
        x: 0,
        xanchor: "left",
        y: 1.15,
        yanchor: "top",
        bgcolor: darkMode ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.8)",
        bordercolor: darkMode ? "#666" : "#ccc",
        borderwidth: 1,
        font: { color: darkMode ? "#fff" : "#000" },
      },
      rangeslider: {
        visible: true,
        thickness: 0.1,
        bgcolor: darkMode ? "rgba(26, 26, 26, 0.3)" : "rgba(255, 255, 255, 0.3)",
        bordercolor: darkMode ? "#666" : "#ccc",
        borderwidth: 1,
      },
    },
    yaxis: {
      title: { text: "Energy Consumption (kWh)" },
      range: yRange,
      showgrid: true,
      gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      griddash: "dot",
      color: darkMode ? "#fff" : "#000",
    },
    legend: {
      x: 1,
      xanchor: "right",
      y: 1,
      font: { color: darkMode ? "#fff" : "#000" },
    },
    paper_bgcolor: darkMode ? "#1a1a1a" : "#fff",
    plot_bgcolor: darkMode ? "#1a1a1a" : "#fff",
    autosize: true,
    hovermode: "x unified",
  };

  const config: Partial<PlotParams["config"]> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    toImageButtonOptions: {
      format: "png",
      filename: "forecast_plot",
      height: 800,
      width: 1200,
      scale: 2,
    },
  };

  return (
    <div className="space-y-6">
      {assessment && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            How close were the predictions?
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Predictions differed from recorded use by {assessment.mae.toFixed(2)} dataset units on average
            across {assessment.n_points} checked readings. Smaller differences mean closer predictions.
          </p>
          <details>
            <summary className="cursor-pointer mb-4">Technical details</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Test Hours
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {assessment.test_hours}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                MSE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {assessment.mse.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                RMSE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {assessment.rmse.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                MAE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {assessment.mae.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                MAPE
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {assessment.mape == null
                  ? "N/A"
                  : `${(assessment.mape * 100).toFixed(2)}%`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Points
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {assessment.n_points}
              </p>
            </div>
          </div>
          </details>
        </div>
      )}

      {assessmentPlotBase64 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Assessment Plot
          </h3>
          <img
            src={`data:image/png;base64,${assessmentPlotBase64}`}
            alt="Assessment plot"
            className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}

      {/* Statistics Summary */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Mean Consumption
            </h4>
            <p className="text-2xl font-bold text-[#0079A7] dark:text-[#AEDBE9]">
              {statistics.mean.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Data Points
            </h4>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              {statistics.count}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Peak Consumption
            </h4>
            <p className="text-2xl font-bold text-[#ba0c2f] dark:text-red-400">
              {statistics.max.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Min Consumption
            </h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statistics.min.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Chart Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
        <div className="flex items-center gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showBounds}
              onChange={(e) => setShowBounds(e.target.checked)}
              className="h-4 w-4 text-[#0079A7] focus:ring-[#0079A7] border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Confidence Bounds</span>
          </label>
        </div>
      </div>

      {/* Main Chart - Historical + Forecast */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
        <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
          Historical Data + Forecast - {meterName}
        </h3>
        <div ref={plotRef} className="w-full" style={{ height: "600px" }}>
          <Plot
            data={traces}
            layout={layout}
            config={config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler={true}
          />
        </div>
      </div>

      {/* Forecast Only Chart */}
      {forecastOnlyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#ba0c2f] dark:text-red-400 mb-4">
            Forecast Only - {meterName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This chart displays only the forecasted future values (no historical data).
          </p>
          
          {/* Prepare forecast-only traces */}
          {(() => {
            const forecastOnlyTraces: PlotParams["data"] = [];
            const forecastDates = forecastOnlyData.map((d) => new Date(d.date));
            const forecastLowerBounds = forecastOnlyData.map((d) => d.yhat_lower);
            const forecastUpperBounds = forecastOnlyData.map((d) => d.yhat_upper);
            const forecastYhat = forecastOnlyData.map((d) => d.yhat || d.trend);
            const forecastTrend = forecastOnlyData.map((d) => d.trend);

            // Confidence interval for forecast only
            forecastOnlyTraces.push({
              x: [...forecastDates, ...forecastDates.slice().reverse()],
              y: [...forecastUpperBounds, ...forecastLowerBounds.slice().reverse()],
              fill: "toself",
              fillcolor: "rgba(186, 12, 47, 0.15)",
              line: { color: "transparent", width: 0 },
              showlegend: true,
              name: "Confidence Interval",
              type: "scatter",
              hoverinfo: "skip",
            } as PlotParams["data"][0]);

            // Forecast line (yhat)
            forecastOnlyTraces.push({
              x: forecastDates,
              y: forecastYhat,
              mode: "lines",
              line: { color: "#ba0c2f", width: 2.5 },
              name: "Forecast (yhat)",
              type: "scatter",
            });

            // Trend line
            forecastOnlyTraces.push({
              x: forecastDates,
              y: forecastTrend,
              mode: "lines",
              line: { color: "#0079A7", width: 2, dash: "dot" },
              name: "Trend",
              type: "scatter",
            });

            // Upper and lower bound lines if showBounds is enabled
            if (showBounds) {
              forecastOnlyTraces.push({
                x: forecastDates,
                y: forecastUpperBounds,
                mode: "lines",
                line: { color: "#ba0c2f", width: 1, dash: "dash" },
                name: "Upper Bound",
                type: "scatter",
              } as PlotParams["data"][0]);

              forecastOnlyTraces.push({
                x: forecastDates,
                y: forecastLowerBounds,
                mode: "lines",
                line: { color: "#ba0c2f", width: 1, dash: "dash" },
                name: "Lower Bound",
                type: "scatter",
              } as PlotParams["data"][0]);
            }

            const forecastOnlyLayout: Partial<PlotParams["layout"]> = {
              title: { text: `Forecast Only - ${meterName}` },
              xaxis: {
                title: { text: "Date" },
                showgrid: true,
                gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                griddash: "dot",
                color: darkMode ? "#fff" : "#000",
                rangeselector: {
                  buttons: [
                    {
                      step: "month",
                      stepmode: "backward",
                      count: 1,
                      label: "1m",
                    },
                    {
                      step: "month",
                      stepmode: "backward",
                      count: 3,
                      label: "3m",
                    },
                    {
                      step: "month",
                      stepmode: "backward",
                      count: 6,
                      label: "6m",
                    },
                    {
                      step: "year",
                      stepmode: "backward",
                      count: 1,
                      label: "1y",
                    },
                    {
                      step: "all",
                      label: "All",
                    },
                  ],
                  x: 0,
                  xanchor: "left",
                  y: 1.15,
                  yanchor: "top",
                  bgcolor: darkMode ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.8)",
                  bordercolor: darkMode ? "#666" : "#ccc",
                  borderwidth: 1,
                  font: { color: darkMode ? "#fff" : "#000" },
                },
                rangeslider: {
                  visible: true,
                  thickness: 0.1,
                  bgcolor: darkMode ? "rgba(26, 26, 26, 0.3)" : "rgba(255, 255, 255, 0.3)",
                  bordercolor: darkMode ? "#666" : "#ccc",
                  borderwidth: 1,
                },
              },
              yaxis: {
                title: { text: "Energy Consumption (kWh)" },
                range: yRange,
                showgrid: true,
                gridcolor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                griddash: "dot",
                color: darkMode ? "#fff" : "#000",
              },
              legend: {
                x: 1,
                xanchor: "right",
                y: 1,
                font: { color: darkMode ? "#fff" : "#000" },
              },
              paper_bgcolor: darkMode ? "#1a1a1a" : "#fff",
              plot_bgcolor: darkMode ? "#1a1a1a" : "#fff",
              autosize: true,
              hovermode: "x unified",
            };

            return (
              <div className="w-full" style={{ height: "600px" }}>
                <Plot
                  data={forecastOnlyTraces}
                  layout={forecastOnlyLayout}
                  config={config}
                  style={{ width: "100%", height: "100%" }}
                  useResizeHandler={true}
                />
              </div>
            );
          })()}
          
          {/* Forecast Statistics */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Forecast Statistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Forecast Points:</span>
                <p className="text-gray-600 dark:text-gray-400">{forecastOnlyData.length}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Forecast Start:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {forecastOnlyData.length > 0
                    ? new Date(forecastOnlyData[0].date).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Forecast End:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {forecastOnlyData.length > 0
                    ? new Date(forecastOnlyData[forecastOnlyData.length - 1].date).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
            {forecastOnlyData.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Mean Forecast:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {(
                      forecastOnlyData.reduce((sum, d) => sum + (d.yhat || d.trend), 0) /
                      forecastOnlyData.length
                    ).toFixed(2)}{" "}
                    kWh
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Max Forecast:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {Math.max(
                      ...forecastOnlyData.map((d) => d.yhat_upper || d.yhat || d.trend)
                    ).toFixed(2)}{" "}
                    kWh
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Min Forecast:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {Math.min(
                      ...forecastOnlyData.map((d) => d.yhat_lower || d.yhat || d.trend)
                    ).toFixed(2)}{" "}
                    kWh
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Range Info */}
      {dateRange && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Date Range Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Requested Start:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(dateRange.start).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Requested End:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(dateRange.end).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Actual Start:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(dateRange.actual_start).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Actual End:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(dateRange.actual_end).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Details */}
      {statistics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <h3 className="text-xl font-semibold text-[#0079A7] dark:text-[#AEDBE9] mb-4">
            Statistical Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Standard Deviation:
              </span>
              <p className="text-gray-600 dark:text-gray-400">{statistics.std.toFixed(2)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Median (Q50):</span>
              <p className="text-gray-600 dark:text-gray-400">{statistics.q50.toFixed(2)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Meter:</span>
              <p className="text-gray-600 dark:text-gray-400">{meterName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
