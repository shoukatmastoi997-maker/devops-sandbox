import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "./Button";
import { getUser } from "../services/storage";
import { logout } from "../services/auth";

export default function Navbar() {
  const user = getUser();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white font-bold">H</div>
          <div>
            <p className="text-sm font-semibold leading-4">HotelAI</p>
            <p className="text-xs text-slate-500 leading-4">Reservation System</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-indigo-700" : "text-slate-700 hover:text-slate-900"}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/questionnaire"
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-indigo-700" : "text-slate-700 hover:text-slate-900"}`
                }
              >
                AI Recommend
              </NavLink>
              <NavLink
                to="/assistant"
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-indigo-700" : "text-slate-700 hover:text-slate-900"}`
                }
              >
                AI Assistant
              </NavLink>
              <NavLink
                to="/rooms"
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-indigo-700" : "text-slate-700 hover:text-slate-900"}`
                }
              >
                Rooms
              </NavLink>
              <div className="hidden sm:block text-sm text-slate-600">Hi, {user.name}</div>
              <Button className="bg-slate-900 hover:bg-slate-950" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-indigo-700" : "text-slate-700 hover:text-slate-900"}`
                }
              >
                Login
              </NavLink>
              <Button onClick={() => navigate("/signup")}>Create account</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
