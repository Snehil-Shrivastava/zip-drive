// "use client";

// import Link from "next/link";
// import { useState } from "react";

// const TopNav = ({ isLoggedIn = false }: { isLoggedIn?: boolean }) => {
//   const [search, setSearch] = useState("");
//   return (
//     <div className="py-5">
//       <div className="flex justify-between items-center w-[90%] mx-auto">
//         <div>
//           <span className="font-extrabold text-3xl">
//             <span>Zip</span> <span className="text-amber-500">Drive</span>
//           </span>
//         </div>
//         <div>
//           <div className="relative">
//             <svg
//               className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
//               width="14"
//               height="14"
//               viewBox="0 0 14 14"
//               fill="none"
//             >
//               <circle
//                 cx="6"
//                 cy="6"
//                 r="4.5"
//                 stroke="currentColor"
//                 strokeWidth="1.25"
//               />
//               <path
//                 d="M9.5 9.5l2.5 2.5"
//                 stroke="currentColor"
//                 strokeWidth="1.25"
//                 strokeLinecap="round"
//               />
//             </svg>
//             <input
//               className="w-100 border border-gray-500/50 rounded-lg py-2 pl-9 pr-3 outline-none focus:bg-gray-700/50"
//               type="text"
//               placeholder="Search files..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//         </div>
//         <div className="flex gap-5 items-center">
//           {!isLoggedIn ? (
//             <Link
//               href={"#"}
//               className="py-1.5 px-4 rounded-md cursor-pointer bg-amber-500 hover:bg-amber-400 text-black font-semibold capitalize flex gap-3 items-center"
//             >
//               <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
//                 <path
//                   d="M6.5 1v11M1 6.5h11"
//                   stroke="currentColor"
//                   strokeWidth="1.5"
//                   strokeLinecap="round"
//                 />
//               </svg>
//               connect drive
//             </Link>
//           ) : (
//             <Link
//               href={"#"}
//               className="py-1.5 px-4 rounded-md cursor-pointer bg-amber-500 text-black font-semibold capitalize flex gap-3 items-center"
//             >
//               <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
//                 <path
//                   d="M6.5 6.5h11"
//                   stroke="currentColor"
//                   strokeWidth="1.5"
//                   strokeLinecap="round"
//                 />
//               </svg>
//               disconnect drive
//             </Link>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TopNav;

// ---------------------------

"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

const TopNav = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [search, setSearch] = useState("");

  const handleConnect = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

  const handleDisconnect = () => {
    signOut({ callbackUrl: window.location.href });
  };

  return (
    <div className="py-5">
      <div className="flex justify-between items-center w-[90%] mx-auto">
        {/* Logo */}
        <div>
          <span className="font-extrabold text-3xl">
            <span>Zip</span> <span className="text-amber-500">Drive</span>
          </span>
        </div>

        {/* Search */}
        <div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <circle
                cx="6"
                cy="6"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.25"
              />
              <path
                d="M9.5 9.5l2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
            <input
              className="w-100 border border-gray-500/50 rounded-lg py-2 pl-9 pr-3 outline-none focus:bg-gray-700/50"
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!isLoggedIn}
            />
          </div>
        </div>

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
              className="py-1.5 px-4 rounded-md cursor-pointer bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-wait text-black font-semibold capitalize flex gap-3 items-center transition-colors"
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
