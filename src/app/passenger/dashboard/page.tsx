
import Link from "next/link";

const quickActions = [
  {
    title: "Book a Trip",
    description: "Discover destinations and available seats",
    href: "/passenger/book-trip",
    icon: "⌕",
    color: "bg-blue-50 text-blue-700",
  },
  {
    title: "My Bookings",
    description: "Manage reservations and tickets",
    href: "/passenger/my-bookings",
    icon: "▤",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Travel History",
    description: "Review past journeys and payments",
    href: "/passenger/history",
    icon: "◷",
    color: "bg-violet-50 text-violet-700",
  },
  {
    title: "My Profile",
    description: "Manage your personal information",
    href: "/passenger/profile",
    icon: "♙",
    color: "bg-amber-50 text-amber-700",
  },
  {
    title: "Payments",
    description: "Find unpaid bookings and continue checkout",
    href: "/passenger/my-bookings",
    icon: "▣",
    color: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Rate Your Trip",
    description: "Share feedback about your journey",
    href: "/passenger/reviews",
    icon: "☆",
    color: "bg-rose-50 text-rose-700",
  },
];

const highlights = [
  {
    number: "01",
    title: "Plan your journey",
    description:
      "Explore available trips and choose a journey that fits your schedule.",
    href: "/passenger/book-trip",
    action: "Explore trips",
    icon: "↗",
    color: "bg-blue-50 text-blue-700",
  },
  {
    number: "02",
    title: "Stay organized",
    description:
      "Keep track of your reservations, ticket details, and payment status.",
    href: "/passenger/my-bookings",
    action: "Manage bookings",
    icon: "▤",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    number: "03",
    title: "Travel with confidence",
    description:
      "Review your previous journeys and share your travel experience.",
    href: "/passenger/history",
    action: "View history",
    icon: "◷",
    color: "bg-violet-50 text-violet-700",
  },
];

export default function PassengerDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fc] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              Smart Move · Passenger portal
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Your travel dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Everything you need for a smoother journey, all in one place.
            </p>
          </div>

          <Link
            href="/passenger/book-trip"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-800 sm:self-center"
          >
            <span className="text-lg">＋</span>
            Book a new trip
          </Link>
        </header>

        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#10285c] via-[#1746a2] to-[#3779ec] px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-10 sm:py-11 lg:px-12">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full border-[45px] border-white/[0.07]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-36 right-1/4 -z-10 h-80 w-80 rounded-full bg-cyan-300/[0.08] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute right-8 top-8 hidden text-[150px] font-extralight leading-none text-white/[0.08] lg:block"
          >
            ↗
          </div>

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Your next journey starts here
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Make every
              <br className="hidden sm:block" /> journey count.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-blue-100 sm:text-base">
              Find your next destination, keep your bookings organized, and
              manage your travel plans with Smart Move.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/passenger/book-trip"
                className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow-sm transition hover:bg-blue-50"
              >
                Explore journeys
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/passenger/my-bookings"
                className="inline-flex items-center gap-3 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                My bookings
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="relative mt-9 grid max-w-xl grid-cols-3 gap-3 border-t border-white/15 pt-5 sm:mt-11">
            <div>
              <p className="text-xs text-blue-200">Explore</p>
              <p className="mt-1 text-sm font-semibold sm:text-base">
                Available trips
              </p>
            </div>
            <div className="border-l border-white/15 pl-3">
              <p className="text-xs text-blue-200">Manage</p>
              <p className="mt-1 text-sm font-semibold sm:text-base">
                Your bookings
              </p>
            </div>
            <div className="border-l border-white/15 pl-3">
              <p className="text-xs text-blue-200">Stay updated</p>
              <p className="mt-1 text-sm font-semibold sm:text-base">
                Travel history
              </p>
            </div>
          </div>
        </section>

        {/* Quick access */}
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Quick access
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                Everything within reach
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Choose a service to get started
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex min-h-[142px] items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition group-hover:scale-105 ${item.color}`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      {item.title}
                    </span>
                    <span
                      className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-700"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-slate-500">
                    {item.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <section>
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Your travel, simplified
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              A smoother way to travel
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.number}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold ${item.color}`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold tracking-widest text-slate-300">
                    {item.number}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <Link
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition group-hover:gap-3"
                >
                  {item.action}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Help banner */}
        <section className="flex flex-col gap-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-blue-700 shadow-sm"
              aria-hidden="true"
            >
              i
            </span>
            <div>
              <h2 className="font-bold text-slate-900">
                Keep your travel plans organized
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Check your bookings for ticket details and unpaid reservations.
                Visit your history to review previous journeys and payment
                records.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 sm:pl-4">
            <Link
              href="/passenger/my-bookings"
              className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              View bookings
            </Link>
            <Link
              href="/passenger/history"
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-100"
            >
              Travel history
            </Link>
          </div>
        </section>

        <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
          © 2026 Smart Move Transport Solutions
          <span className="mx-2">·</span>
          Making every journey easier
        </footer>
      </div>
    </main>
  );
}
