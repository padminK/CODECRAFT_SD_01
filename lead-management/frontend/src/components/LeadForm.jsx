import { useState } from "react";

function LeadForm() {
    const [formData, setFormData] = useState({
        name: "",
        mobileNumber: "",
        email: "",
        company: "",
        requirement: "",
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Client-side validation helper
    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Name is required.";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters.";
        }

        // Mobile Number validation (10 digits, optional country code)
        const mobileRegex = /^(\+?\d{1,4}[- ]?)?\d{10}$/;
        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = "Mobile number is required.";
        } else if (!mobileRegex.test(formData.mobileNumber.trim())) {
            newErrors.mobileNumber = "Please enter a valid 10-digit mobile number.";
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email address is required.";
        } else if (!emailRegex.test(formData.email.trim())) {
            newErrors.email = "Please enter a valid email address.";
        }

        // Requirement validation
        if (!formData.requirement.trim()) {
            newErrors.requirement = "Requirement is required.";
        } else if (formData.requirement.trim().length < 5) {
            newErrors.requirement = "Requirement must be at least 5 characters.";
        }

        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear field error as user types
        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        // Run client-side validation
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/leads";
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // If backend returned field-specific validation errors
                if (data.errors) {
                    setErrors(data.errors);
                }
                throw new Error(data.message || "Something went wrong while submitting the lead.");
            }

            setIsSuccess(true);
            setMessage("Lead submitted successfully! Check your email for confirmation.");

            // Reset form
            setFormData({
                name: "",
                mobileNumber: "",
                email: "",
                company: "",
                requirement: "",
            });
        } catch (error) {
            setIsSuccess(false);
            if (error.message === "Failed to fetch" || error.name === "TypeError") {
                setMessage("Unable to connect to the backend server. Please make sure the backend is running on http://localhost:5000.");
            } else {
                setMessage(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.heading}>Lead Management</h1>
                <p style={styles.subheading}>Submit your details and our team will get in touch with you shortly.</p>

                <form onSubmit={handleSubmit} noValidate>
                    {/* Name */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Name <span style={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            style={{
                                ...styles.input,
                                borderColor: errors.name ? "#ef4444" : "#d1d5db",
                            }}
                        />
                        {errors.name && <span style={styles.errorText}>{errors.name}</span>}
                    </div>

                    {/* Mobile Number */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Mobile Number <span style={styles.required}>*</span>
                        </label>
                        <input
                            type="tel"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            placeholder="e.g. 9876543210"
                            style={{
                                ...styles.input,
                                borderColor: errors.mobileNumber ? "#ef4444" : "#d1d5db",
                            }}
                        />
                        {errors.mobileNumber && <span style={styles.errorText}>{errors.mobileNumber}</span>}
                    </div>

                    {/* Email */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Email <span style={styles.required}>*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            style={{
                                ...styles.input,
                                borderColor: errors.email ? "#ef4444" : "#d1d5db",
                            }}
                        />
                        {errors.email && <span style={styles.errorText}>{errors.email}</span>}
                    </div>

                    {/* Company (Optional) */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Company (Optional)</label>
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="Company or Organization"
                            style={styles.input}
                        />
                    </div>

                    {/* Requirement */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Requirement <span style={styles.required}>*</span>
                        </label>
                        <textarea
                            name="requirement"
                            rows={4}
                            value={formData.requirement}
                            onChange={handleChange}
                            placeholder="Describe your requirement in detail..."
                            style={{
                                ...styles.textarea,
                                borderColor: errors.requirement ? "#ef4444" : "#d1d5db",
                            }}
                        />
                        {errors.requirement && <span style={styles.errorText}>{errors.requirement}</span>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Submitting Lead..." : "Submit Lead"}
                    </button>

                    {/* Feedback Message */}
                    {message && (
                        <div
                            style={{
                                ...styles.alert,
                                backgroundColor: isSuccess ? "#f0fdf4" : "#fef2f2",
                                color: isSuccess ? "#15803d" : "#b91c1c",
                                borderColor: isSuccess ? "#bbf7d0" : "#fecaca",
                            }}
                        >
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    card: {
        width: "100%",
        maxWidth: "520px",
        padding: "32px",
        borderRadius: "12px",
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
    },
    heading: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#111827",
        margin: "0 0 6px 0",
        textAlign: "center",
    },
    subheading: {
        fontSize: "14px",
        color: "#6b7280",
        margin: "0 0 24px 0",
        textAlign: "center",
    },
    formGroup: {
        marginBottom: "18px",
        display: "flex",
        flexDirection: "column",
    },
    label: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#374151",
        marginBottom: "6px",
    },
    required: {
        color: "#ef4444",
    },
    input: {
        padding: "10px 14px",
        fontSize: "14px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        color: "#1f2937",
        backgroundColor: "#f9fafb",
    },
    textarea: {
        padding: "10px 14px",
        fontSize: "14px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        color: "#1f2937",
        backgroundColor: "#f9fafb",
        resize: "vertical",
    },
    errorText: {
        fontSize: "12px",
        color: "#ef4444",
        marginTop: "4px",
        fontWeight: "500",
    },
    button: {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        fontWeight: "600",
        color: "#ffffff",
        backgroundColor: "#2563eb",
        border: "none",
        borderRadius: "8px",
        transition: "background-color 0.2s",
        marginTop: "8px",
    },
    alert: {
        marginTop: "18px",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        border: "1px solid",
        textAlign: "center",
    },
};

export default LeadForm;