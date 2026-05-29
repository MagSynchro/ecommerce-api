import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

function LoginPage() {

    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const loginWithDiscord = () => {
  window.location.href = "http://localhost:3000/auth/discord";
};
const loginWithGoogle = () => {
  window.location.href = "http://localhost:3000/auth/google";
};
    const location = useLocation();
    const navigate = useNavigate();

    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const data = await login(formData);

            console.log("Login success:", data);

            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || "Login failed");

            setFormData((prev) => ({
                ...prev,
                password: ""
            }));
        }
    };

    return (
        <div>
            <h2>Login</h2>
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

                <button type="submit">
                    Login
                </button>
                <button type="button" onClick={loginWithDiscord}>
                    Login with Discord
                </button>
                <button onClick={loginWithGoogle}>
  Continue with Google
</button>
            </form>
        </div>
    );
}

export default LoginPage;