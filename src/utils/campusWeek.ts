import type { BaseRequest } from "../types/api";
export const CAMPUS_YEARS = [2022, 2023, 2024, 2025] as const;
export function campusWeekBounds(year: number) {
  return { min: `${year}-07-${year <= 2023 ? "20" : "19"}`, max: `${year + 1}-07-13` };
}
export function campusWeekRequest(year: number, start: string): BaseRequest {
  if (!CAMPUS_YEARS.some(value => value === year)) throw new Error("Choose an available saved year.");
  const bounds = campusWeekBounds(year);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || start < bounds.min || start > bounds.max) throw new Error("Choose a start date with seven complete days in the selected saved year.");
  const end = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(end.getTime()) || end.toISOString().slice(0,10) !== start) throw new Error("Choose a valid start date.");
  end.setUTCDate(end.getUTCDate() + 6);
  return { saved_year: year, start_date: `${start}T00:00:00`, end_date: `${end.toISOString().slice(0,10)}T23:00:00`, meter: "" };
}
