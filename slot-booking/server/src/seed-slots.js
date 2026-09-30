import { query, pool } from "./db/index.js";

async function seed() {
  const dates = [
    new Date().toLocaleDateString("en-CA"),
    new Date(Date.now() + 86400000).toLocaleDateString("en-CA"),
    new Date(Date.now() + 172800000).toLocaleDateString("en-CA"),
  ];

  const slotTimes = [
    { startH: 9, endH: 10 },
    { startH: 10, endH: 11 },
    { startH: 11, endH: 12 },
    { startH: 14, endH: 15 },
    { startH: 15, endH: 16 },
    { startH: 17, endH: 18 },
    { startH: 23, endH: 24 }, // 11 PM to 12 AM
  ];

  let added = 0;
  for (const dateStr of dates) {
    for (const st of slotTimes) {
      const start = new Date(`${dateStr}T00:00:00`);
      start.setHours(st.startH, 0, 0, 0);

      const end = new Date(`${dateStr}T00:00:00`);
      end.setHours(st.endH, 0, 0, 0);

      if (start > new Date()) {
        try {
          await query(
            "INSERT INTO slots (start_time, end_time, capacity) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING",
            [start, end]
          );
          added++;
        } catch (e) {
          console.error("Error inserting slot:", e.message);
        }
      }
    }
  }

  console.log(`Seeded ${added} future slots across today and upcoming days.`);
  await pool.end();
}

seed();
