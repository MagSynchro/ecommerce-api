import { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../api/auth";
import request from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // -----------------------------------------
    // INITIAL SESSION RESTORE
    // -----------------------------------------
    useEffect(() => {
        const initAuth = async () => {
            try {
                const data = await request("/users/me");
                setUser(data);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // -----------------------------------------
    // LOGIN
    // -----------------------------------------
    const login = async (credentials) => {
        const data = await loginUser(credentials);
        setUser(data.user);
        return data;
    };

    // -----------------------------------------
    // REFRESH USER
    // -----------------------------------------
    const refreshUser = async () => {
        try {
            const data = await request("/users/me");
            setUser(data);
        } catch {
            setUser(null);
        }
    };

    // -----------------------------------------
    // LOGOUT
    // -----------------------------------------
    const logout = async () => {
        try {
            await request("/users/logout", { method: "POST" });
        } finally {
            setUser(null);            
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            login,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}