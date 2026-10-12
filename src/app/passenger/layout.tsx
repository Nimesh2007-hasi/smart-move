
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  COOKIE_NAME,
  verifySessionToken,
} from "@/lib/passenger-auth";

import LogoutButton from "@/components/passenger/LogoutButton";
import PassengerNavigation from "@/components/passenger/PassengerNavigation";

const navigation = [
  { label: "Dashboard", href: "/passenger/dashboard", icon: "⌂" },
  { label: "Book a Trip", href: "/passenger/book-trip", icon: "⌕" },
  { label: "My Bookings", href: "/passenger/my-bookings", icon: "▤" },
  { label: "Booking & Payment History", href: "/passenger/history", icon: "◷" },
  { label: "My Profile", href: "/passenger/profile", icon: "♙" },
  { label: "Reviews", href: "/passenger/reviews", icon: "☆" },
];

export default function PassengerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f5f7fc]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
            <p className="text-sm text-slate-500">
              Loading your Smart Move portal...
            </p>
          </div>
        </div>
      }
    >
      <AuthenticatedPassengerLayout>{children}</AuthenticatedPassengerLayout>
    </Suspense>
  );
}

async function AuthenticatedPassengerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== "PASSENGER") {
    redirect("/login");
  }

  const email = session.email || "Passenger";
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f5f7fc] text-slate-800 md:flex">
      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-[#10234b] text-white md:sticky md:top-0 md:h-screen md:w-[270px] md:shrink-0">
        {/* Brand */}
        <Link
          href="/passenger/dashboard"
          className="flex items-center gap-3 border-b border-white/10 px-6 py-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-2xl font-extrabold shadow-lg shadow-blue-950/30">
            S
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Smart Move
            </h1>
            <p className="mt-0.5 text-xs text-blue-200">
              Passenger portal
            </p>
          </div>
        </Link>

        {/* Section label */}
        <div className="px-6 pb-2 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/70">
            Workspace
          </p>
        </div>

        {/* Client navigation provides active-page highlighting */}
        <PassengerNavigation items={navigation} />

        {/* Support card */}
        <div className="hidden p-4 md:mt-auto md:block">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/15 text-lg text-blue-200">
              ?
            </div>

            <h2 className="mt-3 text-sm font-bold text-white">
              Need assistance?
            </h2>

            <p className="mt-1 text-xs leading-5 text-blue-100/70">
              Need help with your bookings or journey? Our team is here to help.
            </p>
          </div>

          <p className="px-2 py-4 text-center text-[10px] text-blue-200/50">
            SMART MOVE TRANSPORT SOLUTIONS
          </p>
        </div>
      </aside>

      {/* Main application */}
      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[78px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                Passenger workspace
              </p>
              <h2 className="mt-1 truncate text-base font-bold text-slate-900 sm:text-lg">
                Welcome back!
              </h2>
              <p className="hidden max-w-[260px] truncate text-xs text-slate-500 sm:block">
                {email}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/passenger/book-trip"
                className="hidden items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:inline-flex"
              >
                <span aria-hidden="true">＋</span>
                New booking
              </Link>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 font-bold text-blue-800">
                  {initial}
                </div>

                <div className="hidden max-w-[150px] sm:block">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {email}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Passenger account
                  </p>
                </div>
              </div>

              <LogoutButton />
            </div>
          </div>

          {/* Mobile horizontal navigation */}
          <div className="border-t border-slate-100 md:hidden">
            <PassengerNavigation items={navigation} mobile />
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-79px)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
