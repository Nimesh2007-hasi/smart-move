
import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";
import { hasRole } from "@/lib/auth-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const session = await hasRole("PASSENGER");

  if (!session) {
    return NextResponse.json(
      { error: "Please log in as a passenger." },
      { status: 401 }
    );
  }

  const passengerId = Number(session.id);
  const { id } = await params;
  const ticketId = Number(id);

  if (
    !Number.isInteger(passengerId) ||
    passengerId <= 0 ||
    !Number.isInteger(ticketId) ||
    ticketId <= 0
  ) {
    return NextResponse.json(
      { error: "Invalid passenger or ticket ID." },
      { status: 400 }
    );
  }

  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `UPDATE ticket
       SET booking_status = 'CANCELLED'
       WHERE ticket_id = :ticketId
         AND passenger_id = :passengerId
         AND booking_status IN ('BOOKED', 'CONFIRMED')
         AND trip_id IN (
           SELECT trip_id
           FROM trip
           WHERE departure_time > SYSDATE
         )`,
      { ticketId, passengerId },
      { autoCommit: true }
    );

    if (!result.rowsAffected) {
      return NextResponse.json(
        {
          error:
            "Booking not found, already cancelled, or no longer eligible for cancellation."
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Booking cancelled successfully."
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return NextResponse.json(
      { error: "Unable to cancel this booking." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}
