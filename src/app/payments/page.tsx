
"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Payment = {
  PAYMENT_ID: number;
  TICKET_ID: number;
  PASSENGER_NAME: string;
  PAYMENT_DATE: string;
  AMOUNT: number;
  METHOD: string;
  PAYMENT_STATUS: string;
};

type Ticket = {
  TICKET_ID: number;
  PASSENGER_ID?: number;
  PASSENGER_NAME?: string;
  SEAT_NO?: string;
  ORIGIN?: string;
  DESTINATION?: string;
  AMOUNT: number;
  BOOKING_STATUS?: string;
};

const methods = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE"];

const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];

function formatLKR(value: number | string | null | undefined) {
  return `LKR ${Number(value ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function displayText(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function badgeClass(status: string) {
  if (status === "PAID") return "neu-badge neu-badge-active";
  if (status === "REFUNDED" || status === "FAILED") {
    return "neu-badge neu-badge-maintenance";
  }
  return "neu-badge";
}

function currentLocalDateTime() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  // Oracle APIs commonly return YYYY-MM-DD HH:mm or YYYY-MM-DDTHH:mm.
  const normalized = value.replace(" ", "T");
  return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [ticketId, setTicketId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
const [paymentDate, setPaymentDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const labelClass = "mb-2 block text-sm font-medium text-[#44506a]";
  const inputClass = "neu-input w-full px-4 py-3";

  const readJson = async (response: Response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [paymentResponse, ticketResponse] = await Promise.all([
        fetch("/api/payments", { cache: "no-store" }),
        fetch("/api/tickets", { cache: "no-store" }),
      ]);

      const [paymentData, ticketData] = await Promise.all([
        readJson(paymentResponse),
        readJson(ticketResponse),
      ]);

      setPayments(paymentData);
      setTickets(ticketData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load payment data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);
  useEffect(() => {
  setPaymentDate(currentLocalDateTime());
}, []);

  function resetForm() {
    setTicketId("");
    setAmount("");
    setMethod("CASH");
    setPaymentStatus("PENDING");
    setPaymentDate(currentLocalDateTime());
    setEditingId(null);
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEdit(payment: Payment) {
    setEditingId(payment.PAYMENT_ID);
    setTicketId(String(payment.TICKET_ID));
    setAmount(String(payment.AMOUNT ?? ""));
    setMethod(payment.METHOD);
    setPaymentStatus(payment.PAYMENT_STATUS);
    setPaymentDate(toDateTimeLocal(payment.PAYMENT_DATE));
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function handleTicketChange(value: string) {
    setTicketId(value);

    // Suggest the ticket's saved fare for new payments.
    // The amount remains editable to support partial payments.
    if (editingId === null) {
      const selectedTicket = tickets.find(
        (ticket) => String(ticket.TICKET_ID) === value
      );

      setAmount(
        selectedTicket ? String(selectedTicket.AMOUNT ?? "") : ""
      );
    }
  }

  const selectedTicket = tickets.find(
    (ticket) => String(ticket.TICKET_ID) === ticketId
  );

  async function savePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const amountValue = Number(amount);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }

    if (!ticketId) {
      setError("Please select a ticket.");
      return;
    }

    if (!paymentDate) {
      setError("Please select the payment date and time.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/payments", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { payment_id: editingId } : {}),
          ticket_id: Number(ticketId),
          amount: amountValue,
          method,
          payment_status: paymentStatus,
          payment_date: paymentDate,
        }),
      });

      await readJson(response);

      resetForm();

      setSuccess(
        isEditing
          ? "Payment updated successfully."
          : "Payment recorded successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save payment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(id: number) {
    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/payments?id=${id}`, {
        method: "DELETE",
      });

      await readJson(response);

      setSuccess("Payment deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete payment."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-64">
        <Header />

        <main className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#44506a]">
                Payments
              </h1>
              <p className="mt-2 text-[#7a869a]">
                Record and manage Smart Move ticket payments.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void loadData()}
                disabled={loading}
                className="neu-btn px-5 py-3 disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>

              <button
                onClick={startAdd}
                className="neu-btn px-5 py-3 text-indigo-600"
              >
                + Add Payment
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="neu-flat mt-6 p-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="neu-flat mt-6 p-4 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {showForm && (
            <section className="neu-flat mt-8 p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                {editingId !== null ? "Edit Payment" : "Record Payment"}
              </h2>

              <form
                onSubmit={savePayment}
                className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div>
                  <label className={labelClass} htmlFor="paymentTicket">
                    Ticket *
                  </label>

                  <select
                    id="paymentTicket"
                    value={ticketId}
                    onChange={(e) => handleTicketChange(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select ticket</option>

                    {tickets.map((ticket) => (
                      <option
                        key={ticket.TICKET_ID}
                        value={ticket.TICKET_ID}
                      >
                        Ticket #{ticket.TICKET_ID}
                        {ticket.PASSENGER_NAME
                          ? ` — ${ticket.PASSENGER_NAME}`
                          : ""}
                        {ticket.SEAT_NO ? ` — Seat ${ticket.SEAT_NO}` : ""}
                        {` — ${formatLKR(ticket.AMOUNT)}`}
                      </option>
                    ))}
                  </select>

                  {selectedTicket && (
                    <p className="mt-2 text-sm text-[#7a869a]">
                      Ticket fare:{" "}
                      <span className="font-semibold text-[#44506a]">
                        {formatLKR(selectedTicket.AMOUNT)}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="paymentAmount">
                    Payment Amount (LKR) *
                  </label>

                  <input
                    id="paymentAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    required
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-[#7a869a]">
                    The suggested amount is the ticket fare. Change it if
                    recording a partial payment.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="paymentMethod">
                    Payment Method *
                  </label>

                  <select
                    id="paymentMethod"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    required
                    className={inputClass}
                  >
                    {methods.map((item) => (
                      <option key={item} value={item}>
                        {displayText(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="paymentStatus">
                    Payment Status *
                  </label>

                  <select
                    id="paymentStatus"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    required
                    className={inputClass}
                  >
                    {paymentStatuses.map((item) => (
                      <option key={item} value={item}>
                        {displayText(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="paymentDate">
                    Payment Date and Time *
                  </label>

                  <input
                    id="paymentDate"
                    type="datetime-local"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex items-end gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Payment"
                        : "Save Payment"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="neu-btn px-5 py-3 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="neu-flat mt-10 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#44506a]">
                Payment Records
              </h2>

              <p className="mt-1 text-sm text-[#7a869a]">
                Payment amounts show the recorded transaction, which may
                differ from the full ticket fare.
              </p>
            </div>

            <div className="overflow-x-auto px-6 pb-6">
              <div className="neu-pressed overflow-hidden">
                <table className="neu-table w-full min-w-[1100px]">
                  <thead>
                    <tr className="text-left text-sm text-[#7a869a]">
                      {[
                        "ID",
                        "Ticket",
                        "Passenger",
                        "Payment Date",
                        "Amount (LKR)",
                        "Method",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 font-semibold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {!loading && payments.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-10 text-center text-[#7a869a]"
                        >
                          No payment records found.
                        </td>
                      </tr>
                    )}

                    {payments.map((payment) => (
                      <tr key={payment.PAYMENT_ID}>
                        <td className="px-5 py-4">
                          {payment.PAYMENT_ID}
                        </td>

                        <td className="px-5 py-4">
                          #{payment.TICKET_ID}
                        </td>

                        <td className="px-5 py-4">
                          {payment.PASSENGER_NAME || "—"}
                        </td>

                        <td className="px-5 py-4">
                          {payment.PAYMENT_DATE?.replace("T", " ") || "—"}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {formatLKR(payment.AMOUNT)}
                        </td>

                        <td className="px-5 py-4">
                          {displayText(payment.METHOD)}
                        </td>

                        <td className="px-5 py-4">
                          <span className={badgeClass(payment.PAYMENT_STATUS)}>
                            {displayText(payment.PAYMENT_STATUS)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(payment)}
                              className="neu-btn px-3 py-2 text-sm text-indigo-600"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                void deletePayment(payment.PAYMENT_ID)
                              }
                              disabled={deletingId === payment.PAYMENT_ID}
                              className="neu-btn px-3 py-2 text-sm text-red-500 disabled:opacity-50"
                            >
                              {deletingId === payment.PAYMENT_ID
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {loading && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-10 text-center text-[#7a869a]"
                        >
                          Loading payments from Oracle...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
