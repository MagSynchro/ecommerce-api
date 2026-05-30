import { useEffect, useState } from "react";
import request from "../api/client";
import { Link } from "react-router-dom";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await request("/orders");
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="orders-page">
        <h2>Loading Orders...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="orders-page">
        <h2>No Orders Yet</h2>
        <p>You haven't placed any orders.</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>Your Orders</h1>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <h3>Order #{order.id}</h3>

            <p>
              Date: {new Date(order.created_at).toLocaleString()}
            </p>

            <p>
              Status: {order.status || "pending"}
            </p>

            <Link to={`/orders/${order.id}`}>
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderHistory;