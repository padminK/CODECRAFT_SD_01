const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify SMTP connection configuration
const verifyEmailService = async () => {
    try {
        await transporter.verify();
        console.log("✅ Email service connected successfully (SMTP ready)");
        return { ready: true };
    } catch (error) {
        console.warn("⚠️  Email service configuration warning:", error.message);
        if (error.message.includes("535") || error.message.includes("BadCredentials")) {
            console.warn("👉 Gmail requires a 16-character App Password. Ensure SMTP_PASS in .env is a valid Google App Password, not a standard account password or placeholder.");
        }
        return { ready: false, error: error.message };
    }
};

// Initial verification check on server start
verifyEmailService();

const sendLeadEmails = async ({
    name,
    mobileNumber,
    email,
    company,
    requirement,
}) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP credentials not found in .env. Skipping email dispatch.");
        return { adminSent: false, clientSent: false, reason: "Missing SMTP credentials" };
    }

    const fromAddress = `"Lead Management" <${process.env.SMTP_USER}>`;

    // 1. Notification email to admin
    const adminMailOptions = {
        from: fromAddress,
        to: process.env.SMTP_USER,
        subject: `🔔 New Lead Received - ${name}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 0;">New Lead Received</h2>
                <p>A new lead has been submitted through the Lead Management portal:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #555;">Name:</td>
                        <td style="padding: 8px 0; color: #111;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #555;">Mobile:</td>
                        <td style="padding: 8px 0;"><a href="tel:${mobileNumber}" style="color: #2563eb;">${mobileNumber}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                        <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td>
                        <td style="padding: 8px 0; color: #111;">${company || "Not provided"}</td>
                    </tr>
                </table>
                <h3 style="margin-top: 24px; color: #1e293b; margin-bottom: 8px;">Requirement</h3>
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px;">
                    <p style="margin: 0; white-space: pre-wrap; color: #334155;">${requirement}</p>
                </div>
            </div>
        `,
    };

    // 2. Confirmation email to client
    const clientMailOptions = {
        from: fromAddress,
        to: email,
        subject: `Thank you for contacting us, ${name}!`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
                <h2 style="color: #2563eb; margin-top: 0;">Thank you, ${name}!</h2>
                <p>We have successfully received your inquiry. Our team will review your requirement and reach out to you shortly.</p>
                
                <h3 style="margin-top: 20px; color: #1e293b; margin-bottom: 8px;">Summary of Your Submission:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; width: 140px; color: #555;">Company:</td>
                        <td style="padding: 6px 0; color: #111;">${company || "Not provided"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: #555;">Requirement:</td>
                        <td style="padding: 6px 0; color: #111;">${requirement}</td>
                    </tr>
                </table>

                <p style="margin-top: 24px; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                    If you have any questions or additional details to share, you can reply directly to this email.
                </p>
            </div>
        `,
    };

    // Send both emails safely in parallel
    const [adminResult, clientResult] = await Promise.allSettled([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(clientMailOptions),
    ]);

    const adminSent = adminResult.status === "fulfilled";
    const clientSent = clientResult.status === "fulfilled";

    if (adminSent) {
        console.log("✅ Admin notification email sent successfully:", adminResult.value.messageId);
    } else {
        console.error("❌ Admin notification email failed:", adminResult.reason?.message || adminResult.reason);
    }

    if (clientSent) {
        console.log("✅ Client confirmation email sent successfully:", clientResult.value.messageId);
    } else {
        console.error("❌ Client confirmation email failed:", clientResult.reason?.message || clientResult.reason);
    }

    return {
        adminSent,
        clientSent,
        adminError: !adminSent ? adminResult.reason?.message : null,
        clientError: !clientSent ? clientResult.reason?.message : null,
    };
};

module.exports = {
    transporter,
    verifyEmailService,
    sendLeadEmails,
};