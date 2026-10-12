
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CheckoutDetails = {
  ticketId: number;
  seatNumber: string;
  bookingStatus: string;
  route: string;
  departureTime: string;
  ticketAmount: number;
  amountPaid: number;
  amountDue: number;
};

type PaymentResult = {
  message?: string;
  error?: string;
  amount?: number;
  paymentStatus?: string;
};

const methods = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card (demo)" },
  { value: "ONLINE", label: "Online payment (demo)" },
  { value: "WALLET", label: "Wallet (demo)" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDeparture(value: string) {
  if (!value) return "Not available";

  const [date, time] = value.split("T");

  if (!date) return value;

  const parsed = new Date(`${date}T00:00:00`);

  const formattedDate = Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return time ? `${formattedDate} at ${time}` : formattedDate;
}

export default function PassengerCheckoutPage() {
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [details, setDetails] = useState<CheckoutDetails | null>(null);
  const [method, setMethod] = useState("CARD");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<PaymentResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("ticketId"));

    if (!Number.isInteger(id) || id < 1) {
      setError("A valid ticket ID was not provided.");
      setLoading(false);
      return;
    }

    setTicketId(id);
  }, []);

  useEffect(() => {
    if (ticketId === null) return;

    let active = true;

    async function loadCheckout() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/passenger/checkout?ticketId=${ticketId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load checkout.");
        }

        if (active) {
          setDetails(data as CheckoutDetails);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load checkout details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCheckout();

    return () => {
      active = false;
    };
  }, [ticketId]);

  async function submitPayment() {
    if (ticketId === null || !details) return;

    setError("");
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/passenger/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, method }),
      });

      const data = (await response.json()) as PaymentResult;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to record payment.");
      }

      setSuccess(data);

      // Refresh checkout amounts after a successful payment.
      const refreshed = await fetch(
        `/api/passenger/checkout?ticketId=${ticketId}`,
        { cache: "no-store" }
      );

      if (refreshed.ok) {
        setDetails((await refreshed.json()) as CheckoutDetails);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process this payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        Loading secure checkout...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Passenger Portal / Checkout
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Passenger Checkout
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review your ticket and select a payment method.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <p className="font-semibold">{success.message}</p>
          <p className="mt-1">
            Amount: {formatCurrency(success.amount ?? 0)}
          </p>
          <p className="mt-1">
            Status: {success.paymentStatus}
          </p>
          <Link
            href="/passenger/my-bookings"
            className="mt-3 inline-flex font-semibold underline"
          >
            Return to My Bookings
          </Link>
        </div>
      )}

      {details && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Ticket Details
            </h2>

            <dl className="mt-5 space-y-4">
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Ticket</dt>
                <dd className="font-semibold text-slate-900">
                  SM-{String(details.ticketId).padStart(6, "0")}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Route</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {details.route}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Departure</dt>
                <dd className="text-right text-sm font-medium text-slate-900">
                  {formatDeparture(details.departureTime)}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Seat</dt>
                <dd className="font-semibold text-slate-900">
                  {details.seatNumber}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Ticket fare</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(details.ticketAmount)}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Amount paid</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(details.amountPaid)}
                </dd>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-slate-900">
                    Amount due
                  </dt>
                  <dd className="text-2xl font-bold text-blue-600">
                    {formatCurrency(details.amountDue)}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Payment Method
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {methods.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    method === item.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={item.value}
                    checked={method === item.value}
                    onChange={() => setMethod(item.value)}
                    disabled={submitting || details.amountDue <= 0}
                    className="accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Coursework demonstration only. Card, online, and wallet
              options simulate successful payment; no real money is
              transferred. Cash payments are recorded as pending.
            </p>

            {details.bookingStatus.toUpperCase() === "CANCELLED" && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                This ticket is cancelled and cannot be paid.
              </p>
            )}

            {details.amountDue <= 0 && (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                This ticket has no outstanding balance.
              </p>
            )}

            <button
              type="button"
              onClick={() => void submitPayment()}
              disabled={
                submitting ||
                details.amountDue <= 0 ||
                details.bookingStatus.toUpperCase() === "CANCELLED"
              }
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Processing..."
                : `Pay ${formatCurrency(details.amountDue)}`}
            </button>
          </section>
        </>
      )}

      <Link
        href="/passenger/my-bookings"
        className="inline-flex text-sm font-semibold text-blue-600 hover:underline"
      >
        ← Back to My Bookings
      </Link>
    </div>
  );
}
