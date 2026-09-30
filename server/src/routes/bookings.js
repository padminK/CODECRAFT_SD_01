import { Router } from "express";
import { pool, query } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// POST /api/bookings  { slotId }
router.post("/", authenticate, async (req, res) => {
  const slotId = Number(req.body.slotId);
  if (!slotId) return res.status(400).json({ message: "slotId is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock this slot row so concurrent bookings queue up
    const slotRes = await client.query(
      "SELECT id, start_time, capacity FROM slots WHERE id = $1 FOR UPDATE",
      [slotId]
    );
    const slot = slotRes.rows[0];

    if (!slot) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Slot not found" });
    }
    if (new Date(slot.start_time) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Slot is in the past" });
    }

    const countRes = await client.query(
      "SELECT COUNT(*)::int AS n FROM bookings WHERE slot_id = $1",
      [slotId]
    );
    if (countRes.rows[0].n >= slot.capacity) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Slot is full" });
    }

    const { rows } = await client.query(
      `INSERT INTO bookings (user_id, slot_id)
       VALUES ($1, $2)
       RETURNING id, user_id AS "userId", slot_id AS "slotId", created_at AS "createdAt"`,
      [req.user.id, slotId]
    );

    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    if (e.code === "23505") {
      return res.status(409).json({ message: "You already booked this slot" });
    }
    throw e;
  } finally {
    client.release();
  }
});

// GET /api/bookings/me
router.get("/me", authenticate, async (req, res) => {
  const { rows } = await query(
    `SELECT b.id,
            b.created_at AS "createdAt",
            json_build_object(
              'id', s.id,
              'startTime', s.start_time,
              'endTime', s.end_time
            ) AS slot
     FROM bookings b
     JOIN slots s ON s.id = b.slot_id
     WHERE b.user_id = $1
     ORDER BY s.start_time`,
    [req.user.id]
  );
  res.json(rows);
});

// DELETE /api/bookings/:id
router.delete("/:id", authenticate, async (req, res) => {
  const { rowCount } = await query(
    "DELETE FROM bookings WHERE id = $1 AND user_id = $2",
    [Number(req.params.id), req.user.id]
  );
  if (!rowCount) return res.status(404).json({ message: "Booking not found" });
  res.json({ message: "Booking cancelled" });
});

export default router;
