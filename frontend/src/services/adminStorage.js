export function getAdminToken() {
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token) {
  localStorage.setItem("admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}

export function getAdminUser() {
  const raw = localStorage.getItem("admin_user");
  return raw ? JSON.parse(raw) : null;
}

export function setAdminUser(user) {
  localStorage.setItem("admin_user", JSON.stringify(user));
}

export function clearAdminUser() {
  localStorage.removeItem("admin_user");
}

