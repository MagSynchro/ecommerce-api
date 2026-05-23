import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { getCartItemCount } from "../api/localCart";
import { useAuth } from "../context/AuthContext";

function Layout() {
  const [cartCount, setCartCount] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const updateCart = () => {
      setCartCount(getCartItemCount());
    };

    updateCart();

    const interval = setInterval(updateCart, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <header style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
        <h1>E-Commerce Frontend</h1>

        <nav style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link to="/">Products</Link>
          <Link to="/cart">Cart ({cartCount})</Link>

          {isAuthenticated ? (
            <>
              <span>{user?.email}</span>
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