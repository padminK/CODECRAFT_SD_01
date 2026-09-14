const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");
const leadRoutes = require("./routes/leadRoutes");
const { verifyEmailService } = require("./services/emailServices");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/leads', leadRoutes);

app.get("/", (req, res) => {
    res.json({ message: "lead Management API is running" });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database connected successfully",
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed",
        });
    }
});

app.get("/api/test-email", async (req, res) => {
    const status = await verifyEmailService();
    if (status.ready) {
        res.json({
            message: "Email SMTP service is ready and verified!",
            smtpUser: process.env.SMTP_USER,
        });
    } else {
        res.status(500).json({
            message: "Email SMTP authentication failed",
            error: status.error,
            help: "For Gmail, you must generate a 16-character App Password (not your normal password) and place it in backend/.env under SMTP_PASS.",
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});