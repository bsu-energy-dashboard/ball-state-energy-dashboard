import type { DatasetInfoResponse, PlotType, StoredManualOutliers } from "../types/api";

export function storageKey(datasetId: string, meter: string): string {
  return `bsu-manual-outliers:${datasetId}:${meter}`;
}

export function loadStoredZaps(
  datasetId: string,
  meter: string,
): StoredManualOutliers | null {
  if (!datasetId || !meter) return null;
  const raw = localStorage.getItem(storageKey(datasetId, meter));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredManualOutliers;
    if (parsed?.version !== 1 || !parsed.manual_outliers) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredZaps(
  datasetId: string,
  meter: string,
  entry: StoredManualOutliers,
): void {
  if (!datasetId || !meter) return;
  localStorage.setItem(storageKey(datasetId, meter), JSON.stringify(entry));
}

export function clearStoredZaps(datasetId: string, meter: string): void {
  if (!datasetId || !meter) return;
  localStorage.removeItem(storageKey(datasetId, meter));
}

/** Stable id for localStorage keys; prefers backend csv_path. */
export function datasetIdFromInfo(info: DatasetInfoResponse | undefined): string {
  if (info?.csv_path) return info.csv_path;
  const end = info?.time_range?.end ?? "";
  const count = info?.meter_count ?? info?.meters?.length ?? 0;
  return `fallback:${count}:${end}`;
}

export function mergeManualOutliersForOverage(
  mainMeter: string,
  meters: string[],
  seriesMeters: string[],
  datasetId: string,
  perMeterZaps: Record<string, string[]>,
): Record<string, string[]> {
  const relevant = new Set<string>();
  if (mainMeter) relevant.add(mainMeter);
  for (const m of meters) relevant.add(m);
  for (const m of seriesMeters) relevant.add(m);

  const merged: Record<string, string[]> = {};
  for (const meter of relevant) {
    const fromTab = perMeterZaps[meter] ?? [];
    const stored = loadStoredZaps(datasetId, meter);
    const fromStorage = stored?.manual_outliers[meter] ?? [];
    const combined = [...new Set([...fromStorage, ...fromTab])].sort();
    if (combined.length > 0) {
      merged[meter] = combined;
    }
  }
  return merged;
}

export function pruneOutliersOutsideRange(
  manualOutliers: Record<string, string[]>,
  startDate: string,
  endDate: string,
): { pruned: Record<string, string[]>; removedCount: number } {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  let removedCount = 0;
  const pruned: Record<string, string[]> = {};

  for (const [meter, timestamps] of Object.entries(manualOutliers)) {
    const kept = timestamps.filter((ts) => {
      const t = new Date(ts).getTime();
      const inRange = t >= startMs && t <= endMs;
      if (!inRange) removedCount++;
      return inRange;
    });
    if (kept.length > 0) pruned[meter] = kept;
  }

  return { pruned, removedCount };
}

export function countZaps(manualOutliers: Record<string, string[]>): number {
  return Object.values(manualOutliers).reduce((sum, arr) => sum + arr.length, 0);
}

export function formatSavedAgo(savedAt: string): string {
  const diffMs = Date.now() - new Date(savedAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function plotTypeLabel(tab: PlotType): string {
  const labels: Record<PlotType, string> = {
    "usage-history": "Energy use",
    "time-series": "Time series",
    "forecast": "Forecast",
    "seasonal-analysis": "Seasonal",
    "temperature-analysis": "Temperature",
    "eda-plots": "EDA",
    "threshold-detection": "Threshold detection",
    "rpca-analysis": "Campus RPCA",
  };
  return labels[tab] ?? tab;
}
