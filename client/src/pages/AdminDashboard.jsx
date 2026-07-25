import { useEffect, useState } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  getAllOrdersAdmin,
  updateOrderStatus,
  refundOrder,
} from "../api/admin";

const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ProductsSection />
      <hr style={{ margin: "30px 0" }} />
      <OrdersSection />
    </div>
  );
}

function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", price: "", description: "" });
  const [edits, setEdits] = useState({});

  const loadProducts = () => {
    getAllProductsAdmin()
      .then(setProducts)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createProduct({
        name: form.name,
        price: Number(form.price),
        description: form.description,
      });
      setForm({ name: "", price: "", description: "" });
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const editField = (id, field) =>
    edits[id]?.[field] !== undefined ? edits[id][field] : products.find((p) => p.id === id)?.[field];

  const setEditField = (id, field, value) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (id) => {
    setError("");
    try {
      await updateProduct(id, {
        name: editField(id, "name"),
        price: Number(editField(id, "price")),
        description: editField(id, "description"),
      });
      setEdits((prev) => ({ ...prev, [id]: undefined }));
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (product) => {
    setError("");
    try {
      if (product.is_active) {
        await deleteProduct(product.id);
      } else {
        await updateProduct(product.id, { is_active: true });
      }
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h2>Products</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Price"
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit">Create Product</button>
      </form>

      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.5 }}>
              <td>{p.id}</td>
              <td>
                <input
                  value={editField(p.id, "name") ?? ""}
                  onChange={(e) => setEditField(p.id, "name", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={editField(p.id, "price") ?? ""}
                  onChange={(e) => setEditField(p.id, "price", e.target.value)}
                />
              </td>
              <td>
                <input
                  value={editField(p.id, "description") ?? ""}
                  onChange={(e) => setEditField(p.id, "description", e.target.value)}
                />
              </td>
              <td>{p.is_active ? "Active" : "Inactive"}</td>
              <td style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => handleSave(p.id)}>Save</button>
                <button onClick={() => handleToggleActive(p)}>
                  {p.is_active ? "Deactivate" : "Reactivate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [statusDraft, setStatusDraft] = useState({});
  const [refundDraft, setRefundDraft] = useState({});

  const loadOrders = () => {
    getAllOrdersAdmin()
      .then(setOrders)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (id) => {
    setError("");
    try {
      await updateOrderStatus(id, statusDraft[id]);
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefund = async (id) => {
    setError("");
    try {
      const amount = refundDraft[id] ? Number(refundDraft[id]) : undefined;
      await refundOrder(id, amount);
      setRefundDraft((prev) => ({ ...prev, [id]: "" }));
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h2>Orders</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Date</th>
            <th>Total</th>
            <th>Refunded</th>
            <th>Status</th>
            <th>Update Status</th>
            <th>Refund</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.email}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td>${Number(o.total).toFixed(2)}</td>
              <td>${Number(o.refunded_amount).toFixed(2)}</td>
              <td>{o.status}</td>
              <td>
                <select
                  value={statusDraft[o.id] ?? o.status}
                  onChange={(e) =>
                    setStatusDraft((prev) => ({ ...prev, [o.id]: e.target.value }))
                  }
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button onClick={() => handleStatusUpdate(o.id)}>Update</button>
              </td>
              <td style={{ display: "flex", gap: "6px" }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Full amount"
                  style={{ width: "90px" }}
                  value={refundDraft[o.id] ?? ""}
                  onChange={(e) =>
                    setRefundDraft((prev) => ({ ...prev, [o.id]: e.target.value }))
                  }
                />
                <button onClick={() => handleRefund(o.id)}>Refund</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default AdminDashboard;
