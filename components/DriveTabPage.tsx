"use client";

import { useState } from "react";
import ConnectedDriveView, { DriveTab } from "@/components/ConnectedDriveView";

interface DriveTabPageProps {
  tab: DriveTab;
}

const DriveTabPage = ({ tab }: DriveTabPageProps) => {
  const [view, setView] = useState<"list" | "grid">("list");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar — view toggle only (no link input) */}
      <div className="flex items-center justify-end mb-2">
        <div className="view-toggle flex border border-gray-500/50 rounded-md">
          <button
            className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-600/50 transition-colors ${view === "list" ? "text-white bg-gray-600/50" : "text-white/50"}`}
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
            className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-600/50 transition-colors ${view === "grid" ? "text-white bg-gray-600/50" : "text-white/50"}`}
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

      <ConnectedDriveView tab={tab} view={view} />
    </div>
  );
};

export default DriveTabPage;
