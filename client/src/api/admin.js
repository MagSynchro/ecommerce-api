import request from "./client";

export function createProduct(data) {
  return request("/products", {
    method: "POST",
    body: data,
  });
}

export function updateProduct(id, data) {
  return request(`/products/${id}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, {
    method: "DELETE",
  });
}

export function getAllProductsAdmin() {
  return request("/products?includeInactive=true");
}

export function getAllOrdersAdmin() {
  return request("/orders?all=true");
}

export function updateOrderStatus(id, status) {
  return request(`/orders/${id}/status`, {
    method: "PUT",
    body: { status },
  });
}

export function refundOrder(id, amount) {
  return request(`/orders/${id}/refund`, {
    method: "POST",
    body: amount ? { amount } : {},
  });
}
