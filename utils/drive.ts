export type DriveItemType = "folder" | "file";

export interface ParsedDriveLink {
  id: string;
  type: DriveItemType;
}

/**
 * Extracts the Google Drive resource ID and type from any public Drive URL.
 * Supports:
 *  - https://drive.google.com/drive/folders/{id}
 *  - https://drive.google.com/drive/u/0/folders/{id}
 *  - https://drive.google.com/file/d/{id}/view
 *  - https://drive.google.com/open?id={id}
 *  - https://drive.google.com/folderview?id={id}
 */
export function parseDriveLink(url: string): ParsedDriveLink | null {
  try {
    const parsed = new URL(url.trim());

    if (!parsed.hostname.includes("drive.google.com")) return null;

    // /drive/.../folders/{id}
    const folderMatch = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) return { id: folderMatch[1], type: "folder" };

    // /file/d/{id}/...
    const fileMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return { id: fileMatch[1], type: "file" };

    // ?id={id}  (open, folderview, etc.)
    const queryId = parsed.searchParams.get("id");
    if (queryId) {
      // folderview strongly implies folder; open is ambiguous — treat as folder
      const isFolderView =
        parsed.pathname.includes("folderview") ||
        parsed.searchParams.has("usp");
      return { id: queryId, type: isFolderView ? "folder" : "folder" };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Drive API response types ────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string; // bytes as string (files only)
  modifiedTime?: string; // ISO 8601
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
}
export interface OneDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string; // bytes as string (files only)
  modifiedTime?: string; // ISO 8601
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
  downloadUrl?: string;
  isFolder?: boolean;
}

export interface DriveListResponse {
  files: DriveFile[];
  folderName?: string;
  nextPageToken?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const FOLDER_MIME = "application/vnd.google-apps.folder";

export function isFolder(file: DriveFile) {
  return file.mimeType === FOLDER_MIME;
}

/** Human-readable file size */
export function formatSize(bytes?: string): string {
  if (!bytes) return "—";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

/** Relative time label */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Map mimeType to a friendly label */
export function mimeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    "application/vnd.google-apps.folder": "Folder",
    "application/vnd.google-apps.document": "Google Doc",
    "application/vnd.google-apps.spreadsheet": "Google Sheet",
    "application/vnd.google-apps.presentation": "Google Slides",
    "application/vnd.google-apps.form": "Google Form",
    "application/pdf": "PDF",
    "image/jpeg": "JPEG Image",
    "image/png": "PNG Image",
    "image/gif": "GIF",
    "image/webp": "WebP Image",
    "image/svg+xml": "SVG",
    "video/mp4": "MP4 Video",
    "video/quicktime": "MOV Video",
    "audio/mpeg": "MP3 Audio",
    "application/zip": "ZIP Archive",
    "text/plain": "Text File",
    "application/json": "JSON",
    "text/csv": "CSV",
  };
  return map[mimeType] ?? mimeType.split("/").pop()?.toUpperCase() ?? "File";
}
