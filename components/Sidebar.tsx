"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

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
  { id: "home", label: "Home", href: "/", requiresAuth: false },
  { id: "my-drive", label: "My Drive", href: "/my-drive", requiresAuth: true },
  {
    id: "shared",
    label: "Shared with me",
    href: "/shared",
    requiresAuth: true,
  },
  { id: "recent", label: "Recent", href: "/recent", requiresAuth: true },
  { id: "starred", label: "Starred", href: "/starred", requiresAuth: true },
];

const Sidebar = () => {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const isDisabled = item.requiresAuth && !isLoggedIn;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        if (isDisabled) {
          return (
            <div
              key={item.id}
              title="Sign in to access this section"
              className="flex items-center gap-2.5 rounded-md py-2 px-2.5 w-full text-white/20 cursor-not-allowed"
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-700" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              <LockIcon />
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`
              flex items-center gap-2.5 rounded-md py-2 px-2.5 w-full transition-colors
              hover:text-white hover:bg-gray-700/50
              ${isActive ? "text-white bg-gray-700/50" : "text-white/50"}
            `}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                isActive ? "bg-amber-500" : "bg-gray-600"
              }`}
            />
            <span className="flex-1 text-left text-sm">{item.label}</span>
          </Link>
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
