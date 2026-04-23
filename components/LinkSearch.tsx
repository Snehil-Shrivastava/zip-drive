"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkSearchProps {
  type: "onedrive" | "gdrive";
  onView?: (link: string) => void; // optional override
}

const config = {
  onedrive: {
    route: "/onedrive",
    buttonColor: "bg-brand-blue hover:bg-blue-600",
  },
  gdrive: {
    route: "/gdrive",
    buttonColor: "bg-brand-green hover:bg-green-600",
  },
};

const LinkSearch = ({ type, onView }: LinkSearchProps) => {
  const router = useRouter();
  const [value, setValue] = useState("");

  // const handleView = () => {
  //   const trimmed = value.trim();
  //   if (!trimmed) return;

  //   if (onView) {
  //     // In-page usage: let the parent handle it
  //     onView(trimmed);
  //   } else {
  //     // Dashboard usage: navigate with link as query param
  //     router.push(`${config[type].route}?link=${encodeURIComponent(trimmed)}`);
  //   }
  // };

  const handleView = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (onView) {
      onView(trimmed);
    } else if (type === "onedrive") {
      const key = `od_${Date.now()}`;
      sessionStorage.setItem(key, trimmed);
      router.push(`${config[type].route}?l=${key}`);
    } else {
      router.push(`${config[type].route}?link=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => setValue("");

  return (
    <div className="flex items-center justify-center gap-5 max-w-175 relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#a9a8a8]"
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
          className="w-100 border border-gray-500/10 bg-[#F6F6F6] rounded-lg py-2 pl-9 pr-9 outline-none focus:bg-[#d2d2d2] transition-colors text-neutral-500"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleView()}
        />
      </div>

      {value && (
        <button
          onClick={handleClear}
          className="absolute right-28 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
        className={`text-white font-semibold ${config[type].buttonColor} py-1.5 px-5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        onClick={handleView}
        disabled={!value.trim()}
      >
        View
      </button>
    </div>
  );
};

export default LinkSearch;
