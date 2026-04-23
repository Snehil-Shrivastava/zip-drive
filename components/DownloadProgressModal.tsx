"use client";

import { formatSize } from "@/utils/drive";

interface DownloadProgressModalProps {
  isOpen: boolean;
  receivedBytes: number;
  totalBytes: number;
  onCancel: () => void;
}

const DownloadProgressModal = ({
  isOpen,
  receivedBytes,
  totalBytes,
  onCancel,
}: DownloadProgressModalProps) => {
  if (!isOpen) return null;

  // Cap at 99% — let the modal close naturally when done rather than flash 100%
  const percent =
    totalBytes > 0
      ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100))
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-100 max-w-[90vw] flex flex-col items-center text-center shadow-2xl">
        {/* Spinning Icon */}
        <div className="relative mb-6 mt-2 text-blue-500">
          <svg
            className="animate-spin w-14 h-14 opacity-40"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="30"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-blue-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 16l-5-5h3V4h4v7h3l-5 5zM19 18H5v2h14v-2z" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">
          Compressing & Downloading
        </h3>

        {percent !== null ? (
          <>
            {/* Percentage */}
            <p className="text-3xl font-bold text-white mb-3">{percent}%</p>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Bytes received / total */}
            <p className="text-xs text-white/40 mb-1">
              {formatSize(receivedBytes.toString())} received of ~
              {formatSize(totalBytes.toString())} original
            </p>
          </>
        ) : (
          <p className="text-sm text-white/50 mb-1">
            Received:{" "}
            <span className="font-medium text-white/80">
              {formatSize(receivedBytes.toString())}
            </span>
          </p>
        )}

        <p className="text-xs text-white/30 mb-8">
          Final zip size varies with compression. Please don&apos;t close this
          tab.
        </p>

        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors w-full border border-red-500/20"
        >
          Cancel Download
        </button>
      </div>
    </div>
  );
};

export default DownloadProgressModal;
