import { useState } from "react";
import api from "../api";

const today = () => new Date().toLocaleDateString("en-CA");

export default function Admin() {
  const [form, setForm] = useState({ startTime: "", endTime: "" });
  const [bulkDate, setBulkDate] = useState(today());
  const [bulkSession, setBulkSession] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/slots", {
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      setMessage("Slot created successfully!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create slot");
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const sessionRanges = {
      morning: [{ startH: 9, endH: 10 }, { startH: 10, endH: 11 }, { startH: 11, endH: 12 }, { startH: 14, endH: 15 }, { startH: 15, endH: 16 }, { startH: 16, endH: 17 }],
      afternoon: [{ startH: 14, endH: 15 }, { startH: 15, endH: 16 }, { startH: 16, endH: 17 }, { startH: 17, endH: 18 }, { startH: 18, endH: 19 }, { startH: 19, endH: 20 }],
      night: [{ startH: 23, endH: 24 }, { startH: 24, endH: 25 }, { startH: 25, endH: 26 }, { startH: 26, endH: 27 }, { startH: 27, endH: 28 }, { startH: 28, endH: 29 }],
      all: [
        { startH: 9, endH: 10 }, { startH: 10, endH: 11 }, { startH: 11, endH: 12 },
        { startH: 14, endH: 15 }, { startH: 15, endH: 16 }, { startH: 17, endH: 18 },
        { startH: 23, endH: 24 }
      ]
    };

    const slotsToCreate = sessionRanges[bulkSession] || sessionRanges.all;
    let created = 0;

    try {
      for (const st of slotsToCreate) {
        const start = new Date(`${bulkDate}T00:00:00`);
        start.setHours(st.startH, 0, 0, 0);

        const end = new Date(`${bulkDate}T00:00:00`);
        end.setHours(st.endH, 0, 0, 0);

        try {
          await api.post("/slots", {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          });
          created++;
        } catch (err) {
          // ignore duplicate slots
          if (err.response?.status !== 409) {
            console.error(err);
          }
        }
      }
      setMessage(`Successfully generated ${created} slots for ${bulkDate}!`);
    } catch (err) {
      setMessage("Bulk generation encountered an error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "20px auto" }}>
      {message && <p className="info" style={{ textAlign: "center", fontWeight: "bold" }}>{message}</p>}

      {/* Bulk Generator for Any Future Date */}
      <form className="card" onSubmit={handleBulkGenerate} style={{ margin: "20px auto" }}>
        <h2>⚡ 1-Click Future Slots Generator</h2>
        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
          Quickly generate hourly slots for any upcoming date.
        </p>

        <label>Target Date</label>
        <input
          type="date"
          value={bulkDate}
          min={today()}
          onChange={(e) => setBulkDate(e.target.value)}
          required
        />

        <label>Session Window</label>
        <select
          value={bulkSession}
          onChange={(e) => setBulkSession(e.target.value)}
          style={{ padding: "9px", borderRadius: "6px", border: "1px solid #ccc" }}
        >
          <option value="all">Full Day (Morning, Afternoon & Night)</option>
          <option value="morning">Morning (9 AM - 5 PM)</option>
          <option value="afternoon">Afternoon (2 PM - 8 PM)</option>
          <option value="night">Night (11 PM - 5 AM next day)</option>
        </select>

        <button type="submit" disabled={loading} style={{ marginTop: "10px" }}>
          {loading ? "Generating..." : "Generate Slots for this Date"}
        </button>
      </form>

      {/* Manual Single Slot Creator */}
      <form className="card" onSubmit={submit} style={{ margin: "20px auto" }}>
        <h2>Manual Slot Creation</h2>
        <label>Start Date & Time</label>
        <input
          type="datetime-local"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          required
        />
        <label>End Date & Time</label>
        <input
          type="datetime-local"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          required
        />
        <button type="submit">Create Single Slot</button>
      </form>
    </div>
  );
}
