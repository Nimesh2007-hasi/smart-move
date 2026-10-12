
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";
import { getCurrentSession } from "@/lib/auth-session";

const allowedMethods = ["CASH", "CARD", "ONLINE", "WALLET"];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}


async function getPassengerId() {
  const session = await getCurrentSession();

  if (session?.role !== "PASSENGER") {
    return null;
  }

  const id = Number(session.id);

  return Number.isInteger(id) && id > 0 ? id : null;
}


export async function GET(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const passengerId = await getPassengerId();

    if (!passengerId) {
      return jsonError("Please sign in as a passenger.", 401);
    }

    const ticketId = Number(
      request.nextUrl.searchParams.get("ticketId")
    );

    if (!Number.isInteger(ticketId) || ticketId < 1) {
      return jsonError("A valid ticket ID is required.", 400);
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT
         tk.ticket_id,
         tk.seat_no,
         tk.booking_status,
         tk.passenger_id,
         NVL(NULLIF(tk.amount, 0), tr.fare) AS ticket_amount,
         r.origin,
         r.destination,
         TO_CHAR(
           tr.departure_time,
           'YYYY-MM-DD"T"HH24:MI'
         ) AS departure_time,
         NVL((
           SELECT SUM(p.amount)
           FROM payment p
           WHERE p.ticket_id = tk.ticket_id
             AND UPPER(p.payment_status) = 'PAID'
         ), 0) AS amount_paid
       FROM ticket tk
       JOIN trip tr ON tr.trip_id = tk.trip_id
       JOIN route r ON r.route_id = tr.route_id
       WHERE tk.ticket_id = :ticketId
         AND tk.passenger_id = :passengerId`,
      { ticketId, passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0] as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      return jsonError("Ticket not found for your account.", 404);
    }

    const ticketAmount = Number(row.TICKET_AMOUNT ?? 0);
    const amountPaid = Number(row.AMOUNT_PAID ?? 0);
    const bookingStatus = String(row.BOOKING_STATUS ?? "").toUpperCase();

    return NextResponse.json({
      ticketId: Number(row.TICKET_ID),
      seatNumber: String(row.SEAT_NO ?? ""),
      bookingStatus,
      route: `${row.ORIGIN} → ${row.DESTINATION}`,
      departureTime: String(row.DEPARTURE_TIME ?? ""),
      ticketAmount,
      amountPaid,
      amountDue: Math.max(0, ticketAmount - amountPaid),
    });
  } catch (error) {
    console.error("Checkout GET failed:", error);
    return jsonError("Unable to load checkout details.", 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const passengerId = await getPassengerId();

    if (!passengerId) {
      return jsonError("Please sign in as a passenger.", 401);
    }

    const body = await request.json();
    const ticketId = Number(body.ticketId);
    const method = String(body.method ?? "").toUpperCase();

    if (!Number.isInteger(ticketId) || ticketId < 1) {
      return jsonError("A valid ticket ID is required.", 400);
    }

    if (!allowedMethods.includes(method)) {
      return jsonError("Select a valid payment method.", 400);
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    // Lock the ticket while checking and recording the payment.
    const ticketResult = await connection.execute(
      `SELECT
         tk.ticket_id,
         tk.booking_status,
         NVL(NULLIF(tk.amount, 0), tr.fare) AS ticket_amount
       FROM ticket tk
       JOIN trip tr ON tr.trip_id = tk.trip_id
       WHERE tk.ticket_id = :ticketId
         AND tk.passenger_id = :passengerId
       FOR UPDATE OF tk.amount`,
      { ticketId, passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const ticket = ticketResult.rows?.[0] as
      | Record<string, unknown>
      | undefined;

    if (!ticket) {
      await connection.rollback();
      return jsonError("Ticket not found for your account.", 404);
    }

    if (
      String(ticket.BOOKING_STATUS ?? "").toUpperCase() === "CANCELLED"
    ) {
      await connection.rollback();
      return jsonError("Cancelled tickets cannot be paid.", 400);
    }

    const ticketAmount = Number(ticket.TICKET_AMOUNT ?? 0);

    const paidResult = await connection.execute(
      `SELECT NVL(SUM(amount), 0) AS amount_paid
       FROM payment
       WHERE ticket_id = :ticketId
         AND UPPER(payment_status) = 'PAID'`,
      { ticketId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const paidRow = paidResult.rows?.[0] as
      | Record<string, unknown>
      | undefined;

    const amountPaid = Number(paidRow?.AMOUNT_PAID ?? 0);
    const amountDue = Math.max(0, ticketAmount - amountPaid);

    if (amountDue <= 0) {
      await connection.rollback();
      return jsonError("This ticket has already been fully paid.", 409);
    }

    // This coursework flow simulates electronic payments.
    // Cash is recorded as pending collection.
    const paymentStatus = method === "CASH" ? "PENDING" : "PAID";

    await connection.execute(
      `INSERT INTO payment (
         ticket_id,
         amount,
         method,
         payment_status,
         payment_date
       )
       VALUES (
         :ticketId,
         :amount,
         :method,
         :paymentStatus,
         SYSDATE
       )`,
      {
        ticketId,
        amount: amountDue,
        method,
        paymentStatus,
      }
    );

    await connection.commit();

    return NextResponse.json(
      {
        message:
          method === "CASH"
            ? "Cash payment recorded as pending."
            : "Demo payment recorded successfully.",
        ticketId,
        amount: amountDue,
        method,
        paymentStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // Preserve the original error.
      }
    }

    console.error("Checkout POST failed:", error);
    return jsonError("Unable to process this payment.", 500);
  } finally {
    if (connection) await connection.close();
  }
}
