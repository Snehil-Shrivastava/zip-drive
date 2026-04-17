"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DriveFile, parseDriveLink } from "@/utils/drive";
import DriveItem from "@/components/DriveItem";
import DriveBreadcrumb, { BreadcrumbEntry } from "@/components/DriveBreadcrumb";

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

  // Folder navigation trail — root is always index 0
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([]);

  // Track the current folder id being viewed (may differ from the root link)
  const currentFolderId = useRef<string | null>(null);

  // ── Fetch a folder/file by ID ──────────────────────────────────────────────
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

  // ── React to a new top-level link being submitted ─────────────────────────
  useEffect(() => {
    if (!link) {
      setFetchState("idle");
      setData(null);
      setBreadcrumb([]);
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
    fetchDrive(parsed.id);
  }, [link, fetchDrive]);

  // ── Update breadcrumb root name once we know the folder name ──────────────
  useEffect(() => {
    if (
      data?.folderName &&
      breadcrumb.length === 1 &&
      breadcrumb[0].name === "Root"
    ) {
      setBreadcrumb([{ id: breadcrumb[0].id, name: data.folderName }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.folderName]);

  // ── Navigate into a subfolder ─────────────────────────────────────────────
  const handleFolderClick = (id: string, name: string) => {
    currentFolderId.current = id;
    setBreadcrumb((prev) => [...prev, { id, name }]);
    fetchDrive(id);
  };

  // ── Navigate back via breadcrumb ──────────────────────────────────────────
  const handleBreadcrumbNavigate = (index: number) => {
    const entry = breadcrumb[index];
    currentFolderId.current = entry.id;
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    fetchDrive(entry.id);
  };

  // ── Load next page ─────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (!data?.nextPageToken || !currentFolderId.current) return;
    fetchDrive(currentFolderId.current, data.nextPageToken, true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────────────────────────────────

  if (fetchState === "idle") {
    return (
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
        <p className="text-xs text-white/30 mt-1">
          Paste a public Google Drive link above to get started
        </p>
      </div>
    );
  }

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
        <p className="text-sm text-white/50">Fetching drive contents...</p>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3">
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 max-w-md text-left">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-red-400 shrink-0 mt-0.5"
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M8 4.5v4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="8" cy="11" r="0.7" fill="currentColor" />
          </svg>
          <p className="text-sm text-red-300">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  const files = data?.files ?? [];
  const isEmpty = files.length === 0;

  return (
    <div className="flex flex-col flex-1 py-6 h-full">
      {/* Breadcrumb */}
      <DriveBreadcrumb
        trail={breadcrumb}
        onNavigate={handleBreadcrumbNavigate}
      />

      {/* Folder/file name heading */}
      {data?.folderName && (
        <h2 className="text-base font-semibold text-white/70 mb-4">
          {data.folderName}
        </h2>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect
              x="4"
              y="10"
              width="32"
              height="24"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
            />
            <path d="M4 16h32" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M14 6h12"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm text-white/50 mt-3">This folder is empty</p>
        </div>
      )}

      {/* List view header */}
      {!isEmpty && view === "list" && (
        <div className="flex items-center gap-4 px-4 mb-1 text-xs text-white/20 uppercase tracking-wider">
          <span className="w-5 shrink-0" />
          <span className="flex-1">Name</span>
          <span className="hidden sm:block w-28 shrink-0">Type</span>
          <span className="hidden md:block w-24 shrink-0 text-right">
            Modified
          </span>
          <span className="hidden md:block w-16 shrink-0 text-right">Size</span>
          <span className="w-4 shrink-0" />
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
                  {loadingMore ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                      >
                        <circle
                          cx="6.5"
                          cy="6.5"
                          r="5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeDasharray="16"
                          strokeDashoffset="6"
                          strokeLinecap="round"
                        />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublicDriveView;
