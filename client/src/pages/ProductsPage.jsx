import { useEffect, useState } from "react";
import { getProducts } from "../api/products";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(setError);
  }, []);

  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Products Test</h2>

      {products.map((p) => (
        <div key={p.id}>
          {p.name} - ${p.price}
        </div>
      ))}
    </div>
  );
}

export default ProductsPage;