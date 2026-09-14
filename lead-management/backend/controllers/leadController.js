const pool = require('../config/db');
const { sendLeadEmails } = require('../services/emailServices');

const createLead = async (req, res) => {
    try {
        const {
            name,
            mobileNumber,
            email,
            company,
            requirement
        } = req.body;

        if (!name || !mobileNumber || !email || !company || !requirement) {
            return res.status(400).json({ message: "Please enter all required fields" });
        }

        // 1. Insert lead into PostgreSQL database
        const result = await pool.query(
            `INSERT INTO leads
            (name, mobile_number, email, company, requirement)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [name, mobileNumber, email, company, requirement]
        );

        const newLead = result.rows[0];

        // 2. Dispatch email notifications (safe asynchronous handling)
        let emailStatus = { adminSent: false, clientSent: false };
        try {
            emailStatus = await sendLeadEmails({
                name,
                mobileNumber,
                email,
                company,
                requirement,
            });
        } catch (emailErr) {
            console.error("⚠️ Error while attempting to dispatch emails:", emailErr.message);
        }

        return res.status(201).json({
            message: "Lead submitted successfully",
            lead: newLead,
            emailStatus,
        });
    } catch (err) {
        console.error("Error creating lead:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createLead,
};
