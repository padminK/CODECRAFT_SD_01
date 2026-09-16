// Validation middleware for Lead submission
const validateLead = (req, res, next) => {
    const { name, mobileNumber, email, company, requirement } = req.body;
    const errors = {};

    // 1. Name validation
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 30) {
        errors.name = "Name is required and must be at least 2 characters and less than 30 characters.";
    }

    // 2. Mobile number validation (standard 10-digit number or with optional country code)
    const mobileRegex = /^(\+?\d{1,4}[- ]?)?\d{10}$/;
    if (!mobileNumber || typeof mobileNumber !== "string" || !mobileRegex.test(mobileNumber.trim())) {
        errors.mobileNumber = "Please enter a valid 10-digit mobile number.";
    }

    // 3. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
        errors.email = "Please enter a valid email address.";
    }

    // 4. Requirement validation
    if (!requirement || typeof requirement !== "string" || requirement.trim().length < 5) {
        errors.requirement = "Requirement is required (at least 5 characters).";
    }

    // If there are validation errors, return 400 Bad Request
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: "Validation failed",
            errors,
        });
    }

    // Sanitize and trim values
    req.body.name = name.trim();
    req.body.mobileNumber = mobileNumber.trim();
    req.body.email = email.trim().toLowerCase();
    req.body.company = company ? company.trim() : "";
    req.body.requirement = requirement.trim();

    next();
};

module.exports = validateLead;
