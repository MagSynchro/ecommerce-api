import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import request from "../api/client";

function OrderDetail() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await request(`/orders/${id}`);

        setOrder(data.order);
        setItems(data.items);
      } catch (err) {
        console.error(err);
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="order-detail">
        <h2>Loading Order...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.price_at_time) * item.quantity,
    0
  );

  return (
    <div className="order-detail">
      <h1>Order #{order.id}</h1>

      <p>
        Date: {new Date(order.created_at).toLocaleString()}
      </p>

      <hr />

      <h2>Items</h2>

      {items.map(item => (
        <div key={item.product_id} className="order-item">
          <h3>{item.name}</h3>

          <p>Quantity: {item.quantity}</p>

          <p>
            Price: ${Number(item.price_at_time).toFixed(2)}
          </p>

          <p>
            Subtotal: $
            {(item.quantity * item.price_at_time).toFixed(2)}
          </p>
        </div>
      ))}

      <hr />

      <h2>Total: ${total.toFixed(2)}</h2>
      <Link to="/order-history">Back to Order History</Link>
    </div>
  );
}

export default OrderDetail;