import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOraclePool } from "@/lib/oracle";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    const pool = await getOraclePool();
    connection = await pool.getConnection();

    await connection.execute(`BEGIN DBMS_OUTPUT.ENABLE(NULL); END;`);
    await connection.execute(`BEGIN REPORT_ALL_PASSENGER_TRIPS; END;`);

    const lines: string[] = [];

    for (let i = 0; i < 1000; i++) {
      const result = await connection.execute(
        `BEGIN DBMS_OUTPUT.GET_LINE(:line, :status); END;`,
        {
          line: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 32767,
          },
          status: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
        }
      );

      const output = result.outBinds as {
        line: string | null;
        status: number;
      };

      if (output.status !== 0) break;
      lines.push(output.line ?? "");
    }

    return NextResponse.json({ lines });
  } catch (error) {
    console.error("Passenger trips report error:", error);
    return NextResponse.json(
      { error: "Failed to generate the passenger trips report." },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}