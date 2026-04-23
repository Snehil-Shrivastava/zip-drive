"use client";

import LinkSearch from "@/components/LinkSearch";
import Image from "next/image";
import onedriveLogo from "@/public/onedrive_logo.svg";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import OneDrivePublicview from "@/components/OneDrivePublicView";

const OneDrivePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"list" | "grid">("list");
  const [link, setLink] = useState("");

  // On mount, read link from sessionStorage if a key is present in the URL
  useEffect(() => {
    const key = searchParams.get("l");
    if (key) {
      const stored = sessionStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setLink(stored);
    }
  }, [searchParams]);

  const handleView = (submittedLink: string) => {
    // Store the full link in sessionStorage, put only a short key in the URL
    const key = `od_${Date.now()}`;
    sessionStorage.setItem(key, submittedLink);
    setLink(submittedLink);
    router.replace(`/onedrive?l=${key}`, { scroll: false });
  };

  return (
    <div className="h-full pt-40 pb-20 px-20 max-h-screen">
      <div className="h-full">
        <div className="py-8 flex relative bg-white rounded-t-xl px-15 items-center shadow-[0_-4px_25px_2px_rgba(0,0,0,0.08)]">
          <div>
            <Image src={onedriveLogo} alt="" className="w-50" />
          </div>
          <div className="flex items-center justify-center flex-1">
            <LinkSearch type="onedrive" onView={handleView} />
          </div>
          <div>
            <div className="view-toggle flex rounded-md gap-5">
              <button
                className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-500/50 ${view === "list" ? "text-brand-blue bg-gray-500/30" : "text-neutral-500/50"}`}
                onClick={() => setView("list")}
                title="List view"
              >
                <svg width="20" height="20" viewBox="0 0 13 13" fill="none">
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
                className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-500/50 ${view === "grid" ? "text-brand-blue bg-gray-500/30" : "text-neutral-500/50"}`}
                onClick={() => setView("grid")}
                title="Grid view"
              >
                <svg width="20" height="20" viewBox="0 0 13 13" fill="none">
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
        </div>
        <OneDrivePublicview view={view} link={link} />
      </div>
    </div>
  );
};

export default OneDrivePage;
