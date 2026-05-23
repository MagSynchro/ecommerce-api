const BASE_URL = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // important later for auth sessions
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let errorMessage = "API request failed";

    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(errorMessage);
  }

  return res.json();
}

export default request;