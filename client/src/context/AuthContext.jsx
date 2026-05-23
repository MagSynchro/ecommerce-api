import { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../api/auth";
import request from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const data = await request("/users/me");
                setUser(data);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (credentials) => {
        const data = await loginUser(credentials);
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await request("/users/logout", { method: "POST" }).catch(() => { });
        setUser(null);
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}