import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getCurrentSession } from "@/lib/auth-session";
import { getOraclePool } from "@/lib/oracle";

async function getPassengerId() {
  const session = await getCurrentSession();

  if (session?.role !== "PASSENGER") return null;

  const id = Number(session.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const passengerId = await getPassengerId();

    if (!passengerId) {
      return NextResponse.json(
        { message: "Please log in as a passenger." },
        { status: 401 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const bookingResult = await connection.execute(
      `SELECT
          tk.ticket_id,
          tk.seat_no,
          tk.booking_status,
          tk.amount AS ticket_amount,
          tr.trip_id,
          tr.departure_time,
          tr.arrival_time,
          tr.status AS trip_status,
          r.origin,
          r.destination,
          NVL((
            SELECT SUM(p.amount)
            FROM payment p
            WHERE p.ticket_id = tk.ticket_id
              AND UPPER(p.payment_status) = 'PAID'
          ), 0) AS amount_paid
       FROM ticket tk
       JOIN trip tr ON tr.trip_id = tk.trip_id
       JOIN route r ON r.route_id = tr.route_id
       WHERE tk.passenger_id = :passengerId
       ORDER BY tr.departure_time DESC`,
      { passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const paymentResult = await connection.execute(
      `SELECT
          p.payment_id,
          p.ticket_id,
          p.amount,
          p.method,
          p.payment_status,
          TO_CHAR(p.payment_date, 'YYYY-MM-DD HH24:MI') AS payment_date,
          tk.seat_no,
          r.origin,
          r.destination
       FROM payment p
       JOIN ticket tk ON tk.ticket_id = p.ticket_id
       JOIN trip tr ON tr.trip_id = tk.trip_id
       JOIN route r ON r.route_id = tr.route_id
       WHERE tk.passenger_id = :passengerId
       ORDER BY p.payment_date DESC NULLS LAST, p.payment_id DESC`,
      { passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json({
      bookings: bookingResult.rows ?? [],
      payments: paymentResult.rows ?? [],
    });
  } catch (error) {
    console.error("Passenger history API error:", error);

    return NextResponse.json(
      { message: "Unable to load your booking and payment history." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}
