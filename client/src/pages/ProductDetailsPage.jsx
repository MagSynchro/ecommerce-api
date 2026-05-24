import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProductById } from "../api/products";
import { useCart } from "../context/CartContext";

import "../styles/products.css";

function ProductDetailsPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");

  const { addToCart } = useCart();

  useEffect(() => {
    getProductById(id)
      .then(setProduct)
      .catch(setError);
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);

    setCartMessage(
      `${quantity} ${product.name} added to cart`
    );

    setTimeout(() => {
      setCartMessage("");
    }, 1500);
  };

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  if (!product) {
    return <p>Loading...</p>;
  }

  return (
    <div className="product-details-page">
      {cartMessage && (
        <div className="cart-toast">
          {cartMessage}
        </div>
      )}

      <img
        src={product.image_url}
        alt={product.name}
        className="details-image"
      />

      <div className="details-content">
        <h2>{product.name}</h2>

        <h3>
          ${Number(product.price).toFixed(2)}
        </h3>

        <p>{product.description}</p>

        <div className="quantity-controls">
          <label>
            Quantity:
          </label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(Number(e.target.value))
            }
          />
        </div>

        <button onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductDetailsPage;