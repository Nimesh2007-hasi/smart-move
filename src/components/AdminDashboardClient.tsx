"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type DashboardStats = {
  TOTAL_VEHICLES: number;
  TOTAL_DRIVERS: number;
  TOTAL_PASSENGERS: number;
  TODAYS_TRIPS: number;
};

type Trip = {
  TRIP_ID: number;
  REG_NUMBER: string;
  DRIVER_NAME: string;
  ORIGIN: string;
  DESTINATION: string;
  DEPARTURE_TIME: string;
  STATUS: string;
};

type DashboardData = {
  stats: DashboardStats;
  recentTrips: Trip[];
};

const initialStats: DashboardStats = {
  TOTAL_VEHICLES: 0,
  TOTAL_DRIVERS: 0,
  TOTAL_PASSENGERS: 0,
  TODAYS_TRIPS: 0,
};

const statItems = [
  {
    label: "Total Vehicles",
    key: "TOTAL_VEHICLES",
    icon: "🚌",
    description: "Registered fleet",
    href: "/vehicles",
    iconBg: "bg-blue-100/80",
  },
  {
    label: "Total Drivers",
    key: "TOTAL_DRIVERS",
    icon: "👨‍✈️",
    description: "Registered drivers",
    href: "/drivers",
    iconBg: "bg-indigo-100/80",
  },
  {
    label: "Passengers",
    key: "TOTAL_PASSENGERS",
    icon: "👥",
    description: "Registered passengers",
    href: "/passengers",
    iconBg: "bg-sky-100/80",
  },
  {
    label: "Today's Trips",
    key: "TODAYS_TRIPS",
    icon: "🛣️",
    description: "Scheduled for today",
    href: "/trips",
    iconBg: "bg-violet-100/80",
  },
] as const;

