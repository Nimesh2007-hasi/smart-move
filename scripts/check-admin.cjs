
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");

async function main() {
  process.loadEnvFile(".env.local");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Admin credentials are missing from .env.local");
  }

  const connection = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
  });

  try {
    const result = await connection.execute(
      `SELECT email, role, is_active, password_hash
       FROM app_user
       WHERE LOWER(email) = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0];

    if (!user) {
      console.log("Account found: NO");
      console.log("Check the Oracle schema and ADMIN_EMAIL.");
      return;
    }

    console.log("Account found: YES");
    console.log("Role:", user.ROLE);
    console.log("Active:", user.IS_ACTIVE);

    const passwordMatches = await bcrypt.compare(
      password,
      user.PASSWORD_HASH
    );

    console.log("Password matches .env.local:", passwordMatches);
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error("Diagnostic failed:", error.message);
  process.exitCode = 1;
});
