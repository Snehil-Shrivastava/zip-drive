"use client";

import PublicDriveView from "@/components/PublicDriveView";
import LinkSearch from "@/components/LinkSearch";
import Image from "next/image";
import gdriveLogo from "@/public/googledrive_logo.svg";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const GDrivePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"list" | "grid">("list");
  const [link, setLink] = useState("");

  // On mount (or when search params change), pick up the link from the URL
  useEffect(() => {
    const param = searchParams.get("link");
    if (param) setLink(param);
  }, [searchParams]);

  return (
    <div className="h-full pt-40 pb-20 px-20 max-h-screen flex flex-col">
      <div className="py-8 flex relative bg-white rounded-xl px-15 items-center">
        <div className="absolute left-20 top-1/2 -translate-y-1/2">
          <Image src={gdriveLogo} alt="" className="w-50" />
        </div>
        <LinkSearch
          type="gdrive"
          onView={(submittedLink) => {
            setLink(submittedLink);
            router.replace(
              `/gdrive?link=${encodeURIComponent(submittedLink)}`,
              { scroll: false },
            );
          }}
        />
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
  );
};

export default GDrivePage;
