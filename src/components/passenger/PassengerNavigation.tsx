
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export default function PassengerNavigation({
  items,
  mobile = false,
}: {
  items: NavigationItem[];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Passenger navigation"
      className={
        mobile
          ? "flex gap-2 overflow-x-auto px-3 py-3"
          : "flex flex-col gap-1.5 px-3"
      }
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/passenger/dashboard" &&
            pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                    active
                      ? "bg-blue-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`
                : `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-500/15 text-white shadow-sm ring-1 ring-inset ring-blue-300/15"
                      : "text-blue-100/70 hover:bg-white/[0.07] hover:text-white"
                  }`
            }
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl transition ${
                active
                  ? mobile
                    ? "text-white"
                    : "bg-blue-400/20 text-blue-200"
                  : mobile
                    ? "text-slate-500"
                    : "text-blue-200/70 group-hover:text-white"
              }`}
              aria-hidden="true"
            >
              {item.icon}
            </span>

            <span>{item.label}</span>

            {active && !mobile && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-300" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
