
import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

const VALID_STATUSES = ["ACTIVE", "INACTIVE", "ON_LEAVE"];

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT driver_id, name, license_no, contact, status
       FROM driver
       ORDER BY driver_id`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Fetch drivers error:", error);

    return NextResponse.json(
      { error: "Failed to fetch drivers from Oracle." },
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
    const { name, license_no, contact, status } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof license_no !== "string" ||
      !license_no.trim() ||
      license_no.trim().length > 30 ||
      (contact != null &&
        (typeof contact !== "string" || contact.trim().length > 20)) ||
      !VALID_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        { error: "Please provide valid driver details." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO driver (name, license_no, contact, status)
       VALUES (:name, :license_no, :contact, :status)`,
      {
        name: name.trim(),
        license_no: license_no.trim().toUpperCase(),
        contact: contact?.trim() || null,
        status,
      },
      { autoCommit: true }
    );

    return NextResponse.json(
      { message: "Driver added successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add driver error:", error);

    return NextResponse.json(
      {
        error:
          "Failed to add driver. The license number may already exist.",
      },
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
    const { driver_id, name, license_no, contact, status } = body;

    if (
      !Number.isInteger(Number(driver_id)) ||
      Number(driver_id) <= 0 ||
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof license_no !== "string" ||
      !license_no.trim() ||
      license_no.trim().length > 30 ||
      (contact != null &&
        (typeof contact !== "string" || contact.trim().length > 20)) ||
      !VALID_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        { error: "Please provide valid driver details." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `UPDATE driver
       SET name = :name,
           license_no = :license_no,
           contact = :contact,
           status = :status
       WHERE driver_id = :driver_id`,
      {
        driver_id: Number(driver_id),
        name: name.trim(),
        license_no: license_no.trim().toUpperCase(),
        contact: contact?.trim() || null,
        status,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Driver not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Driver updated successfully.",
    });
  } catch (error) {
    console.error("Update driver error:", error);

    return NextResponse.json(
      {
        error:
          "Failed to update driver. The license number may already exist.",
      },
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
        { error: "A valid driver ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `DELETE FROM driver WHERE driver_id = :id`,
      { id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Driver not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Driver deleted successfully.",
    });
  } catch (error) {
    console.error("Delete driver error:", error);

    return NextResponse.json(
      {
        error:
          "Could not delete this driver. The driver may be referenced by an existing trip.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}