"use client";

import PublicDriveView from "@/components/PublicDriveView";
import LinkSearch from "@/components/LinkSearch";
import Image from "next/image";
import gdriveLogo from "@/public/googledrive_logo.svg";
import { useState } from "react"; // Removed useEffect
import { useSearchParams, useRouter } from "next/navigation";

const GDrivePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"list" | "grid">("list");

  // Derive the link directly from the URL. No useState or useEffect needed!
  const link = searchParams.get("link") || "";

  return (
    <div className="h-full pt-40 pb-20 px-20 max-h-screen">
      <div className="h-full">
        <div className="py-8 flex relative bg-white rounded-t-xl px-15 items-center shadow-[0_-4px_25px_2px_rgba(0,0,0,0.08)]">
          {/* <div className="absolute left-20 top-1/2 -translate-y-1/2">
            <Image src={gdriveLogo} alt="" className="w-50" />
          </div> */}
          <div className="">
            <Image src={gdriveLogo} alt="" className="w-50" />
          </div>
          <div className="flex items-center justify-center flex-1">
            <LinkSearch
              type="gdrive"
              onView={(submittedLink) => {
                // Updating the URL will automatically re-render this component
                // and update the 'link' variable above.
                router.replace(
                  `/gdrive?link=${encodeURIComponent(submittedLink)}`,
                  { scroll: false },
                );
              }}
            />
          </div>
          <div>
            <div className="view-toggle flex rounded-md gap-5">
              <button
                className={`view-btn px-2.5 py-2 hover:text-white hover:bg-gray-500/50 ${view === "list" ? "text-brand-blue bg-gray-500/30" : "text-neutral-500/50"}`}
                onClick={() => setView("list")}
                title="List view"
              >
                {/* list icon svg */}
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
                {/* grid icon svg */}
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
        <PublicDriveView view={view} link={link} />
      </div>
    </div>
  );
};

export default GDrivePage;
