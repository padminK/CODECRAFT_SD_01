import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// Hours are in 24h local time. Night ends at hour 29 = 5 AM next day.
const SESSIONS = [
  { key: "morning", label: "Morning", startHour: 9, endHour: 17, hint: "9 AM - 5 PM" },
  { key: "afternoon", label: "Afternoon", startHour: 14, endHour: 20, hint: "2 PM - 8 PM" },
  { key: "night", label: "Night", startHour: 23, endHour: 29, hint: "11 PM - 5 AM" },
];

const today = () => new Date().toLocaleDateString("en-CA");

const hourOf = (date, hour) => {
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hour, 0, 0, 0); // hour 29 rolls over to 5 AM next day
  return d;
};

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function Slots() {
  const navigate = useNavigate();
  const [date, setDate] = useState(today());
  const [session, setSession] = useState("morning");
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [booked, setBooked] = useState(null);
  const [saving, setSaving] = useState(false);

  // Quick select upcoming 14 days
  const upcomingDates = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString("en-CA");
      let label = d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
      if (i === 0) label = "Today";
      else if (i === 1) label = "Tomorrow";
      list.push({ dateStr, label, day: d.getDate(), weekday: d.toLocaleDateString([], { weekday: "short" }) });
    }
    return list;
  }, []);

  const load = useCallback(async () => {
    // fetch from midnight to 5 AM next day so night slots are included
    const from = hourOf(date, 0);
    const to = hourOf(date, 29);
    const { data } = await api.get("/slots", {
      params: { from: from.toISOString(), to: to.toISOString() },
    });
    setSlots(data);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const current = SESSIONS.find((s) => s.key === session);
  const winStart = hourOf(date, current.startHour);
  const winEnd = hourOf(date, current.endHour);

  const visible = slots.filter(
    (s) =>
      new Date(s.startTime) >= winStart &&
      new Date(s.endTime) <= winEnd &&
      new Date(s.startTime) > new Date() // hide past slots
  );

  const confirmBooking = async () => {
    setSaving(true);
    try {
      await api.post("/bookings", { slotId: selected.id });
      setMessage("");
      setBooked(selected);
    } catch (err) {
      setMessage(err.response?.data?.message || "Booking failed");
    } finally {
      setSelected(null);
      setSaving(false);
      load();
    }
  };

  return (
    <div>
      <h2>Available Slots</h2>

      <div className="date-selection-box">
        <label><strong>Select a Date (Today & Future Dates):</strong></label>
        
        {/* Quick horizontal scrollable future date buttons */}
        <div className="date-strip">
          {upcomingDates.map((item) => (
            <button
              key={item.dateStr}
              type="button"
              className={`date-chip ${date === item.dateStr ? "active" : ""}`}
              onClick={() => {
                setDate(item.dateStr);
                setMessage("");
              }}
            >
              <span className="chip-weekday">{item.weekday}</span>
              <span className="chip-day">{item.day}</span>
              <span className="chip-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="custom-date-picker">
          <small>Or choose any calendar date: </small>
          <input
            type="date"
            value={date}
            min={today()}
            onChange={(e) => {
              setDate(e.target.value);
              setMessage("");
            }}
          />
        </div>
      </div>

      <div className="sessions">
        {SESSIONS.map((s) => (
          <button
            key={s.key}
            className={`session ${session === s.key ? "active" : ""}`}
            onClick={() => setSession(s.key)}
          >
            {s.label}
            <small>{s.hint}</small>
          </button>
        ))}
      </div>

      {message && <p className="error">{message}</p>}

      <h3 style={{ marginTop: 20 }}>
        {fmtDate(`${date}T00:00:00`)} · {current.label}
      </h3>

      {visible.length === 0 ? (
        <p className="no-slots">No slots available for this session on {fmtDate(`${date}T00:00:00`)}.</p>
      ) : (
        <div className="times">
          {visible.map((s) => (
            <button
              key={s.id}
              className={`time ${s.myBookingId ? "mine" : ""}`}
              disabled={s.isFull}
              onClick={() => setSelected(s)}
            >
              {fmtTime(s.startTime)} - {fmtTime(s.endTime)}
              <small>
                {s.myBookingId ? "Booked by you" : s.isFull ? "Booked" : "Available"}
              </small>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Do you want to select this slot?</h3>
            <p className="modal-slot">
              {fmtDate(selected.startTime)}
              <br />
              {fmtTime(selected.startTime)} - {fmtTime(selected.endTime)}
            </p>
            <div className="modal-actions">
              <button onClick={confirmBooking} disabled={saving}>
                {saving ? "Saving..." : "Select"}
              </button>
              <button className="secondary" onClick={() => setSelected(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {booked && (
        <div className="overlay" onClick={() => setBooked(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="tick">✓</div>
            <h3>Slot booked successfully!</h3>
            <p>You have successfully booked a slot.</p>
            <p className="modal-slot">
              {fmtDate(booked.startTime)}
              <br />
              {fmtTime(booked.startTime)} - {fmtTime(booked.endTime)}
            </p>
            <div className="modal-actions">
              <button onClick={() => navigate("/my-bookings")}>
                View My Bookings
              </button>
              <button className="secondary" onClick={() => setBooked(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
