
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

const allowedMethods = ["CASH", "CARD", "ONLINE", "WALLET"];
const allowedStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];

function errorResponse(error: unknown, message: string) {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT
         p.payment_id,
         p.ticket_id,
         ps.name AS passenger_name,
         TO_CHAR(p.payment_date, 'YYYY-MM-DD"T"HH24:MI') AS payment_date,
         p.amount,
         p.method,
         p.payment_status
       FROM payment p
       JOIN ticket t ON t.ticket_id = p.ticket_id
       JOIN passenger ps ON ps.passenger_id = t.passenger_id
       ORDER BY p.payment_id DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json(result.rows ?? []);
  } catch (error) {
    return errorResponse(error, "Failed to load payments.");
  } finally {
    if (connection) await connection.close();
  }
}

async function savePayment(
  request: NextRequest,
  editing: boolean
) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();

    const ticketId = Number(body.ticket_id);
    const amount = Number(body.amount);
    const method = String(body.method ?? "").toUpperCase();
    const status = String(body.payment_status ?? "").toUpperCase();
    const paymentDate = String(body.payment_date ?? "");
    const paymentId = Number(body.payment_id);

    // Supports both date-only and datetime-local values.
    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(paymentDate);

    if (
      !Number.isInteger(ticketId) ||
      ticketId < 1 ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !allowedMethods.includes(method) ||
      !allowedStatuses.includes(status) ||
      !validDate ||
      (editing &&
        (!Number.isInteger(paymentId) || paymentId < 1))
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid ticket, positive amount, payment date, method, and status.",
        },
        { status: 400 }
      );
    }

    const normalizedDate =
      paymentDate.length === 10
        ? `${paymentDate}T00:00`
        : paymentDate;

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const ticketCheck = await connection.execute(
      `SELECT ticket_id
       FROM ticket
       WHERE ticket_id = :ticketId`,
      { ticketId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!ticketCheck.rows?.length) {
      return NextResponse.json(
        { error: "The selected ticket does not exist." },
        { status: 400 }
      );
    }

    if (editing) {
      const result = await connection.execute(
        `UPDATE payment
         SET ticket_id = :ticketId,
             amount = :amount,
             method = :method,
             payment_status = :status,
             payment_date =
               TO_DATE(:paymentDate, 'YYYY-MM-DD"T"HH24:MI')
         WHERE payment_id = :paymentId`,
        {
          ticketId,
          amount,
          method,
          status,
          paymentDate: normalizedDate,
          paymentId,
        },
        { autoCommit: true }
      );

      if (!result.rowsAffected) {
        return NextResponse.json(
          { error: "Payment not found." },
          { status: 404 }
        );
      }
    } else {
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
           :status,
           TO_DATE(:paymentDate, 'YYYY-MM-DD"T"HH24:MI')
         )`,
        {
          ticketId,
          amount,
          method,
          status,
          paymentDate: normalizedDate,
        },
        { autoCommit: true }
      );
    }

    return NextResponse.json(
      {
        message: editing
          ? "Payment updated successfully."
          : "Payment created successfully.",
      },
      { status: editing ? 200 : 201 }
    );
  } catch (error) {
    return errorResponse(error, "Failed to save payment.");
  } finally {
    if (connection) await connection.close();
  }
}

export async function POST(request: NextRequest) {
  return savePayment(request, false);
}

export async function PUT(request: NextRequest) {
  return savePayment(request, true);
}

export async function DELETE(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const paymentId = Number(
      request.nextUrl.searchParams.get("id")
    );

    if (!Number.isInteger(paymentId) || paymentId < 1) {
      return NextResponse.json(
        { error: "A valid payment ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `DELETE FROM payment
       WHERE payment_id = :paymentId`,
      { paymentId },
      { autoCommit: true }
    );

    if (!result.rowsAffected) {
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Payment deleted successfully.",
    });
  } catch (error) {
    return errorResponse(error, "Failed to delete payment.");
  } finally {
    if (connection) await connection.close();
  }
}
