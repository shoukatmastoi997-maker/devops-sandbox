import adminApi from "./adminApi";
import { clearAdminToken, clearAdminUser, setAdminToken, setAdminUser } from "./adminStorage";

export async function adminLogin({ email, password }) {
  const res = await adminApi.post("/admin/login", { email, password });
  setAdminToken(res.data.token);
  setAdminUser(res.data.user);
  return res.data;
}

export function adminLogout() {
  clearAdminToken();
  clearAdminUser();
}

