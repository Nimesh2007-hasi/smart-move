
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

const validStatuses = ["BOOKED", "CONFIRMED", "CANCELLED"];

type TicketInput = {
  passenger_id: number;
  trip_id: number;
  seat_no: string;
  booking_status: string;
};

function readTicket(
  body: Record<string, unknown>
): TicketInput | string {
  const passenger_id = Number(body.passenger_id);
  const trip_id = Number(body.trip_id);
  const seat_no = String(body.seat_no ?? "").trim().toUpperCase();
  const booking_status = String(
    body.booking_status ?? ""
  ).trim().toUpperCase();

  if (
    !Number.isInteger(passenger_id) ||
    passenger_id <= 0 ||
    !Number.isInteger(trip_id) ||
    trip_id <= 0
  ) {
    return "Select a valid passenger and trip.";
  }

  if (!seat_no || seat_no.length > 20) {
    return "Enter a valid seat number.";
  }

  if (!validStatuses.includes(booking_status)) {
    return "Select a valid booking status.";
  }

  return {
    passenger_id,
    trip_id,
    seat_no,
    booking_status,
  };
}

function handleError(error: unknown) {
  const err = error as { errorNum?: number };

  if (err?.errorNum === 1) {
    return NextResponse.json(
      { error: "A record with these details already exists." },
      { status: 409 }
    );
  }

  if (err?.errorNum === 2291) {
    return NextResponse.json(
      { error: "The selected passenger or trip does not exist." },
      { status: 400 }
    );
  }

  if (err?.errorNum === 2292) {
    return NextResponse.json(
      { error: "This ticket cannot be deleted because another record references it." },
      { status: 409 }
    );
  }

  console.error("Tickets API error:", error);

  return NextResponse.json(
    { error: "A database error occurred while processing the ticket." },
    { status: 500 }
  );
}

// GET: Return tickets, including their saved amounts.
export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `
        SELECT
          tk.ticket_id,
          tk.passenger_id,
          p.name AS passenger_name,
          tk.trip_id,
          r.origin,
          r.destination,
          TO_CHAR(
            t.departure_time,
            'YYYY-MM-DD"T"HH24:MI'
          ) AS departure_time,
          tk.seat_no,
          tk.booking_status,
          tk.amount,
          t.fare AS trip_fare
        FROM ticket tk
        JOIN passenger p
          ON p.passenger_id = tk.passenger_id
        JOIN trip t
          ON t.trip_id = tk.trip_id
        JOIN route r
          ON r.route_id = t.route_id
        ORDER BY tk.ticket_id DESC
      `,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json(result.rows ?? []);
  } catch (error) {
    return handleError(error);
  } finally {
    if (connection) {
      await connection.close().catch(console.error);
    }
  }
}

