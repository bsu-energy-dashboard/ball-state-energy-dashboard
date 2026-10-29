export type DatePreset = "week" | "month" | "quarter" | "year";

export function applyDatePreset(
  preset: DatePreset,
  anchorEnd?: string,
): { startDate: string; endDate: string } {
  const end = anchorEnd ? new Date(anchorEnd) : new Date();
  const start = new Date(end);

  switch (preset) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(end.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return {
    startDate: localDateTime(start),
    endDate: localDateTime(end),
  };
}

function localDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
