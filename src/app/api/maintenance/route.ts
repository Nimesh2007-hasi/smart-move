// src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

function errorResponse(error: unknown, message: string) {
  console.error(message, error);

  const oracleError = error as { errorNum?: number };

  if (oracleError?.errorNum === 2292) {
    return NextResponse.json(
      { error: "This record is linked to another record and cannot be deleted." },
      { status: 409 }
    );
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `SELECT m.maintenance_id,
              m.vehicle_id,
              v.reg_number,
              TO_CHAR(m.service_date, 'YYYY-MM-DD') AS service_date,
              m.cost,
              m.description
       FROM maintenance m
       JOIN vehicle v ON v.vehicle_id = m.vehicle_id
       ORDER BY m.maintenance_id DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json(result.rows ?? []);
  } catch (error) {
    return errorResponse(error, "Failed to load maintenance records.");
  } finally {
    if (connection) await connection.close();
  }
}

async function saveMaintenance(request: NextRequest, editing: boolean) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();

    const vehicleId = Number(body.vehicle_id);
    const cost = Number(body.cost);
    const serviceDate = String(body.service_date ?? "");
    const description = String(body.description ?? "").trim();
    const maintenanceId = Number(body.maintenance_id);

    if (
      !Number.isInteger(vehicleId) ||
      vehicleId < 1 ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) ||
      description.length > 500 ||
      (editing && (!Number.isInteger(maintenanceId) || maintenanceId < 1))
    ) {
      return NextResponse.json(
        { error: "Enter a valid vehicle, service date, cost, and description (maximum 500 characters)." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const vehicleResult = await connection.execute(
      `SELECT vehicle_id FROM vehicle WHERE vehicle_id = :vehicleId`,
      { vehicleId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!vehicleResult.rows?.length) {
      return NextResponse.json(
        { error: "The selected vehicle does not exist." },
        { status: 400 }
      );
    }

    if (editing) {
      const result = await connection.execute(
        `UPDATE maintenance
         SET vehicle_id = :vehicleId,
             service_date = TO_DATE(:serviceDate, 'YYYY-MM-DD'),
             cost = :cost,
             description = :description
         WHERE maintenance_id = :maintenanceId`,
        {
          vehicleId,
          serviceDate,
          cost,
          description: description || null,
          maintenanceId,
        },
        { autoCommit: true }
      );

      if (!result.rowsAffected) {
        return NextResponse.json(
          { error: "Maintenance record not found." },
          { status: 404 }
        );
      }
    } else {
      await connection.execute(
        `INSERT INTO maintenance (vehicle_id, service_date, cost, description)
         VALUES (
           :vehicleId,
           TO_DATE(:serviceDate, 'YYYY-MM-DD'),
           :cost,
           :description
         )`,
        {
          vehicleId,
          serviceDate,
          cost,
          description: description || null,
        },
        { autoCommit: true }
      );
    }

    return NextResponse.json(
      { message: editing ? "Maintenance record updated." : "Maintenance record created." },
      { status: editing ? 200 : 201 }
    );
  } catch (error) {
    return errorResponse(error, "Failed to save maintenance record.");
  } finally {
    if (connection) await connection.close();
  }
}

export async function POST(request: NextRequest) {
  return saveMaintenance(request, false);
}

export async function PUT(request: NextRequest) {
  return saveMaintenance(request, true);
}

export async function DELETE(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const maintenanceId = Number(request.nextUrl.searchParams.get("id"));

    if (!Number.isInteger(maintenanceId) || maintenanceId < 1) {
      return NextResponse.json(
        { error: "A valid maintenance ID is required." },
        { status: 400 }
      );
    }

    const pool = await getOraclePool();
    connection = await pool.getConnection();

    const result = await connection.execute(
      `DELETE FROM maintenance WHERE maintenance_id = :maintenanceId`,
      { maintenanceId },
      { autoCommit: true }
    );

    if (!result.rowsAffected) {
      return NextResponse.json(
        { error: "Maintenance record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Maintenance record deleted." });
  } catch (error) {
    return errorResponse(error, "Failed to delete maintenance record.");
  } finally {
    if (connection) await connection.close();
  }
}