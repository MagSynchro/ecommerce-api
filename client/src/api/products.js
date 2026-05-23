import request from "./client";

export function getProducts() {
  return request("/products");
}

export function getProductById(id) {
  return request(`/products/${id}`);
}