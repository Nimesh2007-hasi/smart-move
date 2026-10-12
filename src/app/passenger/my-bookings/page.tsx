"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type BookingStatus = "CONFIRMED" | "PENDING" | "CANCELLED";

type TripStatus =
  | "SCHEDULED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "UNKNOWN";

type Booking = {
  id: string;
  bookingReference: string;
  route: string;
  travelDate: string;
  departureTime: string;
  seatNumber: string;
  amount: number;
  amountPaid: number;
  paymentStatus: string;
  status: BookingStatus;
  tripStatus: TripStatus;
};

type OracleBooking = {
  TICKET_ID: number;
  SEAT_NO: string;
  BOOKING_STATUS: string;
  ORIGIN: string;
  DESTINATION: string;
  DEPARTURE_TIME: string;
  FARE_AMOUNT: number;
  AMOUNT_PAID: number;
  PAYMENT_STATUS: string;
  TRIP_STATUS?: string;
};

const bookingStatusStyles: Record<BookingStatus, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const tripStatusStyles: Record<TripStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  ONGOING: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  UNKNOWN: "bg-slate-100 text-slate-600",
};

const paymentStatusStyles: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  UNPAID: "bg-slate-100 text-slate-600",
  REFUNDED: "bg-purple-50 text-purple-700",
};

function normalizeTripStatus(value: unknown): TripStatus {
  const status = String(value ?? "").trim().toUpperCase();

  if (
    status === "SCHEDULED" ||
    status === "ONGOING" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  ) {
    return status;
  }

  return "UNKNOWN";
}

