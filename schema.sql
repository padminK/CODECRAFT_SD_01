CREATE TABLE IF NOT EXISTS users (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role     TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'))
);

CREATE TABLE IF NOT EXISTS slots (
  id         SERIAL PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ NOT NULL,
  capacity   INT NOT NULL DEFAULT 1 CHECK (capacity > 0),
  UNIQUE (start_time, end_time),
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS bookings (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id    INT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_slots_start ON slots(start_time);
