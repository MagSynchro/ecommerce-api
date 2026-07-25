import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();

  // -----------------------------
  // DERIVE BADGE FROM SINGLE SOURCE OF TRUTH
  // -----------------------------
  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div>
      <header style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
        <h1>E-Commerce Frontend</h1>

        <nav style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link to="/">Products</Link>

          {/* CART BADGE NOW REACTIVE */}
          <Link to="/cart">Cart ({cartCount})</Link>

          {isAuthenticated ? (
            <>
              <span>{user?.email}</span>
              <Link to="/order-history">Order History</Link>
              {user?.role === "admin" && <Link to="/admin">Admin</Link>}
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;