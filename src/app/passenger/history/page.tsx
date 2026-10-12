"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Booking = {
  TICKET_ID: number;
  SEAT_NO: string | null;
  BOOKING_STATUS: string;
  TICKET_AMOUNT: number | string;
  TRIP_ID: number;
  DEPARTURE_TIME: string;
  ARRIVAL_TIME: string | null;
  TRIP_STATUS: string;
  ORIGIN: string;
  DESTINATION: string;
  AMOUNT_PAID: number | string;
};

type Payment = {
  PAYMENT_ID: number;
  TICKET_ID: number;
  AMOUNT: number | string;
  METHOD: string;
  PAYMENT_STATUS: string;
  PAYMENT_DATE: string | null;
  SEAT_NO: string | null;
  ORIGIN: string;
  DESTINATION: string;
};

type HistoryResponse = {
  bookings: Booking[];
  payments: Payment[];
};

const money = (value: number | string | null | undefined) =>
  `LKR ${Number(value ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: string }) {
  const value = (status || "UNKNOWN").toUpperCase();

  let style = "bg-slate-100 text-slate-700";

  if (["PAID", "CONFIRMED", "BOOKED", "COMPLETED"].includes(value)) {
    style = "bg-emerald-100 text-emerald-700";
  } else if (["PENDING"].includes(value)) {
    style = "bg-amber-100 text-amber-700";
  } else if (["FAILED", "CANCELLED", "REFUNDED"].includes(value)) {
    style = "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export default function PassengerHistoryPage() {
  const [data, setData] = useState<HistoryResponse>({
    bookings: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch("/api/passenger/history", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load history.");
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your history."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, []);

  const filteredBookings = useMemo(() => {
    if (filter === "ALL") return data.bookings;

    return data.bookings.filter(
      (booking) =>
        (booking.BOOKING_STATUS || "").toUpperCase() === filter
    );
  }, [data.bookings, filter]);

  const totalFare = data.bookings.reduce(
    (sum, booking) => sum + Number(booking.TICKET_AMOUNT || 0),
    0
  );

  const totalPaid = data.bookings.reduce(
    (sum, booking) => sum + Number(booking.AMOUNT_PAID || 0),
    0
  );

  const outstanding = data.bookings.reduce(
    (sum, booking) =>
      sum +
      ((booking.BOOKING_STATUS || "").toUpperCase() === "CANCELLED"
        ? 0
        : Math.max(
            0,
            Number(booking.TICKET_AMOUNT || 0) -
              Number(booking.AMOUNT_PAID || 0)
          )),
    0
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading booking and payment history...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Smart Move Transport Solutions
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Booking & Payment History
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review your journeys, ticket fares, and payment transactions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/passenger/my-bookings"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              My Bookings
            </Link>
            <Link
              href="/passenger/dashboard"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Bookings"
            value={data.bookings.length.toString()}
          />
          <SummaryCard
            title="Payment Records"
            value={data.payments.length.toString()}
          />
          <SummaryCard title="Total Ticket Fares" value={money(totalFare)} />
          <SummaryCard title="Total Paid" value={money(totalPaid)} />
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Journey History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your tickets and their payment progress.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              Filter
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="ALL">All bookings</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="BOOKED">Booked</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-10 text-center">
              <p className="font-semibold text-slate-700">
                No bookings found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Your bookings will appear here once you book a trip.
              </p>
              <Link
                href="/passenger/dashboard"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Find a Trip
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const fare = Number(booking.TICKET_AMOUNT || 0);
                const paid = Number(booking.AMOUNT_PAID || 0);
                const cancelled =
                  (booking.BOOKING_STATUS || "").toUpperCase() ===
                  "CANCELLED";

                return (
                  <article
                    key={booking.TICKET_ID}
                    className="rounded-xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Ticket #{booking.TICKET_ID}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">
                          {booking.ORIGIN} → {booking.DESTINATION}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Trip #{booking.TRIP_ID} · Seat{" "}
                          {booking.SEAT_NO || "Not assigned"}
                        </p>
                      </div>
<div className="flex flex-wrap gap-2">
  <StatusBadge status={booking.BOOKING_STATUS} />
  <StatusBadge status={booking.TRIP_STATUS} />
</div>                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoItem
                        label="Departure"
                        value={formatDate(booking.DEPARTURE_TIME)}
                      />
                      <InfoItem
                        label="Ticket Fare"
                        value={money(fare)}
                      />
                      <InfoItem
                        label="Amount Paid"
                        value={money(paid)}
                      />
                      <InfoItem
                        label="Amount Due"
                        value={money(
                          cancelled ? 0 : Math.max(0, fare - paid)
                        )}
                      />
                    </div>

                    {!cancelled && fare - paid > 0 && (
                      <div className="mt-4">
                        <Link
                          href={`/passenger/checkout?ticketId=${encodeURIComponent(
                            booking.TICKET_ID
                          )}`}
                          className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Pay Outstanding Balance
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Payment Transactions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Includes payment attempts recorded for your tickets.
            </p>
          </div>

          {data.payments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-10 text-center">
              <p className="font-semibold text-slate-700">
                No payment records yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Payment transactions will appear here when recorded.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Payment ID</th>
                    <th className="px-4 py-3">Ticket / Route</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr
                      key={payment.PAYMENT_ID}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        #{payment.PAYMENT_ID}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">
                          Ticket #{payment.TICKET_ID}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {payment.ORIGIN} → {payment.DESTINATION}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {payment.PAYMENT_DATE || "Not available"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {(payment.METHOD || "UNKNOWN").replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {money(payment.AMOUNT)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={payment.PAYMENT_STATUS} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-bold text-slate-900">Outstanding balance</h2>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {money(outstanding)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Calculated from non-cancelled tickets and their recorded PAID
            transactions. Refunds are not deducted from this calculation.
          </p>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}