import axios from "axios";
import type {
  DatasetUploadPhase,
  DatasetUploadResponse,
  DatasetUploadUrlsResponse,
} from "../types/api";

/** Cloud Run request body limit; use direct-to-GCS above this combined size. */
export const MULTIPART_UPLOAD_MAX_BYTES = 32 * 1024 * 1024;

export type DatasetUploadFiles = {
  energyCsv?: File | null;
  holidayJson?: File | null;
};

export function shouldUseGcsUpload(files: DatasetUploadFiles): boolean {
  const csvSize = files.energyCsv?.size ?? 0;
  const jsonSize = files.holidayJson?.size ?? 0;
  return csvSize + jsonSize >= MULTIPART_UPLOAD_MAX_BYTES;
}

export function uploadPhaseLabel(phase: DatasetUploadPhase | null): string {
  switch (phase) {
    case "multipart":
      return "Uploading…";
    case "requesting-urls":
      return "Requesting upload URLs…";
    case "uploading-csv":
      return "Uploading CSV to cloud storage…";
    case "uploading-holiday":
      return "Uploading holiday JSON…";
    case "confirming":
      return "Confirming dataset…";
    default:
      return "Upload dataset";
  }
}

export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.detail === "string") {
    return error.response.data.detail;
  }
  if (error instanceof Error) return error.message;
  return "Upload failed";
}

async function uploadMultipart(
  apiUrl: string,
  files: DatasetUploadFiles,
  onPhase?: (phase: DatasetUploadPhase) => void,
): Promise<DatasetUploadResponse> {
  onPhase?.("multipart");
  const form = new FormData();
  if (files.energyCsv) form.append("energy_csv", files.energyCsv);
  if (files.holidayJson) form.append("holiday_json", files.holidayJson);
  const response = await axios.post<DatasetUploadResponse>(
    `${apiUrl}/dataset/upload`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

async function uploadViaGcs(
  apiUrl: string,
  files: DatasetUploadFiles,
  onPhase?: (phase: DatasetUploadPhase) => void,
): Promise<DatasetUploadResponse> {
  onPhase?.("requesting-urls");
  const { data: urls } = await axios.post<DatasetUploadUrlsResponse>(
    `${apiUrl}/dataset/upload-urls`,
  );

  if (files.energyCsv) {
    onPhase?.("uploading-csv");
    const csvRes = await fetch(urls.csv_upload_url, {
      method: "PUT",
      headers: { "Content-Type": "text/csv" },
      body: files.energyCsv,
    });
    if (!csvRes.ok) {
      throw new Error(`CSV upload to storage failed (${csvRes.status})`);
    }
  }

  if (files.holidayJson) {
    onPhase?.("uploading-holiday");
    const jsonRes = await fetch(urls.holiday_upload_url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: files.holidayJson,
    });
    if (!jsonRes.ok) {
      throw new Error(`Holiday JSON upload to storage failed (${jsonRes.status})`);
    }
  }

  onPhase?.("confirming");
  const { data } = await axios.post<DatasetUploadResponse>(
    `${apiUrl}/dataset/confirm`,
  );
  return data;
}

export async function uploadDatasetFiles(
  apiUrl: string,
  files: DatasetUploadFiles,
  onPhase?: (phase: DatasetUploadPhase) => void,
): Promise<DatasetUploadResponse> {
  if (!files.energyCsv && !files.holidayJson) {
    throw new Error("Select an energy CSV and/or holiday JSON file");
  }
  if (shouldUseGcsUpload(files)) {
    return uploadViaGcs(apiUrl, files, onPhase);
  }
  return uploadMultipart(apiUrl, files, onPhase);
}
