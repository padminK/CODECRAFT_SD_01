import { query, pool } from "./db/index.js";

async function seedFutureSlots() {
  const slotTimes = [
    { startH: 9, endH: 10 },
    { startH: 10, endH: 11 },
    { startH: 11, endH: 12 },
    { startH: 14, endH: 15 },
    { startH: 15, endH: 16 },
    { startH: 17, endH: 18 },
    { startH: 23, endH: 24 },
  ];

  let added = 0;
  const now = new Date();

  // Seed for next 30 days
  for (let i = 0; i < 30; i++) {
    const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toLocaleDateString("en-CA");

    for (const st of slotTimes) {
      const start = new Date(`${dateStr}T00:00:00`);
      start.setHours(st.startH, 0, 0, 0);

      const end = new Date(`${dateStr}T00:00:00`);
      end.setHours(st.endH, 0, 0, 0);

      if (start > now) {
        try {
          await query(
            "INSERT INTO slots (start_time, end_time, capacity) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING",
            [start, end]
          );
          added++;
        } catch (e) {
          console.error("Error:", e.message);
        }
      }
    }
  }

  console.log(`Successfully generated and verified ${added} slots for the next 30 days.`);
  await pool.end();
}

seedFutureSlots();
