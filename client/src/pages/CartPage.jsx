import { useEffect, useState } from "react";
import "../styles/cart.css";

const CART_KEY = "cart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function CartPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

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
          <p>Quantity: {item.quantity}</p>
          <p>Subtotal: ${item.price * item.quantity}</p>
        </div>
      ))}

      <hr />

      <h3>Total: ${total.toFixed(2)}</h3>
    </div>
  );
}

export default CartPage;