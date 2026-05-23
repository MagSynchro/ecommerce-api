import { useState } from "react";
import { registerUser } from "../api/auth";

function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = await registerUser(formData);

            console.log("Registration success:", data);
        } catch (err) {
            console.error("Registration failed:", err.message);
        }
    };

    return (
        <div>
            <h2>Create Account</h2>

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
                        onChange={handleChange}
                    />
                </div>

                <button type="submit">
                    Create Account
                </button>
            </form>
        </div>
    );
}

export default RegisterPage;