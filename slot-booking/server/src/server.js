import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import slotRoutes from './routes/slots.js';
import bookingRoutes from './routes/bookings.js';

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Slot Booking API</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background: #1e293b;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            padding: 32px;
            max-width: 580px;
            width: 100%;
            border: 1px solid #334155;
          }
          .badge {
            background: #10b981;
            color: #022c22;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          h1 { margin: 16px 0 8px; font-size: 24px; color: #fff; }
          p { color: #94a3b8; font-size: 15px; margin-top: 0; line-height: 1.5; }
          .endpoint-group { margin-top: 20px; }
          .endpoint-group h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }
          ul { list-style: none; padding: 0; margin: 0; }
          li {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: #0f172a;
            border-radius: 6px;
            margin-bottom: 6px;
            font-family: monospace;
            font-size: 13px;
          }
          .method {
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            margin-right: 10px;
            font-size: 11px;
          }
          .get { background: #3b82f6; color: white; }
          .post { background: #10b981; color: white; }
          .delete { background: #ef4444; color: white; }
          a { color: #38bdf8; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">Running</span>
          <h1>Slot Booking API</h1>
          <p>The backend server is online and operational.</p>
          <div class="endpoint-group">
            <h3>Endpoints</h3>
            <ul>
              <li><span class="method get">GET</span> <a href="/health">/health</a></li>
              <li><span class="method post">POST</span> /api/auth/register</li>
              <li><span class="method post">POST</span> /api/auth/login</li>
              <li><span class="method get">GET</span> /api/slots?from=ISO&to=ISO</li>
              <li><span class="method post">POST</span> /api/slots (admin)</li>
              <li><span class="method delete">DEL</span> /api/slots/:id (admin)</li>
              <li><span class="method post">POST</span> /api/bookings</li>
              <li><span class="method get">GET</span> /api/bookings/me</li>
              <li><span class="method delete">DEL</span> /api/bookings/:id</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({
      status: "ok",
      message: "Slot booking API is running",
      endpoints: [
        { path: "/health", method: "GET" },
        { path: "/api/auth/register", method: "POST" },
        { path: "/api/auth/login", method: "POST" },
        { path: "/api/slots", method: "GET, POST" },
        { path: "/api/bookings", method: "GET, POST, DELETE" },
      ],
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Slot booking API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
