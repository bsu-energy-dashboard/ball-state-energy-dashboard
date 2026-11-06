import { useState } from "react";
import type { BaseRequest } from "../types/api";
import { CAMPUS_YEARS, campusWeekBounds, campusWeekRequest } from "../utils/campusWeek";
export default function CampusWeekForm({ onSubmit, isLoading, initialValues }: { onSubmit: (request: BaseRequest) => void; isLoading: boolean; initialValues?: BaseRequest | null }) {
  const [year, setYear] = useState(initialValues?.saved_year ?? 2025);
  const [start, setStart] = useState(initialValues?.saved_year ? initialValues.start_date.slice(0,10) : "2025-07-19");
  const [error, setError] = useState("");
  const bounds = campusWeekBounds(year);
  let request: BaseRequest | undefined;
  try { request = campusWeekRequest(year, start); } catch { /* Native input and submit validation explain invalid ranges. */ }
  return <form className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" onSubmit={event => {
    event.preventDefault(); try { onSubmit(campusWeekRequest(year,start)); setError(""); } catch (err) { setError((err as Error).message); }
  }}>
    <h2 className="text-xl font-semibold">Choose a week on campus</h2>
    {/* <p className="text-sm text-gray-600 dark:text-gray-300">View Amira’s saved results for seven days. No cleaning or model fitting runs when you generate this view.</p> */}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Saved year<select value={year} onChange={event => { const next = Number(event.target.value); setYear(next); setStart(campusWeekBounds(next).min); setError(""); }} className="mt-2 block w-full rounded-lg border p-3 dark:bg-gray-700">
        {CAMPUS_YEARS.map(value => <option key={value} value={value}>{value} — July {value} to July {value+1}</option>)}
      </select></label>
      <label className="text-sm font-medium">Week starts<input required type="date" min={bounds.min} max={bounds.max} value={start} onChange={event => setStart(event.target.value)} className="mt-2 block w-full rounded-lg border p-3 dark:bg-gray-700" /></label>
    </div>
    <p className="text-sm text-gray-500">Available week starts: {bounds.min} to {bounds.max}. {year <= 2023 && "The saved file does not contain a full July 19, so the first complete week starts July 20."}</p>
    {request && <p className="text-sm">Showing {start} through {request.end_date.slice(0,10)}, including all 24 hours of each day.</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <button type="submit" disabled={isLoading} className="rounded-lg bg-[#ba0c2f] px-5 py-3 font-semibold text-white disabled:opacity-50">{isLoading ? "Loading saved week…" : "Generate"}</button>
  </form>;
}
