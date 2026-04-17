// "use client";

// import PublicDriveView from "@/components/PublicDriveView";
// import { useState } from "react";

// const Dashboard = () => {
//   const [publicDriveLink, setPublicDriveLink] = useState("");
//   const [view, setView] = useState("list");

//   const handleClear = () => {
//     setPublicDriveLink("");
//   };
//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex items-center gap-15">
//         <div className="flex items-center gap-8 max-w-175 mx-auto relative">
//           <svg
//             className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30"
//             width="14"
//             height="14"
//             viewBox="0 0 14 14"
//             fill="none"
//           >
//             <path
//               d="M5.5 8.5a3.5 3.5 0 0 0 5 0l1.5-1.5a3.5 3.5 0 0 0-5-5L6.25 3.25"
//               stroke="currentColor"
//               strokeWidth="1.25"
//               strokeLinecap="round"
//             />
//             <path
//               d="M8.5 5.5a3.5 3.5 0 0 0-5 0L2 7a3.5 3.5 0 0 0 5 5l.75-.75"
//               stroke="currentColor"
//               strokeWidth="1.25"
//               strokeLinecap="round"
//             />
//           </svg>
//           <input
//             type="text"
//             placeholder="Paste public link..."
//             className="w-150 border border-gray-500/50 rounded-lg py-2 pl-9 pr-9 outline-none focus:bg-gray-700/50"
//             value={publicDriveLink}
//             onChange={(e) => setPublicDriveLink(e.target.value)}
//             // onKeyDown={(e) => e.key === "Enter" && handlePublicGo()}
//           />
//           {publicDriveLink && (
//             <button
//               onClick={handleClear}
//               className="absolute right-32 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
//               title="Clear"
//             >
//               <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//                 <path
//                   d="M2 2l8 8M10 2l-8 8"
//                   stroke="currentColor"
//                   strokeWidth="1.4"
//                   strokeLinecap="round"
//                 />
//               </svg>
//             </button>
//           )}
//           <button
//             className={`text-white font-semibold bg-amber-500 py-1.5 px-5 rounded-lg cursor-pointer hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed`}
//             // onClick={handlePublicGo}
//             disabled={!publicDriveLink.trim()}
//           >
//             View
//           </button>
//         </div>
//         <div className="view-toggle flex border border-gray-500/50 rounded-md">
//           <button
//             className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-600/50 ${view === "list" ? "text-white bg-gray-600/50" : "text-white/50"}`}
//             onClick={() => setView("list")}
//             title="List view"
//           >
//             <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
//               <rect
//                 x="0.5"
//                 y="1.5"
//                 width="12"
//                 height="2"
//                 rx="1"
//                 fill="currentColor"
//               />
//               <rect
//                 x="0.5"
//                 y="5.5"
//                 width="12"
//                 height="2"
//                 rx="1"
//                 fill="currentColor"
//               />
//               <rect
//                 x="0.5"
//                 y="9.5"
//                 width="12"
//                 height="2"
//                 rx="1"
//                 fill="currentColor"
//               />
//             </svg>
//           </button>
//           <button
//             className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-600/50 ${view === "grid" ? "text-white bg-gray-600/50" : "text-white/50"}`}
//             onClick={() => setView("grid")}
//             title="Grid view"
//           >
//             <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
//               <rect
//                 x="0.5"
//                 y="0.5"
//                 width="5"
//                 height="5"
//                 rx="1.5"
//                 fill="currentColor"
//               />
//               <rect
//                 x="7.5"
//                 y="0.5"
//                 width="5"
//                 height="5"
//                 rx="1.5"
//                 fill="currentColor"
//               />
//               <rect
//                 x="0.5"
//                 y="7.5"
//                 width="5"
//                 height="5"
//                 rx="1.5"
//                 fill="currentColor"
//               />
//               <rect
//                 x="7.5"
//                 y="7.5"
//                 width="5"
//                 height="5"
//                 rx="1.5"
//                 fill="currentColor"
//               />
//             </svg>
//           </button>
//         </div>
//       </div>
//       <PublicDriveView />
//     </div>
//   );
// };

// export default Dashboard;

// ---------------- working code

"use client";

import PublicDriveView from "@/components/PublicDriveView";
import { useState } from "react";

const Dashboard = () => {
  const [inputValue, setInputValue] = useState("");
  // `submittedLink` is only updated when the user hits View — this prevents
  // re-fetching on every keystroke while still letting PublicDriveView react
  // to a new submission.
  const [submittedLink, setSubmittedLink] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const handleView = () => {
    if (!inputValue.trim()) return;
    setSubmittedLink(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue("");
    setSubmittedLink("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-15">
        <div className="flex items-center gap-8 max-w-175 mx-auto relative">
          {/* Link icon */}
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M5.5 8.5a3.5 3.5 0 0 0 5 0l1.5-1.5a3.5 3.5 0 0 0-5-5L6.25 3.25"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
            <path
              d="M8.5 5.5a3.5 3.5 0 0 0-5 0L2 7a3.5 3.5 0 0 0 5 5l.75-.75"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            placeholder="Paste public link..."
            className="w-150 border border-gray-500/50 rounded-lg py-2 pl-9 pr-9 outline-none focus:bg-gray-700/50 transition-colors"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleView()}
          />

          {/* Clear button */}
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-32 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              title="Clear"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 2l8 8M10 2l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          <button
            className="text-white font-semibold bg-amber-500 py-1.5 px-5 rounded-lg cursor-pointer hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleView}
            disabled={!inputValue.trim()}
          >
            View
          </button>
        </div>

        {/* View toggle */}
        <div className="view-toggle flex border border-gray-500/50 rounded-md">
          <button
            className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-600/50 ${view === "list" ? "text-white bg-gray-600/50" : "text-white/50"}`}
            onClick={() => setView("list")}
            title="List view"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect
                x="0.5"
                y="1.5"
                width="12"
                height="2"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="0.5"
                y="5.5"
                width="12"
                height="2"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="0.5"
                y="9.5"
                width="12"
                height="2"
                rx="1"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-600/50 ${view === "grid" ? "text-white bg-gray-600/50" : "text-white/50"}`}
            onClick={() => setView("grid")}
            title="Grid view"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect
                x="0.5"
                y="0.5"
                width="5"
                height="5"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="7.5"
                y="0.5"
                width="5"
                height="5"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="0.5"
                y="7.5"
                width="5"
                height="5"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="7.5"
                y="7.5"
                width="5"
                height="5"
                rx="1.5"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Drive content ── */}
      <PublicDriveView link={submittedLink} view={view} />
    </div>
  );
};

export default Dashboard;
