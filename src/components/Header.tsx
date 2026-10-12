"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pageNames: Record<string, string> = {
  vehicles: "Vehicles",
  drivers: "Drivers",
  routes: "Routes",
  passengers: "Passengers",
  trips: "Trips",
  tickets: "Tickets",
  payments: "Payments",
  maintenance: "Maintenance",
  feedback: "Feedback",
  reports: "Reports",
  "vehicle-documents": "Vehicle Documents",
  "passenger-reviews": "Passenger Reviews",
  announcements: "Announcements",
  "trip-media": "Trip Media",
};

export default function Header() {
  const pathname = usePathname();

  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const title = segment ? pageNames[segment] ?? "Dashboard" : "Dashboard";

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="neu-flat flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs text-[#7183a1]">
            <Link href="/" className="transition hover:text-blue-600">
              Admin
            </Link>
            <span>/</span>
            <span className="truncate">{title}</span>
          </div>

          <h2 className="truncate text-lg font-bold text-[#10234b] sm:text-xl">
            {title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#243b61]">Administrator</p>
            <p className="text-xs text-[#7183a1]">Smart Move Workspace</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 font-bold text-white shadow-md shadow-blue-200 sm:h-11 sm:w-11">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
