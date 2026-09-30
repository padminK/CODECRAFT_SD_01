import { Router } from "express";
import { query } from "../db/index.js";
import { authenticate, adminOnly } from "../middleware/auth.js";

const router = Router();

// GET /api/slots?from=ISO&to=ISO
router.get("/", authenticate, async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  if (isNaN(from) || isNaN(to)) {
    return res.status(400).json({ message: "Valid from and to are required" });
  }

  const { rows } = await query(
    `SELECT s.id,
            s.start_time AS "startTime",
            s.end_time   AS "endTime",
            s.capacity,
            COUNT(b.id)::int AS booked,
            MAX(CASE WHEN b.user_id = $3 THEN b.id END) AS "myBookingId"
     FROM slots s
     LEFT JOIN bookings b ON b.slot_id = s.id
     WHERE s.start_time >= $1 AND s.start_time < $2
     GROUP BY s.id
     ORDER BY s.start_time`,
    [from, to, req.user.id]
  );

  res.json(rows.map((s) => ({ ...s, isFull: s.booked >= s.capacity })));
});

// POST /api/slots (admin)
router.post("/", authenticate, adminOnly, async (req, res) => {
  const start = new Date(req.body.startTime);
  const end = new Date(req.body.endTime);

  if (isNaN(start) || isNaN(end) || end <= start) {
    return res.status(400).json({ message: "Invalid slot details" });
  }

  try {
    const { rows } = await query(
      `INSERT INTO slots (start_time, end_time, capacity)
       VALUES ($1, $2, 1)
       RETURNING id, start_time AS "startTime", end_time AS "endTime", capacity`,
      [start, end]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ message: "Slot already exists" });
    }
    throw e;
  }
});

// DELETE /api/slots/:id (admin)
router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  const { rowCount } = await query("DELETE FROM slots WHERE id = $1", [
    Number(req.params.id),
  ]);
  if (!rowCount) return res.status(404).json({ message: "Slot not found" });
  res.json({ message: "Slot deleted" });
});

export default router;
