
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");

async function main() {
  process.loadEnvFile(".env.local");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set ADMIN_EMAIL and a strong ADMIN_PASSWORD (at least 12 characters) in .env.local."
    );
  }

  const connection = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
  });

  try {
    const existing = await connection.execute(
      `SELECT user_id FROM app_user WHERE LOWER(email) = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existing.rows && existing.rows.length > 0) {
      throw new Error(
        "An account with this email already exists. Use a different admin email; this script will not promote or overwrite an existing account."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.execute(
      `INSERT INTO app_user
         (email, password_hash, role, passenger_id, is_active)
       VALUES
         (:email, :passwordHash, 'ADMIN', NULL, 1)`,
      { email, passwordHash }
    );

    await connection.commit();
    console.log("Fixed admin account created successfully.");
    console.log(`Admin email: ${email}`);
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error("Could not create admin account:", error.message);
  process.exitCode = 1;
});
