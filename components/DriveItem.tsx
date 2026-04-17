"use client";

import {
  DriveFile,
  formatDate,
  formatSize,
  isFolder,
  mimeLabel,
} from "@/utils/drive";

// ─── Icons ────────────────────────────────────────────────────────────────────

const FolderIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3.586a1 1 0 0 1 .707.293L9.207 5.7A1 1 0 0 0 9.914 6H16.5A1.5 1.5 0 0 1 18 7.5v8A1.5 1.5 0 0 1 16.5 17h-13A1.5 1.5 0 0 1 2 15.5v-10Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M5 3h7l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M12 3v4h4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 10h6M7 13h4"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path
      d="M2 9L9 2M9 2H5M9 2v4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M4.5 2.5L8 6l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface DriveItemProps {
  file: DriveFile;
  view: "list" | "grid";
  onFolderClick?: (id: string, name: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DriveItem = ({ file, view, onFolderClick }: DriveItemProps) => {
  const folder = isFolder(file);
  const label = mimeLabel(file.mimeType);

  const handleClick = () => {
    if (folder && onFolderClick) {
      onFolderClick(file.id, file.name);
    } else if (file.webViewLink) {
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
    }
  };

  if (view === "list") {
    return (
      <button
        onClick={handleClick}
        className="group w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left"
      >
        {/* Icon */}
        <div
          className={`shrink-0 ${folder ? "text-amber-400" : "text-blue-400/80"}`}
        >
          {folder ? <FolderIcon /> : <FileIcon />}
        </div>

        {/* Name */}
        <span className="flex-1 truncate text-sm text-white/80 group-hover:text-white transition-colors">
          {file.name}
        </span>

        {/* Type badge */}
        <span className="hidden sm:block text-xs text-white/30 w-28 shrink-0 truncate">
          {label}
        </span>

        {/* Modified */}
        <span className="hidden md:block text-xs text-white/30 w-24 shrink-0 text-right">
          {formatDate(file.modifiedTime)}
        </span>

        {/* Size */}
        <span className="hidden md:block text-xs text-white/30 w-16 shrink-0 text-right">
          {folder ? "—" : formatSize(file.size)}
        </span>

        {/* Action hint */}
        <div className="shrink-0 text-white/20 group-hover:text-white/50 transition-colors ml-1">
          {folder ? <ChevronRight /> : <ExternalLinkIcon />}
        </div>
      </button>
    );
  }

  // ── Grid card ──────────────────────────────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      className="group flex flex-col gap-2.5 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-left"
    >
      {/* Thumbnail or icon */}
      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
        {file.thumbnailLink ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.thumbnailLink.replace("=s220", "=s600")}
            alt={file.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`${folder ? "text-amber-400" : "text-blue-400/80"} opacity-60`}
          >
            {folder ? (
              <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
                <path
                  d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3.586a1 1 0 0 1 .707.293L9.207 5.7A1 1 0 0 0 9.914 6H16.5A1.5 1.5 0 0 1 18 7.5v8A1.5 1.5 0 0 1 16.5 17h-13A1.5 1.5 0 0 1 2 15.5v-10Z"
                  fill="currentColor"
                  fillOpacity="0.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 3h7l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M12 3v4h4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 10h6M7 13h4"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm text-white/80 group-hover:text-white transition-colors truncate leading-snug">
          {file.name}
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/30 truncate">{label}</span>
          {!folder && (
            <span className="text-xs text-white/20 shrink-0">
              {formatSize(file.size)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default DriveItem;
