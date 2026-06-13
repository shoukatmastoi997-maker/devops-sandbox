import api from "./api";
import { clearToken, clearUser, setToken, setUser } from "./storage";

export async function signup({ name, email, password }) {
  const res = await api.post("/signup", { name, email, password });
  setToken(res.data.token);
  setUser(res.data.user);
  return res.data;
}

export async function login({ email, password }) {
  const res = await api.post("/login", { email, password });
  setToken(res.data.token);
  setUser(res.data.user);
  return res.data;
}

export function logout() {
  clearToken();
  clearUser();
}

