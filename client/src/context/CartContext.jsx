import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    setCart(getStoredCart());
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
  const normalizedProduct = {
    ...product,
    price: Number(product.price),
  };

  setCart((prev) => {
    const existing = prev.find((i) => i.id === product.id);

    if (existing) {
      return prev.map((i) =>
        i.id === product.id
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
    setCart((prev) => prev.filter((item) => item.id !== id));
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