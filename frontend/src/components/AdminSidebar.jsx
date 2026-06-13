import { NavLink, useNavigate } from "react-router-dom";
import { adminLogout } from "../services/adminAuth";
import { getAdminUser } from "../services/adminStorage";
import Button from "./Button";

function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium ${
          isActive ? "bg-indigo-50 text-indigo-800" : "text-slate-700 hover:bg-slate-50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function AdminSidebar() {
  const navigate = useNavigate();
  const admin = getAdminUser();

  function onLogout() {
    adminLogout();
    navigate("/admin/login");
  }

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 lg:w-64">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white font-bold">A</div>
        <div>
          <p className="text-sm font-semibold leading-4">Admin Panel</p>
          <p className="text-xs text-slate-500 leading-4">{admin?.email || "admin"}</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        <Item to="/admin" label="Dashboard" />
        <Item to="/admin/hotels" label="Manage Hotels" />
        <Item to="/admin/rooms" label="Manage Rooms" />
        <Item to="/admin/bookings" label="Manage Bookings" />
      </nav>

      <div className="mt-6">
        <Button className="w-full bg-slate-900 hover:bg-slate-950" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </aside>
  );
}

