// "use client";

// import { formatSize } from "@/utils/drive";

// interface DownloadProgressModalProps {
//   isOpen: boolean;
//   phase: "zipping" | "downloading";
//   receivedBytes: number;
//   totalBytes: number;
//   onCancel: () => void;
// }

// const DownloadProgressModal = ({
//   isOpen,
//   phase,
//   receivedBytes,
//   totalBytes,
//   onCancel,
// }: DownloadProgressModalProps) => {
//   if (!isOpen) return null;

//   const percent =
//     phase === "downloading" && totalBytes > 0
//       ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100))
//       : null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
//       <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-100 max-w-[90vw] flex flex-col items-center text-center shadow-2xl">
//         {/* Icon */}
//         <div className="relative mb-6 mt-2 text-blue-500">
//           <svg
//             className="animate-spin w-14 h-14 opacity-40"
//             viewBox="0 0 24 24"
//             fill="none"
//           >
//             <circle
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="2.5"
//               strokeDasharray="30"
//               strokeLinecap="round"
//             />
//           </svg>
//           <div className="absolute inset-0 flex items-center justify-center text-blue-400">
//             {phase === "zipping" ? (
//               // Archive icon during zipping
//               <svg
//                 width="22"
//                 height="22"
//                 viewBox="0 0 24 24"
//                 fill="currentColor"
//               >
//                 <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z" />
//               </svg>
//             ) : (
//               // Download icon during downloading
//               <svg
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 fill="currentColor"
//               >
//                 <path d="M12 16l-5-5h3V4h4v7h3l-5 5zM19 18H5v2h14v-2z" />
//               </svg>
//             )}
//           </div>
//         </div>

//         {/* Title */}
//         <h3 className="text-lg font-semibold text-white mb-2">
//           {phase === "zipping" ? "Compressing Files…" : "Downloading…"}
//         </h3>

//         {/* Zipping phase — indeterminate bar */}
//         {phase === "zipping" && (
//           <>
//             <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
//               <div
//                 className="h-full w-2/5 bg-blue-500 rounded-full"
//                 style={{ animation: "indeterminate 1.5s ease-in-out infinite" }}
//               />
//             </div>
//             <p className="text-xs text-white/40 mb-1">
//               Building your zip on the server, please wait…
//             </p>
//           </>
//         )}

//         {/* Downloading phase — determinate bar */}
//         {phase === "downloading" && percent !== null && (
//           <>
//             <p className="text-3xl font-bold text-white mb-3">{percent}%</p>
//             <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
//               <div
//                 className="h-full bg-blue-500 rounded-full transition-all duration-300"
//                 style={{ width: `${percent}%` }}
//               />
//             </div>
//             <p className="text-xs text-white/40 mb-1">
//               {formatSize(receivedBytes.toString())} of{" "}
//               {formatSize(totalBytes.toString())}
//             </p>
//           </>
//         )}

//         <p className="text-xs text-white/30 mb-8">
//           Please don&apos;t close this tab.
//         </p>

//         <button
//           onClick={onCancel}
//           className="px-6 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors w-full border border-red-500/20"
//         >
//           Cancel
//         </button>
//       </div>

//       <style>{`
//         @keyframes indeterminate {
//           0% { transform: translateX(-150%); }
//           100% { transform: translateX(400%); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default DownloadProgressModal;

// ------------------

"use client";

import { formatSize } from "@/utils/drive";

interface DownloadProgressModalProps {
  isOpen: boolean;
  phase: "zipping" | "downloading";
  // zipping phase
  processedFiles?: number;
  totalFiles?: number;
  // downloading phase
  receivedBytes?: number;
  totalBytes?: number;
  onCancel: () => void;
}

const DownloadProgressModal = ({
  isOpen,
  phase,
  processedFiles = 0,
  totalFiles = 0,
  receivedBytes = 0,
  totalBytes = 0,
  onCancel,
}: DownloadProgressModalProps) => {
  if (!isOpen) return null;

  const zipPercent =
    totalFiles > 0
      ? Math.min(99, Math.round((processedFiles / totalFiles) * 100))
      : 0;

  const downloadPercent =
    totalBytes > 0
      ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100))
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-100 max-w-[90vw] flex flex-col items-center text-center shadow-2xl">
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
            {phase === "zipping" ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 16l-5-5h3V4h4v7h3l-5 5zM19 18H5v2h14v-2z" />
              </svg>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-4">
          {phase === "zipping" ? "Compressing Files…" : "Downloading…"}
        </h3>

        {phase === "zipping" && (
          <>
            <p className="text-3xl font-bold text-white mb-3">{zipPercent}%</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${zipPercent}%` }}
              />
            </div>
            <p className="text-xs text-white/40 mb-1">
              {processedFiles} of {totalFiles} files compressed
            </p>
          </>
        )}

        {phase === "downloading" && (
          <>
            {downloadPercent !== null ? (
              <>
                <p className="text-3xl font-bold text-white mb-3">
                  {downloadPercent}%
                </p>
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${downloadPercent}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 mb-1">
                  {formatSize(receivedBytes.toString())} of{" "}
                  {formatSize(totalBytes.toString())}
                </p>
              </>
            ) : (
              <>
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full w-2/5 bg-blue-500 rounded-full"
                    style={{
                      animation: "indeterminate 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
                <p className="text-xs text-white/40 mb-1">
                  {formatSize(receivedBytes.toString())} received
                </p>
              </>
            )}
          </>
        )}

        <p className="text-xs text-white/30 mb-8 mt-2">
          Please don&apos;t close this tab.
        </p>

        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors w-full border border-red-500/20"
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default DownloadProgressModal;