function formatDeparture(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusStyle(status: string) {
  const normalized = status.trim().toUpperCase();

  if (
    ["COMPLETED", "ACTIVE", "PAID", "PUBLISHED"].includes(normalized)
  ) {
    return "border-emerald-200/80 bg-emerald-50/75 text-emerald-700";
  }

  if (
    ["CANCELLED", "INACTIVE", "FAILED"].includes(normalized)
  ) {
    return "border-red-200/70 bg-red-50/60 text-red-600";
  }

  if (
    ["PENDING", "SCHEDULED", "MAINTENANCE", "BOOKED"].includes(
      normalized
    )
  ) {
    return "border-amber-200/80 bg-amber-50/75 text-amber-700";
  }

  return "border-blue-200/80 bg-blue-50/70 text-blue-700";
}

export default function Home() {
  const [data, setData] = useState<DashboardData>({
    stats: initialStats,
    recentTrips: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not load dashboard data."
        );
      }

      setData({
        stats: {
          ...initialStats,
          ...result.stats,
        },
        recentTrips: Array.isArray(result.recentTrips)
          ? result.recentTrips
          : [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalTrips = data.recentTrips.length;

  return (
    <div className="min-h-screen bg-[#edf3fb]">
      <Sidebar />

      <div className="min-w-0 lg:ml-64">
        <Header />

        <main className="mx-auto max-w-[1700px] space-y-8 p-4 sm:p-6 xl:p-8">
          {/* Welcome section */}
          <section className="relative isolate overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white/90 via-[#edf4ff]/90 to-[#dce9ff]/80 p-6 shadow-[8px_8px_24px_rgba(151,174,207,0.18),-6px_-6px_20px_rgba(255,255,255,0.85)] sm:p-8 xl:p-10">
            <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  TRANSPORT MANAGEMENT SYSTEM
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#19335b] sm:text-4xl xl:text-5xl">
                  Welcome to Smart Move
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-[#7183a1] sm:text-base">
                  Manage your transport operations, monitor your fleet,
                  coordinate trips, and keep everything moving from one
                  workspace.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <span>＋</span>
                    Manage Trips
                    <span>→</span>
                  </Link>

                  <Link
                    href="/reports"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/90 bg-white/65 px-5 py-3 text-sm font-semibold text-[#36547f] shadow-[3px_3px_8px_rgba(151,174,207,0.12)] backdrop-blur transition hover:bg-white/90"
                  >
                    View Reports
                    <span>↗</span>
                  </Link>
                </div>
              </div>

              <div className="hidden min-w-[230px] items-center justify-center lg:flex">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/80 bg-white/35 shadow-[inset_5px_5px_16px_rgba(151,174,207,0.15),inset_-5px_-5px_16px_rgba(255,255,255,0.9)]">
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-blue-500 to-indigo-600 text-7xl shadow-[0_16px_35px_rgba(37,99,235,0.25)]">
                    🚌
                  </div>
                  <div className="absolute right-0 top-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/85 text-xl shadow-lg">
                    📍
                  </div>
                  <div className="absolute bottom-3 left-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/85 text-xl shadow-lg">
                    ↗
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section heading */}
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Overview
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#243b61] sm:text-2xl">
                  Operations at a glance
                </h2>
                <p className="mt-1 text-sm text-[#7183a1]">
                  Live counts from your Oracle database
                </p>
              </div>

              <button
                onClick={() => void loadDashboard()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/90 bg-white/55 px-4 py-2.5 text-sm font-semibold text-[#36547f] shadow-[3px_3px_8px_rgba(151,174,207,0.15),-3px_-3px_8px_rgba(255,255,255,0.8)] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={loading ? "animate-spin" : ""}>↻</span>
                {loading ? "Refreshing..." : "Refresh data"}
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200/70 bg-red-50/70 p-5">
                <p className="font-semibold text-red-700">
                  Unable to load dashboard
                </p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <button
                  onClick={() => void loadDashboard()}
                  className="mt-3 rounded-lg border border-red-200 bg-white/70 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-white"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
              {statItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group rounded-[24px] border border-white/80 bg-white/45 p-5 shadow-[6px_6px_16px_rgba(151,174,207,0.18),-5px_-5px_15px_rgba(255,255,255,0.85)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[9px_9px_22px_rgba(151,174,207,0.22),-6px_-6px_18px_rgba(255,255,255,0.9)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#7183a1]">
                        {item.label}
                      </p>
                      <p className="mt-4 text-3xl font-bold tracking-tight text-[#243b61] sm:text-4xl">
                        {loading
                          ? "—"
                          : Number(
                              data.stats[item.key] ?? 0
                            ).toLocaleString("en-LK")}
                      </p>
                    </div>

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 text-2xl shadow-[3px_3px_8px_rgba(151,174,207,0.15)] ${item.iconBg}`}
                    >
                      {item.icon}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-blue-100/70 pt-4">
                    <p className="text-xs text-[#7183a1]">
                      {item.description}
                    </p>
                    <span className="text-sm text-blue-600 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Shortcuts
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#243b61]">
                Quick access
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  title: "Vehicles",
                  detail: "Manage fleet",
                  icon: "🚌",
                  href: "/vehicles",
                },
                {
                  title: "Drivers",
                  detail: "Driver records",
                  icon: "👨‍✈️",
                  href: "/drivers",
                },
                {
                  title: "Passengers",
                  detail: "Passenger records",
                  icon: "👥",
                  href: "/passengers",
                },
                {
                  title: "Payments",
                  detail: "Payment records",
                  icon: "💳",
                  href: "/payments",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/35 p-4 shadow-[4px_4px_12px_rgba(151,174,207,0.12),-4px_-4px_12px_rgba(255,255,255,0.8)] backdrop-blur transition hover:bg-white/70 sm:p-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-xl shadow-sm">
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#36547f]">
                      {item.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-[#7183a1]">
                      {item.detail}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent trips */}
          <section className="overflow-hidden rounded-[26px] border border-white/80 bg-white/45 p-5 shadow-[6px_6px_18px_rgba(151,174,207,0.16),-5px_-5px_16px_rgba(255,255,255,0.85)] backdrop-blur-xl sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Trip activity
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#243b61] sm:text-2xl">
                  Recent trips
                </h2>
                <p className="mt-1 text-sm text-[#7183a1]">
                  Latest journeys returned by your database
                </p>
              </div>

              <Link
                href="/trips"
                className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100/80"
              >
                All trips →
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/80 bg-white/50 px-4 py-3">
                <p className="text-xs text-[#7183a1]">
                  Displayed trips
                </p>
                <p className="mt-1 text-lg font-bold text-[#243b61]">
                  {loading ? "—" : totalTrips}
                </p>
              </div>

              <div className="rounded-xl border border-white/80 bg-white/50 px-4 py-3">
                <p className="text-xs text-[#7183a1]">
                  Data source
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#36547f]">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Oracle Database
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 animate-pulse space-y-3">
                <div className="h-12 rounded-xl bg-blue-100/60" />
                <div className="h-16 rounded-xl bg-blue-50/80" />
                <div className="h-16 rounded-xl bg-blue-50/80" />
              </div>
            ) : data.recentTrips.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/35 p-10 text-center">
                <div className="text-4xl">🚌</div>
                <h3 className="mt-3 font-semibold text-[#36547f]">
                  No recent trips available
                </h3>
                <p className="mt-2 text-sm text-[#7183a1]">
                  Once trips are available, they will appear here.
                </p>
                <Link
                  href="/trips"
                  className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Open trips
                </Link>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/80 bg-white/30">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-blue-100/80 bg-blue-50/45 text-xs font-semibold uppercase tracking-wider text-[#7183a1]">
                      <th className="px-5 py-4">Trip</th>
                      <th className="px-5 py-4">Route</th>
                      <th className="px-5 py-4">Vehicle</th>
                      <th className="px-5 py-4">Driver</th>
                      <th className="px-5 py-4">Departure</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentTrips.map((trip) => (
                      <tr
                        key={trip.TRIP_ID}
                        className="border-b border-blue-50/90 text-sm transition last:border-0 hover:bg-white/55"
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-1.5 font-bold text-blue-700">
                            #{trip.TRIP_ID}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#36547f]">
                            {trip.ORIGIN || "—"}
                          </p>
                          <p className="mt-1 text-xs text-[#7183a1]">
                            ↓ {trip.DESTINATION || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium text-[#36547f]">
                          {trip.REG_NUMBER || "—"}
                        </td>

                        <td className="px-5 py-4 text-[#60728f]">
                          {trip.DRIVER_NAME || "—"}
                        </td>

                        <td className="px-5 py-4 text-[#60728f]">
                          {formatDeparture(trip.DEPARTURE_TIME)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle(trip.STATUS || "")}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {trip.STATUS || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="pb-2 pt-1 text-center">
            <p className="text-xs text-[#8b9ab3]">
              Smart Move Transport Solutions
              <span className="mx-2">·</span>
              Transport Management Workspace
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}