import { useEffect, useState } from "react";
import { updateQuantity, removeFromCart } from "../api/localCart";

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function CartPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const refreshCart = () => {
    setCart(getCart());
  };

  const handleIncrease = (item) => {
    updateQuantity(item.id, item.quantity + 1);
    refreshCart();
  };

  const handleDecrease = (item) => {
    updateQuantity(item.id, item.quantity - 1);
    refreshCart();
  };

  const handleRemove = (item) => {
    removeFromCart(item.id);
    refreshCart();
  };

  const total = cart.reduce((sum, item) => {
  return sum + item.price * item.quantity;
}, 0);

  if (cart.length === 0) {
    return <h2>Your cart is empty</h2>;
  }

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <h3>{item.name}</h3>
          <p>Price: ${item.price}</p>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={() => handleDecrease(item)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => handleIncrease(item)}>+</button>
          </div>

          <p>Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>

          <button onClick={() => handleRemove(item)}>
            Remove
          </button>
        </div>
      ))}

      <hr />

      <h3>Total: ${total.toFixed(2)}</h3>
    </div>
  );
}

export default CartPage;