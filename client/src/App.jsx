import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import { useState } from 'react';

import './App.css';

function App() {
  const [page, setPage] = useState("products");

  return (
    <div>
      <header>
        <button onClick={() => setPage("products")}>Products</button>
        <button onClick={() => setPage("cart")}>Cart</button>
      </header>

      {page === "products" && <ProductsPage />}
      {page === "cart" && <CartPage />}
    </div>
  );
}

export default App;