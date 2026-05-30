import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import request from "../api/client";

const CartContext = createContext();
const CART_KEY = "cart";

/* ---------------------------------------
   LOCAL STORAGE HELPERS (GUEST ONLY)
--------------------------------------- */
function getStoredCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clearStoredCart() {
  localStorage.removeItem(CART_KEY);
}

/* ---------------------------------------
   NORMALIZE DB CART
--------------------------------------- */
function normalizeDbCart(data) {
  return data.map(item => ({
    id: item.cart_item_id,
    product_id: item.product_id,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity
  }));
}

/* ---------------------------------------
   CONTEXT
--------------------------------------- */
export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState([]);
  const [mode, setMode] = useState("GUEST");

  // prevents double-sync in React Strict Mode
  const syncLock = useRef(false);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

 /* ---------------------------------------
   LOAD CART WHEN AUTH CHANGES
--------------------------------------- */
useEffect(() => {
  const loadCart = async () => {
    // -----------------------------
    // GUEST MODE
    // -----------------------------
    if (!isAuthenticated) {
      setMode("GUEST");
      setCart(getStoredCart());
      syncLock.current = false; // reset for next login cycle
      return;
    }

    // -----------------------------
    // AUTH MODE → RUN SYNC ONCE
    // -----------------------------
    if (syncLock.current) return;
    syncLock.current = true;

    const guestSnapshot = getStoredCart(); // 🔥 FREEZE ONCE (CRITICAL)

    console.log("🟡 Guest snapshot at login:", guestSnapshot);

    try {
      setMode("SYNCING");

      // -----------------------------
      // Send frozen snapshot ONLY
      // -----------------------------
      await request("/cart/sync", {
        method: "POST",
        body: {
          items: guestSnapshot
        }
      });

      // -----------------------------
      // Clear guest cart AFTER sync
      // -----------------------------
      clearStoredCart();

      // -----------------------------
      // Reload authoritative DB cart
      // -----------------------------
      const dbCart = await request("/cart");
      const normalized = normalizeDbCart(dbCart);

      setCart(normalized);

      console.log("🟢 Sync complete. Final DB cart:", normalized);

      setMode("AUTH");
    } catch (err) {
      console.error("Cart sync failed:", err);
      setMode("AUTH");
    }
  };

  loadCart();
}, [isAuthenticated]);

  /* ---------------------------------------
     SAVE GUEST CART ONLY
  --------------------------------------- */
  useEffect(() => {
    if (mode === "GUEST") {
      saveCart(cart);
    }
  }, [cart, mode]);

  /* ---------------------------------------
     CART ACTIONS
  --------------------------------------- */

  const addToCart = async (product, quantity = 1) => {
    if (mode === "AUTH") {
      await request("/cart", {
        method: "POST",
        body: {
          product_id: product.id,
          quantity
        }
      });

      const data = await request("/cart");
      setCart(normalizeDbCart(data));
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);

      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity
        }
      ];
    });
  };

  const updateQuantity = async (id, quantity) => {
    if (!id) return;

    if (mode === "AUTH") {
      await request(`/cart/${id}`, {
        method: "PUT",
        body: { quantity }
      });

      const data = await request("/cart");
      setCart(normalizeDbCart(data));
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = async (id) => {
    if (!id) return;

    if (mode === "AUTH") {
      await request(`/cart/${id}`, {
        method: "DELETE"
      });

      const data = await request("/cart");
      setCart(normalizeDbCart(data));
      return;
    }

    setCart(prev => prev.filter(item => item.id !== id));
  };



const refreshCart = async () => { 

  try {
    if (!isAuthenticated) {
      setCart(getStoredCart());
      return;
    }

    const dbCart = await request("/cart");

    setCart(normalizeDbCart(dbCart));
  } catch (err) {
    console.error("Failed to refresh cart:", err);
  }
};

  /* ---------------------------------------
     LOGOUT RESET
  --------------------------------------- */
  const resetCart = () => {
    setCart([]);
    clearStoredCart();
    setMode("GUEST");
    syncLock.current = false;
  };

  /* ---------------------------------------
     PROVIDER
  --------------------------------------- */
  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        mode,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        resetCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}