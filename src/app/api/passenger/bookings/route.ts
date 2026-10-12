import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";
import { hasRole } from "@/lib/auth-session";

export async function GET() {
  const session = await hasRole("PASSENGER");

  if (!session) {
    return NextResponse.json(
      { error: "Please log in as a passenger." },
      { status: 401 }
    );
  }

  const passengerId = Number(session.id);

  if (!Number.isInteger(passengerId) || passengerId <= 0) {
    return NextResponse.json(
      { error: "Invalid passenger session." },
      { status: 401 }
    );
  }

  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT
         tk.ticket_id AS TICKET_ID,
         tk.seat_no AS SEAT_NO,
         tk.booking_status AS BOOKING_STATUS,
         tk.trip_id AS TRIP_ID,

         TO_CHAR(
           t.departure_time,
           'YYYY-MM-DD"T"HH24:MI'
         ) AS DEPARTURE_TIME,

         TO_CHAR(
           t.arrival_time,
           'YYYY-MM-DD"T"HH24:MI'
         ) AS ARRIVAL_TIME,

         r.origin AS ORIGIN,
         r.destination AS DESTINATION,

         tk.amount AS FARE_AMOUNT,

         UPPER(t.status) AS TRIP_STATUS,

         NVL((
           SELECT SUM(p.amount)
           FROM payment p
           WHERE p.ticket_id = tk.ticket_id
             AND UPPER(p.payment_status) = 'PAID'
         ), 0) AS AMOUNT_PAID,

         CASE
           WHEN NVL((
             SELECT SUM(p.amount)
             FROM payment p
             WHERE p.ticket_id = tk.ticket_id
               AND UPPER(p.payment_status) = 'PAID'
           ), 0) >= NVL(tk.amount, 0)
             AND NVL(tk.amount, 0) > 0
             THEN 'PAID'

           WHEN EXISTS (
             SELECT 1
             FROM payment p
             WHERE p.ticket_id = tk.ticket_id
               AND UPPER(p.payment_status) = 'PENDING'
           )
             THEN 'PENDING'

           WHEN EXISTS (
             SELECT 1
             FROM payment p
             WHERE p.ticket_id = tk.ticket_id
               AND UPPER(p.payment_status) = 'PAID'
           )
             THEN 'PAID'

           ELSE 'UNPAID'
         END AS PAYMENT_STATUS

       FROM ticket tk
       JOIN trip t
         ON t.trip_id = tk.trip_id
       JOIN route r
         ON r.route_id = t.route_id

       WHERE tk.passenger_id = :passengerId

       ORDER BY t.departure_time DESC`,
      { passengerId },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    return NextResponse.json(result.rows ?? [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Load passenger bookings error:", error);

    return NextResponse.json(
      { error: "Unable to load your bookings." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Close passenger bookings connection error:", error);
      }
    }
  }
}

export async function POST(request: Request) {
  const session = await hasRole("PASSENGER");

  if (!session) {
    return NextResponse.json(
      { error: "Please log in as a passenger." },
      { status: 401 }
    );
  }

  const passengerId = Number(session.id);

  if (!Number.isInteger(passengerId) || passengerId <= 0) {
    return NextResponse.json(
      { error: "Invalid passenger session." },
      { status: 401 }
    );
  }

  let connection: oracledb.Connection | undefined;
  let transactionStarted = false;

  try {
    const body = await request.json();
    const tripId = Number(body.tripId);

    if (!Number.isInteger(tripId) || tripId <= 0) {
      return NextResponse.json(
        { error: "A valid trip ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    // Only future scheduled trips can be booked.
    const tripResult = await connection.execute(
      `SELECT
         t.trip_id AS TRIP_ID,
         v.capacity AS CAPACITY,
         t.fare AS FARE
       FROM trip t
       JOIN vehicle v
         ON v.vehicle_id = t.vehicle_id
       WHERE t.trip_id = :tripId
         AND UPPER(t.status) = 'SCHEDULED'
         AND t.departure_time > SYSTIMESTAMP
       FOR UPDATE OF t.trip_id`,
      { tripId },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    const trip = tripResult.rows?.[0] as
      | {
          TRIP_ID: number;
          CAPACITY: number;
          FARE: number | string;
        }
      | undefined;

    if (!trip) {
      return NextResponse.json(
        { error: "This trip is unavailable for booking." },
        { status: 404 }
      );
    }

    const fare = Number(trip.FARE);
    const capacity = Number(trip.CAPACITY);

    if (!Number.isFinite(fare) || fare <= 0) {
      return NextResponse.json(
        { error: "This trip does not have a valid fare configured." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return NextResponse.json(
        { error: "The vehicle capacity is not configured correctly." },
        { status: 400 }
      );
    }

    // Include cancelled tickets because their seat numbers may still
    // be protected by a database unique constraint.
    const seatsResult = await connection.execute(
      `SELECT seat_no AS SEAT_NO
       FROM ticket
       WHERE trip_id = :tripId`,
      { tripId },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    const takenSeats = new Set(
      (seatsResult.rows ?? []).map((row) =>
        String(
          (row as { SEAT_NO: string | null }).SEAT_NO ?? ""
        )
          .trim()
          .toUpperCase()
      )
    );

    let seatNo: string | null = null;

    for (let number = 1; number <= capacity; number++) {
      const candidate = `S${String(number).padStart(2, "0")}`;

      if (!takenSeats.has(candidate)) {
        seatNo = candidate;
        break;
      }
    }

    if (!seatNo) {
      return NextResponse.json(
        {
          error:
            "No unused seat number is available for this trip. Please contact the administrator.",
        },
        { status: 409 }
      );
    }

    transactionStarted = true;

    const insertResult = await connection.execute(
      `INSERT INTO ticket (
         seat_no,
         booking_status,
         trip_id,
         passenger_id,
         amount
       )
       VALUES (
         :seatNo,
         'BOOKED',
         :tripId,
         :passengerId,
         :amount
       )
       RETURNING ticket_id INTO :ticketId`,
      {
        seatNo,
        tripId,
        passengerId,
        amount: fare,
        ticketId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },
      }
    );

    const output = insertResult.outBinds as {
      ticketId: number[];
    };

    const ticketId = output.ticketId[0];

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        message: "Booking created successfully.",
        ticketId,
        tripId,
        seatNo,
        status: "BOOKED",
        amount: fare,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Booking rollback error:", rollbackError);
      }
    }

    const oracleError = error as {
      errorNum?: number;
      message?: string;
    };

    if (oracleError.errorNum === 1) {
      return NextResponse.json(
        {
          error:
            "That seat was assigned to another booking. Please try booking again.",
        },
        { status: 409 }
      );
    }

    console.error("Create passenger booking error:", error);

    return NextResponse.json(
      {
        error: "Unable to create the booking. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Close booking connection error:", error);
      }
    }
  }
}