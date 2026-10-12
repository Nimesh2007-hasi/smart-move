import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

const tripSelect = `
  SELECT
    t.trip_id,
    t.vehicle_id,
    v.reg_number,
    t.driver_id,
    d.name AS driver_name,
    t.route_id,
    r.origin,
    r.destination,
    t.fare,
    TO_CHAR(t.departure_time, 'YYYY-MM-DD"T"HH24:MI') AS departure_time,
    TO_CHAR(t.arrival_time, 'YYYY-MM-DD"T"HH24:MI') AS arrival_time,
    t.status,
    GREATEST(
      v.capacity - (
        SELECT COUNT(*)
        FROM ticket tk
        WHERE tk.trip_id = t.trip_id
          AND tk.booking_status <> 'CANCELLED'
      ),
      0
    ) AS available_seats
  FROM trip t
  JOIN vehicle v ON v.vehicle_id = t.vehicle_id
  JOIN driver d ON d.driver_id = t.driver_id
  JOIN route r ON r.route_id = t.route_id
`;

const validStatuses = [
  "SCHEDULED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

function readTrip(body: Record<string, unknown>) {
  const vehicleId = Number(body.vehicle_id);
  const driverId = Number(body.driver_id);
  const routeId = Number(body.route_id);
  const fare = Number(body.fare);

  const departureTime = String(body.departure_time ?? "");
  const arrivalTime = String(body.arrival_time ?? "").trim() || null;
  const status = String(body.status ?? "SCHEDULED").toUpperCase();

  if (
    !Number.isInteger(vehicleId) || vehicleId <= 0 ||
    !Number.isInteger(driverId) || driverId <= 0 ||
    !Number.isInteger(routeId) || routeId <= 0
  ) {
    throw new Error("Select a valid vehicle, driver, and route.");
  }

  if (!Number.isFinite(fare) || fare <= 0 || fare > 10000000) {
    throw new Error("Enter a valid trip fare greater than zero.");
  }

  const datetimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  if (!datetimePattern.test(departureTime)) {
    throw new Error("Enter a valid departure date and time.");
  }

  if (arrivalTime && !datetimePattern.test(arrivalTime)) {
    throw new Error("Enter a valid arrival date and time.");
  }

  if (arrivalTime && arrivalTime <= departureTime) {
    throw new Error("Arrival must be later than departure.");
  }

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid trip status.");
  }

  return {
    vehicleId,
    driverId,
    routeId,
    fare,
    departureTime,
    arrivalTime,
    status,
  };
}

export async function GET(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const params = request.nextUrl.searchParams;
    const adminView = params.get("view") === "admin";

    const from = params.get("from")?.trim();
    const to = params.get("to")?.trim();
    const date = params.get("date");
    const passengers = Number(params.get("passengers") ?? "1");

    if (
      !adminView &&
      (!Number.isInteger(passengers) || passengers < 1 || passengers > 6)
    ) {
      return NextResponse.json(
        { error: "Passengers must be between 1 and 6." },
        { status: 400 }
      );
    }

    if (
      (from && !to) ||
      (!from && to) ||
      (from && to && from.toLowerCase() === to.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Select different departure and destination cities." },
        { status: 400 }
      );
    }

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid travel date." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const whereClause = adminView
      ? `
        WHERE (:fromCity IS NULL OR UPPER(TRIM(r.origin)) = UPPER(TRIM(:fromCity)))
          AND (:toCity IS NULL OR UPPER(TRIM(r.destination)) = UPPER(TRIM(:toCity)))
          AND (:travelDate IS NULL OR (
            t.departure_time >= TO_DATE(:travelDate, 'YYYY-MM-DD')
            AND t.departure_time < TO_DATE(:travelDate, 'YYYY-MM-DD') + 1
          ))
        ORDER BY t.departure_time DESC
      `
      : `
        WHERE t.status = 'SCHEDULED'
          AND t.departure_time >= SYSDATE
          AND (:fromCity IS NULL OR UPPER(TRIM(r.origin)) = UPPER(TRIM(:fromCity)))
          AND (:toCity IS NULL OR UPPER(TRIM(r.destination)) = UPPER(TRIM(:toCity)))
          AND (:travelDate IS NULL OR (
            t.departure_time >= TO_DATE(:travelDate, 'YYYY-MM-DD')
            AND t.departure_time < TO_DATE(:travelDate, 'YYYY-MM-DD') + 1
          ))
        ORDER BY t.departure_time ASC
      `;

    const result = await connection.execute(
      `${tripSelect} ${whereClause}`,
      {
        fromCity: from || null,
        toCity: to || null,
        travelDate: date || null,
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const trips = (result.rows ?? []).filter((row) => {
      const trip = row as Record<string, unknown>;

      if (adminView) return true;

      return Number(trip.AVAILABLE_SEATS) >= passengers;
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("Get trips error:", error);

    return NextResponse.json(
      { error: "Failed to load trips from Oracle." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();
    const trip = readTrip(body);

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO trip (
        vehicle_id,
        driver_id,
        route_id,
        fare,
        departure_time,
        arrival_time,
        status
      ) VALUES (
        :vehicleId,
        :driverId,
        :routeId,
        :fare,
        TO_TIMESTAMP(:departureTime, 'YYYY-MM-DD"T"HH24:MI'),
        CASE
          WHEN :arrivalTime IS NULL THEN NULL
          ELSE TO_TIMESTAMP(:arrivalTime, 'YYYY-MM-DD"T"HH24:MI')
        END,
        :status
      )`,
      trip,
      { autoCommit: true }
    );

    return NextResponse.json(
      { message: "Trip created successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create trip error:", error);

    if (error instanceof Error && !("errorNum" in error)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if ((error as { errorNum?: number }).errorNum === 2291) {
      return NextResponse.json(
        { error: "The selected vehicle, driver, or route no longer exists." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create trip." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}

export async function PUT(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();
    const tripId = Number(body.trip_id);

    if (!Number.isInteger(tripId) || tripId <= 0) {
      return NextResponse.json(
        { error: "A valid trip ID is required." },
        { status: 400 }
      );
    }

    const trip = readTrip(body);
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `UPDATE trip
       SET vehicle_id = :vehicleId,
           driver_id = :driverId,
           route_id = :routeId,
           fare = :fare,
           departure_time = TO_TIMESTAMP(
             :departureTime, 'YYYY-MM-DD"T"HH24:MI'
           ),
           arrival_time = CASE
             WHEN :arrivalTime IS NULL THEN NULL
             ELSE TO_TIMESTAMP(:arrivalTime, 'YYYY-MM-DD"T"HH24:MI')
           END,
           status = :status
       WHERE trip_id = :tripId`,
      { ...trip, tripId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Trip not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Trip updated successfully.",
    });
  } catch (error) {
    console.error("Update trip error:", error);

    if (error instanceof Error && !("errorNum" in error)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if ((error as { errorNum?: number }).errorNum === 2291) {
      return NextResponse.json(
        { error: "The selected vehicle, driver, or route no longer exists." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update trip." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}

export async function DELETE(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const id = Number(request.nextUrl.searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "A valid trip ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      "DELETE FROM trip WHERE trip_id = :id",
      { id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Trip not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Trip deleted successfully.",
    });
  } catch (error) {
    console.error("Delete trip error:", error);

    if ((error as { errorNum?: number }).errorNum === 2292) {
      return NextResponse.json(
        {
          error:
            "This trip has linked tickets or feedback and cannot be deleted.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete trip." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}
