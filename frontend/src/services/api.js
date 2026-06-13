import axios from "axios";
import { getToken } from "./storage";
import { clearToken, clearUser } from "./storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Most common reason: JWT_SECRET_KEY changed or user is not logged in.
      clearToken();
      clearUser();
      try {
        if (window.location.pathname !== "/login") window.location.assign("/login");
      } catch {
        /* ignore */
      }
    }
    return Promise.reject(err);
  }
);

export default api;
