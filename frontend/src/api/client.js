/**
 * API client — one place that knows the base URL and attaches the JWT.
 *
 * Every page imports from here instead of calling fetch() directly.
 * This means auth wiring happens once, not per-component.
 */

const API_BASE = "http://localhost:8000";

/**
 * Make an authenticated API call.
 *
 * @param {string} endpoint - e.g. "/applications" or "/auth/login"
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise<any>} - parsed JSON response
 */
export async function api(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach JWT if we have one (skip for login/register)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem("token");
    // Redirect to login if not already there
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  // 204 No Content (DELETE responses)
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  // Throw on non-2xx responses so components can catch errors
  if (!response.ok) {
    const error = new Error(data.detail || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Login helper — sends form-encoded data (OAuth2 spec).
 */
export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);  // OAuth2 spec: email goes in "username"
  formData.append("password", password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Login failed");
  }

  return response.json();
}

/**
 * Register helper — sends JSON.
 */
export async function register(email, password) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Registration failed");
  }

  return response.json();
}
