"use client";

import { useState } from "react";

const LockIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 11 11"
    fill="none"
    className="ml-auto shrink-0"
  >
    <rect
      x="2"
      y="5"
      width="7"
      height="5"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
    />
    <path
      d="M3.5 5V3.5a2 2 0 1 1 4 0V5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);

const NAV_ITEMS = [
  { id: "home", label: "Home", requiresAuth: false },
  { id: "my-drive", label: "My Drive", requiresAuth: true },
  { id: "shared", label: "Shared with me", requiresAuth: true },
  { id: "recent", label: "Recent", requiresAuth: true },
  { id: "starred", label: "Starred", requiresAuth: true },
];

interface SidebarProps {
  isLoggedIn?: boolean;
}

const Sidebar = ({ isLoggedIn = false }: SidebarProps) => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const isDisabled = item.requiresAuth && !isLoggedIn;
        const isActive = activeTab === item.id && !isDisabled;

        return (
          <button
            key={item.id}
            disabled={isDisabled}
            title={isDisabled ? "Sign in to access this section" : undefined}
            className={`
              flex items-center gap-2.5 rounded-md py-2 px-2.5 w-full transition-colors
              ${
                isDisabled
                  ? "text-white/20 cursor-not-allowed"
                  : `cursor-pointer hover:text-white hover:bg-gray-700/50 ${isActive ? "text-white bg-gray-700/50" : "text-white/50"}`
              }
            `}
            onClick={() => {
              if (!isDisabled) setActiveTab(item.id);
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                isDisabled
                  ? "bg-gray-700"
                  : isActive
                    ? "bg-amber-500"
                    : "bg-gray-600"
              }`}
            />
            <span className="flex-1 text-left text-sm">{item.label}</span>
            {isDisabled && <LockIcon />}
          </button>
        );
      })}

      {!isLoggedIn && (
        <p className="text-xs text-white/25 mt-4 px-2.5 leading-relaxed">
          Connect your Google Drive to access your files.
        </p>
      )}
    </div>
  );
};

export default Sidebar;
