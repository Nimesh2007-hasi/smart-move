
"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

type Ticket = {
  TICKET_ID: number;
  PASSENGER_ID: number;
  PASSENGER_NAME: string;
  TRIP_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  DEPARTURE_TIME: string;
  SEAT_NO: string;
  BOOKING_STATUS: string;
  AMOUNT: number;
  TRIP_FARE?: number;
};

type Passenger = {
  PASSENGER_ID: number;
  NAME: string;
};

type TripOption = {
  TRIP_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  DEPARTURE_TIME: string;
  FARE: number;
  STATUS: string;
};

const statuses = ["BOOKED", "CONFIRMED", "CANCELLED"];

function formatLKR(value: number | string | null | undefined) {
  return `LKR ${Number(value ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function displayStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function badgeClass(status: string) {
  if (status === "CONFIRMED") return "neu-badge neu-badge-active";
  if (status === "CANCELLED") return "neu-badge neu-badge-maintenance";
  return "neu-badge";
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [trips, setTrips] = useState<TripOption[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [passengerId, setPassengerId] = useState("");
  const [tripId, setTripId] = useState("");
  const [seatNo, setSeatNo] = useState("");
  const [bookingStatus, setBookingStatus] = useState("BOOKED");

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
      const [ticketResponse, passengerResponse, tripResponse] =
        await Promise.all([
          fetch("/api/tickets", { cache: "no-store" }),
          fetch("/api/passengers", { cache: "no-store" }),
          fetch("/api/trips?view=admin", { cache: "no-store" }),
        ]);

      const [ticketData, passengerData, tripData] = await Promise.all([
        readJson(ticketResponse),
        readJson(passengerResponse),
        readJson(tripResponse),
      ]);

      setTickets(ticketData);
      setPassengers(passengerData);
      setTrips(tripData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load ticket data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setPassengerId("");
    setTripId("");
    setSeatNo("");
    setBookingStatus("BOOKED");
    setEditingId(null);
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEdit(ticket: Ticket) {
    setEditingId(ticket.TICKET_ID);
    setPassengerId(String(ticket.PASSENGER_ID));
    setTripId(String(ticket.TRIP_ID));
    setSeatNo(ticket.SEAT_NO);
    setBookingStatus(ticket.BOOKING_STATUS);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  const selectedTrip = trips.find(
    (trip) => String(trip.TRIP_ID) === tripId
  );

  async function saveTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/tickets", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { ticket_id: editingId } : {}),
          passenger_id: Number(passengerId),
          trip_id: Number(tripId),
          seat_no: seatNo.trim().toUpperCase(),
          booking_status: bookingStatus,
        }),
      });

      await readJson(response);

      resetForm();

      setSuccess(
        isEditing
          ? "Ticket updated successfully."
          : "Ticket created successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save ticket."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTicket(id: number) {
    if (!window.confirm("Are you sure you want to delete this ticket?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/tickets?id=${id}`, {
        method: "DELETE",
      });

      await readJson(response);

      setSuccess("Ticket deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete ticket."
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
              <h1 className="text-3xl font-bold text-[#44506a]">Tickets</h1>
              <p className="mt-2 text-[#7a869a]">
                Manage passenger tickets and ticket amounts.
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
                + Add Ticket
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
                {editingId !== null ? "Edit Ticket" : "Create Ticket"}
              </h2>

              <form
                onSubmit={saveTicket}
                className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
              >
                <div>
                  <label className={labelClass} htmlFor="ticketPassenger">
                    Passenger *
                  </label>

                  <select
                    id="ticketPassenger"
                    value={passengerId}
                    onChange={(e) => setPassengerId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select passenger</option>

                    {passengers.map((passenger) => (
                      <option
                        key={passenger.PASSENGER_ID}
                        value={passenger.PASSENGER_ID}
                      >
                        {passenger.NAME} (ID: {passenger.PASSENGER_ID})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="ticketTrip">
                    Trip *
                  </label>

                  <select
                    id="ticketTrip"
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select trip</option>

                    {trips
                      .filter(
                        (trip) =>
                          trip.STATUS !== "CANCELLED" ||
                          String(trip.TRIP_ID) === tripId
                      )
                      .map((trip) => (
                        <option
                          key={trip.TRIP_ID}
                          value={trip.TRIP_ID}
                        >
                          #{trip.TRIP_ID} — {trip.ORIGIN} to{" "}
                          {trip.DESTINATION} —{" "}
                          {trip.DEPARTURE_TIME?.replace("T", " ")}
                        </option>
                      ))}
                  </select>

                  {selectedTrip && (
                    <p className="mt-2 text-sm font-medium text-indigo-600">
                      Fare per ticket: {formatLKR(selectedTrip.FARE)}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-[#7a869a]">
                    The ticket amount is saved from the selected trip’s fare.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="ticketSeat">
                    Seat Number *
                  </label>

                  <input
                    id="ticketSeat"
                    type="text"
                    value={seatNo}
                    onChange={(e) => setSeatNo(e.target.value)}
                    placeholder="e.g. A05"
                    maxLength={20}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="ticketStatus">
                    Booking Status *
                  </label>

                  <select
                    id="ticketStatus"
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value)}
                    required
                    className={inputClass}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {displayStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-4 md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="neu-btn px-5 py-3 text-indigo-600 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Ticket"
                        : "Save Ticket"}
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
                Ticket Records
              </h2>

              <p className="mt-1 text-sm text-[#7a869a]">
                Amounts are stored in Oracle when tickets are created or
                updated.
              </p>
            </div>

            <div className="overflow-x-auto px-6 pb-6">
              <div className="neu-pressed overflow-hidden">
                <table className="neu-table w-full min-w-[1150px]">
                  <thead>
                    <tr className="text-left text-sm text-[#7a869a]">
                      {[
                        "ID",
                        "Passenger",
                        "Trip",
                        "Departure",
                        "Seat",
                        "Amount (LKR)",
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
                    {!loading && tickets.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-10 text-center text-[#7a869a]"
                        >
                          No tickets found.
                        </td>
                      </tr>
                    )}

                    {tickets.map((ticket) => (
                      <tr key={ticket.TICKET_ID}>
                        <td className="px-5 py-4">
                          {ticket.TICKET_ID}
                        </td>

                        <td className="px-5 py-4">
                          {ticket.PASSENGER_NAME}
                        </td>

                        <td className="px-5 py-4">
                          {ticket.ORIGIN} - {ticket.DESTINATION}
                        </td>

                        <td className="px-5 py-4">
                          {ticket.DEPARTURE_TIME?.replace("T", " ")}
                        </td>

                        <td className="px-5 py-4">{ticket.SEAT_NO}</td>

                        <td className="px-5 py-4 font-medium">
                          {formatLKR(ticket.AMOUNT)}
                        </td>

                        <td className="px-5 py-4">
                          <span className={badgeClass(ticket.BOOKING_STATUS)}>
                            {displayStatus(ticket.BOOKING_STATUS)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(ticket)}
                              className="neu-btn px-3 py-2 text-sm text-indigo-600"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => void deleteTicket(ticket.TICKET_ID)}
                              disabled={deletingId === ticket.TICKET_ID}
                              className="neu-btn px-3 py-2 text-sm text-red-500 disabled:opacity-50"
                            >
                              {deletingId === ticket.TICKET_ID
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
                          Loading tickets from Oracle...
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
