import { createContext, useContext, useState, useEffect, useRef } from "react";
import { loginUser } from "../api/auth";
import { getCart, clearCart } from "../api/localCart";
import request from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Tracks previous auth state to detect login transitions
    const prevUserRef = useRef(null);

    // Prevents duplicate merge calls (React StrictMode safety)
    const mergeInProgress = useRef(false);

    // ----------------------------------------------------
    // INITIAL SESSION RESTORE (/users/me on page load)
    // ----------------------------------------------------
    useEffect(() => {
        const initAuth = async () => {
            try {
                const data = await request("/users/me");
                setUser(data); // expected: { id, email }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // ----------------------------------------------------
    // DETECT AUTH STATE CHANGES (LOGIN TRANSITION DETECTOR)
    // ----------------------------------------------------
    useEffect(() => {
        const prevUser = prevUserRef.current;
        const currentUser = user;

        // Convert to boolean states
        const wasLoggedIn = !!prevUser;
        const isLoggedIn = !!currentUser;

        // TRUE only on fresh login transition
        const justLoggedIn = !wasLoggedIn && isLoggedIn;

        // Trigger cart merge ONLY on login transition
        if (justLoggedIn && !mergeInProgress.current) {
            mergeInProgress.current = true;
            console.log("Login detected - merging cart...");
            mergeCart()
                .catch((err) => {
                    console.error("Cart merge failed:", err);
                })
                .finally(() => {
                    mergeInProgress.current = false;
                });
        }

        // Update previous state tracker
        prevUserRef.current = currentUser;
    }, [user]);

    // ----------------------------------------------------
    // CART MERGE LOGIC (LOCAL STORAGE → DB CART)
    // ----------------------------------------------------
    const mergeCart = async () => {
        const localCart = getCart();

        // Nothing to merge
        if (!localCart.length) return;
        
        // Fetch DB cart    
        const dbCart = await request("/cart");

        // Map keyed by PRODUCT ID
        const map = new Map();

        // ------------------------------------------------
        // Step 1: Load DB cart into map
        // ------------------------------------------------
        dbCart.forEach(item => {
            map.set(item.product_id, {
                product_id: item.product_id,
                quantity: item.quantity
            });
        });

        // ------------------------------------------------
        // Step 2: Merge local cart into map
        // ------------------------------------------------
        localCart.forEach(item => {

            // localStorage cart uses item.id as product id
            const existing = map.get(item.id);

            if (existing) {
                existing.quantity += item.quantity;
            } else {
                map.set(item.id, {
                    product_id: item.id,
                    quantity: item.quantity
                });
            }
        });

        // ------------------------------------------------
        // Step 3: Sync merged cart to backend
        // ------------------------------------------------
        for (const item of map.values()) {
            await request("/cart", {
                method: "POST",
                body: item
            });
        }

        // ------------------------------------------------
        // Step 4: Clear local cart AFTER successful merge
        // ------------------------------------------------
        clearCart();
    };

    // ----------------------------------------------------
    // LOGIN
    // ----------------------------------------------------
    const login = async (credentials) => {
        const data = await loginUser(credentials);
        setUser(data.user); // normalize user shape
        return data;
    };

    // ----------------------------------------------------
    // REFRESH USER (session restore helper)
    // ----------------------------------------------------
    const refreshUser = async () => {
        try {
            const data = await request("/users/me");
            setUser(data);
        } catch {
            setUser(null);
        }
    };

    // ----------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------
    const logout = async () => {
        try {
            await request("/users/logout", { method: "POST" });
        } finally {
            setUser(null);
        }
    };

    // ----------------------------------------------------
    // CONTEXT VALUE
    // ----------------------------------------------------
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