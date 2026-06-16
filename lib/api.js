import { PUBLIC_CONFIG } from "@/lib/config/public";
import { getStoredToken } from "@/lib/session";

export async function fetchApi(endpoint, options = {}) {
  const token = getStoredToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Remove Content-Type if body is FormData (browser will set it automatically with boundary)
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${PUBLIC_CONFIG.apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  return response;
}
