"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DriveFile, parseDriveLink, formatSize } from "@/utils/drive";
import DriveItem from "@/components/DriveItem";
import DriveBreadcrumb, { BreadcrumbEntry } from "@/components/DriveBreadcrumb";
import DownloadProgressModal from "@/components/DownloadProgressModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState = "idle" | "loading" | "success" | "error";

interface DriveData {
  files: DriveFile[];
  folderName: string | null;
  isFile: boolean;
  nextPageToken: string | null;
}

interface PublicDriveViewProps {
  link: string; // the raw Drive URL submitted by the user
  view: "list" | "grid";
}

// ─── Component ────────────────────────────────────────────────────────────────

const PublicDriveView = ({ link, view }: PublicDriveViewProps) => {
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<DriveData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // New states for Multi-selection and Downloading
  const [selectedFiles, setSelectedFiles] = useState<Map<string, DriveFile>>(
    new Map(),
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const [downloadProgress, setDownloadProgress] = useState({
    isOpen: false,
    receivedBytes: 0,
    totalBytes: 0,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([]);
  const currentFolderId = useRef<string | null>(null);

  const fetchDrive = useCallback(
    async (id: string, pageToken?: string, append = false) => {
      if (!append) setFetchState("loading");
      else setLoadingMore(true);
      setErrorMsg("");

      try {
        const url = new URL("/api/drive", window.location.origin);
        url.searchParams.set("id", id);
        if (pageToken) url.searchParams.set("pageToken", pageToken);

        const res = await fetch(url.toString());
        const json = await res.json();

        if (!res.ok) {
          setErrorMsg(json.error ?? "Something went wrong.");
          setFetchState("error");
          return;
        }

        setData((prev) => ({
          ...json,
          files: append && prev ? [...prev.files, ...json.files] : json.files,
        }));
        setFetchState("success");
      } catch {
        setErrorMsg(
          "Network error. Please check your connection and try again.",
        );
        setFetchState("error");
      } finally {
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!link) {
      setFetchState("idle");
      setData(null);
      setBreadcrumb([]);
      setSelectedFiles(new Map());
      return;
    }

    const parsed = parseDriveLink(link);
    if (!parsed) {
      setErrorMsg(
        "Could not parse this Drive link. Please paste a valid Google Drive URL.",
      );
      setFetchState("error");
      return;
    }

    currentFolderId.current = parsed.id;
    setBreadcrumb([{ id: parsed.id, name: "Root" }]);
    setSelectedFiles(new Map());
    fetchDrive(parsed.id);
  }, [link, fetchDrive]);

  useEffect(() => {
    if (
      data?.folderName &&
      breadcrumb.length === 1 &&
      breadcrumb[0].name === "Root"
    ) {
      setBreadcrumb([{ id: breadcrumb[0].id, name: data.folderName }]);
    }
  }, [data?.folderName, breadcrumb]);

  const handleFolderClick = (id: string, name: string) => {
    currentFolderId.current = id;
    setBreadcrumb((prev) => [...prev, { id, name }]);
    fetchDrive(id);
  };

  const handleBreadcrumbNavigate = (index: number) => {
    const entry = breadcrumb[index];
    currentFolderId.current = entry.id;
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    fetchDrive(entry.id);
  };

  const handleLoadMore = () => {
    if (!data?.nextPageToken || !currentFolderId.current) return;
    fetchDrive(currentFolderId.current, data.nextPageToken, true);
  };

  // ── Selection & Download Handlers ──────────────────────────────────────────

  const toggleSelection = (file: DriveFile) => {
    // Prevent selecting folders for this specific compression download feature
    if (file.mimeType === "application/vnd.google-apps.folder") return;

    setSelectedFiles((prev) => {
      const next = new Map(prev);
      if (next.has(file.id)) next.delete(file.id);
      else next.set(file.id, file);
      return next;
    });
  };

  const files = data?.files ?? [];
  const selectableFiles = files.filter(
    (f) => f.mimeType !== "application/vnd.google-apps.folder",
  );
  const allSelected =
    selectableFiles.length > 0 &&
    selectableFiles.every((f) => selectedFiles.has(f.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFiles(new Map()); // Deselect all
    } else {
      const next = new Map(selectedFiles);
      selectableFiles.forEach((f) => next.set(f.id, f)); // Select all currently loaded files
      setSelectedFiles(next);
    }
  };

  const handleDownload = async () => {
    if (selectedFiles.size === 0) return;

    // 1. Setup cancellation controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 2. Open the modal and set loading states
    setIsDownloading(true);
    setDownloadProgress({
      isOpen: true,
      receivedBytes: 0,
      totalBytes: totalSelectedBytes,
    });

    try {
      // 3. Map selected files to the format the API expects
      const payload = Array.from(selectedFiles.values()).map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
      }));

      // 4. Fetch the zip stream from our Service Account API route
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: payload }),
        signal: abortController.signal, // Attach the abort signal
      });

      if (!res.ok) throw new Error("Download failed");
      if (!res.body) throw new Error("No response body");

      // 5. Read the stream chunk-by-chunk to track progress in real-time
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        // Update the modal's progress state
        setDownloadProgress({
          isOpen: true,
          receivedBytes,
          totalBytes: totalSelectedBytes,
        });
      }

      // 6. Combine all chunks into a single Zip file Blob and trigger browser download
      // @ts-expect-error random
      const blob = new Blob(chunks, { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed_images.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // 7. Clear selection after successful download
      setSelectedFiles(new Map());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Download cancelled by user.");
      } else {
        console.error("Download Error:", err);
        alert("Failed to compress and download files.");
      }
    } finally {
      // 8. Clean up states and close the modal
      setIsDownloading(false);
      setDownloadProgress({ isOpen: false, receivedBytes: 0, totalBytes: 0 });
      abortControllerRef.current = null;
    }
  };

  // Companion function triggered by the "Cancel" button in the Progress Modal
  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Triggers AbortError in the fetch catch block
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (fetchState === "idle") {
    return (
      /* Your Existing Idle State JSX */
      <div className="flex flex-col items-center justify-center flex-1 py-20 text-center opacity-40">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path
            d="M8 36l8-14 6 8 6-10 8 16H8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
          />
          <circle
            cx="36"
            cy="14"
            r="6"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M36 11v3l2 1.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-sm font-medium text-white/60 mt-4">
          No drive loaded
        </p>
      </div>
    );
  }

  if (fetchState === "loading") {
    return (
      /* Your Existing Loading State JSX */
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3 opacity-60">
        <svg
          className="animate-spin"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
        >
          <circle
            cx="14"
            cy="14"
            r="11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="34"
            strokeDashoffset="12"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-sm text-white/50">Fetching drive contents...</p>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      /* Your Existing Error State JSX */
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3">
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 max-w-md text-left">
          <p className="text-sm text-red-300">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const totalSelectedBytes = Array.from(selectedFiles.values()).reduce(
    (acc, file) => acc + (parseInt(file.size || "0", 10) || 0),
    0,
  );
  const isEmpty = files.length === 0;

  return (
    <div className="flex flex-col flex-1 py-6 h-full">
      <DriveBreadcrumb
        trail={breadcrumb}
        onNavigate={handleBreadcrumbNavigate}
      />
      {/* {data && (
        <span className="text-xs font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-md">
          {files.length} {files.length === 1 ? "item" : "items"}
        </span>
      )} */}

      {/* Header Area with Download Button */}
      <div className="flex items-center justify-between mb-4">
        {data?.folderName && (
          <div className="flex gap-15 items-center">
            <h2 className="text-base font-semibold text-white/70">
              {data.folderName}
            </h2>
            {data && (
              <span className="text-xs font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-md">
                {files.length} {files.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        )}
        <div className="flex gap-10 items-center text-white/50">
          <button
            onClick={handleSelectAll}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <span>
            Total Selected:{" "}
            <span>{formatSize(totalSelectedBytes.toString())}</span>
          </span>
          {/* Download Selected Trigger */}
          {selectedFiles.size > 0 && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="30"
                      strokeLinecap="round"
                    />
                  </svg>
                  Compressing...
                </>
              ) : (
                `Zip & Download (${selectedFiles.size})`
              )}
            </button>
          )}
        </div>
      </div>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
          <p className="text-sm text-white/50 mt-3">This folder is empty</p>
        </div>
      )}

      {/* File List Header (List View) */}
      {!isEmpty && view === "list" && (
        <div className="pr-14">
          <div className="flex items-center gap-4 px-4 mb-1 text-xs text-white/20 uppercase tracking-wider">
            <span className="w-5 shrink-0" />
            <span className="flex-1">Name</span>
            <span className="hidden sm:block w-28 shrink-0">Type</span>
            <span className="hidden md:block w-24 shrink-0 text-right">
              Modified
            </span>
            <span className="hidden md:block w-16 shrink-0 text-right">
              Size
            </span>
            <span className="w-4 shrink-0" />
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto">
        {/* File list */}
        {!isEmpty && (
          <>
            {view === "list" ? (
              <div className="flex flex-col divide-y divide-white/5 pr-10">
                {files.map((file) => (
                  <DriveItem
                    key={file.id}
                    file={file}
                    view="list"
                    onFolderClick={handleFolderClick}
                    selected={selectedFiles.has(file.id)}
                    onSelect={toggleSelection}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pr-10">
                {files.map((file) => (
                  <DriveItem
                    key={file.id}
                    file={file}
                    view="grid"
                    onFolderClick={handleFolderClick}
                    selected={selectedFiles.has(file.id)}
                    onSelect={toggleSelection}
                  />
                ))}
              </div>
            )}

            {/* Load more */}
            {data?.nextPageToken && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 px-5 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <DownloadProgressModal
        isOpen={downloadProgress.isOpen}
        receivedBytes={downloadProgress.receivedBytes}
        totalBytes={downloadProgress.totalBytes}
        onCancel={handleCancelDownload}
      />
    </div>
  );
};

export default PublicDriveView;
