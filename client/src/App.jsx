import './App.css';
import { Routes, Route, Link } from 'react-router-dom';

import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';

function App() {
  return (
    <div>
      <header>
        <h1>E-Commerce Frontend</h1>
        <nav>
          <Link to="/">Products</Link>
          {' | '}
          <Link to="/cart">Cart</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </div>
  );
}

export default App;