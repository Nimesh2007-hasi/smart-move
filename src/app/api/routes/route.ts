
import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT route_id, origin, destination, distance_km
       FROM route
       ORDER BY route_id`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Fetch routes error:", error);

    return NextResponse.json(
      { error: "Failed to fetch routes from Oracle." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}

export async function POST(request: Request) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();
    const { origin, destination, distance_km } = body;
    const distance = Number(distance_km);

    if (
      typeof origin !== "string" ||
      !origin.trim() ||
      origin.trim().length > 100 ||
      typeof destination !== "string" ||
      !destination.trim() ||
      destination.trim().length > 100 ||
      !Number.isFinite(distance) ||
      distance <= 0 ||
      distance > 999999.99
    ) {
      return NextResponse.json(
        { error: "Enter valid origin, destination, and distance." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO route (origin, destination, distance_km)
       VALUES (:origin, :destination, :distance_km)`,
      {
        origin: origin.trim(),
        destination: destination.trim(),
        distance_km: distance,
      },
      { autoCommit: true }
    );

    return NextResponse.json(
      { message: "Route added successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add route error:", error);

    return NextResponse.json(
      { error: "Failed to add route." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}

export async function PUT(request: Request) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();
    const { route_id, origin, destination, distance_km } = body;
    const id = Number(route_id);
    const distance = Number(distance_km);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      typeof origin !== "string" ||
      !origin.trim() ||
      origin.trim().length > 100 ||
      typeof destination !== "string" ||
      !destination.trim() ||
      destination.trim().length > 100 ||
      !Number.isFinite(distance) ||
      distance <= 0 ||
      distance > 999999.99
    ) {
      return NextResponse.json(
        { error: "Enter valid route details." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `UPDATE route
       SET origin = :origin,
           destination = :destination,
           distance_km = :distance_km
       WHERE route_id = :route_id`,
      {
        route_id: id,
        origin: origin.trim(),
        destination: destination.trim(),
        distance_km: distance,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Route not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Route updated successfully." });
  } catch (error) {
    console.error("Update route error:", error);

    return NextResponse.json(
      { error: "Failed to update route." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}

export async function DELETE(request: Request) {
  let connection: oracledb.Connection | undefined;

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "A valid route ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `DELETE FROM route WHERE route_id = :id`,
      { id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Route not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Route deleted successfully." });
  } catch (error) {
    console.error("Delete route error:", error);

    return NextResponse.json(
      {
        error:
          "Could not delete this route. It may be referenced by an existing trip.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}