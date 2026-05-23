import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import { useCart } from "../context/CartContext";

import "../styles/products.css";

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [cartMessage, setCartMessage] = useState("");
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { addToCart } = useCart();

    useEffect(() => {
        getProducts()
            .then(setProducts)
            .catch(setError);
    }, []);

    const handleAddToCart = (product) => {
        addToCart(product);

        setCartMessage(`${product.name} added to cart`);

        setTimeout(() => setCartMessage(""), 1500);
    };

    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="products-page">
            <h2>Products</h2>

            {cartMessage && (
                <div
                    className="cart-toast"
                    style={{
                        left: mousePos.x + 12,
                        top: mousePos.y + 12
                    }}
                >
                    {cartMessage}
                </div>
            )}

            <div className="products-grid">
                {products.map((p) => (
                    <div key={p.id} className="product-card">
                        <h3>{p.name}</h3>
                        <p className="price">${p.price}</p>
                        <p className="description">{p.description}</p>

                        <button
                            onClick={(e) => {
                                setMousePos({ x: e.clientX, y: e.clientY });
                                handleAddToCart(p);
                            }}
                        >
                            Add to Cart
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProductsPage;