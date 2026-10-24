import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useLayout } from "../layouts/MainLayout";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { setSidebarOpen } = useLayout();
  const navigate = useNavigate();

  const role = user?.role || localStorage.getItem("role");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const theme =
    role === "mentor"
      ? {
          bg: "bg-emerald-50 border-emerald-200",
          text: "text-emerald-900",
          subtext: "text-emerald-600",
          button: "text-emerald-700 hover:bg-emerald-100 border-emerald-300",
        }
      : {
          bg: "bg-indigo-50 border-indigo-200",
          text: "text-indigo-900",
          subtext: "text-indigo-600",
          button: "text-indigo-700 hover:bg-indigo-100 border-indigo-300",
        };

  return (
    <header
      className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${theme.bg}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border md:hidden ${theme.button}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <FiMenu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className={`truncate text-lg font-semibold ${theme.text}`}>
            Welcome, {user?.full_name || "Guest"}
          </h1>
          {role && (
            <p className={`text-xs capitalize ${theme.subtext}`}>{role}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition ${theme.button}`}
      >
        Logout
      </button>
    </header>
  );
};

export default Navbar;
