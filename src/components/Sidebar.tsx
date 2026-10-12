"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminLogout from "@/components/AdminLogout";

const menuItems = [
  { name: "Dashboard", path: "/", icon: "⌂" },
  { name: "Vehicles", path: "/vehicles", icon: "▣" },
  { name: "Drivers", path: "/drivers", icon: "♙" },
  { name: "Routes", path: "/routes", icon: "↗" },
  { name: "Passengers", path: "/passengers", icon: "♧" },
  { name: "Trips", path: "/trips", icon: "⇄" },
  { name: "Tickets", path: "/tickets", icon: "▤" },
  { name: "Payments", path: "/payments", icon: "＄" },
  { name: "Maintenance", path: "/maintenance", icon: "⚙" },
  { name: "Reports", path: "/reports", icon: "▥" },
  { name: "Vehicle Documents", path: "/vehicle-documents", icon: "▧" },
  { name: "Passenger Reviews", path: "/passenger-reviews", icon: "☆" },
  { name: "Announcements", path: "/announcements", icon: "◉" },
  { name: "Trip Media", path: "/trip-media", icon: "▣" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 p-4 lg:block">
      <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/45 p-4 shadow-[8px_8px_24px_rgba(137,163,200,0.24),-8px_-8px_24px_rgba(255,255,255,0.85)] backdrop-blur-2xl">

        {/* Brand */}
        <Link
          href="/"
          className="mb-7 flex shrink-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/40 px-3 py-4 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.9),inset_-2px_-2px_6px_rgba(151,174,207,0.12)] transition hover:bg-white/65"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-black text-white shadow-[4px_4px_10px_rgba(37,99,235,0.25)]">
            S
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-[#10234b]">
              Smart Move
            </h1>
            <p className="text-xs font-medium text-[#7183a1]">
              Transport Admin
            </p>
          </div>
        </Link>

        {/* Section label */}
        <div className="mb-3 flex shrink-0 items-center justify-between px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7183a1]">
            Workspace
          </p>
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-1 pb-3">
          {menuItems.map((item) => {
            const active =
              item.path === "/"
                ? pathname === "/"
                : pathname === item.path ||
                  pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#e4eeff]/90 text-[#1d4ed8] shadow-[inset_3px_3px_7px_rgba(151,174,207,0.32),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]"
                    : "text-[#526785] hover:bg-white/65 hover:text-[#2563eb] hover:shadow-[3px_3px_8px_rgba(151,174,207,0.16),-3px_-3px_8px_rgba(255,255,255,0.75)]"
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-blue-600" />
                )}

                {/* Icon */}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-lg transition-all duration-200 ${
                    active
                      ? "bg-white/80 text-blue-600 shadow-sm"
                      : "bg-white/45 text-[#7183a1] group-hover:bg-white/80 group-hover:text-blue-600"
                  }`}
                >
                  {item.icon}
                </span>

                <span className="min-w-0 flex-1 leading-5">
                  {item.name}
                </span>

                {active && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 shadow-[0_0_7px_rgba(37,99,235,0.4)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Account footer */}
        <div className="mt-3 shrink-0 border-t border-white/80 pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/35 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 font-bold text-blue-700 shadow-[3px_3px_7px_rgba(151,174,207,0.25),-3px_-3px_7px_rgba(255,255,255,0.8)]">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#243b61]">
                Admin account
              </p>
              <p className="truncate text-xs text-[#7183a1]">
                Smart Move Workspace
              </p>
            </div>
          </div>

          <AdminLogout />
        </div>
      </div>
    </aside>
  );
}
