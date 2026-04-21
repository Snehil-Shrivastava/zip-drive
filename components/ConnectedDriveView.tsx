"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DriveFile, formatSize, isFolder } from "@/utils/drive";
import DriveItem from "@/components/DriveItem";
import DriveBreadcrumb, { BreadcrumbEntry } from "@/components/DriveBreadcrumb";
import DownloadProgressModal from "@/components/DownloadProgressModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type FetchState = "idle" | "loading" | "success" | "error";

export type DriveTab = "my-drive" | "recent" | "starred" | "shared";

interface DriveData {
  files: DriveFile[];
  folderName: string | null;
  nextPageToken: string | null;
}

interface ConnectedDriveViewProps {
  tab: DriveTab;
  view: "list" | "grid";
}

const TAB_LABELS: Record<DriveTab, string> = {
  "my-drive": "My Drive",
  recent: "Recent",
  starred: "Starred",
  shared: "Shared with me",
};

// ─── Component ────────────────────────────────────────────────────────────────

const ConnectedDriveView = ({ tab, view }: ConnectedDriveViewProps) => {
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<DriveData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

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

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchFiles = useCallback(
    async (folderId?: string, pageToken?: string, append = false) => {
      if (!append) setFetchState("loading");
      else setLoadingMore(true);
      setErrorMsg("");

      try {
        const url = new URL("/api/my-drive", window.location.origin);
        url.searchParams.set("tab", tab);
        if (folderId) url.searchParams.set("folderId", folderId);
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
        setErrorMsg("Network error. Please check your connection.");
        setFetchState("error");
      } finally {
        setLoadingMore(false);
      }
    },
    [tab],
  );

  // Reset & reload whenever tab changes
  useEffect(() => {
    currentFolderId.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBreadcrumb([{ id: "root", name: TAB_LABELS[tab] }]);
    setSelectedFiles(new Map());
    setData(null);
    fetchFiles();
  }, [tab, fetchFiles]);

  // ── Navigation ────────────────────────────────────────────────────────────

  // All tabs support folder drilling — once you click into a folder it's just
  // a folder-contents query regardless of which tab you started from.
  const handleFolderClick = (id: string, name: string) => {
    currentFolderId.current = id;
    setBreadcrumb((prev) => [...prev, { id, name }]);
    setSelectedFiles(new Map());
    fetchFiles(id);
  };

  const handleBreadcrumbNavigate = (index: number) => {
    const entry = breadcrumb[index];
    // index 0 is always the tab root — no folderId needed
    const targetFolderId = index === 0 ? undefined : entry.id;
    currentFolderId.current = targetFolderId ?? null;
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    setSelectedFiles(new Map());
    fetchFiles(targetFolderId);
  };

  const handleLoadMore = () => {
    if (!data?.nextPageToken) return;
    fetchFiles(currentFolderId.current ?? undefined, data.nextPageToken, true);
  };

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleSelection = (file: DriveFile) => {
    if (isFolder(file)) return;
    setSelectedFiles((prev) => {
      const next = new Map(prev);
      next.has(file.id) ? next.delete(file.id) : next.set(file.id, file);
      return next;
    });
  };

  const files = data?.files ?? [];
  const selectableFiles = files.filter((f) => !isFolder(f));
  const allSelected =
    selectableFiles.length > 0 &&
    selectableFiles.every((f) => selectedFiles.has(f.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFiles(new Map());
    } else {
      const next = new Map(selectedFiles);
      selectableFiles.forEach((f) => next.set(f.id, f));
      setSelectedFiles(next);
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────

  const totalSelectedBytes = Array.from(selectedFiles.values()).reduce(
    (acc, f) => acc + (parseInt(f.size || "0", 10) || 0),
    0,
  );

  const handleDownload = async () => {
    if (selectedFiles.size === 0) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsDownloading(true);
    setDownloadProgress({
      isOpen: true,
      receivedBytes: 0,
      totalBytes: totalSelectedBytes,
    });

    try {
      const payload = Array.from(selectedFiles.values()).map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
      }));

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: payload }),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error("Download failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedBytes += value.length;
        setDownloadProgress({
          isOpen: true,
          receivedBytes,
          totalBytes: totalSelectedBytes,
        });
      }

      // @ts-expect-error random
      const blob = new Blob(chunks, { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "drive_files.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSelectedFiles(new Map());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Download error:", err);
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress((p) => ({ ...p, isOpen: false }));
    }
  };

  const handleCancelDownload = () => {
    abortControllerRef.current?.abort();
  };

  // ── Render states ─────────────────────────────────────────────────────────

  if (fetchState === "loading") {
    return (
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
        <p className="text-sm text-white/50">Loading {TAB_LABELS[tab]}...</p>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3">
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 max-w-md text-left">
          <p className="text-sm text-red-300">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const isEmpty = fetchState === "success" && files.length === 0;

  return (
    <div className="flex flex-col flex-1 py-6 h-full">
      {/* Breadcrumb — always shown; hidden by DriveBreadcrumb itself when trail <= 1 */}
      <DriveBreadcrumb
        trail={breadcrumb}
        onNavigate={handleBreadcrumbNavigate}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-6 items-center">
          {fetchState === "success" && (
            <span className="text-xs font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-md">
              {files.length} {files.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <div className="flex gap-8 items-center text-white/50 text-sm">
          {fetchState === "success" && selectableFiles.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          )}
          {selectedFiles.size > 0 && (
            <span>
              Selected:{" "}
              <span className="text-white/70">
                {formatSize(totalSelectedBytes.toString())}
              </span>
            </span>
          )}
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
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect
              x="4"
              y="8"
              width="32"
              height="26"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d="M4 14h32"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M4 8l6-4h20"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm text-white/50 mt-3">Nothing here yet</p>
        </div>
      )}

      {/* Column headers for list view */}
      {!isEmpty && fetchState === "success" && view === "list" && (
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
        {!isEmpty && fetchState === "success" && (
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

export default ConnectedDriveView;
