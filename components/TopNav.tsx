"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

import logo from "@/public/zip_drive_logo.svg";
import Link from "next/link";

const TopNav = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const handleConnect = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

  const handleDisconnect = () => {
    signOut({ callbackUrl: window.location.href });
  };

  return (
    <div className="py-5 bg-white shadow-[0_4px_17px_-8px_rgba(0,0,0,0.1)] fixed top-0 inset-x-0">
      <div className="flex justify-between items-center w-[90%] mx-auto">
        {/* Logo */}
        <Link href={"/"} className="flex gap-5 items-center">
          <Image src={logo} alt="" className="w-9" />
          <span className="font-extrabold text-3xl">
            <span className="text-brand-orange">Zip</span>{" "}
            <span className="text-black">Drive</span>
          </span>
        </Link>

        {/* Auth button + avatar */}
        <div className="flex gap-4 items-center">
          {isLoggedIn && session?.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              title={session.user.name ?? ""}
              className="w-8 h-8 rounded-full ring-2 ring-amber-500/40"
            />
          )}

          {!isLoggedIn ? (
            <button
              onClick={handleConnect}
              disabled={status === "loading"}
              className="py-1.5 px-4 rounded-md cursor-pointer bg-brand-orange hover:bg-amber-400 disabled:opacity-50 disabled:cursor-wait text-white font-semibold capitalize flex gap-3 items-center transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 1v11M1 6.5h11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {status === "loading" ? "Loading..." : "Connect Drive"}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="py-1.5 px-4 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 text-white/80 hover:text-white font-semibold capitalize flex gap-3 items-center transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 6.5h9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Disconnect Drive
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
