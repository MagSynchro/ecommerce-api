import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { getCartItemCount } from "../api/localCart";

function Layout() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCart = () => {
      setCartCount(getCartItemCount());
    };

    updateCart(); // initial load

    const interval = setInterval(updateCart, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <header style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
        <h1>E-Commerce Frontend</h1>

        <nav style={{ display: "flex", gap: "10px" }}>
          <Link to="/">Products</Link>
          <Link to="/cart">Cart ({cartCount})</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;