// POST: Create a ticket and copy the fare from the selected trip.
export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();
    const ticket = readTicket(body);

    if (typeof ticket === "string") {
      return NextResponse.json(
        { error: ticket },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    // Check whether the selected seat is already occupied.
    if (ticket.booking_status !== "CANCELLED") {
      const seatCheck = await connection.execute(
        `
          SELECT COUNT(*) AS total
          FROM ticket
          WHERE trip_id = :trip_id
            AND UPPER(TRIM(seat_no)) = :seat_no
            AND booking_status <> 'CANCELLED'
        `,
        {
          trip_id: ticket.trip_id,
          seat_no: ticket.seat_no,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const seatRows = seatCheck.rows as
        | Array<{ TOTAL: number }>
        | undefined;

      if (Number(seatRows?.[0]?.TOTAL ?? 0) > 0) {
        return NextResponse.json(
          { error: "That seat is already booked for this trip." },
          { status: 409 }
        );
      }
    }

    const tripCheck = await connection.execute(
      `
        SELECT fare
        FROM trip
        WHERE trip_id = :trip_id
      `,
      { trip_id: ticket.trip_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const tripRows = tripCheck.rows as
      | Array<{ FARE: number }>
      | undefined;

    if (!tripRows?.length) {
      return NextResponse.json(
        { error: "The selected trip was not found." },
        { status: 404 }
      );
    }

    const fare = Number(tripRows[0].FARE);

    if (!Number.isFinite(fare) || fare <= 0) {
      return NextResponse.json(
        { error: "The selected trip does not have a valid fare." },
        { status: 400 }
      );
    }

    await connection.execute(
      `
        INSERT INTO ticket (
          passenger_id,
          trip_id,
          seat_no,
          booking_status,
          amount
        )
        VALUES (
          :passenger_id,
          :trip_id,
          :seat_no,
          :booking_status,
          :amount
        )
      `,
      {
        ...ticket,
        amount: fare,
      },
      { autoCommit: true }
    );

    return NextResponse.json(
      {
        message: "Ticket created successfully.",
        amount: fare,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  } finally {
    if (connection) {
      await connection.close().catch(console.error);
    }
  }
}

// PUT: Update ticket details and sync the amount with the selected trip.
export async function PUT(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();
    const ticketId = Number(body.ticket_id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return NextResponse.json(
        { error: "A valid ticket ID is required." },
        { status: 400 }
      );
    }

    const ticket = readTicket(body);

    if (typeof ticket === "string") {
      return NextResponse.json(
        { error: ticket },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    if (ticket.booking_status !== "CANCELLED") {
      const seatCheck = await connection.execute(
        `
          SELECT COUNT(*) AS total
          FROM ticket
          WHERE trip_id = :trip_id
            AND UPPER(TRIM(seat_no)) = :seat_no
            AND booking_status <> 'CANCELLED'
            AND ticket_id <> :ticket_id
        `,
        {
          trip_id: ticket.trip_id,
          seat_no: ticket.seat_no,
          ticket_id: ticketId,
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const seatRows = seatCheck.rows as
        | Array<{ TOTAL: number }>
        | undefined;

      if (Number(seatRows?.[0]?.TOTAL ?? 0) > 0) {
        return NextResponse.json(
          { error: "That seat is already booked for this trip." },
          { status: 409 }
        );
      }
    }

    const tripCheck = await connection.execute(
      `
        SELECT fare
        FROM trip
        WHERE trip_id = :trip_id
      `,
      { trip_id: ticket.trip_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const tripRows = tripCheck.rows as
      | Array<{ FARE: number }>
      | undefined;

    if (!tripRows?.length) {
      return NextResponse.json(
        { error: "The selected trip was not found." },
        { status: 404 }
      );
    }

    const fare = Number(tripRows[0].FARE);

    if (!Number.isFinite(fare) || fare <= 0) {
      return NextResponse.json(
        { error: "The selected trip does not have a valid fare." },
        { status: 400 }
      );
    }

    const result = await connection.execute(
      `
        UPDATE ticket
        SET
          passenger_id = :passenger_id,
          trip_id = :trip_id,
          seat_no = :seat_no,
          booking_status = :booking_status,
          amount = :amount
        WHERE ticket_id = :ticket_id
      `,
      {
        ...ticket,
        amount: fare,
        ticket_id: ticketId,
      },
      { autoCommit: true }
    );

    if (!result.rowsAffected) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Ticket updated successfully.",
      amount: fare,
    });
  } catch (error) {
    return handleError(error);
  } finally {
    if (connection) {
      await connection.close().catch(console.error);
    }
  }
}

// DELETE: Delete a ticket by ID.
export async function DELETE(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const { searchParams } = new URL(request.url);
    const ticketId = Number(searchParams.get("id"));

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return NextResponse.json(
        { error: "A valid ticket ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `DELETE FROM ticket WHERE ticket_id = :ticketId`,
      { ticketId },
      { autoCommit: true }
    );

    if (!result.rowsAffected) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Ticket deleted successfully.",
    });
  } catch (error) {
    return handleError(error);
  } finally {
    if (connection) {
      await connection.close().catch(console.error);
    }
  }
}
