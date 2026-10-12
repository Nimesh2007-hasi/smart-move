
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT passenger_id, name, email, contact
       FROM passenger
       ORDER BY passenger_id`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json(result.rows ?? []);
  } catch (error) {
    console.error("Get passengers error:", error);

    return NextResponse.json(
      { error: "Failed to load passengers from Oracle." },
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

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const contact = String(body.contact ?? "").trim() || null;

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Enter a name of 1–100 characters." },
        { status: 400 }
      );
    }

    if (email && email.length > 150) {
      return NextResponse.json(
        { error: "Email must be 150 characters or fewer." },
        { status: 400 }
      );
    }

    if (contact && contact.length > 20) {
      return NextResponse.json(
        { error: "Contact must be 20 characters or fewer." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO passenger (name, email, contact)
       VALUES (:name, :email, :contact)`,
      { name, email, contact },
      { autoCommit: true }
    );

    return NextResponse.json(
      { message: "Passenger added successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create passenger error:", error);

    if ((error as { errorNum?: number }).errorNum === 1) {
      return NextResponse.json(
        { error: "This email address is already registered." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add passenger." },
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

    const passengerId = Number(body.passenger_id);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const contact = String(body.contact ?? "").trim() || null;

    if (!Number.isInteger(passengerId) || passengerId <= 0) {
      return NextResponse.json(
        { error: "A valid passenger ID is required." },
        { status: 400 }
      );
    }

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Enter a name of 1–100 characters." },
        { status: 400 }
      );
    }

    if (
      (email && email.length > 150) ||
      (contact && contact.length > 20)
    ) {
      return NextResponse.json(
        { error: "Email or contact exceeds the allowed length." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `UPDATE passenger
       SET name = :name,
           email = :email,
           contact = :contact
       WHERE passenger_id = :passengerId`,
      { name, email, contact, passengerId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Passenger not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Passenger updated successfully.",
    });
  } catch (error) {
    console.error("Update passenger error:", error);

    if ((error as { errorNum?: number }).errorNum === 1) {
      return NextResponse.json(
        { error: "This email address is already registered." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update passenger." },
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
        { error: "A valid passenger ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `DELETE FROM passenger WHERE passenger_id = :id`,
      { id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Passenger not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Passenger deleted successfully.",
    });
  } catch (error) {
    console.error("Delete passenger error:", error);

    if ((error as { errorNum?: number }).errorNum === 2292) {
      return NextResponse.json(
        {
          error:
            "This passenger has linked tickets or feedback and cannot be deleted.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete passenger." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}