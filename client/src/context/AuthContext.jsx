import { createContext, useContext, useState, useEffect, useRef } from "react";
import { loginUser } from "../api/auth";
import request from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const prevUserRef = useRef(null);

    // -----------------------------
    // INITIAL SESSION RESTORE
    // -----------------------------
    useEffect(() => {
        const initAuth = async () => {
            try {
                const data = await request("/users/me");
                setUser(data); // ALWAYS { id, email }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    useEffect(() => {
    const prevUser = prevUserRef.current;
    const currentUser = user;

    const wasLoggedOut = !prevUser;
    const isLoggedIn = !!currentUser;

    if (wasLoggedOut && isLoggedIn) {
        console.log("Cart merge trigger (login detected)");
        // mergeCart() will go here later
    }

    prevUserRef.current = currentUser;
}, [user]);

    // -----------------------------
    // LOGIN
    // -----------------------------
    const login = async (credentials) => {
        const data = await loginUser(credentials);
        setUser(data.user); // normalize shape
        return data;
    };

    // -----------------------------
    // REFRESH USER (source of truth)
    // -----------------------------
    const refreshUser = async () => {
        try {
            const data = await request("/users/me");
            setUser(data); // ALWAYS flat user object
        } catch {
            setUser(null);
        }
    };

    // -----------------------------
    // LOGOUT
    // -----------------------------
    const logout = async () => {
        try {
            await request("/users/logout", { method: "POST" });
        } finally {
            setUser(null);
        }
    };

    // -----------------------------
    // CONTEXT VALUE
    // -----------------------------
    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,        
        logout,
        refreshUser,
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