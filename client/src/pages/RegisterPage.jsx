import { useState } from "react";
import { registerUser } from "../api/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmTouched, setConfirmTouched] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const from = location.state?.from?.pathname || "/";

    const { refreshUser } = useAuth();

    const passwordMismatch =
        confirmTouched &&
        formData.confirmPassword.length > 0 &&
        formData.password !== formData.confirmPassword;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwordMismatch) {
            setError("Please ensure passwords match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await registerUser({
                email: formData.email,
                password: formData.password,
            });

            console.log("Registration success:", data);
            await refreshUser();
            navigate("/", { replace: true });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Create Account</h2>

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                            handleChange(e);
                            setConfirmTouched(true);
                        }}
                    />

                    {passwordMismatch && (
                        <p style={{ color: "red" }}>
                            Passwords do not match
                        </p>
                    )}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                </button>
            </form>
        </div>
    );
}

export default RegisterPage;