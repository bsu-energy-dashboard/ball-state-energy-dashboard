import type { OutlierPreviewRequest, OutlierPreviewSeriesPoint } from "../types/api";

export function nearestPoint(
  series: OutlierPreviewSeriesPoint[],
  clickXMs: number,
): OutlierPreviewSeriesPoint | null {
  if (!series.length) return null;
  return series.reduce((best, p) => {
    const t = new Date(p.datetime).getTime();
    const bestT = new Date(best.datetime).getTime();
    return Math.abs(t - clickXMs) < Math.abs(bestT - clickXMs) ? p : best;
  });
}

export function addZap(
  manualOutliers: Record<string, string[]>,
  meter: string,
  datetime: string,
): Record<string, string[]> {
  const existing = manualOutliers[meter] ?? [];
  if (existing.includes(datetime)) return manualOutliers;
  return { ...manualOutliers, [meter]: [...existing, datetime].sort() };
}

export function removeZap(
  manualOutliers: Record<string, string[]>,
  meter: string,
  datetime: string,
): Record<string, string[]> {
  const existing = manualOutliers[meter];
  if (!existing?.length) return manualOutliers;
  const next = existing.filter((ts) => ts !== datetime);
  if (next.length === 0) {
    const rest = { ...manualOutliers };
    delete rest[meter];
    return rest;
  }
  return { ...manualOutliers, [meter]: next };
}

export function zapsForMeter(
  manualOutliers: Record<string, string[]>,
  meter: string,
): string[] {
  return manualOutliers[meter] ?? [];
}

export function valueAtDatetime(
  series: OutlierPreviewSeriesPoint[],
  datetime: string,
): number | undefined {
  return series.find((p) => p.datetime === datetime)?.value;
}

/** Preview summaries describe retained readings, never the excluded spikes. */
export function retainedReadingStats(series: OutlierPreviewSeriesPoint[], zaps: string[]) {
  const excluded = new Set(zaps.map((timestamp) => new Date(timestamp).getTime()));
  const values = series
    .filter((point) => !excluded.has(new Date(point.datetime).getTime()))
    .map((point) => point.value)
    .filter((value) => typeof value === "number" && Number.isFinite(value))
    .sort((a, b) => a - b);
  const position = (values.length - 1) * 0.99;
  const lower = Math.floor(position);
  return {
    count: values.length,
    max: values.length ? values[values.length - 1] : null,
    p99: values.length ? values[lower] + (values[Math.ceil(position)] - values[lower]) * (position - lower) : null,
  };
}

/** Keep the chart only when its underlying dataset, dates and meter still match. */
export function samePreviewSource(previousKey: readonly unknown[], nextKey: readonly unknown[]) {
  return JSON.stringify(previousKey.slice(0, 5)) === JSON.stringify(nextKey.slice(0, 5)) &&
    JSON.stringify(previousKey.slice(7, -1)) === JSON.stringify(nextKey.slice(7, -1));
}

/** Automatic-only baseline: never include manual corrections in the selectable trace. */
export function zapBaselineRequest(request: OutlierPreviewRequest | null): OutlierPreviewRequest | null {
  if (!request) return null;
  return { ...request, manual_outliers: undefined, manual_outlier_replacement: undefined,
    include_cleaned_preview: !!request.cleaning_method };
}
