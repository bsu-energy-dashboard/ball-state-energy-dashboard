import { chartTheme, chartColors, chartAxis } from "../constants/chartTheme";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import { useDarkMode } from "../hooks/use-darkmode";
export interface BoxReading { season?: string; temp_bin?: string; session_status: string; min: number; q25: number; q50: number; q75: number; max: number; }
export default function InteractiveBoxPlot({ readings }: { readings: BoxReading[] }) {
  const { darkMode } = useDarkMode();
  const valid = readings.filter((row) => [row.min,row.q25,row.q50,row.q75,row.max].every((v) => typeof v === "number" && Number.isFinite(v)));
  if (!valid.length) return <p>No complete readings are available for this chart.</p>;
  const categories = [...new Set(valid.map(row => row.season ?? row.temp_bin ?? "Unknown"))].sort((a,b) => {
    const seasons = ["Winter", "Spring", "Summer", "Fall", "Autumn"];
    if (readings.some(row => row.season)) return seasons.indexOf(a) - seasons.indexOf(b);
    return Number(a.match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0) - Number(b.match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0);
  });
  const groups = [...new Set(valid.map((row) => row.session_status))];
  return <><p className="mb-2 text-xs text-gray-500">Hover to inspect the middle reading and spread. Whiskers show the minimum and maximum supplied by the API. Drag to zoom; double-click to reset.</p>
    <Plot data={groups.map((group) => {
      const rows = valid.filter((row) => row.session_status === group);
      const color = chartColors(darkMode)[group === "In Session" ? 0 : 1];
      return { type: "box", name: group, marker: { color }, line: { color, width: 2 }, fillcolor: group === "In Session" ? "rgba(186,12,47,0.22)" : "rgba(0,121,167,0.22)", x: rows.map((row) => row.season ?? row.temp_bin),
        q1: rows.map(r=>r.q25), median: rows.map(r=>r.q50), q3: rows.map(r=>r.q75), lowerfence: rows.map(r=>r.min), upperfence: rows.map(r=>r.max), boxpoints: false } as Data;
    })} layout={{ ...chartTheme(darkMode), autosize:true,height:460,boxmode:"group",margin:{l:65,r:20,t:20,b:95},
      paper_bgcolor:"transparent",plot_bgcolor:"transparent",font:{color:darkMode?"#e5e7eb":"#374151"},
      xaxis:{...chartAxis(darkMode),type:"category",categoryorder:"array",categoryarray:categories},yaxis:{...chartAxis(darkMode),title:{text:"Energy use (dataset units)"}},legend:{orientation:"h",y:-0.25}
    }} config={{responsive:true,displaylogo:false}} useResizeHandler style={{width:"100%"}} /></>;
}
