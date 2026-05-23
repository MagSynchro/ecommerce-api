const CART_KEY = "cart";

export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

export function getCartItemCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  return cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

export function addToCart(product) {
  const cart = getCart();

  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}