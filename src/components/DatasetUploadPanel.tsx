import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDatasetInfo, useDatasetUpload } from "../services/api";
import type { DatasetUploadPhase } from "../types/api";
import {
  extractApiErrorMessage,
  MULTIPART_UPLOAD_MAX_BYTES,
  shouldUseGcsUpload,
  uploadPhaseLabel,
} from "../utils/datasetUpload";

const MAX_CSV_BYTES = 100 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return "—";
  const s = new Date(start).toLocaleDateString();
  const e = new Date(end).toLocaleDateString();
  return `${s} — ${e}`;
}

export default function DatasetUploadPanel() {
  const [expanded, setExpanded] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [confirmPartial, setConfirmPartial] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const { data: datasetInfo, isLoading: infoLoading, isFetched } =
    useDatasetInfo();
  const hasDataset = (datasetInfo?.meters.length ?? 0) > 0;
  const [uploadPhase, setUploadPhase] = useState<DatasetUploadPhase | null>(
    null,
  );
  const upload = useDatasetUpload();

  const hasAnyFile = Boolean(csvFile || jsonFile);
  const isPartialUpload = Boolean(
    (csvFile && !jsonFile) || (!csvFile && jsonFile),
  );
  const usesGcs = hasAnyFile
    ? shouldUseGcsUpload({ energyCsv: csvFile, holidayJson: jsonFile })
    : false;

  const handleCsvChange = (file: File | null) => {
    if (!file) {
      setCsvFile(null);
      setConfirmPartial(false);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Energy file must be a .csv");
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      toast.error(`CSV must be under ${formatBytes(MAX_CSV_BYTES)}`);
      return;
    }
    setCsvFile(file);
    setConfirmPartial(false);
  };

  const handleJsonChange = (file: File | null) => {
    if (!file) {
      setJsonFile(null);
      setConfirmPartial(false);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Holiday file must be a .json");
      return;
    }
    setJsonFile(file);
    setConfirmPartial(false);
  };

  const handleUpload = async () => {
    if (!csvFile && !jsonFile) {
      toast.error("Select an energy CSV and/or holiday JSON file");
      return;
    }
    if (isPartialUpload && !confirmPartial) {
      toast.error(
        "Confirm that you do not need to update the other file before uploading",
      );
      return;
    }
    setUploadPhase(null);
    try {
      const result = await upload.mutateAsync({
        energyCsv: csvFile,
        holidayJson: jsonFile,
        onPhase: setUploadPhase,
      });
      toast.success(result.message ?? "Dataset uploaded successfully");
      setCsvFile(null);
      setJsonFile(null);
      setConfirmPartial(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    } catch (err) {
      toast.error(extractApiErrorMessage(err));
    } finally {
      setUploadPhase(null);
    }
  };

  const canUpload =
    hasAnyFile && !upload.isPending && (!isPartialUpload || confirmPartial);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 transition-colors border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-[#ba0c2f] rounded" />
          <div>
            <h2 className="text-lg font-semibold text-[#ba0c2f] dark:text-[#AEDBE9]">
              Dataset
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {infoLoading
                ? "Loading dataset info…"
                : hasDataset
                  ? `${datasetInfo!.meters.length} meters · ${formatDateRange(
                      datasetInfo!.time_range?.start,
                      datasetInfo!.time_range?.end,
                    )}`
                  : isFetched
                    ? "No dataset loaded — upload CSV and/or JSON"
                    : "Upload energy CSV and/or holiday JSON"}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-gray-200 dark:border-gray-700 pt-4">
          {!hasDataset && isFetched && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-200">
              Default CSV not found. Upload <strong>All_AptMeters.csv</strong> and{" "}
              <strong>HOLIDAYDICT.json</strong> to enable meters and analysis.
              A first-time load typically needs both files.
            </div>
          )}

          {hasDataset && datasetInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">Meters</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {datasetInfo.meters.length}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600 sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Time range</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {formatDateRange(
                    datasetInfo.time_range?.start,
                    datasetInfo.time_range?.end,
                  )}
                </p>
              </div>
              {(datasetInfo.holiday_keys?.length ?? 0) > 0 && (
                <div className="sm:col-span-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Holidays ({datasetInfo.holiday_keys!.length})
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 break-words">
                    {datasetInfo.holiday_keys!.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload replaces the active dataset used by all analytics endpoints.
            You can upload the energy CSV, holiday JSON, or both. Files under{" "}
            {formatBytes(MULTIPART_UPLOAD_MAX_BYTES)} total use direct upload;
            larger files upload to cloud storage first (recommended on Cloud Run).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="energyCsv"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Energy CSV
                <span className="text-xs font-normal text-gray-500 ml-2">
                  e.g. All_AptMeters.csv
                </span>
              </label>
              <input
                ref={csvInputRef}
                id="energyCsv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) =>
                  handleCsvChange(e.target.files?.[0] ?? null)
                }
                className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#ba0c2f] file:text-white hover:file:bg-[#005F80]"
              />
              {csvFile && (
                <p className="text-xs text-gray-500 mt-1">
                  {csvFile.name} ({formatBytes(csvFile.size)})
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                First column must be <code>Date / Time</code>; remaining columns
                are meter names. Max {formatBytes(MAX_CSV_BYTES)}.
              </p>
            </div>

            <div>
              <label
                htmlFor="holidayJson"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Holiday JSON
                <span className="text-xs font-normal text-gray-500 ml-2">
                  e.g. HOLIDAYDICT.json
                </span>
              </label>
              <input
                ref={jsonInputRef}
                id="holidayJson"
                type="file"
                accept=".json,application/json"
                onChange={(e) =>
                  handleJsonChange(e.target.files?.[0] ?? null)
                }
                className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#ba0c2f] file:text-white hover:file:bg-[#9a0a26]"
              />
              {jsonFile && (
                <p className="text-xs text-gray-500 mt-1">{jsonFile.name}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Top-level object; each holiday has 6 dates (3 start/end pairs).
                <code className="ml-1">Summer Break</code> must be the last key.
              </p>
            </div>
          </div>

          {hasAnyFile && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Upload preview
                </h3>
                <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mt-0.5">
                  Review what this upload will do before continuing.
                </p>
              </div>

              <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1.5 list-disc pl-5">
                {csvFile ? (
                  <li>
                    Replace the <strong>energy CSV</strong> with{" "}
                    <code className="text-xs">{csvFile.name}</code> (
                    {formatBytes(csvFile.size)})
                  </li>
                ) : (
                  <li>
                    Keep the current <strong>energy CSV</strong> unchanged
                    {hasDataset ? "" : " (none loaded yet)"}
                  </li>
                )}
                {jsonFile ? (
                  <li>
                    Replace the <strong>holiday JSON</strong> with{" "}
                    <code className="text-xs">{jsonFile.name}</code> (
                    {formatBytes(jsonFile.size)})
                  </li>
                ) : (
                  <li>
                    Keep the current <strong>holiday JSON</strong> unchanged
                    {hasDataset ? "" : " (none loaded yet)"}
                  </li>
                )}
                <li>
                  Upload method:{" "}
                  <strong>
                    {usesGcs
                      ? "GCS signed URLs → confirm"
                      : "Multipart POST /dataset/upload"}
                  </strong>
                </li>
                {hasDataset ? (
                  <li>
                    Active analytics dataset will be updated after a successful
                    upload.
                  </li>
                ) : (
                  <li>
                    This will become the active dataset for meters and analysis.
                    {!csvFile || !jsonFile
                      ? " A first-time load usually needs both files."
                      : ""}
                  </li>
                )}
              </ul>

              {isPartialUpload && (
                <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 p-3 space-y-2">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    {csvFile && !jsonFile
                      ? "You're only uploading the energy CSV. Do you also need to update the holiday JSON?"
                      : "You're only uploading the holiday JSON. Do you also need to update the energy CSV?"}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {csvFile && !jsonFile
                      ? "If holiday dates changed, add HOLIDAYDICT.json above. Otherwise confirm below to continue with CSV only."
                      : "If meter data changed, add the energy CSV above. Otherwise confirm below to continue with holiday JSON only."}
                  </p>
                  <label className="flex items-start gap-2 text-sm text-amber-950 dark:text-amber-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmPartial}
                      onChange={(e) => setConfirmPartial(e.target.checked)}
                      className="mt-0.5 rounded border-amber-400 text-[#ba0c2f] focus:ring-[#ba0c2f]"
                    />
                    <span>
                      {csvFile && !jsonFile
                        ? "Continue without updating the holiday JSON"
                        : "Continue without updating the energy CSV"}
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!canUpload}
            className="px-5 py-2.5 text-sm font-semibold bg-[#ba0c2f] text-white rounded-lg hover:bg-[#9a0a26] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {upload.isPending
              ? uploadPhaseLabel(uploadPhase)
              : csvFile && jsonFile
                ? "Upload dataset"
                : csvFile
                  ? "Upload energy CSV"
                  : jsonFile
                    ? "Upload holiday JSON"
                    : "Upload dataset"}
          </button>
        </div>
      )}
    </div>
  );
}
