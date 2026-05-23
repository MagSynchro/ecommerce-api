import request from "./client";

export async function loginUser(credentials) {
  return request("/users/login", {
    method: "POST",
    body: credentials,
  });
}

export async function registerUser(userData) {
  return request("/users/register", {
    method: "POST",
    body: userData,
  });
}