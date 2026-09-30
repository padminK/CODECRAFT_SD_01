// Standalone In-Browser Mock Service for GitHub Pages
// Ensures the app works 100% out of the box if no backend server is reachable.

const DEMO_USERS_KEY = "sb_demo_users";
const DEMO_BOOKINGS_KEY = "sb_demo_bookings";
const DEMO_CUSTOM_SLOTS_KEY = "sb_demo_custom_slots";

function getStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage write error:", e);
  }
}

// Generate standard slots for a date
function generateSlotsForDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const slots = [];
  let idCounter = 1;

  // Morning: 09:00 - 12:00 (1 hr each)
  const times = [
    { startH: 9, endH: 10 },
    { startH: 10, endH: 11 },
    { startH: 11, endH: 12 },
    // Afternoon: 14:00 - 17:00 (1 hr each)
    { startH: 14, endH: 15 },
    { startH: 15, endH: 16 },
    { startH: 16, endH: 17 },
    // Night: 19:00 - 22:00 (1 hr each)
    { startH: 19, endH: 20 },
    { startH: 20, endH: 21 },
    { startH: 21, endH: 22 },
  ];

  times.forEach((t, i) => {
    const start = new Date(Date.UTC(year, month - 1, day, t.startH, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day, t.endH, 0, 0));
    const id = `${dateStr}-${i + 1}`;
    slots.push({
      id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      capacity: 1,
      booked_count: 0,
    });
  });

  return slots;
}

export function handleMockRequest(config) {
  const method = (config.method || "get").toLowerCase();
  const url = (config.url || "").replace(/^https?:\/\/[^/]+/, "").replace(/^\/api/, "");
  const currentUser = getStorage("user", null);
  const bookings = getStorage(DEMO_BOOKINGS_KEY, []);
  const customSlots = getStorage(DEMO_CUSTOM_SLOTS_KEY, []);

  // 1. POST /auth/login
  if (url === "/auth/login" && method === "post") {
    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
    const email = data.email?.trim().toLowerCase();
    const isAdmin = email.includes("admin") || email.startsWith("kfranklina675");
    const user = {
      id: 1,
      name: email.split("@")[0] || "User",
      email: email,
      role: isAdmin ? "ADMIN" : "USER",
    };
    return {
      status: 200,
      data: { token: "demo-jwt-token-ghpages", user },
    };
  }

  // 2. POST /auth/register
  if (url === "/auth/register" && method === "post") {
    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
    const email = data.email?.trim().toLowerCase();
    const user = {
      id: Date.now(),
      name: data.name || email.split("@")[0] || "User",
      email: email,
      role: email.includes("admin") ? "ADMIN" : "USER",
    };
    return {
      status: 201,
      data: { token: "demo-jwt-token-ghpages", user },
    };
  }

  // 3. GET /slots
  if (url.startsWith("/slots") && method === "get") {
    const params = config.params || {};
    let dateStr = new Date().toISOString().split("T")[0];
    if (params.from) {
      dateStr = params.from.split("T")[0];
    }
    const defaultSlots = generateSlotsForDate(dateStr);
    const dateSlots = [...defaultSlots, ...customSlots.filter((s) => s.start_time.startsWith(dateStr))];

    // Calculate booked counts
    const mapped = dateSlots.map((slot) => {
      const slotBookings = bookings.filter((b) => String(b.slot_id) === String(slot.id));
      const booked_count = slotBookings.length;
      return {
        ...slot,
        booked_count,
        remaining_capacity: Math.max(0, slot.capacity - booked_count),
      };
    });

    return { status: 200, data: mapped };
  }

  // 4. POST /slots (Admin)
  if (url === "/slots" && method === "post") {
    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
    const newSlot = {
      id: `custom-${Date.now()}`,
      start_time: data.startTime || data.start_time,
      end_time: data.endTime || data.end_time,
      capacity: Number(data.capacity) || 1,
      booked_count: 0,
    };
    customSlots.push(newSlot);
    setStorage(DEMO_CUSTOM_SLOTS_KEY, customSlots);
    return { status: 201, data: newSlot };
  }

  // 5. POST /bookings
  if (url === "/bookings" && method === "post") {
    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
    const slotId = String(data.slotId || data.slot_id);
    const userId = currentUser?.id || 1;

    // Check if already booked
    const existing = bookings.find((b) => String(b.slot_id) === slotId && b.user_id === userId);
    if (existing) {
      const err = new Error("You have already booked this slot");
      err.response = { status: 409, data: { message: "You have already booked this slot" } };
      throw err;
    }

    const newBooking = {
      id: Date.now(),
      slot_id: slotId,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    bookings.push(newBooking);
    setStorage(DEMO_BOOKINGS_KEY, bookings);

    return { status: 201, data: newBooking };
  }

  // 6. GET /bookings/me
  if (url === "/bookings/me" && method === "get") {
    const userId = currentUser?.id || 1;
    const userBookings = bookings.filter((b) => b.user_id === userId);

    // Hydrate slot times
    const hydrated = userBookings.map((b) => {
      let startTime = new Date().toISOString();
      let endTime = new Date(Date.now() + 3600000).toISOString();

      if (typeof b.slot_id === "string" && b.slot_id.includes("-")) {
        const parts = b.slot_id.split("-");
        if (parts.length >= 4) {
          const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
          const defaultSlots = generateSlotsForDate(dateStr);
          const found = defaultSlots.find((s) => s.id === b.slot_id);
          if (found) {
            startTime = found.start_time;
            endTime = found.end_time;
          }
        }
      }

      return {
        id: b.id,
        slot_id: b.slot_id,
        created_at: b.created_at,
        start_time: startTime,
        end_time: endTime,
      };
    });

    return { status: 200, data: hydrated };
  }

  // 7. DELETE /bookings/:id
  const delMatch = url.match(/^\/bookings\/(.+)$/);
  if (delMatch && method === "delete") {
    const bookingId = delMatch[1];
    const updated = bookings.filter((b) => String(b.id) !== String(bookingId));
    setStorage(DEMO_BOOKINGS_KEY, updated);
    return { status: 200, data: { message: "Booking cancelled successfully" } };
  }

  return null;
}
