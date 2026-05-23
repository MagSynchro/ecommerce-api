import { Link, Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <header style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
        <h1>E-Commerce Frontend</h1>

        <nav style={{ display: "flex", gap: "10px" }}>
          <Link to="/">Products</Link>
          <Link to="/cart">Cart</Link>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;