function mapBooking(row: OracleBooking): Booking {
  const bookingStatus = String(
    row.BOOKING_STATUS ?? ""
  ).toUpperCase();

  const status: BookingStatus =
    bookingStatus === "CANCELLED"
      ? "CANCELLED"
      : bookingStatus === "CONFIRMED"
        ? "CONFIRMED"
        : "PENDING";

  const departure = String(row.DEPARTURE_TIME ?? "");

  return {
    id: String(row.TICKET_ID),
    bookingReference: `SM-${String(row.TICKET_ID).padStart(6, "0")}`,
    route: `${row.ORIGIN ?? "Unknown"} → ${row.DESTINATION ?? "Unknown"}`,
    travelDate: departure.slice(0, 10),
    departureTime: departure.slice(11, 16),
    seatNumber: String(row.SEAT_NO ?? "N/A"),
    amount: Number(row.FARE_AMOUNT ?? 0),
    amountPaid: Number(row.AMOUNT_PAID ?? 0),
    paymentStatus: String(
      row.PAYMENT_STATUS ?? "UNPAID"
    ).toUpperCase(),
    status,
    tripStatus: normalizeTripStatus(row.TRIP_STATUS),
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function MyBookingsPage() {
  const [filter, setFilter] = useState("ALL");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    const response = await fetch("/api/passenger/bookings", {
      method: "GET",
      cache: "no-store",
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : "Unable to load your bookings.";

      throw new Error(message);
    }

    if (!Array.isArray(data)) {
      throw new Error("The bookings API returned an unexpected response.");
    }

    setBookings((data as OracleBooking[]).map(mapBooking));
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError("");
        await loadBookings();
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your bookings."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [loadBookings]);

  async function retryLoading() {
    setError("");
    setLoading(true);

    try {
      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reload bookings."
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(ticketId: string) {
    const booking = bookings.find((item) => item.id === ticketId);

    if (
      !booking ||
      booking.status === "CANCELLED" ||
      booking.tripStatus === "COMPLETED" ||
      booking.tripStatus === "CANCELLED"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel booking ${booking.bookingReference} for ${booking.route}?`
    );

    if (!confirmed) return;

    setError("");
    setCancellingId(ticketId);

    try {
      const response = await fetch(
        `/api/passenger/bookings/${encodeURIComponent(ticketId)}`,
        {
          method: "PATCH",
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Unable to cancel this booking.";

        throw new Error(message);
      }

      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel this booking."
      );
    } finally {
      setCancellingId(null);
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "ALL") return true;

    if (filter === "COMPLETED") {
      return booking.tripStatus === "COMPLETED";
    }

    return booking.status === filter;
  });

  const totalAmount = bookings.reduce(
    (total, booking) => total + booking.amount,
    0
  );

  const completedTrips = bookings.filter(
    (booking) => booking.tripStatus === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Passenger Portal / Bookings
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            My Bookings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View your booking status, trip progress, tickets, and payments.
          </p>
        </div>

        <Link
          href="/passenger/book-trip"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Book a Trip
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void retryLoading()}
            disabled={loading}
            className="font-semibold underline disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Bookings"
          value={bookings.length}
          icon="▤"
        />

        <SummaryCard
          label="Confirmed Bookings"
          value={bookings.filter((b) => b.status === "CONFIRMED").length}
          icon="✓"
        />

        <SummaryCard
          label="Completed Trips"
          value={completedTrips}
          icon="✓"
        />

        <SummaryCard
          label="Total Ticket Amount"
          value={formatCurrency(totalAmount)}
          icon="₨"
        />
      </div>

      {/* Booking list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              Your Reservations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredBookings.length} booking(s) shown
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter bookings by status"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All Bookings</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending / Booked</option>
            <option value="CANCELLED">Cancelled Bookings</option>
            <option value="COMPLETED">Completed Trips</option>
          </select>
        </div>

        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading bookings from Oracle...
          </p>
        ) : filteredBookings.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl text-slate-300">▤</div>

            <h3 className="mt-3 font-semibold text-slate-900">
              No bookings found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your booking and trip status information will appear here.
            </p>

            <Link
              href="/passenger/book-trip"
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Find a Trip
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBookings.map((booking) => {
              const cannotCancel =
                booking.status === "CANCELLED" ||
                booking.tripStatus === "COMPLETED" ||
                booking.tripStatus === "CANCELLED";

              const canPay =
                !cannotCancel &&
                booking.status !== "CANCELLED" &&
                booking.paymentStatus !== "PAID" &&
                booking.amountPaid < booking.amount;

              return (
                <article
                  key={booking.id}
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    {/* Route and ticket details */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {booking.bookingReference}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            bookingStatusStyles[booking.status]
                          }`}
                        >
                          Booking: {formatStatus(booking.status)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            tripStatusStyles[booking.tripStatus]
                          }`}
                        >
                          Trip: {formatStatus(booking.tripStatus)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {booking.route}
                      </h3>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                        <span>▦ {formatDate(booking.travelDate)}</span>
                        <span>◷ {booking.departureTime}</span>
                        <span>▣ Seat {booking.seatNumber}</span>
                      </div>

                      {booking.tripStatus === "COMPLETED" && (
                        <p className="text-sm font-medium text-emerald-700">
                          This trip has been completed.
                        </p>
                      )}

                      {booking.tripStatus === "CANCELLED" && (
                        <p className="text-sm font-medium text-red-600">
                          This trip has been cancelled.
                        </p>
                      )}
                    </div>

                    {/* Amount and payment information */}
                    <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between lg:border-0 lg:pt-0">
                      <div className="min-w-44">
                        <p className="text-xs text-slate-400">
                          Ticket Amount
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatCurrency(booking.amount)}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Amount paid: {formatCurrency(booking.amountPaid)}
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            paymentStatusStyles[booking.paymentStatus] ??
                            paymentStatusStyles.UNPAID
                          }`}
                        >
                          Payment: {booking.paymentStatus}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canPay && (
                          <Link
                            href={`/passenger/checkout?ticketId=${encodeURIComponent(
                              booking.id
                            )}`}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Pay Now
                          </Link>
                        )}

                        {!cannotCancel && (
                          <button
                            type="button"
                            onClick={() => void cancelBooking(booking.id)}
                            disabled={cancellingId !== null}
                            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancellingId === booking.id
                              ? "Cancelling..."
                              : "Cancel Booking"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Booking status, trip status, ticket amounts, and payment information
        are loaded from Oracle for the signed-in passenger.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
          {icon}
        </span>
      </div>

      <p className="mt-3 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}