import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/me");
      setBookings(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      setMessage("Booking cancelled successfully.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  return (
    <div className="bookings-page">
      <h2>My Bookings</h2>

      {message && <p className="info">{message}</p>}

      {loading ? (
        <p>Loading your bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state card" style={{ textAlign: "center", margin: "24px auto" }}>
          <p>You have no active bookings yet.</p>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button type="button">Browse Available Slots</button>
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <div className="booking-details">
                <span className="badge-confirmed">Confirmed</span>
                <strong className="booking-date">
                  📅 {fmtDate(b.slot.startTime)}
                </strong>
                <span className="booking-time">
                  ⏰ {fmtTime(b.slot.startTime)} – {fmtTime(b.slot.endTime)}
                </span>
                <small className="booking-meta">
                  Booked on {new Date(b.createdAt).toLocaleDateString()}
                </small>
              </div>
              <button className="danger" onClick={() => cancel(b.id)}>
                Cancel Booking
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
