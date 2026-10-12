
import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT vehicle_id, reg_number, status, type, capacity
       FROM vehicle
       ORDER BY vehicle_id`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Fetch vehicles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
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
    const { reg_number, type, capacity, status } = body;

    if (
      typeof reg_number !== "string" ||
      !reg_number.trim() ||
      typeof type !== "string" ||
      !type.trim() ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) <= 0 ||
      !["ACTIVE", "INACTIVE", "MAINTENANCE"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Please provide valid vehicle details." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO vehicle (reg_number, type, capacity, status)
       VALUES (:reg_number, :type, :capacity, :status)`,
      {
        reg_number: reg_number.trim(),
        type: type.trim(),
        capacity: Number(capacity),
        status,
      },
      { autoCommit: true }
    );

    return NextResponse.json(
      { message: "Vehicle added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add vehicle error:", error);

    return NextResponse.json(
      { error: "Failed to add vehicle. Check whether the registration number already exists." },
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
        { error: "A valid vehicle ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `DELETE FROM vehicle WHERE vehicle_id = :id`,
      { id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Vehicle not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Delete vehicle error:", error);

    return NextResponse.json(
      { error: "Could not delete vehicle. It may be referenced by a trip or maintenance record." },
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
    const { vehicle_id, reg_number, type, capacity, status } = body;

    if (
      !Number.isInteger(Number(vehicle_id)) ||
      Number(vehicle_id) <= 0 ||
      typeof reg_number !== "string" ||
      !reg_number.trim() ||
      reg_number.trim().length > 20 ||
      typeof type !== "string" ||
      !type.trim() ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) <= 0 ||
      Number(capacity) > 999 ||
      !["ACTIVE", "INACTIVE", "MAINTENANCE"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Please provide valid vehicle details." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `UPDATE vehicle
       SET reg_number = :reg_number,
           type = :type,
           capacity = :capacity,
           status = :status
       WHERE vehicle_id = :vehicle_id`,
      {
        vehicle_id: Number(vehicle_id),
        reg_number: reg_number.trim().toUpperCase(),
        type: type.trim(),
        capacity: Number(capacity),
        status,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Vehicle not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Vehicle updated successfully." });
  } catch (error) {
    console.error("Update vehicle error:", error);

    return NextResponse.json(
      { error: "Failed to update vehicle. Check whether the registration number already exists." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}