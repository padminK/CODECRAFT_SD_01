import { query, pool } from "./db/index.js";

async function promote() {
  try {
    const res = await query(
      "UPDATE users SET role = 'ADMIN' WHERE email = 'kfranklina675@gmail.com' RETURNING id, name, email, role"
    );
    console.log("Successfully promoted to ADMIN:", res.rows);
  } catch (err) {
    console.error("Error promoting user:", err);
  } finally {
    await pool.end();
  }
}

promote();
