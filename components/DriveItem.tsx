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
      d="M12 3v4h4M7 10h6M7 13h4"
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

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="2"
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
  onSelect?: (file: DriveFile) => void;
  selected?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DriveItem = ({
  file,
  view,
  onFolderClick,
  onSelect,
  selected,
}: DriveItemProps) => {
  const folder = isFolder(file);
  const label = mimeLabel(file.mimeType);

  const handleClick = () => {
    if (folder && onFolderClick) {
      onFolderClick(file.id, file.name);
    } else if (!folder && onSelect) {
      onSelect(file);
    }
  };

  if (view === "list") {
    return (
      <button
        onClick={handleClick}
        className={`group w-full flex items-center gap-4 py-3 rounded-xl transition-all text-left border ${
          selected
            ? "bg-blue-500/10 border-blue-500/20"
            : "hover:bg-white/5 border-transparent"
        }`}
      >
        <div className="shrink-0 ml-1 flex items-center justify-center">
          {folder ? (
            <span className="text-black/20 group-hover:text-black/50 transition-colors">
              <ChevronRight />
            </span>
          ) : (
            <div
              className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all border ${
                selected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-black/20 text-transparent group-hover:border-black/40"
              }`}
            >
              <CheckIcon />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1">
          {/* Icon */}
          <div
            className={`shrink-0 ${folder ? "text-amber-400" : "text-blue-400/80"}`}
          >
            {folder ? <FolderIcon /> : <FileIcon />}
          </div>

          {/* Name */}
          <span className="flex-1 truncate text-sm text-black/80 group-hover:text-black transition-colors">
            {file.name}
          </span>
        </div>

        {/* Type badge */}
        <span className="hidden sm:block text-xs text-black/30 w-55 shrink-0 truncate text-center">
          {label}
        </span>

        {/* Modified */}
        <span className="hidden md:block text-xs text-black/30 w-55 shrink-0 text-center">
          {formatDate(file.modifiedTime)}
        </span>

        {/* Size */}
        <span className="hidden md:block text-xs text-black/30 w-55 shrink-0 text-center">
          {folder ? "—" : formatSize(file.size)}
        </span>
      </button>
    );
  }

  // ── Grid card ──────────────────────────────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      className={`group relative flex flex-col gap-2.5 p-4 rounded-xl transition-all text-left shadow-xs ${
        selected
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-neutral-500/10 hover:bg-neutral-500/15"
      }`}
    >
      {/* Checkbox Overlay for Files */}
      {!folder && (
        <div
          className={`absolute top-2 left-2 z-10 p-1 transition-opacity ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border shadow-sm ${
              selected
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-black/50 border-white/40 text-transparent"
            }`}
          >
            <CheckIcon />
          </div>
        </div>
      )}

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
                  d="M12 3v4h4M7 10h6M7 13h4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm text-black/80 group-hover:text-black transition-colors truncate leading-snug">
          {file.name}
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-black/30 truncate">{label}</span>
          {!folder && (
            <span className="text-xs text-black/40 shrink-0">
              {formatSize(file.size)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default DriveItem;
