import { Navigate } from "react-router-dom";
import { getAdminToken, getAdminUser } from "../services/adminStorage";

export default function AdminRoute({ children }) {
  const token = getAdminToken();
  const user = getAdminUser();
  if (!token || user?.role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}

