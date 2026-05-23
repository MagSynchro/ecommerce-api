import './App.css';
import { Routes, Route, Link } from 'react-router-dom';

import Layout from './components/Layout';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProductsPage />} />
        <Route path="cart" element={<CartPage />} />
      </Route>
    </Routes>
  );
}

export default App;