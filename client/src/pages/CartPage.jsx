import { useCart } from "../context/CartContext";

function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();

  const total = cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * item.quantity;
  }, 0);

  const handleDecrease = (item) => {
    if (item.quantity === 1) {
      const confirmRemove = window.confirm(
        "Quantity is 1. Remove item from cart?"
      );

      if (confirmRemove) {
        removeFromCart(item.id);
      }
      return;
    }

    updateQuantity(item.id, item.quantity - 1);
  };

  const handleIncrease = (item) => {
    updateQuantity(item.id, item.quantity + 1);
  };

  if (cart.length === 0) {
    return <h2>Your cart is empty</h2>;
  }

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <h3>{item.name}</h3>

          <p>Price: ${Number(item.price || 0).toFixed(2)}</p>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={() => handleDecrease(item)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => handleIncrease(item)}>+</button>
          </div>

          <p>
            Subtotal: ${(Number(item.price || 0) * item.quantity).toFixed(2)}
          </p>

          <button onClick={() => removeFromCart(item.id)}>
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