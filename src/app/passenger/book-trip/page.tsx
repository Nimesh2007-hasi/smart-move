
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type OracleTrip = {
  TRIP_ID: number;
  ORIGIN: string;
  DESTINATION: string;
  DEPARTURE_TIME: string;
  ARRIVAL_TIME: string;
  REG_NUMBER: string;
  AVAILABLE_SEATS: number;
  STATUS: string;
  FARE: number | string;
};

type Trip = {
  id: string;
  from: string;
  to: string;
  date: string;
  departure: string;
  arrival: string;
  duration: string;
  vehicle: string;
  availableSeats: number;
  fare: number;
  status: string;
};

const cities = [
  "Colombo",
  "Galle",
  "Kandy",
  "Matara",
  "Negombo",
  "Nuwara Eliya",
];

function mapTrip(row: OracleTrip): Trip {
  const departure = row.DEPARTURE_TIME;
  const arrival = row.ARRIVAL_TIME;

  const start = new Date(`${departure}:00`);
  const end = new Date(`${arrival}:00`);

  const minutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000)
  );

  return {
    id: String(row.TRIP_ID),
    from: row.ORIGIN,
    to: row.DESTINATION,
    date: departure.slice(0, 10),
    departure: departure.slice(11, 16),
    arrival: arrival.slice(11, 16),
    duration: `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
    vehicle: row.REG_NUMBER,
    availableSeats: Number(row.AVAILABLE_SEATS ?? 0),
    fare: Number(row.FARE ?? 0),
    status: row.STATUS,
  };
}

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BookTripPage() {
  const [from, setFrom] = useState("Colombo");
  const [to, setTo] = useState("Galle");
  const [date, setDate] = useState("2026-10-16");
  const [passengers, setPassengers] = useState("1");

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTrips() {
    const response = await fetch("/api/trips", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load trips.");
    }

    if (!Array.isArray(data)) {
      throw new Error("The trips API returned an unexpected response.");
    }

    setAllTrips((data as OracleTrip[]).map(mapTrip));
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/trips", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load trips.");
        }

        if (!Array.isArray(data)) {
          throw new Error("The trips API returned an unexpected response.");
        }

        if (active) {
          setAllTrips((data as OracleTrip[]).map(mapTrip));
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load trips."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const results = allTrips.filter((trip) => {
    const departureTime = new Date(
      `${trip.date}T${trip.departure}:00`
    ).getTime();

    return (
      trip.from.toLowerCase() === from.toLowerCase() &&
      trip.to.toLowerCase() === to.toLowerCase() &&
      trip.date === date &&
      trip.availableSeats >= Number(passengers) &&
      trip.status === "SCHEDULED" &&
      departureTime > Date.now()
    );
  });

  function swapLocations() {
    setFrom(to);
    setTo(from);
    setSearched(false);
    setBookingId(null);
    setMessage("");
    setError("");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingId(null);
    setMessage("");
    setError("");
    setSearched(true);
  }

  async function handleBooking(trip: Trip) {
    setError("");
    setMessage("");
    setBookingId(null);

    if (trip.fare <= 0) {
      setError("This trip does not have a valid fare configured.");
      return;
    }

    if (trip.availableSeats < Number(passengers)) {
      setError("There are not enough seats available for this trip.");
      return;
    }

    setBookingId(trip.id);

    try {
      const response = await fetch("/api/passenger/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: Number(trip.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to book this trip.");
      }

      setMessage(
        `Booking successful! Ticket ID: ${data.ticketId}. Seat: ${data.seatNo}. Fare: ${formatCurrency(Number(data.amount))}. Status: ${data.status}.`
      );

      setSearched(true);

      await loadTrips();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to book this trip."
      );
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Passenger Portal / Book a Trip
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Find Your Next Journey
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Search scheduled trips and view fares loaded from Oracle.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-900">Search Trips</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select your route, travel date, and passenger count.
        </p>

        <form onSubmit={handleSearch} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Departure city
              </span>
              <select
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={swapLocations}
              title="Swap locations"
              aria-label="Swap departure and destination"
              className="h-12 rounded-xl border border-slate-200 px-4 text-lg text-blue-600 hover:bg-blue-50"
            >
              ⇄
            </button>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Destination city
              </span>
              <select
                value={to}
                onChange={(event) => setTo(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Travel date
              </span>
              <input
                type="date"
                value={date}
                min={getLocalDate()}
                onChange={(event) => setDate(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Passengers
              </span>
              <select
                value={passengers}
                onChange={(event) => setPassengers(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Passenger" : "Passengers"}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-400">
                The current booking API creates one ticket per booking.
              </span>
            </label>
          </div>

          {from === to && (
            <p role="alert" className="text-sm text-red-600">
              Departure and destination must be different.
            </p>
          )}

          <button
            type="submit"
            disabled={from === to || loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
          >
            Search Available Trips
          </button>
        </form>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {message}
        </p>
      )}

      {loading && (
        <p className="text-sm text-slate-500">
          Loading trips from Oracle...
        </p>
      )}

      {searched && !loading && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Available Trips
            </h2>
            <p className="text-sm text-slate-500">
              {results.length} trip(s) found
            </p>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="text-4xl">🚌</div>
              <h3 className="mt-3 font-bold text-slate-900">
                No trips found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another route or travel date. Only future scheduled trips
                with enough seats are shown.
              </p>
            </div>
          ) : (
            results.map((trip) => (
              <article
                key={trip.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Trip #{trip.id}
                      </span>
                      <span className="text-sm text-slate-500">
                        Vehicle: {trip.vehicle}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {trip.departure}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {trip.from}
                        </p>
                      </div>

                      <div className="px-2 text-center">
                        <p className="text-xs text-slate-400">
                          {trip.duration}
                        </p>
                        <div className="mt-2 flex items-center">
                          <div className="h-px flex-1 bg-slate-300" />
                          <span className="px-2 text-blue-600">➜</span>
                          <div className="h-px flex-1 bg-slate-300" />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">
                          {trip.arrival}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {trip.to}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span>Travel date: {trip.date}</span>
                      <span>{trip.availableSeats} seat(s) available</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 lg:min-w-52 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <p className="text-sm text-slate-500">
                      Trip fare per passenger
                    </p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatCurrency(trip.fare)}
                    </p>

                    {trip.fare <= 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        Fare not configured
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={
                        bookingId !== null ||
                        trip.fare <= 0 ||
                        trip.availableSeats < Number(passengers)
                      }
                      onClick={() => void handleBooking(trip)}
                      className="mt-3 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {bookingId === trip.id ? "Booking..." : "Book Trip"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      <p className="text-xs text-slate-400">
        Trip details, fares, and seat availability are retrieved from Oracle.
      </p>
    </div>
  );
}
