import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import request from "../api/client";

const CartContext = createContext();

const CART_KEY = "cart";

function getStoredCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadCart = async () => {
      // Logged in users use DB cart
      if (isAuthenticated) {
        try {
          const data = await request("/cart");
          setCart(data);
        } catch (err) {
          console.error("Failed to load DB cart:", err);
        }
      } else {
        // Guests use local cart
        setCart(getStoredCart());
      }
    };

    loadCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      saveCart(cart);
    }
  }, [cart, isAuthenticated]);

  useEffect(() => {
    console.log("LOCAL CART:", cart);
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    const normalizedProduct = {
      ...product,
      price: Number(product.price),
    };

    setCart((prev) => {
      const existing = prev.find(
        (i) => (i.product_id || i.id) === product.id
      );

      if (existing) {
        return prev.map((i) =>
          (i.product_id || i.id) === product.id
            ? {
              ...i,
              quantity: i.quantity + quantity,
            }
            : i
        );
      }

      return [
        ...prev,
        {
          ...normalizedProduct,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (id, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          (item.product_id || item.id) !== id
      )
    );
  };

  const value = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}