import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import request from "../api/client";

const handleCheckout = async () => {
  try {
    const res = await request("/checkout/create-session", {
      method: "POST"
    });

    window.location.href = res.url;
  } catch (err) {
    console.error("Checkout failed", err);
  }
};

function CheckoutPage() {
  const { cart } = useCart();
  const { user } = useAuth();

  const total = cart.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity;
  }, 0);

  if (cart.length === 0) {
    return <h2>Your cart is empty</h2>;
  }

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      <p>
        Signed in as: <strong>{user?.email}</strong>
      </p>

      <div className="checkout-items">
        {cart.map((item) => (
          <div key={item.id} className="checkout-item">
            <h3>{item.name}</h3>

            <p>
              Quantity: {item.quantity}
            </p>

            <p>
              Subtotal: $
              {(Number(item.price) * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <hr />

      <h3>
        Total: ${total.toFixed(2)}
      </h3>

      <button onClick={handleCheckout}>
        Place Order
      </button>
    </div>
  );
}

export default CheckoutPage;